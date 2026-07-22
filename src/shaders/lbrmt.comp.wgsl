#import includes::common

// LBRMT compute passes.
//
// Each timestep runs two dispatches over ping-pong textures:
//   1. `advect`  - update the reference map xi with the local fluid velocity
//   2. `collide` - solid stress from xi, then a forced lattice-Boltzmann
//                  update (pull streaming + BGK collision with Guo forcing)
//
// The reference map is advected *everywhere*: it is the backward flow map, so
// the solid region is exactly { x : phi(xi(x)) < 0 }. This replaces the
// layer-by-layer least-squares extrapolation of the original method with an
// embarrassingly parallel scheme.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> interaction: Interaction;
@group(0) @binding(2) var xi_tex: texture_2d<f32>;
@group(0) @binding(3) var f_tex: texture_2d_array<f32>;
@group(0) @binding(4) var xi_out: texture_storage_2d<rg32float, write>;
@group(0) @binding(5) var f_out: texture_storage_2d_array<r32float, write>;

// Populations streamed to node x (pull scheme):
// f_i(x, t+1) = f^post-collision_i(x - c_i, t).
fn pull(x: vec2<i32>) -> array<f32, 9> {
    var f: array<f32, 9>;
    for (var i = 0; i < 9; i++) {
        f[i] = textureLoad(f_tex, wrap_i(x - C[i]), i, 0).r;
    }
    return f;
}

// Zeroth and first moments: (rho, momentum).
fn moments(f: array<f32, 9>) -> vec3<f32> {
    var rho = 0.0;
    var mom = vec2<f32>(0.0);
    for (var i = 0; i < 9; i++) {
        rho += f[i];
        mom += f[i] * vec2<f32>(C[i]);
    }
    return vec3<f32>(rho, mom);
}

// ---------------------------------------------------------------------------
// Pass 1: advect the reference map, d xi/dt + (v . grad) xi = 0.
//
// IMPORTANT: the advection velocity must include the Guo half-force
// correction, v = (sum f_i c_i + F/2) / rho. Advecting with the uncorrected
// velocity couples the force back into the reference map with the wrong sign
// and drives an explosive checkerboard instability (verified in the CPU
// reference tests).
// ---------------------------------------------------------------------------
@compute @workgroup_size(8, 8)
fn advect(@builtin(global_invocation_id) gid: vec3<u32>) {
    if (any(gid.xy >= params.size)) { return; }
    let x = vec2<i32>(gid.xy);

    var force = total_force(x);
    let m = moments(pull(x));
    let rho = max(m.x, EPS);
    // cap the *acceleration*: near-vacuum cells must not be blown apart
    force = clamp_mag(force, 0.2 * min(rho, 1.0));
    var v = (m.yz + 0.5 * force) / rho;
    v = clamp_mag(v, 0.25);

    let c = xi_at(x);
    let r1 = xi_near(x + vec2(1, 0), c);
    let r2 = xi_near(x + vec2(2, 0), c);
    let l1 = xi_near(x - vec2(1, 0), c);
    let l2 = xi_near(x - vec2(2, 0), c);
    let u1 = xi_near(x + vec2(0, 1), c);
    let u2 = xi_near(x + vec2(0, 2), c);
    let d1 = xi_near(x - vec2(0, 1), c);
    let d2 = xi_near(x - vec2(0, 2), c);

    var ddx: vec2<f32>;
    if (v.x > 0.0) { ddx = eno2(r1, c, l1, l2); } else { ddx = -eno2(l1, c, r1, r2); }
    var ddy: vec2<f32>;
    if (v.y > 0.0) { ddy = eno2(u1, c, d1, d2); } else { ddy = -eno2(d1, c, u1, u2); }

    var xi_new = c - (v.x * ddx + v.y * ddy);

    // Outside the solid the reference map is never used for stresses; diffuse
    // it there to keep the field smooth and bounded. Starting right at the
    // blur-zone edge erodes the thin smeared-xi filaments that would
    // otherwise condense into phantom solid fragments in the wake, while the
    // solid interior (phi < 0) is untouched.
    let phi_here = level_set_at(c, vec2<f32>(x));
    // starting inside the outer half of the blur zone (0.5 eps) erodes the
    // interface dither that otherwise inflates swimming bodies; the strong,
    // tight band also wipes the smeared-xi wake debris that free swimmers
    // leave behind (which would otherwise litter the vortex street)
    let w = 0.5 * smoothstep(0.5 * params.epsilon, 2.0 * params.epsilon, phi_here);
    xi_new = mix(xi_new, 0.25 * (r1 + l1 + u1 + d1), w);

    // Anchored scenes: the drive angle is known exactly, so the ideal
    // (rigidly rotated) reference map is available analytically. Relax xi
    // toward it - strongly in the fluid (substituting for the paper's
    // extrapolation zone, curing phantom solids and interface smear) and
    // weakly inside the solid (healing the slow inflation of the body while
    // leaving elastic bending free).
    if (params.shape != 0u && params.heal > 0.0) {
        let s = vec2<f32>(params.size);
        var d = vec2<f32>(x) - params.center;
        d -= s * round(d / s);
        var spin = 1.0;
        if (params.shape == 2u) {
            let rl = rotor_lattice(d);
            d = rl.xy;
            spin = rl.z;
        }
        let theta = spin * params.spin_angle * (1.0 - cos(params.spin_freq * f32(params.step)));
        let ct = cos(theta);
        let st = sin(theta);
        // rotation about this cell's own rotor centre: (x - d) + R(-theta) d
        var ideal = vec2<f32>(x) - d + vec2<f32>(d.x * ct + d.y * st, -d.x * st + d.y * ct);
        ideal -= s * round((ideal - c) / s);
        let lam = solid_fraction(phi_here);
        let hw = params.heal * (0.25 + 0.75 * (1.0 - lam));
        xi_new = mix(xi_new, ideal, hw);
    }

    textureStore(xi_out, x, vec4<f32>(xi_new, 0.0, 0.0));
}

