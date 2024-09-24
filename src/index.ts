async function index(): Promise<void> {
	const device = await requestDevice({
		powerPreference: "high-performance",
	});
	const context = document.querySelector("canvas").getContext("webgpu");

	if (!context) throwDetectionError("Canvas does not support WebGPU");
	context.configure({
		device: device,
		format: navigator.gpu.getPreferredCanvasFormat(),
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
		alphaMode: "opaque",
	});

	const command = device.createCommandEncoder();
	const texture = context.getCurrentTexture();

	return;
}
