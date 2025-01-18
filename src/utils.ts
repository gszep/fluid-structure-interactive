// // Creates and manage multi-dimensional buffers by creating a buffer for each dimension
// class DynamicBuffer {
// 	constructor({
// 		dims = 1, // Number of dimensions
// 		w = settings.grid_w, // Buffer width
// 		h = settings.grid_h, // Buffer height
// 	} = {}) {
// 		this.dims = dims;
// 		this.bufferSize = w * h * 4;
// 		this.w = w;
// 		this.h = h;
// 		this.buffers = new Array(dims).fill().map((_) =>
// 			device.createBuffer({
// 				size: this.bufferSize,
// 				usage:
// 					GPUBufferUsage.STORAGE |
// 					GPUBufferUsage.COPY_SRC |
// 					GPUBufferUsage.COPY_DST,
// 			})
// 		);
// 	}

// 	// Copy each buffer to another DynamicBuffer's buffers.
// 	// If the dimensions don't match, the last non-empty dimension will be copied instead
// 	copyTo(buffer, commandEncoder) {
// 		for (let i = 0; i < Math.max(this.dims, buffer.dims); i++) {
// 			commandEncoder.copyBufferToBuffer(
// 				this.buffers[Math.min(i, this.buffers.length - 1)],
// 				0,
// 				buffer.buffers[Math.min(i, buffer.buffers.length - 1)],
// 				0,
// 				this.bufferSize
// 			);
// 		}
// 	}

// 	// Reset all the buffers
// 	clear(queue) {
// 		for (let i = 0; i < this.dims; i++) {
// 			queue.writeBuffer(
// 				this.buffers[i],
// 				0,
// 				new Float32Array(this.w * this.h)
// 			);
// 		}
// 	}
// }

// // Manage uniform buffers relative to the compute shaders & the gui
// class Uniform {
// 	constructor(
// 		name,
// 		{
// 			size,
// 			value,
// 			min,
// 			max,
// 			step,
// 			onChange,
// 			displayName,
// 			addToGUI = true,
// 		} = {}
// 	) {
// 		this.name = name;
// 		this.size = size ?? (typeof value === "object" ? value.length : 1);
// 		this.needsUpdate = false;

// 		if (this.size === 1) {
// 			if (settings[name] == null) {
// 				settings[name] = value ?? 0;
// 				this.alwaysUpdate = true;
// 			} else if (addToGUI) {
// 				gui.add(settings, name, min, max, step)
// 					.onChange((v) => {
// 						if (onChange) onChange(v);
// 						this.needsUpdate = true;
// 					})
// 					.name(displayName ?? name);
// 			}
// 		}

// 		if (this.size === 1 || value != null) {
// 			this.buffer = device.createBuffer({
// 				mappedAtCreation: true,
// 				size: this.size * 4,
// 				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// 			});

// 			const arrayBuffer = this.buffer.getMappedRange();
// 			new Float32Array(arrayBuffer).set(
// 				new Float32Array(value ?? [settings[name]])
// 			);
// 			this.buffer.unmap();
// 		} else {
// 			this.buffer = device.createBuffer({
// 				size: this.size * 4,
// 				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// 			});
// 		}

// 		globalUniforms[name] = this;
// 	}

// 	setValue(value) {
// 		settings[this.name] = value;
// 		this.needsUpdate = true;
// 	}

// 	// Update the GPU buffer if the value has changed
// 	update(queue, value) {
// 		if (this.needsUpdate || this.alwaysUpdate || value != null) {
// 			if (typeof this.needsUpdate !== "boolean") value = this.needsUpdate;
// 			queue.writeBuffer(
// 				this.buffer,
// 				0,
// 				new Float32Array(value ?? [parseFloat(settings[this.name])]),
// 				0,
// 				this.size
// 			);
// 			this.needsUpdate = false;
// 		}
// 	}
// }

// // On first click: start recording the mouse position at each frame
// // On second click: reset the canvas, start recording the canvas,
// // override the mouse position with the previously recorded values
// // and finally downloads a .webm 60fps file
// class Recorder {
// 	constructor(resetSimulation) {
// 		this.mouseData = [];

// 		this.capturer = new CCapture({
// 			format: "webm",
// 			framerate: 60,
// 		});

