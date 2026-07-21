// Shared constants, structs and helpers for the lattice-Boltzmann
// reference map technique (LBRMT) solver.
//
// References:
//   Sun (2020), "A lattice Boltzmann implementation of the reference map technique"
//   Sun & Rycroft (2025), JCP 526 113774, https://github.com/yue-sun/lbrmt
//
// Shaders that include this file must declare:
//   var<uniform> params: Params;
//   var xi_tex: texture_2d<f32>;        // current reference map (X, Y)
//   (WGSL module-scope declarations are order-independent.)

const PI = 3.141592653589793;
const EPS = 1e-6;

// D2Q9 lattice vectors and weights
const C = array<vec2<i32>, 9>(
    vec2<i32>(0, 0),
    vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1),
    vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1),
);
const W = array<f32, 9>(
    4.0 / 9.0,
    1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0,
    1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0,
);

struct Params {
    size: vec2<u32>,           // simulation grid size
    step: u32,                 // global step counter
    substeps: u32,             // steps per rendered frame
    tau: f32,                  // LB relaxation time (viscosity)
    shear_modulus: f32,        // G of the neo-Hookean solid
    bulk_modulus: f32,         // kappa, resists volume change
    epsilon: f32,              // blur-zone half-width (cells)
    center: vec2<f32>,         // shape centre in reference space
    half_length: f32,          // capsule half-length
    radius: f32,               // capsule radius
    muscle_half_length: f32,   // actuated region half-length
    muscle_radius: f32,        // actuated region radius
    actuation_amp: f32,        // log(max stretch) / muscle_radius
    actuation_freq: f32,       // radians per step
    shape: u32,                // 0 = flapper, 1 = one rotor, 2 = 2x2 rotor lattice
    pivot_radius: f32,         // rotor: radius of the anchored pivot region
    spin_angle: f32,           // rotor: half of the maximum spin angle
    spin_freq: f32,            // rotor: angular velocity of the spin drive
    friction: f32,             // Rayleigh friction (momentum sink; the
                               // periodic box has no walls to absorb the
                               // momentum anchored rotors pump into it)
    heal: f32,                 // anchored scenes: relax xi toward the ideal
                               // rigidly-rotated map (analytic substitute
                               // for the paper's extrapolation zone)
    pad0: f32,
    pad1: f32,
};

struct Interaction {
    position: vec2<f32>,       // cursor position (grid cells)
    size: f32,                 // signed radius; 0 = inactive
    grab_active: f32,          // 1 while a grab anchor is held
    velocity: vec2<f32>,       // smoothed cursor velocity (cells / frame)
    grab_ref: vec2<f32>,       // reference-map coords of the grabbed material
};

// Periodic wrap of integer grid coordinates.
fn wrap_i(x: vec2<i32>) -> vec2<i32> {
    let s = vec2<i32>(params.size);
    return (x % s + s) % s;
}

fn xi_at(x: vec2<i32>) -> vec2<f32> {
    return textureLoad(xi_tex, wrap_i(x), 0).xy;
}

// Reference map of a neighbour, unwrapped to be continuous with `ref`
// (on a torus the reference map is multivalued modulo the domain size).
fn xi_near(x: vec2<i32>, anchor: vec2<f32>) -> vec2<f32> {
    let s = vec2<f32>(params.size);
    let v = xi_at(x);
    return v - s * round((v - anchor) / s);
}

// Position in the solid's reference frame (relative to the shape centre).
fn reference_coord(xi: vec2<f32>) -> vec2<f32> {
    let s = vec2<f32>(params.size);
    let d = xi - params.center;
    return d - s * round(d / s);
}

// Signed distance of a capsule (segment of half-length hl, radius r).
fn capsule(p: vec2<f32>, hl: f32, r: f32) -> f32 {
    let qx = abs(p.x) - hl;
    return select(length(vec2<f32>(qx, p.y)), abs(p.y), qx < 0.0) - r;
}

// Signed distance of a seven-pointed star with tips at distance cr
// (obj_seven_point::phi in the lbrmt reference code).
fn seven_star(p: vec2<f32>, cr: f32) -> f32 {
    let fac = 2.0 * PI / 7.0;
    var theta = abs(atan2(p.y, p.x));
    let R = length(p);
    theta = abs(theta - fac * round(theta / fac));
    let X = R * cos(theta) - cr;
    let Y = R * sin(theta);
    let c = cos(0.25 * fac);
    let s = sin(0.25 * fac);
    return select(Y * c + X * s, length(vec2<f32>(X, Y)), X * c - Y * s > 0.0);
}

