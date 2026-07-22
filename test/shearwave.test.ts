// Key result of the thesis (section 3.1): plane shear waves in a fully-solid
// periodic domain follow the analytic solution
//
//   v(x, t)  = (0, -e^{-lambda t} w eps sin(kx - wt))
//   xi(x, t) = (x, y + w eps e^{-lambda t} (w cos(kx-wt) - lambda sin(kx-wt)) / (w^2 + lambda^2))
//
// with w = sqrt(G/rho) k and lambda = nu k^2 / 2 (envelope decay rate of the
// damped wave equation; the thesis quotes nu k^2, which overstates the decay
// by 2x - our measured decay confirms nu k^2 / 2), and the error converges
// under grid refinement.
//
// Note: the thesis measures order ~1.7-1.8; our GPU-friendly variant uses
// first-order operator splitting between advection and collision, so the
// phase error converges at order ~1. That is the dominant error term here.
import test from "node:test";
import assert from "node:assert";
import { Solver } from "./reference.ts";

function shearWave(n: number) {
	const G = 0.04;
	const tau = 1.0;
	const s = new Solver({
		width: n, height: n, tau, G, kappa: 3 * G,
		cx: n / 2, cy: n / 2,
		halfLength: 0, radius: 1e6, // phi << 0 everywhere: fully solid
	});
	const rho = 1;
	const nu = (tau - 0.5) / 3;
	const k = (2 * Math.PI) / n;
	const w = Math.sqrt(G / rho) * k;
	const lambda = 0.5 * nu * k * k; // envelope decay of the damped wave equation
	const amp = 0.001 * n; // displacement amplitude (cells), self-similar in n

	s.setHydro((x) => [rho, 0, -w * amp * Math.sin(k * x)]);
	s.setReferenceMap((x, y) => [
		x,
		y + w * amp * (w * Math.cos(k * x) - lambda * Math.sin(k * x)) / (w * w + lambda * lambda),
	]);

	const period = Math.round((2 * Math.PI) / w);
	s.run(period);

	// normalized L1 error of the velocity field vs the exact solution
	const t = s.step_;
	let err = 0;
	for (let y = 0; y < n; y++)
		for (let x = 0; x < n; x++) {
			const [, v] = s.velocity(x, y);
			const exact = -Math.exp(-lambda * t) * w * amp * Math.sin(k * x - w * t);
			err += Math.abs(v - exact);
		}
	return { error: err / (n * n * w * amp), diag: s.diagnostics() };
}

test("shear wave matches the analytic solution", () => {
	const { error, diag } = shearWave(48);
	assert.strictEqual(diag.invalid, 0);
	assert.ok(Math.abs(diag.meanDensity - 1) < 1e-3, "mass conserved");
	assert.ok(error < 0.1, `normalized L1 error ${error.toFixed(4)} after one period`);
});

test("shear wave error converges under grid refinement", () => {
	const coarse = shearWave(48).error;
	const fine = shearWave(96).error;
	const order = Math.log2(coarse / fine);
	assert.ok(order > 0.8, `convergence order ${order.toFixed(2)} (coarse=${coarse.toExponential(2)}, fine=${fine.toExponential(2)})`);
});
