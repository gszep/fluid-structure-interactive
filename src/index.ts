import { requestDevice, configureCanvas } from "./utils";
import cellShader from "./shaders/cell.wgsl";

const GRID_SIZE = 32;

async function index(): Promise<void> {
	// setup and configure WebGPU
	const device = await requestDevice({
		powerPreference: "high-performance",
	});

	const { context, format } = configureCanvas(device, {
		width: 512,
		height: 512,
	});

	// compile shaders
	const cellShaderModule = device.createShaderModule({
		code: cellShader,
		label: "Cell Shader",
	});

	const cellPipeline = device.createRenderPipeline({
		label: "Cell pipeline",
		layout: "auto",
		vertex: {
			module: cellShaderModule,
			entryPoint: "vertexMain",
			buffers: [
				{
					arrayStride: 8,
					attributes: [
						{
							format: "float32x2",
							offset: 0,
							shaderLocation: 0, // Position, see vertex shader
						},
					],
				},
			],
		},
		fragment: {
			module: cellShaderModule,
			entryPoint: "fragmentMain",
			targets: [
				{
					format: format,
				},
			],
		},
	});

	// vertex buffer
	const vertices = new Float32Array([
		-0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
	]);

	const vertexBuffer = device.createBuffer({
		label: "Cell vertices",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});

	device.queue.writeBuffer(
		vertexBuffer,
		/*bufferOffset=*/ 0,
		/*data=*/ vertices
	);

	// grid size uniform buffer
	const gridSizeArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
	const gridSizeBuffer = device.createBuffer({
		label: "Grid size",
		size: gridSizeArray.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	device.queue.writeBuffer(
		gridSizeBuffer,
		/*bufferOffset=*/ 0,
		/*data=*/ gridSizeArray
	);

	const bindGroup = device.createBindGroup({
		label: "Cell renderer bind group",
		layout: cellPipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: { buffer: gridSizeBuffer },
			},
		],
	});

	const command = device.createCommandEncoder();

	const pass = command.beginRenderPass({
		colorAttachments: [
			{
				view: context.getCurrentTexture().createView(),
				loadOp: "clear",
				clearValue: [0, 0.2, 0.7, 1],
				storeOp: "store",
			},
		],
	});

	pass.setPipeline(cellPipeline);
	pass.setVertexBuffer(0, vertexBuffer);

	pass.setBindGroup(0, bindGroup);
	pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

	pass.end();
	device.queue.submit([command.finish()]);

	return;
}

index();
