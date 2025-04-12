"use strict";
(self["webpackChunkfluid_structure_interactive"] = self["webpackChunkfluid_structure_interactive"] || []).push([["index"],{

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
/* harmony import */ var _shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shaders/includes/bindings.wgsl */ "./src/shaders/includes/bindings.wgsl");
/* harmony import */ var _shaders_includes_cache_wgsl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shaders/includes/cache.wgsl */ "./src/shaders/includes/cache.wgsl");
/* harmony import */ var _shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shaders/cell.vert.wgsl */ "./src/shaders/cell.vert.wgsl");
/* harmony import */ var _shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shaders/cell.frag.wgsl */ "./src/shaders/cell.frag.wgsl");
/* harmony import */ var _shaders_lattice_boltzmann_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shaders/lattice-boltzmann.comp.wgsl */ "./src/shaders/lattice-boltzmann.comp.wgsl");






const UPDATE_INTERVAL = 1;
let frame_index = 0;
const lattice_vector = [
    [0, 0],
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
];
const lattice_weight = [
    4.0 / 9.0,
    1.0 / 9.0,
    1.0 / 9.0,
    1.0 / 9.0,
    1.0 / 9.0,
    1.0 / 36.0,
    1.0 / 36.0,
    1.0 / 36.0,
    1.0 / 36.0,
];
function initialDensity(height, width) {
    const density = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            const centerX = width / 2;
            const centerY = height / 2;
            const dx = j - centerX;
            const dy = i - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const sigma = 10;
            const rho = Math.exp((-distance * distance) / (2 * sigma * sigma));
            row.push([1]);
        }
        density.push(row);
    }
    return density;
}
function initialVelocity(height, width) {
    // Create empty nested array structure
    const velocityField = [];
    // Fill with velocity components
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            // For each cell, store [vx, vy] components
            // Create a simple circular flow pattern as an example
            // const centerX = width / 2;
            // const centerY = height / 2;
            // const dx = j - centerX;
            // const dy = i - centerY;
            // const distance = Math.sqrt(dx * dx + dy * dy);
            // // Create circular velocity field
            // const sigma = 50;
            // var rho = Math.exp((-distance * distance) / (2 * sigma * sigma));
            // rho = rho * Math.exp((-(distance - 50) * (distance - 50)) / 200);
            // const vx = (dy / distance) * rho;
            // const vy = (dx / distance) * rho;
            // random velocity
            const vx = Math.random() * 2 - 1; // Random value between -1 and 1
            const vy = Math.random() * 2 - 1; // Random value between -1 and 1
            row.push([vx / 10, vy / 10]);
        }
        velocityField.push(row);
    }
    return velocityField;
}
function initialDeformationGradient(height, width) {
    const deformation = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            row.push([j, i, 0, 0]);
        }
        deformation.push(row);
    }
    return deformation;
}
function computeEquilibrium(density, velocity) {
    const equilibrium = [];
    const height = density.length;
    const width = density[0].length;
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            const cell = [];
            for (let k = 0; k < 9; k++) {
                const speed = Math.sqrt(velocity[i][j][0] * velocity[i][j][0] +
                    velocity[i][j][1] * velocity[i][j][1]);
                const lattice_speed = lattice_vector[k][0] * velocity[i][j][0] +
                    lattice_vector[k][1] * velocity[i][j][1];
                const f_eq = lattice_weight[k] *
                    density[i][j][0] *
                    (1.0 +
                        3.0 * lattice_speed +
                        4.5 * lattice_speed * lattice_speed -
                        1.5 * speed * speed);
                cell.push(f_eq);
            }
            row.push(cell);
        }
        equilibrium.push(row);
    }
    return equilibrium;
}
async function index() {
    // setup and configure WebGPU
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    // initialize vertex buffer and textures
    const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
    const quad = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(device, "Quad Vertex Buffer", QUAD);
    const GROUP_INDEX = 0;
    const VERTEX_INDEX = 0;
    const RENDER_INDEX = 0;
    const BINDINGS_TEXTURE = {
        FORCE: 0,
        DEFORMATION: 1,
        DISTRIBUTION: 2,
    };
    const BINDINGS_BUFFER = { INTERACTION: 3, CANVAS: 4 };
    // canvas.size = { width: 64, height: 64 };
    const density = initialDensity(canvas.size.height, canvas.size.width);
    const velocity = initialVelocity(canvas.size.height, canvas.size.width);
    const equilibrium = computeEquilibrium(density, velocity);
    const deformation = initialDeformationGradient(canvas.size.height, canvas.size.width);
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, Object.values(BINDINGS_TEXTURE), {
        [BINDINGS_TEXTURE.DISTRIBUTION]: equilibrium,
        [BINDINGS_TEXTURE.DEFORMATION]: deformation,
    }, {
        depthOrArrayLayers: {
            [BINDINGS_TEXTURE.DISTRIBUTION]: 9,
            [BINDINGS_TEXTURE.FORCE]: 4,
            [BINDINGS_TEXTURE.DEFORMATION]: 4,
        },
        width: canvas.size.width,
        height: canvas.size.height,
    });
    const WORKGROUP_SIZE = 8;
    const TILE_SIZE = 2;
    const HALO_SIZE = 1;
    const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;
    const DISPATCH_SIZE = CACHE_SIZE - 2 * HALO_SIZE;
    const WORKGROUP_COUNT = [
        Math.ceil(textures.size.width / DISPATCH_SIZE),
        Math.ceil(textures.size.height / DISPATCH_SIZE),
    ];
    // setup interactions
    const interactions = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(device, canvas.context.canvas, textures.size);
    const bindGroupLayout = device.createBindGroupLayout({
        label: "bindGroupLayout",
        entries: [
            ...Object.values(BINDINGS_TEXTURE).map((binding) => ({
                binding: binding,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: textures.bindingLayout[binding],
            })),
            ...Object.values(BINDINGS_BUFFER).map((binding) => ({
                binding: binding,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" },
            })),
        ],
    });
    const bindGroup = device.createBindGroup({
        label: `Bind Group`,
        layout: bindGroupLayout,
        entries: [
            ...Object.values(BINDINGS_TEXTURE).map((binding) => ({
                binding: binding,
                resource: textures.textures[binding].createView(),
            })),
            ...Object.values(BINDINGS_BUFFER).map((binding) => ({
                binding: binding,
                resource: {
                    buffer: binding === BINDINGS_BUFFER.INTERACTION
                        ? interactions.buffer
                        : textures.canvas.buffer,
                },
            })),
        ],
    });
    const pipelineLayout = device.createPipelineLayout({
        label: "pipelineLayout",
        bindGroupLayouts: [bindGroupLayout],
    });
    // compile shaders
    const timestepShaderModule = device.createShaderModule({
        label: "timestepComputeShader",
        code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_lattice_boltzmann_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__, [_shaders_includes_cache_wgsl__WEBPACK_IMPORTED_MODULE_2__, _shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__]),
    });
    const latticeBoltzmannPipeline = device.createComputePipeline({
        label: "latticeBoltzmannPipeline",
        layout: pipelineLayout,
        compute: {
            entryPoint: "lattice_boltzmann",
            module: timestepShaderModule,
        },
    });
    const renderPipeline = device.createRenderPipeline({
        label: "renderPipeline",
        layout: pipelineLayout,
        vertex: {
            module: device.createShaderModule({
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_3__, [_shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__]),
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
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_4__, [_shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__]),
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
        computePass.setBindGroup(GROUP_INDEX, bindGroup);
        // interactions
        device.queue.writeBuffer(interactions.buffer, 0, interactions.data);
        // lattice boltzmann method
        for (let i = 0; i < 10; i++) {
            computePass.setPipeline(latticeBoltzmannPipeline);
            computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
        }
        computePass.end();
        // render pass
        const texture = canvas.context.getCurrentTexture();
        const view = texture.createView();
        renderPassDescriptor.colorAttachments[RENDER_INDEX].view = view;
        const renderPass = command.beginRenderPass(renderPassDescriptor);
        renderPass.setBindGroup(GROUP_INDEX, bindGroup);
        renderPass.setPipeline(renderPipeline);
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
/* harmony export */   prependIncludes: () => (/* binding */ prependIncludes),
/* harmony export */   requestDevice: () => (/* binding */ requestDevice),
/* harmony export */   setupInteractions: () => (/* binding */ setupInteractions),
/* harmony export */   setupTextures: () => (/* binding */ setupTextures),
/* harmony export */   setupVertexBuffer: () => (/* binding */ setupVertexBuffer)
/* harmony export */ });
function throwDetectionError(error) {
    document.querySelector(".webgpu-not-supported").style.visibility = "visible";
    throw new Error("Could not initialize WebGPU: " + error);
}
async function requestDevice(options = {
    powerPreference: "high-performance",
}, requiredFeatures = [], requiredLimits = {
    maxStorageTexturesPerShaderStage: 4,
    maxComputeWorkgroupStorageSize: 17408, // not mobile-friendly
}) {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter(options);
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    return adapter.requestDevice({
        requiredFeatures: requiredFeatures,
        requiredLimits: requiredLimits,
    });
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
function setupTextures(device, bindings, data, size) {
    const FORMAT = "r32float";
    const CHANNELS = channelCount(FORMAT);
    const textures = {};
    const bindingLayout = {};
    const depthOrArrayLayers = size.depthOrArrayLayers || {};
    bindings.forEach((key) => {
        textures[key] = device.createTexture({
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
            format: FORMAT,
            size: {
                width: size.width,
                height: size.height,
                depthOrArrayLayers: key in depthOrArrayLayers ? depthOrArrayLayers[key] : 1,
            },
        });
    });
    Object.keys(textures).forEach((key) => {
        const layers = key in depthOrArrayLayers ? depthOrArrayLayers[parseInt(key)] : 1;
        bindingLayout[parseInt(key)] = {
            format: FORMAT,
            access: "read-write",
            viewDimension: layers > 1 ? "2d-array" : "2d",
        };
        const array = key in data
            ? new Float32Array(flatten(data[parseInt(key)]))
            : new Float32Array(flatten(zeros(size.height, size.width, layers)));
        device.queue.writeTexture({ texture: textures[parseInt(key)] }, 
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
        });
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
        bindingLayout: bindingLayout,
        size: size,
    };
}
function flatten(nestedArray) {
    const flattened = [];
    for (let k = 0; k < nestedArray[0][0].length; k++) {
        for (let i = 0; i < nestedArray.length; i++) {
            for (let j = 0; j < nestedArray[0].length; j++) {
                flattened.push(nestedArray[i][j][k]);
            }
        }
    }
    return flattened;
}
function zeros(height, width, layers = 1) {
    const zeroArray = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            const layer = [];
            for (let k = 0; k < layers; k++) {
                layer.push(0);
            }
            row.push(layer);
        }
        zeroArray.push(row);
    }
    return zeroArray;
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
function prependIncludes(code, includes) {
    code = code.replace(/^#import.*/gm, "");
    return includes.reduce((acc, include) => include + "\n" + acc, code);
}



/***/ }),

