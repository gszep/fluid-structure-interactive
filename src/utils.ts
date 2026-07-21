interface Size {
	width: number;
	height: number;
}

function throwDetectionError(error: string): never {
	(
		document.querySelector(".webgpu-not-supported") as HTMLElement
	).style.visibility = "visible";
	throw new Error("Could not initialize WebGPU: " + error);
}

async function requestDevice(): Promise<GPUDevice> {
	if (!navigator.gpu) throwDetectionError("WebGPU NOT Supported");

	const adapter = await navigator.gpu.requestAdapter({
		powerPreference: "high-performance",
	});
	if (!adapter) throwDetectionError("No GPU adapter found");

	return adapter.requestDevice();
}

function configureCanvas(
	device: GPUDevice,
	size: Size = { width: window.innerWidth, height: window.innerHeight }
): {
	context: GPUCanvasContext;
	format: GPUTextureFormat;
	size: Size;
} {
	const canvas = Object.assign(document.createElement("canvas"), size);
	document.body.appendChild(canvas);

	const context = canvas.getContext("webgpu");
	if (!context) throwDetectionError("Canvas does not support WebGPU");

	const format = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
		device: device,
		format: format,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
		alphaMode: "premultiplied",
	});

	return { context: context, format: format, size: size };
}

function setupVertexBuffer(
	device: GPUDevice,
	label: string,
	data: number[]
): {
	vertexBuffer: GPUBuffer;
	vertexCount: number;
	arrayStride: number;
	format: GPUVertexFormat;
} {
	const array = new Float32Array(data);
	const vertexBuffer = device.createBuffer({
		label: label,
		size: array.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, array);

	return {
		vertexBuffer: vertexBuffer,
		vertexCount: array.length / 2,
		arrayStride: 2 * array.BYTES_PER_ELEMENT,
		format: "float32x2",
	};
}

/** Create a texture used as both a sampled source and a storage destination. */
function createFieldTexture(
	device: GPUDevice,
	label: string,
	size: Size,
	format: GPUTextureFormat,
	layers: number = 1
): GPUTexture {
	return device.createTexture({
		label: label,
		format: format,
		size: { width: size.width, height: size.height, depthOrArrayLayers: layers },
		usage:
			GPUTextureUsage.TEXTURE_BINDING |
			GPUTextureUsage.STORAGE_BINDING |
			GPUTextureUsage.COPY_DST,
	});
}

function writeFieldTexture(
	device: GPUDevice,
	texture: GPUTexture,
	size: Size,
	layers: number,
	bytesPerTexel: number,
	data: Float32Array
): void {
	device.queue.writeTexture(
		{ texture: texture },
		data,
		{ bytesPerRow: size.width * bytesPerTexel, rowsPerImage: size.height },
		{ width: size.width, height: size.height, depthOrArrayLayers: layers }
	);
}

/**
 * Cursor interactions. Returns a uniform buffer of [x, y, signedRadius, pad]
 * in simulation-grid coordinates. signedRadius is positive while pushing
 * (left click / one finger), negative while pulling (right click / two
 * fingers) and zero when inactive. Scroll adjusts the radius.
 */
function setupInteractions(
	device: GPUDevice,
	canvas: HTMLCanvasElement,
	grid: Size,
	radius: number = 50
): {
	buffer: GPUBuffer;
	data: Float32Array;
} {
	const data = new Float32Array(4);
	let sign = 1;

	const setPosition = (x: number, y: number) => {
		data[0] = (x / canvas.width) * grid.width;
		data[1] = (y / canvas.height) * grid.height;
	};

	canvas.addEventListener("contextmenu", (event) => event.preventDefault());

	canvas.addEventListener(
		"mousemove",
		(event) => setPosition(event.offsetX, event.offsetY),
		{ passive: true }
	);
	canvas.addEventListener(
		"touchmove",
		(event) =>
			setPosition(event.touches[0].clientX, event.touches[0].clientY),
		{ passive: true }
	);

	canvas.addEventListener("mousedown", (event) => {
		sign = event.button === 2 ? -1 : 1;
		setPosition(event.offsetX, event.offsetY);
		data[2] = sign * radius;
	});
	canvas.addEventListener(
		"touchstart",
		(event) => {
			sign = event.touches.length > 1 ? -1 : 1;
			setPosition(event.touches[0].clientX, event.touches[0].clientY);
			data[2] = sign * radius;
		},
		{ passive: true }
	);

	["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((type) => {
		canvas.addEventListener(type, () => {
			data[2] = 0;
		});
	});

	canvas.addEventListener(
		"wheel",
		(event) => {
			const limit = 0.5 * Math.min(grid.width, grid.height);
			radius = Math.min(Math.max(radius + event.deltaY * 0.05, 5), limit);
			if (data[2] !== 0) data[2] = sign * radius;
		},
		{ passive: true }
	);

	const buffer = device.createBuffer({
		label: "Interaction Buffer",
		size: data.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	return { buffer: buffer, data: data };
}

/** Replace `#import` directives by prepending the included source files. */
function prependIncludes(code: string, includes: string[]): string {
	code = code.replace(/^#import.*/gm, "");
	return includes.reduce((acc, include) => include + "\n" + acc, code);
}

export {
	Size,
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	createFieldTexture,
	writeFieldTexture,
	setupInteractions,
	prependIncludes,
};