// 2x2 rotor lattice (JCP paper section 4.2): rotors sit at half-period
// spacing starting from params.center. Returns the offset to the nearest
// rotor centre (xy) and the spin direction of that rotor's row (z):
// the top row turns counter-clockwise, the bottom row clockwise.
fn rotor_lattice(p: vec2<f32>) -> vec3<f32> {
    let pitch = 0.5 * vec2<f32>(params.size);
    let k = round(p / pitch);
    let rel = p - k * pitch;
    let row = ((i32(k.y) % 2) + 2) % 2;
    return vec3<f32>(rel, select(1.0, -1.0, row == 1));
}

// Three-pronged smooth rotor (obj_smooth_rotor::phi in the lbrmt code):
// prongs of length l with end caps of radius r, filleted with radius s.
// Used for the four-rotor contact scene (JCP paper Fig. 9) - the fat prongs
// survive full revolutions where the thin star arms would wind up and shear.
fn smooth_rotor(p: vec2<f32>, l: f32, r: f32, s: f32) -> f32 {
    var X = p.x;
    var Y = abs(p.y);
    // fold the three-fold symmetry into one prong sector
    if (X * -0.8660254 + Y * 0.5 > 0.0) {
        let yy = abs(X * -0.8660254 + Y * -0.5);
        X = X * -0.5 + Y * 0.8660254;
        Y = yy;
    }
    let q = (r + s) * 0.57735027; // (r+s)/sqrt(3)
    if (X > l) { return length(vec2<f32>(X - l, Y)) - r; }
    if (X > q) { return Y - r; }
    return s - length(vec2<f32>(X - q, Y - r - s));
}

fn sdf_shape(p: vec2<f32>) -> f32 {
    if (params.shape == 1u) {
        // dilate by radius: rounds the tips and thickens the wedge arms,
        // which would otherwise erode inside the blur zone
        return seven_star(p, params.half_length) - params.radius;
    }
    if (params.shape == 2u) {
        // muscle_radius doubles as the fillet radius here
        return smooth_rotor(rotor_lattice(p).xy, params.half_length, params.radius, params.muscle_radius);
    }
    return capsule(p, params.half_length, params.radius);
}

// Level set of the solid, evaluated through the reference map:
// phi < 0 inside the solid, phi > 0 in the fluid.
fn level_set(xi: vec2<f32>) -> f32 {
    return sdf_shape(reference_coord(xi));
}

// Level set gated by world position: an *anchored* rotor cannot leave the
// neighbourhood of its pivot, so any apparent solid beyond the gate radius
// is a phantom (wound-up far-field reference map) and is treated as fluid.
// The far-field xi is then purely cosmetic for anchored scenes.
fn level_set_at(xi: vec2<f32>, p: vec2<f32>) -> f32 {
    let phi = level_set(xi);
    if (params.shape == 0u) { return phi; }
    let s = vec2<f32>(params.size);
    var d = p - params.center;
    d -= s * round(d / s);
    if (params.shape == 2u) { d = rotor_lattice(d).xy; }
    let gate = params.half_length + params.radius + 4.0 * params.epsilon;
    return max(phi, length(d) - gate);
}

// Smoothed Heaviside: 1 in the solid, 0 in the fluid,
// blur zone of half-width epsilon (2020 JFM transition function).
fn solid_fraction(phi: f32) -> f32 {
    let e = params.epsilon;
    if (phi >= e) { return 0.0; }
    if (phi <= -e) { return 1.0; }
    let t = phi / e;
    return 0.5 - 0.5 * t - sin(PI * t) / (2.0 * PI);
}

fn clamp_mag(v: vec2<f32>, m: f32) -> vec2<f32> {
    let l = length(v);
    return select(v, v * (m / l), l > m);
}

// Maxwell-Boltzmann equilibrium populations (second-order expansion).
fn equilibrium(rho: f32, v: vec2<f32>) -> array<f32, 9> {
    var feq: array<f32, 9>;
    let usq = dot(v, v);
    for (var i = 0; i < 9; i++) {
        let cu = dot(vec2<f32>(C[i]), v);
        feq[i] = W[i] * rho * (1.0 + 3.0 * cu + 4.5 * cu * cu - 1.5 * usq);
    }
    return feq;
}

// Second-order ENO derivative (Shu 1998), component-wise on vec2.
// For positive advection velocity call with (downwind, centre, upwind, upwind2);
// negate and mirror the arguments for negative velocity.
fn eno2(v0: vec2<f32>, v1: vec2<f32>, v2: vec2<f32>, v3: vec2<f32>) -> vec2<f32> {
    let a = abs(v0 - 2.0 * v1 + v2);
    let b = abs(v1 - 2.0 * v2 + v3);
    let central = 0.5 * (v0 - v2);
    let onesided = 1.5 * v1 - 2.0 * v2 + 0.5 * v3;
    return select(onesided, central, a < b);
}
