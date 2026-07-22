// Validate the WGSL shaders with naga (cargo install naga-cli).
// Usage: node scripts/validate-wgsl.mjs
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const SHADERS = join(process.cwd(), "src", "shaders");
const common = readFileSync(join(SHADERS, "includes", "common.wgsl"), "utf8");
const prepend = (code) => common + "\n" + code.replace(/^#import.*/gm, "");

const dir = mkdtempSync(join(tmpdir(), "wgsl-"));
const targets = {
	"compute.wgsl": prepend(readFileSync(join(SHADERS, "lbrmt.comp.wgsl"), "utf8")),
	"frag.wgsl": prepend(readFileSync(join(SHADERS, "render.frag.wgsl"), "utf8")),
	"vert.wgsl": readFileSync(join(SHADERS, "quad.vert.wgsl"), "utf8"),
};

let failed = false;
for (const [name, code] of Object.entries(targets)) {
	const path = join(dir, name);
	writeFileSync(path, code);
	const result = spawnSync("naga", [path], { encoding: "utf8" });
	if (result.status !== 0) {
		console.error(`${name}: FAILED\n${result.stdout}${result.stderr}`);
		failed = true;
	} else {
		console.log(`${name}: ok`);
	}
}
process.exit(failed ? 1 : 0);
