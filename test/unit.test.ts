// Unit tests for the solver building blocks.
import test from "node:test";
import assert from "node:assert";
import { Solver, C, WEIGHTS, capsule, eno2, equilibrium } from "./reference.ts";

test("D2Q9 weights sum to one and are isotropic", () => {
	assert.ok(Math.abs(WEIGHTS.reduce((a, b) => a + b) - 1) < 1e-12);
	// first moment vanishes, second moment = cs^2 = 1/3 on the diagonal
	let mx = 0, my = 0, mxx = 0, myy = 0, mxy = 0;
	for (let i = 0; i < 9; i++) {
		mx += WEIGHTS[i] * C[i][0];
		my += WEIGHTS[i] * C[i][1];
		mxx += WEIGHTS[i] * C[i][0] * C[i][0];
		myy += WEIGHTS[i] * C[i][1] * C[i][1];
		mxy += WEIGHTS[i] * C[i][0] * C[i][1];
	}
	assert.ok(Math.abs(mx) < 1e-12 && Math.abs(my) < 1e-12);
	assert.ok(Math.abs(mxx - 1 / 3) < 1e-12);
	assert.ok(Math.abs(myy - 1 / 3) < 1e-12);
	assert.ok(Math.abs(mxy) < 1e-12);
});

test("equilibrium reproduces its own moments (thesis eq. 1.17)", () => {
	const rho = 1.13, u = 0.08, v = -0.05;
	const feq = equilibrium(rho, u, v);
	let m0 = 0, m1x = 0, m1y = 0;
	for (let i = 0; i < 9; i++) {
		m0 += feq[i];
		m1x += feq[i] * C[i][0];
		m1y += feq[i] * C[i][1];
	}
	assert.ok(Math.abs(m0 - rho) < 1e-12);
	assert.ok(Math.abs(m1x - rho * u) < 1e-12);
	assert.ok(Math.abs(m1y - rho * v) < 1e-12);
});

test("capsule signed distance", () => {
	assert.ok(Math.abs(capsule(0, 0, 5, 2) - -2) < 1e-12); // centre
	assert.ok(Math.abs(capsule(5, 0, 5, 2) - -2) < 1e-12); // end of segment
	assert.ok(Math.abs(capsule(8, 0, 5, 2) - 1) < 1e-12); // beyond end cap
	assert.ok(Math.abs(capsule(0, 4, 5, 2) - 2) < 1e-12); // above
});

test("solid fraction is a monotone partition of unity over the blur zone", () => {
	const s = new Solver({});
	assert.strictEqual(s.solidFraction(s.epsilon), 0);
	assert.strictEqual(s.solidFraction(-s.epsilon), 1);
	assert.ok(Math.abs(s.solidFraction(0) - 0.5) < 1e-12);
	let prev = 1;
	for (let phi = -s.epsilon; phi <= s.epsilon; phi += 0.01) {
		const v = s.solidFraction(phi);
		assert.ok(v <= prev + 1e-12, "monotone decreasing");
		prev = v;
	}
});

test("eno2 is exact for linear and quadratic data", () => {
	// linear: f(x) = 3x, derivative 3 (stencil order: downwind, centre, upwind, upwind2)
	assert.ok(Math.abs(eno2(3, 0, -3, -6) - 3) < 1e-12);
	// quadratic: f(x) = x^2 at x=0: values at +1,0,-1,-2 -> derivative 0
	assert.ok(Math.abs(eno2(1, 0, 1, 4) - 0) < 1e-12);
});

test("undeformed solid produces zero stress", () => {
	const s = new Solver({});
	// identity reference map -> jacobian = I -> F = I -> B = I -> dev = 0, J = 1
	const stress = s.edgeStress(1, 0, 0, 1, s.cx, s.cy, -10);
	for (const row of stress) for (const v of row) assert.ok(Math.abs(v) < 1e-12);
});

test("pure shear produces symmetric deviatoric stress proportional to G", () => {
	const s = new Solver({ G: 0.05, kappa: 0.15 });
	// simple shear: x = X + g Y => xi jacobian = [[1, -g], [0, 1]] (X = x - g y)
	const g = 0.1;
	const stress = s.edgeStress(1, -g, 0, 1, s.cx, s.cy, -10);
	assert.ok(Math.abs(stress[0][1] - stress[1][0]) < 1e-12, "symmetric");
	assert.ok(Math.abs(stress[0][1] - s.G * g) < 1e-3, "sigma_xy ~ G*gamma");
});

test("volumetric compression produces negative pressure ~ kappa(J-1)", () => {
	const s = new Solver({ G: 0.05, kappa: 0.15 });
	// uniform compression x = 0.9 X => jacobian of xi = I/0.9, J = 0.81
	const j = 1 / 0.9;
	const stress = s.edgeStress(j, 0, 0, j, s.cx, s.cy, -10);
	const J = 0.9 * 0.9;
	assert.ok(stress[0][0] < 0, "compression resists");
	assert.ok(Math.abs(stress[0][0] - stress[1][1]) < 1e-6, "isotropic part equal");
	const volumetric = s.kappa * (J - 1);
	assert.ok(Math.abs(0.5 * (stress[0][0] + stress[1][1]) - volumetric) < 0.01);
});

test("actuation is area-preserving (det F unchanged)", () => {
	const s = new Solver({ actuationAmp: 0.3, muscleHalfLength: 50, muscleRadius: 50 });
	// inside the muscle with con != 0 the stress at rest configuration is
	// nonzero (that is the point of actuation) but J stays 1, so the
	// volumetric term must vanish: trace equals deviatoric-only trace.
	const stress = s.edgeStress(1, 0, 0, 1, s.cx + 1, s.cy + 1, -10);
	// with kappa(J-1) = 0, trace = G*(trB - 2*(trB+1)/3)
	const [Xr, Yr] = s.refCoord(s.cx + 1, s.cy + 1);
	const fac = Math.exp(s.contraction(Xr) * Yr);
	const trB = fac * fac + 1 / (fac * fac);
	const expected = s.G * (trB - 2 * (trB + 1) / 3);
	assert.ok(Math.abs(stress[0][0] + stress[1][1] - expected) < 1e-6);
});
