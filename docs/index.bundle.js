"use strict";
(self["webpackChunkfluid_structure_interactive"] = self["webpackChunkfluid_structure_interactive"] || []).push([["index"],{

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
/* harmony import */ var _shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shaders/cell.vert.wgsl */ "./src/shaders/cell.vert.wgsl");
/* harmony import */ var _shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shaders/cell.frag.wgsl */ "./src/shaders/cell.frag.wgsl");
/* harmony import */ var _shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shaders/timestep.comp.wgsl */ "./src/shaders/timestep.comp.wgsl");




const WORKGROUP_SIZE = 16;
const UPDATE_INTERVAL = 1;
let frame_index = 0;
async function index() {
    // setup and configure WebGPU
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    const GROUP_INDEX = 0;
    // initialize vertex buffer and textures
    const VERTEX_INDEX = 0;
    const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
    const quad = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(device, "Quad Vertex Buffer", QUAD);
    const VORTICITY = 0;
    const STREAMFUNCTION = 1;
    const DEBUG = 3;
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, [VORTICITY, STREAMFUNCTION, DEBUG], {
        width: 128,
        height: 128,
    });
    const WORKGROUP_COUNT = [
        Math.ceil(textures.size.width / WORKGROUP_SIZE),
        Math.ceil(textures.size.height / WORKGROUP_SIZE),
    ];
    // setup interactions
    const INTERACTION_BINDING = 2;
    const interactions = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(device, canvas.context.canvas, textures.size);
    const bindGroupLayout = device.createBindGroupLayout({
        label: "bindGroupLayout",
        entries: [
            {
                binding: VORTICITY,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
            {
                binding: STREAMFUNCTION,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
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
            {
                binding: DEBUG,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
        ],
    });
    const bindGroup = device.createBindGroup({
        label: `Bind Group`,
        layout: bindGroupLayout,
        entries: [
            {
                binding: VORTICITY,
                resource: textures.textures[VORTICITY].createView(),
            },
            {
                binding: STREAMFUNCTION,
                resource: textures.textures[STREAMFUNCTION].createView(),
            },
            {
                binding: INTERACTION_BINDING,
                resource: {
                    buffer: interactions.buffer,
                },
            },
            {
                binding: DEBUG,
                resource: textures.textures[DEBUG].createView(),
            },
        ],
    });
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
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(_shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_3__, {
                    WORKGROUP_SIZE: WORKGROUP_SIZE,
                    GROUP_INDEX: GROUP_INDEX,
                    VORTICITY: VORTICITY,
                    STREAMFUNCTION: STREAMFUNCTION,
                    DEBUG: DEBUG,
                    INTERACTION_BINDING: INTERACTION_BINDING,
                    FORMAT: textures.format.storage,
                    WIDTH: textures.size.width,
                    HEIGHT: textures.size.height,
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
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(_shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_1__, {
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
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(_shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_2__, {
                    GROUP_INDEX: GROUP_INDEX,
                    FORMAT: textures.format.storage,
                    VORTICITY: VORTICITY,
                    STREAMFUNCTION: STREAMFUNCTION,
                    DEBUG: DEBUG,
                    VERTEX_INDEX: VERTEX_INDEX,
                    RENDER_INDEX: RENDER_INDEX,
                    WIDTH: textures.size.width,
                    HEIGHT: textures.size.height,
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
    const colorAttachments = [
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
        computePass.setBindGroup(GROUP_INDEX, bindGroup);
        device.queue.writeBuffer(interactions.buffer, 
        /*offset=*/ 0, 
        /*data=*/ interactions.data);
        computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
        computePass.end();
        // render pass
        const texture = canvas.context.getCurrentTexture();
        const view = texture.createView();
        renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
        const renderPass = command.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(GROUP_INDEX, bindGroup);
        renderPass.setVertexBuffer(VERTEX_INDEX, quad.vertexBuffer);
        renderPass.draw(quad.vertexCount);
        renderPass.end();
        // submit the command buffer
        device.queue.submit([command.finish()]);
        texture.destroy();
        frame_index++;
    }
    setInterval(render, UPDATE_INTERVAL);
    return;
}
index();


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   configureCanvas: () => (/* binding */ configureCanvas),
/* harmony export */   requestDevice: () => (/* binding */ requestDevice),
/* harmony export */   setValues: () => (/* binding */ setValues),
/* harmony export */   setupInteractions: () => (/* binding */ setupInteractions),
/* harmony export */   setupTextures: () => (/* binding */ setupTextures),
/* harmony export */   setupVertexBuffer: () => (/* binding */ setupVertexBuffer)
/* harmony export */ });
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
function throwDetectionError(error) {
    document.querySelector(".webgpu-not-supported").style.visibility = "visible";
    throw new Error("Could not initialize WebGPU: " + error);
}
async function requestDevice(options = { powerPreference: "high-performance" }, requiredFeatures = []) {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter(options);
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    return adapter.requestDevice({ requiredFeatures: requiredFeatures });
}
function configureCanvas(device, size = { width: window.innerWidth, height: window.innerHeight }) {
    const canvas = Object.assign(document.createElement("canvas"), size);
    document.body.appendChild(canvas);
    const context = document.querySelector("canvas").getContext("webgpu");
    if (!context)
        throwDetectionError("Canvas does not support WebGPU");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: "premultiplied",
    });
    return { context: context, format: format, size: size };
}
function setupVertexBuffer(device, label, data) {
    const array = new Float32Array(data);
    const vertexBuffer = device.createBuffer({
        label: label,
        size: array.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 
    /*bufferOffset=*/ 0, 
    /*data=*/ array);
    return {
        vertexBuffer: vertexBuffer,
        vertexCount: array.length / 2,
        arrayStride: 2 * array.BYTES_PER_ELEMENT,
        format: "float32x2",
    };
}
function setupTextures(device, bindings, size, format = {
    storage: "r32float",
}) {
    const textureData = new Array(size.width * size.height);
    const CHANNELS = channelCount(format.storage);
    for (let i = 0; i < size.width * size.height; i++) {
        textureData[i] = [];
        for (let j = 0; j < CHANNELS; j++) {
            textureData[i].push(Math.random() > 1 / 2 ? 0 : 0);
        }
    }
    const textures = {};
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
        device.queue.writeTexture({ texture }, 
        /*data=*/ array, 
        /*dataLayout=*/ {
            offset: 0,
            bytesPerRow: size.width * array.BYTES_PER_ELEMENT * CHANNELS,
            rowsPerImage: size.height,
        }, 
        /*size=*/ size);
    });
    return {
        textures: textures,
        format: format,
        size: size,
    };
}
function setupInteractions(device, canvas, texture, size = 100) {
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
            canvas.addEventListener(type, (event) => {
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
                let x = Math.floor((position.x / canvas.width) * texture.width);
                let y = Math.floor((position.y / canvas.height) * texture.height);
                data.set([x, y]);
            }, { passive: true });
        });
        // zoom events TODO(@gszep) add pinch and scroll for touch devices
        ["wheel"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof WheelEvent:
                        velocity.x = event.deltaY;
                        velocity.y = event.deltaY;
                        break;
                }
                size += velocity.y;
                data.set([size], 2);
            }, { passive: true });
        });
        // click events TODO(@gszep) implement right click equivalent for touch devices
        ["mousedown", "touchstart"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof MouseEvent:
                        sign = 1 - event.button;
                        break;
                    case event instanceof TouchEvent:
                        sign = event.touches.length > 1 ? -1 : 1;
                }
                data.set([sign * size], 2);
            }, { passive: true });
        });
        ["mouseup", "touchend"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                data.set([NaN], 2);
            }, { passive: true });
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
function channelCount(format) {
    if (format.includes("rgba")) {
        return 4;
    }
    else if (format.includes("rgb")) {
        return 3;
    }
    else if (format.includes("rg")) {
        return 2;
    }
    else if (format.includes("r")) {
        return 1;
    }
    else {
        throw new Error("Invalid format: " + format);
    }
}
function setValues(code, variables) {
    const reg = new RegExp(Object.keys(variables).join("|"), "g");
    return code.replace(reg, (k) => variables[k].toString());
}



