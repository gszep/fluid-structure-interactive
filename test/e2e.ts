// End-to-end smoke test: build output is served locally, Chrome is driven via
// the DevTools protocol (non-headless: WebGPU needs real drivers), and we
// assert that the simulation initializes without errors and animates.
//
// Run with: npm run test:e2e   (requires google-chrome and a display)
import test from "node:test";
import assert from "node:assert";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

const DOCS = join(process.cwd(), "docs"); // tests run from the repo root
const CHROME =
	["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find(existsSync);

const MIME: Record<string, string> = {
	".html": "text/html",
	".js": "text/javascript",
};

function serve(): Promise<{ server: Server; port: number }> {
	const server = createServer((req, res) => {
		const path = join(DOCS, req.url === "/" ? "index.html" : req.url!);
		try {
			const body = readFileSync(path);
			res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
			res.end(body);
		} catch {
			res.writeHead(404);
			res.end();
		}
	});
	return new Promise((resolve) =>
		server.listen(0, "127.0.0.1", () =>
			resolve({ server, port: (server.address() as { port: number }).port })
		)
	);
}

/** Minimal Chrome DevTools protocol client over the built-in WebSocket. */
class CDP {
	private ws: WebSocket;
	private id = 0;
	private pending = new Map<number, (result: unknown) => void>();
	events: { method: string; params: unknown }[] = [];

	constructor(ws: WebSocket) {
		this.ws = ws;
		ws.addEventListener("message", (event) => {
			const msg = JSON.parse(event.data as string);
			if (msg.id !== undefined) this.pending.get(msg.id)?.(msg.result);
			else this.events.push({ method: msg.method, params: msg.params });
		});
	}

	static async connect(url: string): Promise<CDP> {
		const ws = new WebSocket(url);
		await new Promise((resolve, reject) => {
			ws.addEventListener("open", resolve);
			ws.addEventListener("error", reject);
		});
		return new CDP(ws);
	}

	send(method: string, params: object = {}): Promise<unknown> {
		const id = ++this.id;
		this.ws.send(JSON.stringify({ id, method, params }));
		return new Promise((resolve) => this.pending.set(id, resolve));
	}

	close(): void {
		this.ws.close();
	}
}

test("simulation runs in Chrome without errors and animates", { skip: !CHROME }, async () => {
	const { server, port } = await serve();
	const userDataDir = mkdtempSync(join(tmpdir(), "fsi-e2e-"));
	const chrome: ChildProcess = spawn(
		CHROME!,
		[
			`--user-data-dir=${userDataDir}`,
			"--no-first-run",
			"--no-default-browser-check",
			"--enable-unsafe-webgpu",
			"--enable-features=Vulkan",
			"--remote-debugging-port=0",
			"--window-size=800,600",
			`http://127.0.0.1:${port}/`,
		],
		{ stdio: "ignore" }
	);

	try {
		// discover the DevTools port from the profile directory
		let debugPort = 0;
		for (let i = 0; i < 50 && !debugPort; i++) {
			await sleep(200);
			try {
				debugPort = parseInt(
					readFileSync(join(userDataDir, "DevToolsActivePort"), "utf8").split("\n")[0]
				);
			} catch {}
		}
		assert.ok(debugPort, "chrome debug port found");

		// find the page target and attach
		let pageWs = "";
		for (let i = 0; i < 50 && !pageWs; i++) {
			await sleep(200);
			try {
				const targets = (await (
					await fetch(`http://127.0.0.1:${debugPort}/json`)
				).json()) as { type: string; url: string; webSocketDebuggerUrl: string }[];
				pageWs =
					targets.find((t) => t.type === "page" && t.url.includes(`${port}`))
						?.webSocketDebuggerUrl ?? "";
			} catch {}
		}
		assert.ok(pageWs, "page target found");

		const cdp = await CDP.connect(pageWs);
		await cdp.send("Runtime.enable");
		await cdp.send("Log.enable");
		await cdp.send("Page.enable");

		// let the simulation initialize and run
		await sleep(4000);

		// no uncaught exceptions or error-level console entries
		const errors = cdp.events.filter(
			(e) =>
				e.method === "Runtime.exceptionThrown" ||
				(e.method === "Log.entryAdded" &&
					(e.params as { entry: { level: string; source: string } }).entry.level === "error" &&
					(e.params as { entry: { source: string } }).entry.source !== "network") ||
				(e.method === "Runtime.consoleAPICalled" &&
					(e.params as { type: string }).type === "error")
		);
		assert.deepStrictEqual(
			errors.map((e) => JSON.stringify(e.params)),
			[],
			"no page errors"
		);

		// WebGPU canvas exists
		const hasCanvas = (await cdp.send("Runtime.evaluate", {
			expression: "!!document.querySelector('canvas')",
			returnByValue: true,
		})) as { result: { value: boolean } };
		assert.ok(hasCanvas.result.value, "canvas created (WebGPU initialized)");

		// the render loop animates: two screenshots taken apart must differ
		const shot = async () =>
			((await cdp.send("Page.captureScreenshot", { format: "png" })) as { data: string }).data;
		const a = await shot();
		await sleep(1500);
		const b = await shot();
		writeFileSync("/tmp/fsi-e2e-a.png", Buffer.from(a, "base64"));
		writeFileSync("/tmp/fsi-e2e-b.png", Buffer.from(b, "base64"));
		assert.notStrictEqual(a, b, "frames differ over time (simulation animates)");

		cdp.close();
	} finally {
		chrome.kill("SIGKILL");
		server.close();
	}
});
