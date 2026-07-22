// CUDA reference implementation of the LBRMT solver.
//
// Mirrors src/shaders/lbrmt.comp.wgsl + src/shaders/includes/common.wgsl
// line-for-line in float32 so that solver physics can be validated and tuned
// at production resolution before porting parameter/algorithm changes back to
// the WebGPU shaders. Any change here must be reflected in the WGSL and
// vice versa.
//
// Build:  make          (see cuda/Makefile)
// Run:    ./lbrmt --scene rotor --n 448 --steps 32000 --report 2000
// Output: one JSON line per report interval with coherence metrics.

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>

#define CHECK(x) do { cudaError_t e = (x); if (e != cudaSuccess) { \
    fprintf(stderr, "CUDA error %s at %s:%d\n", cudaGetErrorString(e), __FILE__, __LINE__); exit(1); } } while (0)

// ---------------------------------------------------------------------------
// Parameters (superset of the WGSL Params struct; extra fields are the
// constants currently hardcoded in the shaders, exposed here for tuning)
// ---------------------------------------------------------------------------
struct Params {
    int width, height;
    float tau, shear_modulus, bulk_modulus, epsilon;
    float cx, cy;
    float half_length, radius;
    float muscle_half_length, muscle_radius;
    float actuation_amp, actuation_freq;
    int shape; // 0 flapper, 1 seven-star rotor, 2 rotor lattice
    float pivot_radius, spin_angle, spin_freq;
    // hardcoded in WGSL today:
    float anchor_strength;   // 0.02
    float anchor_range;      // spring displacement cap (cells)
    float force_clamp;       // 0.2
    float velocity_clamp;    // 0.25
    float diffusion_rate;    // 0.3
    float diffusion_from;    // 1.0 (units of epsilon)
    float diffusion_to;      // 3.0
    float friction;          // Rayleigh friction: v <- (1 - friction) v in feq
    float heal;              // anchored scenes: relax xi toward the ideal
                             // rigidly-rotated map (analytic "extrapolation")
    float magic;             // TRT magic parameter Lambda (1/4 = stability)
    float wave_number;       // flapper: traveling-wave number of the muscle
    float pulse_power;       // > 1: one-sided sin^8 pulses (JFM 2020)
};

__constant__ Params par;

// ---------------------------------------------------------------------------
// D2Q9 lattice
// ---------------------------------------------------------------------------
__device__ __constant__ int   CX[9] = {0, 1, 0, -1, 0, 1, -1, -1, 1};
__device__ __constant__ int   CY[9] = {0, 0, 1, 0, -1, 1, 1, -1, -1};
__device__ __constant__ float Wt[9] = {4.f/9, 1.f/9, 1.f/9, 1.f/9, 1.f/9, 1.f/36, 1.f/36, 1.f/36, 1.f/36};
__device__ __constant__ int   OPP[9] = {0, 3, 4, 1, 2, 7, 8, 5, 6};

#define PI 3.14159265358979f

__device__ inline int wrapi(int v, int n) { return ((v % n) + n) % n; }
__device__ inline int cell(int x, int y) { return wrapi(y, par.height) * par.width + wrapi(x, par.width); }

__device__ inline float2 xi_at(const float2* xi, int x, int y) { return xi[cell(x, y)]; }

__device__ inline float2 xi_near(const float2* xi, int x, int y, float2 anchor) {
    float2 v = xi_at(xi, x, y);
    v.x -= par.width  * rintf((v.x - anchor.x) / par.width);
    v.y -= par.height * rintf((v.y - anchor.y) / par.height);
    return v;
}

__device__ inline float2 reference_coord(float2 xi) {
    float dx = xi.x - par.cx, dy = xi.y - par.cy;
    dx -= par.width  * rintf(dx / par.width);
    dy -= par.height * rintf(dy / par.height);
    return make_float2(dx, dy);
}

__device__ inline float capsule(float2 p, float hl, float r) {
    float qx = fabsf(p.x) - hl;
    return (qx < 0.f ? fabsf(p.y) : sqrtf(qx * qx + p.y * p.y)) - r;
}

__device__ inline float seven_star(float2 p, float cr) {
    const float fac = 2.f * PI / 7.f;
    float theta = fabsf(atan2f(p.y, p.x));
    float R = sqrtf(p.x * p.x + p.y * p.y);
    theta = fabsf(theta - fac * rintf(theta / fac));
    float X = R * cosf(theta) - cr;
    float Y = R * sinf(theta);
    float c = cosf(0.25f * fac), s = sinf(0.25f * fac);
    return X * c - Y * s > 0.f ? sqrtf(X * X + Y * Y) : Y * c + X * s;
}

