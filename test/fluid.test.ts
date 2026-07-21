// Fluid-only validation: the LB core must reproduce Navier-Stokes.
// Taylor-Green vortex decay pins down the kinematic viscosity
// nu = (tau - 1/2) / 3 (thesis section 1.2).
import test from "node:test";
import assert from "node:assert";
import { Solver } from "./reference.ts";

function taylorGreen({ n, tau, U, steps }: { n: number; tau: number; U: number; steps: number }) {
	// radius < 0 makes phi > 0 everywhere: pure fluid
	const s = new Solver({
		width: n, height: n, tau,
		halfLength: 0, radius: -100, cx: n / 2, cy: n / 2,
	});
	const k = (2 * Math.PI) / n;
	s.setHydro((x, y) => [1, U * Math.cos(k * x) * Math.sin(k * y), -U * Math.sin(k * x) * Math.cos(k * y)]);
	s.run(steps);

	// fit decay: kinetic energy E(t) = E(0) exp(-4 nu k^2 t)
	let e = 0;
	for (let y = 0; y < n; y++)
		for (let x = 0; x < n; x++) {
			const [u, v] = s.velocity(x, y);
			e += u * u + v * v;
		}
	const e0 = (U * U * n * n) / 2;
	const nuMeasured = -Math.log(e / e0) / (4 * k * k * steps);
	return { nuMeasured, nuExpected: (tau - 0.5) / 3, diag: s.diagnostics() };
}

test("Taylor-Green vortex decays at the theoretical viscosity", () => {
	const { nuMeasured, nuExpected, diag } = taylorGreen({ n: 64, tau: 0.8, U: 0.02, steps: 400 });
	assert.strictEqual(diag.invalid, 0);
	assert.ok(Math.abs(diag.meanDensity - 1) < 1e-3, "mass conserved");
	const relError = Math.abs(nuMeasured - nuExpected) / nuExpected;
	assert.ok(relError < 0.05, `viscosity error ${(relError * 100).toFixed(2)}% (nu=${nuMeasured.toFixed(5)} vs ${nuExpected.toFixed(5)})`);
});

test("quiescent fluid stays exactly quiescent", () => {
	const s = new Solver({ width: 32, height: 32, radius: -100 });
	s.run(50);
	const d = s.diagnostics();
	assert.strictEqual(d.invalid, 0);
	assert.ok(d.maxVelocity < 1e-6);
	assert.ok(Math.abs(d.meanDensity - 1) < 1e-6); // float32 state
});