// ---------------------------------------------------------------------------
// Pass 2: solid stress + forced lattice-Boltzmann update.
// ---------------------------------------------------------------------------

// Flapper muscle activation: a wave traveling along the body (+X) pushes
// fluid backward and drives the swimmer forward. The returned value
// multiplies Y in the active stretch exp(con * Y), bending the body locally.
fn contraction(X: f32) -> f32 {
    let s = sin(params.actuation_freq * f32(params.step) - params.wave_number * X);
    return -params.actuation_amp * s;
}

// Neo-Hookean stress at a cell edge, from the Jacobian of the reference map,
// smoothed by the solid fraction. Includes the active muscle deformation.
fn edge_stress(jac: mat2x2<f32>, xi_edge: vec2<f32>, phi_edge: f32) -> mat2x2<f32> {
    let zero = mat2x2<f32>(vec2<f32>(0.0), vec2<f32>(0.0));
    let sf = solid_fraction(phi_edge);
    if (sf <= 0.0) { return zero; }

    let det = determinant(jac);
    if (abs(det) < 1e-3) { return zero; }

    // Deformation gradient F = (d xi / d x)^-1
    var F = mat2x2<f32>(
        vec2<f32>(jac[1][1], -jac[0][1]),
        vec2<f32>(-jac[1][0], jac[0][0]),
    ) * (1.0 / det);

    // Active deformation (capsule flapper only): area-preserving stretch
    // along the body axis, graded across the thickness (X.y) so the body
    // bends. The rotor is driven by an anchor force instead.
    if (params.shape == 0u) {
        let X = reference_coord(xi_edge);
        let muscle = solid_fraction(capsule(X, params.muscle_half_length, params.muscle_radius));
        let fac = clamp(exp(contraction(X.x) * X.y * muscle), 0.5, 2.0);
        F[0] *= fac;
        F[1] *= 1.0 / fac;
    }

    // Compressible neo-Hookean constitutive law (plane strain). The
    // volumetric term (J - 1/J)/2 linearizes like (J - 1) at J = 1 but is
    // much stiffer in compression, resisting the slow "puffing" of
    // vigorously actuated bodies.
    let J = clamp(1.0 / det, 0.1, 10.0);
    let B = F * transpose(F);
    let I = mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0));
    let dev = B - ((B[0][0] + B[1][1] + 1.0) / 3.0) * I;
    let vol = params.bulk_modulus * 0.5 * (J - 1.0 / J);
    return sf * (params.shear_modulus * dev + vol * I);
}

