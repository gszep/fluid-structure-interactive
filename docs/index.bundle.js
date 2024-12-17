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
    const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
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
    const SAMPLER_BINDING = 3;
    const sampler = device.createSampler({
        addressModeU: "repeat",
        addressModeV: "repeat",
    });
    const bindGroupLayout = device.createBindGroupLayout({
        label: "bindGroupLayout",
        entries: [
            {
                binding: READ_BINDING,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                texture: {
                    sampleType: textures.format.sampleType,
                },
            },
            {
                binding: WRITE_BINDING,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "write-only",
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
                binding: SAMPLER_BINDING,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {},
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
            {
                binding: SAMPLER_BINDING,
                resource: sampler,
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
                    STORAGE_FORMAT: textures.format.storage,
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
                    SAMPLER_BINDING: SAMPLER_BINDING,
                    READ_BINDING: READ_BINDING,
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
async function requestDevice(options = { powerPreference: "high-performance" }, requiredFeatures = ["float32-filterable"]) {
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
function setupTextures(device, size, format = {
    sampleType: "float",
    storage: "rgba32float",
    texture: "f32",
}) {
    const textureData = new Array(size.width * size.height);
    const CHANNELS = channelCount(format.storage);
    for (let i = 0; i < size.width * size.height; i++) {
        textureData[i] = [];
        for (let j = 0; j < CHANNELS; j++) {
            textureData[i].push(Math.random() > 1 ? 1 : 0);
        }
    }
    const stateTextures = ["A", "B"].map((label) => device.createTexture({
        label: `State Texture ${label}`,
        size: [size.width, size.height],
        format: format.storage,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.STORAGE_BINDING |
            GPUTextureUsage.COPY_DST,
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

module.exports = "struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;\n@group(GROUP_INDEX) @binding(SAMPLER_BINDING) var Sampler: sampler;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    let F = textureSample(F, Sampler, (1 + input.coordinate) / 2);\n    // output.color.r = F.z;\n    output.color.b = F.w;\n    return output;\n}";

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

module.exports = "struct Input {\n  @builtin(workgroup_id) workGroupID: vec3<u32>,\n  @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<i32>,\n    size: vec2<i32>,\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;\nconst size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);\nconst level: i32 = 0;\nconst dt: f32 = 0.01;\nconst viscosity: f32 = 0.0001;\n\n@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<STORAGE_FORMAT, write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn laplacian(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {\n    const kernel = mat3x3<f32>(\n        0, 1, 0,\n        1, -4, 1,\n        0, 1, 0,\n    );\n\n    var dx = vec2<i32>(0, 0);\n    var result = vec4<f32>(0, 0, 0, 0);\n\n    for (var i: i32 = -1; i < 2; i = i + 1) {\n        for (var j: i32 = -1; j < 2; j = j + 1) {\n            dx.x = i;\n            dx.y = j;\n\n            result += kernel[i + 1][j + 1] * value(F, x + dx);\n        }\n    }\n\n    return result;\n}\n\nconst dx = vec2<i32>(1, 0);\nconst dy = vec2<i32>(0, 1);\n\nfn advection(F: texture_2d<f32>, x: vec2<i32>) -> f32 {\n    let v = velocity(F, x);\n    let pos = vec2<f32>(x) - v * dt;\n\n    let x0 = vec2<i32>(floor(pos));\n    let x1 = x0 + dx;\n    let y0 = vec2<i32>(floor(pos));\n    let y1 = y0 + dy;\n\n    let s1 = pos.x - f32(x0.x);\n    let s0 = 1.0 - s1;\n    let t1 = pos.y - f32(y0.y);\n    let t0 = 1.0 - t1;\n\n    let f00 = value(F, x0).w;\n    let f10 = value(F, x1).w;\n    let f01 = value(F, y0).w;\n    let f11 = value(F, y1).w;\n\n    return s0 * (t0 * f00 + t1 * f01) + s1 * (t0 * f10 + t1 * f11);\n}\n\nfn velocity(F: texture_2d<f32>, x: vec2<i32>) -> vec2<f32> {\n    let u = value(F, x + dy).z - value(F, x).z;\n    let v = value(F, x).z - value(F, x + dx).z;\n\n    return vec2<f32>(u, v);\n}\n\nfn value(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {\n    let y = x + size ; // not sure why this is necessary\n    return textureLoad(F, y % size, level);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(input: Input) {\n\n    let x = vec2<i32>(input.globalInvocationID.xy);\n    var Fdt = value(F, x);\n\n    // brush interaction\n    let distance = abs(x - interaction.position);\n    if all(distance * distance < interaction.size) {\n        Fdt.w += exp(-f32(dot(distance, distance)) / 10);\n    }\n    \n    // relaxation of poisson equation for stream function F.z\n    Fdt.z += (laplacian(F, x).z + Fdt.w) * 0.25;\n\n    // update vorticity F.w\n    Fdt.w += (laplacian(F, x).w * 0.00 - advection(F, x) * 0.01) ;\n\n    textureStore(Fdash, x, Fdt);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TSxDQUFDO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUM5QyxDQUFDO0FBQ0YsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxTQUE4QjtJQUM5RCxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM5RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRzZXRWYWx1ZXMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3RpbWVzdGVwLmNvbXAud2dzbFwiO1xuXG5jb25zdCBXT1JLR1JPVVBfU0laRSA9IDg7XG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cdGNvbnN0IEdST1VQX0lOREVYID0gMDtcblxuXHQvLyBpbml0aWFsaXplIHZlcnRleCBidWZmZXIgYW5kIHRleHR1cmVzXG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFFVQUQgPSBbLTEsIC0xLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAxLCAxLCAtMSwgMV07XG5cblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKGRldmljZSwgXCJRdWFkIFZlcnRleCBCdWZmZXJcIiwgUVVBRCk7XG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhkZXZpY2UsIGNhbnZhcy5zaXplKTtcblxuXHRjb25zdCBSRUFEX0JJTkRJTkcgPSAwO1xuXHRjb25zdCBXUklURV9CSU5ESU5HID0gMTtcblx0Y29uc3QgV09SS0dST1VQX0NPVU5UOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLndpZHRoIC8gV09SS0dST1VQX1NJWkUpLFxuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLmhlaWdodCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XTtcblxuXHQvLyBzZXR1cCBpbnRlcmFjdGlvbnNcblx0Y29uc3QgSU5URVJBQ1RJT05fQklORElORyA9IDI7XG5cdGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKFxuXHRcdGRldmljZSxcblx0XHRjYW52YXMuY29udGV4dC5jYW52YXMsXG5cdFx0dGV4dHVyZXMuc2l6ZVxuXHQpO1xuXG5cdGNvbnN0IFNBTVBMRVJfQklORElORyA9IDM7XG5cdGNvbnN0IHNhbXBsZXIgPSBkZXZpY2UuY3JlYXRlU2FtcGxlcih7XG5cdFx0YWRkcmVzc01vZGVVOiBcInJlcGVhdFwiLFxuXHRcdGFkZHJlc3NNb2RlVjogXCJyZXBlYXRcIixcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0dGV4dHVyZToge1xuXHRcdFx0XHRcdHNhbXBsZVR5cGU6IHRleHR1cmVzLmZvcm1hdC5zYW1wbGVUeXBlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogV1JJVEVfQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwid3JpdGUtb25seVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBpbnRlcmFjdGlvbnMudHlwZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFNBTVBMRVJfQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsXG5cdFx0XHRcdHNhbXBsZXI6IHt9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBiaW5kR3JvdXBzID0gWzAsIDFdLm1hcCgoaSkgPT5cblx0XHRkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRcdGxhYmVsOiBgQmluZCBHcm91cCA+ICR7dGV4dHVyZXMudGV4dHVyZXNbaV0ubGFiZWx9YCxcblx0XHRcdGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxuXHRcdFx0ZW50cmllczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmluZGluZzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tpICUgMl0uY3JlYXRlVmlldygpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmluZGluZzogV1JJVEVfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbKGkgKyAxKSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IElOVEVSQUNUSU9OX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRcdGJ1ZmZlcjogaW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmluZGluZzogU0FNUExFUl9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiBzYW1wbGVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZVBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwge1xuXHRcdFx0XHRcdFdPUktHUk9VUF9TSVpFOiBXT1JLR1JPVVBfU0laRSxcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0V1JJVEVfQklORElORzogV1JJVEVfQklORElORyxcblx0XHRcdFx0XHRJTlRFUkFDVElPTl9CSU5ESU5HOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdFNUT1JBR0VfRk9STUFUOiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0XHRXSURUSDogdGV4dHVyZXMuc2l6ZS53aWR0aCxcblx0XHRcdFx0XHRIRUlHSFQ6IHRleHR1cmVzLnNpemUuaGVpZ2h0LFxuXHRcdFx0XHR9KSxcblx0XHRcdH0pLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cdGNvbnN0IHJlbmRlclBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZVJlbmRlclBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJyZW5kZXJQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0dmVydGV4OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBzZXRWYWx1ZXMoY2VsbFZlcnRleFNoYWRlciwge1xuXHRcdFx0XHRcdFZFUlRFWF9JTkRFWDogVkVSVEVYX0lOREVYLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbFZlcnRleFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHRidWZmZXJzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhcnJheVN0cmlkZTogcXVhZC5hcnJheVN0cmlkZSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZvcm1hdDogcXVhZC5mb3JtYXQsXG5cdFx0XHRcdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0XHRcdFx0c2hhZGVyTG9jYXRpb246IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRmcmFnbWVudDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxGcmFnbWVudFNoYWRlciwge1xuXHRcdFx0XHRcdEdST1VQX0lOREVYOiBHUk9VUF9JTkRFWCxcblx0XHRcdFx0XHRTQU1QTEVSX0JJTkRJTkc6IFNBTVBMRVJfQklORElORyxcblx0XHRcdFx0XHRSRUFEX0JJTkRJTkc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRSRU5ERVJfSU5ERVg6IFJFTkRFUl9JTkRFWCxcblx0XHRcdFx0XHRXSURUSDogdGV4dHVyZXMuc2l6ZS53aWR0aCxcblx0XHRcdFx0XHRIRUlHSFQ6IHRleHR1cmVzLnNpemUuaGVpZ2h0LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbEZyYWdtZW50U2hhZGVyXCIsXG5cdFx0XHR9KSxcblx0XHRcdHRhcmdldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGZvcm1hdDogY2FudmFzLmZvcm1hdCxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgY29sb3JBdHRhY2htZW50czogR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudFtdID0gW1xuXHRcdHtcblx0XHRcdHZpZXc6IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpLFxuXHRcdFx0bG9hZE9wOiBcImxvYWRcIixcblx0XHRcdHN0b3JlT3A6IFwic3RvcmVcIixcblx0XHR9LFxuXHRdO1xuXHRjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvciA9IHtcblx0XHRjb2xvckF0dGFjaG1lbnRzOiBjb2xvckF0dGFjaG1lbnRzLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHRjb25zdCBjb21tYW5kID0gZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cblx0XHQvLyBjb21wdXRlIHBhc3Ncblx0XHRjb25zdCBjb21wdXRlUGFzcyA9IGNvbW1hbmQuYmVnaW5Db21wdXRlUGFzcygpO1xuXG5cdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUoY29tcHV0ZVBpcGVsaW5lKTtcblx0XHRjb21wdXRlUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cHNbZnJhbWVfaW5kZXggJSAyXSk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0XHRpbnRlcmFjdGlvbnMuYnVmZmVyLFxuXHRcdFx0LypvZmZzZXQ9Ki8gMCxcblx0XHRcdC8qZGF0YT0qLyBpbnRlcmFjdGlvbnMuZGF0YVxuXHRcdCk7XG5cblx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoLi4uV09SS0dST1VQX0NPVU5UKTtcblx0XHRjb21wdXRlUGFzcy5lbmQoKTtcblxuXHRcdGZyYW1lX2luZGV4Kys7XG5cblx0XHQvLyByZW5kZXIgcGFzc1xuXHRcdGNvbnN0IHZpZXcgPSBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKTtcblx0XHRyZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzW1JFTkRFUl9JTkRFWF0udmlldyA9IHZpZXc7XG5cdFx0Y29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmQuYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcblxuXHRcdHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlclBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXBzW2ZyYW1lX2luZGV4ICUgMl0pO1xuXHRcdHJlbmRlclBhc3Muc2V0VmVydGV4QnVmZmVyKFZFUlRFWF9JTkRFWCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0fVxuXG5cdHNldEludGVydmFsKHJlbmRlciwgVVBEQVRFX0lOVEVSVkFMKTtcblx0cmV0dXJuO1xufVxuXG5pbmRleCgpO1xuIiwiLy8gLy8gQ3JlYXRlcyBhbmQgbWFuYWdlIG11bHRpLWRpbWVuc2lvbmFsIGJ1ZmZlcnMgYnkgY3JlYXRpbmcgYSBidWZmZXIgZm9yIGVhY2ggZGltZW5zaW9uXG4vLyBjbGFzcyBEeW5hbWljQnVmZmVyIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGRpbXMgPSAxLCAvLyBOdW1iZXIgb2YgZGltZW5zaW9uc1xuLy8gXHRcdHcgPSBzZXR0aW5ncy5ncmlkX3csIC8vIEJ1ZmZlciB3aWR0aFxuLy8gXHRcdGggPSBzZXR0aW5ncy5ncmlkX2gsIC8vIEJ1ZmZlciBoZWlnaHRcbi8vIFx0fSA9IHt9KSB7XG4vLyBcdFx0dGhpcy5kaW1zID0gZGltcztcbi8vIFx0XHR0aGlzLmJ1ZmZlclNpemUgPSB3ICogaCAqIDQ7XG4vLyBcdFx0dGhpcy53ID0gdztcbi8vIFx0XHR0aGlzLmggPSBoO1xuLy8gXHRcdHRoaXMuYnVmZmVycyA9IG5ldyBBcnJheShkaW1zKS5maWxsKCkubWFwKChfKSA9PlxuLy8gXHRcdFx0ZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuYnVmZmVyU2l6ZSxcbi8vIFx0XHRcdFx0dXNhZ2U6XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSB8XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkMgfFxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSlcbi8vIFx0XHQpO1xuLy8gXHR9XG5cbi8vIFx0Ly8gQ29weSBlYWNoIGJ1ZmZlciB0byBhbm90aGVyIER5bmFtaWNCdWZmZXIncyBidWZmZXJzLlxuLy8gXHQvLyBJZiB0aGUgZGltZW5zaW9ucyBkb24ndCBtYXRjaCwgdGhlIGxhc3Qgbm9uLWVtcHR5IGRpbWVuc2lvbiB3aWxsIGJlIGNvcGllZCBpbnN0ZWFkXG4vLyBcdGNvcHlUbyhidWZmZXIsIGNvbW1hbmRFbmNvZGVyKSB7XG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1heCh0aGlzLmRpbXMsIGJ1ZmZlci5kaW1zKTsgaSsrKSB7XG4vLyBcdFx0XHRjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyc1tNYXRoLm1pbihpLCB0aGlzLmJ1ZmZlcnMubGVuZ3RoIC0gMSldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRidWZmZXIuYnVmZmVyc1tNYXRoLm1pbihpLCBidWZmZXIuYnVmZmVycy5sZW5ndGggLSAxKV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyU2l6ZVxuLy8gXHRcdFx0KTtcbi8vIFx0XHR9XG4vLyBcdH1cblxuLy8gXHQvLyBSZXNldCBhbGwgdGhlIGJ1ZmZlcnNcbi8vIFx0Y2xlYXIocXVldWUpIHtcbi8vIFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGltczsgaSsrKSB7XG4vLyBcdFx0XHRxdWV1ZS53cml0ZUJ1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJzW2ldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHRoaXMudyAqIHRoaXMuaClcbi8vIFx0XHRcdCk7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIE1hbmFnZSB1bmlmb3JtIGJ1ZmZlcnMgcmVsYXRpdmUgdG8gdGhlIGNvbXB1dGUgc2hhZGVycyAmIHRoZSBndWlcbi8vIGNsYXNzIFVuaWZvcm0ge1xuLy8gXHRjb25zdHJ1Y3Rvcihcbi8vIFx0XHRuYW1lLFxuLy8gXHRcdHtcbi8vIFx0XHRcdHNpemUsXG4vLyBcdFx0XHR2YWx1ZSxcbi8vIFx0XHRcdG1pbixcbi8vIFx0XHRcdG1heCxcbi8vIFx0XHRcdHN0ZXAsXG4vLyBcdFx0XHRvbkNoYW5nZSxcbi8vIFx0XHRcdGRpc3BsYXlOYW1lLFxuLy8gXHRcdFx0YWRkVG9HVUkgPSB0cnVlLFxuLy8gXHRcdH0gPSB7fVxuLy8gXHQpIHtcbi8vIFx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuLy8gXHRcdHRoaXMuc2l6ZSA9IHNpemUgPz8gKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlLmxlbmd0aCA6IDEpO1xuLy8gXHRcdHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuLy8gXHRcdGlmICh0aGlzLnNpemUgPT09IDEpIHtcbi8vIFx0XHRcdGlmIChzZXR0aW5nc1tuYW1lXSA9PSBudWxsKSB7XG4vLyBcdFx0XHRcdHNldHRpbmdzW25hbWVdID0gdmFsdWUgPz8gMDtcbi8vIFx0XHRcdFx0dGhpcy5hbHdheXNVcGRhdGUgPSB0cnVlO1xuLy8gXHRcdFx0fSBlbHNlIGlmIChhZGRUb0dVSSkge1xuLy8gXHRcdFx0XHRndWkuYWRkKHNldHRpbmdzLCBuYW1lLCBtaW4sIG1heCwgc3RlcClcbi8vIFx0XHRcdFx0XHQub25DaGFuZ2UoKHYpID0+IHtcbi8vIFx0XHRcdFx0XHRcdGlmIChvbkNoYW5nZSkgb25DaGFuZ2Uodik7XG4vLyBcdFx0XHRcdFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0XHRcdFx0XHR9KVxuLy8gXHRcdFx0XHRcdC5uYW1lKGRpc3BsYXlOYW1lID8/IG5hbWUpO1xuLy8gXHRcdFx0fVxuLy8gXHRcdH1cblxuLy8gXHRcdGlmICh0aGlzLnNpemUgPT09IDEgfHwgdmFsdWUgIT0gbnVsbCkge1xuLy8gXHRcdFx0dGhpcy5idWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0bWFwcGVkQXRDcmVhdGlvbjogdHJ1ZSxcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5zaXplICogNCxcbi8vIFx0XHRcdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pO1xuXG4vLyBcdFx0XHRjb25zdCBhcnJheUJ1ZmZlciA9IHRoaXMuYnVmZmVyLmdldE1hcHBlZFJhbmdlKCk7XG4vLyBcdFx0XHRuZXcgRmxvYXQzMkFycmF5KGFycmF5QnVmZmVyKS5zZXQoXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodmFsdWUgPz8gW3NldHRpbmdzW25hbWVdXSlcbi8vIFx0XHRcdCk7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlci51bm1hcCgpO1xuLy8gXHRcdH0gZWxzZSB7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRzaXplOiB0aGlzLnNpemUgKiA0LFxuLy8gXHRcdFx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSk7XG4vLyBcdFx0fVxuXG4vLyBcdFx0Z2xvYmFsVW5pZm9ybXNbbmFtZV0gPSB0aGlzO1xuLy8gXHR9XG5cbi8vIFx0c2V0VmFsdWUodmFsdWUpIHtcbi8vIFx0XHRzZXR0aW5nc1t0aGlzLm5hbWVdID0gdmFsdWU7XG4vLyBcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4vLyBcdH1cblxuLy8gXHQvLyBVcGRhdGUgdGhlIEdQVSBidWZmZXIgaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkXG4vLyBcdHVwZGF0ZShxdWV1ZSwgdmFsdWUpIHtcbi8vIFx0XHRpZiAodGhpcy5uZWVkc1VwZGF0ZSB8fCB0aGlzLmFsd2F5c1VwZGF0ZSB8fCB2YWx1ZSAhPSBudWxsKSB7XG4vLyBcdFx0XHRpZiAodHlwZW9mIHRoaXMubmVlZHNVcGRhdGUgIT09IFwiYm9vbGVhblwiKSB2YWx1ZSA9IHRoaXMubmVlZHNVcGRhdGU7XG4vLyBcdFx0XHRxdWV1ZS53cml0ZUJ1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXIsXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodmFsdWUgPz8gW3BhcnNlRmxvYXQoc2V0dGluZ3NbdGhpcy5uYW1lXSldKSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0dGhpcy5zaXplXG4vLyBcdFx0XHQpO1xuLy8gXHRcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBPbiBmaXJzdCBjbGljazogc3RhcnQgcmVjb3JkaW5nIHRoZSBtb3VzZSBwb3NpdGlvbiBhdCBlYWNoIGZyYW1lXG4vLyAvLyBPbiBzZWNvbmQgY2xpY2s6IHJlc2V0IHRoZSBjYW52YXMsIHN0YXJ0IHJlY29yZGluZyB0aGUgY2FudmFzLFxuLy8gLy8gb3ZlcnJpZGUgdGhlIG1vdXNlIHBvc2l0aW9uIHdpdGggdGhlIHByZXZpb3VzbHkgcmVjb3JkZWQgdmFsdWVzXG4vLyAvLyBhbmQgZmluYWxseSBkb3dubG9hZHMgYSAud2VibSA2MGZwcyBmaWxlXG4vLyBjbGFzcyBSZWNvcmRlciB7XG4vLyBcdGNvbnN0cnVjdG9yKHJlc2V0U2ltdWxhdGlvbikge1xuLy8gXHRcdHRoaXMubW91c2VEYXRhID0gW107XG5cbi8vIFx0XHR0aGlzLmNhcHR1cmVyID0gbmV3IENDYXB0dXJlKHtcbi8vIFx0XHRcdGZvcm1hdDogXCJ3ZWJtXCIsXG4vLyBcdFx0XHRmcmFtZXJhdGU6IDYwLFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0dGhpcy5pc1JlY29yZGluZyA9IGZhbHNlO1xuXG4vLyBcdFx0Ly8gUmVjb3JkZXIgaXMgZGlzYWJsZWQgdW50aWwgSSBtYWtlIGEgdG9vbHRpcCBleHBsYWluaW5nIGhvdyBpdCB3b3Jrc1xuLy8gXHRcdC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbi8vIFx0XHQvLyAgICAgaWYgKHRoaXMuaXNSZWNvcmRpbmcpIHRoaXMuc3RvcCgpXG4vLyBcdFx0Ly8gICAgIGVsc2UgdGhpcy5zdGFydCgpXG4vLyBcdFx0Ly8gfSlcblxuLy8gXHRcdHRoaXMucmVzZXRTaW11bGF0aW9uID0gcmVzZXRTaW11bGF0aW9uO1xuLy8gXHR9XG5cbi8vIFx0c3RhcnQoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgIT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gU3RhcnQgcmVjb3JkaW5nIG1vdXNlIHBvc2l0aW9uXG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gXCJtb3VzZVwiO1xuLy8gXHRcdH0gZWxzZSB7XG4vLyBcdFx0XHQvLyBTdGFydCByZWNvcmRpbmcgdGhlIGNhbnZhc1xuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IFwiZnJhbWVzXCI7XG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnN0YXJ0KCk7XG4vLyBcdFx0fVxuXG4vLyBcdFx0Y29uc29sZS5sb2coXCJzdGFydFwiLCB0aGlzLmlzUmVjb3JkaW5nKTtcbi8vIFx0fVxuXG4vLyBcdHVwZGF0ZSgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBSZWNvcmQgY3VycmVudCBmcmFtZSdzIG1vdXNlIGRhdGFcbi8vIFx0XHRcdGlmIChtb3VzZUluZm9zLmN1cnJlbnQpXG4vLyBcdFx0XHRcdHRoaXMubW91c2VEYXRhLnB1c2goW1xuLy8gXHRcdFx0XHRcdC4uLm1vdXNlSW5mb3MuY3VycmVudCxcbi8vIFx0XHRcdFx0XHQuLi5tb3VzZUluZm9zLnZlbG9jaXR5LFxuLy8gXHRcdFx0XHRdKTtcbi8vIFx0XHR9IGVsc2UgaWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwiZnJhbWVzXCIpIHtcbi8vIFx0XHRcdC8vIFJlY29yZCBjdXJyZW50IGZyYW1lJ3MgY2FudmFzXG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLmNhcHR1cmUoY2FudmFzKTtcbi8vIFx0XHR9XG4vLyBcdH1cblxuLy8gXHRzdG9wKCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFJlc2V0IHRoZSBzaW11bGF0aW9uIGFuZCBzdGFydCB0aGUgY2FudmFzIHJlY29yZFxuLy8gXHRcdFx0dGhpcy5yZXNldFNpbXVsYXRpb24oKTtcbi8vIFx0XHRcdHRoaXMuc3RhcnQoKTtcbi8vIFx0XHR9IGVsc2UgaWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwiZnJhbWVzXCIpIHtcbi8vIFx0XHRcdC8vIFN0b3AgdGhlIHJlY29yZGluZyBhbmQgc2F2ZSB0aGUgdmlkZW8gZmlsZVxuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zdG9wKCk7XG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnNhdmUoKTtcbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBmYWxzZTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gQ3JlYXRlcyBhIHNoYWRlciBtb2R1bGUsIGNvbXB1dGUgcGlwZWxpbmUgJiBiaW5kIGdyb3VwIHRvIHVzZSB3aXRoIHRoZSBHUFVcbi8vIGNsYXNzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0YnVmZmVycyA9IFtdLCAvLyBTdG9yYWdlIGJ1ZmZlcnNcbi8vIFx0XHR1bmlmb3JtcyA9IFtdLCAvLyBVbmlmb3JtIGJ1ZmZlcnNcbi8vIFx0XHRzaGFkZXIsIC8vIFdHU0wgQ29tcHV0ZSBTaGFkZXIgYXMgYSBzdHJpbmdcbi8vIFx0XHRkaXNwYXRjaFggPSBzZXR0aW5ncy5ncmlkX3csIC8vIERpc3BhdGNoIHdvcmtlcnMgd2lkdGhcbi8vIFx0XHRkaXNwYXRjaFkgPSBzZXR0aW5ncy5ncmlkX2gsIC8vIERpc3BhdGNoIHdvcmtlcnMgaGVpZ2h0XG4vLyBcdH0pIHtcbi8vIFx0XHQvLyBDcmVhdGUgdGhlIHNoYWRlciBtb2R1bGUgdXNpbmcgdGhlIFdHU0wgc3RyaW5nIGFuZCB1c2UgaXRcbi8vIFx0XHQvLyB0byBjcmVhdGUgYSBjb21wdXRlIHBpcGVsaW5lIHdpdGggJ2F1dG8nIGJpbmRpbmcgbGF5b3V0XG4vLyBcdFx0dGhpcy5jb21wdXRlUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbi8vIFx0XHRcdGxheW91dDogXCJhdXRvXCIsXG4vLyBcdFx0XHRjb21wdXRlOiB7XG4vLyBcdFx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7IGNvZGU6IHNoYWRlciB9KSxcbi8vIFx0XHRcdFx0ZW50cnlQb2ludDogXCJtYWluXCIsXG4vLyBcdFx0XHR9LFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0Ly8gQ29uY2F0IHRoZSBidWZmZXIgJiB1bmlmb3JtcyBhbmQgZm9ybWF0IHRoZSBlbnRyaWVzIHRvIHRoZSByaWdodCBXZWJHUFUgZm9ybWF0XG4vLyBcdFx0bGV0IGVudHJpZXMgPSBidWZmZXJzXG4vLyBcdFx0XHQubWFwKChiKSA9PiBiLmJ1ZmZlcnMpXG4vLyBcdFx0XHQuZmxhdCgpXG4vLyBcdFx0XHQubWFwKChidWZmZXIpID0+ICh7IGJ1ZmZlciB9KSk7XG4vLyBcdFx0ZW50cmllcy5wdXNoKC4uLnVuaWZvcm1zLm1hcCgoeyBidWZmZXIgfSkgPT4gKHsgYnVmZmVyIH0pKSk7XG4vLyBcdFx0ZW50cmllcyA9IGVudHJpZXMubWFwKChlLCBpKSA9PiAoe1xuLy8gXHRcdFx0YmluZGluZzogaSxcbi8vIFx0XHRcdHJlc291cmNlOiBlLFxuLy8gXHRcdH0pKTtcblxuLy8gXHRcdC8vIENyZWF0ZSB0aGUgYmluZCBncm91cCB1c2luZyB0aGVzZSBlbnRyaWVzICYgYXV0by1sYXlvdXQgZGV0ZWN0aW9uXG4vLyBcdFx0dGhpcy5iaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcbi8vIFx0XHRcdGxheW91dDogdGhpcy5jb21wdXRlUGlwZWxpbmUuZ2V0QmluZEdyb3VwTGF5b3V0KDAgLyogaW5kZXggKi8pLFxuLy8gXHRcdFx0ZW50cmllczogZW50cmllcyxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdHRoaXMuZGlzcGF0Y2hYID0gZGlzcGF0Y2hYO1xuLy8gXHRcdHRoaXMuZGlzcGF0Y2hZID0gZGlzcGF0Y2hZO1xuLy8gXHR9XG5cbi8vIFx0Ly8gRGlzcGF0Y2ggdGhlIGNvbXB1dGUgcGlwZWxpbmUgdG8gdGhlIEdQVVxuLy8gXHRkaXNwYXRjaChwYXNzRW5jb2Rlcikge1xuLy8gXHRcdHBhc3NFbmNvZGVyLnNldFBpcGVsaW5lKHRoaXMuY29tcHV0ZVBpcGVsaW5lKTtcbi8vIFx0XHRwYXNzRW5jb2Rlci5zZXRCaW5kR3JvdXAoMCwgdGhpcy5iaW5kR3JvdXApO1xuLy8gXHRcdHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3Vwcyhcbi8vIFx0XHRcdE1hdGguY2VpbCh0aGlzLmRpc3BhdGNoWCAvIDgpLFxuLy8gXHRcdFx0TWF0aC5jZWlsKHRoaXMuZGlzcGF0Y2hZIC8gOClcbi8vIFx0XHQpO1xuLy8gXHR9XG4vLyB9XG5cbi8vIC8vLyBVc2VmdWwgY2xhc3NlcyBmb3IgY2xlYW5lciB1bmRlcnN0YW5kaW5nIG9mIHRoZSBpbnB1dCBhbmQgb3V0cHV0IGJ1ZmZlcnNcbi8vIC8vLyB1c2VkIGluIHRoZSBkZWNsYXJhdGlvbnMgb2YgcHJvZ3JhbXMgJiBmbHVpZCBzaW11bGF0aW9uIHN0ZXBzXG5cbi8vIGNsYXNzIEFkdmVjdFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBhZHZlY3RTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgaW5fdmVsb2NpdHksIG91dF9xdWFudGl0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIERpdmVyZ2VuY2VQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfZGl2ZXJnZW5jZSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBkaXZlcmdlbmNlU2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoeyBidWZmZXJzOiBbaW5fdmVsb2NpdHksIG91dF9kaXZlcmdlbmNlXSwgdW5pZm9ybXMsIHNoYWRlciB9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBQcmVzc3VyZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ByZXNzdXJlLFxuLy8gXHRcdGluX2RpdmVyZ2VuY2UsXG4vLyBcdFx0b3V0X3ByZXNzdXJlLFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHByZXNzdXJlU2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ByZXNzdXJlLCBpbl9kaXZlcmdlbmNlLCBvdXRfcHJlc3N1cmVdLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgR3JhZGllbnRTdWJ0cmFjdFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ByZXNzdXJlLFxuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF92ZWxvY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBncmFkaWVudFN1YnRyYWN0U2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ByZXNzdXJlLCBpbl92ZWxvY2l0eSwgb3V0X3ZlbG9jaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIEJvdW5kYXJ5UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGJvdW5kYXJ5U2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoeyBidWZmZXJzOiBbaW5fcXVhbnRpdHksIG91dF9xdWFudGl0eV0sIHVuaWZvcm1zLCBzaGFkZXIgfSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVXBkYXRlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHVwZGF0ZVZlbG9jaXR5U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcXVhbnRpdHksIG91dF9xdWFudGl0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFZvcnRpY2l0eVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF92b3J0aWNpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdm9ydGljaXR5U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fdmVsb2NpdHksIG91dF92b3J0aWNpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBWb3J0aWNpdHlDb25maW5tZW50UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0aW5fdm9ydGljaXR5LFxuLy8gXHRcdG91dF92ZWxvY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB2b3J0aWNpdHlDb25maW5tZW50U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fdmVsb2NpdHksIGluX3ZvcnRpY2l0eSwgb3V0X3ZlbG9jaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuZnVuY3Rpb24gdGhyb3dEZXRlY3Rpb25FcnJvcihlcnJvcjogc3RyaW5nKTogbmV2ZXIge1xuXHQoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi53ZWJncHUtbm90LXN1cHBvcnRlZFwiKSBhcyBIVE1MRWxlbWVudFxuXHQpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblx0dGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGluaXRpYWxpemUgV2ViR1BVOiBcIiArIGVycm9yKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWVzdERldmljZShcblx0b3B0aW9uczogR1BVUmVxdWVzdEFkYXB0ZXJPcHRpb25zID0geyBwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiIH0sXG5cdHJlcXVpcmVkRmVhdHVyZXM6IEdQVUZlYXR1cmVOYW1lW10gPSBbXCJmbG9hdDMyLWZpbHRlcmFibGVcIl1cbik6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKG9wdGlvbnMpO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKHsgcmVxdWlyZWRGZWF0dXJlczogcmVxdWlyZWRGZWF0dXJlcyB9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJvcGFxdWVcIixcblx0fSk7XG5cblx0cmV0dXJuIHsgY29udGV4dDogY29udGV4dCwgZm9ybWF0OiBmb3JtYXQsIHNpemU6IHNpemUgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBWZXJ0ZXhCdWZmZXIoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRsYWJlbDogc3RyaW5nLFxuXHRkYXRhOiBudW1iZXJbXVxuKToge1xuXHR2ZXJ0ZXhCdWZmZXI6IEdQVUJ1ZmZlcjtcblx0dmVydGV4Q291bnQ6IG51bWJlcjtcblx0YXJyYXlTdHJpZGU6IG51bWJlcjtcblx0Zm9ybWF0OiBHUFVWZXJ0ZXhGb3JtYXQ7XG59IHtcblx0Y29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXHRjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogbGFiZWwsXG5cdFx0c2l6ZTogYXJyYXkuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVkVSVEVYIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHR2ZXJ0ZXhCdWZmZXIsXG5cdFx0LypidWZmZXJPZmZzZXQ9Ki8gMCxcblx0XHQvKmRhdGE9Ki8gYXJyYXlcblx0KTtcblx0cmV0dXJuIHtcblx0XHR2ZXJ0ZXhCdWZmZXI6IHZlcnRleEJ1ZmZlcixcblx0XHR2ZXJ0ZXhDb3VudDogYXJyYXkubGVuZ3RoIC8gMixcblx0XHRhcnJheVN0cmlkZTogMiAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuXHRcdGZvcm1hdDogXCJmbG9hdDMyeDJcIixcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUZXh0dXJlcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0Zm9ybWF0OiB7XG5cdFx0c2FtcGxlVHlwZTogR1BVVGV4dHVyZVNhbXBsZVR5cGU7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0XHR0ZXh0dXJlOiBzdHJpbmc7XG5cdH0gPSB7XG5cdFx0c2FtcGxlVHlwZTogXCJmbG9hdFwiLFxuXHRcdHN0b3JhZ2U6IFwicmdiYTMyZmxvYXRcIixcblx0XHR0ZXh0dXJlOiBcImYzMlwiLFxuXHR9XG4pOiB7XG5cdHRleHR1cmVzOiBHUFVUZXh0dXJlW107XG5cdGZvcm1hdDoge1xuXHRcdHNhbXBsZVR5cGU6IEdQVVRleHR1cmVTYW1wbGVUeXBlO1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdFx0dGV4dHVyZTogc3RyaW5nO1xuXHR9O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgdGV4dHVyZURhdGEgPSBuZXcgQXJyYXkoc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0KTtcblx0Y29uc3QgQ0hBTk5FTFMgPSBjaGFubmVsQ291bnQoZm9ybWF0LnN0b3JhZ2UpO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0OyBpKyspIHtcblx0XHR0ZXh0dXJlRGF0YVtpXSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBDSEFOTkVMUzsgaisrKSB7XG5cdFx0XHR0ZXh0dXJlRGF0YVtpXS5wdXNoKE1hdGgucmFuZG9tKCkgPiAxID8gMSA6IDApO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHN0YXRlVGV4dHVyZXMgPSBbXCJBXCIsIFwiQlwiXS5tYXAoKGxhYmVsKSA9PlxuXHRcdGRldmljZS5jcmVhdGVUZXh0dXJlKHtcblx0XHRcdGxhYmVsOiBgU3RhdGUgVGV4dHVyZSAke2xhYmVsfWAsXG5cdFx0XHRzaXplOiBbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLFxuXHRcdFx0Zm9ybWF0OiBmb3JtYXQuc3RvcmFnZSxcblx0XHRcdHVzYWdlOlxuXHRcdFx0XHRHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHxcblx0XHRcdFx0R1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8XG5cdFx0XHRcdEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcblx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHRleHR1cmUgPSBzdGF0ZVRleHR1cmVzWzBdO1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZURhdGEuZmxhdCgpKTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdHsgdGV4dHVyZSB9LFxuXHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHQvKmRhdGFMYXlvdXQ9Ki8ge1xuXHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0cm93c1BlckltYWdlOiBzaXplLmhlaWdodCxcblx0XHR9LFxuXHRcdC8qc2l6ZT0qLyBzaXplXG5cdCk7XG5cblx0cmV0dXJuIHtcblx0XHR0ZXh0dXJlczogc3RhdGVUZXh0dXJlcyxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9ID0geyB3aWR0aDogMjAsIGhlaWdodDogMjAgfVxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEludDMyQXJyYXkoNCk7XG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbdGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIHBvc2l0aW9uLngsIHBvc2l0aW9uLnldKTtcblx0aWYgKGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHggPSBNYXRoLmZsb29yKChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGgpO1xuXHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0KHBvc2l0aW9uLnkgLyBjYW52YXMuaGVpZ2h0KSAqIHRleHR1cmUuaGVpZ2h0XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gem9vbSBldmVudHMgVE9ETyhAZ3N6ZXApIGFkZCBwaW5jaCBhbmQgc2Nyb2xsIGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wid2hlZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWSAvIDEwO1xuXHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWSAvIDEwO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzaXplLndpZHRoICs9IHZlbG9jaXR5Lng7XG5cdFx0XHRcdHNpemUuaGVpZ2h0ICs9IHZlbG9jaXR5Lnk7XG5cblx0XHRcdFx0ZGF0YS5zZXQoW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0XSwgMik7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIGNsaWNrIGV2ZW50c1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG5cdFx0XHRcdGRhdGEuc2V0KFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sIDIpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0W1wibW91c2V1cFwiLCBcInRvdWNoZW5kXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChldmVudCkgPT4ge1xuXHRcdFx0XHRkYXRhLnNldChbMCwgMF0sIDIpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlcyhjb2RlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG5cdGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAoT2JqZWN0LmtleXModmFyaWFibGVzKS5qb2luKFwifFwiKSwgXCJnXCIpO1xuXHRyZXR1cm4gY29kZS5yZXBsYWNlKHJlZywgKGspID0+IHZhcmlhYmxlc1trXS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHNldFZhbHVlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=