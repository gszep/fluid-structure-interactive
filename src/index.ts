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

const WORKGROUP_SIZE = 8;
const UPDATE_INTERVAL = 1;
let frame_index = 0;

async function index(): Promise<void> {
	// setup and configure WebGPU
	const device = await requestDevice();
	const canvas = configureCanvas(device);
	const GROUP_INDEX = 0;

	// initialize vertex buffer and textures
	const VERTEX_INDEX = 0;
	const QUAD = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];

	const quad = setupVertexBuffer(device, "Quad Vertex Buffer", QUAD);
	const textures = setupTextures(device, canvas.size);

	const READ_BINDING = 0;
	const WRITE_BINDING = 1;
	const WORKGROUP_COUNT: [number, number] = [
		Math.ceil(textures.size.width / WORKGROUP_SIZE),
		Math.ceil(textures.size.height / WORKGROUP_SIZE),
	];

	// setup interactions
	const INTERACTION_BINDING = 2;
	const interactions = setupInteractions(
		device,
		canvas.context.canvas,
		textures.size
	);

	const bindGroupLayout = device.createBindGroupLayout({
		label: "bindGroupLayout",
		entries: [
			{
				binding: READ_BINDING,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				texture: {
					sampleType: textures.format.sampleType,
				},
			},
			{
				binding: WRITE_BINDING,
				visibility: GPUShaderStage.COMPUTE,
				storageTexture: {
					access: "write-only",
					format: textures.format.storage,
				},
			},
			{
				binding: INTERACTION_BINDING,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: interactions.type,
				},
			},
		],
	});

	const bindGroups = [0, 1].map((i) =>
		device.createBindGroup({
			label: `Bind Group > ${textures.textures[i].label}`,
			layout: bindGroupLayout,
			entries: [
				{
					binding: READ_BINDING,
					resource: textures.textures[i % 2].createView(),
				},
				{
					binding: WRITE_BINDING,
					resource: textures.textures[(i + 1) % 2].createView(),
				},
				{
					binding: INTERACTION_BINDING,
					resource: {
						buffer: interactions.buffer,
					},
				},
			],
		})
	);

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
					GROUP_INDEX: GROUP_INDEX,
					READ_BINDING: READ_BINDING,
					WRITE_BINDING: WRITE_BINDING,
					INTERACTION_BINDING: INTERACTION_BINDING,
					TEXTURE_FORMAT: textures.format.texture,
					STORAGE_FORMAT: textures.format.storage,
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
					TEXTURE_FORMAT: textures.format.texture,
					GROUP_INDEX: GROUP_INDEX,
					READ_BINDING: READ_BINDING,
					VERTEX_INDEX: VERTEX_INDEX,
					RENDER_INDEX: RENDER_INDEX,
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
		computePass.setBindGroup(GROUP_INDEX, bindGroups[frame_index % 2]);

		device.queue.writeBuffer(
			interactions.buffer,
			/*offset=*/ 0,
			/*data=*/ interactions.data
		);

		computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
		computePass.end();

		frame_index++;

		// render pass
		const view = canvas.context.getCurrentTexture().createView();
		renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
		const renderPass = command.beginRenderPass(renderPassDescriptor);

		renderPass.setPipeline(renderPipeline);
		renderPass.setBindGroup(GROUP_INDEX, bindGroups[frame_index % 2]);
		renderPass.setVertexBuffer(VERTEX_INDEX, quad.vertexBuffer);
		renderPass.draw(quad.vertexCount);
		renderPass.end();

		// submit the command buffer
		device.queue.submit([command.finish()]);
	}

	setInterval(render, UPDATE_INTERVAL);
	return;
}

index();