__device__ inline float smooth_rotor(float2 p, float l, float r, float s) {
    float X = p.x, Y = fabsf(p.y);
    if (X * -0.8660254f + Y * 0.5f > 0.f) {
        float yy = fabsf(X * -0.8660254f + Y * -0.5f);
        X = X * -0.5f + Y * 0.8660254f;
        Y = yy;
    }
    float q = (r + s) * 0.57735027f;
    if (X > l) return sqrtf((X - l) * (X - l) + Y * Y) - r;
    if (X > q) return Y - r;
    return s - sqrtf((X - q) * (X - q) + (Y - r - s) * (Y - r - s));
}

// offset to the nearest rotor centre in the 2x2 lattice + row spin direction
__device__ inline float3 rotor_lattice(float2 p) {
    float px = 0.5f * par.width, py = 0.5f * par.height;
    float kx = rintf(p.x / px), ky = rintf(p.y / py);
    int row = ((int(ky) % 2) + 2) % 2;
    return make_float3(p.x - kx * px, p.y - ky * py, row == 1 ? -1.f : 1.f);
}

__device__ inline float sdf_shape(float2 p) {
    if (par.shape == 1) return seven_star(p, par.half_length) - par.radius;
    if (par.shape == 2) {
        float3 r = rotor_lattice(p);
        return smooth_rotor(make_float2(r.x, r.y), par.half_length, par.radius, par.muscle_radius);
    }
    return capsule(p, par.half_length, par.radius);
}

__device__ inline float level_set(float2 xi) { return sdf_shape(reference_coord(xi)); }

// Level set gated by world position: an *anchored* rotor cannot leave the
// neighbourhood of its pivot, so any apparent solid beyond the gate radius is
// a phantom (wound-up far-field reference map) and is treated as fluid. This
// makes the far-field xi purely cosmetic for anchored scenes.
__device__ inline float level_set_at(float2 xi, float px, float py) {
    float phi = sdf_shape(reference_coord(xi));
    if (par.shape == 0) return phi;
    float dx = px - par.cx, dy = py - par.cy;
    dx -= par.width * rintf(dx / par.width);
    dy -= par.height * rintf(dy / par.height);
    if (par.shape == 2) { float3 r = rotor_lattice(make_float2(dx, dy)); dx = r.x; dy = r.y; }
    float gate = par.half_length + par.radius + 4.f * par.epsilon;
    return fmaxf(phi, sqrtf(dx * dx + dy * dy) - gate);
}

__device__ inline float solid_fraction(float phi) {
    float e = par.epsilon;
    if (phi >= e) return 0.f;
    if (phi <= -e) return 1.f;
    float t = phi / e;
    return 0.5f - 0.5f * t - sinf(PI * t) / (2.f * PI);
}

__device__ inline float2 clamp_mag(float2 v, float m) {
    float l = sqrtf(v.x * v.x + v.y * v.y);
    if (l > m) { v.x *= m / l; v.y *= m / l; }
    return v;
}

__device__ inline float2 eno2(float2 v0, float2 v1, float2 v2, float2 v3) {
    float2 out;
    {
        float a = fabsf(v0.x - 2.f * v1.x + v2.x), b = fabsf(v1.x - 2.f * v2.x + v3.x);
        out.x = a < b ? 0.5f * (v0.x - v2.x) : 1.5f * v1.x - 2.f * v2.x + 0.5f * v3.x;
    }
    {
        float a = fabsf(v0.y - 2.f * v1.y + v2.y), b = fabsf(v1.y - 2.f * v2.y + v3.y);
        out.y = a < b ? 0.5f * (v0.y - v2.y) : 1.5f * v1.y - 2.f * v2.y + 0.5f * v3.y;
    }
    return out;
}

// populations streamed to (x, y): f_i = f_src[i](x - c_i)
__device__ inline void pull(const float* f, int x, int y, float* out) {
    int n = par.width * par.height;
    for (int i = 0; i < 9; i++) out[i] = f[i * n + cell(x - CX[i], y - CY[i])];
}

__device__ inline float3 moments(const float* f) {
    float rho = 0.f, mx = 0.f, my = 0.f;
    for (int i = 0; i < 9; i++) { rho += f[i]; mx += f[i] * CX[i]; my += f[i] * CY[i]; }
    return make_float3(rho, mx, my);
}

// flapper muscle activation: a wave traveling along the body (+X direction)
// pushes fluid backward and drives the swimmer forward; con multiplies Y in
// the active stretch exp(con * Y), bending the body locally.
__device__ inline float contraction(int step, float X) {
    float s = sinf(par.actuation_freq * step - par.wave_number * X);
    if (par.pulse_power > 1.f) {
        // one-sided pulses sin^8 (JFM 2020 eq. 4.8): bend, then relax while
        // the passive ends flap elastically like a fish tail
        float s2 = s * s, s4 = s2 * s2;
        return -par.actuation_amp * s4 * s4;
    }
    return -par.actuation_amp * s;
}