// 		this.isRecording = false;

// 		// Recorder is disabled until I make a tooltip explaining how it works
// 		// canvas.addEventListener('click', () => {
// 		//     if (this.isRecording) this.stop()
// 		//     else this.start()
// 		// })

// 		this.resetSimulation = resetSimulation;
// 	}

// 	start() {
// 		if (this.isRecording !== "mouse") {
// 			// Start recording mouse position
// 			this.isRecording = "mouse";
// 		} else {
// 			// Start recording the canvas
// 			this.isRecording = "frames";
// 			this.capturer.start();
// 		}

// 		console.log("start", this.isRecording);
// 	}

// 	update() {
// 		if (this.isRecording === "mouse") {
// 			// Record current frame's mouse data
// 			if (mouseInfos.current)
// 				this.mouseData.push([
// 					...mouseInfos.current,
// 					...mouseInfos.velocity,
// 				]);
// 		} else if (this.isRecording === "frames") {
// 			// Record current frame's canvas
// 			this.capturer.capture(canvas);
// 		}
// 	}

// 	stop() {
// 		if (this.isRecording === "mouse") {
// 			// Reset the simulation and start the canvas record
// 			this.resetSimulation();
// 			this.start();
// 		} else if (this.isRecording === "frames") {
// 			// Stop the recording and save the video file
// 			this.capturer.stop();
// 			this.capturer.save();
// 			this.isRecording = false;
// 		}
// 	}
// }

// // Creates a shader module, compute pipeline & bind group to use with the GPU
// class Program {
// 	constructor({
// 		buffers = [], // Storage buffers
// 		uniforms = [], // Uniform buffers
// 		shader, // WGSL Compute Shader as a string
// 		dispatchX = settings.grid_w, // Dispatch workers width
// 		dispatchY = settings.grid_h, // Dispatch workers height
// 	}) {
// 		// Create the shader module using the WGSL string and use it
// 		// to create a compute pipeline with 'auto' binding layout
// 		this.computePipeline = device.createComputePipeline({
// 			layout: "auto",
// 			compute: {
// 				module: device.createShaderModule({ code: shader }),
// 				entryPoint: "main",
// 			},
// 		});

// 		// Concat the buffer & uniforms and format the entries to the right WebGPU format
// 		let entries = buffers
// 			.map((b) => b.buffers)
// 			.flat()
// 			.map((buffer) => ({ buffer }));
// 		entries.push(...uniforms.map(({ buffer }) => ({ buffer })));
// 		entries = entries.map((e, i) => ({
// 			binding: i,
// 			resource: e,
// 		}));

// 		// Create the bind group using these entries & auto-layout detection
// 		this.bindGroup = device.createBindGroup({
// 			layout: this.computePipeline.getBindGroupLayout(0 /* index */),
// 			entries: entries,
// 		});

// 		this.dispatchX = dispatchX;
// 		this.dispatchY = dispatchY;
// 	}

// 	// Dispatch the compute pipeline to the GPU
// 	dispatch(passEncoder) {
// 		passEncoder.setPipeline(this.computePipeline);
// 		passEncoder.setBindGroup(0, this.bindGroup);
// 		passEncoder.dispatchWorkgroups(
// 			Math.ceil(this.dispatchX / 8),
// 			Math.ceil(this.dispatchY / 8)
// 		);
// 	}
// }

// /// Useful classes for cleaner understanding of the input and output buffers
// /// used in the declarations of programs & fluid simulation steps

// class AdvectProgram extends Program {
// 	constructor({
// 		in_quantity,
// 		in_velocity,
// 		out_quantity,
// 		uniforms,
// 		shader = advectShader,
// 		...props
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_quantity, in_velocity, out_quantity],
// 			uniforms,
// 			shader,
// 			...props,
// 		});
// 	}
// }

// class DivergenceProgram extends Program {
// 	constructor({
// 		in_velocity,
// 		out_divergence,
// 		uniforms,
// 		shader = divergenceShader,
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({ buffers: [in_velocity, out_divergence], uniforms, shader });
// 	}
// }

