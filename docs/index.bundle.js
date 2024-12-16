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




const WORKGROUP_SIZE = 8;
const UPDATE_INTERVAL = 1;
let frame_index = 0;
async function index() {
    // setup and configure WebGPU
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    const GROUP_INDEX = 0;
    // initialize vertex buffer and textures
    const VERTEX_INDEX = 0;
    const QUAD = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
    const quad = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(device, "Quad Vertex Buffer", QUAD);
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, canvas.size);
    const READ_BINDING = 0;
    const WRITE_BINDING = 1;
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
                binding: READ_BINDING,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-only",
                    format: textures.format,
                },
            },
            {
                binding: WRITE_BINDING,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "write-only",
                    format: textures.format,
                },
            },
            {
                binding: INTERACTION_BINDING,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: interactions.type,
                },
            },
        ],
    });
    const bindGroups = [0, 1].map((i) => device.createBindGroup({
        label: `Bind Group > ${textures.textures[i].label}`,
        layout: bindGroupLayout,
        entries: [
            {
                binding: READ_BINDING,
                resource: textures.textures[i % 2].createView(),
            },
            {
                binding: WRITE_BINDING,
                resource: textures.textures[(i + 1) % 2].createView(),
            },
            {
                binding: INTERACTION_BINDING,
                resource: {
                    buffer: interactions.buffer,
                },
            },
        ],
    }));
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
                    READ_BINDING: READ_BINDING,
                    WRITE_BINDING: WRITE_BINDING,
                    INTERACTION_BINDING: INTERACTION_BINDING,
                    FORMAT: textures.format,
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
                    FORMAT: textures.format,
                    GROUP_INDEX: GROUP_INDEX,
                    READ_BINDING: READ_BINDING,
                    VERTEX_INDEX: VERTEX_INDEX,
                    RENDER_INDEX: RENDER_INDEX,
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
        computePass.setBindGroup(GROUP_INDEX, bindGroups[frame_index % 2]);
        device.queue.writeBuffer(interactions.buffer, 
        /*offset=*/ 0, 
        /*data=*/ interactions.data);
        computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
        computePass.end();
        frame_index++;
        // render pass
        const view = canvas.context.getCurrentTexture().createView();
        renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
        const renderPass = command.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(GROUP_INDEX, bindGroups[frame_index % 2]);
        renderPass.setVertexBuffer(VERTEX_INDEX, quad.vertexBuffer);
        renderPass.draw(quad.vertexCount);
        renderPass.end();
        // submit the command buffer
        device.queue.submit([command.finish()]);
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
async function requestDevice(options = { powerPreference: "high-performance" }) {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter(options);
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    return adapter.requestDevice();
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
        alphaMode: "opaque",
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
function setupTextures(device, size, format = "rgba32float") {
    const textureData = new Array(size.width * size.height);
    const CHANNELS = channelCount(format);
    for (let i = 0; i < size.width * size.height; i++) {
        textureData[i] = [];
        for (let j = 0; j < CHANNELS; j++) {
            textureData[i].push(Math.random() > 0.5 ? 1 : 0);
        }
    }
    const stateTextures = ["A", "B"].map((label) => device.createTexture({
        label: `State Texture ${label}`,
        size: [size.width, size.height],
        format: format,
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
    }));
    const texture = stateTextures[0];
    const array = new Float32Array(textureData.flat());
    device.queue.writeTexture({ texture }, 
    /*data=*/ array, 
    /*dataLayout=*/ {
        offset: 0,
        bytesPerRow: size.width * array.BYTES_PER_ELEMENT * CHANNELS,
        rowsPerImage: size.height,
    }, 
    /*size=*/ size);
    return {
        textures: stateTextures,
        format: format,
        size: size,
    };
}
function setupInteractions(device, canvas, texture, size = { width: 20, height: 20 }) {
    let data = new Int32Array(4);
    let position = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    data.set([texture.width, texture.height, position.x, position.y]);
    if (canvas instanceof HTMLCanvasElement) {
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
            });
        });
        // zoom events TODO(@gszep) add pinch and scroll for touch devices
        ["wheel"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof WheelEvent:
                        velocity.x = event.deltaY / 10;
                        velocity.y = event.deltaY / 10;
                        break;
                }
                size.width += velocity.x;
                size.height += velocity.y;
                data.set([size.width, size.height], 2);
            });
        });
        // click events
        ["mousedown", "touchstart"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                data.set([size.width, size.height], 2);
            });
        });
        ["mouseup", "touchend"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                data.set([0, 0], 2);
            });
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

module.exports = "struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var state: texture_storage_2d<FORMAT, read>;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    let uv = vec2<u32>(input.coordinate * vec2<f32>(textureDimensions(state)));\n    output.color = textureLoad(state, uv);\n\n    return output;\n}";

/***/ }),