// ---------------------------------------------------------------------------
// Solid stress (edge-based) and forces
// ---------------------------------------------------------------------------
struct Mat2 { float a, b, c, d; }; // [[a, b], [c, d]] row-major

__device__ inline Mat2 edge_stress(float Xx, float Xy, float Yx, float Yy,
                                   float2 xi_edge, float phi_edge, int con_step) {
    Mat2 zero = {0.f, 0.f, 0.f, 0.f};
    float sf = solid_fraction(phi_edge);
    if (sf <= 0.f) return zero;
    float det = Xx * Yy - Xy * Yx;
    if (fabsf(det) < 1e-3f) return zero;
    float F11 = Yy / det, F12 = -Xy / det, F21 = -Yx / det, F22 = Xx / det;

    if (par.shape == 0) {
        float2 X = reference_coord(xi_edge);
        float muscle = solid_fraction(capsule(X, par.muscle_half_length, par.muscle_radius));
        float fac = fminf(2.f, fmaxf(0.5f, expf(contraction(con_step, X.x) * X.y * muscle)));
        F11 *= fac; F21 *= fac; F12 /= fac; F22 /= fac;
    }

    float J = fminf(10.f, fmaxf(0.1f, 1.f / det));
    float B11 = F11 * F11 + F12 * F12;
    float B12 = F11 * F21 + F12 * F22;
    float B22 = F21 * F21 + F22 * F22;
    float tr = (B11 + B22 + 1.f) / 3.f;
    float G = par.shear_modulus, K = par.bulk_modulus;
    // volumetric term (J - 1/J)/2: same linearization as (J - 1) at J = 1
    // but much stiffer in compression, resisting the slow "puffing" of
    // vigorously actuated bodies
    float vol = K * 0.5f * (J - 1.f / J);
    Mat2 s;
    s.a = sf * (G * (B11 - tr) + vol);
    s.b = sf * (G * B12);
    s.c = sf * (G * B12);
    s.d = sf * (G * (B22 - tr) + vol);
    return s;
}

__device__ inline float2 anchor_force(float px, float py, float2 xi_c, float phi_c, int step) {
    if (par.shape == 0) return make_float2(0.f, 0.f);
    float2 xrel, Xrel;
    float spin = 1.f;
    if (par.shape == 2) {
        float dx = px - par.cx, dy = py - par.cy;
        dx -= par.width * rintf(dx / par.width);
        dy -= par.height * rintf(dy / par.height);
        float3 here = rotor_lattice(make_float2(dx, dy));
        xrel = make_float2(here.x, here.y);
        spin = here.z;
        float3 rr = rotor_lattice(reference_coord(xi_c));
        Xrel = make_float2(rr.x, rr.y);
    } else {
        float dx = px - par.cx, dy = py - par.cy;
        dx -= par.width * rintf(dx / par.width);
        dy -= par.height * rintf(dy / par.height);
        xrel = make_float2(dx, dy);
        Xrel = reference_coord(xi_c);
    }
    // smooth anchor footprint: full strength inside the pivot, fading over
    // 2 epsilon (a hard cutoff ring concentrates stress and tears material)
    float r = sqrtf(xrel.x * xrel.x + xrel.y * xrel.y);
    float t = fminf(1.f, fmaxf(0.f, (r - par.pivot_radius) / (2.f * par.epsilon)));
    float w = 1.f - t * t * (3.f - 2.f * t);
    if (w <= 0.f) return make_float2(0.f, 0.f);

    float theta = spin * par.spin_angle * (1.f - cosf(par.spin_freq * step));
    float ct = cosf(theta), st = sinf(theta);
    float rx = Xrel.x * ct - Xrel.y * st;
    float ry = Xrel.x * st + Xrel.y * ct;
    float lam = solid_fraction(phi_c);
    // displacement-capped spring: the drive acts like a motor with slip, so a
    // lagging rotor feels a bounded, gentle torque instead of a runaway pull
    float2 d = clamp_mag(make_float2(xrel.x - rx, xrel.y - ry), par.anchor_range);
    return make_float2(-par.anchor_strength * lam * w * d.x,
                       -par.anchor_strength * lam * w * d.y);
}