/***/ "./src/shaders/cell.frag.wgsl":
/*!************************************!*\
  !*** ./src/shaders/cell.frag.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\nconst EPS = 1e-37;\nconst lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));\n\n@group(GROUP_INDEX) @binding(DISTRIBUTION) var distribution: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEFORMATION) var deformation: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\nfn get_velocity(x: vec2<i32>) -> vec4<f32> {\n\n    var density = 0.0;\n    var momentum = vec2<f32>(0.0, 0.0);\n\n    for (var i = 0; i < 9; i++) {\n        let f = textureLoad(distribution, x, i).r;\n\n        density += f;\n        momentum += f * vec2<f32>(lattice_vector[i]);\n    }\n\n    let velocity = momentum / max(density, EPS);\n\n    let angle = atan2(velocity.x, velocity.y);\n    let norm = length(velocity);\n\n    // rainbow along the angle\n    return vec4<f32>(\n        0.5 + 0.5 * cos(angle + 0.0),\n        0.5 + 0.5 * cos(angle + 2.094),\n        0.5 + 0.5 * cos(angle + 4.188),\n        100.0 * norm\n    );\n}\n\nfn get_deformation_gradient(x: vec2<i32>) -> vec2<f32> {\n    return vec2<f32>(textureLoad(deformation, x, 0).r, textureLoad(deformation, x, 1).r);\n}\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    let deformation_gradient = get_deformation_gradient(x)/ vec2<f32>(canvas.size);\n\n    output.color.r = deformation_gradient.x;\n    output.color.g = deformation_gradient.y;\n    \n    output.color.a = 1.0;\n    return output;\n} ";

/***/ }),

/***/ "./src/shaders/cell.vert.wgsl":
/*!************************************!*\
  !*** ./src/shaders/cell.vert.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n\nstruct Input {\n    @builtin(instance_index) instance: u32,\n    @location(VERTEX_INDEX) position: vec2<f32>,\n};\n\nstruct Output {\n    @builtin(position) position: vec4<f32>,\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\n@vertex\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    output.position.x = input.position.x;\n    output.position.y = -input.position.y;\n\n    output.position.z = 0.0;\n    output.position.w = 1.0;\n\n    output.coordinate = input.position;\n    return output;\n}";

/***/ }),

/***/ "./src/shaders/includes/bindings.wgsl":
/*!********************************************!*\
  !*** ./src/shaders/includes/bindings.wgsl ***!
  \********************************************/
/***/ ((module) => {

module.exports = "// enable f16;\n\nconst GROUP_INDEX = 0;\nconst VERTEX_INDEX = 0;\nconst RENDER_INDEX = 0;\n\nconst FORCE = 0u;\nconst DEFORMATION = 1u;\nconst DISTRIBUTION = 2u;\n\nconst INTERACTION = 3;\nconst CANVAS = 4;";

/***/ }),

