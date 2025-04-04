import {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	setupTextures,
	setupInteractions,
	prependIncludes,
} from "./utils";

import bindings from "./shaders/includes/bindings.wgsl";
import cacheUtils from "./shaders/includes/cache.wgsl";

import cellVertexShader from "./shaders/cell.vert.wgsl";
import cellFragmentShader from "./shaders/cell.frag.wgsl";
import timestepComputeShader from "./shaders/vorticity-streamfunction.comp.wgsl";

const UPDATE_INTERVAL = 1;
let frame_index = 0;

const lattice_vector = [
	[0, 0],
	[1, 0],
	[0, 1],
	[-1, 0],
	[0, -1],
	[1, 1],
	[-1, 1],
	[-1, -1],
	[1, -1],
];
const lattice_weight = [
	4.0 / 9.0,
	1.0 / 9.0,
	1.0 / 9.0,
	1.0 / 9.0,
	1.0 / 9.0,
	1.0 / 36.0,
	1.0 / 36.0,
	1.0 / 36.0,
	1.0 / 36.0,
];

function initialDensity(height: number, width: number) {
	const density = [];
	for (let i = 0; i < height; i++) {
		const row = [];
		for (let j = 0; j < width; j++) {
			const centerX = width / 2;
			const centerY = height / 2;
			const dx = j - centerX;
			const dy = i - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const sigma = 10;
			const rho = Math.exp((-distance * distance) / (2 * sigma * sigma));

			row.push([1]);
		}
		density.push(row);
	}
	return density;
}

function initialVelocity(height: number, width: number) {
	// Create empty nested array structure
	const velocityField = [];

	// Fill with velocity components
	for (let i = 0; i < height; i++) {
		const row = [];
		for (let j = 0; j < width; j++) {
			// For each cell, store [vx, vy] components
			// Create a simple circular flow pattern as an example
			// const centerX = width / 2;
			// const centerY = height / 2;
			// const dx = j - centerX;
			// const dy = i - centerY;
			// const distance = Math.sqrt(dx * dx + dy * dy);

			// // Create circular velocity field
			// const sigma = 50;
			// var rho = Math.exp((-distance * distance) / (2 * sigma * sigma));

			// rho = rho * Math.exp((-(distance - 50) * (distance - 50)) / 200);
			// const vx = (dy / distance) * rho;
			// const vy = (dx / distance) * rho;

			// random velocity
			const vx = Math.random() * 2 - 1; // Random value between -1 and 1
			const vy = Math.random() * 2 - 1; // Random value between -1 and 1

			row.push([vx / 10, vy / 10]);
		}
		velocityField.push(row);
	}

	return velocityField;
}

function initialReferenceMap(height: number, width: number) {
	const map = [];
	for (let i = 0; i < height; i++) {
		const row = [];
		for (let j = 0; j < width; j++) {
			row.push([j, i]);
		}
		map.push(row);
	}
	return map;
}

function computeEquilibrium(density: number[][][], velocity: number[][][]) {
	const equilibrium = [];
	const height = density.length;
	const width = density[0].length;
	for (let i = 0; i < height; i++) {
		const row = [];
		for (let j = 0; j < width; j++) {
			const cell = [];
			for (let k = 0; k < 9; k++) {
				const speed = Math.sqrt(
					velocity[i][j][0] * velocity[i][j][0] +
						velocity[i][j][1] * velocity[i][j][1]
				);
				const lattice_speed =
					lattice_vector[k][0] * velocity[i][j][0] +
					lattice_vector[k][1] * velocity[i][j][1];

				const f_eq =
					lattice_weight[k] *
					density[i][j][0] *
					(1.0 +
						3.0 * lattice_speed +
						4.5 * lattice_speed * lattice_speed -
						1.5 * speed * speed);

				cell.push(f_eq);
			}
			row.push(cell);
		}
		equilibrium.push(row);
	}
	return equilibrium;
}

