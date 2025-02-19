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
import timestepComputeShader from "./shaders/timestep.comp.wgsl";

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

	const VORTICITY = 0;
	const STREAMFUNCTION = 1;
	const DEBUG = 3;

	const INTERACTION = 2;
	const CANVAS = 4;

	const textures = setupTextures(
		device,
		[VORTICITY, STREAMFUNCTION, DEBUG],
		{},
		canvas.size
	);

	const WORKGROUP_SIZE = 16;
	const DISPATCH_SIZE = 2 * WORKGROUP_SIZE - 2;

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
				binding: DEBUG,
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
					type: "uniform",
				},
			},
			{
				binding: CANVAS,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				buffer: {
					type: "uniform",
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
				binding: DEBUG,
				resource: textures.textures[DEBUG].createView(),
			},
			{
				binding: INTERACTION,
				resource: {
					buffer: interactions.buffer,
				},
			},
			{
				binding: CANVAS,
				resource: {
					buffer: textures.canvas,
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
				code: prependIncludes(timestepComputeShader, [
					bindings,
					cacheUtils,
				]),
			}),
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
