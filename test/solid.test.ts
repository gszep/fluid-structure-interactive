// Fluid-structure interaction tests: a capsule solid immersed in fluid
// (thesis chapter 3 style scenarios, scaled down for CPU).
import test from "node:test";
import assert from "node:assert";
import { Solver } from "./reference.ts";

test("passive immersed solid stays at rest", () => {
	const s = new Solver({
		width: 96, height: 64, cx: 48, cy: 32,
		halfLength: 10, radius: 4,
	});
	const before = s.diagnostics();
	s.run(300);
	const after = s.diagnostics();
	assert.strictEqual(after.invalid, 0);
	assert.ok(after.maxVelocity < 1e-8, `max velocity ${after.maxVelocity}`);
	assert.ok(Math.abs(after.solidArea - before.solidArea) < 1e-6, "area unchanged");
});

test("poked solid deforms, recovers its area, and the flow settles", () => {
	const s = new Solver({
		width: 96, height: 64, cx: 48, cy: 32,
		halfLength: 10, radius: 4,
	});
	const before = s.diagnostics();
	// push the solid sideways with a localized force blob for a while
	s.externalForce = (x, y, step) => {
		if (step > 200) return [0, 0];
		const dx = x - 48, dy = y - 32;
		return [2e-3 * Math.exp(-(dx * dx + dy * dy) / 50), 0];
	};
	s.run(200);
	const pushed = s.diagnostics();
	assert.ok(pushed.maxVelocity > 1e-3, "the poke moved things");
	assert.ok(pushed.centroid[0] > before.centroid[0] + 0.2, "solid displaced");

	s.run(1200); // relax
	const after = s.diagnostics();
	assert.strictEqual(after.invalid, 0);
	assert.ok(Math.abs(after.meanDensity - 1) < 1e-3, "mass conserved");
	const areaChange = Math.abs(after.solidArea - before.solidArea) / before.solidArea;
	assert.ok(areaChange < 0.1, `solid area drift ${(areaChange * 100).toFixed(1)}%`);
	assert.ok(after.maxVelocity < pushed.maxVelocity, "flow is settling");
});

test("actuated flapper swims without destroying itself", () => {
	const period = 400;
	const s = new Solver({
		width: 128, height: 96, cx: 64, cy: 48, tau: 0.6,
		halfLength: 12, radius: 4.5,
		muscleHalfLength: 8, muscleRadius: 2.5,
		actuationAmp: Math.log(2.0) / 2.5, // max active stretch 2x
		actuationFreq: (2 * Math.PI) / period,
	});
	const before = s.diagnostics();
	s.run(3 * period);
	const after = s.diagnostics();

	assert.strictEqual(after.invalid, 0);
	assert.ok(Math.abs(after.meanDensity - 1) < 1e-3, "mass conserved");
	const areaChange = Math.abs(after.solidArea - before.solidArea) / before.solidArea;
	assert.ok(areaChange < 0.15, `solid area drift ${(areaChange * 100).toFixed(1)}%`);

	const drift = Math.hypot(
		after.centroid[0] - before.centroid[0],
		after.centroid[1] - before.centroid[1]
	);
	assert.ok(drift > 0.5, `flapper swam ${drift.toFixed(2)} cells in 3 periods`);
	assert.ok(after.maxVelocity < 0.3, "velocities stay subsonic");
});
