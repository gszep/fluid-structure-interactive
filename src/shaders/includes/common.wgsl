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

// Level set of the solid, evaluated through the reference map:
// phi < 0 inside the solid, phi > 0 in the fluid.
fn level_set(xi: vec2<f32>) -> f32 {
    return capsule(reference_coord(xi), params.half_length, params.radius);
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
