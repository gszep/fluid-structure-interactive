import {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	createFieldTexture,
	writeFieldTexture,
	setupInteractions,
	prependIncludes,
} from "./utils";

import common from "./shaders/includes/common.wgsl";
import computeShader from "./shaders/lbrmt.comp.wgsl";
import vertexShader from "./shaders/quad.vert.wgsl";
import fragmentShader from "./shaders/render.frag.wgsl";

const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
	navigator.userAgent
);

const SIM_SCALE = isMobile ? 3 : 2; // canvas pixels per simulation cell
const SUBSTEPS = isMobile ? 2 : 8; // simulation steps per rendered frame
const WORKGROUP_SIZE = 8;

async function main(): Promise<void> {
	const device = await requestDevice();
	const canvas = configureCanvas(device);
	const grid = {
		width: Math.ceil(canvas.size.width / SIM_SCALE),
		height: Math.ceil(canvas.size.height / SIM_SCALE),
	};

	// ------------------------- simulation parameters -------------------------
	// scenes:
	//   rotors  (default) - four rotors in contact, JCP paper section 4.2
	//   rotor             - one seven-pointed rotor, thesis section 3.3
	//   flapper           - swimming actuated capsule
	const scene =
		new URLSearchParams(window.location.search).get("scene") ?? "rotors";
	const shape = { flapper: 0, rotor: 1, rotors: 2 }[scene] ?? 2;
	const scale = Math.min(grid.width, grid.height);
	// four-rotor scene (paper Fig. 9): each rotor lives in an L x L box with
	// prong length 0.2L and pivot radius 0.025L; the lattice pitch is L/2 of
	// the shorter screen dimension, so facing prongs exactly touch
	const L = Math.min(grid.width, grid.height);
	const muscleRadius = 0.018 * scale;
	const settings = {
		tau: shape === 0 ? 0.65 : 0.7, // LB relaxation time; nu = (tau - 0.5) / 3
		// rotors need stiff prongs: tip speed must stay well below the shear
		// wave speed sqrt(G) or the arms wind up and shear off
		shearModulus: shape === 0 ? 0.06 : 0.1,
		bulkModulus: shape === 0 ? 0.18 : 0.3, // kappa ~ 3G
		epsilon: 2.0, // blur-zone half-width (cells)
		center:
			shape === 2
				? [grid.width / 4, grid.height / 4]
				: [grid.width / 2, grid.height / 2],
		// flapper: capsule half-length; rotor: star tip radius;
		// rotors: smooth-rotor prong length (0.2L, paper Fig. 9)
		halfLength: shape === 2 ? 0.2 * L : shape === 1 ? 0.28 * scale : 0.1 * scale,
		// flapper: capsule radius; rotors: prong end-cap radius
		radius: shape === 2 ? 0.05 * L : 0.035 * scale,
		muscleHalfLength: 0.06 * scale,
		// flapper: muscle radius; rotors: prong fillet radius
		muscleRadius: shape === 2 ? 0.05 * L : muscleRadius,
		actuationAmp: Math.log(2.0) / muscleRadius, // max active stretch 2x
		actuationFreq: (2 * Math.PI) / 500, // one stroke every 500 steps
		shape: shape,
		pivotRadius: shape === 2 ? 0.025 * L : 0.04 * scale,
		spinAngle: Math.PI, // theta(t) = spinAngle * (1 - cos(spinFreq t))
		// one revolution out and one back per cycle; slow enough for the
		// elastic prongs to follow the drive
		spinFreq: (2 * Math.PI) / (shape === 2 ? 20000 : 3000),
	};

	const paramsData = new ArrayBuffer(80);
	const paramsU32 = new Uint32Array(paramsData);
	const paramsF32 = new Float32Array(paramsData);
	paramsU32.set([grid.width, grid.height, 0, SUBSTEPS], 0);
	paramsF32.set(
		[
			settings.tau,
			settings.shearModulus,
			settings.bulkModulus,
			settings.epsilon,
			...settings.center,
			settings.halfLength,
			settings.radius,
			settings.muscleHalfLength,
			settings.muscleRadius,
			settings.actuationAmp,
			settings.actuationFreq,
		],
		4
	);
	paramsU32.set([settings.shape], 16);
	paramsF32.set(
		[settings.pivotRadius, settings.spinAngle, settings.spinFreq],
		17
	);

	const paramsBuffer = device.createBuffer({
		label: "Params Buffer",
		size: paramsData.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	const interactions = setupInteractions(
		device,
		canvas.context.canvas as HTMLCanvasElement,
		grid
	);

	// --------------------- state textures (ping-pong) ------------------------
	// reference map xi = (X, Y) and D2Q9 populations f_0..f_8
	const xi = [0, 1].map((i) =>
		createFieldTexture(device, `xi${i}`, grid, "rg32float")
	);
	const dist = [0, 1].map((i) =>
		createFieldTexture(device, `dist${i}`, grid, "r32float", 9)
	);

	// identity reference map
	const cells = grid.width * grid.height;
	const xiInit = new Float32Array(cells * 2);
	for (let y = 0; y < grid.height; y++) {
		for (let x = 0; x < grid.width; x++) {
			const i = 2 * (y * grid.width + x);
			xiInit[i] = x;
			xiInit[i + 1] = y;
		}
	}
	xi.forEach((t) => writeFieldTexture(device, t, grid, 1, 8, xiInit));

	// equilibrium populations of a quiescent fluid (rho = 1, v = 0)
	const weights = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
	const fInit = new Float32Array(cells * 9);
	weights.forEach((w, layer) => fInit.fill(w, layer * cells, (layer + 1) * cells));
	dist.forEach((t) => writeFieldTexture(device, t, grid, 9, 4, fInit));

	// ------------------------------ pipelines --------------------------------
	const computeLayout = device.createBindGroupLayout({
		label: "computeLayout",
		entries: [
			{ binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
			{ binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
			{ binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "unfilterable-float" } },
			{ binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "unfilterable-float", viewDimension: "2d-array" } },
			{ binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: "write-only", format: "rg32float" } },
			{ binding: 5, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: "write-only", format: "r32float", viewDimension: "2d-array" } },
		],
	});
	const renderLayout = device.createBindGroupLayout({
		label: "renderLayout",
		entries: [
			{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
			{ binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float" } },
			{ binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float", viewDimension: "2d-array" } },
		],
	});

	const computeModule = device.createShaderModule({
		label: "lbrmtComputeShader",
		code: prependIncludes(computeShader, [common]),
	});
	const computePipelineLayout = device.createPipelineLayout({
		bindGroupLayouts: [computeLayout],
	});
	const [advectPipeline, collidePipeline] = ["advect", "collide"].map(
		(entryPoint) =>
			device.createComputePipeline({
				label: entryPoint,
				layout: computePipelineLayout,
				compute: { module: computeModule, entryPoint: entryPoint },
			})
	);

	const quad = setupVertexBuffer(
		device,
		"Quad Vertex Buffer",
		[-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]
	);
	const renderPipeline = device.createRenderPipeline({
		label: "renderPipeline",
		layout: device.createPipelineLayout({ bindGroupLayouts: [renderLayout] }),
		vertex: {
			module: device.createShaderModule({
				label: "quadVertexShader",
				code: vertexShader,
			}),
			buffers: [
				{
					arrayStride: quad.arrayStride,
					attributes: [{ format: quad.format, offset: 0, shaderLocation: 0 }],
				},
			],
		},
		fragment: {
			module: device.createShaderModule({
				label: "renderFragmentShader",
				code: prependIncludes(fragmentShader, [common]),
			}),
			targets: [{ format: canvas.format }],
		},
	});

	// ------------------------------ bind groups ------------------------------
	const xiViews = xi.map((t) => t.createView());
	const fViews = dist.map((t) => t.createView());

	const computeBindGroup = (
		label: string,
		xiSrc: number,
		fSrc: number,
		xiDst: number,
		fDst: number
	) =>
		device.createBindGroup({
			label: label,
			layout: computeLayout,
			entries: [
				{ binding: 0, resource: { buffer: paramsBuffer } },
				{ binding: 1, resource: { buffer: interactions.buffer } },
				{ binding: 2, resource: xiViews[xiSrc] },
				{ binding: 3, resource: fViews[fSrc] },
				{ binding: 4, resource: xiViews[xiDst] },
				{ binding: 5, resource: fViews[fDst] },
			],
		});

	// d = index of the textures holding the current state
	// advect: reads xi[d], f[d] -> writes xi[1-d]
	// collide: reads xi[1-d] (new), f[d] -> writes f[1-d]
	const advectGroups = [0, 1].map((d) =>
		computeBindGroup(`advect${d}`, d, d, 1 - d, 1 - d)
	);
	const collideGroups = [0, 1].map((d) =>
		computeBindGroup(`collide${d}`, 1 - d, d, d, 1 - d)
	);
	const renderGroups = [0, 1].map((d) =>
		device.createBindGroup({
			label: `render${d}`,
			layout: renderLayout,
			entries: [
				{ binding: 0, resource: { buffer: paramsBuffer } },
				{ binding: 1, resource: xiViews[d] },
				{ binding: 2, resource: fViews[d] },
			],
		})
	);

	// ------------------------------ main loop --------------------------------
	const workgroups: [number, number] = [
		Math.ceil(grid.width / WORKGROUP_SIZE),
		Math.ceil(grid.height / WORKGROUP_SIZE),
	];

	let current = 0;
	let step = 0;

	// staging buffer to read back the reference map under a grab click:
	// the grabbed material point is identified by its reference coordinates
	const grabStaging = device.createBuffer({
		label: "Grab Staging Buffer",
		size: 256,
		usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
	});
	let grabInFlight = false;

	function requestGrab(at: [number, number]) {
		grabInFlight = true;
		const encoder = device.createCommandEncoder();
		encoder.copyTextureToBuffer(
			{
				texture: xi[current],
				origin: {
					x: Math.min(Math.max(Math.floor(at[0]), 0), grid.width - 1),
					y: Math.min(Math.max(Math.floor(at[1]), 0), grid.height - 1),
				},
			},
			{ buffer: grabStaging, bytesPerRow: 256 },
			{ width: 1, height: 1 }
		);
		device.queue.submit([encoder.finish()]);
		grabStaging.mapAsync(GPUMapMode.READ).then(() => {
			const xiGrab = new Float32Array(grabStaging.getMappedRange(0, 8));
			interactions.data[6] = xiGrab[0];
			interactions.data[7] = xiGrab[1];
			// activate only if the button is still held
			interactions.data[3] = interactions.data[2] > 0 ? 1 : 0;
			grabStaging.unmap();
			grabInFlight = false;
		});
	}

	function frame() {
		interactions.update();
		const grabAt = interactions.consumeGrabRequest();
		if (grabAt && !grabInFlight) requestGrab(grabAt);
		paramsU32[2] = step;
		device.queue.writeBuffer(paramsBuffer, 0, paramsData);
		device.queue.writeBuffer(interactions.buffer, 0, interactions.data);

		const encoder = device.createCommandEncoder();

		const compute = encoder.beginComputePass();
		for (let s = 0; s < SUBSTEPS; s++) {
			compute.setPipeline(advectPipeline);
			compute.setBindGroup(0, advectGroups[current]);
			compute.dispatchWorkgroups(...workgroups);

			compute.setPipeline(collidePipeline);
			compute.setBindGroup(0, collideGroups[current]);
			compute.dispatchWorkgroups(...workgroups);

			current = 1 - current;
		}
		compute.end();
		step += SUBSTEPS;

		const render = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: canvas.context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					storeOp: "store",
				},
			],
		});
		render.setPipeline(renderPipeline);
		render.setBindGroup(0, renderGroups[current]);
		render.setVertexBuffer(0, quad.vertexBuffer);
		render.draw(quad.vertexCount);
		render.end();

		device.queue.submit([encoder.finish()]);
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}

main();
