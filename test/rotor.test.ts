// Seven-pointed rotor in initially quiescent flow (thesis section 3.3):
// an oscillatory anchor force at the pivot spins the star, twisting its arms
// through the fluid and shedding vortices, while the solid stays coherent.
import test from "node:test";
import assert from "node:assert";
import { Solver, sevenStar, smoothRotor, unwrap } from "./reference.ts";

test("smooth rotor SDF: three-fold symmetry, prong tips at l + r", () => {
	const [l, r, s] = [20, 5, 5];
	assert.ok(smoothRotor(0, 0, l, r, s) < 0, "centre inside");
	for (let k = 0; k < 3; k++) {
		const a = (2 * Math.PI * k) / 3;
		const tip = smoothRotor((l + r) * Math.cos(a), (l + r) * Math.sin(a), l, r, s);
		assert.ok(Math.abs(tip) < 0.5, `prong tip ${k} on the boundary (phi=${tip.toFixed(3)})`);
	}
	assert.ok(smoothRotor(1.3 * (l + r), 0, l, r, s) > 0, "beyond a tip is fluid");
});

test("four-rotor lattice: rows spin in opposite directions, all stay coherent", () => {
	const n = 96;
	const swing = 800;
	const pitch = n / 2;
	const s = new Solver({
		width: n, height: n, cx: n / 4, cy: n / 4, tau: 0.8,
		G: 0.03, kappa: 0.09,
		shape: 2,
		halfLength: 0.2 * n, // prong length: facing prongs exactly touch
		radius: 0.05 * n,
		muscleRadius: 0.05 * n,
		pivotRadius: 0.025 * n,
		spinAngle: Math.PI / 4,
		spinFreq: (2 * Math.PI) / swing,
		actuationAmp: 0,
	});
	const before = s.diagnostics();

	// mean rotation angle of the solid material of each rotor row
	const rowRotation = (): [number, number] => {
		const sums = [0, 0], counts = [0, 0];
		for (let y = 0; y < n; y++)
			for (let x = 0; x < n; x++) {
				const k = y * n + x;
				if (s.solidFraction(s.levelSet(s.xiX[k], s.xiY[k])) < 0.5) continue;
				const [px, py, spin] = s.rotorLattice(
					unwrap(x - s.cx, 0, n), unwrap(y - s.cy, 0, n));
				if (px * px + py * py < 25) continue;
				const [X, Y] = s.rotorLattice(...s.refCoord(s.xiX[k], s.xiY[k]));
				const row = spin > 0 ? 0 : 1;
				sums[row] -= Math.atan2(px * Y - py * X, px * X + py * Y);
				counts[row]++;
			}
		return [sums[0] / counts[0], sums[1] / counts[1]];
	};

	s.run(swing / 2); // drive at maximum angle
	const [top, bottom] = rowRotation();
	const after = s.diagnostics();
	assert.strictEqual(after.invalid, 0);
	assert.ok(Math.abs(after.meanDensity - 1) < 1e-3, "mass conserved");
	assert.ok(top > 0.3, `top row rotated with the drive (${top.toFixed(2)} rad)`);
	assert.ok(bottom < -0.3, `bottom row rotated against (${bottom.toFixed(2)} rad)`);
	const areaChange = Math.abs(after.solidArea - before.solidArea) / before.solidArea;
	assert.ok(areaChange < 0.15, `solid area drift ${(areaChange * 100).toFixed(1)}%`);
});

test("seven-pointed star SDF has 7-fold symmetry and correct extent", () => {
	const cr = 20;
	// centre is inside, tips are on the boundary, beyond tips is outside
	assert.ok(sevenStar(0, 0, cr) < 0);
	for (let k = 0; k < 7; k++) {
		const a = (2 * Math.PI * k) / 7;
		const tip = sevenStar(cr * Math.cos(a), cr * Math.sin(a), cr);
		assert.ok(Math.abs(tip) < 0.5, `tip ${k} on the boundary (phi=${tip.toFixed(3)})`);
		const beyond = sevenStar(1.2 * cr * Math.cos(a), 1.2 * cr * Math.sin(a), cr);
		assert.ok(beyond > 0, "beyond the tip is fluid");
	}
	// 7-fold rotational symmetry
	for (const [x, y] of [[7, 3], [12, -5], [3, 15]]) {
		const a = (2 * Math.PI) / 7;
		const xr = x * Math.cos(a) - y * Math.sin(a);
		const yr = x * Math.sin(a) + y * Math.cos(a);
		assert.ok(Math.abs(sevenStar(x, y, cr) - sevenStar(xr, yr, cr)) < 1e-6);
	}
});

test("anchored rotor spins with the drive (quarter cycle smoke test)", () => {
	// production-recipe parameters scaled to a small grid; the full-cycle
	// endurance runs live in cuda.test.ts at production resolution
	const n = 64;
	const T = 7600;
	const s = new Solver({
		width: n, height: n, cx: n / 2, cy: n / 2,
		tau: 0.55, G: 0.05, kappa: 0.15,
		shape: 1,
		halfLength: 10.2, radius: 2.6, pivotRadius: 6.4,
		spinAngle: Math.PI,
		spinFreq: (2 * Math.PI) / T,
		friction: 3e-4, heal: 3e-4,
		actuationAmp: 0,
	});
	const before = s.diagnostics();

	const rotation = () => {
		let sum = 0, count = 0;
		for (let y = 0; y < n; y++)
			for (let x = 0; x < n; x++) {
				const k = y * n + x;
				if (s.solidFraction(s.levelSetAt(s.xiX[k], s.xiY[k], x, y)) < 0.5) continue;
				const px = unwrap(x - s.cx, 0, n), py = unwrap(y - s.cy, 0, n);
				if (px * px + py * py < 16) continue;
				const [X, Y] = s.refCoord(s.xiX[k], s.xiY[k]);
				sum -= Math.atan2(px * Y - py * X, px * X + py * Y);
				count++;
			}
		return sum / count;
	};

	s.run(T / 4); // drive reaches pi
	const spun = rotation();
	const after = s.diagnostics();
	assert.strictEqual(after.invalid, 0);
	assert.ok(Math.abs(after.meanDensity - 1) < 1e-3, "mass conserved");
	assert.ok(spun > 0.8, `rotor rotated with the drive (${spun.toFixed(2)} rad, drive at pi)`);
	const areaChange = Math.abs(after.solidArea - before.solidArea) / before.solidArea;
	assert.ok(areaChange < 1.0, `solid area transient ${(areaChange * 100).toFixed(1)}%`);
});
