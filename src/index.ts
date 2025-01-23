import {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	setupTextures,
	setupInteractions,
	setValues,
} from "./utils";
import cacheUtils from "./shaders/includes/cache.wgsl";

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

	const VORTICITY = 0;
	const STREAMFUNCTION = 1;
	const DEBUG = 3;

	const textures = setupTextures(
		device,
		[VORTICITY, STREAMFUNCTION, DEBUG],
		canvas.size
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
	const INTERACTION = 2;
	const interactions = setupInteractions(
		device,
		canvas.context.canvas,
		textures.size
	);

	const bindGroupLayout = device.createBindGroupLayout({
		label: "bindGroupLayout",
		entries: [
			{
				binding: VORTICITY,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "read-write",
					format: textures.format.storage,
				},
			},
			{
				binding: STREAMFUNCTION,
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
				binding: DEBUG,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
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
				binding: VORTICITY,
				resource: textures.textures[VORTICITY].createView(),
			},
			{
				binding: STREAMFUNCTION,
				resource: textures.textures[STREAMFUNCTION].createView(),
			},
			{
				binding: INTERACTION,
				resource: {
					buffer: interactions.buffer,
				},
			},
			{
				binding: DEBUG,
				resource: textures.textures[DEBUG].createView(),
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
				code: setValues(
					timestepComputeShader,
					{
						WORKGROUP_SIZE: WORKGROUP_SIZE,
						TILE_SIZE: TILE_SIZE,
						HALO_SIZE: HALO_SIZE,
						GROUP_INDEX: GROUP_INDEX,
						VORTICITY: VORTICITY,
						STREAMFUNCTION: STREAMFUNCTION,
						DEBUG: DEBUG,
						INTERACTION: INTERACTION,
						FORMAT: textures.format.storage,
						WIDTH: textures.size.width,
						HEIGHT: textures.size.height,
					},
					[cacheUtils]
				),
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
					VORTICITY: VORTICITY,
					STREAMFUNCTION: STREAMFUNCTION,
					DEBUG: DEBUG,
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