async function index(): Promise<void> {
	// setup and configure WebGPU
	const device = await requestDevice();
	const canvas = configureCanvas(device);

	// initialize vertex buffer and textures
	const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
	const quad = setupVertexBuffer(device, "Quad Vertex Buffer", QUAD);

	const GROUP_INDEX = 0;
	const VERTEX_INDEX = 0;
	const RENDER_INDEX = 0;

	const BINDINGS_TEXTURE = {
		FORCE: 0,
		MAP: 1,
		DISTRIBUTION: 2,
	};
	const BINDINGS_BUFFER = { INTERACTION: 3, CANVAS: 4 };
	// canvas.size = { width: 64, height: 64 };

	const density = initialDensity(canvas.size.height, canvas.size.width);
	const velocity = initialVelocity(canvas.size.height, canvas.size.width);
	const equilibrium = computeEquilibrium(density, velocity);
	const map = initialReferenceMap(canvas.size.height, canvas.size.width);

	const textures = setupTextures(
		device,
		Object.values(BINDINGS_TEXTURE),
		{
			[BINDINGS_TEXTURE.DISTRIBUTION]: equilibrium,
			[BINDINGS_TEXTURE.MAP]: map,
		},
		{
			depthOrArrayLayers: {
				[BINDINGS_TEXTURE.DISTRIBUTION]: 9,
				[BINDINGS_TEXTURE.FORCE]: 2,
				[BINDINGS_TEXTURE.MAP]: 2,
			},
			width: canvas.size.width,
			height: canvas.size.height,
		}
	);

	const WORKGROUP_SIZE = 8;
	const TILE_SIZE = 2;
	const HALO_SIZE = 1;

	const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;
	const DISPATCH_SIZE = CACHE_SIZE - 2 * HALO_SIZE;

	const WORKGROUP_COUNT: [number, number] = [
		Math.ceil(textures.size.width / DISPATCH_SIZE),
		Math.ceil(textures.size.height / DISPATCH_SIZE),
	];

	// setup interactions
	const interactions = setupInteractions(
		device,
		canvas.context.canvas,
		textures.size
	);

	const bindGroupLayout = device.createBindGroupLayout({
		label: "bindGroupLayout",
		entries: [
			...Object.values(BINDINGS_TEXTURE).map((binding) => ({
				binding: binding,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: textures.bindingLayout[binding],
			})),
			...Object.values(BINDINGS_BUFFER).map((binding) => ({
				binding: binding,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				buffer: { type: "uniform" as GPUBufferBindingType },
			})),
		],
	});

	const bindGroup = device.createBindGroup({
		label: `Bind Group`,
		layout: bindGroupLayout,
		entries: [
			...Object.values(BINDINGS_TEXTURE).map((binding) => ({
				binding: binding,
				resource: textures.textures[binding].createView(),
			})),
			...Object.values(BINDINGS_BUFFER).map((binding) => ({
				binding: binding,
				resource: {
					buffer:
						binding === BINDINGS_BUFFER.INTERACTION
							? interactions.buffer
							: textures.canvas.buffer,
				},
			})),
		],
	});

	const pipelineLayout = device.createPipelineLayout({
		label: "pipelineLayout",
		bindGroupLayouts: [bindGroupLayout],
	});

	// compile shaders
	const timestepShaderModule = device.createShaderModule({
		label: "timestepComputeShader",
		code: prependIncludes(timestepComputeShader, [cacheUtils, bindings]),
	});

	const latticeBoltzmannPipeline = device.createComputePipeline({
		label: "latticeBoltzmannPipeline",
		layout: pipelineLayout,
		compute: {
			entryPoint: "lattice_boltzmann",
			module: timestepShaderModule,
		},
	});

	const renderPipeline = device.createRenderPipeline({
		label: "renderPipeline",
		layout: pipelineLayout,
		vertex: {
			module: device.createShaderModule({
				code: prependIncludes(cellVertexShader, [bindings]),
				label: "cellVertexShader",
			}),
			buffers: [
				{
					arrayStride: quad.arrayStride,
					attributes: [
						{
							format: quad.format,
							offset: 0,
							shaderLocation: VERTEX_INDEX,
						},
					],
				},
			],
		},
		fragment: {
			module: device.createShaderModule({
				code: prependIncludes(cellFragmentShader, [bindings]),
				label: "cellFragmentShader",
			}),
			targets: [
				{
					format: canvas.format,
				},
			],
		},
	});

	const colorAttachments: GPURenderPassColorAttachment[] = [
		{
			view: canvas.context.getCurrentTexture().createView(),
			loadOp: "load",
			storeOp: "store",
		},
	];
	const renderPassDescriptor = {
		colorAttachments: colorAttachments,
	};

	function render() {
		const command = device.createCommandEncoder();

		// compute pass
		const computePass = command.beginComputePass();
		computePass.setBindGroup(GROUP_INDEX, bindGroup);

		// interactions
		device.queue.writeBuffer(interactions.buffer, 0, interactions.data);

		// lattice boltzmann method
		computePass.setPipeline(latticeBoltzmannPipeline);
		computePass.dispatchWorkgroups(...WORKGROUP_COUNT);

		computePass.end();

		// render pass
		const texture = canvas.context.getCurrentTexture();
		const view = texture.createView();

		renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
		const renderPass = command.beginRenderPass(renderPassDescriptor);
		renderPass.setBindGroup(GROUP_INDEX, bindGroup);

		renderPass.setPipeline(renderPipeline);
		renderPass.setVertexBuffer(VERTEX_INDEX, quad.vertexBuffer);

		renderPass.draw(quad.vertexCount);
		renderPass.end();

		// submit the command buffer
		device.queue.submit([command.finish()]);
		texture.destroy();
		frame_index++;
	}

	setInterval(render, UPDATE_INTERVAL);
	return;
}

index();
