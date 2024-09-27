import { requestDevice, configureCanvas, setValues } from "./utils";
import cellVertexShader from "./shaders/cell.vert.wgsl";
import cellFragmentShader from "./shaders/cell.frag.wgsl";
import timestepComputeShader from "./shaders/timestep.comp.wgsl";

const GRID_SIZE = 32;
const WORKGROUP_SIZE = 8;
const WORKGROUP_COUNT = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);

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
	const bindGroupLayout = device.createBindGroupLayout({
		label: "bindGroupLayout",
		entries: [
			{
				binding: 0,
				visibility:
					GPUShaderStage.VERTEX |
					GPUShaderStage.FRAGMENT |
					GPUShaderStage.COMPUTE,
				buffer: { type: "uniform" }, // Grid size buffer
			},
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
				buffer: { type: "read-only-storage" }, // state input buffer
			},
			{
				binding: 2,
				visibility: GPUShaderStage.COMPUTE,
				buffer: { type: "storage" }, // state output buffer
			},
		],
	});

	const pipelineLayout = device.createPipelineLayout({
		label: "pipelineLayout",
		bindGroupLayouts: [bindGroupLayout],
	});

	const computePipeline = device.createComputePipeline({
		label: "computePipeline",
		layout: pipelineLayout,
		compute: {
			module: device.createShaderModule({
				label: "timestepComputeShader",
				code: setValues(timestepComputeShader, {
					WORKGROUP_SIZE: WORKGROUP_SIZE,
				}),
			}),
		},
	});

	const renderPipeline = device.createRenderPipeline({
		label: "renderPipeline",
		layout: pipelineLayout,
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
		label: "Vertices",
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
	for (let i = 0; i < stateArray.length; ++i) {
		stateArray[i] = Math.random() > 0.6 ? 1 : 0;
	}

	const stateBuffers = ["A", "B"].map((label) =>
		device.createBuffer({
			label: `State Buffer ${label}`,
			size: stateArray.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		})
	);
	device.queue.writeBuffer(
		stateBuffers[0],
		/*bufferOffset=*/ 0,
		/*data=*/ stateArray
	);

	const bindGroups = [0, 1].map((i) =>
		device.createBindGroup({
			label: `Bind Group > ${stateBuffers[i].label}`,
			layout: bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: gridSizeBuffer },
				},
				{
					binding: 1,
					resource: { buffer: stateBuffers[i % 2] },
				},
				{
					binding: 2,
					resource: { buffer: stateBuffers[(i + 1) % 2] },
				},
			],
		})
	);

	function render() {
		const command = device.createCommandEncoder();

		// compute pass
		const computePass = command.beginComputePass();

		computePass.setPipeline(computePipeline);
		computePass.setBindGroup(0, bindGroups[frame_index % 2]);
		computePass.dispatchWorkgroups(WORKGROUP_COUNT, WORKGROUP_COUNT);
		computePass.end();

		frame_index++;

		// render pass
		const renderPass = command.beginRenderPass({
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [1, 1, 1, 1],
					storeOp: "store",
				},
			],
		});

		renderPass.setPipeline(renderPipeline);
		renderPass.setBindGroup(0, bindGroups[frame_index % 2]);
		renderPass.setVertexBuffer(0, vertexBuffer);
		renderPass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
		renderPass.end();

		// submit the command buffer
		device.queue.submit([command.finish()]);
	}

	setInterval(render, UPDATE_INTERVAL);
	return;
}

index();