// divergence of the solid stress + drive forces at node (x, y)
__device__ inline float2 total_force(const float2* xi, int x, int y, int step) {
    float2 n[9]; // 3x3 neighbourhood, index (dx+1) + 3*(dy+1)
    float phi[9];
    float2 ctr = xi_at(xi, x, y);
    for (int dy = -1; dy <= 1; dy++)
        for (int dx = -1; dx <= 1; dx++) {
            float2 v = xi_near(xi, x + dx, y + dy, ctr);
            n[(dx + 1) + 3 * (dy + 1)] = v;
            phi[(dx + 1) + 3 * (dy + 1)] = level_set_at(v, (float)(x + dx), (float)(y + dy));
        }
    const int dl = 0, dd = 1, dr = 2, ll = 3, cc = 4, rr = 5, ul = 6, uu = 7, ur = 8;
    int con = step;

    Mat2 sL = edge_stress(n[cc].x - n[ll].x, 0.25f * (n[uu].x + n[ul].x - n[dd].x - n[dl].x),
                          n[cc].y - n[ll].y, 0.25f * (n[uu].y + n[ul].y - n[dd].y - n[dl].y),
                          make_float2(0.5f * (n[cc].x + n[ll].x), 0.5f * (n[cc].y + n[ll].y)),
                          0.5f * (phi[cc] + phi[ll]), con);
    Mat2 sR = edge_stress(n[rr].x - n[cc].x, 0.25f * (n[ur].x + n[uu].x - n[dr].x - n[dd].x),
                          n[rr].y - n[cc].y, 0.25f * (n[ur].y + n[uu].y - n[dr].y - n[dd].y),
                          make_float2(0.5f * (n[rr].x + n[cc].x), 0.5f * (n[rr].y + n[cc].y)),
                          0.5f * (phi[rr] + phi[cc]), con);
    Mat2 sB = edge_stress(0.25f * (n[rr].x + n[dr].x - n[ll].x - n[dl].x), n[cc].x - n[dd].x,
                          0.25f * (n[rr].y + n[dr].y - n[ll].y - n[dl].y), n[cc].y - n[dd].y,
                          make_float2(0.5f * (n[cc].x + n[dd].x), 0.5f * (n[cc].y + n[dd].y)),
                          0.5f * (phi[cc] + phi[dd]), con);
    Mat2 sT = edge_stress(0.25f * (n[ur].x + n[rr].x - n[ul].x - n[ll].x), n[uu].x - n[cc].x,
                          0.25f * (n[ur].y + n[rr].y - n[ul].y - n[ll].y), n[uu].y - n[cc].y,
                          make_float2(0.5f * (n[uu].x + n[cc].x), 0.5f * (n[uu].y + n[cc].y)),
                          0.5f * (phi[uu] + phi[cc]), con);

    float2 force = make_float2((sR.a - sL.a) + (sT.b - sB.b),
                               (sR.c - sL.c) + (sT.d - sB.d));
    float2 anchor = anchor_force((float)x, (float)y, n[cc], phi[cc], step);
    force.x += anchor.x;
    force.y += anchor.y;
    return force; // clamped against the local density by the caller
}

// ---------------------------------------------------------------------------
// Kernels
// ---------------------------------------------------------------------------
__global__ void init_kernel(float2* xi, float* f) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= par.width || y >= par.height) return;
    int k = y * par.width + x, n = par.width * par.height;
    xi[k] = make_float2((float)x, (float)y);
    for (int i = 0; i < 9; i++) f[i * n + k] = Wt[i];
}

