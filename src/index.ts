import { requestDevice, throwDetectionError } from "./utils";
import cellShader from "./shaders/cell.wgsl";

async function index(): Promise<void> {
	const device = await requestDevice({
		powerPreference: "high-performance",
	});

	// add canvas to the document
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	document.body.appendChild(canvas);

	const context = document.querySelector("canvas").getContext("webgpu");

	if (!context) throwDetectionError("Canvas does not support WebGPU");
	context.configure({
		device: device,
		format: navigator.gpu.getPreferredCanvasFormat(),
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
		alphaMode: "opaque",
	});

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

	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [
			{
				format: "float32x2",
				offset: 0,
				shaderLocation: 0, // Position, see vertex shader
			},
		],
	};

	const cellShaderModule = device.createShaderModule({
		code: cellShader,
		label: "Cell Shader",
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

	pass.end();
	device.queue.submit([command.finish()]);

	return;
}

index();
