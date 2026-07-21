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
// ---------------------------------------------------------------------------
@compute @workgroup_size(8, 8)
fn advect(@builtin(global_invocation_id) gid: vec3<u32>) {
    if (any(gid.xy >= params.size)) { return; }
    let x = vec2<i32>(gid.xy);

    let m = moments(pull(x));
    let v = m.yz / max(m.x, EPS);

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

    // Far from the solid the reference map is never used for stresses; gently
    // diffuse it there to keep the field smooth and bounded.
    let w = 0.1 * smoothstep(2.0 * params.epsilon, 6.0 * params.epsilon, level_set(c));
    xi_new = mix(xi_new, 0.25 * (r1 + l1 + u1 + d1), w);

    textureStore(xi_out, x, vec4<f32>(xi_new, 0.0, 0.0));
}

// ---------------------------------------------------------------------------
// Pass 2: solid stress + forced lattice-Boltzmann update.
// ---------------------------------------------------------------------------

// Time-periodic muscle contraction: one-sided pulses (power stroke) with
// elastic recovery in between, like the lbrmt jellyfish flapper.
fn contraction() -> f32 {
    let s = sin(params.actuation_freq * f32(params.step));
    let s2 = s * s;
    let s4 = s2 * s2;
    return -params.actuation_amp * s4 * s4;
}

// Neo-Hookean stress at a cell edge, from the Jacobian of the reference map,
// smoothed by the solid fraction. Includes the active muscle deformation.
fn edge_stress(jac: mat2x2<f32>, xi_edge: vec2<f32>, phi_edge: f32, con: f32) -> mat2x2<f32> {
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

    // Active deformation: area-preserving stretch along the body axis, graded
    // across the thickness (X.y) so the body bends.
    let X = reference_coord(xi_edge);
    let muscle = solid_fraction(capsule(X, params.muscle_half_length, params.muscle_radius));
    let fac = clamp(exp(con * X.y * muscle), 0.5, 2.0);
    F[0] *= fac;
    F[1] *= 1.0 / fac;

    // Compressible neo-Hookean constitutive law (plane strain)
    let J = clamp(1.0 / det, 0.1, 10.0);
    let B = F * transpose(F);
    let I = mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0));
    let dev = B - ((B[0][0] + B[1][1] + 1.0) / 3.0) * I;
    return sf * (params.shear_modulus * dev + params.bulk_modulus * (J - 1.0) * I);
}

// Radial push (left click / one finger) or pull (right click / two fingers).
fn interaction_force(p: vec2<f32>) -> vec2<f32> {
    let a = abs(interaction.size);
    if (a < 1.0) { return vec2<f32>(0.0); }
    let s = vec2<f32>(params.size);
    var d = p - interaction.position;
    d -= s * round(d / s);
    let r = length(d);
    if (r >= a || r < 1e-3) { return vec2<f32>(0.0); }
    return (0.02 * sign(interaction.size) * exp(-r * r / a) / r) * d;
}

@compute @workgroup_size(8, 8)
fn collide(@builtin(global_invocation_id) gid: vec3<u32>) {
    if (any(gid.xy >= params.size)) { return; }
    let x = vec2<i32>(gid.xy);

    // 3x3 neighbourhood of the freshly advected reference map
    var xi: array<vec2<f32>, 9>; // index (dx+1) + 3*(dy+1)
    var phi: array<f32, 9>;
    let ctr = xi_at(x);
    for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
            let n = xi_near(x + vec2(dx, dy), ctr);
            xi[(dx + 1) + 3 * (dy + 1)] = n;
            phi[(dx + 1) + 3 * (dy + 1)] = level_set(n);
        }
    }
    let dl = 0; let dd = 1; let dr = 2;
    let ll = 3; let cc = 4; let rr = 5;
    let ul = 6; let uu = 7; let ur = 8;

    let con = contraction();

    // Half-edge stresses (second-order finite differences of xi, as in lbrmt)
    let sL = edge_stress(
        mat2x2<f32>(xi[cc] - xi[ll], 0.25 * (xi[uu] + xi[ul] - xi[dd] - xi[dl])),
        0.5 * (xi[cc] + xi[ll]), 0.5 * (phi[cc] + phi[ll]), con);
    let sR = edge_stress(
        mat2x2<f32>(xi[rr] - xi[cc], 0.25 * (xi[ur] + xi[uu] - xi[dr] - xi[dd])),
        0.5 * (xi[rr] + xi[cc]), 0.5 * (phi[rr] + phi[cc]), con);
    let sB = edge_stress(
        mat2x2<f32>(0.25 * (xi[rr] + xi[dr] - xi[ll] - xi[dl]), xi[cc] - xi[dd]),
        0.5 * (xi[cc] + xi[dd]), 0.5 * (phi[cc] + phi[dd]), con);
    let sT = edge_stress(
        mat2x2<f32>(0.25 * (xi[ur] + xi[rr] - xi[ul] - xi[ll]), xi[uu] - xi[cc]),
        0.5 * (xi[uu] + xi[cc]), 0.5 * (phi[uu] + phi[cc]), con);

    // Divergence of the solid stress + user interaction
    var force = (sR[0] - sL[0]) + (sT[1] - sB[1]);
    force += interaction_force(vec2<f32>(x));
    force = clamp_mag(force, 0.1);

    // Forced BGK collision (Guo forcing, second order in velocity space)
    let f = pull(x);
    let m = moments(f);
    let rho = max(m.x, EPS);
    var v = (m.yz + 0.5 * force) / rho;
    v = clamp_mag(v, 0.35);

    let feq = equilibrium(rho, v);
    let itau = 1.0 / params.tau;
    let fw = 1.0 - 0.5 * itau;

    for (var i = 0; i < 9; i++) {
        let ci = vec2<f32>(C[i]);
        let Fi = W[i] * (3.0 * dot(ci - v, force) + 9.0 * dot(ci, v) * dot(ci, force));
        let fi = f[i] - itau * (f[i] - feq[i]) + fw * Fi;
        textureStore(f_out, x, i, vec4<f32>(fi, 0.0, 0.0, 0.0));
    }
}