__global__ void advect_kernel(const float2* xi_src, const float* f_src, float2* xi_dst, int step) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= par.width || y >= par.height) return;

    float2 force = total_force(xi_src, x, y, step);
    float f[9];
    pull(f_src, x, y, f);
    float3 m = moments(f);
    float rho = fmaxf(m.x, 1e-6f);
    // cap the *acceleration*: near-vacuum cells must not be blown apart
    force = clamp_mag(force, par.force_clamp * fminf(rho, 1.f));
    float2 v = clamp_mag(make_float2((m.y + 0.5f * force.x) / rho, (m.z + 0.5f * force.y) / rho),
                         par.velocity_clamp);

    float2 c = xi_at(xi_src, x, y);
    float2 r1 = xi_near(xi_src, x + 1, y, c), r2 = xi_near(xi_src, x + 2, y, c);
    float2 l1 = xi_near(xi_src, x - 1, y, c), l2 = xi_near(xi_src, x - 2, y, c);
    float2 u1 = xi_near(xi_src, x, y + 1, c), u2 = xi_near(xi_src, x, y + 2, c);
    float2 d1 = xi_near(xi_src, x, y - 1, c), d2 = xi_near(xi_src, x, y - 2, c);

    float2 ddx, ddy;
    if (v.x > 0.f) ddx = eno2(r1, c, l1, l2);
    else { ddx = eno2(l1, c, r1, r2); ddx.x = -ddx.x; ddx.y = -ddx.y; }
    if (v.y > 0.f) ddy = eno2(u1, c, d1, d2);
    else { ddy = eno2(d1, c, u1, u2); ddy.x = -ddy.x; ddy.y = -ddy.y; }

    float2 out = make_float2(c.x - (v.x * ddx.x + v.y * ddy.x),
                             c.y - (v.x * ddx.y + v.y * ddy.y));

    // far-field diffusion of the reference map
    float from = par.diffusion_from * par.epsilon, to = par.diffusion_to * par.epsilon;
    float phi_here = level_set_at(c, (float)x, (float)y);
    float t = fminf(1.f, fmaxf(0.f, (phi_here - from) / (to - from)));
    float w = par.diffusion_rate * t * t * (3.f - 2.f * t);
    out.x = out.x * (1.f - w) + w * 0.25f * (r1.x + l1.x + u1.x + d1.x);
    out.y = out.y * (1.f - w) + w * 0.25f * (r1.y + l1.y + u1.y + d1.y);

    // anchored scenes: we know the drive angle exactly, so the ideal
    // (rigidly rotated) reference map is available analytically. Relax xi
    // toward it - strongly in the fluid (this substitutes for the paper's
    // extrapolation zone, curing phantom solids and interface smear) and
    // weakly inside the solid (healing the slow inflation of the body while
    // leaving elastic bending free).
    if (par.shape != 0 && par.heal > 0.f) {
        float px = x - par.cx, py = y - par.cy;
        px -= par.width * rintf(px / par.width);
        py -= par.height * rintf(py / par.height);
        float spin = 1.f;
        if (par.shape == 2) {
            float3 rl = rotor_lattice(make_float2(px, py));
            px = rl.x; py = rl.y; spin = rl.z;
        }
        float theta = spin * par.spin_angle * (1.f - cosf(par.spin_freq * step));
        float ct = cosf(theta), st = sinf(theta);
        // R(-theta) * (x - c): where this cell's material came from if the
        // rotor were rigidly following the drive. The rotation is about this
        // cell's *own* rotor centre, which is (x, y) minus the lattice-
        // relative offset (px, py).
        float ix = px * ct + py * st;
        float iy = -px * st + py * ct;
        float tx = (float)x - px + ix, ty = (float)y - py + iy;
        tx -= par.width * rintf((tx - c.x) / par.width);
        ty -= par.height * rintf((ty - c.y) / par.height);
        float lam = solid_fraction(phi_here);
        float hw = par.heal * (0.25f + 0.75f * (1.f - lam));
        out.x = out.x * (1.f - hw) + hw * tx;
        out.y = out.y * (1.f - hw) + hw * ty;
    }

    xi_dst[y * par.width + x] = out;
}

__global__ void collide_kernel(const float2* xi, const float* f_src, float* f_dst, int step) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= par.width || y >= par.height) return;
    int k = y * par.width + x, n = par.width * par.height;

    float2 force = total_force(xi, x, y, step);
    float f[9];
    pull(f_src, x, y, f);
    float3 m = moments(f);
    float rho = fmaxf(m.x, 1e-6f);
    force = clamp_mag(force, par.force_clamp * fminf(rho, 1.f));
    float2 v = clamp_mag(make_float2((m.y + 0.5f * force.x) / rho, (m.z + 0.5f * force.y) / rho),
                         par.velocity_clamp);

    // weak Rayleigh friction: a fully periodic box has no walls to absorb
    // the momentum that anchored rotors continuously pump into the fluid;
    // without a sink the swirl grows until it rips the solid off its anchor
    v.x *= 1.f - par.friction;
    v.y *= 1.f - par.friction;
    float usq = v.x * v.x + v.y * v.y;
    // TRT collision (two relaxation times): even modes relax with 1/tau
    // (sets the viscosity), odd modes with the "magic" combination
    // Lambda = (tau+ - 1/2)(tau- - 1/2) = 1/4, which is markedly more stable
    // than BGK at low viscosity (tau -> 1/2) and damps the staircase noise
    // that BGK produces around fast-moving interfaces.
    float wp = 1.f / par.tau;
    float wm = 1.f / (0.5f + par.magic / (par.tau - 0.5f));
    float fw = 1.f - 0.5f * wp;
    float feq[9];
    for (int i = 0; i < 9; i++) {
        float cu = CX[i] * v.x + CY[i] * v.y;
        feq[i] = Wt[i] * rho * (1.f + 3.f * cu + 4.5f * cu * cu - 1.5f * usq);
    }
    for (int i = 0; i < 9; i++) {
        int j = OPP[i];
        float fp = 0.5f * (f[i] + f[j]), fm = 0.5f * (f[i] - f[j]);
        float ep = 0.5f * (feq[i] + feq[j]), em = 0.5f * (feq[i] - feq[j]);
        float cu = CX[i] * v.x + CY[i] * v.y;
        float Fi = Wt[i] * (3.f * ((CX[i] - v.x) * force.x + (CY[i] - v.y) * force.y)
                            + 9.f * cu * (CX[i] * force.x + CY[i] * force.y));
        f_dst[i * n + k] = f[i] - wp * (fp - ep) - wm * (fm - em) + fw * Fi;
    }
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------
struct Diag {
    float mass, area, debris, rot_sum, cx_sum, cy_sum;
    int rot_count, invalid;
    unsigned int maxv_bits;
};

