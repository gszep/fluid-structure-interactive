function throwDetectionError(error: string): never {
	(
		document.querySelector(".webgpu-not-supported") as HTMLElement
	).style.visibility = "visible";
	throw new Error("Could not initialize WebGPU: " + error);
}

async function requestDevice(
	options: GPURequestAdapterOptions = {
		powerPreference: "high-performance",
	},
	requiredFeatures: GPUFeatureName[] = [],
	requiredLimits: Record<string, undefined | number> = {
		maxStorageTexturesPerShaderStage: 8,
	}
): Promise<GPUDevice> {
	if (!navigator.gpu) throwDetectionError("WebGPU NOT Supported");

	const adapter = await navigator.gpu.requestAdapter(options);
	if (!adapter) throwDetectionError("No GPU adapter found");

	return adapter.requestDevice({
		requiredFeatures: requiredFeatures,
		requiredLimits: requiredLimits,
	});
}

function configureCanvas(
	device: GPUDevice,
	size = { width: window.innerWidth, height: window.innerHeight }
): {
	context: GPUCanvasContext;
	format: GPUTextureFormat;
	size: { width: number; height: number };
} {
	const canvas = Object.assign(document.createElement("canvas"), size);
	document.body.appendChild(canvas);

	const context = document.querySelector("canvas")!.getContext("webgpu");
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

	device.queue.writeBuffer(
		vertexBuffer,
		/*bufferOffset=*/ 0,
		/*data=*/ array
	);
	return {
		vertexBuffer: vertexBuffer,
		vertexCount: array.length / 2,
		arrayStride: 2 * array.BYTES_PER_ELEMENT,
		format: "float32x2",
	};
}

function setupTextures(
	device: GPUDevice,
	bindings: number[],
	data: { [key: number]: number[] },
	size: {
		depthOrArrayLayers?: { [key: number]: number };
		width: number;
		height: number;
	}
): {
	canvas: {
		buffer: GPUBuffer;
		data: BufferSource | SharedArrayBuffer;
		type: GPUBufferBindingType;
	};
	textures: { [key: number]: GPUTexture };
	bindingLayout: GPUStorageTextureBindingLayout;
	size: {
		depthOrArrayLayers?: { [key: number]: number };
		width: number;
		height: number;
	};
} {
	const FORMAT = "r32float";
	const CHANNELS = channelCount(FORMAT);

	const textures: { [key: number]: GPUTexture } = {};
	const depthOrArrayLayers = size.depthOrArrayLayers || {};

	bindings.forEach((key) => {
		textures[key] = device.createTexture({
			usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
			format: FORMAT,
			size: {
				width: size.width,
				height: size.height,
				depthOrArrayLayers:
					key in depthOrArrayLayers ? depthOrArrayLayers[key] : 2,
			},
		});
	});

	Object.keys(textures).forEach((key) => {
		const random = new Array(size.width * size.height);
		const layers =
			key in depthOrArrayLayers ? depthOrArrayLayers[parseInt(key)] : 1;

		for (let i = 0; i < size.width * size.height; i++) {
			random[i] = [];

			for (let j = 0; j < layers; j++) {
				random[i].push(2 * Math.random() - 1);
			}
		}

		const array =
			key in data
				? new Float32Array(data[parseInt(key)].flat())
				: new Float32Array(random.flat());

		device.queue.writeTexture(
			{ texture: textures[parseInt(key)] },
			/*data=*/ array,
			/*dataLayout=*/ {
				offset: 0,
				bytesPerRow: size.width * array.BYTES_PER_ELEMENT * CHANNELS,
				rowsPerImage: size.height,
			},
			/*size=*/ {
				width: size.width,
				height: size.height,
				depthOrArrayLayers: layers,
			}
		);
	});

	let canvasData = new Uint32Array([size.width, size.height, 0, 0]);
	const canvasBuffer = device.createBuffer({
		label: "Canvas Buffer",
		size: canvasData.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	device.queue.writeBuffer(canvasBuffer, /*offset=*/ 0, /*data=*/ canvasData);

	return {
		canvas: {
			buffer: canvasBuffer,
			data: canvasData,
			type: "uniform",
		},
		textures: textures,
		bindingLayout: {
			format: FORMAT,
			access: "read-write",
			viewDimension: "2d-array",
		},
		size: size,
	};
}

function setupInteractions(
	device: GPUDevice,
	canvas: HTMLCanvasElement | OffscreenCanvas,
	texture: { width: number; height: number },
	size: number = 100
): {
	buffer: GPUBuffer;
	data: BufferSource | SharedArrayBuffer;
	type: GPUBufferBindingType;
} {
	let data = new Float32Array(4);
	var sign = 1;

	let position = { x: 0, y: 0 };
	let velocity = { x: 0, y: 0 };

	data.set([position.x, position.y]);
	if (canvas instanceof HTMLCanvasElement) {
		// disable context menu
		canvas.addEventListener("contextmenu", (event) => {
			event.preventDefault();
		});

		// move events
		["mousemove", "touchmove"].forEach((type) => {
			canvas.addEventListener(
				type,
				(event) => {
					switch (true) {
						case event instanceof MouseEvent:
							position.x = event.offsetX;
							position.y = event.offsetY;
							break;

						case event instanceof TouchEvent:
							position.x = event.touches[0].clientX;
							position.y = event.touches[0].clientY;
							break;
					}

					let x = Math.floor(
						(position.x / canvas.width) * texture.width
					);
					let y = Math.floor(
						(position.y / canvas.height) * texture.height
					);

					data.set([x, y]);
				},
				{ passive: true }
			);
		});

		// zoom events TODO(@gszep) add pinch and scroll for touch devices
		["wheel"].forEach((type) => {
			canvas.addEventListener(
				type,
				(event) => {
					switch (true) {
						case event instanceof WheelEvent:
							velocity.x = event.deltaY;
							velocity.y = event.deltaY;
							break;
					}

					size += velocity.y;
					data.set([size], 2);
				},
				{ passive: true }
			);
		});

		// click events TODO(@gszep) implement right click equivalent for touch devices
		["mousedown", "touchstart"].forEach((type) => {
			canvas.addEventListener(
				type,
				(event) => {
					switch (true) {
						case event instanceof MouseEvent:
							sign = 1 - event.button;
							break;

						case event instanceof TouchEvent:
							sign = event.touches.length > 1 ? -1 : 1;
					}
					data.set([sign * size], 2);
				},
				{ passive: true }
			);
		});
		["mouseup", "touchend"].forEach((type) => {
			canvas.addEventListener(
				type,
				(event) => {
					data.set([NaN], 2);
				},
				{ passive: true }
			);
		});
	}
	const uniformBuffer = device.createBuffer({
		label: "Interaction Buffer",
		size: data.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	return {
		buffer: uniformBuffer,
		data: data,
		type: "uniform",
	};
}

function channelCount(format: GPUTextureFormat): number {
	if (format.includes("rgba")) {
		return 4;
	} else if (format.includes("rgb")) {
		return 3;
	} else if (format.includes("rg")) {
		return 2;
	} else if (format.includes("r")) {
		return 1;
	} else {
		throw new Error("Invalid format: " + format);
	}
}

function prependIncludes(code: string, includes: string[]): string {
	code = code.replace(/^#import.*/gm, "");
	return includes.reduce((acc, include) => include + "\n" + acc, code);
}

export {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	setupTextures,
	setupInteractions,
	prependIncludes,
};
