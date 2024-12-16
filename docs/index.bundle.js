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




const GRID_SIZE = 512;
const WORKGROUP_SIZE = 8;
const WORKGROUP_COUNT = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
const UPDATE_INTERVAL = 1;
let frame_index = 0;
async function index() {
    // setup and configure WebGPU
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)({
        powerPreference: "high-performance",
    });
    const { context, format } = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device, {
        width: 512,
        height: 512,
    });
    const quad = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(device, "Quad Vertex Buffer", [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, {
        width: GRID_SIZE,
        height: GRID_SIZE,
    });
    const VERTEX_INDEX = 0;
    const GROUP_INDEX = 0;
    const READ_BINDING = 0;
    const WRITE_BINDING = 1;
    const interactions = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(device, context.canvas, textures.size);
    const INTERACTION_BINDING = 2;
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
                    format: format,
                },
            ],
        },
    });
    const colorAttachments = [
        {
            view: context.getCurrentTexture().createView(),
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
        computePass.dispatchWorkgroups(WORKGROUP_COUNT, WORKGROUP_COUNT);
        computePass.end();
        frame_index++;
        // render pass
        const view = context.getCurrentTexture().createView();
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
async function requestDevice(options = {}) {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter(options);
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    return adapter.requestDevice();
}
function configureCanvas(device, attributes = { width: 512, height: 512 }) {
    const canvas = Object.assign(document.createElement("canvas"), attributes);
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
    return { context: context, format: format };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUMsQ0FBQztJQUNWLENBQUM7U0FBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNsQyxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7U0FBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNqQyxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7U0FBTSxDQUFDO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUM5QyxDQUFDO0FBQ0YsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxTQUE4QjtJQUM5RCxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM5RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRzZXRWYWx1ZXMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3RpbWVzdGVwLmNvbXAud2dzbFwiO1xuXG5jb25zdCBHUklEX1NJWkUgPSA1MTI7XG5jb25zdCBXT1JLR1JPVVBfU0laRSA9IDg7XG5jb25zdCBXT1JLR1JPVVBfQ09VTlQgPSBNYXRoLmNlaWwoR1JJRF9TSVpFIC8gV09SS0dST1VQX1NJWkUpO1xuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2Uoe1xuXHRcdHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIsXG5cdH0pO1xuXG5cdGNvbnN0IHsgY29udGV4dCwgZm9ybWF0IH0gPSBjb25maWd1cmVDYW52YXMoZGV2aWNlLCB7XG5cdFx0d2lkdGg6IDUxMixcblx0XHRoZWlnaHQ6IDUxMixcblx0fSk7XG5cblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKFxuXHRcdGRldmljZSxcblx0XHRcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLFxuXHRcdFswLCAwLCAxLCAwLCAxLCAxLCAwLCAwLCAxLCAxLCAwLCAxXVxuXHQpO1xuXG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhkZXZpY2UsIHtcblx0XHR3aWR0aDogR1JJRF9TSVpFLFxuXHRcdGhlaWdodDogR1JJRF9TSVpFLFxuXHR9KTtcblxuXHRjb25zdCBWRVJURVhfSU5ERVggPSAwO1xuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cblx0Y29uc3QgUkVBRF9CSU5ESU5HID0gMDtcblx0Y29uc3QgV1JJVEVfQklORElORyA9IDE7XG5cblx0Y29uc3QgaW50ZXJhY3Rpb25zID0gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdFx0ZGV2aWNlLFxuXHRcdGNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblx0Y29uc3QgSU5URVJBQ1RJT05fQklORElORyA9IDI7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC1vbmx5XCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBXUklURV9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJ3cml0ZS1vbmx5XCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBpbnRlcmFjdGlvbnMudHlwZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwcyA9IFswLCAxXS5tYXAoKGkpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogYEJpbmQgR3JvdXAgPiAke3RleHR1cmVzLnRleHR1cmVzW2ldLmxhYmVsfWAsXG5cdFx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbaSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzWyhpICsgMSkgJSAyXS5jcmVhdGVWaWV3KCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSlcblx0KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIHtcblx0XHRcdFx0XHRXT1JLR1JPVVBfU0laRTogV09SS0dST1VQX1NJWkUsXG5cdFx0XHRcdFx0R1JPVVBfSU5ERVg6IEdST1VQX0lOREVYLFxuXHRcdFx0XHRcdFJFQURfQklORElORzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdFdSSVRFX0JJTkRJTkc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0SU5URVJBQ1RJT05fQklORElORzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0XHRGT1JNQVQ6IHRleHR1cmVzLmZvcm1hdCxcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxWZXJ0ZXhTaGFkZXIsIHtcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIHtcblx0XHRcdFx0XHRGT1JNQVQ6IHRleHR1cmVzLmZvcm1hdCxcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0VkVSVEVYX0lOREVYOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0UkVOREVSX0lOREVYOiBSRU5ERVJfSU5ERVgsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpLFxuXHRcdFx0bG9hZE9wOiBcImxvYWRcIixcblx0XHRcdHN0b3JlT3A6IFwic3RvcmVcIixcblx0XHR9LFxuXHRdO1xuXHRjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvciA9IHtcblx0XHRjb2xvckF0dGFjaG1lbnRzOiBjb2xvckF0dGFjaG1lbnRzLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHRjb25zdCBjb21tYW5kID0gZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cblx0XHQvLyBjb21wdXRlIHBhc3Ncblx0XHRjb25zdCBjb21wdXRlUGFzcyA9IGNvbW1hbmQuYmVnaW5Db21wdXRlUGFzcygpO1xuXG5cdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUoY29tcHV0ZVBpcGVsaW5lKTtcblx0XHRjb21wdXRlUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cHNbZnJhbWVfaW5kZXggJSAyXSk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0XHRpbnRlcmFjdGlvbnMuYnVmZmVyLFxuXHRcdFx0LypvZmZzZXQ9Ki8gMCxcblx0XHRcdC8qZGF0YT0qLyBpbnRlcmFjdGlvbnMuZGF0YVxuXHRcdCk7XG5cblx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoV09SS0dST1VQX0NPVU5ULCBXT1JLR1JPVVBfQ09VTlQpO1xuXHRcdGNvbXB1dGVQYXNzLmVuZCgpO1xuXG5cdFx0ZnJhbWVfaW5kZXgrKztcblxuXHRcdC8vIHJlbmRlciBwYXNzXG5cdFx0Y29uc3QgdmlldyA9IGNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCk7XG5cdFx0cmVuZGVyUGFzc0Rlc2NyaXB0b3IuY29sb3JBdHRhY2htZW50c1tSRU5ERVJfSU5ERVhdLnZpZXcgPSB2aWV3O1xuXHRcdGNvbnN0IHJlbmRlclBhc3MgPSBjb21tYW5kLmJlZ2luUmVuZGVyUGFzcyhyZW5kZXJQYXNzRGVzY3JpcHRvcik7XG5cblx0XHRyZW5kZXJQYXNzLnNldFBpcGVsaW5lKHJlbmRlclBpcGVsaW5lKTtcblx0XHRyZW5kZXJQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3Vwc1tmcmFtZV9pbmRleCAlIDJdKTtcblx0XHRyZW5kZXJQYXNzLnNldFZlcnRleEJ1ZmZlcihWRVJURVhfSU5ERVgsIHF1YWQudmVydGV4QnVmZmVyKTtcblx0XHRyZW5kZXJQYXNzLmRyYXcocXVhZC52ZXJ0ZXhDb3VudCk7XG5cdFx0cmVuZGVyUGFzcy5lbmQoKTtcblxuXHRcdC8vIHN1Ym1pdCB0aGUgY29tbWFuZCBidWZmZXJcblx0XHRkZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kLmZpbmlzaCgpXSk7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZW5kZXIsIFVQREFURV9JTlRFUlZBTCk7XG5cdHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsIi8vIC8vIENyZWF0ZXMgYW5kIG1hbmFnZSBtdWx0aS1kaW1lbnNpb25hbCBidWZmZXJzIGJ5IGNyZWF0aW5nIGEgYnVmZmVyIGZvciBlYWNoIGRpbWVuc2lvblxuLy8gY2xhc3MgRHluYW1pY0J1ZmZlciB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRkaW1zID0gMSwgLy8gTnVtYmVyIG9mIGRpbWVuc2lvbnNcbi8vIFx0XHR3ID0gc2V0dGluZ3MuZ3JpZF93LCAvLyBCdWZmZXIgd2lkdGhcbi8vIFx0XHRoID0gc2V0dGluZ3MuZ3JpZF9oLCAvLyBCdWZmZXIgaGVpZ2h0XG4vLyBcdH0gPSB7fSkge1xuLy8gXHRcdHRoaXMuZGltcyA9IGRpbXM7XG4vLyBcdFx0dGhpcy5idWZmZXJTaXplID0gdyAqIGggKiA0O1xuLy8gXHRcdHRoaXMudyA9IHc7XG4vLyBcdFx0dGhpcy5oID0gaDtcbi8vIFx0XHR0aGlzLmJ1ZmZlcnMgPSBuZXcgQXJyYXkoZGltcykuZmlsbCgpLm1hcCgoXykgPT5cbi8vIFx0XHRcdGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRzaXplOiB0aGlzLmJ1ZmZlclNpemUsXG4vLyBcdFx0XHRcdHVzYWdlOlxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfFxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLkNPUFlfU1JDIHxcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pXG4vLyBcdFx0KTtcbi8vIFx0fVxuXG4vLyBcdC8vIENvcHkgZWFjaCBidWZmZXIgdG8gYW5vdGhlciBEeW5hbWljQnVmZmVyJ3MgYnVmZmVycy5cbi8vIFx0Ly8gSWYgdGhlIGRpbWVuc2lvbnMgZG9uJ3QgbWF0Y2gsIHRoZSBsYXN0IG5vbi1lbXB0eSBkaW1lbnNpb24gd2lsbCBiZSBjb3BpZWQgaW5zdGVhZFxuLy8gXHRjb3B5VG8oYnVmZmVyLCBjb21tYW5kRW5jb2Rlcikge1xuLy8gXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5tYXgodGhpcy5kaW1zLCBidWZmZXIuZGltcyk7IGkrKykge1xuLy8gXHRcdFx0Y29tbWFuZEVuY29kZXIuY29weUJ1ZmZlclRvQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcnNbTWF0aC5taW4oaSwgdGhpcy5idWZmZXJzLmxlbmd0aCAtIDEpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0YnVmZmVyLmJ1ZmZlcnNbTWF0aC5taW4oaSwgYnVmZmVyLmJ1ZmZlcnMubGVuZ3RoIC0gMSldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlclNpemVcbi8vIFx0XHRcdCk7XG4vLyBcdFx0fVxuLy8gXHR9XG5cbi8vIFx0Ly8gUmVzZXQgYWxsIHRoZSBidWZmZXJzXG4vLyBcdGNsZWFyKHF1ZXVlKSB7XG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRpbXM7IGkrKykge1xuLy8gXHRcdFx0cXVldWUud3JpdGVCdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyc1tpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh0aGlzLncgKiB0aGlzLmgpXG4vLyBcdFx0XHQpO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBNYW5hZ2UgdW5pZm9ybSBidWZmZXJzIHJlbGF0aXZlIHRvIHRoZSBjb21wdXRlIHNoYWRlcnMgJiB0aGUgZ3VpXG4vLyBjbGFzcyBVbmlmb3JtIHtcbi8vIFx0Y29uc3RydWN0b3IoXG4vLyBcdFx0bmFtZSxcbi8vIFx0XHR7XG4vLyBcdFx0XHRzaXplLFxuLy8gXHRcdFx0dmFsdWUsXG4vLyBcdFx0XHRtaW4sXG4vLyBcdFx0XHRtYXgsXG4vLyBcdFx0XHRzdGVwLFxuLy8gXHRcdFx0b25DaGFuZ2UsXG4vLyBcdFx0XHRkaXNwbGF5TmFtZSxcbi8vIFx0XHRcdGFkZFRvR1VJID0gdHJ1ZSxcbi8vIFx0XHR9ID0ge31cbi8vIFx0KSB7XG4vLyBcdFx0dGhpcy5uYW1lID0gbmFtZTtcbi8vIFx0XHR0aGlzLnNpemUgPSBzaXplID8/ICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZS5sZW5ndGggOiAxKTtcbi8vIFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbi8vIFx0XHRpZiAodGhpcy5zaXplID09PSAxKSB7XG4vLyBcdFx0XHRpZiAoc2V0dGluZ3NbbmFtZV0gPT0gbnVsbCkge1xuLy8gXHRcdFx0XHRzZXR0aW5nc1tuYW1lXSA9IHZhbHVlID8/IDA7XG4vLyBcdFx0XHRcdHRoaXMuYWx3YXlzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0XHRcdH0gZWxzZSBpZiAoYWRkVG9HVUkpIHtcbi8vIFx0XHRcdFx0Z3VpLmFkZChzZXR0aW5ncywgbmFtZSwgbWluLCBtYXgsIHN0ZXApXG4vLyBcdFx0XHRcdFx0Lm9uQ2hhbmdlKCh2KSA9PiB7XG4vLyBcdFx0XHRcdFx0XHRpZiAob25DaGFuZ2UpIG9uQ2hhbmdlKHYpO1xuLy8gXHRcdFx0XHRcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4vLyBcdFx0XHRcdFx0fSlcbi8vIFx0XHRcdFx0XHQubmFtZShkaXNwbGF5TmFtZSA/PyBuYW1lKTtcbi8vIFx0XHRcdH1cbi8vIFx0XHR9XG5cbi8vIFx0XHRpZiAodGhpcy5zaXplID09PSAxIHx8IHZhbHVlICE9IG51bGwpIHtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuc2l6ZSAqIDQsXG4vLyBcdFx0XHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KTtcblxuLy8gXHRcdFx0Y29uc3QgYXJyYXlCdWZmZXIgPSB0aGlzLmJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpO1xuLy8gXHRcdFx0bmV3IEZsb2F0MzJBcnJheShhcnJheUJ1ZmZlcikuc2V0KFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHZhbHVlID8/IFtzZXR0aW5nc1tuYW1lXV0pXG4vLyBcdFx0XHQpO1xuLy8gXHRcdFx0dGhpcy5idWZmZXIudW5tYXAoKTtcbi8vIFx0XHR9IGVsc2Uge1xuLy8gXHRcdFx0dGhpcy5idWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5zaXplICogNCxcbi8vIFx0XHRcdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pO1xuLy8gXHRcdH1cblxuLy8gXHRcdGdsb2JhbFVuaWZvcm1zW25hbWVdID0gdGhpcztcbi8vIFx0fVxuXG4vLyBcdHNldFZhbHVlKHZhbHVlKSB7XG4vLyBcdFx0c2V0dGluZ3NbdGhpcy5uYW1lXSA9IHZhbHVlO1xuLy8gXHRcdHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuLy8gXHR9XG5cbi8vIFx0Ly8gVXBkYXRlIHRoZSBHUFUgYnVmZmVyIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZFxuLy8gXHR1cGRhdGUocXVldWUsIHZhbHVlKSB7XG4vLyBcdFx0aWYgKHRoaXMubmVlZHNVcGRhdGUgfHwgdGhpcy5hbHdheXNVcGRhdGUgfHwgdmFsdWUgIT0gbnVsbCkge1xuLy8gXHRcdFx0aWYgKHR5cGVvZiB0aGlzLm5lZWRzVXBkYXRlICE9PSBcImJvb2xlYW5cIikgdmFsdWUgPSB0aGlzLm5lZWRzVXBkYXRlO1xuLy8gXHRcdFx0cXVldWUud3JpdGVCdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHZhbHVlID8/IFtwYXJzZUZsb2F0KHNldHRpbmdzW3RoaXMubmFtZV0pXSksXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdHRoaXMuc2l6ZVxuLy8gXHRcdFx0KTtcbi8vIFx0XHRcdHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gT24gZmlyc3QgY2xpY2s6IHN0YXJ0IHJlY29yZGluZyB0aGUgbW91c2UgcG9zaXRpb24gYXQgZWFjaCBmcmFtZVxuLy8gLy8gT24gc2Vjb25kIGNsaWNrOiByZXNldCB0aGUgY2FudmFzLCBzdGFydCByZWNvcmRpbmcgdGhlIGNhbnZhcyxcbi8vIC8vIG92ZXJyaWRlIHRoZSBtb3VzZSBwb3NpdGlvbiB3aXRoIHRoZSBwcmV2aW91c2x5IHJlY29yZGVkIHZhbHVlc1xuLy8gLy8gYW5kIGZpbmFsbHkgZG93bmxvYWRzIGEgLndlYm0gNjBmcHMgZmlsZVxuLy8gY2xhc3MgUmVjb3JkZXIge1xuLy8gXHRjb25zdHJ1Y3RvcihyZXNldFNpbXVsYXRpb24pIHtcbi8vIFx0XHR0aGlzLm1vdXNlRGF0YSA9IFtdO1xuXG4vLyBcdFx0dGhpcy5jYXB0dXJlciA9IG5ldyBDQ2FwdHVyZSh7XG4vLyBcdFx0XHRmb3JtYXQ6IFwid2VibVwiLFxuLy8gXHRcdFx0ZnJhbWVyYXRlOiA2MCxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBmYWxzZTtcblxuLy8gXHRcdC8vIFJlY29yZGVyIGlzIGRpc2FibGVkIHVudGlsIEkgbWFrZSBhIHRvb2x0aXAgZXhwbGFpbmluZyBob3cgaXQgd29ya3Ncbi8vIFx0XHQvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4vLyBcdFx0Ly8gICAgIGlmICh0aGlzLmlzUmVjb3JkaW5nKSB0aGlzLnN0b3AoKVxuLy8gXHRcdC8vICAgICBlbHNlIHRoaXMuc3RhcnQoKVxuLy8gXHRcdC8vIH0pXG5cbi8vIFx0XHR0aGlzLnJlc2V0U2ltdWxhdGlvbiA9IHJlc2V0U2ltdWxhdGlvbjtcbi8vIFx0fVxuXG4vLyBcdHN0YXJ0KCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nICE9PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFN0YXJ0IHJlY29yZGluZyBtb3VzZSBwb3NpdGlvblxuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IFwibW91c2VcIjtcbi8vIFx0XHR9IGVsc2Uge1xuLy8gXHRcdFx0Ly8gU3RhcnQgcmVjb3JkaW5nIHRoZSBjYW52YXNcbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBcImZyYW1lc1wiO1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zdGFydCgpO1xuLy8gXHRcdH1cblxuLy8gXHRcdGNvbnNvbGUubG9nKFwic3RhcnRcIiwgdGhpcy5pc1JlY29yZGluZyk7XG4vLyBcdH1cblxuLy8gXHR1cGRhdGUoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gUmVjb3JkIGN1cnJlbnQgZnJhbWUncyBtb3VzZSBkYXRhXG4vLyBcdFx0XHRpZiAobW91c2VJbmZvcy5jdXJyZW50KVxuLy8gXHRcdFx0XHR0aGlzLm1vdXNlRGF0YS5wdXNoKFtcbi8vIFx0XHRcdFx0XHQuLi5tb3VzZUluZm9zLmN1cnJlbnQsXG4vLyBcdFx0XHRcdFx0Li4ubW91c2VJbmZvcy52ZWxvY2l0eSxcbi8vIFx0XHRcdFx0XSk7XG4vLyBcdFx0fSBlbHNlIGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcImZyYW1lc1wiKSB7XG4vLyBcdFx0XHQvLyBSZWNvcmQgY3VycmVudCBmcmFtZSdzIGNhbnZhc1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5jYXB0dXJlKGNhbnZhcyk7XG4vLyBcdFx0fVxuLy8gXHR9XG5cbi8vIFx0c3RvcCgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBSZXNldCB0aGUgc2ltdWxhdGlvbiBhbmQgc3RhcnQgdGhlIGNhbnZhcyByZWNvcmRcbi8vIFx0XHRcdHRoaXMucmVzZXRTaW11bGF0aW9uKCk7XG4vLyBcdFx0XHR0aGlzLnN0YXJ0KCk7XG4vLyBcdFx0fSBlbHNlIGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcImZyYW1lc1wiKSB7XG4vLyBcdFx0XHQvLyBTdG9wIHRoZSByZWNvcmRpbmcgYW5kIHNhdmUgdGhlIHZpZGVvIGZpbGVcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc3RvcCgpO1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zYXZlKCk7XG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gZmFsc2U7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIENyZWF0ZXMgYSBzaGFkZXIgbW9kdWxlLCBjb21wdXRlIHBpcGVsaW5lICYgYmluZCBncm91cCB0byB1c2Ugd2l0aCB0aGUgR1BVXG4vLyBjbGFzcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGJ1ZmZlcnMgPSBbXSwgLy8gU3RvcmFnZSBidWZmZXJzXG4vLyBcdFx0dW5pZm9ybXMgPSBbXSwgLy8gVW5pZm9ybSBidWZmZXJzXG4vLyBcdFx0c2hhZGVyLCAvLyBXR1NMIENvbXB1dGUgU2hhZGVyIGFzIGEgc3RyaW5nXG4vLyBcdFx0ZGlzcGF0Y2hYID0gc2V0dGluZ3MuZ3JpZF93LCAvLyBEaXNwYXRjaCB3b3JrZXJzIHdpZHRoXG4vLyBcdFx0ZGlzcGF0Y2hZID0gc2V0dGluZ3MuZ3JpZF9oLCAvLyBEaXNwYXRjaCB3b3JrZXJzIGhlaWdodFxuLy8gXHR9KSB7XG4vLyBcdFx0Ly8gQ3JlYXRlIHRoZSBzaGFkZXIgbW9kdWxlIHVzaW5nIHRoZSBXR1NMIHN0cmluZyBhbmQgdXNlIGl0XG4vLyBcdFx0Ly8gdG8gY3JlYXRlIGEgY29tcHV0ZSBwaXBlbGluZSB3aXRoICdhdXRvJyBiaW5kaW5nIGxheW91dFxuLy8gXHRcdHRoaXMuY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4vLyBcdFx0XHRsYXlvdXQ6IFwiYXV0b1wiLFxuLy8gXHRcdFx0Y29tcHV0ZToge1xuLy8gXHRcdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoeyBjb2RlOiBzaGFkZXIgfSksXG4vLyBcdFx0XHRcdGVudHJ5UG9pbnQ6IFwibWFpblwiLFxuLy8gXHRcdFx0fSxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdC8vIENvbmNhdCB0aGUgYnVmZmVyICYgdW5pZm9ybXMgYW5kIGZvcm1hdCB0aGUgZW50cmllcyB0byB0aGUgcmlnaHQgV2ViR1BVIGZvcm1hdFxuLy8gXHRcdGxldCBlbnRyaWVzID0gYnVmZmVyc1xuLy8gXHRcdFx0Lm1hcCgoYikgPT4gYi5idWZmZXJzKVxuLy8gXHRcdFx0LmZsYXQoKVxuLy8gXHRcdFx0Lm1hcCgoYnVmZmVyKSA9PiAoeyBidWZmZXIgfSkpO1xuLy8gXHRcdGVudHJpZXMucHVzaCguLi51bmlmb3Jtcy5tYXAoKHsgYnVmZmVyIH0pID0+ICh7IGJ1ZmZlciB9KSkpO1xuLy8gXHRcdGVudHJpZXMgPSBlbnRyaWVzLm1hcCgoZSwgaSkgPT4gKHtcbi8vIFx0XHRcdGJpbmRpbmc6IGksXG4vLyBcdFx0XHRyZXNvdXJjZTogZSxcbi8vIFx0XHR9KSk7XG5cbi8vIFx0XHQvLyBDcmVhdGUgdGhlIGJpbmQgZ3JvdXAgdXNpbmcgdGhlc2UgZW50cmllcyAmIGF1dG8tbGF5b3V0IGRldGVjdGlvblxuLy8gXHRcdHRoaXMuYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4vLyBcdFx0XHRsYXlvdXQ6IHRoaXMuY29tcHV0ZVBpcGVsaW5lLmdldEJpbmRHcm91cExheW91dCgwIC8qIGluZGV4ICovKSxcbi8vIFx0XHRcdGVudHJpZXM6IGVudHJpZXMsXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHR0aGlzLmRpc3BhdGNoWCA9IGRpc3BhdGNoWDtcbi8vIFx0XHR0aGlzLmRpc3BhdGNoWSA9IGRpc3BhdGNoWTtcbi8vIFx0fVxuXG4vLyBcdC8vIERpc3BhdGNoIHRoZSBjb21wdXRlIHBpcGVsaW5lIHRvIHRoZSBHUFVcbi8vIFx0ZGlzcGF0Y2gocGFzc0VuY29kZXIpIHtcbi8vIFx0XHRwYXNzRW5jb2Rlci5zZXRQaXBlbGluZSh0aGlzLmNvbXB1dGVQaXBlbGluZSk7XG4vLyBcdFx0cGFzc0VuY29kZXIuc2V0QmluZEdyb3VwKDAsIHRoaXMuYmluZEdyb3VwKTtcbi8vIFx0XHRwYXNzRW5jb2Rlci5kaXNwYXRjaFdvcmtncm91cHMoXG4vLyBcdFx0XHRNYXRoLmNlaWwodGhpcy5kaXNwYXRjaFggLyA4KSxcbi8vIFx0XHRcdE1hdGguY2VpbCh0aGlzLmRpc3BhdGNoWSAvIDgpXG4vLyBcdFx0KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyAvLy8gVXNlZnVsIGNsYXNzZXMgZm9yIGNsZWFuZXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgaW5wdXQgYW5kIG91dHB1dCBidWZmZXJzXG4vLyAvLy8gdXNlZCBpbiB0aGUgZGVjbGFyYXRpb25zIG9mIHByb2dyYW1zICYgZmx1aWQgc2ltdWxhdGlvbiBzdGVwc1xuXG4vLyBjbGFzcyBBZHZlY3RQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gYWR2ZWN0U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcXVhbnRpdHksIGluX3ZlbG9jaXR5LCBvdXRfcXVhbnRpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBEaXZlcmdlbmNlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X2RpdmVyZ2VuY2UsXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gZGl2ZXJnZW5jZVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHsgYnVmZmVyczogW2luX3ZlbG9jaXR5LCBvdXRfZGl2ZXJnZW5jZV0sIHVuaWZvcm1zLCBzaGFkZXIgfSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgUHJlc3N1cmVQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9wcmVzc3VyZSxcbi8vIFx0XHRpbl9kaXZlcmdlbmNlLFxuLy8gXHRcdG91dF9wcmVzc3VyZSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBwcmVzc3VyZVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9wcmVzc3VyZSwgaW5fZGl2ZXJnZW5jZSwgb3V0X3ByZXNzdXJlXSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIEdyYWRpZW50U3VidHJhY3RQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9wcmVzc3VyZSxcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfdmVsb2NpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gZ3JhZGllbnRTdWJ0cmFjdFNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9wcmVzc3VyZSwgaW5fdmVsb2NpdHksIG91dF92ZWxvY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBCb3VuZGFyeVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBib3VuZGFyeVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHsgYnVmZmVyczogW2luX3F1YW50aXR5LCBvdXRfcXVhbnRpdHldLCB1bmlmb3Jtcywgc2hhZGVyIH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFVwZGF0ZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB1cGRhdGVWZWxvY2l0eVNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3F1YW50aXR5LCBvdXRfcXVhbnRpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBWb3J0aWNpdHlQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfdm9ydGljaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHZvcnRpY2l0eVNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ZlbG9jaXR5LCBvdXRfdm9ydGljaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVm9ydGljaXR5Q29uZmlubWVudFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdGluX3ZvcnRpY2l0eSxcbi8vIFx0XHRvdXRfdmVsb2NpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdm9ydGljaXR5Q29uZmlubWVudFNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ZlbG9jaXR5LCBpbl92b3J0aWNpdHksIG91dF92ZWxvY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbmZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG5cdG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPEdQVURldmljZT4ge1xuXHRpZiAoIW5hdmlnYXRvci5ncHUpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJXZWJHUFUgTk9UIFN1cHBvcnRlZFwiKTtcblxuXHRjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcihvcHRpb25zKTtcblx0aWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cblx0cmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSgpO1xufVxuXG5mdW5jdGlvbiBjb25maWd1cmVDYW52YXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRhdHRyaWJ1dGVzID0geyB3aWR0aDogNTEyLCBoZWlnaHQ6IDUxMiB9XG4pOiB7IGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7IGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCB9IHtcblx0Y29uc3QgY2FudmFzID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLCBhdHRyaWJ1dGVzKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG5cdGNvbnN0IGNvbnRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiY2FudmFzXCIpIS5nZXRDb250ZXh0KFwid2ViZ3B1XCIpO1xuXHRpZiAoIWNvbnRleHQpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJDYW52YXMgZG9lcyBub3Qgc3VwcG9ydCBXZWJHUFVcIik7XG5cblx0Y29uc3QgZm9ybWF0ID0gbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKTtcblx0Y29udGV4dC5jb25maWd1cmUoe1xuXHRcdGRldmljZTogZGV2aWNlLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG5cdFx0YWxwaGFNb2RlOiBcIm9wYXF1ZVwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdHZlcnRleEJ1ZmZlcixcblx0XHQvKmJ1ZmZlck9mZnNldD0qLyAwLFxuXHRcdC8qZGF0YT0qLyBhcnJheVxuXHQpO1xuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFRleHR1cmVzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQgPSBcInJnYmEzMmZsb2F0XCJcbik6IHtcblx0dGV4dHVyZXM6IEdQVVRleHR1cmVbXTtcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgdGV4dHVyZURhdGEgPSBuZXcgQXJyYXkoc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0KTtcblx0Y29uc3QgQ0hBTk5FTFMgPSBjaGFubmVsQ291bnQoZm9ybWF0KTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0dGV4dHVyZURhdGFbaV0gPSBbXTtcblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgQ0hBTk5FTFM7IGorKykge1xuXHRcdFx0dGV4dHVyZURhdGFbaV0ucHVzaChNYXRoLnJhbmRvbSgpID4gMC41ID8gMSA6IDApO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHN0YXRlVGV4dHVyZXMgPSBbXCJBXCIsIFwiQlwiXS5tYXAoKGxhYmVsKSA9PlxuXHRcdGRldmljZS5jcmVhdGVUZXh0dXJlKHtcblx0XHRcdGxhYmVsOiBgU3RhdGUgVGV4dHVyZSAke2xhYmVsfWAsXG5cdFx0XHRzaXplOiBbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLFxuXHRcdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcblx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHRleHR1cmUgPSBzdGF0ZVRleHR1cmVzWzBdO1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZURhdGEuZmxhdCgpKTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdHsgdGV4dHVyZSB9LFxuXHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHQvKmRhdGFMYXlvdXQ9Ki8ge1xuXHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0cm93c1BlckltYWdlOiBzaXplLmhlaWdodCxcblx0XHR9LFxuXHRcdC8qc2l6ZT0qLyBzaXplXG5cdCk7XG5cblx0cmV0dXJuIHtcblx0XHR0ZXh0dXJlczogc3RhdGVUZXh0dXJlcyxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9ID0geyB3aWR0aDogMjAsIGhlaWdodDogMjAgfVxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEludDMyQXJyYXkoNCk7XG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbdGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIHBvc2l0aW9uLngsIHBvc2l0aW9uLnldKTtcblx0aWYgKGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHggPSBNYXRoLmZsb29yKChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGgpO1xuXHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0KHBvc2l0aW9uLnkgLyBjYW52YXMuaGVpZ2h0KSAqIHRleHR1cmUuaGVpZ2h0XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gem9vbSBldmVudHMgVE9ETyhAZ3N6ZXApIGFkZCBwaW5jaCBhbmQgc2Nyb2xsIGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wid2hlZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWSAvIDEwO1xuXHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWSAvIDEwO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzaXplLndpZHRoICs9IHZlbG9jaXR5Lng7XG5cdFx0XHRcdHNpemUuaGVpZ2h0ICs9IHZlbG9jaXR5Lnk7XG5cblx0XHRcdFx0ZGF0YS5zZXQoW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0XSwgMik7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIGNsaWNrIGV2ZW50c1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdGRhdGEuc2V0KFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sIDIpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0W1wibW91c2V1cFwiLCBcInRvdWNoZW5kXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChldmVudCkgPT4ge1xuXHRcdFx0XHRkYXRhLnNldChbMCwgMF0sIDIpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlcyhjb2RlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG5cdGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAoT2JqZWN0LmtleXModmFyaWFibGVzKS5qb2luKFwifFwiKSwgXCJnXCIpO1xuXHRyZXR1cm4gY29kZS5yZXBsYWNlKHJlZywgKGspID0+IHZhcmlhYmxlc1trXS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHNldFZhbHVlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=