__global__ void diag_kernel(const float2* xi, const float* f, Diag* d) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= par.width || y >= par.height) return;
    int k = y * par.width + x;

    float ff[9];
    pull(f, x, y, ff);
    float3 m = moments(ff);
    float rho = fmaxf(m.x, 1e-6f);
    float sp = sqrtf(m.y * m.y + m.z * m.z) / rho;
    if (!isfinite(m.x)) atomicAdd(&d->invalid, 1);
    atomicAdd(&d->mass, m.x);
    atomicMax(&d->maxv_bits, __float_as_uint(sp));

    float lam = solid_fraction(level_set_at(xi[k], (float)x, (float)y));
    if (lam <= 0.f) return;
    atomicAdd(&d->area, lam);

    float px = x - par.cx, py = y - par.cy;
    px -= par.width * rintf(px / par.width);
    py -= par.height * rintf(py / par.height);
    float tip = par.half_length + par.radius;
    if (sqrtf(px * px + py * py) > tip + 3.f * par.epsilon) atomicAdd(&d->debris, lam);
    atomicAdd(&d->cx_sum, lam * px);
    atomicAdd(&d->cy_sum, lam * py);

    if (lam > 0.5f && px * px + py * py > 36.f) {
        float2 X = reference_coord(xi[k]);
        if (par.shape == 2) { float3 r = rotor_lattice(X); X = make_float2(r.x, r.y); }
        atomicAdd(&d->rot_sum, -atan2f(px * X.y - py * X.x, px * X.x + py * X.y));
        atomicAdd(&d->rot_count, 1);
    }
}

// ---------------------------------------------------------------------------
// BMP dump (visual check: solid checker + vorticity, like render.frag.wgsl)
// ---------------------------------------------------------------------------
__global__ void render_kernel(const float2* xi, const float* f, unsigned char* rgb) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= par.width || y >= par.height) return;
    int k = y * par.width + x;

    // diagnostic view: white fluid, black solid, nothing else.
    // "ink in water" (smeared grays) means the solid is disintegrating.
    float lam = solid_fraction(level_set_at(xi[k], (float)x, (float)y));
    unsigned char v = (unsigned char)((1.f - lam) * 255.f);
    rgb[3 * k + 0] = v;
    rgb[3 * k + 1] = v;
    rgb[3 * k + 2] = v;

    // vorticity channel in red/blue tint (solid stays black, fluid white)
    if (lam < 0.5f) {
        auto vel = [&](int xx, int yy) {
            float ff[9];
            int nn = par.width * par.height;
            for (int i = 0; i < 9; i++) ff[i] = f[i * nn + cell(xx, yy)];
            float3 mm = moments(ff);
            return make_float2(mm.y / fmaxf(mm.x, 1e-6f), mm.z / fmaxf(mm.x, 1e-6f));
        };
        float vort = 0.5f * ((vel(x + 1, y).y - vel(x - 1, y).y) - (vel(x, y + 1).x - vel(x, y - 1).x));
        float wv = fminf(1.f, fmaxf(-1.f, vort * 200.f));
        // positive vorticity removes blue+green -> red; negative -> blue
        if (wv > 0.f) { rgb[3 * k + 0] = (unsigned char)((1.f - wv) * v); rgb[3 * k + 1] = (unsigned char)((1.f - wv) * v); }
        else { rgb[3 * k + 1] = (unsigned char)((1.f + wv) * v); rgb[3 * k + 2] = (unsigned char)((1.f + wv) * v); }
    }

    // pivot region outline (mid gray ring) for orientation
    float px = x - par.cx, py = y - par.cy;
    px -= par.width * rintf(px / par.width);
    py -= par.height * rintf(py / par.height);
    if (par.shape == 2) { float3 r = rotor_lattice(make_float2(px, py)); px = r.x; py = r.y; }
    float rr = sqrtf(px * px + py * py);
    if (par.shape != 0 && fabsf(rr - par.pivot_radius) < 1.f) {
        rgb[3 * k + 0] = 128; rgb[3 * k + 1] = 128; rgb[3 * k + 2] = 128;
    }
}