/***/ "./src/shaders/includes/cache.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/includes/cache.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n}\n\n;\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n}\n\n;\n\nstruct IndexFloat {\n    global: vec2<f32>,\n    local: vec2<f32>,\n}\n\n;\n\nstruct Canvas {\n    size: vec2<u32>,\n    frame_index: u32,\n}\n\n;\n\nfn indexf(index: Index) -> IndexFloat {\n    return IndexFloat(vec2<f32>(index.global), vec2<f32>(index.local));\n}\n\nfn add(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global + y, x.local + y);\n}\n\nfn addf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global + y, x.local + y);\n}\n\nfn sub(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global - y, x.local - y);\n}\n\nfn subf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global - y, x.local - y);\n}\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 8u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS)\nvar<uniform> canvas: Canvas;\n\nvar<workgroup> cache_f32: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 1>;\nvar<workgroup> cache_vec4: array<f32, CACHE_SIZE * CACHE_SIZE * 8>;\nvar<workgroup> cache_vec9: array<f32, CACHE_SIZE * CACHE_SIZE * 9>;\n\nfn load_cache_f32(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            cache_f32[idx][index.local.x][index.local.y] = load_value(F, index.global);\n        }\n    }\n}\n\nfn load_cache_vec4(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            for (var i = 0; i < 4; i++) {\n\n                let cache_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + u32(i) + (index.local.x * 4u) + (index.local.y * CACHE_SIZE * 4u);\n                cache_vec4[cache_idx] = load_component_value(F, index.global, i);\n            }\n        }\n    }\n}\n\nfn load_cache_vec9(id: Invocation, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            for (var i = 0; i < 9; i++) {\n\n                let idx = u32(i) + (index.local.x * 9u) + (index.local.y * CACHE_SIZE * 9u);\n                cache_vec9[idx] = load_component_value(F, index.global, i);\n            }\n        }\n    }\n}\n\nfn cached_value_f32(idx: u32, x: vec2<u32>) -> f32 {\n    return cache_f32[idx][x.x][x.y];\n}\n\nfn cached_value_vec4(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    let base_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + (x.x * 4u) + (x.y * CACHE_SIZE * 4u);\n    return vec4<f32>(cache_vec4[base_idx + 0u], cache_vec4[base_idx + 1u], cache_vec4[base_idx + 2u], cache_vec4[base_idx + 3u]);\n}\n\nfn cached_value_vec9(x: vec2<u32>) -> array<f32, 9> {\n    var vec9: array<f32, 9>;\n    for (var i = 0; i < 9; i++) {\n\n        let idx = u32(i) + (x.x * 9u) + (x.y * CACHE_SIZE * 9u);\n        vec9[i] = cache_vec9[idx];\n    }\n    return vec9;\n}\n\nfn as_r32float(r: f32) -> vec4<f32> {\n    return vec4<f32>(f32(r), 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> f32 {\n    let y = x + canvas.size;\n    return f32(textureLoad(F, vec2<i32>(y % canvas.size)).r);\n}\n\nfn load_component_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>, component: i32) -> f32 {\n    let y = x + canvas.size;\n    return f32(textureLoad(F, vec2<i32>(y % canvas.size), component).r);\n}\n\nfn store_value(F: texture_storage_2d<r32float, read_write>, index: Index, value: f32) {\n    let y = index.global + canvas.size;\n    textureStore(F, vec2<i32>(y % canvas.size), as_r32float(value));\n}\n\nfn store_component_value(F: texture_storage_2d_array<r32float, read_write>, index: Index, component: i32, value: f32) {\n    let y = index.global + canvas.size;\n    textureStore(F, vec2<i32>(y % canvas.size), component, as_r32float(value));\n}\n\nfn check_bounds(index: Index) -> bool {\n    return (0u < index.local.x) && (index.local.x <= DISPATCH_SIZE) && (0u < index.local.y) && (index.local.y <= DISPATCH_SIZE);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/lattice-boltzmann.comp.wgsl":
/*!*************************************************!*\
  !*** ./src/shaders/lattice-boltzmann.comp.wgsl ***!
  \*************************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nconst EPS = 1e-37;\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));\nconst lattice_weight = array<f32, 9>(4.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0);\n\n@group(GROUP_INDEX) @binding(DISTRIBUTION)\nvar distribution: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(DEFORMATION)\nvar deformation: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(FORCE)\nvar force: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(INTERACTION)\nvar<uniform> interaction: Interaction;\n\nfn load_macroscopics_cache(id: Invocation) {\n    load_cache_vec4(id, 0u, deformation);\n    load_cache_vec4(id, 1u, force);\n}\n\nfn get_deformation_gradient(index: Index) -> vec4<f32> {\n    return cached_value_vec4(0u, index.local);\n}\n\nfn _get_deformation_gradient(x: vec2<u32>) -> vec4<f32> {\n    return cached_value_vec4(0u, x);\n}\n\nfn get_force(index: Index) -> vec4<f32> {\n    return cached_value_vec4(1u, index.local);\n}\n\nfn load_distribution_cache(id: Invocation) {\n    load_cache_vec9(id, distribution);\n}\n\nfn get_distribution(index: Index) -> array<f32, 9> {\n    return cached_value_vec9(index.local);\n}\n\nfn get_force_distribution(index: Index, v: vec2<f32>) -> array<f32, 9> {\n    let F = get_force(index);\n\n    return array<f32, 9>(\n        1.0 * lattice_weight[0] * (-v.x * F.x - v.y * F.y),\n        3.0 * lattice_weight[1] * ((2.0 * v.x + 1.0) * F.x - v.y * F.y),\n        3.0 * lattice_weight[2] * (-v.x * (2.0 * v.y + 1.0) * F.y),\n        3.0 * lattice_weight[3] * ((2.0 * v.x - 1.0) * F.x - v.y * F.y),\n        3.0 * lattice_weight[4] * (-v.x * (2.0 * v.y - 1.0) * F.y),\n        3.0 * lattice_weight[5] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y + 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[6] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y + 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[7] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y - 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[8] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y - 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x))\n    );\n}\n\nfn advect_deformation_gradient(index: Index) -> vec4<f32> {\n    const max_norm = f32(HALO_SIZE);\n\n    // compute velocity\n    var density = 0.0;\n    var momentum = vec2<f32>(0.0, 0.0);\n    \n    var f: array<f32, 9>;\n    for (var i = 0u; i < 9u; i++) {\n\n        let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));\n        f[i] = get_distribution(y)[i];\n\n        density += f[i];\n        momentum += f[i] * vec2<f32>(lattice_vector[i]);\n    }\n\n    let velocity = momentum / max(density, EPS);\n    let norm = length(velocity);\n\n    let y = subf(indexf(index), (velocity / max(norm, EPS)) * min(norm, max_norm));\n    return get_deformation_gradient_interpolate(y);\n}\n\nfn get_deformation_gradient_interpolate(index: IndexFloat) -> vec4<f32> {\n    let x = index.local;\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            _get_deformation_gradient(y),\n            _get_deformation_gradient(y + dx),\n            fraction.x\n        ),\n        mix(\n            _get_deformation_gradient(y + dy),\n            _get_deformation_gradient(y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn lattice_boltzmann(id: Invocation) {\n    let relaxation_frequency = 1.8; // between 0.0 and 2.0\n\n    load_macroscopics_cache(id);\n    load_distribution_cache(id);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let x = vec2<f32>(index.global);\n                let y = interaction.position + sign(interaction.size);\n\n                let dims = vec2<f32>(canvas.size);\n                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));\n\n                var force_update = vec4<f32>(0.0, 0.0, 0.0, 0.0);\n                if distance < abs(interaction.size) {\n                    force_update += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));\n                }\n                let deformation_gradient_update = advect_deformation_gradient(index);\n\n                for (var i = 0; i < 3; i++) {\n                    store_component_value(deformation, index, i, deformation_gradient_update[i]);\n                    store_component_value(force, index, i, force_update[i]);\n                }\n            }\n        }\n    }\n\n    load_distribution_cache(id);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // read distribution from neighbors\n                var density = 0.0;\n                var momentum = vec2<f32>(0.0, 0.0);\n                \n                var f: array<f32, 9>;\n                for (var i = 0; i < 9; i++) {\n\n                    let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));\n                    f[i] = get_distribution(y)[i];\n\n                    density += f[i];\n                    momentum += f[i] * vec2<f32>(lattice_vector[i]);\n                }\n\n                // include external forces\n                let velocity = momentum / max(density, EPS);\n                let speed = length(velocity);\n\n                let F = get_force_distribution(index, velocity);\n                for (var i = 0; i < 9; i++) {\n\n                    // compute distribution equilibrium\n                    let lattice_speed = dot(velocity, vec2<f32>(lattice_vector[i]));\n                    let equilibrium = lattice_weight[i] * density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);\n                \n                    // BGK collision\n                    let distribution_update = (1.0 - relaxation_frequency) * f[i] + relaxation_frequency * equilibrium + (1.0 - relaxation_frequency / 2.0) * F[i];\n                    store_component_value(distribution, index, i, distribution_update);\n                }\n            }\n        }\n    }\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LENBQUM7SUFDeEMsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQVNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0cHJlcGVuZEluY2x1ZGVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgYmluZGluZ3MgZnJvbSBcIi4vc2hhZGVycy9pbmNsdWRlcy9iaW5kaW5ncy53Z3NsXCI7XG5pbXBvcnQgY2FjaGVVdGlscyBmcm9tIFwiLi9zaGFkZXJzL2luY2x1ZGVzL2NhY2hlLndnc2xcIjtcblxuaW1wb3J0IGNlbGxWZXJ0ZXhTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLnZlcnQud2dzbFwiO1xuaW1wb3J0IGNlbGxGcmFnbWVudFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwuZnJhZy53Z3NsXCI7XG5pbXBvcnQgdGltZXN0ZXBDb21wdXRlU2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvbGF0dGljZS1ib2x0em1hbm4uY29tcC53Z3NsXCI7XG5cbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDE7XG5sZXQgZnJhbWVfaW5kZXggPSAwO1xuXG5jb25zdCBsYXR0aWNlX3ZlY3RvciA9IFtcblx0WzAsIDBdLFxuXHRbMSwgMF0sXG5cdFswLCAxXSxcblx0Wy0xLCAwXSxcblx0WzAsIC0xXSxcblx0WzEsIDFdLFxuXHRbLTEsIDFdLFxuXHRbLTEsIC0xXSxcblx0WzEsIC0xXSxcbl07XG5jb25zdCBsYXR0aWNlX3dlaWdodCA9IFtcblx0NC4wIC8gOS4wLFxuXHQxLjAgLyA5LjAsXG5cdDEuMCAvIDkuMCxcblx0MS4wIC8gOS4wLFxuXHQxLjAgLyA5LjAsXG5cdDEuMCAvIDM2LjAsXG5cdDEuMCAvIDM2LjAsXG5cdDEuMCAvIDM2LjAsXG5cdDEuMCAvIDM2LjAsXG5dO1xuXG5mdW5jdGlvbiBpbml0aWFsRGVuc2l0eShoZWlnaHQ6IG51bWJlciwgd2lkdGg6IG51bWJlcikge1xuXHRjb25zdCBkZW5zaXR5ID0gW107XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcblx0XHRjb25zdCByb3cgPSBbXTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcblx0XHRcdGNvbnN0IGNlbnRlclggPSB3aWR0aCAvIDI7XG5cdFx0XHRjb25zdCBjZW50ZXJZID0gaGVpZ2h0IC8gMjtcblx0XHRcdGNvbnN0IGR4ID0gaiAtIGNlbnRlclg7XG5cdFx0XHRjb25zdCBkeSA9IGkgLSBjZW50ZXJZO1xuXHRcdFx0Y29uc3QgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXHRcdFx0Y29uc3Qgc2lnbWEgPSAxMDtcblx0XHRcdGNvbnN0IHJobyA9IE1hdGguZXhwKCgtZGlzdGFuY2UgKiBkaXN0YW5jZSkgLyAoMiAqIHNpZ21hICogc2lnbWEpKTtcblxuXHRcdFx0cm93LnB1c2goWzFdKTtcblx0XHR9XG5cdFx0ZGVuc2l0eS5wdXNoKHJvdyk7XG5cdH1cblx0cmV0dXJuIGRlbnNpdHk7XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxWZWxvY2l0eShoZWlnaHQ6IG51bWJlciwgd2lkdGg6IG51bWJlcikge1xuXHQvLyBDcmVhdGUgZW1wdHkgbmVzdGVkIGFycmF5IHN0cnVjdHVyZVxuXHRjb25zdCB2ZWxvY2l0eUZpZWxkID0gW107XG5cblx0Ly8gRmlsbCB3aXRoIHZlbG9jaXR5IGNvbXBvbmVudHNcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBoZWlnaHQ7IGkrKykge1xuXHRcdGNvbnN0IHJvdyA9IFtdO1xuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgd2lkdGg7IGorKykge1xuXHRcdFx0Ly8gRm9yIGVhY2ggY2VsbCwgc3RvcmUgW3Z4LCB2eV0gY29tcG9uZW50c1xuXHRcdFx0Ly8gQ3JlYXRlIGEgc2ltcGxlIGNpcmN1bGFyIGZsb3cgcGF0dGVybiBhcyBhbiBleGFtcGxlXG5cdFx0XHQvLyBjb25zdCBjZW50ZXJYID0gd2lkdGggLyAyO1xuXHRcdFx0Ly8gY29uc3QgY2VudGVyWSA9IGhlaWdodCAvIDI7XG5cdFx0XHQvLyBjb25zdCBkeCA9IGogLSBjZW50ZXJYO1xuXHRcdFx0Ly8gY29uc3QgZHkgPSBpIC0gY2VudGVyWTtcblx0XHRcdC8vIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuXHRcdFx0Ly8gLy8gQ3JlYXRlIGNpcmN1bGFyIHZlbG9jaXR5IGZpZWxkXG5cdFx0XHQvLyBjb25zdCBzaWdtYSA9IDUwO1xuXHRcdFx0Ly8gdmFyIHJobyA9IE1hdGguZXhwKCgtZGlzdGFuY2UgKiBkaXN0YW5jZSkgLyAoMiAqIHNpZ21hICogc2lnbWEpKTtcblxuXHRcdFx0Ly8gcmhvID0gcmhvICogTWF0aC5leHAoKC0oZGlzdGFuY2UgLSA1MCkgKiAoZGlzdGFuY2UgLSA1MCkpIC8gMjAwKTtcblx0XHRcdC8vIGNvbnN0IHZ4ID0gKGR5IC8gZGlzdGFuY2UpICogcmhvO1xuXHRcdFx0Ly8gY29uc3QgdnkgPSAoZHggLyBkaXN0YW5jZSkgKiByaG87XG5cblx0XHRcdC8vIHJhbmRvbSB2ZWxvY2l0eVxuXHRcdFx0Y29uc3QgdnggPSBNYXRoLnJhbmRvbSgpICogMiAtIDE7IC8vIFJhbmRvbSB2YWx1ZSBiZXR3ZWVuIC0xIGFuZCAxXG5cdFx0XHRjb25zdCB2eSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTsgLy8gUmFuZG9tIHZhbHVlIGJldHdlZW4gLTEgYW5kIDFcblxuXHRcdFx0cm93LnB1c2goW3Z4IC8gMTAsIHZ5IC8gMTBdKTtcblx0XHR9XG5cdFx0dmVsb2NpdHlGaWVsZC5wdXNoKHJvdyk7XG5cdH1cblxuXHRyZXR1cm4gdmVsb2NpdHlGaWVsZDtcbn1cblxuZnVuY3Rpb24gaW5pdGlhbERlZm9ybWF0aW9uR3JhZGllbnQoaGVpZ2h0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpIHtcblx0Y29uc3QgZGVmb3JtYXRpb24gPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBoZWlnaHQ7IGkrKykge1xuXHRcdGNvbnN0IHJvdyA9IFtdO1xuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgd2lkdGg7IGorKykge1xuXHRcdFx0cm93LnB1c2goW2osIGksIDAsIDBdKTtcblx0XHR9XG5cdFx0ZGVmb3JtYXRpb24ucHVzaChyb3cpO1xuXHR9XG5cdHJldHVybiBkZWZvcm1hdGlvbjtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVxdWlsaWJyaXVtKGRlbnNpdHk6IG51bWJlcltdW11bXSwgdmVsb2NpdHk6IG51bWJlcltdW11bXSkge1xuXHRjb25zdCBlcXVpbGlicml1bSA9IFtdO1xuXHRjb25zdCBoZWlnaHQgPSBkZW5zaXR5Lmxlbmd0aDtcblx0Y29uc3Qgd2lkdGggPSBkZW5zaXR5WzBdLmxlbmd0aDtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBoZWlnaHQ7IGkrKykge1xuXHRcdGNvbnN0IHJvdyA9IFtdO1xuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgd2lkdGg7IGorKykge1xuXHRcdFx0Y29uc3QgY2VsbCA9IFtdO1xuXHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCA5OyBrKyspIHtcblx0XHRcdFx0Y29uc3Qgc3BlZWQgPSBNYXRoLnNxcnQoXG5cdFx0XHRcdFx0dmVsb2NpdHlbaV1bal1bMF0gKiB2ZWxvY2l0eVtpXVtqXVswXSArXG5cdFx0XHRcdFx0XHR2ZWxvY2l0eVtpXVtqXVsxXSAqIHZlbG9jaXR5W2ldW2pdWzFdXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGNvbnN0IGxhdHRpY2Vfc3BlZWQgPVxuXHRcdFx0XHRcdGxhdHRpY2VfdmVjdG9yW2tdWzBdICogdmVsb2NpdHlbaV1bal1bMF0gK1xuXHRcdFx0XHRcdGxhdHRpY2VfdmVjdG9yW2tdWzFdICogdmVsb2NpdHlbaV1bal1bMV07XG5cblx0XHRcdFx0Y29uc3QgZl9lcSA9XG5cdFx0XHRcdFx0bGF0dGljZV93ZWlnaHRba10gKlxuXHRcdFx0XHRcdGRlbnNpdHlbaV1bal1bMF0gKlxuXHRcdFx0XHRcdCgxLjAgK1xuXHRcdFx0XHRcdFx0My4wICogbGF0dGljZV9zcGVlZCArXG5cdFx0XHRcdFx0XHQ0LjUgKiBsYXR0aWNlX3NwZWVkICogbGF0dGljZV9zcGVlZCAtXG5cdFx0XHRcdFx0XHQxLjUgKiBzcGVlZCAqIHNwZWVkKTtcblxuXHRcdFx0XHRjZWxsLnB1c2goZl9lcSk7XG5cdFx0XHR9XG5cdFx0XHRyb3cucHVzaChjZWxsKTtcblx0XHR9XG5cdFx0ZXF1aWxpYnJpdW0ucHVzaChyb3cpO1xuXHR9XG5cdHJldHVybiBlcXVpbGlicml1bTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblxuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cblx0Y29uc3QgQklORElOR1NfVEVYVFVSRSA9IHtcblx0XHRGT1JDRTogMCxcblx0XHRERUZPUk1BVElPTjogMSxcblx0XHRESVNUUklCVVRJT046IDIsXG5cdH07XG5cdGNvbnN0IEJJTkRJTkdTX0JVRkZFUiA9IHsgSU5URVJBQ1RJT046IDMsIENBTlZBUzogNCB9O1xuXHQvLyBjYW52YXMuc2l6ZSA9IHsgd2lkdGg6IDY0LCBoZWlnaHQ6IDY0IH07XG5cblx0Y29uc3QgZGVuc2l0eSA9IGluaXRpYWxEZW5zaXR5KGNhbnZhcy5zaXplLmhlaWdodCwgY2FudmFzLnNpemUud2lkdGgpO1xuXHRjb25zdCB2ZWxvY2l0eSA9IGluaXRpYWxWZWxvY2l0eShjYW52YXMuc2l6ZS5oZWlnaHQsIGNhbnZhcy5zaXplLndpZHRoKTtcblx0Y29uc3QgZXF1aWxpYnJpdW0gPSBjb21wdXRlRXF1aWxpYnJpdW0oZGVuc2l0eSwgdmVsb2NpdHkpO1xuXHRjb25zdCBkZWZvcm1hdGlvbiA9IGluaXRpYWxEZWZvcm1hdGlvbkdyYWRpZW50KFxuXHRcdGNhbnZhcy5zaXplLmhlaWdodCxcblx0XHRjYW52YXMuc2l6ZS53aWR0aFxuXHQpO1xuXG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhcblx0XHRkZXZpY2UsXG5cdFx0T2JqZWN0LnZhbHVlcyhCSU5ESU5HU19URVhUVVJFKSxcblx0XHR7XG5cdFx0XHRbQklORElOR1NfVEVYVFVSRS5ESVNUUklCVVRJT05dOiBlcXVpbGlicml1bSxcblx0XHRcdFtCSU5ESU5HU19URVhUVVJFLkRFRk9STUFUSU9OXTogZGVmb3JtYXRpb24sXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRkZXB0aE9yQXJyYXlMYXllcnM6IHtcblx0XHRcdFx0W0JJTkRJTkdTX1RFWFRVUkUuRElTVFJJQlVUSU9OXTogOSxcblx0XHRcdFx0W0JJTkRJTkdTX1RFWFRVUkUuRk9SQ0VdOiA0LFxuXHRcdFx0XHRbQklORElOR1NfVEVYVFVSRS5ERUZPUk1BVElPTl06IDQsXG5cdFx0XHR9LFxuXHRcdFx0d2lkdGg6IGNhbnZhcy5zaXplLndpZHRoLFxuXHRcdFx0aGVpZ2h0OiBjYW52YXMuc2l6ZS5oZWlnaHQsXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnN0IFdPUktHUk9VUF9TSVpFID0gODtcblx0Y29uc3QgVElMRV9TSVpFID0gMjtcblx0Y29uc3QgSEFMT19TSVpFID0gMTtcblxuXHRjb25zdCBDQUNIRV9TSVpFID0gVElMRV9TSVpFICogV09SS0dST1VQX1NJWkU7XG5cdGNvbnN0IERJU1BBVENIX1NJWkUgPSBDQUNIRV9TSVpFIC0gMiAqIEhBTE9fU0laRTtcblxuXHRjb25zdCBXT1JLR1JPVVBfQ09VTlQ6IFtudW1iZXIsIG51bWJlcl0gPSBbXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUud2lkdGggLyBESVNQQVRDSF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBESVNQQVRDSF9TSVpFKSxcblx0XTtcblxuXHQvLyBzZXR1cCBpbnRlcmFjdGlvbnNcblx0Y29uc3QgaW50ZXJhY3Rpb25zID0gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdFx0ZGV2aWNlLFxuXHRcdGNhbnZhcy5jb250ZXh0LmNhbnZhcyxcblx0XHR0ZXh0dXJlcy5zaXplXG5cdCk7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0Li4uT2JqZWN0LnZhbHVlcyhCSU5ESU5HU19URVhUVVJFKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHRleHR1cmVzLmJpbmRpbmdMYXlvdXRbYmluZGluZ10sXG5cdFx0XHR9KSksXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX0JVRkZFUikubWFwKChiaW5kaW5nKSA9PiAoe1xuXHRcdFx0XHRiaW5kaW5nOiBiaW5kaW5nLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjogeyB0eXBlOiBcInVuaWZvcm1cIiBhcyBHUFVCdWZmZXJCaW5kaW5nVHlwZSB9LFxuXHRcdFx0fSkpLFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IGJpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuXHRcdGxhYmVsOiBgQmluZCBHcm91cGAsXG5cdFx0bGF5b3V0OiBiaW5kR3JvdXBMYXlvdXQsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0Li4uT2JqZWN0LnZhbHVlcyhCSU5ESU5HU19URVhUVVJFKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tiaW5kaW5nXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9KSksXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX0JVRkZFUikubWFwKChiaW5kaW5nKSA9PiAoe1xuXHRcdFx0XHRiaW5kaW5nOiBiaW5kaW5nLFxuXHRcdFx0XHRyZXNvdXJjZToge1xuXHRcdFx0XHRcdGJ1ZmZlcjpcblx0XHRcdFx0XHRcdGJpbmRpbmcgPT09IEJJTkRJTkdTX0JVRkZFUi5JTlRFUkFDVElPTlxuXHRcdFx0XHRcdFx0XHQ/IGludGVyYWN0aW9ucy5idWZmZXJcblx0XHRcdFx0XHRcdFx0OiB0ZXh0dXJlcy5jYW52YXMuYnVmZmVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSkpLFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgdGltZXN0ZXBTaGFkZXJNb2R1bGUgPSBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXModGltZXN0ZXBDb21wdXRlU2hhZGVyLCBbY2FjaGVVdGlscywgYmluZGluZ3NdKSxcblx0fSk7XG5cblx0Y29uc3QgbGF0dGljZUJvbHR6bWFublBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwibGF0dGljZUJvbHR6bWFublBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRlbnRyeVBvaW50OiBcImxhdHRpY2VfYm9sdHptYW5uXCIsXG5cdFx0XHRtb2R1bGU6IHRpbWVzdGVwU2hhZGVyTW9kdWxlLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IHJlbmRlclBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZVJlbmRlclBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJyZW5kZXJQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0dmVydGV4OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoY2VsbFZlcnRleFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIFtiaW5kaW5nc10pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBjYW52YXMuZm9ybWF0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXG5cdFx0e1xuXHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRsb2FkT3A6IFwibG9hZFwiLFxuXHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdH0sXG5cdF07XG5cdGNvbnN0IHJlbmRlclBhc3NEZXNjcmlwdG9yID0ge1xuXHRcdGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMsXG5cdH07XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcblxuXHRcdC8vIGNvbXB1dGUgcGFzc1xuXHRcdGNvbnN0IGNvbXB1dGVQYXNzID0gY29tbWFuZC5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXG5cdFx0Ly8gaW50ZXJhY3Rpb25zXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGludGVyYWN0aW9ucy5idWZmZXIsIDAsIGludGVyYWN0aW9ucy5kYXRhKTtcblxuXHRcdC8vIGxhdHRpY2UgYm9sdHptYW5uIG1ldGhvZFxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUobGF0dGljZUJvbHR6bWFublBpcGVsaW5lKTtcblx0XHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXHRcdH1cblxuXHRcdGNvbXB1dGVQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gcmVuZGVyIHBhc3Ncblx0XHRjb25zdCB0ZXh0dXJlID0gY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKTtcblx0XHRjb25zdCB2aWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KCk7XG5cblx0XHRyZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzW1JFTkRFUl9JTkRFWF0udmlldyA9IHZpZXc7XG5cdFx0Y29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmQuYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcblx0XHRyZW5kZXJQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3VwKTtcblxuXHRcdHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlclBhc3Muc2V0VmVydGV4QnVmZmVyKFZFUlRFWF9JTkRFWCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXG5cdFx0cmVuZGVyUGFzcy5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlclBhc3MuZW5kKCk7XG5cblx0XHQvLyBzdWJtaXQgdGhlIGNvbW1hbmQgYnVmZmVyXG5cdFx0ZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZC5maW5pc2goKV0pO1xuXHRcdHRleHR1cmUuZGVzdHJveSgpO1xuXHRcdGZyYW1lX2luZGV4Kys7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZW5kZXIsIFVQREFURV9JTlRFUlZBTCk7XG5cdHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsImZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG5cdG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHtcblx0XHRwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiLFxuXHR9LFxuXHRyZXF1aXJlZEZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW10sXG5cdHJlcXVpcmVkTGltaXRzOiBSZWNvcmQ8c3RyaW5nLCB1bmRlZmluZWQgfCBudW1iZXI+ID0ge1xuXHRcdG1heFN0b3JhZ2VUZXh0dXJlc1BlclNoYWRlclN0YWdlOiA0LFxuXHRcdG1heENvbXB1dGVXb3JrZ3JvdXBTdG9yYWdlU2l6ZTogMTc0MDgsIC8vIG5vdCBtb2JpbGUtZnJpZW5kbHlcblx0fVxuKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIob3B0aW9ucyk7XG5cdGlmICghYWRhcHRlcikgdGhyb3dEZXRlY3Rpb25FcnJvcihcIk5vIEdQVSBhZGFwdGVyIGZvdW5kXCIpO1xuXG5cdHJldHVybiBhZGFwdGVyLnJlcXVlc3REZXZpY2Uoe1xuXHRcdHJlcXVpcmVkRmVhdHVyZXM6IHJlcXVpcmVkRmVhdHVyZXMsXG5cdFx0cmVxdWlyZWRMaW1pdHM6IHJlcXVpcmVkTGltaXRzLFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0dmVydGV4QnVmZmVyLFxuXHRcdC8qYnVmZmVyT2Zmc2V0PSovIDAsXG5cdFx0LypkYXRhPSovIGFycmF5XG5cdCk7XG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVGV4dHVyZXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRiaW5kaW5nczogbnVtYmVyW10sXG5cdGRhdGE6IHsgW2tleTogbnVtYmVyXTogbnVtYmVyW11bXVtdIH0sXG5cdHNpemU6IHtcblx0XHRkZXB0aE9yQXJyYXlMYXllcnM/OiB7IFtrZXk6IG51bWJlcl06IG51bWJlciB9O1xuXHRcdHdpZHRoOiBudW1iZXI7XG5cdFx0aGVpZ2h0OiBudW1iZXI7XG5cdH1cbik6IHtcblx0Y2FudmFzOiB7XG5cdFx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdFx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdFx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG5cdH07XG5cdHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfTtcblx0YmluZGluZ0xheW91dDogeyBba2V5OiBudW1iZXJdOiBHUFVTdG9yYWdlVGV4dHVyZUJpbmRpbmdMYXlvdXQgfTtcblx0c2l6ZToge1xuXHRcdGRlcHRoT3JBcnJheUxheWVycz86IHsgW2tleTogbnVtYmVyXTogbnVtYmVyIH07XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fTtcbn0ge1xuXHRjb25zdCBGT1JNQVQgPSBcInIzMmZsb2F0XCI7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KEZPUk1BVCk7XG5cblx0Y29uc3QgdGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9ID0ge307XG5cdGNvbnN0IGJpbmRpbmdMYXlvdXQ6IHsgW2tleTogbnVtYmVyXTogR1BVU3RvcmFnZVRleHR1cmVCaW5kaW5nTGF5b3V0IH0gPSB7fTtcblx0Y29uc3QgZGVwdGhPckFycmF5TGF5ZXJzID0gc2l6ZS5kZXB0aE9yQXJyYXlMYXllcnMgfHwge307XG5cblx0YmluZGluZ3MuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0dGV4dHVyZXNba2V5XSA9IGRldmljZS5jcmVhdGVUZXh0dXJlKHtcblx0XHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHRcdFx0Zm9ybWF0OiBGT1JNQVQsXG5cdFx0XHRzaXplOiB7XG5cdFx0XHRcdHdpZHRoOiBzaXplLndpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IHNpemUuaGVpZ2h0LFxuXHRcdFx0XHRkZXB0aE9yQXJyYXlMYXllcnM6XG5cdFx0XHRcdFx0a2V5IGluIGRlcHRoT3JBcnJheUxheWVycyA/IGRlcHRoT3JBcnJheUxheWVyc1trZXldIDogMSxcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0pO1xuXG5cdE9iamVjdC5rZXlzKHRleHR1cmVzKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRjb25zdCBsYXllcnMgPVxuXHRcdFx0a2V5IGluIGRlcHRoT3JBcnJheUxheWVycyA/IGRlcHRoT3JBcnJheUxheWVyc1twYXJzZUludChrZXkpXSA6IDE7XG5cblx0XHRiaW5kaW5nTGF5b3V0W3BhcnNlSW50KGtleSldID0ge1xuXHRcdFx0Zm9ybWF0OiBGT1JNQVQsXG5cdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0dmlld0RpbWVuc2lvbjogbGF5ZXJzID4gMSA/IFwiMmQtYXJyYXlcIiA6IFwiMmRcIixcblx0XHR9O1xuXG5cdFx0Y29uc3QgYXJyYXkgPVxuXHRcdFx0a2V5IGluIGRhdGFcblx0XHRcdFx0PyBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW4oZGF0YVtwYXJzZUludChrZXkpXSkpXG5cdFx0XHRcdDogbmV3IEZsb2F0MzJBcnJheShcblx0XHRcdFx0XHRcdGZsYXR0ZW4oemVyb3Moc2l6ZS5oZWlnaHQsIHNpemUud2lkdGgsIGxheWVycykpXG5cdFx0XHRcdCAgKTtcblxuXHRcdGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG5cdFx0XHR7IHRleHR1cmU6IHRleHR1cmVzW3BhcnNlSW50KGtleSldIH0sXG5cdFx0XHQvKmRhdGE9Ki8gYXJyYXksXG5cdFx0XHQvKmRhdGFMYXlvdXQ9Ki8ge1xuXHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdGJ5dGVzUGVyUm93OiBzaXplLndpZHRoICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiBDSEFOTkVMUyxcblx0XHRcdFx0cm93c1BlckltYWdlOiBzaXplLmhlaWdodCxcblx0XHRcdH0sXG5cdFx0XHQvKnNpemU9Ki8ge1xuXHRcdFx0XHR3aWR0aDogc2l6ZS53aWR0aCxcblx0XHRcdFx0aGVpZ2h0OiBzaXplLmhlaWdodCxcblx0XHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOiBsYXllcnMsXG5cdFx0XHR9XG5cdFx0KTtcblx0fSk7XG5cblx0bGV0IGNhbnZhc0RhdGEgPSBuZXcgVWludDMyQXJyYXkoW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0LCAwLCAwXSk7XG5cdGNvbnN0IGNhbnZhc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkNhbnZhcyBCdWZmZXJcIixcblx0XHRzaXplOiBjYW52YXNEYXRhLmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGNhbnZhc0J1ZmZlciwgLypvZmZzZXQ9Ki8gMCwgLypkYXRhPSovIGNhbnZhc0RhdGEpO1xuXG5cdHJldHVybiB7XG5cdFx0Y2FudmFzOiB7XG5cdFx0XHRidWZmZXI6IGNhbnZhc0J1ZmZlcixcblx0XHRcdGRhdGE6IGNhbnZhc0RhdGEsXG5cdFx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0XHR9LFxuXHRcdHRleHR1cmVzOiB0ZXh0dXJlcyxcblx0XHRiaW5kaW5nTGF5b3V0OiBiaW5kaW5nTGF5b3V0LFxuXHRcdHNpemU6IHNpemUsXG5cdH07XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW4obmVzdGVkQXJyYXk6IG51bWJlcltdW11bXSk6IG51bWJlcltdIHtcblx0Y29uc3QgZmxhdHRlbmVkID0gW107XG5cdGZvciAobGV0IGsgPSAwOyBrIDwgbmVzdGVkQXJyYXlbMF1bMF0ubGVuZ3RoOyBrKyspIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5lc3RlZEFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IG5lc3RlZEFycmF5WzBdLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGZsYXR0ZW5lZC5wdXNoKG5lc3RlZEFycmF5W2ldW2pdW2tdKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmxhdHRlbmVkO1xufVxuXG5mdW5jdGlvbiB6ZXJvcyhcblx0aGVpZ2h0OiBudW1iZXIsXG5cdHdpZHRoOiBudW1iZXIsXG5cdGxheWVyczogbnVtYmVyID0gMVxuKTogbnVtYmVyW11bXVtdIHtcblx0Y29uc3QgemVyb0FycmF5ID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBoZWlnaHQ7IGkrKykge1xuXHRcdGNvbnN0IHJvdyA9IFtdO1xuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgd2lkdGg7IGorKykge1xuXHRcdFx0Y29uc3QgbGF5ZXIgPSBbXTtcblx0XHRcdGZvciAobGV0IGsgPSAwOyBrIDwgbGF5ZXJzOyBrKyspIHtcblx0XHRcdFx0bGF5ZXIucHVzaCgwKTtcblx0XHRcdH1cblx0XHRcdHJvdy5wdXNoKGxheWVyKTtcblx0XHR9XG5cdFx0emVyb0FycmF5LnB1c2gocm93KTtcblx0fVxuXG5cdHJldHVybiB6ZXJvQXJyYXk7XG59XG5cbmZ1bmN0aW9uIHNldHVwSW50ZXJhY3Rpb25zKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0Y2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IE9mZnNjcmVlbkNhbnZhcyxcblx0dGV4dHVyZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRzaXplOiBudW1iZXIgPSAxMDBcbik6IHtcblx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdGRhdGE6IEJ1ZmZlclNvdXJjZSB8IFNoYXJlZEFycmF5QnVmZmVyO1xuXHR0eXBlOiBHUFVCdWZmZXJCaW5kaW5nVHlwZTtcbn0ge1xuXHRsZXQgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG5cdHZhciBzaWduID0gMTtcblxuXHRsZXQgcG9zaXRpb24gPSB7IHg6IDAsIHk6IDAgfTtcblx0bGV0IHZlbG9jaXR5ID0geyB4OiAwLCB5OiAwIH07XG5cblx0ZGF0YS5zZXQoW3Bvc2l0aW9uLngsIHBvc2l0aW9uLnldKTtcblx0aWYgKGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG5cdFx0Ly8gZGlzYWJsZSBjb250ZXh0IG1lbnVcblx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChldmVudCkgPT4ge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgZXZlbnRzXG5cdFx0W1wibW91c2Vtb3ZlXCIsIFwidG91Y2htb3ZlXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQub2Zmc2V0WDtcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50Lm9mZnNldFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IHggPSBNYXRoLmZsb29yKFxuXHRcdFx0XHRcdFx0KHBvc2l0aW9uLnggLyBjYW52YXMud2lkdGgpICogdGV4dHVyZS53aWR0aFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0bGV0IHkgPSBNYXRoLmZsb29yKFxuXHRcdFx0XHRcdFx0KHBvc2l0aW9uLnkgLyBjYW52YXMuaGVpZ2h0KSAqIHRleHR1cmUuaGVpZ2h0XG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGRhdGEuc2V0KFt4LCB5XSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gem9vbSBldmVudHMgVE9ETyhAZ3N6ZXApIGFkZCBwaW5jaCBhbmQgc2Nyb2xsIGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wid2hlZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFdoZWVsRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHZlbG9jaXR5LnggPSBldmVudC5kZWx0YVk7XG5cdFx0XHRcdFx0XHRcdHZlbG9jaXR5LnkgPSBldmVudC5kZWx0YVk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNpemUgKz0gdmVsb2NpdHkueTtcblx0XHRcdFx0XHRkYXRhLnNldChbc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIGNsaWNrIGV2ZW50cyBUT0RPKEBnc3plcCkgaW1wbGVtZW50IHJpZ2h0IGNsaWNrIGVxdWl2YWxlbnQgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJtb3VzZWRvd25cIiwgXCJ0b3VjaHN0YXJ0XCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0XHRzaWduID0gMSAtIGV2ZW50LmJ1dHRvbjtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRzaWduID0gZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxID8gLTEgOiAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhLnNldChbc2lnbiAqIHNpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdFx0W1wibW91c2V1cFwiLCBcInRvdWNoZW5kXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRkYXRhLnNldChbTmFOXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJJbnRlcmFjdGlvbiBCdWZmZXJcIixcblx0XHRzaXplOiBkYXRhLmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRidWZmZXI6IHVuaWZvcm1CdWZmZXIsXG5cdFx0ZGF0YTogZGF0YSxcblx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0fTtcbn1cblxuZnVuY3Rpb24gY2hhbm5lbENvdW50KGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCk6IG51bWJlciB7XG5cdGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JhXCIpKSB7XG5cdFx0cmV0dXJuIDQ7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiXCIpKSB7XG5cdFx0cmV0dXJuIDM7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdcIikpIHtcblx0XHRyZXR1cm4gMjtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyXCIpKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBmb3JtYXQ6IFwiICsgZm9ybWF0KTtcblx0fVxufVxuXG5mdW5jdGlvbiBwcmVwZW5kSW5jbHVkZXMoY29kZTogc3RyaW5nLCBpbmNsdWRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuXHRjb2RlID0gY29kZS5yZXBsYWNlKC9eI2ltcG9ydC4qL2dtLCBcIlwiKTtcblx0cmV0dXJuIGluY2x1ZGVzLnJlZHVjZSgoYWNjLCBpbmNsdWRlKSA9PiBpbmNsdWRlICsgXCJcXG5cIiArIGFjYywgY29kZSk7XG59XG5cbmV4cG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9