/***/ }),

/***/ "./src/shaders/cell.frag.wgsl":
/*!************************************!*\
  !*** ./src/shaders/cell.frag.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;\n\nconst size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1 + input.coordinate) / 2 * size);\n\n    // vorticity map\n    let omega = textureLoad(omega, x);\n    // output.color.g = 5 * max(0, omega.r);\n    // output.color.r = 5 * max(0, -omega.r);\n\n    // stream function map\n    let phi = textureLoad(phi, x);\n    // output.color.b = abs(phi.r);\n\n    output.color.b = textureLoad(debug, x).r;\n    output.color.a = 1.0;\n    return output;\n}";

/***/ }),

/***/ "./src/shaders/cell.vert.wgsl":
/*!************************************!*\
  !*** ./src/shaders/cell.vert.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "struct Input {\n  @builtin(instance_index) instance: u32,\n  @location(VERTEX_INDEX) position: vec2<f32>,\n};\n\nstruct Output {\n  @builtin(position) position: vec4<f32>,\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\n@vertex\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    output.position.x = input.position.x;\n    output.position.y = -input.position.y;\n\n    output.position.z = 0;\n    output.position.w = 1;\n\n    output.coordinate = input.position;\n    return output;\n}";

/***/ }),

/***/ "./src/shaders/timestep.comp.wgsl":
/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n  @builtin(workgroup_id) workGroupID: vec3<u32>,\n  @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst dx = vec2<u32>(1, 0);\nconst dy = vec2<u32>(0, 1);\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {\n    return  cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4 * cached_value(F, x);\n}\n\nfn curl(F: u32, x: vec2<u32>) -> vec2<f32> {\n    // curl of a scalar field yields a vector defined as (u,v) := (dF/dy, -dF/dx)\n    // we approximate the derivatives using central differences with a staggered grid\n    // where scalar field F is defined at the center and vector components (u,v) are\n    // defined parallel to the edges of the cell.\n    //\n    //              |   F+dy  |      \n    //              |         |    \n    //       ———————|——— u1 ——|———————\n    //              |         |\n    //        F-dx  v0   F   v1   F+dx\n    //              |         |\n    //       ———————|—— u0 ———|———————\n    //              |         |\n    //              |   F-dy  |    \n    //\n    // the resulting vector field is defined at the center.\n    // Bi-linear interpolation is used to approximate.\n\n    let u = (cached_value(F, x + dy) - cached_value(F, x - dy)) / 2;\n    let v = (cached_value(F, x - dx) - cached_value(F, x + dx)) / 2;\n\n    return vec2<f32>(u.x, v.x);\n}\n\nfn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {\n    return (1 - relaxation) * cached_value(F, x) + (relaxation / 4) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));\n}\n\nfn advected_value(F: u32, x: vec2<u32>, dt: f32) -> vec4<f32> {\n    let y = vec2<f32>(x) - curl(STREAMFUNCTION, x) * dt;\n    return interpolate_value(F, y);\n}\n\nfn interpolate_value(F: u32, x: vec2<f32>) -> vec4<f32> {\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value(F, y),\n            cached_value(F, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value(F, y + dy),\n            cached_value(F, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\nvar<workgroup> cache: array<array<array<vec4<f32>, WORKGROUP_SIZE+2>, WORKGROUP_SIZE+2>, 2>;\nfn load_cache(id: Invocation, idx: u32, F: texture_storage_2d<FORMAT, read_write>) {\n    let global = vec2<i32>(id.globalInvocationID.xy);\n    let local = id.localInvocationID.xy + 1;\n\n    const loweidx = 0;\n    const uppeidx = WORKGROUP_SIZE + 1;\n\n    const dx = vec2<i32>(1, 0);\n    const dy = vec2<i32>(0, 1);\n\n    // load the tile and nearest neighbours into shared memory\n    cache[idx][local.x][local.y] = load_value(F, global);\n\n    // edge neighbours\n    if local.x == (loweidx + 1) {\n        cache[idx][loweidx][local.y] = load_value(F, global - dx);\n    }\n    if local.x == (uppeidx - 1) {\n        cache[idx][uppeidx][local.y] = load_value(F, global + dx);\n    }\n    if local.y == (loweidx + 1) {\n        cache[idx][local.x][loweidx] = load_value(F, global - dy);\n    }\n    if local.y == (uppeidx - 1) {\n        cache[idx][local.x][uppeidx] = load_value(F, global + dy);\n    }\n\n    // corner neighbours\n    if local.x == (loweidx + 1) && local.y == (loweidx + 1) {\n        cache[idx][loweidx][loweidx] = load_value(F, global - dx - dy);\n    }\n    if local.x == (uppeidx - 1) && local.y == (loweidx + 1) {\n        cache[idx][uppeidx][loweidx] = load_value(F, global + dx - dy);\n    }\n    if local.x == (loweidx + 1) && local.y == (uppeidx - 1) {\n        cache[idx][loweidx][uppeidx] = load_value(F, global - dx + dy);\n    }\n    if local.x == (uppeidx - 1) && local.y == (uppeidx - 1) {\n        cache[idx][uppeidx][uppeidx] = load_value(F, global + dx + dy);\n    }\n\n    workgroupBarrier();\n}\n\nfn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    return cache[idx][x.x + 1][x.y + 1];\n}\n\nfn load_value(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>) -> vec4<f32> {\n    const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);\n\n    let y = x + size; // ensure positive coordinates\n    return textureLoad(F, y % size);  // periodic boundary conditions\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(id: Invocation) {\n    let global = id.globalInvocationID.xy;\n    let local = id.localInvocationID.xy;\n\n    // brush interaction\n    let distance = vec2<f32>(global) - interaction.position;\n    let norm = dot(distance, distance);\n\n    var brush = 0.0;\n    if sqrt(norm) < abs(interaction.size) {\n        brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n    }\n\n    load_cache(id, VORTICITY, omega);\n    load_cache(id, STREAMFUNCTION, phi);\n\n    // vorticity timestep;\n    textureStore(omega, global, advected_value(VORTICITY, local, 0.0) + laplacian(VORTICITY, local) * 0.1 + brush);\n    load_cache(id, VORTICITY, omega);\n\n    // solve poisson equation for stream function\n    const relaxation = 1.0;\n    for (var i = 0; i < 100; i = i + 1) {\n        load_cache(id, STREAMFUNCTION, phi);\n        textureStore(phi, global, jacobi_iteration(STREAMFUNCTION, VORTICITY, local, relaxation));\n    }\n\n    // debug\n    load_cache(id, VORTICITY, omega);\n    load_cache(id, STREAMFUNCTION, phi);\n\n    let error = abs(cached_value(VORTICITY, local) + laplacian(STREAMFUNCTION, local));\n    textureStore(debug, global, error);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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UUFDckIsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsU0FBUztLQUNmLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7SUFDN0MsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxJQUFZLEVBQUUsU0FBOEI7SUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQVNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0c2V0VmFsdWVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgY2VsbFZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwudmVydC53Z3NsXCI7XG5pbXBvcnQgY2VsbEZyYWdtZW50U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC5mcmFnLndnc2xcIjtcbmltcG9ydCB0aW1lc3RlcENvbXB1dGVTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy90aW1lc3RlcC5jb21wLndnc2xcIjtcblxuY29uc3QgV09SS0dST1VQX1NJWkUgPSAxNjtcbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDE7XG5sZXQgZnJhbWVfaW5kZXggPSAwO1xuXG5hc3luYyBmdW5jdGlvbiBpbmRleCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0Ly8gc2V0dXAgYW5kIGNvbmZpZ3VyZSBXZWJHUFVcblx0Y29uc3QgZGV2aWNlID0gYXdhaXQgcmVxdWVzdERldmljZSgpO1xuXHRjb25zdCBjYW52YXMgPSBjb25maWd1cmVDYW52YXMoZGV2aWNlKTtcblx0Y29uc3QgR1JPVVBfSU5ERVggPSAwO1xuXG5cdC8vIGluaXRpYWxpemUgdmVydGV4IGJ1ZmZlciBhbmQgdGV4dHVyZXNcblx0Y29uc3QgVkVSVEVYX0lOREVYID0gMDtcblx0Y29uc3QgUVVBRCA9IFstMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSwgLTEsIDEsIDEsIC0xLCAxXTtcblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKGRldmljZSwgXCJRdWFkIFZlcnRleCBCdWZmZXJcIiwgUVVBRCk7XG5cblx0Y29uc3QgVk9SVElDSVRZID0gMDtcblx0Y29uc3QgU1RSRUFNRlVOQ1RJT04gPSAxO1xuXHRjb25zdCBERUJVRyA9IDM7XG5cblx0Y29uc3QgdGV4dHVyZXMgPSBzZXR1cFRleHR1cmVzKGRldmljZSwgW1ZPUlRJQ0lUWSwgU1RSRUFNRlVOQ1RJT04sIERFQlVHXSwge1xuXHRcdHdpZHRoOiAxMjgsXG5cdFx0aGVpZ2h0OiAxMjgsXG5cdH0pO1xuXG5cdGNvbnN0IFdPUktHUk9VUF9DT1VOVDogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS53aWR0aCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBXT1JLR1JPVVBfU0laRSksXG5cdF07XG5cblx0Ly8gc2V0dXAgaW50ZXJhY3Rpb25zXG5cdGNvbnN0IElOVEVSQUNUSU9OX0JJTkRJTkcgPSAyO1xuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblxuXHRjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcblx0XHRsYWJlbDogXCJiaW5kR3JvdXBMYXlvdXRcIixcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFZPUlRJQ0lUWSxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFNUUkVBTUZVTkNUSU9OLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0YnVmZmVyOiB7XG5cdFx0XHRcdFx0dHlwZTogaW50ZXJhY3Rpb25zLnR5cGUsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBERUJVRyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0bGFiZWw6IGBCaW5kIEdyb3VwYCxcblx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFZPUlRJQ0lUWSxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW1ZPUlRJQ0lUWV0uY3JlYXRlVmlldygpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogU1RSRUFNRlVOQ1RJT04sXG5cdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tTVFJFQU1GVU5DVElPTl0uY3JlYXRlVmlldygpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBERUJVRyxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW0RFQlVHXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZVBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwge1xuXHRcdFx0XHRcdFdPUktHUk9VUF9TSVpFOiBXT1JLR1JPVVBfU0laRSxcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0Vk9SVElDSVRZOiBWT1JUSUNJVFksXG5cdFx0XHRcdFx0U1RSRUFNRlVOQ1RJT046IFNUUkVBTUZVTkNUSU9OLFxuXHRcdFx0XHRcdERFQlVHOiBERUJVRyxcblx0XHRcdFx0XHRJTlRFUkFDVElPTl9CSU5ESU5HOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdEZPUk1BVDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdFx0V0lEVEg6IHRleHR1cmVzLnNpemUud2lkdGgsXG5cdFx0XHRcdFx0SEVJR0hUOiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxWZXJ0ZXhTaGFkZXIsIHtcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIHtcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0Rk9STUFUOiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0XHRWT1JUSUNJVFk6IFZPUlRJQ0lUWSxcblx0XHRcdFx0XHRTVFJFQU1GVU5DVElPTjogU1RSRUFNRlVOQ1RJT04sXG5cdFx0XHRcdFx0REVCVUc6IERFQlVHLFxuXHRcdFx0XHRcdFZFUlRFWF9JTkRFWDogVkVSVEVYX0lOREVYLFxuXHRcdFx0XHRcdFJFTkRFUl9JTkRFWDogUkVOREVSX0lOREVYLFxuXHRcdFx0XHRcdFdJRFRIOiB0ZXh0dXJlcy5zaXplLndpZHRoLFxuXHRcdFx0XHRcdEhFSUdIVDogdGV4dHVyZXMuc2l6ZS5oZWlnaHQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBjYW52YXMuZm9ybWF0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXG5cdFx0e1xuXHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRsb2FkT3A6IFwibG9hZFwiLFxuXHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdH0sXG5cdF07XG5cdGNvbnN0IHJlbmRlclBhc3NEZXNjcmlwdG9yID0ge1xuXHRcdGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMsXG5cdH07XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcblxuXHRcdC8vIGNvbXB1dGUgcGFzc1xuXHRcdGNvbnN0IGNvbXB1dGVQYXNzID0gY29tbWFuZC5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShjb21wdXRlUGlwZWxpbmUpO1xuXHRcdGNvbXB1dGVQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3VwKTtcblxuXHRcdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHRcdGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHQvKm9mZnNldD0qLyAwLFxuXHRcdFx0LypkYXRhPSovIGludGVyYWN0aW9ucy5kYXRhXG5cdFx0KTtcblxuXHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXHRcdGNvbXB1dGVQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gcmVuZGVyIHBhc3Ncblx0XHRjb25zdCB0ZXh0dXJlID0gY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKTtcblx0XHRjb25zdCB2aWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KCk7XG5cblx0XHRyZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzW1JFTkRFUl9JTkRFWF0udmlldyA9IHZpZXc7XG5cdFx0Y29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmQuYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcblxuXHRcdHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlclBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXHRcdHJlbmRlclBhc3Muc2V0VmVydGV4QnVmZmVyKFZFUlRFWF9JTkRFWCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0XHR0ZXh0dXJlLmRlc3Ryb3koKTtcblx0XHRmcmFtZV9pbmRleCsrO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCIvLyAvLyBDcmVhdGVzIGFuZCBtYW5hZ2UgbXVsdGktZGltZW5zaW9uYWwgYnVmZmVycyBieSBjcmVhdGluZyBhIGJ1ZmZlciBmb3IgZWFjaCBkaW1lbnNpb25cbi8vIGNsYXNzIER5bmFtaWNCdWZmZXIge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0ZGltcyA9IDEsIC8vIE51bWJlciBvZiBkaW1lbnNpb25zXG4vLyBcdFx0dyA9IHNldHRpbmdzLmdyaWRfdywgLy8gQnVmZmVyIHdpZHRoXG4vLyBcdFx0aCA9IHNldHRpbmdzLmdyaWRfaCwgLy8gQnVmZmVyIGhlaWdodFxuLy8gXHR9ID0ge30pIHtcbi8vIFx0XHR0aGlzLmRpbXMgPSBkaW1zO1xuLy8gXHRcdHRoaXMuYnVmZmVyU2l6ZSA9IHcgKiBoICogNDtcbi8vIFx0XHR0aGlzLncgPSB3O1xuLy8gXHRcdHRoaXMuaCA9IGg7XG4vLyBcdFx0dGhpcy5idWZmZXJzID0gbmV3IEFycmF5KGRpbXMpLmZpbGwoKS5tYXAoKF8pID0+XG4vLyBcdFx0XHRkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5idWZmZXJTaXplLFxuLy8gXHRcdFx0XHR1c2FnZTpcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHxcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyB8XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KVxuLy8gXHRcdCk7XG4vLyBcdH1cblxuLy8gXHQvLyBDb3B5IGVhY2ggYnVmZmVyIHRvIGFub3RoZXIgRHluYW1pY0J1ZmZlcidzIGJ1ZmZlcnMuXG4vLyBcdC8vIElmIHRoZSBkaW1lbnNpb25zIGRvbid0IG1hdGNoLCB0aGUgbGFzdCBub24tZW1wdHkgZGltZW5zaW9uIHdpbGwgYmUgY29waWVkIGluc3RlYWRcbi8vIFx0Y29weVRvKGJ1ZmZlciwgY29tbWFuZEVuY29kZXIpIHtcbi8vIFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWF4KHRoaXMuZGltcywgYnVmZmVyLmRpbXMpOyBpKyspIHtcbi8vIFx0XHRcdGNvbW1hbmRFbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJzW01hdGgubWluKGksIHRoaXMuYnVmZmVycy5sZW5ndGggLSAxKV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdGJ1ZmZlci5idWZmZXJzW01hdGgubWluKGksIGJ1ZmZlci5idWZmZXJzLmxlbmd0aCAtIDEpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJTaXplXG4vLyBcdFx0XHQpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdC8vIFJlc2V0IGFsbCB0aGUgYnVmZmVyc1xuLy8gXHRjbGVhcihxdWV1ZSkge1xuLy8gXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kaW1zOyBpKyspIHtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcnNbaV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodGhpcy53ICogdGhpcy5oKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gTWFuYWdlIHVuaWZvcm0gYnVmZmVycyByZWxhdGl2ZSB0byB0aGUgY29tcHV0ZSBzaGFkZXJzICYgdGhlIGd1aVxuLy8gY2xhc3MgVW5pZm9ybSB7XG4vLyBcdGNvbnN0cnVjdG9yKFxuLy8gXHRcdG5hbWUsXG4vLyBcdFx0e1xuLy8gXHRcdFx0c2l6ZSxcbi8vIFx0XHRcdHZhbHVlLFxuLy8gXHRcdFx0bWluLFxuLy8gXHRcdFx0bWF4LFxuLy8gXHRcdFx0c3RlcCxcbi8vIFx0XHRcdG9uQ2hhbmdlLFxuLy8gXHRcdFx0ZGlzcGxheU5hbWUsXG4vLyBcdFx0XHRhZGRUb0dVSSA9IHRydWUsXG4vLyBcdFx0fSA9IHt9XG4vLyBcdCkge1xuLy8gXHRcdHRoaXMubmFtZSA9IG5hbWU7XG4vLyBcdFx0dGhpcy5zaXplID0gc2l6ZSA/PyAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUubGVuZ3RoIDogMSk7XG4vLyBcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSkge1xuLy8gXHRcdFx0aWYgKHNldHRpbmdzW25hbWVdID09IG51bGwpIHtcbi8vIFx0XHRcdFx0c2V0dGluZ3NbbmFtZV0gPSB2YWx1ZSA/PyAwO1xuLy8gXHRcdFx0XHR0aGlzLmFsd2F5c1VwZGF0ZSA9IHRydWU7XG4vLyBcdFx0XHR9IGVsc2UgaWYgKGFkZFRvR1VJKSB7XG4vLyBcdFx0XHRcdGd1aS5hZGQoc2V0dGluZ3MsIG5hbWUsIG1pbiwgbWF4LCBzdGVwKVxuLy8gXHRcdFx0XHRcdC5vbkNoYW5nZSgodikgPT4ge1xuLy8gXHRcdFx0XHRcdFx0aWYgKG9uQ2hhbmdlKSBvbkNoYW5nZSh2KTtcbi8vIFx0XHRcdFx0XHRcdHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuLy8gXHRcdFx0XHRcdH0pXG4vLyBcdFx0XHRcdFx0Lm5hbWUoZGlzcGxheU5hbWUgPz8gbmFtZSk7XG4vLyBcdFx0XHR9XG4vLyBcdFx0fVxuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSB8fCB2YWx1ZSAhPSBudWxsKSB7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRtYXBwZWRBdENyZWF0aW9uOiB0cnVlLFxuLy8gXHRcdFx0XHRzaXplOiB0aGlzLnNpemUgKiA0LFxuLy8gXHRcdFx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSk7XG5cbi8vIFx0XHRcdGNvbnN0IGFycmF5QnVmZmVyID0gdGhpcy5idWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKTtcbi8vIFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkoYXJyYXlCdWZmZXIpLnNldChcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbc2V0dGluZ3NbbmFtZV1dKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyLnVubWFwKCk7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuc2l6ZSAqIDQsXG4vLyBcdFx0XHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRnbG9iYWxVbmlmb3Jtc1tuYW1lXSA9IHRoaXM7XG4vLyBcdH1cblxuLy8gXHRzZXRWYWx1ZSh2YWx1ZSkge1xuLy8gXHRcdHNldHRpbmdzW3RoaXMubmFtZV0gPSB2YWx1ZTtcbi8vIFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0fVxuXG4vLyBcdC8vIFVwZGF0ZSB0aGUgR1BVIGJ1ZmZlciBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWRcbi8vIFx0dXBkYXRlKHF1ZXVlLCB2YWx1ZSkge1xuLy8gXHRcdGlmICh0aGlzLm5lZWRzVXBkYXRlIHx8IHRoaXMuYWx3YXlzVXBkYXRlIHx8IHZhbHVlICE9IG51bGwpIHtcbi8vIFx0XHRcdGlmICh0eXBlb2YgdGhpcy5uZWVkc1VwZGF0ZSAhPT0gXCJib29sZWFuXCIpIHZhbHVlID0gdGhpcy5uZWVkc1VwZGF0ZTtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcixcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbcGFyc2VGbG9hdChzZXR0aW5nc1t0aGlzLm5hbWVdKV0pLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHR0aGlzLnNpemVcbi8vIFx0XHRcdCk7XG4vLyBcdFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIE9uIGZpcnN0IGNsaWNrOiBzdGFydCByZWNvcmRpbmcgdGhlIG1vdXNlIHBvc2l0aW9uIGF0IGVhY2ggZnJhbWVcbi8vIC8vIE9uIHNlY29uZCBjbGljazogcmVzZXQgdGhlIGNhbnZhcywgc3RhcnQgcmVjb3JkaW5nIHRoZSBjYW52YXMsXG4vLyAvLyBvdmVycmlkZSB0aGUgbW91c2UgcG9zaXRpb24gd2l0aCB0aGUgcHJldmlvdXNseSByZWNvcmRlZCB2YWx1ZXNcbi8vIC8vIGFuZCBmaW5hbGx5IGRvd25sb2FkcyBhIC53ZWJtIDYwZnBzIGZpbGVcbi8vIGNsYXNzIFJlY29yZGVyIHtcbi8vIFx0Y29uc3RydWN0b3IocmVzZXRTaW11bGF0aW9uKSB7XG4vLyBcdFx0dGhpcy5tb3VzZURhdGEgPSBbXTtcblxuLy8gXHRcdHRoaXMuY2FwdHVyZXIgPSBuZXcgQ0NhcHR1cmUoe1xuLy8gXHRcdFx0Zm9ybWF0OiBcIndlYm1cIixcbi8vIFx0XHRcdGZyYW1lcmF0ZTogNjAsXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gZmFsc2U7XG5cbi8vIFx0XHQvLyBSZWNvcmRlciBpcyBkaXNhYmxlZCB1bnRpbCBJIG1ha2UgYSB0b29sdGlwIGV4cGxhaW5pbmcgaG93IGl0IHdvcmtzXG4vLyBcdFx0Ly8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuLy8gXHRcdC8vICAgICBpZiAodGhpcy5pc1JlY29yZGluZykgdGhpcy5zdG9wKClcbi8vIFx0XHQvLyAgICAgZWxzZSB0aGlzLnN0YXJ0KClcbi8vIFx0XHQvLyB9KVxuXG4vLyBcdFx0dGhpcy5yZXNldFNpbXVsYXRpb24gPSByZXNldFNpbXVsYXRpb247XG4vLyBcdH1cblxuLy8gXHRzdGFydCgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyAhPT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBTdGFydCByZWNvcmRpbmcgbW91c2UgcG9zaXRpb25cbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBcIm1vdXNlXCI7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdC8vIFN0YXJ0IHJlY29yZGluZyB0aGUgY2FudmFzXG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gXCJmcmFtZXNcIjtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc3RhcnQoKTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRjb25zb2xlLmxvZyhcInN0YXJ0XCIsIHRoaXMuaXNSZWNvcmRpbmcpO1xuLy8gXHR9XG5cbi8vIFx0dXBkYXRlKCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFJlY29yZCBjdXJyZW50IGZyYW1lJ3MgbW91c2UgZGF0YVxuLy8gXHRcdFx0aWYgKG1vdXNlSW5mb3MuY3VycmVudClcbi8vIFx0XHRcdFx0dGhpcy5tb3VzZURhdGEucHVzaChbXG4vLyBcdFx0XHRcdFx0Li4ubW91c2VJbmZvcy5jdXJyZW50LFxuLy8gXHRcdFx0XHRcdC4uLm1vdXNlSW5mb3MudmVsb2NpdHksXG4vLyBcdFx0XHRcdF0pO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gUmVjb3JkIGN1cnJlbnQgZnJhbWUncyBjYW52YXNcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuY2FwdHVyZShjYW52YXMpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdHN0b3AoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gUmVzZXQgdGhlIHNpbXVsYXRpb24gYW5kIHN0YXJ0IHRoZSBjYW52YXMgcmVjb3JkXG4vLyBcdFx0XHR0aGlzLnJlc2V0U2ltdWxhdGlvbigpO1xuLy8gXHRcdFx0dGhpcy5zdGFydCgpO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gU3RvcCB0aGUgcmVjb3JkaW5nIGFuZCBzYXZlIHRoZSB2aWRlbyBmaWxlXG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnN0b3AoKTtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc2F2ZSgpO1xuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IGZhbHNlO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBDcmVhdGVzIGEgc2hhZGVyIG1vZHVsZSwgY29tcHV0ZSBwaXBlbGluZSAmIGJpbmQgZ3JvdXAgdG8gdXNlIHdpdGggdGhlIEdQVVxuLy8gY2xhc3MgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRidWZmZXJzID0gW10sIC8vIFN0b3JhZ2UgYnVmZmVyc1xuLy8gXHRcdHVuaWZvcm1zID0gW10sIC8vIFVuaWZvcm0gYnVmZmVyc1xuLy8gXHRcdHNoYWRlciwgLy8gV0dTTCBDb21wdXRlIFNoYWRlciBhcyBhIHN0cmluZ1xuLy8gXHRcdGRpc3BhdGNoWCA9IHNldHRpbmdzLmdyaWRfdywgLy8gRGlzcGF0Y2ggd29ya2VycyB3aWR0aFxuLy8gXHRcdGRpc3BhdGNoWSA9IHNldHRpbmdzLmdyaWRfaCwgLy8gRGlzcGF0Y2ggd29ya2VycyBoZWlnaHRcbi8vIFx0fSkge1xuLy8gXHRcdC8vIENyZWF0ZSB0aGUgc2hhZGVyIG1vZHVsZSB1c2luZyB0aGUgV0dTTCBzdHJpbmcgYW5kIHVzZSBpdFxuLy8gXHRcdC8vIHRvIGNyZWF0ZSBhIGNvbXB1dGUgcGlwZWxpbmUgd2l0aCAnYXV0bycgYmluZGluZyBsYXlvdXRcbi8vIFx0XHR0aGlzLmNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuLy8gXHRcdFx0bGF5b3V0OiBcImF1dG9cIixcbi8vIFx0XHRcdGNvbXB1dGU6IHtcbi8vIFx0XHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHsgY29kZTogc2hhZGVyIH0pLFxuLy8gXHRcdFx0XHRlbnRyeVBvaW50OiBcIm1haW5cIixcbi8vIFx0XHRcdH0sXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHQvLyBDb25jYXQgdGhlIGJ1ZmZlciAmIHVuaWZvcm1zIGFuZCBmb3JtYXQgdGhlIGVudHJpZXMgdG8gdGhlIHJpZ2h0IFdlYkdQVSBmb3JtYXRcbi8vIFx0XHRsZXQgZW50cmllcyA9IGJ1ZmZlcnNcbi8vIFx0XHRcdC5tYXAoKGIpID0+IGIuYnVmZmVycylcbi8vIFx0XHRcdC5mbGF0KClcbi8vIFx0XHRcdC5tYXAoKGJ1ZmZlcikgPT4gKHsgYnVmZmVyIH0pKTtcbi8vIFx0XHRlbnRyaWVzLnB1c2goLi4udW5pZm9ybXMubWFwKCh7IGJ1ZmZlciB9KSA9PiAoeyBidWZmZXIgfSkpKTtcbi8vIFx0XHRlbnRyaWVzID0gZW50cmllcy5tYXAoKGUsIGkpID0+ICh7XG4vLyBcdFx0XHRiaW5kaW5nOiBpLFxuLy8gXHRcdFx0cmVzb3VyY2U6IGUsXG4vLyBcdFx0fSkpO1xuXG4vLyBcdFx0Ly8gQ3JlYXRlIHRoZSBiaW5kIGdyb3VwIHVzaW5nIHRoZXNlIGVudHJpZXMgJiBhdXRvLWxheW91dCBkZXRlY3Rpb25cbi8vIFx0XHR0aGlzLmJpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuLy8gXHRcdFx0bGF5b3V0OiB0aGlzLmNvbXB1dGVQaXBlbGluZS5nZXRCaW5kR3JvdXBMYXlvdXQoMCAvKiBpbmRleCAqLyksXG4vLyBcdFx0XHRlbnRyaWVzOiBlbnRyaWVzLFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0dGhpcy5kaXNwYXRjaFggPSBkaXNwYXRjaFg7XG4vLyBcdFx0dGhpcy5kaXNwYXRjaFkgPSBkaXNwYXRjaFk7XG4vLyBcdH1cblxuLy8gXHQvLyBEaXNwYXRjaCB0aGUgY29tcHV0ZSBwaXBlbGluZSB0byB0aGUgR1BVXG4vLyBcdGRpc3BhdGNoKHBhc3NFbmNvZGVyKSB7XG4vLyBcdFx0cGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy5jb21wdXRlUGlwZWxpbmUpO1xuLy8gXHRcdHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCB0aGlzLmJpbmRHcm91cCk7XG4vLyBcdFx0cGFzc0VuY29kZXIuZGlzcGF0Y2hXb3JrZ3JvdXBzKFxuLy8gXHRcdFx0TWF0aC5jZWlsKHRoaXMuZGlzcGF0Y2hYIC8gOCksXG4vLyBcdFx0XHRNYXRoLmNlaWwodGhpcy5kaXNwYXRjaFkgLyA4KVxuLy8gXHRcdCk7XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8vIFVzZWZ1bCBjbGFzc2VzIGZvciBjbGVhbmVyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIGlucHV0IGFuZCBvdXRwdXQgYnVmZmVyc1xuLy8gLy8vIHVzZWQgaW4gdGhlIGRlY2xhcmF0aW9ucyBvZiBwcm9ncmFtcyAmIGZsdWlkIHNpbXVsYXRpb24gc3RlcHNcblxuLy8gY2xhc3MgQWR2ZWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGFkdmVjdFNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3F1YW50aXR5LCBpbl92ZWxvY2l0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgRGl2ZXJnZW5jZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF9kaXZlcmdlbmNlLFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGRpdmVyZ2VuY2VTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X2RpdmVyZ2VuY2VdLCB1bmlmb3Jtcywgc2hhZGVyIH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFByZXNzdXJlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fZGl2ZXJnZW5jZSxcbi8vIFx0XHRvdXRfcHJlc3N1cmUsXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gcHJlc3N1cmVTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX2RpdmVyZ2VuY2UsIG91dF9wcmVzc3VyZV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBHcmFkaWVudFN1YnRyYWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGdyYWRpZW50U3VidHJhY3RTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX3ZlbG9jaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgQm91bmRhcnlQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gYm91bmRhcnlTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSwgdW5pZm9ybXMsIHNoYWRlciB9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBVcGRhdGVQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdXBkYXRlVmVsb2NpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVm9ydGljaXR5UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZvcnRpY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB2b3J0aWNpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X3ZvcnRpY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFZvcnRpY2l0eUNvbmZpbm1lbnRQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRpbl92b3J0aWNpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHZvcnRpY2l0eUNvbmZpbm1lbnRTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgaW5fdm9ydGljaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG5mdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7IHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIgfSxcblx0cmVxdWlyZWRGZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtdXG4pOiBQcm9taXNlPEdQVURldmljZT4ge1xuXHRpZiAoIW5hdmlnYXRvci5ncHUpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJXZWJHUFUgTk9UIFN1cHBvcnRlZFwiKTtcblxuXHRjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcihvcHRpb25zKTtcblx0aWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cblx0cmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSh7IHJlcXVpcmVkRmVhdHVyZXM6IHJlcXVpcmVkRmVhdHVyZXMgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemUgPSB7IHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgfVxuKToge1xuXHRjb250ZXh0OiBHUFVDYW52YXNDb250ZXh0O1xuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCBjYW52YXMgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHNpemUpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cblx0Y29uc3QgY29udGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIikhLmdldENvbnRleHQoXCJ3ZWJncHVcIik7XG5cdGlmICghY29udGV4dCkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIkNhbnZhcyBkb2VzIG5vdCBzdXBwb3J0IFdlYkdQVVwiKTtcblxuXHRjb25zdCBmb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXHRjb250ZXh0LmNvbmZpZ3VyZSh7XG5cdFx0ZGV2aWNlOiBkZXZpY2UsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcblx0XHRhbHBoYU1vZGU6IFwicHJlbXVsdGlwbGllZFwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCwgc2l6ZTogc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdHZlcnRleEJ1ZmZlcixcblx0XHQvKmJ1ZmZlck9mZnNldD0qLyAwLFxuXHRcdC8qZGF0YT0qLyBhcnJheVxuXHQpO1xuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFRleHR1cmVzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0YmluZGluZ3M6IG51bWJlcltdLFxuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdGZvcm1hdDoge1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdH0gPSB7XG5cdFx0c3RvcmFnZTogXCJyMzJmbG9hdFwiLFxuXHR9XG4pOiB7XG5cdHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfTtcblx0Zm9ybWF0OiB7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0fTtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IHRleHR1cmVEYXRhID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KGZvcm1hdC5zdG9yYWdlKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0dGV4dHVyZURhdGFbaV0gPSBbXTtcblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgQ0hBTk5FTFM7IGorKykge1xuXHRcdFx0dGV4dHVyZURhdGFbaV0ucHVzaChNYXRoLnJhbmRvbSgpID4gMSAvIDIgPyAwIDogMCk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgdGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9ID0ge307XG5cdGJpbmRpbmdzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdHRleHR1cmVzW2tleV0gPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHRsYWJlbDogYFRleHR1cmUgJHtrZXl9YCxcblx0XHRcdHNpemU6IFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sXG5cdFx0XHRmb3JtYXQ6IGZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QsXG5cdFx0fSk7XG5cdH0pO1xuXG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlRGF0YS5mbGF0KCkpO1xuXHRPYmplY3QudmFsdWVzKHRleHR1cmVzKS5mb3JFYWNoKCh0ZXh0dXJlKSA9PiB7XG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlVGV4dHVyZShcblx0XHRcdHsgdGV4dHVyZSB9LFxuXHRcdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdFx0LypkYXRhTGF5b3V0PSovIHtcblx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRcdHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQsXG5cdFx0XHR9LFxuXHRcdFx0LypzaXplPSovIHNpemVcblx0XHQpO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdHRleHR1cmVzOiB0ZXh0dXJlcyxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogbnVtYmVyID0gMTAwXG4pOiB7XG5cdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcblx0bGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuXHR2YXIgc2lnbiA9IDE7XG5cblx0bGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG5cdGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG5cdGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG5cdGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuXHRcdC8vIGRpc2FibGUgY29udGV4dCBtZW51XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIGV2ZW50c1xuXHRcdFtcIm1vdXNlbW92ZVwiLCBcInRvdWNobW92ZVwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC5vZmZzZXRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCB4ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGxldCB5ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi55IC8gY2FudmFzLmhlaWdodCkgKiB0ZXh0dXJlLmhlaWdodFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRkYXRhLnNldChbeCwgeV0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIHpvb20gZXZlbnRzIFRPRE8oQGdzemVwKSBhZGQgcGluY2ggYW5kIHNjcm9sbCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIndoZWVsXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS54ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS55ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaXplICs9IHZlbG9jaXR5Lnk7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyBjbGljayBldmVudHMgVE9ETyhAZ3N6ZXApIGltcGxlbWVudCByaWdodCBjbGljayBlcXVpdmFsZW50IGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wibW91c2Vkb3duXCIsIFwidG91Y2hzdGFydFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IDEgLSBldmVudC5idXR0b247XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSA/IC0xIDogMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpZ24gKiBzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdFtcIm1vdXNldXBcIiwgXCJ0b3VjaGVuZFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW05hTl0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXHRjb25zdCB1bmlmb3JtQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiSW50ZXJhY3Rpb24gQnVmZmVyXCIsXG5cdFx0c2l6ZTogZGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YnVmZmVyOiB1bmlmb3JtQnVmZmVyLFxuXHRcdGRhdGE6IGRhdGEsXG5cdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoYW5uZWxDb3VudChmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQpOiBudW1iZXIge1xuXHRpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiYVwiKSkge1xuXHRcdHJldHVybiA0O1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYlwiKSkge1xuXHRcdHJldHVybiAzO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnXCIpKSB7XG5cdFx0cmV0dXJuIDI7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwiclwiKSkge1xuXHRcdHJldHVybiAxO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZm9ybWF0OiBcIiArIGZvcm1hdCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0VmFsdWVzKGNvZGU6IHN0cmluZywgdmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogc3RyaW5nIHtcblx0Y29uc3QgcmVnID0gbmV3IFJlZ0V4cChPYmplY3Qua2V5cyh2YXJpYWJsZXMpLmpvaW4oXCJ8XCIpLCBcImdcIik7XG5cdHJldHVybiBjb2RlLnJlcGxhY2UocmVnLCAoaykgPT4gdmFyaWFibGVzW2tdLnRvU3RyaW5nKCkpO1xufVxuXG5leHBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0c2V0VmFsdWVzLFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==