// Divergence of the solid stress at node x, plus the user interaction force.
fn total_force(x: vec2<i32>) -> vec2<f32> {
    // 3x3 neighbourhood of the reference map, unwrapped around the centre
    var xi: array<vec2<f32>, 9>; // index (dx+1) + 3*(dy+1)
    var phi: array<f32, 9>;
    let ctr = xi_at(x);
    for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
            let n = xi_near(x + vec2(dx, dy), ctr);
            xi[(dx + 1) + 3 * (dy + 1)] = n;
            phi[(dx + 1) + 3 * (dy + 1)] = level_set_at(n, vec2<f32>(x + vec2(dx, dy)));
        }
    }
    let dl = 0; let dd = 1; let dr = 2;
    let ll = 3; let cc = 4; let rr = 5;
    let ul = 6; let uu = 7; let ur = 8;

    // Half-edge stresses (second-order finite differences of xi, as in lbrmt)
    let sL = edge_stress(
        mat2x2<f32>(xi[cc] - xi[ll], 0.25 * (xi[uu] + xi[ul] - xi[dd] - xi[dl])),
        0.5 * (xi[cc] + xi[ll]), 0.5 * (phi[cc] + phi[ll]));
    let sR = edge_stress(
        mat2x2<f32>(xi[rr] - xi[cc], 0.25 * (xi[ur] + xi[uu] - xi[dr] - xi[dd])),
        0.5 * (xi[rr] + xi[cc]), 0.5 * (phi[rr] + phi[cc]));
    let sB = edge_stress(
        mat2x2<f32>(0.25 * (xi[rr] + xi[dr] - xi[ll] - xi[dl]), xi[cc] - xi[dd]),
        0.5 * (xi[cc] + xi[dd]), 0.5 * (phi[cc] + phi[dd]));
    let sT = edge_stress(
        mat2x2<f32>(0.25 * (xi[ur] + xi[rr] - xi[ul] - xi[ll]), xi[uu] - xi[cc]),
        0.5 * (xi[uu] + xi[cc]), 0.5 * (phi[uu] + phi[cc]));

    var force = (sR[0] - sL[0]) + (sT[1] - sB[1]);
    force += anchor_force(vec2<f32>(x), xi[cc], phi[cc]);
    force += interaction_force(vec2<f32>(x), xi[cc]);
    return force; // clamped against the local density by the caller
}

// Rotor drive (thesis section 3.3 / JCP paper section 4.2, lbrmt
// obj_seven_point::accel): material in a small pivot region around each
// rotor centre is pulled toward its *rotated* reference position by a
// spring, with the target angle swinging
// theta(t) = spin_angle * (1 - cos(spin_freq * t)). With spin_angle = pi the
// rotor makes a full 2pi revolution in the first half period, then reverses
// for a full revolution back, twisting its arms through the fluid. In the
// 2x2 lattice the top row turns counter-clockwise and the bottom clockwise.
fn anchor_force(p: vec2<f32>, xi_c: vec2<f32>, phi_c: f32) -> vec2<f32> {
    if (params.shape == 0u) { return vec2<f32>(0.0); }
    let s = vec2<f32>(params.size);

    var d = p - params.center;
    d -= s * round(d / s);
    var xrel = d;
    var spin = 1.0;
    if (params.shape == 2u) {
        let here = rotor_lattice(d);
        xrel = here.xy;
        spin = here.z;
    }

    // smooth anchor footprint: full strength inside the pivot, fading over
    // 2 epsilon (a hard cutoff ring concentrates stress and tears material)
    let r = length(xrel);
    let w = 1.0 - smoothstep(params.pivot_radius, params.pivot_radius + 2.0 * params.epsilon, r);
    if (w <= 0.0) { return vec2<f32>(0.0); }

    var Xrel = reference_coord(xi_c);
    if (params.shape == 2u) { Xrel = rotor_lattice(Xrel).xy; }

    let theta = spin * params.spin_angle * (1.0 - cos(params.spin_freq * f32(params.step)));
    let ct = cos(theta);
    let st = sin(theta);
    let rotated = vec2<f32>(Xrel.x * ct - Xrel.y * st, Xrel.x * st + Xrel.y * ct);
    // displacement-capped spring: the drive acts like a motor with slip, so
    // a lagging rotor feels a bounded, gentle torque instead of a runaway
    // pull that cavitates the fluid
    let disp = clamp_mag(xrel - rotated, 4.0);
    return -0.02 * solid_fraction(phi_c) * w * disp;
}