// class PressureProgram extends Program {
// 	constructor({
// 		in_pressure,
// 		in_divergence,
// 		out_pressure,
// 		uniforms,
// 		shader = pressureShader,
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_pressure, in_divergence, out_pressure],
// 			uniforms,
// 			shader,
// 		});
// 	}
// }

// class GradientSubtractProgram extends Program {
// 	constructor({
// 		in_pressure,
// 		in_velocity,
// 		out_velocity,
// 		uniforms,
// 		shader = gradientSubtractShader,
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_pressure, in_velocity, out_velocity],
// 			uniforms,
// 			shader,
// 		});
// 	}
// }

// class BoundaryProgram extends Program {
// 	constructor({
// 		in_quantity,
// 		out_quantity,
// 		uniforms,
// 		shader = boundaryShader,
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({ buffers: [in_quantity, out_quantity], uniforms, shader });
// 	}
// }

// class UpdateProgram extends Program {
// 	constructor({
// 		in_quantity,
// 		out_quantity,
// 		uniforms,
// 		shader = updateVelocityShader,
// 		...props
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_quantity, out_quantity],
// 			uniforms,
// 			shader,
// 			...props,
// 		});
// 	}
// }

// class VorticityProgram extends Program {
// 	constructor({
// 		in_velocity,
// 		out_vorticity,
// 		uniforms,
// 		shader = vorticityShader,
// 		...props
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_velocity, out_vorticity],
// 			uniforms,
// 			shader,
// 			...props,
// 		});
// 	}
// }

// class VorticityConfinmentProgram extends Program {
// 	constructor({
// 		in_velocity,
// 		in_vorticity,
// 		out_velocity,
// 		uniforms,
// 		shader = vorticityConfinmentShader,
// 		...props
// 	}) {
// 		uniforms ??= [globalUniforms.gridSize];
// 		super({
// 			buffers: [in_velocity, in_vorticity, out_velocity],
// 			uniforms,
// 			shader,
// 			...props,
// 		});
// 	}
// }

function throwDetectionError(error: string): never {
	(
		document.querySelector(".webgpu-not-supported") as HTMLElement
	).style.visibility = "visible";
	throw new Error("Could not initialize WebGPU: " + error);
}

async function requestDevice(
	options: GPURequestAdapterOptions = { powerPreference: "high-performance" },
	requiredFeatures: GPUFeatureName[] = []
): Promise<GPUDevice> {
	if (!navigator.gpu) throwDetectionError("WebGPU NOT Supported");

	const adapter = await navigator.gpu.requestAdapter(options);
	if (!adapter) throwDetectionError("No GPU adapter found");

	return adapter.requestDevice({ requiredFeatures: requiredFeatures });
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
	size: { width: number; height: number },
	format: {
		storage: GPUTextureFormat;
	} = {
		storage: "r32float",
	}
): {
	textures: { [key: number]: GPUTexture };
	format: {
		storage: GPUTextureFormat;
	};
	size: { width: number; height: number };
} {
	const textureData = new Array(size.width * size.height);
	const CHANNELS = channelCount(format.storage);

	for (let i = 0; i < size.width * size.height; i++) {
		textureData[i] = [];

		for (let j = 0; j < CHANNELS; j++) {
			textureData[i].push(Math.random() > 1 / 2 ? 1 : -1);
		}
	}

	const textures: { [key: number]: GPUTexture } = {};
	bindings.forEach((key) => {
		textures[key] = device.createTexture({
			label: `Texture ${key}`,
			size: [size.width, size.height],
			format: format.storage,
			usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
		});
	});

	const array = new Float32Array(textureData.flat());
	Object.values(textures).forEach((texture) => {
		device.queue.writeTexture(
			{ texture },
			/*data=*/ array,
			/*dataLayout=*/ {
				offset: 0,
				bytesPerRow: size.width * array.BYTES_PER_ELEMENT * CHANNELS,
				rowsPerImage: size.height,
			},
			/*size=*/ size
		);
	});

	return {
		textures: textures,
		format: format,
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

function setValues(code: string, variables: Record<string, any>): string {
	const reg = new RegExp(Object.keys(variables).join("|"), "g");
	return code.replace(reg, (k) => variables[k].toString());
}

export {
	requestDevice,
	configureCanvas,
	setupVertexBuffer,
	setupTextures,
	setupInteractions,
	setValues,
};
