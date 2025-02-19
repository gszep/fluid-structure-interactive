import {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	setupTextures,
	setupInteractions,
	setValues,
} from "./utils";

import cellVertexShader from "./shaders/cell.vert.wgsl";
import cellFragmentShader from "./shaders/cell.frag.wgsl";
import timestepComputeShader from "./shaders/timestep.comp.wgsl";

const WORKGROUP_SIZE = 16;
const UPDATE_INTERVAL = 1;
let frame_index = 0;

async function index(): Promise<void> {
	// setup and configure WebGPU
	const device = await requestDevice();
	const canvas = configureCanvas(device);
	const GROUP_INDEX = 0;

	// initialize vertex buffer and textures
	const VERTEX_INDEX = 0;
	const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
	const quad = setupVertexBuffer(device, "Quad Vertex Buffer", QUAD);

	const XVELOCITY = 0;
	const YVELOCITY = 1;
	const XMAP = 2;
	const YMAP = 3;
	const VISCOSITY = 4;

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
		[XVELOCITY, YVELOCITY, XMAP, YMAP, VISCOSITY],
		{ [XMAP]: xmap, [YMAP]: ymap },
		{ width: 128, height: 128 }
	);

	const HALO_SIZE = 1;
	const TILE_SIZE = 2;

	const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;
	const DISPATCH_SIZE = CACHE_SIZE - 2 * HALO_SIZE;

	const WORKGROUP_COUNT: [number, number] = [
		Math.ceil(textures.size.width / DISPATCH_SIZE),
		Math.ceil(textures.size.height / DISPATCH_SIZE),
	];

	// setup interactions
	const INTERACTION = 5;
	const interactions = setupInteractions(
		device,
		canvas.context.canvas,
		textures.size
	);

	const bindGroupLayout = device.createBindGroupLayout({
		label: "bindGroupLayout",
		entries: [
			{
				binding: XVELOCITY,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
			{
				binding: YVELOCITY,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
			{
				binding: XMAP,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
			{
				binding: YMAP,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
			{
				binding: INTERACTION,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: interactions.type,
				},
			},
			{
				binding: VISCOSITY,
				visibility: GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
		],
	});

	const bindGroup = device.createBindGroup({
		label: `Bind Group`,
		layout: bindGroupLayout,
		entries: [
			{
				binding: XVELOCITY,
				resource: textures.textures[XVELOCITY].createView(),
			},
			{
				binding: YVELOCITY,
				resource: textures.textures[YVELOCITY].createView(),
			},
			{
				binding: XMAP,
				resource: textures.textures[XMAP].createView(),
			},
			{
				binding: YMAP,
				resource: textures.textures[YMAP].createView(),
			},
			{
				binding: VISCOSITY,
				resource: textures.textures[VISCOSITY].createView(),
			},
			{
				binding: INTERACTION,
				resource: {
					buffer: interactions.buffer,
				},
			},
		],
	});

	const pipelineLayout = device.createPipelineLayout({
		label: "pipelineLayout",
		bindGroupLayouts: [bindGroupLayout],
	});

	// compile shaders
	const computePipeline = device.createComputePipeline({
		label: "computePipeline",
		layout: pipelineLayout,
		compute: {
			module: device.createShaderModule({
				label: "timestepComputeShader",
				code: setValues(timestepComputeShader, {
					WORKGROUP_SIZE: WORKGROUP_SIZE,
					TILE_SIZE: TILE_SIZE,
					HALO_SIZE: HALO_SIZE,
					GROUP_INDEX: GROUP_INDEX,
					XVELOCITY: XVELOCITY,
					YVELOCITY: YVELOCITY,
					XMAP: XMAP,
					YMAP: YMAP,
					INTERACTION: INTERACTION,
					FORMAT: textures.format.storage,
					WIDTH: textures.size.width,
					HEIGHT: textures.size.height,
				}),
			}),
		},
	});

	const RENDER_INDEX = 0;
	const renderPipeline = device.createRenderPipeline({
		label: "renderPipeline",
		layout: pipelineLayout,
		vertex: {
			module: device.createShaderModule({
				code: setValues(cellVertexShader, {
					VERTEX_INDEX: VERTEX_INDEX,
				}),
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
				code: setValues(cellFragmentShader, {
					GROUP_INDEX: GROUP_INDEX,
					FORMAT: textures.format.storage,
					XVELOCITY: XVELOCITY,
					YVELOCITY: YVELOCITY,
					XMAP: XMAP,
					YMAP: YMAP,
					VERTEX_INDEX: VERTEX_INDEX,
					RENDER_INDEX: RENDER_INDEX,
					WIDTH: textures.size.width,
					HEIGHT: textures.size.height,
				}),
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

		computePass.setPipeline(computePipeline);
		computePass.setBindGroup(GROUP_INDEX, bindGroup);

		device.queue.writeBuffer(
			interactions.buffer,
			/*offset=*/ 0,
			/*data=*/ interactions.data
		);

		computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
		computePass.end();

		// render pass
		const texture = canvas.context.getCurrentTexture();
		const view = texture.createView();

		renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
		const renderPass = command.beginRenderPass(renderPassDescriptor);

		renderPass.setPipeline(renderPipeline);
		renderPass.setBindGroup(GROUP_INDEX, bindGroup);
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
