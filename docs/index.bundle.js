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
    const bindGroupLayout = device.createBindGroupLayout({
        label: "bindGroupLayout",
        entries: [
            {
                binding: READ_BINDING,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-only",
                    format: textures.format.storage,
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
        const texture = canvas.context.getCurrentTexture();
        const view = texture.createView();
        renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
        const renderPass = command.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(GROUP_INDEX, bindGroups[frame_index % 2]);
        renderPass.setVertexBuffer(VERTEX_INDEX, quad.vertexBuffer);
        renderPass.draw(quad.vertexCount);
        renderPass.end();
        // submit the command buffer
        device.queue.submit([command.finish()]);
        texture.destroy();
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

module.exports = "struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_storage_2d<FORMAT, read>;\nconst size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    let x = vec2<i32>((1 + input.coordinate) / 2 * size);\n    let F = textureLoad(F, x);\n\n    // vorticity map\n    output.color.g = 5 * max(0, F.w);\n    output.color.r = 5 * max(0, -F.w);\n\n    // stream function map\n    // output.color.b = abs(F.z);\n\n    output.color.a = 1;//F.x;\n    return output;\n}";

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

module.exports = "struct Input {\n  @builtin(workgroup_id) workGroupID: vec3<u32>,\n  @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst dx = vec2<i32>(1, 0);\nconst dy = vec2<i32>(0, 1);\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_storage_2d<FORMAT, read>;\nconst size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);\n\n@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<FORMAT, write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn diffusion(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {\n    return value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);\n}\n\nfn jacobi_iteration(F: texture_storage_2d<FORMAT, read>, w: f32, x: vec2<i32>, h: f32) -> f32 {\n    return (value(F, x + dx).z + value(F, x - dx).z + value(F, x + dy).z + value(F, x - dy).z + h * w) / 4;\n}\n\nfn advected_value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>, dt: f32) -> vec4<f32> {\n    let vx = (value(F, x + dy).z - value(F, x - dy).z) / 2;\n    let vy = (value(F, x - dx).z - value(F, x + dx).z) / 2;\n\n    let y = vec2<f32>(x) - vec2<f32>(vx, vy) * dt;\n    return interpolate_value(F, y);\n}\n\n\nfn value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {\n    let y = x + size ; // not sure why this is necessary\n    return textureLoad(F, y % size);\n}\n\nfn interpolate_value(F: texture_storage_2d<FORMAT, read>, x: vec2<f32>) -> vec4<f32> {\n    let f: vec2<f32> = fract(x);\n    let sample = vec2<i32>(x + (0.5 - f));\n    let tl: vec4f = textureLoad(F, clamp(sample, dx + dy, size));\n    let tr: vec4f = textureLoad(F, clamp(sample + dx, dx + dy, size));\n    let bl: vec4f = textureLoad(F, clamp(sample + dy, dx + dy, size));\n    let br: vec4f = textureLoad(F, clamp(sample + dx + dy, dx + dy, size));\n    let tA: vec4f = mix(tl, tr, f.x);\n    let tB: vec4f = mix(bl, br, f.x);\n    return mix(tA, tB, f.y);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(input: Input) {\n\n    let x = vec2<i32>(input.globalInvocationID.xy);\n    \n    // vorticity timestep\n    var Fdt = advected_value(F, x, 1);\n    Fdt.w += diffusion(F, x).w * 0.05;\n\n    // BUG (gszep) use advected values\n    // relaxation of poisson equation for stream function\n    Fdt.z = jacobi_iteration(F, Fdt.w, x, 1);\n\n    // error calculation\n    Fdt.x = abs(diffusion(F, x).z + value(F, x).w) / (1 + value(F, x).w);\n\n    // brush interaction\n    let distance = vec2<f32>(x) - interaction.position;\n    let norm = dot(distance, distance);\n\n    if sqrt(norm) < abs(interaction.size) {\n        Fdt.w += 0.01 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n    }\n\n    textureStore(Fdash, x, Fdt);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxJQUFZLEVBQUUsU0FBOEI7SUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQVNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0c2V0VmFsdWVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgY2VsbFZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwudmVydC53Z3NsXCI7XG5pbXBvcnQgY2VsbEZyYWdtZW50U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC5mcmFnLndnc2xcIjtcbmltcG9ydCB0aW1lc3RlcENvbXB1dGVTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy90aW1lc3RlcC5jb21wLndnc2xcIjtcblxuY29uc3QgV09SS0dST1VQX1NJWkUgPSA4O1xuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMTtcbmxldCBmcmFtZV9pbmRleCA9IDA7XG5cbmFzeW5jIGZ1bmN0aW9uIGluZGV4KCk6IFByb21pc2U8dm9pZD4ge1xuXHQvLyBzZXR1cCBhbmQgY29uZmlndXJlIFdlYkdQVVxuXHRjb25zdCBkZXZpY2UgPSBhd2FpdCByZXF1ZXN0RGV2aWNlKCk7XG5cdGNvbnN0IGNhbnZhcyA9IGNvbmZpZ3VyZUNhbnZhcyhkZXZpY2UpO1xuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBWRVJURVhfSU5ERVggPSAwO1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXG5cdGNvbnN0IHF1YWQgPSBzZXR1cFZlcnRleEJ1ZmZlcihkZXZpY2UsIFwiUXVhZCBWZXJ0ZXggQnVmZmVyXCIsIFFVQUQpO1xuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoZGV2aWNlLCBjYW52YXMuc2l6ZSk7XG5cblx0Y29uc3QgUkVBRF9CSU5ESU5HID0gMDtcblx0Y29uc3QgV1JJVEVfQklORElORyA9IDE7XG5cdGNvbnN0IFdPUktHUk9VUF9DT1VOVDogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS53aWR0aCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBXT1JLR1JPVVBfU0laRSksXG5cdF07XG5cblx0Ly8gc2V0dXAgaW50ZXJhY3Rpb25zXG5cdGNvbnN0IElOVEVSQUNUSU9OX0JJTkRJTkcgPSAyO1xuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblxuXHRjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcblx0XHRsYWJlbDogXCJiaW5kR3JvdXBMYXlvdXRcIixcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFJFQURfQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLW9ubHlcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogV1JJVEVfQklORElORyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwid3JpdGUtb25seVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBpbnRlcmFjdGlvbnMudHlwZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwcyA9IFswLCAxXS5tYXAoKGkpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogYEJpbmQgR3JvdXAgPiAke3RleHR1cmVzLnRleHR1cmVzW2ldLmxhYmVsfWAsXG5cdFx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbaSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzWyhpICsgMSkgJSAyXS5jcmVhdGVWaWV3KCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSlcblx0KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIHtcblx0XHRcdFx0XHRXT1JLR1JPVVBfU0laRTogV09SS0dST1VQX1NJWkUsXG5cdFx0XHRcdFx0R1JPVVBfSU5ERVg6IEdST1VQX0lOREVYLFxuXHRcdFx0XHRcdFJFQURfQklORElORzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdFdSSVRFX0JJTkRJTkc6IFdSSVRFX0JJTkRJTkcsXG5cdFx0XHRcdFx0SU5URVJBQ1RJT05fQklORElORzogSU5URVJBQ1RJT05fQklORElORyxcblx0XHRcdFx0XHRGT1JNQVQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHRcdFdJRFRIOiB0ZXh0dXJlcy5zaXplLndpZHRoLFxuXHRcdFx0XHRcdEhFSUdIVDogdGV4dHVyZXMuc2l6ZS5oZWlnaHQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgUkVOREVSX0lOREVYID0gMDtcblx0Y29uc3QgcmVuZGVyUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInJlbmRlclBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHR2ZXJ0ZXg6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsVmVydGV4U2hhZGVyLCB7XG5cdFx0XHRcdFx0VkVSVEVYX0lOREVYOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsVmVydGV4U2hhZGVyXCIsXG5cdFx0XHR9KSxcblx0XHRcdGJ1ZmZlcnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGFycmF5U3RyaWRlOiBxdWFkLmFycmF5U3RyaWRlLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Zm9ybWF0OiBxdWFkLmZvcm1hdCxcblx0XHRcdFx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRcdFx0XHRzaGFkZXJMb2NhdGlvbjogVkVSVEVYX0lOREVYLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHRcdGZyYWdtZW50OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBzZXRWYWx1ZXMoY2VsbEZyYWdtZW50U2hhZGVyLCB7XG5cdFx0XHRcdFx0R1JPVVBfSU5ERVg6IEdST1VQX0lOREVYLFxuXHRcdFx0XHRcdEZPUk1BVDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0VkVSVEVYX0lOREVYOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0UkVOREVSX0lOREVYOiBSRU5ERVJfSU5ERVgsXG5cdFx0XHRcdFx0V0lEVEg6IHRleHR1cmVzLnNpemUud2lkdGgsXG5cdFx0XHRcdFx0SEVJR0hUOiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3JtYXQ6IGNhbnZhcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdGxvYWRPcDogXCJsb2FkXCIsXG5cdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0fSxcblx0XTtcblx0Y29uc3QgcmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG5cdFx0Y29sb3JBdHRhY2htZW50czogY29sb3JBdHRhY2htZW50cyxcblx0fTtcblxuXHRmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Ly8gY29tcHV0ZSBwYXNzXG5cdFx0Y29uc3QgY29tcHV0ZVBhc3MgPSBjb21tYW5kLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblxuXHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXBzW2ZyYW1lX2luZGV4ICUgMl0pO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdFx0aW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdC8qb2Zmc2V0PSovIDAsXG5cdFx0XHQvKmRhdGE9Ki8gaW50ZXJhY3Rpb25zLmRhdGFcblx0XHQpO1xuXG5cdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cdFx0Y29tcHV0ZVBhc3MuZW5kKCk7XG5cblx0XHRmcmFtZV9pbmRleCsrO1xuXG5cdFx0Ly8gcmVuZGVyIHBhc3Ncblx0XHRjb25zdCB0ZXh0dXJlID0gY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKTtcblx0XHRjb25zdCB2aWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KCk7XG5cblx0XHRyZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzW1JFTkRFUl9JTkRFWF0udmlldyA9IHZpZXc7XG5cdFx0Y29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmQuYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcblxuXHRcdHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlclBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXBzW2ZyYW1lX2luZGV4ICUgMl0pO1xuXHRcdHJlbmRlclBhc3Muc2V0VmVydGV4QnVmZmVyKFZFUlRFWF9JTkRFWCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0XHR0ZXh0dXJlLmRlc3Ryb3koKTtcblx0fVxuXG5cdHNldEludGVydmFsKHJlbmRlciwgVVBEQVRFX0lOVEVSVkFMKTtcblx0cmV0dXJuO1xufVxuXG5pbmRleCgpO1xuIiwiLy8gLy8gQ3JlYXRlcyBhbmQgbWFuYWdlIG11bHRpLWRpbWVuc2lvbmFsIGJ1ZmZlcnMgYnkgY3JlYXRpbmcgYSBidWZmZXIgZm9yIGVhY2ggZGltZW5zaW9uXG4vLyBjbGFzcyBEeW5hbWljQnVmZmVyIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGRpbXMgPSAxLCAvLyBOdW1iZXIgb2YgZGltZW5zaW9uc1xuLy8gXHRcdHcgPSBzZXR0aW5ncy5ncmlkX3csIC8vIEJ1ZmZlciB3aWR0aFxuLy8gXHRcdGggPSBzZXR0aW5ncy5ncmlkX2gsIC8vIEJ1ZmZlciBoZWlnaHRcbi8vIFx0fSA9IHt9KSB7XG4vLyBcdFx0dGhpcy5kaW1zID0gZGltcztcbi8vIFx0XHR0aGlzLmJ1ZmZlclNpemUgPSB3ICogaCAqIDQ7XG4vLyBcdFx0dGhpcy53ID0gdztcbi8vIFx0XHR0aGlzLmggPSBoO1xuLy8gXHRcdHRoaXMuYnVmZmVycyA9IG5ldyBBcnJheShkaW1zKS5maWxsKCkubWFwKChfKSA9PlxuLy8gXHRcdFx0ZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuYnVmZmVyU2l6ZSxcbi8vIFx0XHRcdFx0dXNhZ2U6XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSB8XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkMgfFxuLy8gXHRcdFx0XHRcdEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSlcbi8vIFx0XHQpO1xuLy8gXHR9XG5cbi8vIFx0Ly8gQ29weSBlYWNoIGJ1ZmZlciB0byBhbm90aGVyIER5bmFtaWNCdWZmZXIncyBidWZmZXJzLlxuLy8gXHQvLyBJZiB0aGUgZGltZW5zaW9ucyBkb24ndCBtYXRjaCwgdGhlIGxhc3Qgbm9uLWVtcHR5IGRpbWVuc2lvbiB3aWxsIGJlIGNvcGllZCBpbnN0ZWFkXG4vLyBcdGNvcHlUbyhidWZmZXIsIGNvbW1hbmRFbmNvZGVyKSB7XG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1heCh0aGlzLmRpbXMsIGJ1ZmZlci5kaW1zKTsgaSsrKSB7XG4vLyBcdFx0XHRjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIoXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyc1tNYXRoLm1pbihpLCB0aGlzLmJ1ZmZlcnMubGVuZ3RoIC0gMSldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRidWZmZXIuYnVmZmVyc1tNYXRoLm1pbihpLCBidWZmZXIuYnVmZmVycy5sZW5ndGggLSAxKV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdHRoaXMuYnVmZmVyU2l6ZVxuLy8gXHRcdFx0KTtcbi8vIFx0XHR9XG4vLyBcdH1cblxuLy8gXHQvLyBSZXNldCBhbGwgdGhlIGJ1ZmZlcnNcbi8vIFx0Y2xlYXIocXVldWUpIHtcbi8vIFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGltczsgaSsrKSB7XG4vLyBcdFx0XHRxdWV1ZS53cml0ZUJ1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJzW2ldLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHRuZXcgRmxvYXQzMkFycmF5KHRoaXMudyAqIHRoaXMuaClcbi8vIFx0XHRcdCk7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIE1hbmFnZSB1bmlmb3JtIGJ1ZmZlcnMgcmVsYXRpdmUgdG8gdGhlIGNvbXB1dGUgc2hhZGVycyAmIHRoZSBndWlcbi8vIGNsYXNzIFVuaWZvcm0ge1xuLy8gXHRjb25zdHJ1Y3Rvcihcbi8vIFx0XHRuYW1lLFxuLy8gXHRcdHtcbi8vIFx0XHRcdHNpemUsXG4vLyBcdFx0XHR2YWx1ZSxcbi8vIFx0XHRcdG1pbixcbi8vIFx0XHRcdG1heCxcbi8vIFx0XHRcdHN0ZXAsXG4vLyBcdFx0XHRvbkNoYW5nZSxcbi8vIFx0XHRcdGRpc3BsYXlOYW1lLFxuLy8gXHRcdFx0YWRkVG9HVUkgPSB0cnVlLFxuLy8gXHRcdH0gPSB7fVxuLy8gXHQpIHtcbi8vIFx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuLy8gXHRcdHRoaXMuc2l6ZSA9IHNpemUgPz8gKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlLmxlbmd0aCA6IDEpO1xuLy8gXHRcdHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuLy8gXHRcdGlmICh0aGlzLnNpemUgPT09IDEpIHtcbi8vIFx0XHRcdGlmIChzZXR0aW5nc1tuYW1lXSA9PSBudWxsKSB7XG4vLyBcdFx0XHRcdHNldHRpbmdzW25hbWVdID0gdmFsdWUgPz8gMDtcbi8vIFx0XHRcdFx0dGhpcy5hbHdheXNVcGRhdGUgPSB0cnVlO1xuLy8gXHRcdFx0fSBlbHNlIGlmIChhZGRUb0dVSSkge1xuLy8gXHRcdFx0XHRndWkuYWRkKHNldHRpbmdzLCBuYW1lLCBtaW4sIG1heCwgc3RlcClcbi8vIFx0XHRcdFx0XHQub25DaGFuZ2UoKHYpID0+IHtcbi8vIFx0XHRcdFx0XHRcdGlmIChvbkNoYW5nZSkgb25DaGFuZ2Uodik7XG4vLyBcdFx0XHRcdFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0XHRcdFx0XHR9KVxuLy8gXHRcdFx0XHRcdC5uYW1lKGRpc3BsYXlOYW1lID8/IG5hbWUpO1xuLy8gXHRcdFx0fVxuLy8gXHRcdH1cblxuLy8gXHRcdGlmICh0aGlzLnNpemUgPT09IDEgfHwgdmFsdWUgIT0gbnVsbCkge1xuLy8gXHRcdFx0dGhpcy5idWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0bWFwcGVkQXRDcmVhdGlvbjogdHJ1ZSxcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5zaXplICogNCxcbi8vIFx0XHRcdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbi8vIFx0XHRcdH0pO1xuXG4vLyBcdFx0XHRjb25zdCBhcnJheUJ1ZmZlciA9IHRoaXMuYnVmZmVyLmdldE1hcHBlZFJhbmdlKCk7XG4vLyBcdFx0XHRuZXcgRmxvYXQzMkFycmF5KGFycmF5QnVmZmVyKS5zZXQoXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodmFsdWUgPz8gW3NldHRpbmdzW25hbWVdXSlcbi8vIFx0XHRcdCk7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlci51bm1hcCgpO1xuLy8gXHRcdH0gZWxzZSB7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRzaXplOiB0aGlzLnNpemUgKiA0LFxuLy8gXHRcdFx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSk7XG4vLyBcdFx0fVxuXG4vLyBcdFx0Z2xvYmFsVW5pZm9ybXNbbmFtZV0gPSB0aGlzO1xuLy8gXHR9XG5cbi8vIFx0c2V0VmFsdWUodmFsdWUpIHtcbi8vIFx0XHRzZXR0aW5nc1t0aGlzLm5hbWVdID0gdmFsdWU7XG4vLyBcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4vLyBcdH1cblxuLy8gXHQvLyBVcGRhdGUgdGhlIEdQVSBidWZmZXIgaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkXG4vLyBcdHVwZGF0ZShxdWV1ZSwgdmFsdWUpIHtcbi8vIFx0XHRpZiAodGhpcy5uZWVkc1VwZGF0ZSB8fCB0aGlzLmFsd2F5c1VwZGF0ZSB8fCB2YWx1ZSAhPSBudWxsKSB7XG4vLyBcdFx0XHRpZiAodHlwZW9mIHRoaXMubmVlZHNVcGRhdGUgIT09IFwiYm9vbGVhblwiKSB2YWx1ZSA9IHRoaXMubmVlZHNVcGRhdGU7XG4vLyBcdFx0XHRxdWV1ZS53cml0ZUJ1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXIsXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodmFsdWUgPz8gW3BhcnNlRmxvYXQoc2V0dGluZ3NbdGhpcy5uYW1lXSldKSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0dGhpcy5zaXplXG4vLyBcdFx0XHQpO1xuLy8gXHRcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBPbiBmaXJzdCBjbGljazogc3RhcnQgcmVjb3JkaW5nIHRoZSBtb3VzZSBwb3NpdGlvbiBhdCBlYWNoIGZyYW1lXG4vLyAvLyBPbiBzZWNvbmQgY2xpY2s6IHJlc2V0IHRoZSBjYW52YXMsIHN0YXJ0IHJlY29yZGluZyB0aGUgY2FudmFzLFxuLy8gLy8gb3ZlcnJpZGUgdGhlIG1vdXNlIHBvc2l0aW9uIHdpdGggdGhlIHByZXZpb3VzbHkgcmVjb3JkZWQgdmFsdWVzXG4vLyAvLyBhbmQgZmluYWxseSBkb3dubG9hZHMgYSAud2VibSA2MGZwcyBmaWxlXG4vLyBjbGFzcyBSZWNvcmRlciB7XG4vLyBcdGNvbnN0cnVjdG9yKHJlc2V0U2ltdWxhdGlvbikge1xuLy8gXHRcdHRoaXMubW91c2VEYXRhID0gW107XG5cbi8vIFx0XHR0aGlzLmNhcHR1cmVyID0gbmV3IENDYXB0dXJlKHtcbi8vIFx0XHRcdGZvcm1hdDogXCJ3ZWJtXCIsXG4vLyBcdFx0XHRmcmFtZXJhdGU6IDYwLFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0dGhpcy5pc1JlY29yZGluZyA9IGZhbHNlO1xuXG4vLyBcdFx0Ly8gUmVjb3JkZXIgaXMgZGlzYWJsZWQgdW50aWwgSSBtYWtlIGEgdG9vbHRpcCBleHBsYWluaW5nIGhvdyBpdCB3b3Jrc1xuLy8gXHRcdC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbi8vIFx0XHQvLyAgICAgaWYgKHRoaXMuaXNSZWNvcmRpbmcpIHRoaXMuc3RvcCgpXG4vLyBcdFx0Ly8gICAgIGVsc2UgdGhpcy5zdGFydCgpXG4vLyBcdFx0Ly8gfSlcblxuLy8gXHRcdHRoaXMucmVzZXRTaW11bGF0aW9uID0gcmVzZXRTaW11bGF0aW9uO1xuLy8gXHR9XG5cbi8vIFx0c3RhcnQoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgIT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gU3RhcnQgcmVjb3JkaW5nIG1vdXNlIHBvc2l0aW9uXG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gXCJtb3VzZVwiO1xuLy8gXHRcdH0gZWxzZSB7XG4vLyBcdFx0XHQvLyBTdGFydCByZWNvcmRpbmcgdGhlIGNhbnZhc1xuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IFwiZnJhbWVzXCI7XG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnN0YXJ0KCk7XG4vLyBcdFx0fVxuXG4vLyBcdFx0Y29uc29sZS5sb2coXCJzdGFydFwiLCB0aGlzLmlzUmVjb3JkaW5nKTtcbi8vIFx0fVxuXG4vLyBcdHVwZGF0ZSgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBSZWNvcmQgY3VycmVudCBmcmFtZSdzIG1vdXNlIGRhdGFcbi8vIFx0XHRcdGlmIChtb3VzZUluZm9zLmN1cnJlbnQpXG4vLyBcdFx0XHRcdHRoaXMubW91c2VEYXRhLnB1c2goW1xuLy8gXHRcdFx0XHRcdC4uLm1vdXNlSW5mb3MuY3VycmVudCxcbi8vIFx0XHRcdFx0XHQuLi5tb3VzZUluZm9zLnZlbG9jaXR5LFxuLy8gXHRcdFx0XHRdKTtcbi8vIFx0XHR9IGVsc2UgaWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwiZnJhbWVzXCIpIHtcbi8vIFx0XHRcdC8vIFJlY29yZCBjdXJyZW50IGZyYW1lJ3MgY2FudmFzXG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLmNhcHR1cmUoY2FudmFzKTtcbi8vIFx0XHR9XG4vLyBcdH1cblxuLy8gXHRzdG9wKCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFJlc2V0IHRoZSBzaW11bGF0aW9uIGFuZCBzdGFydCB0aGUgY2FudmFzIHJlY29yZFxuLy8gXHRcdFx0dGhpcy5yZXNldFNpbXVsYXRpb24oKTtcbi8vIFx0XHRcdHRoaXMuc3RhcnQoKTtcbi8vIFx0XHR9IGVsc2UgaWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwiZnJhbWVzXCIpIHtcbi8vIFx0XHRcdC8vIFN0b3AgdGhlIHJlY29yZGluZyBhbmQgc2F2ZSB0aGUgdmlkZW8gZmlsZVxuLy8gXHRcdFx0dGhpcy5jYXB0dXJlci5zdG9wKCk7XG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnNhdmUoKTtcbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBmYWxzZTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gQ3JlYXRlcyBhIHNoYWRlciBtb2R1bGUsIGNvbXB1dGUgcGlwZWxpbmUgJiBiaW5kIGdyb3VwIHRvIHVzZSB3aXRoIHRoZSBHUFVcbi8vIGNsYXNzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0YnVmZmVycyA9IFtdLCAvLyBTdG9yYWdlIGJ1ZmZlcnNcbi8vIFx0XHR1bmlmb3JtcyA9IFtdLCAvLyBVbmlmb3JtIGJ1ZmZlcnNcbi8vIFx0XHRzaGFkZXIsIC8vIFdHU0wgQ29tcHV0ZSBTaGFkZXIgYXMgYSBzdHJpbmdcbi8vIFx0XHRkaXNwYXRjaFggPSBzZXR0aW5ncy5ncmlkX3csIC8vIERpc3BhdGNoIHdvcmtlcnMgd2lkdGhcbi8vIFx0XHRkaXNwYXRjaFkgPSBzZXR0aW5ncy5ncmlkX2gsIC8vIERpc3BhdGNoIHdvcmtlcnMgaGVpZ2h0XG4vLyBcdH0pIHtcbi8vIFx0XHQvLyBDcmVhdGUgdGhlIHNoYWRlciBtb2R1bGUgdXNpbmcgdGhlIFdHU0wgc3RyaW5nIGFuZCB1c2UgaXRcbi8vIFx0XHQvLyB0byBjcmVhdGUgYSBjb21wdXRlIHBpcGVsaW5lIHdpdGggJ2F1dG8nIGJpbmRpbmcgbGF5b3V0XG4vLyBcdFx0dGhpcy5jb21wdXRlUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbi8vIFx0XHRcdGxheW91dDogXCJhdXRvXCIsXG4vLyBcdFx0XHRjb21wdXRlOiB7XG4vLyBcdFx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7IGNvZGU6IHNoYWRlciB9KSxcbi8vIFx0XHRcdFx0ZW50cnlQb2ludDogXCJtYWluXCIsXG4vLyBcdFx0XHR9LFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0Ly8gQ29uY2F0IHRoZSBidWZmZXIgJiB1bmlmb3JtcyBhbmQgZm9ybWF0IHRoZSBlbnRyaWVzIHRvIHRoZSByaWdodCBXZWJHUFUgZm9ybWF0XG4vLyBcdFx0bGV0IGVudHJpZXMgPSBidWZmZXJzXG4vLyBcdFx0XHQubWFwKChiKSA9PiBiLmJ1ZmZlcnMpXG4vLyBcdFx0XHQuZmxhdCgpXG4vLyBcdFx0XHQubWFwKChidWZmZXIpID0+ICh7IGJ1ZmZlciB9KSk7XG4vLyBcdFx0ZW50cmllcy5wdXNoKC4uLnVuaWZvcm1zLm1hcCgoeyBidWZmZXIgfSkgPT4gKHsgYnVmZmVyIH0pKSk7XG4vLyBcdFx0ZW50cmllcyA9IGVudHJpZXMubWFwKChlLCBpKSA9PiAoe1xuLy8gXHRcdFx0YmluZGluZzogaSxcbi8vIFx0XHRcdHJlc291cmNlOiBlLFxuLy8gXHRcdH0pKTtcblxuLy8gXHRcdC8vIENyZWF0ZSB0aGUgYmluZCBncm91cCB1c2luZyB0aGVzZSBlbnRyaWVzICYgYXV0by1sYXlvdXQgZGV0ZWN0aW9uXG4vLyBcdFx0dGhpcy5iaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcbi8vIFx0XHRcdGxheW91dDogdGhpcy5jb21wdXRlUGlwZWxpbmUuZ2V0QmluZEdyb3VwTGF5b3V0KDAgLyogaW5kZXggKi8pLFxuLy8gXHRcdFx0ZW50cmllczogZW50cmllcyxcbi8vIFx0XHR9KTtcblxuLy8gXHRcdHRoaXMuZGlzcGF0Y2hYID0gZGlzcGF0Y2hYO1xuLy8gXHRcdHRoaXMuZGlzcGF0Y2hZID0gZGlzcGF0Y2hZO1xuLy8gXHR9XG5cbi8vIFx0Ly8gRGlzcGF0Y2ggdGhlIGNvbXB1dGUgcGlwZWxpbmUgdG8gdGhlIEdQVVxuLy8gXHRkaXNwYXRjaChwYXNzRW5jb2Rlcikge1xuLy8gXHRcdHBhc3NFbmNvZGVyLnNldFBpcGVsaW5lKHRoaXMuY29tcHV0ZVBpcGVsaW5lKTtcbi8vIFx0XHRwYXNzRW5jb2Rlci5zZXRCaW5kR3JvdXAoMCwgdGhpcy5iaW5kR3JvdXApO1xuLy8gXHRcdHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3Vwcyhcbi8vIFx0XHRcdE1hdGguY2VpbCh0aGlzLmRpc3BhdGNoWCAvIDgpLFxuLy8gXHRcdFx0TWF0aC5jZWlsKHRoaXMuZGlzcGF0Y2hZIC8gOClcbi8vIFx0XHQpO1xuLy8gXHR9XG4vLyB9XG5cbi8vIC8vLyBVc2VmdWwgY2xhc3NlcyBmb3IgY2xlYW5lciB1bmRlcnN0YW5kaW5nIG9mIHRoZSBpbnB1dCBhbmQgb3V0cHV0IGJ1ZmZlcnNcbi8vIC8vLyB1c2VkIGluIHRoZSBkZWNsYXJhdGlvbnMgb2YgcHJvZ3JhbXMgJiBmbHVpZCBzaW11bGF0aW9uIHN0ZXBzXG5cbi8vIGNsYXNzIEFkdmVjdFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3F1YW50aXR5LFxuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF9xdWFudGl0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBhZHZlY3RTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgaW5fdmVsb2NpdHksIG91dF9xdWFudGl0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIERpdmVyZ2VuY2VQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRvdXRfZGl2ZXJnZW5jZSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBkaXZlcmdlbmNlU2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoeyBidWZmZXJzOiBbaW5fdmVsb2NpdHksIG91dF9kaXZlcmdlbmNlXSwgdW5pZm9ybXMsIHNoYWRlciB9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBQcmVzc3VyZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ByZXNzdXJlLFxuLy8gXHRcdGluX2RpdmVyZ2VuY2UsXG4vLyBcdFx0b3V0X3ByZXNzdXJlLFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHByZXNzdXJlU2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ByZXNzdXJlLCBpbl9kaXZlcmdlbmNlLCBvdXRfcHJlc3N1cmVdLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgR3JhZGllbnRTdWJ0cmFjdFByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ByZXNzdXJlLFxuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF92ZWxvY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSBncmFkaWVudFN1YnRyYWN0U2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3ByZXNzdXJlLCBpbl92ZWxvY2l0eSwgb3V0X3ZlbG9jaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIEJvdW5kYXJ5UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGJvdW5kYXJ5U2hhZGVyLFxuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoeyBidWZmZXJzOiBbaW5fcXVhbnRpdHksIG91dF9xdWFudGl0eV0sIHVuaWZvcm1zLCBzaGFkZXIgfSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVXBkYXRlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHVwZGF0ZVZlbG9jaXR5U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcXVhbnRpdHksIG91dF9xdWFudGl0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFZvcnRpY2l0eVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF92b3J0aWNpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdm9ydGljaXR5U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fdmVsb2NpdHksIG91dF92b3J0aWNpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBWb3J0aWNpdHlDb25maW5tZW50UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0aW5fdm9ydGljaXR5LFxuLy8gXHRcdG91dF92ZWxvY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB2b3J0aWNpdHlDb25maW5tZW50U2hhZGVyLFxuLy8gXHRcdC4uLnByb3BzXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fdmVsb2NpdHksIGluX3ZvcnRpY2l0eSwgb3V0X3ZlbG9jaXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuZnVuY3Rpb24gdGhyb3dEZXRlY3Rpb25FcnJvcihlcnJvcjogc3RyaW5nKTogbmV2ZXIge1xuXHQoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi53ZWJncHUtbm90LXN1cHBvcnRlZFwiKSBhcyBIVE1MRWxlbWVudFxuXHQpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblx0dGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGluaXRpYWxpemUgV2ViR1BVOiBcIiArIGVycm9yKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWVzdERldmljZShcblx0b3B0aW9uczogR1BVUmVxdWVzdEFkYXB0ZXJPcHRpb25zID0geyBwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiIH0sXG5cdHJlcXVpcmVkRmVhdHVyZXM6IEdQVUZlYXR1cmVOYW1lW10gPSBbXCJmbG9hdDMyLWZpbHRlcmFibGVcIl1cbik6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKG9wdGlvbnMpO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKHsgcmVxdWlyZWRGZWF0dXJlczogcmVxdWlyZWRGZWF0dXJlcyB9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0dmVydGV4QnVmZmVyLFxuXHRcdC8qYnVmZmVyT2Zmc2V0PSovIDAsXG5cdFx0LypkYXRhPSovIGFycmF5XG5cdCk7XG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVGV4dHVyZXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdGZvcm1hdDoge1xuXHRcdHNhbXBsZVR5cGU6IEdQVVRleHR1cmVTYW1wbGVUeXBlO1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdFx0dGV4dHVyZTogc3RyaW5nO1xuXHR9ID0ge1xuXHRcdHNhbXBsZVR5cGU6IFwiZmxvYXRcIixcblx0XHRzdG9yYWdlOiBcInJnYmEzMmZsb2F0XCIsXG5cdFx0dGV4dHVyZTogXCJmMzJcIixcblx0fVxuKToge1xuXHR0ZXh0dXJlczogR1BVVGV4dHVyZVtdO1xuXHRmb3JtYXQ6IHtcblx0XHRzYW1wbGVUeXBlOiBHUFVUZXh0dXJlU2FtcGxlVHlwZTtcblx0XHRzdG9yYWdlOiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRcdHRleHR1cmU6IHN0cmluZztcblx0fTtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IHRleHR1cmVEYXRhID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KGZvcm1hdC5zdG9yYWdlKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0dGV4dHVyZURhdGFbaV0gPSBbXTtcblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgQ0hBTk5FTFM7IGorKykge1xuXHRcdFx0dGV4dHVyZURhdGFbaV0ucHVzaChNYXRoLnJhbmRvbSgpID4gMSA/IDEgOiAwKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBzdGF0ZVRleHR1cmVzID0gW1wiQVwiLCBcIkJcIl0ubWFwKChsYWJlbCkgPT5cblx0XHRkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHRsYWJlbDogYFN0YXRlIFRleHR1cmUgJHtsYWJlbH1gLFxuXHRcdFx0c2l6ZTogW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0XSxcblx0XHRcdGZvcm1hdDogZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcblx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHRleHR1cmUgPSBzdGF0ZVRleHR1cmVzWzBdO1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZURhdGEuZmxhdCgpKTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdHsgdGV4dHVyZSB9LFxuXHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHQvKmRhdGFMYXlvdXQ9Ki8ge1xuXHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0cm93c1BlckltYWdlOiBzaXplLmhlaWdodCxcblx0XHR9LFxuXHRcdC8qc2l6ZT0qLyBzaXplXG5cdCk7XG5cblx0cmV0dXJuIHtcblx0XHR0ZXh0dXJlczogc3RhdGVUZXh0dXJlcyxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogbnVtYmVyID0gMTAwMFxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcblx0dmFyIHNpZ24gPSAxO1xuXG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbcG9zaXRpb24ueCwgcG9zaXRpb24ueV0pO1xuXHRpZiAoY2FudmFzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcblx0XHQvLyBkaXNhYmxlIGNvbnRleHQgbWVudVxuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgeCA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueSAvIGNhbnZhcy5oZWlnaHQpICogdGV4dHVyZS5oZWlnaHRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyB6b29tIGV2ZW50cyBUT0RPKEBnc3plcCkgYWRkIHBpbmNoIGFuZCBzY3JvbGwgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJ3aGVlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2l6ZSArPSB2ZWxvY2l0eS55O1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY2xpY2sgZXZlbnRzIFRPRE8oQGdzemVwKSBpbXBsZW1lbnQgcmlnaHQgY2xpY2sgZXF1aXZhbGVudCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSAxIC0gZXZlbnQuYnV0dG9uO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaWduICogc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRbXCJtb3VzZXVwXCIsIFwidG91Y2hlbmRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtOYU5dLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlcyhjb2RlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG5cdGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAoT2JqZWN0LmtleXModmFyaWFibGVzKS5qb2luKFwifFwiKSwgXCJnXCIpO1xuXHRyZXR1cm4gY29kZS5yZXBsYWNlKHJlZywgKGspID0+IHZhcmlhYmxlc1trXS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHNldFZhbHVlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=