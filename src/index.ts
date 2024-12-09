import { requestDevice, configureCanvas, setValues } from "./utils";
import cellVertexShader from "./shaders/cell.vert.wgsl";
import cellFragmentShader from "./shaders/cell.frag.wgsl";
import timestepComputeShader from "./shaders/timestep.comp.wgsl";

const FORMAT = "rgba32float";
const GRID_SIZE = 512;
const WORKGROUP_SIZE = 8;
const WORKGROUP_COUNT = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);

const UPDATE_INTERVAL = 1;
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
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				sampler: { type: "filtering" },
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
				storageTexture: { access: "read-only", format: FORMAT },
			},
			{
				binding: 2,
				visibility: GPUShaderStage.COMPUTE,
				storageTexture: { access: "write-only", format: FORMAT },
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
					FORMAT: FORMAT,
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
					arrayStride: 8, // sizeof(float32) x 2
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
				code: setValues(cellFragmentShader, {
					FORMAT: FORMAT,
				}),
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
	const vertices = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);

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

	// storage textures
	const textureData = new Array(GRID_SIZE * GRID_SIZE);
	for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
		textureData[i] = [
			Math.random() > 0.5 ? 1 : 0,
			Math.random() > 0.5 ? 1 : 0,
			Math.random() > 0.5 ? 1 : 0,
			1,
		];
	}

	const stateTextures = ["A", "B"].map((label) =>
		device.createTexture({
			label: `State Texture ${label}`,
			size: [GRID_SIZE, GRID_SIZE],
			format: FORMAT,
			usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
		})
	);
	const texture = stateTextures[0];
	device.queue.writeTexture(
		{ texture },
		/*data=*/ new Float32Array(textureData.flat()),
		/*dataLayout=*/ {
			offset: 0,
			bytesPerRow: 16 * GRID_SIZE,
			rowsPerImage: GRID_SIZE,
		},
		/*size=*/ {
			width: GRID_SIZE,
			height: GRID_SIZE,
		}
	);

	const bindGroups = [0, 1].map((i) =>
		device.createBindGroup({
			label: `Bind Group > ${stateTextures[i].label}`,
			layout: bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: device.createSampler(),
				},
				{
					binding: 1,
					resource: stateTextures[i % 2].createView(),
				},
				{
					binding: 2,
					resource: stateTextures[(i + 1) % 2].createView(),
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
		renderPass.draw(vertices.length / 2);
		renderPass.end();

		// submit the command buffer
		device.queue.submit([command.finish()]);
	}

	setInterval(render, UPDATE_INTERVAL);
	return;
}

index();