static void write_bmp(const char* path, const unsigned char* bgr, int w, int h) {
    int row = (3 * w + 3) & ~3;
    int size = 54 + row * h;
    unsigned char hdr[54] = {0};
    hdr[0] = 'B'; hdr[1] = 'M';
    *(int*)(hdr + 2) = size; *(int*)(hdr + 10) = 54; *(int*)(hdr + 14) = 40;
    *(int*)(hdr + 18) = w; *(int*)(hdr + 22) = -h; // top-down
    *(short*)(hdr + 26) = 1; *(short*)(hdr + 28) = 24;
    FILE* fp = fopen(path, "wb");
    fwrite(hdr, 1, 54, fp);
    std::vector<unsigned char> line(row, 0);
    for (int y = 0; y < h; y++) {
        memcpy(line.data(), bgr + 3 * w * y, 3 * w);
        fwrite(line.data(), 1, row, fp);
    }
    fclose(fp);
}

// ---------------------------------------------------------------------------
// Host driver
// ---------------------------------------------------------------------------
static float bits_to_float(unsigned int b) {
    float f;
    memcpy(&f, &b, sizeof(f));
    return f;
}

static float argf(int argc, char** argv, const char* name, float def) {
    for (int i = 1; i < argc - 1; i++)
        if (!strcmp(argv[i], name)) return atof(argv[i + 1]);
    return def;
}
static const char* args(int argc, char** argv, const char* name, const char* def) {
    for (int i = 1; i < argc - 1; i++)
        if (!strcmp(argv[i], name)) return argv[i + 1];
    return def;
}