// Cursor forces.
//  - Left click-drag-release on the solid grabs it: material whose reference
//    map lies near the grabbed material point (grab_ref) is pulled toward the
//    cursor by a spring. The anchor lives in reference space, so the grip
//    sticks to the material even as it deforms and translates.
//  - Otherwise: drag injects momentum along the cursor motion, and a press
//    pushes (left) or pulls (right) radially.
fn interaction_force(p: vec2<f32>, xi_c: vec2<f32>) -> vec2<f32> {
    let a = abs(interaction.size);
    if (a < 1.0) { return vec2<f32>(0.0); }
    let s = vec2<f32>(params.size);
    var d = p - interaction.position;
    d -= s * round(d / s);
    let r = length(d);

    let grabbing = interaction.grab_active > 0.5
        && interaction.size > 0.0
        && level_set(interaction.grab_ref) < params.epsilon;

    if (grabbing) {
        // tow the whole body: the grip is body-scale in *reference* space, so
        // the force is nearly uniform over the solid and it moves as a whole
        // (a localized grip would drag one patch through the body and tear
        // it). Deformation while towing comes from the fluid drag.
        var dref = xi_c - interaction.grab_ref;
        dref -= s * round(dref / s);
        let width = params.half_length * params.half_length;
        let grip = exp(-dot(dref, dref) / (2.0 * width));
        return 0.01 * grip * clamp_mag(-d, 2.0);
    }

    if (r >= a) { return vec2<f32>(0.0); }
    let blob = exp(-r * r / a);
    // drag along the cursor velocity
    var force = 0.01 * blob * clamp_mag(interaction.velocity, 5.0);
    // radial push/pull
    if (r > 1e-3) {
        force += (0.02 * sign(interaction.size) * blob / r) * d;
    }
    return force;
}

@compute @workgroup_size(8, 8)
fn collide(@builtin(global_invocation_id) gid: vec3<u32>) {
    if (any(gid.xy >= params.size)) { return; }
    let x = vec2<i32>(gid.xy);

    // Divergence of the solid stress (from the freshly advected xi) + user interaction
    var force = total_force(x);

    // Forced BGK collision (Guo forcing, second order in velocity space)
    let f = pull(x);
    let m = moments(f);
    let rho = max(m.x, EPS);
    force = clamp_mag(force, 0.2 * min(rho, 1.0));
    var v = (m.yz + 0.5 * force) / rho;
    v = clamp_mag(v, 0.25);
    // weak Rayleigh friction: the periodic box has no walls to absorb the
    // momentum that anchored rotors continuously pump into the fluid
    v *= 1.0 - params.friction;

    let feq = equilibrium(rho, v);
    // TRT collision (two relaxation times): even modes relax with 1/tau
    // (setting the viscosity), odd modes with the "magic" combination
    // Lambda = (tau+ - 1/2)(tau- - 1/2) = 1/4. Markedly more stable than BGK
    // at low viscosity and damps the staircase noise that BGK produces
    // around fast-moving interfaces (needed for clean vortex shedding).
    let wp = 1.0 / params.tau;
    let wm = 1.0 / (0.5 + 0.25 / (params.tau - 0.5));
    let fw = 1.0 - 0.5 * wp;

    for (var i = 0; i < 9; i++) {
        let j = OPP[i];
        let fp = 0.5 * (f[i] + f[j]);
        let fm = 0.5 * (f[i] - f[j]);
        let ep = 0.5 * (feq[i] + feq[j]);
        let em = 0.5 * (feq[i] - feq[j]);
        let ci = vec2<f32>(C[i]);
        let Fi = W[i] * (3.0 * dot(ci - v, force) + 9.0 * dot(ci, v) * dot(ci, force));
        let fi = f[i] - wp * (fp - ep) - wm * (fm - em) + fw * Fi;
        textureStore(f_out, x, i, vec4<f32>(fi, 0.0, 0.0, 0.0));
    }
}
