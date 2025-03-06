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
		VORTICITY: 0,
		STREAMFUNCTION: 1,
		VELOCITY: 2,
		MAP: 3,
		DISTRIBUTION: 4,
	};
	const BINDINGS_BUFFER = { INTERACTION: 5, CANVAS: 6 };

	const xmap = new Array(canvas.size.height);
	for (let i = 0; i < canvas.size.height; i++) {
		xmap[i] = [];

		for (let j = 0; j < canvas.size.width; j++) {
			xmap[i].push(j / canvas.size.width);
		}
	}

	const ymap = new Array(canvas.size.height);
	for (let i = 0; i < canvas.size.height; i++) {
		ymap[i] = [];

		for (let j = 0; j < canvas.size.width; j++) {
			ymap[i].push(i / canvas.size.height);
		}
	}

	const textures = setupTextures(
		device,
		Object.values(BINDINGS_TEXTURE),
		{},
		{
			depthOrArrayLayers: {
				[BINDINGS_TEXTURE.VORTICITY]: 1,
				[BINDINGS_TEXTURE.STREAMFUNCTION]: 1,
				[BINDINGS_TEXTURE.VELOCITY]: 2,
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
		code: prependIncludes(timestepComputeShader, [bindings, cacheUtils]),
	});

	const interactionPipeline = device.createComputePipeline({
		label: "interactionPipeline",
		layout: pipelineLayout,
		compute: {
			entryPoint: "interact",
			module: timestepShaderModule,
		},
	});

	const advectionPipeline = device.createComputePipeline({
		label: "advectionPipeline",
		layout: pipelineLayout,
		compute: {
			entryPoint: "advection",
			module: timestepShaderModule,
		},
	});

	const projectionPipeline = device.createComputePipeline({
		label: "projectionPipeline",
		layout: pipelineLayout,
		compute: {
			entryPoint: "projection",
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

		// interact
		computePass.setPipeline(interactionPipeline);
		device.queue.writeBuffer(interactions.buffer, 0, interactions.data);
		computePass.dispatchWorkgroups(...WORKGROUP_COUNT);

		// project
		computePass.setPipeline(projectionPipeline);
		for (let i = 0; i < 30; i++) {
			computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
		}

		// advect
		computePass.setPipeline(advectionPipeline);
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
