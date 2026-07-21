// Long-run stability tests using the CUDA reference (cuda/lbrmt.cu), which
// mirrors the WGSL solver line-for-line at production resolution. Skipped
// when nvcc / the built binary is unavailable.
//
// These ladder up to the publication scenarios that are too expensive for the
// CPU reference: full alternating revolutions of anchored rotors (thesis
// section 3.3 / JCP paper section 4.2).
import test from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const CUDA_DIR = join(process.cwd(), "cuda");
const BINARY = join(CUDA_DIR, "build", "lbrmt");

function ensureBinary(): boolean {
	if (existsSync(BINARY)) return true;
	if (spawnSync("which", ["nvcc"]).status !== 0) return false;
	return spawnSync("make", [], { cwd: CUDA_DIR }).status === 0;
}

interface Metrics {
	step: number;
	drive: number;
	rot: number;
	mass: number;
	area_pct: number;
	debris_pct: number;
	drift: number;
	maxv: number;
	invalid: number;
}

function run(args: string[]): Metrics[] {
	const proc = spawnSync(BINARY, args, { encoding: "utf8", timeout: 300000 });
	assert.strictEqual(proc.status, 0, proc.stderr);
	return proc.stdout
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line) as Metrics);
}

const available = ensureBinary();

test("CUDA: seven-star rotor survives two full alternating revolutions", { skip: !available }, () => {
	const rows = run(["--scene", "rotor", "--n", "448", "--steps", "108000", "--report", "27000"]);
	const rest = rows.filter((r) => Math.abs(r.drive) < 1e-3 && r.step > 0);
	assert.ok(rest.length >= 2, "sampled at cycle boundaries");
	for (const r of rows) {
		assert.strictEqual(r.invalid, 0, `no NaN at step ${r.step}`);
		assert.ok(Math.abs(r.mass - 1) < 0.01, `mass conserved at step ${r.step} (${r.mass})`);
		assert.ok(r.maxv < 0.6, `velocities bounded at step ${r.step} (${r.maxv})`);
	}
	for (const r of rest) {
		assert.ok(Math.abs(r.area_pct) < 15, `area drift ${r.area_pct}% at step ${r.step}`);
		assert.ok(r.debris_pct < 2, `debris ${r.debris_pct}% at step ${r.step}`);
		assert.ok(r.drift < 5, `anchor drift ${r.drift} cells at step ${r.step}`);
		assert.ok(Math.abs(r.rot) < 0.5, `rotor returned to rest (${r.rot} rad) at step ${r.step}`);
	}
});

test("CUDA: rotor tracks the drive mid-revolution", { skip: !available }, () => {
	const rows = run(["--scene", "rotor", "--n", "448", "--steps", "27000", "--report", "13500"]);
	// at t = T/4 the drive is at pi; the (2pi-wrapped) material rotation
	// should be within ~1.5 rad of it
	const mid = rows.find((r) => r.step === 13500)!;
	const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
	const lag = Math.abs(wrap(mid.drive - mid.rot));
	assert.ok(lag < 1.5, `rotation lag ${lag.toFixed(2)} rad at drive ${mid.drive.toFixed(2)}`);
});

test("CUDA: four-rotor lattice survives a full revolution cycle", { skip: !available }, () => {
	const rows = run(["--scene", "rotors", "--n", "448", "--steps", "54000", "--report", "13500"]);
	for (const r of rows) {
		assert.strictEqual(r.invalid, 0, `no NaN at step ${r.step}`);
		assert.ok(Math.abs(r.mass - 1) < 0.01, `mass conserved at step ${r.step}`);
		assert.ok(r.maxv < 0.6, `velocities bounded at step ${r.step}`);
		// the prongs puff transiently mid-revolution (the corridors between
		// rotors cannot be gated because the gates overlap); they relax at rest
		assert.ok(Math.abs(r.area_pct) < 70, `area drift ${r.area_pct}% at step ${r.step}`);
	}
	const rest = rows[rows.length - 1];
	assert.ok(Math.abs(rest.area_pct) < 40, `area at cycle end ${rest.area_pct}%`);
});

test("CUDA: flapper stays coherent while swimming", { skip: !available }, () => {
	const rows = run(["--scene", "flapper", "--n", "448", "--steps", "8000", "--report", "2000"]);
	for (const r of rows) {
		assert.strictEqual(r.invalid, 0);
		assert.ok(Math.abs(r.mass - 1) < 0.005);
		assert.ok(Math.abs(r.area_pct) < 5, `area drift ${r.area_pct}%`);
		assert.ok(r.maxv < 0.2);
	}
});