int main(int argc, char** argv) {
    Params p = {};
    p.width = (int)argf(argc, argv, "--n", 448);
    p.height = (int)argf(argc, argv, "--ny", p.width);
    const char* scene = args(argc, argv, "--scene", "rotor");
    float scale = fminf(p.width, p.height);
    p.magic = 0.25f;
    p.wave_number = 0.f;
    p.pulse_power = 1.f;
    float L = scale;

    // defaults mirroring src/index.ts scene settings
    if (!strcmp(scene, "rotor")) {
        p.shape = 1;
        p.tau = 0.55f; p.shear_modulus = 0.05f; p.bulk_modulus = 0.15f;
        p.cx = p.width / 2.f; p.cy = p.height / 2.f;
        p.half_length = 0.16f * scale; p.radius = 0.04f * scale;
        p.pivot_radius = 0.1f * scale;
        p.spin_angle = PI; p.spin_freq = 2.f * PI / 54000.f;
    } else if (!strcmp(scene, "rotors")) {
        p.shape = 2;
        p.tau = 0.7f; p.shear_modulus = 0.05f; p.bulk_modulus = 0.15f;
        p.cx = p.width / 4.f; p.cy = p.height / 4.f;
        p.half_length = 0.174f * L; p.radius = 0.04f * L; p.muscle_radius = 0.04f * L;
        p.pivot_radius = 0.1f * L;
        p.spin_angle = PI; p.spin_freq = 2.f * PI / 54000.f;
    } else { // flapper
        p.shape = 0;
        // slender swimmer (aspect ~10, JFM 2020 Fig. 9 proportions): a thin
        // body bends globally under the muscle wave instead of rippling
        p.tau = 0.55f; p.shear_modulus = 0.15f; p.bulk_modulus = 0.45f;
        p.cx = p.width / 2.f; p.cy = p.height / 2.f;
        p.half_length = 0.15f * scale; p.radius = 0.0174f * scale;
        p.muscle_half_length = 0.085f * scale; p.muscle_radius = 0.014f * scale;
        p.actuation_amp = logf(4.f) / p.muscle_radius; // max stretch 4x
        p.actuation_freq = 2.f * PI / 900.f;
        p.wave_number = 21.f / scale;
    }
    p.epsilon = 2.f;
    p.anchor_strength = 0.02f;
    p.anchor_range = 4.f;
    p.friction = p.shape == 0 ? 0.f : 3e-4f;
    p.heal = p.shape == 0 ? 0.f : 3e-4f;
    p.force_clamp = 0.2f;
    p.velocity_clamp = 0.25f;
    p.diffusion_rate = 0.3f;
    p.diffusion_from = 0.5f;
    p.diffusion_to = 3.f;

    // overrides
    p.tau = argf(argc, argv, "--tau", p.tau);
    p.shear_modulus = argf(argc, argv, "--G", p.shear_modulus);
    p.bulk_modulus = argf(argc, argv, "--kappa", p.bulk_modulus);
    p.epsilon = argf(argc, argv, "--eps", p.epsilon);
    p.half_length = argf(argc, argv, "--hl", p.half_length);
    p.radius = argf(argc, argv, "--rad", p.radius);
    p.muscle_radius = argf(argc, argv, "--fillet", p.muscle_radius);
    p.muscle_half_length = argf(argc, argv, "--mhl", p.muscle_half_length);
    p.pivot_radius = argf(argc, argv, "--pivot", p.pivot_radius);
    p.spin_angle = argf(argc, argv, "--spin_angle", p.spin_angle);
    float T = argf(argc, argv, "--T", 2.f * PI / p.spin_freq);
    p.spin_freq = 2.f * PI / T;
    p.anchor_strength = argf(argc, argv, "--K", p.anchor_strength);
    p.anchor_range = argf(argc, argv, "--Krange", p.anchor_range);
    p.friction = argf(argc, argv, "--friction", p.friction);
    p.heal = argf(argc, argv, "--heal", p.heal);
    p.magic = argf(argc, argv, "--magic", p.magic);
    p.wave_number = argf(argc, argv, "--wavek", p.wave_number);
    p.pulse_power = argf(argc, argv, "--pulse", p.pulse_power);
    float period = argf(argc, argv, "--period", 2.f * PI / fmaxf(p.actuation_freq, 1e-9f));
    if (p.shape == 0) p.actuation_freq = 2.f * PI / period;
    p.force_clamp = argf(argc, argv, "--fclamp", p.force_clamp);
    p.velocity_clamp = argf(argc, argv, "--vclamp", p.velocity_clamp);
    p.diffusion_rate = argf(argc, argv, "--diff", p.diffusion_rate);
    p.diffusion_from = argf(argc, argv, "--diff_from", p.diffusion_from);
    p.diffusion_to = argf(argc, argv, "--diff_to", p.diffusion_to);
    p.actuation_amp = argf(argc, argv, "--amp", p.actuation_amp);

    int steps = (int)argf(argc, argv, "--steps", 2 * T);
    int report = (int)argf(argc, argv, "--report", steps / 8);
    const char* dump = args(argc, argv, "--dump", "");

    CHECK(cudaMemcpyToSymbol(par, &p, sizeof(p)));
    int n = p.width * p.height;
    float2 *xiA, *xiB;
    float *fA, *fB;
    CHECK(cudaMalloc(&xiA, n * sizeof(float2)));
    CHECK(cudaMalloc(&xiB, n * sizeof(float2)));
    CHECK(cudaMalloc(&fA, 9 * n * sizeof(float)));
    CHECK(cudaMalloc(&fB, 9 * n * sizeof(float)));
    Diag* dDiag;
    CHECK(cudaMalloc(&dDiag, sizeof(Diag)));
    unsigned char* dRgb = nullptr;
    std::vector<unsigned char> hRgb;
    if (dump[0]) { CHECK(cudaMalloc(&dRgb, 3 * n)); hRgb.resize(3 * n); }

    dim3 bs(16, 16), gs((p.width + 15) / 16, (p.height + 15) / 16);
    init_kernel<<<gs, bs>>>(xiA, fA);

    float area0 = 0.f;
    for (int s = 0; s <= steps; s++) {
        if (s % report == 0 || s == steps) {
            Diag zero = {};
            zero.maxv_bits = 0;
            CHECK(cudaMemcpy(dDiag, &zero, sizeof(Diag), cudaMemcpyHostToDevice));
            diag_kernel<<<gs, bs>>>(xiA, fA, dDiag);
            Diag d;
            CHECK(cudaMemcpy(&d, dDiag, sizeof(Diag), cudaMemcpyDeviceToHost));
            if (s == 0) area0 = d.area;
            float theta = p.spin_angle * (1.f - cosf(p.spin_freq * s));
            printf("{\"step\":%d,\"drive\":%.3f,\"rot\":%.3f,\"mass\":%.5f,\"area_pct\":%.1f,"
                   "\"debris_pct\":%.2f,\"drift\":%.1f,\"maxv\":%.3f,\"invalid\":%d}\n",
                   s, theta, d.rot_count ? d.rot_sum / d.rot_count : 0.f,
                   d.mass / n, 100.f * d.area / area0 - 100.f,
                   100.f * d.debris / area0,
                   d.area > 0.f ? sqrtf(d.cx_sum * d.cx_sum + d.cy_sum * d.cy_sum) / d.area : 0.f,
                   bits_to_float(d.maxv_bits), d.invalid);
            fflush(stdout);
            if (dump[0]) {
                render_kernel<<<gs, bs>>>(xiA, fA, dRgb);
                CHECK(cudaMemcpy(hRgb.data(), dRgb, 3 * n, cudaMemcpyDeviceToHost));
                char path[256];
                snprintf(path, sizeof(path), "%s-%06d.bmp", dump, s);
                write_bmp(path, hRgb.data(), p.width, p.height);
            }
        }
        advect_kernel<<<gs, bs>>>(xiA, fA, xiB, s);
        collide_kernel<<<gs, bs>>>(xiB, fA, fB, s);
        std::swap(xiA, xiB);
        std::swap(fA, fB);
    }
    CHECK(cudaDeviceSynchronize());
    return 0;
}
