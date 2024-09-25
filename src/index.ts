import { requestDevice, configureCanvas } from "./utils";
import cellVertexShader from "./shaders/cell.vert.wgsl";
import cellFragmentShader from "./shaders/cell.frag.wgsl";

const GRID_SIZE = 32;
const UPDATE_INTERVAL = 200;
let frame_index = 0;

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
	const cellPipeline = device.createRenderPipeline({
		label: "Cell pipeline",
		layout: "auto",
		vertex: {
			module: device.createShaderModule({
				code: cellVertexShader,
				label: "cellVertexShader",
			}),
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
			module: device.createShaderModule({
				code: cellFragmentShader,
				label: "cellFragmentShader",
			}),
			targets: [
				{
					format: format,
				},
			],
		},
	});

	// vertex buffers
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

	// uniform buffers
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

	// storage buffers
	const stateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

	const stateBuffers = ["A", "B"].map((label) =>
		device.createBuffer({
			label: `State Buffer ${label}`,
			size: stateArray.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		})
	);

	for (let i = 0; i < stateArray.length; i += 3) {
		stateArray[i] = 1;
	}
	device.queue.writeBuffer(
		stateBuffers[0],
		/*bufferOffset=*/ 0,
		/*data=*/ stateArray
	);

	for (let i = 0; i < stateArray.length; i++) {
		stateArray[i] = i % 2;
	}
	device.queue.writeBuffer(
		stateBuffers[1],
		/*bufferOffset=*/ 0,
		/*data=*/ stateArray
	);

	const bindGroups = stateBuffers.map((buffer) =>
		device.createBindGroup({
			label: `Bind Group > ${buffer.label}`,
			layout: cellPipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: gridSizeBuffer },
				},
				{
					binding: 1,
					resource: { buffer: buffer },
				},
			],
		})
	);

	function render() {
		// begin render pass
		const command = device.createCommandEncoder();
		const pass = command.beginRenderPass({
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [1, 1, 1, 1],
					storeOp: "store",
				},
			],
		});

		// draw
		pass.setPipeline(cellPipeline);
		pass.setBindGroup(0, bindGroups[frame_index % 2]);
		pass.setVertexBuffer(0, vertexBuffer);
		pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

		// finalise render pass and submit the command buffer
		pass.end();
		device.queue.submit([command.finish()]);
		frame_index++;
	}

	setInterval(render, UPDATE_INTERVAL);
	return;
}

index();