/***/ "./src/shaders/cell.vert.wgsl":
/*!************************************!*\
  !*** ./src/shaders/cell.vert.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "struct Input {\n  @builtin(instance_index) instance: u32,\n  @location(VERTEX_INDEX) position: vec2<f32>,\n};\n\nstruct Output {\n  @builtin(position) position: vec4<f32>,\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\n@vertex\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    output.position = vec4<f32>(2 * input.position.x - 1, 1 - 2 * input.position.y, 0, 1);\n    output.coordinate = input.position;\n\n    return output;\n}";

/***/ }),

/***/ "./src/shaders/timestep.comp.wgsl":
/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
/***/ ((module) => {

module.exports = "struct Input {\n  @builtin(global_invocation_id) position: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<i32>,\n    size: vec2<i32>,\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var inputState: texture_storage_2d<FORMAT, read>;\n@group(GROUP_INDEX) @binding(WRITE_BINDING) var outputState: texture_storage_2d<FORMAT, write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn state(position: vec2<i32>) -> vec4<f32> {\n    return textureLoad(inputState, position);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(input: Input) {\n\n    let position = vec2<i32>(input.position.xy);\n    let boundary = vec2<i32>(textureDimensions(inputState));\n    var neighbors = vec4<u32>(0, 0, 0, 0);\n\n    var dI = vec2<i32>(0, 0);\n    for (var i: i32 = -1; i < 2; i = i + 1) {\n        for (var j: i32 = -1; j < 2; j = j + 1) {\n\n            dI.x = i;\n            dI.y = j;\n\n            // ignore the current cell\n            if dI.x == 0 && dI.y == 0 {\n                continue;\n            }\n\n            // periodic boundary conditions\n            neighbors += vec4<u32>(state((position + dI) % boundary));\n        }\n    }\n\n    // brush interaction\n    let distance = abs(position - interaction.position);\n    if all(distance < interaction.size) {\n        neighbors += vec4<u32>(1, 1, 1, 1);\n    }\n\n    // Conway's game of life rules\n    var next_state = vec4<f32>(0, 0, 0, 0);\n    for (var k: i32 = 0; k < 4; k = k + 1) {\n        switch neighbors[k] {\n            case 2: {\n                next_state[k] = state(position)[k];\n            }\n            case 3: {\n                next_state[k] = 1;\n            }\n            default: {\n                next_state[k] = 0;\n            }\n        }\n    }\n    textureStore(outputState, position, next_state);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25DLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLENBQUM7UUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7QUFDRixDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFFLFNBQThCO0lBQzlELE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzlELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFTQyIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHNldFZhbHVlcyxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IGNlbGxWZXJ0ZXhTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLnZlcnQud2dzbFwiO1xuaW1wb3J0IGNlbGxGcmFnbWVudFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwuZnJhZy53Z3NsXCI7XG5pbXBvcnQgdGltZXN0ZXBDb21wdXRlU2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvdGltZXN0ZXAuY29tcC53Z3NsXCI7XG5cbmNvbnN0IFdPUktHUk9VUF9TSVpFID0gODtcbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDE7XG5sZXQgZnJhbWVfaW5kZXggPSAwO1xuXG5hc3luYyBmdW5jdGlvbiBpbmRleCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0Ly8gc2V0dXAgYW5kIGNvbmZpZ3VyZSBXZWJHUFVcblx0Y29uc3QgZGV2aWNlID0gYXdhaXQgcmVxdWVzdERldmljZSgpO1xuXHRjb25zdCBjYW52YXMgPSBjb25maWd1cmVDYW52YXMoZGV2aWNlKTtcblx0Y29uc3QgR1JPVVBfSU5ERVggPSAwO1xuXG5cdC8vIGluaXRpYWxpemUgdmVydGV4IGJ1ZmZlciBhbmQgdGV4dHVyZXNcblx0Y29uc3QgVkVSVEVYX0lOREVYID0gMDtcblx0Y29uc3QgUVVBRCA9IFswLCAwLCAxLCAwLCAxLCAxLCAwLCAwLCAxLCAxLCAwLCAxXTtcblxuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblx0Y29uc3QgdGV4dHVyZXMgPSBzZXR1cFRleHR1cmVzKGRldmljZSwgY2FudmFzLnNpemUpO1xuXG5cdGNvbnN0IFJFQURfQklORElORyA9IDA7XG5cdGNvbnN0IFdSSVRFX0JJTkRJTkcgPSAxO1xuXHRjb25zdCBXT1JLR1JPVVBfQ09VTlQ6IFtudW1iZXIsIG51bWJlcl0gPSBbXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUud2lkdGggLyBXT1JLR1JPVVBfU0laRSksXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUuaGVpZ2h0IC8gV09SS0dST1VQX1NJWkUpLFxuXHRdO1xuXG5cdC8vIHNldHVwIGludGVyYWN0aW9uc1xuXHRjb25zdCBJTlRFUkFDVElPTl9CSU5ESU5HID0gMjtcblx0Y29uc3QgaW50ZXJhY3Rpb25zID0gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdFx0ZGV2aWNlLFxuXHRcdGNhbnZhcy5jb250ZXh0LmNhbnZhcyxcblx0XHR0ZXh0dXJlcy5zaXplXG5cdCk7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC1vbmx5XCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBXUklURV9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJ3cml0ZS1vbmx5XCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBpbnRlcmFjdGlvbnMudHlwZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwcyA9IFswLCAxXS5tYXAoKGkpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogYEJpbmQgR3JvdXAgPiAke3RleHR1cmVzLnRleHR1cmVzW2ldLmxhYmVsfWAsXG5cdFx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbaSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzWyhpICsgMSkgJSAyXS5jcmVhdGVWaWV3KCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSlcblx0KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIHtcblx0XHRcdFx0XHRXT1JLR1JPVVBfU0laRTogV09SS0dST1VQX1NJWkUsXG5cdFx0XHRcdFx0R1JPVVBfSU5ERVg6IEdST1VQX0lOREVYLFxuXHRcdFx0XHRcdFJFQURfQklORElORzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdFdSSVRFX0JJTkRJTkc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0SU5URVJBQ1RJT05fQklORElORzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0XHRGT1JNQVQ6IHRleHR1cmVzLmZvcm1hdCxcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxWZXJ0ZXhTaGFkZXIsIHtcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIHtcblx0XHRcdFx0XHRGT1JNQVQ6IHRleHR1cmVzLmZvcm1hdCxcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0VkVSVEVYX0lOREVYOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0UkVOREVSX0lOREVYOiBSRU5ERVJfSU5ERVgsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBjYW52YXMuZm9ybWF0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXG5cdFx0e1xuXHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRsb2FkT3A6IFwibG9hZFwiLFxuXHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdH0sXG5cdF07XG5cdGNvbnN0IHJlbmRlclBhc3NEZXNjcmlwdG9yID0ge1xuXHRcdGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMsXG5cdH07XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcblxuXHRcdC8vIGNvbXB1dGUgcGFzc1xuXHRcdGNvbnN0IGNvbXB1dGVQYXNzID0gY29tbWFuZC5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShjb21wdXRlUGlwZWxpbmUpO1xuXHRcdGNvbXB1dGVQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3Vwc1tmcmFtZV9pbmRleCAlIDJdKTtcblxuXHRcdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHRcdGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHQvKm9mZnNldD0qLyAwLFxuXHRcdFx0LypkYXRhPSovIGludGVyYWN0aW9ucy5kYXRhXG5cdFx0KTtcblxuXHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXHRcdGNvbXB1dGVQYXNzLmVuZCgpO1xuXG5cdFx0ZnJhbWVfaW5kZXgrKztcblxuXHRcdC8vIHJlbmRlciBwYXNzXG5cdFx0Y29uc3QgdmlldyA9IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpO1xuXHRcdHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHNbUkVOREVSX0lOREVYXS52aWV3ID0gdmlldztcblx0XHRjb25zdCByZW5kZXJQYXNzID0gY29tbWFuZC5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuXG5cdFx0cmVuZGVyUGFzcy5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cHNbZnJhbWVfaW5kZXggJSAyXSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRWZXJ0ZXhCdWZmZXIoVkVSVEVYX0lOREVYLCBxdWFkLnZlcnRleEJ1ZmZlcik7XG5cdFx0cmVuZGVyUGFzcy5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlclBhc3MuZW5kKCk7XG5cblx0XHQvLyBzdWJtaXQgdGhlIGNvbW1hbmQgYnVmZmVyXG5cdFx0ZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZC5maW5pc2goKV0pO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCIvLyAvLyBDcmVhdGVzIGFuZCBtYW5hZ2UgbXVsdGktZGltZW5zaW9uYWwgYnVmZmVycyBieSBjcmVhdGluZyBhIGJ1ZmZlciBmb3IgZWFjaCBkaW1lbnNpb25cbi8vIGNsYXNzIER5bmFtaWNCdWZmZXIge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0ZGltcyA9IDEsIC8vIE51bWJlciBvZiBkaW1lbnNpb25zXG4vLyBcdFx0dyA9IHNldHRpbmdzLmdyaWRfdywgLy8gQnVmZmVyIHdpZHRoXG4vLyBcdFx0aCA9IHNldHRpbmdzLmdyaWRfaCwgLy8gQnVmZmVyIGhlaWdodFxuLy8gXHR9ID0ge30pIHtcbi8vIFx0XHR0aGlzLmRpbXMgPSBkaW1zO1xuLy8gXHRcdHRoaXMuYnVmZmVyU2l6ZSA9IHcgKiBoICogNDtcbi8vIFx0XHR0aGlzLncgPSB3O1xuLy8gXHRcdHRoaXMuaCA9IGg7XG4vLyBcdFx0dGhpcy5idWZmZXJzID0gbmV3IEFycmF5KGRpbXMpLmZpbGwoKS5tYXAoKF8pID0+XG4vLyBcdFx0XHRkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5idWZmZXJTaXplLFxuLy8gXHRcdFx0XHR1c2FnZTpcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHxcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyB8XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KVxuLy8gXHRcdCk7XG4vLyBcdH1cblxuLy8gXHQvLyBDb3B5IGVhY2ggYnVmZmVyIHRvIGFub3RoZXIgRHluYW1pY0J1ZmZlcidzIGJ1ZmZlcnMuXG4vLyBcdC8vIElmIHRoZSBkaW1lbnNpb25zIGRvbid0IG1hdGNoLCB0aGUgbGFzdCBub24tZW1wdHkgZGltZW5zaW9uIHdpbGwgYmUgY29waWVkIGluc3RlYWRcbi8vIFx0Y29weVRvKGJ1ZmZlciwgY29tbWFuZEVuY29kZXIpIHtcbi8vIFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWF4KHRoaXMuZGltcywgYnVmZmVyLmRpbXMpOyBpKyspIHtcbi8vIFx0XHRcdGNvbW1hbmRFbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJzW01hdGgubWluKGksIHRoaXMuYnVmZmVycy5sZW5ndGggLSAxKV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdGJ1ZmZlci5idWZmZXJzW01hdGgubWluKGksIGJ1ZmZlci5idWZmZXJzLmxlbmd0aCAtIDEpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJTaXplXG4vLyBcdFx0XHQpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdC8vIFJlc2V0IGFsbCB0aGUgYnVmZmVyc1xuLy8gXHRjbGVhcihxdWV1ZSkge1xuLy8gXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kaW1zOyBpKyspIHtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcnNbaV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodGhpcy53ICogdGhpcy5oKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gTWFuYWdlIHVuaWZvcm0gYnVmZmVycyByZWxhdGl2ZSB0byB0aGUgY29tcHV0ZSBzaGFkZXJzICYgdGhlIGd1aVxuLy8gY2xhc3MgVW5pZm9ybSB7XG4vLyBcdGNvbnN0cnVjdG9yKFxuLy8gXHRcdG5hbWUsXG4vLyBcdFx0e1xuLy8gXHRcdFx0c2l6ZSxcbi8vIFx0XHRcdHZhbHVlLFxuLy8gXHRcdFx0bWluLFxuLy8gXHRcdFx0bWF4LFxuLy8gXHRcdFx0c3RlcCxcbi8vIFx0XHRcdG9uQ2hhbmdlLFxuLy8gXHRcdFx0ZGlzcGxheU5hbWUsXG4vLyBcdFx0XHRhZGRUb0dVSSA9IHRydWUsXG4vLyBcdFx0fSA9IHt9XG4vLyBcdCkge1xuLy8gXHRcdHRoaXMubmFtZSA9IG5hbWU7XG4vLyBcdFx0dGhpcy5zaXplID0gc2l6ZSA/PyAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUubGVuZ3RoIDogMSk7XG4vLyBcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSkge1xuLy8gXHRcdFx0aWYgKHNldHRpbmdzW25hbWVdID09IG51bGwpIHtcbi8vIFx0XHRcdFx0c2V0dGluZ3NbbmFtZV0gPSB2YWx1ZSA/PyAwO1xuLy8gXHRcdFx0XHR0aGlzLmFsd2F5c1VwZGF0ZSA9IHRydWU7XG4vLyBcdFx0XHR9IGVsc2UgaWYgKGFkZFRvR1VJKSB7XG4vLyBcdFx0XHRcdGd1aS5hZGQoc2V0dGluZ3MsIG5hbWUsIG1pbiwgbWF4LCBzdGVwKVxuLy8gXHRcdFx0XHRcdC5vbkNoYW5nZSgodikgPT4ge1xuLy8gXHRcdFx0XHRcdFx0aWYgKG9uQ2hhbmdlKSBvbkNoYW5nZSh2KTtcbi8vIFx0XHRcdFx0XHRcdHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuLy8gXHRcdFx0XHRcdH0pXG4vLyBcdFx0XHRcdFx0Lm5hbWUoZGlzcGxheU5hbWUgPz8gbmFtZSk7XG4vLyBcdFx0XHR9XG4vLyBcdFx0fVxuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSB8fCB2YWx1ZSAhPSBudWxsKSB7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRtYXBwZWRBdENyZWF0aW9uOiB0cnVlLFxuLy8gXHRcdFx0XHRzaXplOiB0aGlzLnNpemUgKiA0LFxuLy8gXHRcdFx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSk7XG5cbi8vIFx0XHRcdGNvbnN0IGFycmF5QnVmZmVyID0gdGhpcy5idWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKTtcbi8vIFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkoYXJyYXlCdWZmZXIpLnNldChcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbc2V0dGluZ3NbbmFtZV1dKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyLnVubWFwKCk7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuc2l6ZSAqIDQsXG4vLyBcdFx0XHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRnbG9iYWxVbmlmb3Jtc1tuYW1lXSA9IHRoaXM7XG4vLyBcdH1cblxuLy8gXHRzZXRWYWx1ZSh2YWx1ZSkge1xuLy8gXHRcdHNldHRpbmdzW3RoaXMubmFtZV0gPSB2YWx1ZTtcbi8vIFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0fVxuXG4vLyBcdC8vIFVwZGF0ZSB0aGUgR1BVIGJ1ZmZlciBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWRcbi8vIFx0dXBkYXRlKHF1ZXVlLCB2YWx1ZSkge1xuLy8gXHRcdGlmICh0aGlzLm5lZWRzVXBkYXRlIHx8IHRoaXMuYWx3YXlzVXBkYXRlIHx8IHZhbHVlICE9IG51bGwpIHtcbi8vIFx0XHRcdGlmICh0eXBlb2YgdGhpcy5uZWVkc1VwZGF0ZSAhPT0gXCJib29sZWFuXCIpIHZhbHVlID0gdGhpcy5uZWVkc1VwZGF0ZTtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcixcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbcGFyc2VGbG9hdChzZXR0aW5nc1t0aGlzLm5hbWVdKV0pLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHR0aGlzLnNpemVcbi8vIFx0XHRcdCk7XG4vLyBcdFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIE9uIGZpcnN0IGNsaWNrOiBzdGFydCByZWNvcmRpbmcgdGhlIG1vdXNlIHBvc2l0aW9uIGF0IGVhY2ggZnJhbWVcbi8vIC8vIE9uIHNlY29uZCBjbGljazogcmVzZXQgdGhlIGNhbnZhcywgc3RhcnQgcmVjb3JkaW5nIHRoZSBjYW52YXMsXG4vLyAvLyBvdmVycmlkZSB0aGUgbW91c2UgcG9zaXRpb24gd2l0aCB0aGUgcHJldmlvdXNseSByZWNvcmRlZCB2YWx1ZXNcbi8vIC8vIGFuZCBmaW5hbGx5IGRvd25sb2FkcyBhIC53ZWJtIDYwZnBzIGZpbGVcbi8vIGNsYXNzIFJlY29yZGVyIHtcbi8vIFx0Y29uc3RydWN0b3IocmVzZXRTaW11bGF0aW9uKSB7XG4vLyBcdFx0dGhpcy5tb3VzZURhdGEgPSBbXTtcblxuLy8gXHRcdHRoaXMuY2FwdHVyZXIgPSBuZXcgQ0NhcHR1cmUoe1xuLy8gXHRcdFx0Zm9ybWF0OiBcIndlYm1cIixcbi8vIFx0XHRcdGZyYW1lcmF0ZTogNjAsXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gZmFsc2U7XG5cbi8vIFx0XHQvLyBSZWNvcmRlciBpcyBkaXNhYmxlZCB1bnRpbCBJIG1ha2UgYSB0b29sdGlwIGV4cGxhaW5pbmcgaG93IGl0IHdvcmtzXG4vLyBcdFx0Ly8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuLy8gXHRcdC8vICAgICBpZiAodGhpcy5pc1JlY29yZGluZykgdGhpcy5zdG9wKClcbi8vIFx0XHQvLyAgICAgZWxzZSB0aGlzLnN0YXJ0KClcbi8vIFx0XHQvLyB9KVxuXG4vLyBcdFx0dGhpcy5yZXNldFNpbXVsYXRpb24gPSByZXNldFNpbXVsYXRpb247XG4vLyBcdH1cblxuLy8gXHRzdGFydCgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyAhPT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBTdGFydCByZWNvcmRpbmcgbW91c2UgcG9zaXRpb25cbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBcIm1vdXNlXCI7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdC8vIFN0YXJ0IHJlY29yZGluZyB0aGUgY2FudmFzXG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gXCJmcmFtZXNcIjtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc3RhcnQoKTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRjb25zb2xlLmxvZyhcInN0YXJ0XCIsIHRoaXMuaXNSZWNvcmRpbmcpO1xuLy8gXHR9XG5cbi8vIFx0dXBkYXRlKCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFJlY29yZCBjdXJyZW50IGZyYW1lJ3MgbW91c2UgZGF0YVxuLy8gXHRcdFx0aWYgKG1vdXNlSW5mb3MuY3VycmVudClcbi8vIFx0XHRcdFx0dGhpcy5tb3VzZURhdGEucHVzaChbXG4vLyBcdFx0XHRcdFx0Li4ubW91c2VJbmZvcy5jdXJyZW50LFxuLy8gXHRcdFx0XHRcdC4uLm1vdXNlSW5mb3MudmVsb2NpdHksXG4vLyBcdFx0XHRcdF0pO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gUmVjb3JkIGN1cnJlbnQgZnJhbWUncyBjYW52YXNcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuY2FwdHVyZShjYW52YXMpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdHN0b3AoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gUmVzZXQgdGhlIHNpbXVsYXRpb24gYW5kIHN0YXJ0IHRoZSBjYW52YXMgcmVjb3JkXG4vLyBcdFx0XHR0aGlzLnJlc2V0U2ltdWxhdGlvbigpO1xuLy8gXHRcdFx0dGhpcy5zdGFydCgpO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gU3RvcCB0aGUgcmVjb3JkaW5nIGFuZCBzYXZlIHRoZSB2aWRlbyBmaWxlXG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnN0b3AoKTtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc2F2ZSgpO1xuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IGZhbHNlO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBDcmVhdGVzIGEgc2hhZGVyIG1vZHVsZSwgY29tcHV0ZSBwaXBlbGluZSAmIGJpbmQgZ3JvdXAgdG8gdXNlIHdpdGggdGhlIEdQVVxuLy8gY2xhc3MgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRidWZmZXJzID0gW10sIC8vIFN0b3JhZ2UgYnVmZmVyc1xuLy8gXHRcdHVuaWZvcm1zID0gW10sIC8vIFVuaWZvcm0gYnVmZmVyc1xuLy8gXHRcdHNoYWRlciwgLy8gV0dTTCBDb21wdXRlIFNoYWRlciBhcyBhIHN0cmluZ1xuLy8gXHRcdGRpc3BhdGNoWCA9IHNldHRpbmdzLmdyaWRfdywgLy8gRGlzcGF0Y2ggd29ya2VycyB3aWR0aFxuLy8gXHRcdGRpc3BhdGNoWSA9IHNldHRpbmdzLmdyaWRfaCwgLy8gRGlzcGF0Y2ggd29ya2VycyBoZWlnaHRcbi8vIFx0fSkge1xuLy8gXHRcdC8vIENyZWF0ZSB0aGUgc2hhZGVyIG1vZHVsZSB1c2luZyB0aGUgV0dTTCBzdHJpbmcgYW5kIHVzZSBpdFxuLy8gXHRcdC8vIHRvIGNyZWF0ZSBhIGNvbXB1dGUgcGlwZWxpbmUgd2l0aCAnYXV0bycgYmluZGluZyBsYXlvdXRcbi8vIFx0XHR0aGlzLmNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuLy8gXHRcdFx0bGF5b3V0OiBcImF1dG9cIixcbi8vIFx0XHRcdGNvbXB1dGU6IHtcbi8vIFx0XHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHsgY29kZTogc2hhZGVyIH0pLFxuLy8gXHRcdFx0XHRlbnRyeVBvaW50OiBcIm1haW5cIixcbi8vIFx0XHRcdH0sXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHQvLyBDb25jYXQgdGhlIGJ1ZmZlciAmIHVuaWZvcm1zIGFuZCBmb3JtYXQgdGhlIGVudHJpZXMgdG8gdGhlIHJpZ2h0IFdlYkdQVSBmb3JtYXRcbi8vIFx0XHRsZXQgZW50cmllcyA9IGJ1ZmZlcnNcbi8vIFx0XHRcdC5tYXAoKGIpID0+IGIuYnVmZmVycylcbi8vIFx0XHRcdC5mbGF0KClcbi8vIFx0XHRcdC5tYXAoKGJ1ZmZlcikgPT4gKHsgYnVmZmVyIH0pKTtcbi8vIFx0XHRlbnRyaWVzLnB1c2goLi4udW5pZm9ybXMubWFwKCh7IGJ1ZmZlciB9KSA9PiAoeyBidWZmZXIgfSkpKTtcbi8vIFx0XHRlbnRyaWVzID0gZW50cmllcy5tYXAoKGUsIGkpID0+ICh7XG4vLyBcdFx0XHRiaW5kaW5nOiBpLFxuLy8gXHRcdFx0cmVzb3VyY2U6IGUsXG4vLyBcdFx0fSkpO1xuXG4vLyBcdFx0Ly8gQ3JlYXRlIHRoZSBiaW5kIGdyb3VwIHVzaW5nIHRoZXNlIGVudHJpZXMgJiBhdXRvLWxheW91dCBkZXRlY3Rpb25cbi8vIFx0XHR0aGlzLmJpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuLy8gXHRcdFx0bGF5b3V0OiB0aGlzLmNvbXB1dGVQaXBlbGluZS5nZXRCaW5kR3JvdXBMYXlvdXQoMCAvKiBpbmRleCAqLyksXG4vLyBcdFx0XHRlbnRyaWVzOiBlbnRyaWVzLFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0dGhpcy5kaXNwYXRjaFggPSBkaXNwYXRjaFg7XG4vLyBcdFx0dGhpcy5kaXNwYXRjaFkgPSBkaXNwYXRjaFk7XG4vLyBcdH1cblxuLy8gXHQvLyBEaXNwYXRjaCB0aGUgY29tcHV0ZSBwaXBlbGluZSB0byB0aGUgR1BVXG4vLyBcdGRpc3BhdGNoKHBhc3NFbmNvZGVyKSB7XG4vLyBcdFx0cGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy5jb21wdXRlUGlwZWxpbmUpO1xuLy8gXHRcdHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCB0aGlzLmJpbmRHcm91cCk7XG4vLyBcdFx0cGFzc0VuY29kZXIuZGlzcGF0Y2hXb3JrZ3JvdXBzKFxuLy8gXHRcdFx0TWF0aC5jZWlsKHRoaXMuZGlzcGF0Y2hYIC8gOCksXG4vLyBcdFx0XHRNYXRoLmNlaWwodGhpcy5kaXNwYXRjaFkgLyA4KVxuLy8gXHRcdCk7XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8vIFVzZWZ1bCBjbGFzc2VzIGZvciBjbGVhbmVyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIGlucHV0IGFuZCBvdXRwdXQgYnVmZmVyc1xuLy8gLy8vIHVzZWQgaW4gdGhlIGRlY2xhcmF0aW9ucyBvZiBwcm9ncmFtcyAmIGZsdWlkIHNpbXVsYXRpb24gc3RlcHNcblxuLy8gY2xhc3MgQWR2ZWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGFkdmVjdFNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3F1YW50aXR5LCBpbl92ZWxvY2l0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgRGl2ZXJnZW5jZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF9kaXZlcmdlbmNlLFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGRpdmVyZ2VuY2VTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X2RpdmVyZ2VuY2VdLCB1bmlmb3Jtcywgc2hhZGVyIH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFByZXNzdXJlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fZGl2ZXJnZW5jZSxcbi8vIFx0XHRvdXRfcHJlc3N1cmUsXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gcHJlc3N1cmVTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX2RpdmVyZ2VuY2UsIG91dF9wcmVzc3VyZV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBHcmFkaWVudFN1YnRyYWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGdyYWRpZW50U3VidHJhY3RTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX3ZlbG9jaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgQm91bmRhcnlQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gYm91bmRhcnlTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSwgdW5pZm9ybXMsIHNoYWRlciB9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBVcGRhdGVQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdXBkYXRlVmVsb2NpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVm9ydGljaXR5UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZvcnRpY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB2b3J0aWNpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X3ZvcnRpY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFZvcnRpY2l0eUNvbmZpbm1lbnRQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRpbl92b3J0aWNpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHZvcnRpY2l0eUNvbmZpbm1lbnRTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgaW5fdm9ydGljaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG5mdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7IHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIgfVxuKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIob3B0aW9ucyk7XG5cdGlmICghYWRhcHRlcikgdGhyb3dEZXRlY3Rpb25FcnJvcihcIk5vIEdQVSBhZGFwdGVyIGZvdW5kXCIpO1xuXG5cdHJldHVybiBhZGFwdGVyLnJlcXVlc3REZXZpY2UoKTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJvcGFxdWVcIixcblx0fSk7XG5cblx0cmV0dXJuIHsgY29udGV4dDogY29udGV4dCwgZm9ybWF0OiBmb3JtYXQsIHNpemU6IHNpemUgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBWZXJ0ZXhCdWZmZXIoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRsYWJlbDogc3RyaW5nLFxuXHRkYXRhOiBudW1iZXJbXVxuKToge1xuXHR2ZXJ0ZXhCdWZmZXI6IEdQVUJ1ZmZlcjtcblx0dmVydGV4Q291bnQ6IG51bWJlcjtcblx0YXJyYXlTdHJpZGU6IG51bWJlcjtcblx0Zm9ybWF0OiBHUFVWZXJ0ZXhGb3JtYXQ7XG59IHtcblx0Y29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXHRjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogbGFiZWwsXG5cdFx0c2l6ZTogYXJyYXkuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVkVSVEVYIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHR2ZXJ0ZXhCdWZmZXIsXG5cdFx0LypidWZmZXJPZmZzZXQ9Ki8gMCxcblx0XHQvKmRhdGE9Ki8gYXJyYXlcblx0KTtcblx0cmV0dXJuIHtcblx0XHR2ZXJ0ZXhCdWZmZXI6IHZlcnRleEJ1ZmZlcixcblx0XHR2ZXJ0ZXhDb3VudDogYXJyYXkubGVuZ3RoIC8gMixcblx0XHRhcnJheVN0cmlkZTogMiAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuXHRcdGZvcm1hdDogXCJmbG9hdDMyeDJcIixcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUZXh0dXJlcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0ID0gXCJyZ2JhMzJmbG9hdFwiXG4pOiB7XG5cdHRleHR1cmVzOiBHUFVUZXh0dXJlW107XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IHRleHR1cmVEYXRhID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KGZvcm1hdCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzaXplLndpZHRoICogc2l6ZS5oZWlnaHQ7IGkrKykge1xuXHRcdHRleHR1cmVEYXRhW2ldID0gW107XG5cblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IENIQU5ORUxTOyBqKyspIHtcblx0XHRcdHRleHR1cmVEYXRhW2ldLnB1c2goTWF0aC5yYW5kb20oKSA+IDAuNSA/IDEgOiAwKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBzdGF0ZVRleHR1cmVzID0gW1wiQVwiLCBcIkJcIl0ubWFwKChsYWJlbCkgPT5cblx0XHRkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHRsYWJlbDogYFN0YXRlIFRleHR1cmUgJHtsYWJlbH1gLFxuXHRcdFx0c2l6ZTogW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0XSxcblx0XHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QsXG5cdFx0fSlcblx0KTtcblxuXHRjb25zdCB0ZXh0dXJlID0gc3RhdGVUZXh0dXJlc1swXTtcblx0Y29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KHRleHR1cmVEYXRhLmZsYXQoKSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlVGV4dHVyZShcblx0XHR7IHRleHR1cmUgfSxcblx0XHQvKmRhdGE9Ki8gYXJyYXksXG5cdFx0LypkYXRhTGF5b3V0PSovIHtcblx0XHRcdG9mZnNldDogMCxcblx0XHRcdGJ5dGVzUGVyUm93OiBzaXplLndpZHRoICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiBDSEFOTkVMUyxcblx0XHRcdHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQsXG5cdFx0fSxcblx0XHQvKnNpemU9Ki8gc2l6ZVxuXHQpO1xuXG5cdHJldHVybiB7XG5cdFx0dGV4dHVyZXM6IHN0YXRlVGV4dHVyZXMsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0c2l6ZTogc2l6ZSxcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgT2Zmc2NyZWVuQ2FudmFzLFxuXHR0ZXh0dXJlOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSA9IHsgd2lkdGg6IDIwLCBoZWlnaHQ6IDIwIH1cbik6IHtcblx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdGRhdGE6IEJ1ZmZlclNvdXJjZSB8IFNoYXJlZEFycmF5QnVmZmVyO1xuXHR0eXBlOiBHUFVCdWZmZXJCaW5kaW5nVHlwZTtcbn0ge1xuXHRsZXQgZGF0YSA9IG5ldyBJbnQzMkFycmF5KDQpO1xuXHRsZXQgcG9zaXRpb24gPSB7IHg6IDAsIHk6IDAgfTtcblx0bGV0IHZlbG9jaXR5ID0geyB4OiAwLCB5OiAwIH07XG5cblx0ZGF0YS5zZXQoW3RleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0LCBwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG5cdGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuXHRcdC8vIG1vdmUgZXZlbnRzXG5cdFx0W1wibW91c2Vtb3ZlXCIsIFwidG91Y2htb3ZlXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChldmVudCkgPT4ge1xuXHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50Lm9mZnNldFk7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB4ID0gTWF0aC5mbG9vcigocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoKTtcblx0XHRcdFx0bGV0IHkgPSBNYXRoLmZsb29yKFxuXHRcdFx0XHRcdChwb3NpdGlvbi55IC8gY2FudmFzLmhlaWdodCkgKiB0ZXh0dXJlLmhlaWdodFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGRhdGEuc2V0KFt4LCB5XSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIHpvb20gZXZlbnRzIFRPRE8oQGdzemVwKSBhZGQgcGluY2ggYW5kIHNjcm9sbCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIndoZWVsXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChldmVudCkgPT4ge1xuXHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdHZlbG9jaXR5LnggPSBldmVudC5kZWx0YVkgLyAxMDtcblx0XHRcdFx0XHRcdHZlbG9jaXR5LnkgPSBldmVudC5kZWx0YVkgLyAxMDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2l6ZS53aWR0aCArPSB2ZWxvY2l0eS54O1xuXHRcdFx0XHRzaXplLmhlaWdodCArPSB2ZWxvY2l0eS55O1xuXG5cdFx0XHRcdGRhdGEuc2V0KFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sIDIpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBjbGljayBldmVudHNcblx0XHRbXCJtb3VzZWRvd25cIiwgXCJ0b3VjaHN0YXJ0XCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChldmVudCkgPT4ge1xuXHRcdFx0XHRkYXRhLnNldChbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLCAyKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdFtcIm1vdXNldXBcIiwgXCJ0b3VjaGVuZFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZXZlbnQpID0+IHtcblx0XHRcdFx0ZGF0YS5zZXQoWzAsIDBdLCAyKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJJbnRlcmFjdGlvbiBCdWZmZXJcIixcblx0XHRzaXplOiBkYXRhLmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRidWZmZXI6IHVuaWZvcm1CdWZmZXIsXG5cdFx0ZGF0YTogZGF0YSxcblx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0fTtcbn1cblxuZnVuY3Rpb24gY2hhbm5lbENvdW50KGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCk6IG51bWJlciB7XG5cdGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JhXCIpKSB7XG5cdFx0cmV0dXJuIDQ7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiXCIpKSB7XG5cdFx0cmV0dXJuIDM7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdcIikpIHtcblx0XHRyZXR1cm4gMjtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyXCIpKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBmb3JtYXQ6IFwiICsgZm9ybWF0KTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRWYWx1ZXMoY29kZTogc3RyaW5nLCB2YXJpYWJsZXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBzdHJpbmcge1xuXHRjb25zdCByZWcgPSBuZXcgUmVnRXhwKE9iamVjdC5rZXlzKHZhcmlhYmxlcykuam9pbihcInxcIiksIFwiZ1wiKTtcblx0cmV0dXJuIGNvZGUucmVwbGFjZShyZWcsIChrKSA9PiB2YXJpYWJsZXNba10udG9TdHJpbmcoKSk7XG59XG5cbmV4cG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRzZXRWYWx1ZXMsXG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9