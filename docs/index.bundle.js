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
function setupInteractions(device, canvas, texture, size = 1000) {
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

module.exports = "struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;\n@group(GROUP_INDEX) @binding(SAMPLER_BINDING) var Sampler: sampler;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let F = textureSample(F, Sampler, (1 + input.coordinate) / 2);\n\n    // vorticity map\n    output.color.g = 5 * max(0, F.w);\n    output.color.r = 5 * max(0, -F.w);\n\n    // stream function map\n    // output.color.b = abs(F.z);\n\n    output.color.a = 1;//F.x;\n    return output;\n}";

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

module.exports = "struct Input {\n  @builtin(workgroup_id) workGroupID: vec3<u32>,\n  @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;\nconst size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);\nconst level: i32 = 0;\n\nconst dx = vec2<i32>(1, 0);\nconst dy = vec2<i32>(0, 1);\n\n@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<STORAGE_FORMAT, write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn diffusion(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {\n    return value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);\n}\n\nfn jacobi_iteration(F: texture_2d<f32>, w: f32, x: vec2<i32>, h: f32) -> f32 {\n    return (value(F, x + dx).z + value(F, x - dx).z + value(F, x + dy).z + value(F, x - dy).z + h * w) / 4;\n}\n\nfn advection(F: texture_2d<f32>, x: vec2<i32>) -> f32 {\n    let vx = (value(F, x + dy).z - value(F, x - dy).z) / 2;\n    let vy = (value(F, x - dx).z - value(F, x + dx).z) / 2;\n\n    let wx = (value(F, x + dx).w - value(F, x - dx).w) / 2;\n    let wy = (value(F, x + dy).w - value(F, x - dy).w) / 2;\n\n    return vx * wx + vy * wy;\n}\n\n\nfn value(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {\n    let y = x + size ; // not sure why this is necessary\n    return textureLoad(F, y % size, level);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(input: Input) {\n\n    let x = vec2<i32>(input.globalInvocationID.xy);\n    var Fdt = value(F, x);\n    const dt: f32 = 0.2;\n\n    // brush interaction\n    let distance = vec2<f32>(x) - interaction.position;\n    let norm = dot(distance, distance);\n\n    if sqrt(norm) < abs(interaction.size) {\n        Fdt.w += 0.01 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n    }\n\n    // update vorticity\n    Fdt.w -= 2 * advection(F, x) * dt;\n    Fdt.w += diffusion(F, x).w * dt;\n    \n    // relaxation of poisson equation for stream function\n    Fdt.z = jacobi_iteration(F, Fdt.w, x, 1);\n\n    // error calculation\n    Fdt.x = abs(diffusion(F, x).z + value(F, x).w) / (1 + value(F, x).w);\n\n    textureStore(Fdash, x, Fdt);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxJQUFZLEVBQUUsU0FBOEI7SUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQVNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0c2V0VmFsdWVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgY2VsbFZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwudmVydC53Z3NsXCI7XG5pbXBvcnQgY2VsbEZyYWdtZW50U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC5mcmFnLndnc2xcIjtcbmltcG9ydCB0aW1lc3RlcENvbXB1dGVTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy90aW1lc3RlcC5jb21wLndnc2xcIjtcblxuY29uc3QgV09SS0dST1VQX1NJWkUgPSA4O1xuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMTtcbmxldCBmcmFtZV9pbmRleCA9IDA7XG5cbmFzeW5jIGZ1bmN0aW9uIGluZGV4KCk6IFByb21pc2U8dm9pZD4ge1xuXHQvLyBzZXR1cCBhbmQgY29uZmlndXJlIFdlYkdQVVxuXHRjb25zdCBkZXZpY2UgPSBhd2FpdCByZXF1ZXN0RGV2aWNlKCk7XG5cdGNvbnN0IGNhbnZhcyA9IGNvbmZpZ3VyZUNhbnZhcyhkZXZpY2UpO1xuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBWRVJURVhfSU5ERVggPSAwO1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXG5cdGNvbnN0IHF1YWQgPSBzZXR1cFZlcnRleEJ1ZmZlcihkZXZpY2UsIFwiUXVhZCBWZXJ0ZXggQnVmZmVyXCIsIFFVQUQpO1xuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoZGV2aWNlLCBjYW52YXMuc2l6ZSk7XG5cblx0Y29uc3QgUkVBRF9CSU5ESU5HID0gMDtcblx0Y29uc3QgV1JJVEVfQklORElORyA9IDE7XG5cdGNvbnN0IFdPUktHUk9VUF9DT1VOVDogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS53aWR0aCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBXT1JLR1JPVVBfU0laRSksXG5cdF07XG5cblx0Ly8gc2V0dXAgaW50ZXJhY3Rpb25zXG5cdGNvbnN0IElOVEVSQUNUSU9OX0JJTkRJTkcgPSAyO1xuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblxuXHRjb25zdCBTQU1QTEVSX0JJTkRJTkcgPSAzO1xuXHRjb25zdCBzYW1wbGVyID0gZGV2aWNlLmNyZWF0ZVNhbXBsZXIoe1xuXHRcdGFkZHJlc3NNb2RlVTogXCJyZXBlYXRcIixcblx0XHRhZGRyZXNzTW9kZVY6IFwicmVwZWF0XCIsXG5cdH0pO1xuXG5cdGNvbnN0IGJpbmRHcm91cExheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcImJpbmRHcm91cExheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHRleHR1cmU6IHtcblx0XHRcdFx0XHRzYW1wbGVUeXBlOiB0ZXh0dXJlcy5mb3JtYXQuc2FtcGxlVHlwZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcIndyaXRlLW9ubHlcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0YnVmZmVyOiB7XG5cdFx0XHRcdFx0dHlwZTogaW50ZXJhY3Rpb25zLnR5cGUsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBTQU1QTEVSX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5ULFxuXHRcdFx0XHRzYW1wbGVyOiB7fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwcyA9IFswLCAxXS5tYXAoKGkpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogYEJpbmQgR3JvdXAgPiAke3RleHR1cmVzLnRleHR1cmVzW2ldLmxhYmVsfWAsXG5cdFx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbaSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzWyhpICsgMSkgJSAyXS5jcmVhdGVWaWV3KCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFNBTVBMRVJfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogc2FtcGxlcixcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSlcblx0KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIHtcblx0XHRcdFx0XHRXT1JLR1JPVVBfU0laRTogV09SS0dST1VQX1NJWkUsXG5cdFx0XHRcdFx0R1JPVVBfSU5ERVg6IEdST1VQX0lOREVYLFxuXHRcdFx0XHRcdFJFQURfQklORElORzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdFdSSVRFX0JJTkRJTkc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0SU5URVJBQ1RJT05fQklORElORzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0XHRTVE9SQUdFX0ZPUk1BVDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdFx0V0lEVEg6IHRleHR1cmVzLnNpemUud2lkdGgsXG5cdFx0XHRcdFx0SEVJR0hUOiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxWZXJ0ZXhTaGFkZXIsIHtcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIHtcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0U0FNUExFUl9CSU5ESU5HOiBTQU1QTEVSX0JJTkRJTkcsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0VkVSVEVYX0lOREVYOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0UkVOREVSX0lOREVYOiBSRU5ERVJfSU5ERVgsXG5cdFx0XHRcdFx0V0lEVEg6IHRleHR1cmVzLnNpemUud2lkdGgsXG5cdFx0XHRcdFx0SEVJR0hUOiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3JtYXQ6IGNhbnZhcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdGxvYWRPcDogXCJsb2FkXCIsXG5cdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0fSxcblx0XTtcblx0Y29uc3QgcmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG5cdFx0Y29sb3JBdHRhY2htZW50czogY29sb3JBdHRhY2htZW50cyxcblx0fTtcblxuXHRmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Ly8gY29tcHV0ZSBwYXNzXG5cdFx0Y29uc3QgY29tcHV0ZVBhc3MgPSBjb21tYW5kLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblxuXHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXBzW2ZyYW1lX2luZGV4ICUgMl0pO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdFx0aW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdC8qb2Zmc2V0PSovIDAsXG5cdFx0XHQvKmRhdGE9Ki8gaW50ZXJhY3Rpb25zLmRhdGFcblx0XHQpO1xuXG5cdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cdFx0Y29tcHV0ZVBhc3MuZW5kKCk7XG5cblx0XHRmcmFtZV9pbmRleCsrO1xuXG5cdFx0Ly8gcmVuZGVyIHBhc3Ncblx0XHRjb25zdCB2aWV3ID0gY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCk7XG5cdFx0cmVuZGVyUGFzc0Rlc2NyaXB0b3IuY29sb3JBdHRhY2htZW50c1tSRU5ERVJfSU5ERVhdLnZpZXcgPSB2aWV3O1xuXHRcdGNvbnN0IHJlbmRlclBhc3MgPSBjb21tYW5kLmJlZ2luUmVuZGVyUGFzcyhyZW5kZXJQYXNzRGVzY3JpcHRvcik7XG5cblx0XHRyZW5kZXJQYXNzLnNldFBpcGVsaW5lKHJlbmRlclBpcGVsaW5lKTtcblx0XHRyZW5kZXJQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3Vwc1tmcmFtZV9pbmRleCAlIDJdKTtcblx0XHRyZW5kZXJQYXNzLnNldFZlcnRleEJ1ZmZlcihWRVJURVhfSU5ERVgsIHF1YWQudmVydGV4QnVmZmVyKTtcblx0XHRyZW5kZXJQYXNzLmRyYXcocXVhZC52ZXJ0ZXhDb3VudCk7XG5cdFx0cmVuZGVyUGFzcy5lbmQoKTtcblxuXHRcdC8vIHN1Ym1pdCB0aGUgY29tbWFuZCBidWZmZXJcblx0XHRkZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kLmZpbmlzaCgpXSk7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZW5kZXIsIFVQREFURV9JTlRFUlZBTCk7XG5cdHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsIi8vIC8vIENyZWF0ZXMgYW5kIG1hbmFnZSBtdWx0aS1kaW1lbnNpb25hbCBidWZmZXJzIGJ5IGNyZWF0aW5nIGEgYnVmZmVyIGZvciBlYWNoIGRpbWVuc2lvblxuLy8gY2xhc3MgRHluYW1pY0J1ZmZlciB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRkaW1zID0gMSwgLy8gTnVtYmVyIG9mIGRpbWVuc2lvbnNcbi8vIFx0XHR3ID0gc2V0dGluZ3MuZ3JpZF93LCAvLyBCdWZmZXIgd2lkdGhcbi8vIFx0XHRoID0gc2V0dGluZ3MuZ3JpZF9oLCAvLyBCdWZmZXIgaGVpZ2h0XG4vLyBcdH0gPSB7fSkge1xuLy8gXHRcdHRoaXMuZGltcyA9IGRpbXM7XG4vLyBcdFx0dGhpcy5idWZmZXJTaXplID0gdyAqIGggKiA0O1xuLy8gXHRcdHRoaXMudyA9IHc7XG4vLyBcdFx0dGhpcy5oID0gaDtcbi8vIFx0XHR0aGlzLmJ1ZmZlcnMgPSBuZXcgQXJyYXkoZGltcykuZmlsbCgpLm1hcCgoXykgPT5cbi8vIFx0XHRcdGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRzaXplOiB0aGlzLmJ1ZmZlclNpemUsXG4vLyBcdFx0XHRcdHVzYWdlOlxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfFxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLkNPUFlfU1JDIHxcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pXG4vLyBcdFx0KTtcbi8vIFx0fVxuXG4vLyBcdC8vIENvcHkgZWFjaCBidWZmZXIgdG8gYW5vdGhlciBEeW5hbWljQnVmZmVyJ3MgYnVmZmVycy5cbi8vIFx0Ly8gSWYgdGhlIGRpbWVuc2lvbnMgZG9uJ3QgbWF0Y2gsIHRoZSBsYXN0IG5vbi1lbXB0eSBkaW1lbnNpb24gd2lsbCBiZSBjb3BpZWQgaW5zdGVhZFxuLy8gXHRjb3B5VG8oYnVmZmVyLCBjb21tYW5kRW5jb2Rlcikge1xuLy8gXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5tYXgodGhpcy5kaW1zLCBidWZmZXIuZGltcyk7IGkrKykge1xuLy8gXHRcdFx0Y29tbWFuZEVuY29kZXIuY29weUJ1ZmZlclRvQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcnNbTWF0aC5taW4oaSwgdGhpcy5idWZmZXJzLmxlbmd0aCAtIDEpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0YnVmZmVyLmJ1ZmZlcnNbTWF0aC5taW4oaSwgYnVmZmVyLmJ1ZmZlcnMubGVuZ3RoIC0gMSldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlclNpemVcbi8vIFx0XHRcdCk7XG4vLyBcdFx0fVxuLy8gXHR9XG5cbi8vIFx0Ly8gUmVzZXQgYWxsIHRoZSBidWZmZXJzXG4vLyBcdGNsZWFyKHF1ZXVlKSB7XG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRpbXM7IGkrKykge1xuLy8gXHRcdFx0cXVldWUud3JpdGVCdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyc1tpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh0aGlzLncgKiB0aGlzLmgpXG4vLyBcdFx0XHQpO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBNYW5hZ2UgdW5pZm9ybSBidWZmZXJzIHJlbGF0aXZlIHRvIHRoZSBjb21wdXRlIHNoYWRlcnMgJiB0aGUgZ3VpXG4vLyBjbGFzcyBVbmlmb3JtIHtcbi8vIFx0Y29uc3RydWN0b3IoXG4vLyBcdFx0bmFtZSxcbi8vIFx0XHR7XG4vLyBcdFx0XHRzaXplLFxuLy8gXHRcdFx0dmFsdWUsXG4vLyBcdFx0XHRtaW4sXG4vLyBcdFx0XHRtYXgsXG4vLyBcdFx0XHRzdGVwLFxuLy8gXHRcdFx0b25DaGFuZ2UsXG4vLyBcdFx0XHRkaXNwbGF5TmFtZSxcbi8vIFx0XHRcdGFkZFRvR1VJID0gdHJ1ZSxcbi8vIFx0XHR9ID0ge31cbi8vIFx0KSB7XG4vLyBcdFx0dGhpcy5uYW1lID0gbmFtZTtcbi8vIFx0XHR0aGlzLnNpemUgPSBzaXplID8/ICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZS5sZW5ndGggOiAxKTtcbi8vIFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbi8vIFx0XHRpZiAodGhpcy5zaXplID09PSAxKSB7XG4vLyBcdFx0XHRpZiAoc2V0dGluZ3NbbmFtZV0gPT0gbnVsbCkge1xuLy8gXHRcdFx0XHRzZXR0aW5nc1tuYW1lXSA9IHZhbHVlID8/IDA7XG4vLyBcdFx0XHRcdHRoaXMuYWx3YXlzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0XHRcdH0gZWxzZSBpZiAoYWRkVG9HVUkpIHtcbi8vIFx0XHRcdFx0Z3VpLmFkZChzZXR0aW5ncywgbmFtZSwgbWluLCBtYXgsIHN0ZXApXG4vLyBcdFx0XHRcdFx0Lm9uQ2hhbmdlKCh2KSA9PiB7XG4vLyBcdFx0XHRcdFx0XHRpZiAob25DaGFuZ2UpIG9uQ2hhbmdlKHYpO1xuLy8gXHRcdFx0XHRcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4vLyBcdFx0XHRcdFx0fSlcbi8vIFx0XHRcdFx0XHQubmFtZShkaXNwbGF5TmFtZSA/PyBuYW1lKTtcbi8vIFx0XHRcdH1cbi8vIFx0XHR9XG5cbi8vIFx0XHRpZiAodGhpcy5zaXplID09PSAxIHx8IHZhbHVlICE9IG51bGwpIHtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuc2l6ZSAqIDQsXG4vLyBcdFx0XHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KTtcblxuLy8gXHRcdFx0Y29uc3QgYXJyYXlCdWZmZXIgPSB0aGlzLmJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpO1xuLy8gXHRcdFx0bmV3IEZsb2F0MzJBcnJheShhcnJheUJ1ZmZlcikuc2V0KFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHZhbHVlID8/IFtzZXR0aW5nc1tuYW1lXV0pXG4vLyBcdFx0XHQpO1xuLy8gXHRcdFx0dGhpcy5idWZmZXIudW5tYXAoKTtcbi8vIFx0XHR9IGVsc2Uge1xuLy8gXHRcdFx0dGhpcy5idWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5zaXplICogNCxcbi8vIFx0XHRcdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pO1xuLy8gXHRcdH1cblxuLy8gXHRcdGdsb2JhbFVuaWZvcm1zW25hbWVdID0gdGhpcztcbi8vIFx0fVxuXG4vLyBcdHNldFZhbHVlKHZhbHVlKSB7XG4vLyBcdFx0c2V0dGluZ3NbdGhpcy5uYW1lXSA9IHZhbHVlO1xuLy8gXHRcdHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuLy8gXHR9XG5cbi8vIFx0Ly8gVXBkYXRlIHRoZSBHUFUgYnVmZmVyIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZFxuLy8gXHR1cGRhdGUocXVldWUsIHZhbHVlKSB7XG4vLyBcdFx0aWYgKHRoaXMubmVlZHNVcGRhdGUgfHwgdGhpcy5hbHdheXNVcGRhdGUgfHwgdmFsdWUgIT0gbnVsbCkge1xuLy8gXHRcdFx0aWYgKHR5cGVvZiB0aGlzLm5lZWRzVXBkYXRlICE9PSBcImJvb2xlYW5cIikgdmFsdWUgPSB0aGlzLm5lZWRzVXBkYXRlO1xuLy8gXHRcdFx0cXVldWUud3JpdGVCdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHZhbHVlID8/IFtwYXJzZUZsb2F0KHNldHRpbmdzW3RoaXMubmFtZV0pXSksXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdHRoaXMuc2l6ZVxuLy8gXHRcdFx0KTtcbi8vIFx0XHRcdHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gT24gZmlyc3QgY2xpY2s6IHN0YXJ0IHJlY29yZGluZyB0aGUgbW91c2UgcG9zaXRpb24gYXQgZWFjaCBmcmFtZVxuLy8gLy8gT24gc2Vjb25kIGNsaWNrOiByZXNldCB0aGUgY2FudmFzLCBzdGFydCByZWNvcmRpbmcgdGhlIGNhbnZhcyxcbi8vIC8vIG92ZXJyaWRlIHRoZSBtb3VzZSBwb3NpdGlvbiB3aXRoIHRoZSBwcmV2aW91c2x5IHJlY29yZGVkIHZhbHVlc1xuLy8gLy8gYW5kIGZpbmFsbHkgZG93bmxvYWRzIGEgLndlYm0gNjBmcHMgZmlsZVxuLy8gY2xhc3MgUmVjb3JkZXIge1xuLy8gXHRjb25zdHJ1Y3RvcihyZXNldFNpbXVsYXRpb24pIHtcbi8vIFx0XHR0aGlzLm1vdXNlRGF0YSA9IFtdO1xuXG4vLyBcdFx0dGhpcy5jYXB0dXJlciA9IG5ldyBDQ2FwdHVyZSh7XG4vLyBcdFx0XHRmb3JtYXQ6IFwid2VibVwiLFxuLy8gXHRcdFx0ZnJhbWVyYXRlOiA2MCxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBmYWxzZTtcblxuLy8gXHRcdC8vIFJlY29yZGVyIGlzIGRpc2FibGVkIHVudGlsIEkgbWFrZSBhIHRvb2x0aXAgZXhwbGFpbmluZyBob3cgaXQgd29ya3Ncbi8vIFx0XHQvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4vLyBcdFx0Ly8gICAgIGlmICh0aGlzLmlzUmVjb3JkaW5nKSB0aGlzLnN0b3AoKVxuLy8gXHRcdC8vICAgICBlbHNlIHRoaXMuc3RhcnQoKVxuLy8gXHRcdC8vIH0pXG5cbi8vIFx0XHR0aGlzLnJlc2V0U2ltdWxhdGlvbiA9IHJlc2V0U2ltdWxhdGlvbjtcbi8vIFx0fVxuXG4vLyBcdHN0YXJ0KCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nICE9PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFN0YXJ0IHJlY29yZGluZyBtb3VzZSBwb3NpdGlvblxuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IFwibW91c2VcIjtcbi8vIFx0XHR9IGVsc2Uge1xuLy8gXHRcdFx0Ly8gU3RhcnQgcmVjb3JkaW5nIHRoZSBjYW52YXNcbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBcImZyYW1lc1wiO1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zdGFydCgpO1xuLy8gXHRcdH1cblxuLy8gXHRcdGNvbnNvbGUubG9nKFwic3RhcnRcIiwgdGhpcy5pc1JlY29yZGluZyk7XG4vLyBcdH1cblxuLy8gXHR1cGRhdGUoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gUmVjb3JkIGN1cnJlbnQgZnJhbWUncyBtb3VzZSBkYXRhXG4vLyBcdFx0XHRpZiAobW91c2VJbmZvcy5jdXJyZW50KVxuLy8gXHRcdFx0XHR0aGlzLm1vdXNlRGF0YS5wdXNoKFtcbi8vIFx0XHRcdFx0XHQuLi5tb3VzZUluZm9zLmN1cnJlbnQsXG4vLyBcdFx0XHRcdFx0Li4ubW91c2VJbmZvcy52ZWxvY2l0eSxcbi8vIFx0XHRcdFx0XSk7XG4vLyBcdFx0fSBlbHNlIGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcImZyYW1lc1wiKSB7XG4vLyBcdFx0XHQvLyBSZWNvcmQgY3VycmVudCBmcmFtZSdzIGNhbnZhc1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5jYXB0dXJlKGNhbnZhcyk7XG4vLyBcdFx0fVxuLy8gXHR9XG5cbi8vIFx0c3RvcCgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBSZXNldCB0aGUgc2ltdWxhdGlvbiBhbmQgc3RhcnQgdGhlIGNhbnZhcyByZWNvcmRcbi8vIFx0XHRcdHRoaXMucmVzZXRTaW11bGF0aW9uKCk7XG4vLyBcdFx0XHR0aGlzLnN0YXJ0KCk7XG4vLyBcdFx0fSBlbHNlIGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcImZyYW1lc1wiKSB7XG4vLyBcdFx0XHQvLyBTdG9wIHRoZSByZWNvcmRpbmcgYW5kIHNhdmUgdGhlIHZpZGVvIGZpbGVcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc3RvcCgpO1xuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zYXZlKCk7XG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gZmFsc2U7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIENyZWF0ZXMgYSBzaGFkZXIgbW9kdWxlLCBjb21wdXRlIHBpcGVsaW5lICYgYmluZCBncm91cCB0byB1c2Ugd2l0aCB0aGUgR1BVXG4vLyBjbGFzcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGJ1ZmZlcnMgPSBbXSwgLy8gU3RvcmFnZSBidWZmZXJzXG4vLyBcdFx0dW5pZm9ybXMgPSBbXSwgLy8gVW5pZm9ybSBidWZmZXJzXG4vLyBcdFx0c2hhZGVyLCAvLyBXR1NMIENvbXB1dGUgU2hhZGVyIGFzIGEgc3RyaW5nXG4vLyBcdFx0ZGlzcGF0Y2hYID0gc2V0dGluZ3MuZ3JpZF93LCAvLyBEaXNwYXRjaCB3b3JrZXJzIHdpZHRoXG4vLyBcdFx0ZGlzcGF0Y2hZID0gc2V0dGluZ3MuZ3JpZF9oLCAvLyBEaXNwYXRjaCB3b3JrZXJzIGhlaWdodFxuLy8gXHR9KSB7XG4vLyBcdFx0Ly8gQ3JlYXRlIHRoZSBzaGFkZXIgbW9kdWxlIHVzaW5nIHRoZSBXR1NMIHN0cmluZyBhbmQgdXNlIGl0XG4vLyBcdFx0Ly8gdG8gY3JlYXRlIGEgY29tcHV0ZSBwaXBlbGluZSB3aXRoICdhdXRvJyBiaW5kaW5nIGxheW91dFxuLy8gXHRcdHRoaXMuY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4vLyBcdFx0XHRsYXlvdXQ6IFwiYXV0b1wiLFxuLy8gXHRcdFx0Y29tcHV0ZToge1xuLy8gXHRcdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoeyBjb2RlOiBzaGFkZXIgfSksXG4vLyBcdFx0XHRcdGVudHJ5UG9pbnQ6IFwibWFpblwiLFxuLy8gXHRcdFx0fSxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdC8vIENvbmNhdCB0aGUgYnVmZmVyICYgdW5pZm9ybXMgYW5kIGZvcm1hdCB0aGUgZW50cmllcyB0byB0aGUgcmlnaHQgV2ViR1BVIGZvcm1hdFxuLy8gXHRcdGxldCBlbnRyaWVzID0gYnVmZmVyc1xuLy8gXHRcdFx0Lm1hcCgoYikgPT4gYi5idWZmZXJzKVxuLy8gXHRcdFx0LmZsYXQoKVxuLy8gXHRcdFx0Lm1hcCgoYnVmZmVyKSA9PiAoeyBidWZmZXIgfSkpO1xuLy8gXHRcdGVudHJpZXMucHVzaCguLi51bmlmb3Jtcy5tYXAoKHsgYnVmZmVyIH0pID0+ICh7IGJ1ZmZlciB9KSkpO1xuLy8gXHRcdGVudHJpZXMgPSBlbnRyaWVzLm1hcCgoZSwgaSkgPT4gKHtcbi8vIFx0XHRcdGJpbmRpbmc6IGksXG4vLyBcdFx0XHRyZXNvdXJjZTogZSxcbi8vIFx0XHR9KSk7XG5cbi8vIFx0XHQvLyBDcmVhdGUgdGhlIGJpbmQgZ3JvdXAgdXNpbmcgdGhlc2UgZW50cmllcyAmIGF1dG8tbGF5b3V0IGRldGVjdGlvblxuLy8gXHRcdHRoaXMuYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4vLyBcdFx0XHRsYXlvdXQ6IHRoaXMuY29tcHV0ZVBpcGVsaW5lLmdldEJpbmRHcm91cExheW91dCgwIC8qIGluZGV4ICovKSxcbi8vIFx0XHRcdGVudHJpZXM6IGVudHJpZXMsXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHR0aGlzLmRpc3BhdGNoWCA9IGRpc3BhdGNoWDtcbi8vIFx0XHR0aGlzLmRpc3BhdGNoWSA9IGRpc3BhdGNoWTtcbi8vIFx0fVxuXG4vLyBcdC8vIERpc3BhdGNoIHRoZSBjb21wdXRlIHBpcGVsaW5lIHRvIHRoZSBHUFVcbi8vIFx0ZGlzcGF0Y2gocGFzc0VuY29kZXIpIHtcbi8vIFx0XHRwYXNzRW5jb2Rlci5zZXRQaXBlbGluZSh0aGlzLmNvbXB1dGVQaXBlbGluZSk7XG4vLyBcdFx0cGFzc0VuY29kZXIuc2V0QmluZEdyb3VwKDAsIHRoaXMuYmluZEdyb3VwKTtcbi8vIFx0XHRwYXNzRW5jb2Rlci5kaXNwYXRjaFdvcmtncm91cHMoXG4vLyBcdFx0XHRNYXRoLmNlaWwodGhpcy5kaXNwYXRjaFggLyA4KSxcbi8vIFx0XHRcdE1hdGguY2VpbCh0aGlzLmRpc3BhdGNoWSAvIDgpXG4vLyBcdFx0KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyAvLy8gVXNlZnVsIGNsYXNzZXMgZm9yIGNsZWFuZXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgaW5wdXQgYW5kIG91dHB1dCBidWZmZXJzXG4vLyAvLy8gdXNlZCBpbiB0aGUgZGVjbGFyYXRpb25zIG9mIHByb2dyYW1zICYgZmx1aWQgc2ltdWxhdGlvbiBzdGVwc1xuXG4vLyBjbGFzcyBBZHZlY3RQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gYWR2ZWN0U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcXVhbnRpdHksIGluX3ZlbG9jaXR5LCBvdXRfcXVhbnRpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBEaXZlcmdlbmNlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X2RpdmVyZ2VuY2UsXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gZGl2ZXJnZW5jZVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHsgYnVmZmVyczogW2luX3ZlbG9jaXR5LCBvdXRfZGl2ZXJnZW5jZV0sIHVuaWZvcm1zLCBzaGFkZXIgfSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgUHJlc3N1cmVQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9wcmVzc3VyZSxcbi8vIFx0XHRpbl9kaXZlcmdlbmNlLFxuLy8gXHRcdG91dF9wcmVzc3VyZSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBwcmVzc3VyZVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9wcmVzc3VyZSwgaW5fZGl2ZXJnZW5jZSwgb3V0X3ByZXNzdXJlXSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIEdyYWRpZW50U3VidHJhY3RQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9wcmVzc3VyZSxcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfdmVsb2NpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gZ3JhZGllbnRTdWJ0cmFjdFNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9wcmVzc3VyZSwgaW5fdmVsb2NpdHksIG91dF92ZWxvY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBCb3VuZGFyeVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBib3VuZGFyeVNoYWRlcixcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHsgYnVmZmVyczogW2luX3F1YW50aXR5LCBvdXRfcXVhbnRpdHldLCB1bmlmb3Jtcywgc2hhZGVyIH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFVwZGF0ZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB1cGRhdGVWZWxvY2l0eVNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3F1YW50aXR5LCBvdXRfcXVhbnRpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBWb3J0aWNpdHlQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfdm9ydGljaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHZvcnRpY2l0eVNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ZlbG9jaXR5LCBvdXRfdm9ydGljaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVm9ydGljaXR5Q29uZmlubWVudFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdGluX3ZvcnRpY2l0eSxcbi8vIFx0XHRvdXRfdmVsb2NpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdm9ydGljaXR5Q29uZmlubWVudFNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ZlbG9jaXR5LCBpbl92b3J0aWNpdHksIG91dF92ZWxvY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbmZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG5cdG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHsgcG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIiB9LFxuXHRyZXF1aXJlZEZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW1wiZmxvYXQzMi1maWx0ZXJhYmxlXCJdXG4pOiBQcm9taXNlPEdQVURldmljZT4ge1xuXHRpZiAoIW5hdmlnYXRvci5ncHUpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJXZWJHUFUgTk9UIFN1cHBvcnRlZFwiKTtcblxuXHRjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcihvcHRpb25zKTtcblx0aWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cblx0cmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSh7IHJlcXVpcmVkRmVhdHVyZXM6IHJlcXVpcmVkRmVhdHVyZXMgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemUgPSB7IHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgfVxuKToge1xuXHRjb250ZXh0OiBHUFVDYW52YXNDb250ZXh0O1xuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCBjYW52YXMgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHNpemUpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cblx0Y29uc3QgY29udGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIikhLmdldENvbnRleHQoXCJ3ZWJncHVcIik7XG5cdGlmICghY29udGV4dCkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIkNhbnZhcyBkb2VzIG5vdCBzdXBwb3J0IFdlYkdQVVwiKTtcblxuXHRjb25zdCBmb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXHRjb250ZXh0LmNvbmZpZ3VyZSh7XG5cdFx0ZGV2aWNlOiBkZXZpY2UsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcblx0XHRhbHBoYU1vZGU6IFwicHJlbXVsdGlwbGllZFwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCwgc2l6ZTogc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdHZlcnRleEJ1ZmZlcixcblx0XHQvKmJ1ZmZlck9mZnNldD0qLyAwLFxuXHRcdC8qZGF0YT0qLyBhcnJheVxuXHQpO1xuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFRleHR1cmVzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRmb3JtYXQ6IHtcblx0XHRzYW1wbGVUeXBlOiBHUFVUZXh0dXJlU2FtcGxlVHlwZTtcblx0XHRzdG9yYWdlOiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRcdHRleHR1cmU6IHN0cmluZztcblx0fSA9IHtcblx0XHRzYW1wbGVUeXBlOiBcImZsb2F0XCIsXG5cdFx0c3RvcmFnZTogXCJyZ2JhMzJmbG9hdFwiLFxuXHRcdHRleHR1cmU6IFwiZjMyXCIsXG5cdH1cbik6IHtcblx0dGV4dHVyZXM6IEdQVVRleHR1cmVbXTtcblx0Zm9ybWF0OiB7XG5cdFx0c2FtcGxlVHlwZTogR1BVVGV4dHVyZVNhbXBsZVR5cGU7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0XHR0ZXh0dXJlOiBzdHJpbmc7XG5cdH07XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCB0ZXh0dXJlRGF0YSA9IG5ldyBBcnJheShzaXplLndpZHRoICogc2l6ZS5oZWlnaHQpO1xuXHRjb25zdCBDSEFOTkVMUyA9IGNoYW5uZWxDb3VudChmb3JtYXQuc3RvcmFnZSk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzaXplLndpZHRoICogc2l6ZS5oZWlnaHQ7IGkrKykge1xuXHRcdHRleHR1cmVEYXRhW2ldID0gW107XG5cblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IENIQU5ORUxTOyBqKyspIHtcblx0XHRcdHRleHR1cmVEYXRhW2ldLnB1c2goTWF0aC5yYW5kb20oKSA+IDEgPyAxIDogMCk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qgc3RhdGVUZXh0dXJlcyA9IFtcIkFcIiwgXCJCXCJdLm1hcCgobGFiZWwpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuXHRcdFx0bGFiZWw6IGBTdGF0ZSBUZXh0dXJlICR7bGFiZWx9YCxcblx0XHRcdHNpemU6IFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sXG5cdFx0XHRmb3JtYXQ6IGZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0dXNhZ2U6XG5cdFx0XHRcdEdQVVRleHR1cmVVc2FnZS5URVhUVVJFX0JJTkRJTkcgfFxuXHRcdFx0XHRHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHxcblx0XHRcdFx0R1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHRcdH0pXG5cdCk7XG5cblx0Y29uc3QgdGV4dHVyZSA9IHN0YXRlVGV4dHVyZXNbMF07XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlRGF0YS5mbGF0KCkpO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG5cdFx0eyB0ZXh0dXJlIH0sXG5cdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdC8qZGF0YUxheW91dD0qLyB7XG5cdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRyb3dzUGVySW1hZ2U6IHNpemUuaGVpZ2h0LFxuXHRcdH0sXG5cdFx0LypzaXplPSovIHNpemVcblx0KTtcblxuXHRyZXR1cm4ge1xuXHRcdHRleHR1cmVzOiBzdGF0ZVRleHR1cmVzLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHNpemU6IHNpemUsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwSW50ZXJhY3Rpb25zKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0Y2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IE9mZnNjcmVlbkNhbnZhcyxcblx0dGV4dHVyZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRzaXplOiBudW1iZXIgPSAxMDAwXG4pOiB7XG5cdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcblx0bGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuXHR2YXIgc2lnbiA9IDE7XG5cblx0bGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG5cdGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG5cdGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG5cdGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuXHRcdC8vIGRpc2FibGUgY29udGV4dCBtZW51XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIGV2ZW50c1xuXHRcdFtcIm1vdXNlbW92ZVwiLCBcInRvdWNobW92ZVwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC5vZmZzZXRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCB4ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGxldCB5ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi55IC8gY2FudmFzLmhlaWdodCkgKiB0ZXh0dXJlLmhlaWdodFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRkYXRhLnNldChbeCwgeV0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIHpvb20gZXZlbnRzIFRPRE8oQGdzemVwKSBhZGQgcGluY2ggYW5kIHNjcm9sbCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIndoZWVsXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS54ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS55ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaXplICs9IHZlbG9jaXR5Lnk7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyBjbGljayBldmVudHMgVE9ETyhAZ3N6ZXApIGltcGxlbWVudCByaWdodCBjbGljayBlcXVpdmFsZW50IGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wibW91c2Vkb3duXCIsIFwidG91Y2hzdGFydFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IDEgLSBldmVudC5idXR0b247XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSA/IC0xIDogMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpZ24gKiBzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdFtcIm1vdXNldXBcIiwgXCJ0b3VjaGVuZFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW05hTl0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXHRjb25zdCB1bmlmb3JtQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiSW50ZXJhY3Rpb24gQnVmZmVyXCIsXG5cdFx0c2l6ZTogZGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YnVmZmVyOiB1bmlmb3JtQnVmZmVyLFxuXHRcdGRhdGE6IGRhdGEsXG5cdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoYW5uZWxDb3VudChmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQpOiBudW1iZXIge1xuXHRpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiYVwiKSkge1xuXHRcdHJldHVybiA0O1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYlwiKSkge1xuXHRcdHJldHVybiAzO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnXCIpKSB7XG5cdFx0cmV0dXJuIDI7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwiclwiKSkge1xuXHRcdHJldHVybiAxO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZm9ybWF0OiBcIiArIGZvcm1hdCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0VmFsdWVzKGNvZGU6IHN0cmluZywgdmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogc3RyaW5nIHtcblx0Y29uc3QgcmVnID0gbmV3IFJlZ0V4cChPYmplY3Qua2V5cyh2YXJpYWJsZXMpLmpvaW4oXCJ8XCIpLCBcImdcIik7XG5cdHJldHVybiBjb2RlLnJlcGxhY2UocmVnLCAoaykgPT4gdmFyaWFibGVzW2tdLnRvU3RyaW5nKCkpO1xufVxuXG5leHBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0c2V0VmFsdWVzLFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==