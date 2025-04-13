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
            const centerX = width / 2;
            const centerY = height / 2;
            const dx = j - centerX;
            const dy = i - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const sdf = distance - 1000; // Example SDF value
            row.push([sdf < 0 ? 1 : 0, 0, 0, sdf < 0 ? 1 : 0]);
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
    const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    const compute_iters = isMobileDevice ? 1 : 10;
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
        STRESS: 0,
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
            [BINDINGS_TEXTURE.STRESS]: 4,
            [BINDINGS_TEXTURE.DEFORMATION]: 4,
        },
        width: canvas.size.width,
        height: canvas.size.height,
    });
    const WORKGROUP_SIZE = 8;
    const TILE_SIZE = 2;
    const HALO_SIZE = 2;
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
        for (let i = 0; i < compute_iters; i++) {
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\nconst EPS = 1e-37;\nconst lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));\n\n@group(GROUP_INDEX) @binding(DISTRIBUTION) var distribution: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEFORMATION) var deformation: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\nfn get_velocity(x: vec2<i32>) -> vec4<f32> {\n\n    var density = 0.0;\n    var momentum = vec2<f32>(0.0, 0.0);\n\n    for (var i = 0; i < 9; i++) {\n        let f = textureLoad(distribution, x, i).r;\n\n        density += f;\n        momentum += f * vec2<f32>(lattice_vector[i]);\n    }\n\n    let velocity = momentum / max(density, EPS);\n\n    let angle = atan2(velocity.x, velocity.y);\n    let norm = length(velocity);\n\n    // rainbow along the angle\n    return vec4<f32>(\n        0.5 + 0.5 * cos(angle + 0.0),\n        0.5 + 0.5 * cos(angle + 2.094),\n        0.5 + 0.5 * cos(angle + 4.188),\n        100.0 * norm\n    );\n}\n\nfn get_deformation_gradient(x: vec2<i32>) -> vec4<f32> {\n    return vec4<f32>(textureLoad(deformation, x, 0).r, textureLoad(deformation, x, 1).r, textureLoad(deformation, x, 2).r, textureLoad(deformation, x, 3).r);\n}\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    let F = get_deformation_gradient(x);\n    let det = F[0] * F[3] - F[1] * F[2];\n    let tr = F[0] + F[3];\n\n    output.color.r = det / 2;\n    output.color.g = tr / 10;\n    \n    output.color.a = 1.0;\n    return output;\n} ";

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

module.exports = "// enable f16;\n\nconst GROUP_INDEX = 0;\nconst VERTEX_INDEX = 0;\nconst RENDER_INDEX = 0;\n\nconst STRESS = 0u;\nconst DEFORMATION = 1u;\nconst DISTRIBUTION = 2u;\n\nconst INTERACTION = 3;\nconst CANVAS = 4;";

/***/ }),

/***/ "./src/shaders/includes/cache.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/includes/cache.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n}\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n}\n\nstruct IndexFloat {\n    global: vec2<f32>,\n    local: vec2<f32>,\n}\n\nstruct Canvas {\n    size: vec2<u32>,\n    frame_index: u32,\n}\n\nfn indexf(index: Index) -> IndexFloat {\n    return IndexFloat(vec2<f32>(index.global), vec2<f32>(index.local));\n}\n\nfn add(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global + y, x.local + y);\n}\n\nfn addf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global + y, x.local + y);\n}\n\nfn sub(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global - y, x.local - y);\n}\n\nfn subf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global - y, x.local - y);\n}\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 8u;\nconst HALO_SIZE = 2u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS)\nvar<uniform> canvas: Canvas;\n\nvar<workgroup> cache_f32: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 1>;\nvar<workgroup> cache_vec4: array<f32, CACHE_SIZE * CACHE_SIZE * 8>;\nvar<workgroup> cache_vec9: array<f32, CACHE_SIZE * CACHE_SIZE * 9>;\n\nfn load_cache_f32(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            cache_f32[idx][index.local.x][index.local.y] = load_value(F, index.global);\n        }\n    }\n}\n\nfn load_cache_vec4(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            for (var i = 0; i < 4; i++) {\n\n                let cache_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + u32(i) + (index.local.x * 4u) + (index.local.y * CACHE_SIZE * 4u);\n                cache_vec4[cache_idx] = load_component_value(F, index.global, i);\n            }\n        }\n    }\n}\n\nfn load_cache_vec9(id: Invocation, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            for (var i = 0; i < 9; i++) {\n\n                let idx = u32(i) + (index.local.x * 9u) + (index.local.y * CACHE_SIZE * 9u);\n                cache_vec9[idx] = load_component_value(F, index.global, i);\n            }\n        }\n    }\n}\n\nfn cached_value_f32(idx: u32, x: vec2<u32>) -> f32 {\n    return cache_f32[idx][x.x][x.y];\n}\n\nfn cached_value_vec4(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    let base_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + (x.x * 4u) + (x.y * CACHE_SIZE * 4u);\n    return vec4<f32>(cache_vec4[base_idx + 0u], cache_vec4[base_idx + 1u], cache_vec4[base_idx + 2u], cache_vec4[base_idx + 3u]);\n}\n\nfn cached_value_vec9(x: vec2<u32>) -> array<f32, 9> {\n    var vec9: array<f32, 9>;\n    for (var i = 0; i < 9; i++) {\n\n        let idx = u32(i) + (x.x * 9u) + (x.y * CACHE_SIZE * 9u);\n        vec9[i] = cache_vec9[idx];\n    }\n    return vec9;\n}\n\nfn as_r32float(r: f32) -> vec4<f32> {\n    return vec4<f32>(f32(r), 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> f32 {\n    let y = x + canvas.size;\n    return f32(textureLoad(F, vec2<i32>(y % canvas.size)).r);\n}\n\nfn load_component_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>, component: i32) -> f32 {\n    let y = x + canvas.size;\n    return f32(textureLoad(F, vec2<i32>(y % canvas.size), component).r);\n}\n\nfn store_value(F: texture_storage_2d<r32float, read_write>, index: Index, value: f32) {\n    let y = index.global + canvas.size;\n    textureStore(F, vec2<i32>(y % canvas.size), as_r32float(value));\n}\n\nfn store_component_value(F: texture_storage_2d_array<r32float, read_write>, index: Index, component: i32, value: f32) {\n    let y = index.global + canvas.size;\n    textureStore(F, vec2<i32>(y % canvas.size), component, as_r32float(value));\n}\n\nfn check_bounds(index: Index) -> bool {\n    return (HALO_SIZE <= index.local.x) && (index.local.x <= DISPATCH_SIZE + HALO_SIZE - 1u) && (HALO_SIZE <= index.local.y) && (index.local.y <= DISPATCH_SIZE + HALO_SIZE - 1u);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/lattice-boltzmann.comp.wgsl":
/*!*************************************************!*\
  !*** ./src/shaders/lattice-boltzmann.comp.wgsl ***!
  \*************************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nconst EPS = 1e-37;\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nstruct State {\n    f: array<f32, 9>,\n    density: f32,\n    velocity: vec2<f32>,\n};\n\nconst lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));\nconst lattice_weight = array<f32, 9>(4.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0);\n\n@group(GROUP_INDEX) @binding(DISTRIBUTION)\nvar distribution: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(DEFORMATION)\nvar deformation: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(STRESS)\nvar stress: texture_storage_2d_array<r32float, read_write>;\n\n@group(GROUP_INDEX) @binding(INTERACTION)\nvar<uniform> interaction: Interaction;\n\nfn load_macroscopics_cache(id: Invocation) {\n    load_cache_vec4(id, 0u, deformation);\n    load_cache_vec4(id, 1u, stress);\n}\n\nfn get_deformation_gradient(index: Index) -> vec4<f32> {\n    return cached_value_vec4(0u, index.local);\n}\n\nfn get_cauchy_stress(index: Index) -> vec4<f32> {\n    return cached_value_vec4(1u, index.local);\n}\n\nfn load_distribution_cache(id: Invocation) {\n    load_cache_vec9(id, distribution);\n}\n\nfn get_distribution(index: Index) -> array<f32, 9> {\n    return cached_value_vec9(index.local);\n}\n\nfn get_force_distribution(index: Index, v: vec2<f32>) -> array<f32, 9> {\n    let F = get_force(index);\n\n    return array<f32, 9>(\n        1.0 * lattice_weight[0] * (-v.x * F.x - v.y * F.y),\n        3.0 * lattice_weight[1] * ((2.0 * v.x + 1.0) * F.x - v.y * F.y),\n        3.0 * lattice_weight[2] * (-v.x * (2.0 * v.y + 1.0) * F.y),\n        3.0 * lattice_weight[3] * ((2.0 * v.x - 1.0) * F.x - v.y * F.y),\n        3.0 * lattice_weight[4] * (-v.x * (2.0 * v.y - 1.0) * F.y),\n        3.0 * lattice_weight[5] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y + 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[6] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y + 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[7] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y - 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),\n        3.0 * lattice_weight[8] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y - 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x))\n    );\n}\n\nfn get_force(index: Index) -> vec2<f32> {\n\n    let dx_s = (get_cauchy_stress(add(index, dx)) - get_cauchy_stress(sub(index, dx))) / 2.0;\n    let dy_s = (get_cauchy_stress(add(index, dy)) - get_cauchy_stress(sub(index, dy))) / 2.0;\n\n    var force = vec2<f32>(dx_s[0] + dy_s[1], dx_s[2] + dy_s[3]);\n    \n    let x = vec2<f32>(index.global);\n    let y = interaction.position + sign(interaction.size);\n\n    let dims = vec2<f32>(canvas.size);\n    let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));\n\n    if distance < abs(interaction.size) {\n        force += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));\n    }\n    return force;\n}\n\nfn advect_deformation_gradient(index: Index) -> vec4<f32> {\n    const max_norm = f32(HALO_SIZE);\n\n    let velocity = get_velocity(index);\n    let norm = length(velocity);\n\n    return upwinding(index, (velocity / max(norm, EPS)) * min(norm, max_norm));\n}\n\nfn upwinding(index: Index, v: vec2<f32>) -> vec4<f32> {\n    let F = get_deformation_gradient(index);\n\n    var dx_F:  vec4<f32>;\n    if (v.x > 0.0) {\n        dx_F = 3*F - 4*get_deformation_gradient(sub(index,dx)) + get_deformation_gradient(sub(index,2*dx));\n    } else {\n        dx_F = -3*F + 4*get_deformation_gradient(add(index,dx)) - get_deformation_gradient(add(index,2*dx));\n    }\n\n    var dy_F:  vec4<f32>;\n    if (v.y > 0.0) {\n        dy_F = 3*F - 4*get_deformation_gradient(sub(index,dy)) + get_deformation_gradient(sub(index,2*dy));\n    } else {\n        dy_F = -3*F + 4*get_deformation_gradient(add(index,dy)) - get_deformation_gradient(add(index,2*dy));\n    }\n\n    return -(v.x * dx_F + v.y * dy_F) / 2;\n}\n\nfn get_state(index: Index) -> State {\n    var density = 0.0;\n    var momentum = vec2<f32>(0.0, 0.0);\n    \n    var f: array<f32, 9>;\n    for (var i = 0u; i < 9u; i++) {\n\n        let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));\n        f[i] = get_distribution(y)[i];\n\n        density += f[i];\n        momentum += f[i] * vec2<f32>(lattice_vector[i]);\n    }\n\n    let velocity = momentum / max(density, EPS);\n    return State(f, density, velocity);\n}\n\nfn get_velocity(index: Index) -> vec2<f32> {\n    let state = get_state(index);\n    return state.velocity;\n}\n\nfn get_velocity_jacobian(index: Index) -> mat2x2<f32> {\n    let dx_v = (get_velocity(add(index, dx)) - get_velocity(sub(index, dx))) / 2.0;\n    let dy_v = (get_velocity(add(index, dy)) - get_velocity(sub(index, dy))) / 2.0;\n    return mat2x2<f32>(dx_v, dy_v);\n}\n\nfn constitutive_law(F: vec4<f32>, g:f32, kappa:f32) -> vec4<f32> {\n    let I = vec4<f32>(1.0, 0.0, 0.0, 1.0);\n    let J = max(F[0] * F[3] - F[1] * F[2], EPS);\n    let B = vec4<f32>(\n        F[0] * F[0] + F[1] * F[1],\n        F[0] * F[2] + F[1] * F[3],\n        F[2] * F[0] + F[3] * F[1],\n        F[2] * F[2] + F[3] * F[3]\n    );\n\n    return g * pow(J,-5/3) * (B - I/3 * (B[0] + B[3])) + kappa * (J - 1) * I;\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn lattice_boltzmann(id: Invocation) {\n\n    load_macroscopics_cache(id);\n    load_distribution_cache(id);\n    workgroupBarrier();\n\n    let g = 0.0; // small-strain shear modulus\n    let kappa = 3*g; // bulk modulus\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                var F = get_deformation_gradient(index);\n                F += advect_deformation_gradient(index);\n\n                let dv = get_velocity_jacobian(index);\n                F[0] += F[0] * dv[0][0] + F[1] * dv[1][0];\n                F[1] += F[0] * dv[0][1] + F[1] * dv[1][1];\n                F[2] += F[2] * dv[0][0] + F[3] * dv[1][0];\n                F[3] += F[2] * dv[0][1] + F[3] * dv[1][1];\n\n                var sigma = constitutive_law(F, g, kappa);\n\n                for (var i = 0; i < 4; i++) {\n                    store_component_value(deformation, index, i, F[i]);\n                    store_component_value(stress, index, i, sigma[i]);\n                }\n            }\n        }\n    }\n\n    load_distribution_cache(id);\n    workgroupBarrier();\n\n    let relaxation_frequency = 1.8; // between 0.0 and 2.0\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // read distribution from neighbors\n                let state = get_state(index);\n\n                // include external forces\n                let speed = length(state.velocity);\n                let F = get_force_distribution(index, state.velocity);\n\n                for (var i = 0; i < 9; i++) {\n\n                    // compute distribution equilibrium\n                    let lattice_speed = dot(state.velocity, vec2<f32>(lattice_vector[i]));\n                    let equilibrium = lattice_weight[i] * state.density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);\n                \n                    // BGK collision\n                    let distribution_update = (1.0 - relaxation_frequency) * state.f[i] + relaxation_frequency * equilibrium + (1.0 - relaxation_frequency / 2.0) * F[i];\n                    store_component_value(distribution, index, i, distribution_update);\n                }\n            }\n        }\n    }\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNmLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7SUFDN0MsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFZLEVBQUUsUUFBa0I7SUFDeEQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFTQyIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IGJpbmRpbmdzIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvYmluZGluZ3Mud2dzbFwiO1xuaW1wb3J0IGNhY2hlVXRpbHMgZnJvbSBcIi4vc2hhZGVycy9pbmNsdWRlcy9jYWNoZS53Z3NsXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2xhdHRpY2UtYm9sdHptYW5uLmNvbXAud2dzbFwiO1xuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuY29uc3QgbGF0dGljZV92ZWN0b3IgPSBbXG5cdFswLCAwXSxcblx0WzEsIDBdLFxuXHRbMCwgMV0sXG5cdFstMSwgMF0sXG5cdFswLCAtMV0sXG5cdFsxLCAxXSxcblx0Wy0xLCAxXSxcblx0Wy0xLCAtMV0sXG5cdFsxLCAtMV0sXG5dO1xuY29uc3QgbGF0dGljZV93ZWlnaHQgPSBbXG5cdDQuMCAvIDkuMCxcblx0MS4wIC8gOS4wLFxuXHQxLjAgLyA5LjAsXG5cdDEuMCAvIDkuMCxcblx0MS4wIC8gOS4wLFxuXHQxLjAgLyAzNi4wLFxuXHQxLjAgLyAzNi4wLFxuXHQxLjAgLyAzNi4wLFxuXHQxLjAgLyAzNi4wLFxuXTtcblxuZnVuY3Rpb24gaW5pdGlhbERlbnNpdHkoaGVpZ2h0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpIHtcblx0Y29uc3QgZGVuc2l0eSA9IFtdO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGhlaWdodDsgaSsrKSB7XG5cdFx0Y29uc3Qgcm93ID0gW107XG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCB3aWR0aDsgaisrKSB7XG5cdFx0XHRjb25zdCBjZW50ZXJYID0gd2lkdGggLyAyO1xuXHRcdFx0Y29uc3QgY2VudGVyWSA9IGhlaWdodCAvIDI7XG5cdFx0XHRjb25zdCBkeCA9IGogLSBjZW50ZXJYO1xuXHRcdFx0Y29uc3QgZHkgPSBpIC0gY2VudGVyWTtcblx0XHRcdGNvbnN0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblx0XHRcdGNvbnN0IHNpZ21hID0gMTA7XG5cdFx0XHRjb25zdCByaG8gPSBNYXRoLmV4cCgoLWRpc3RhbmNlICogZGlzdGFuY2UpIC8gKDIgKiBzaWdtYSAqIHNpZ21hKSk7XG5cblx0XHRcdHJvdy5wdXNoKFsxXSk7XG5cdFx0fVxuXHRcdGRlbnNpdHkucHVzaChyb3cpO1xuXHR9XG5cdHJldHVybiBkZW5zaXR5O1xufVxuXG5mdW5jdGlvbiBpbml0aWFsVmVsb2NpdHkoaGVpZ2h0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpIHtcblx0Ly8gQ3JlYXRlIGVtcHR5IG5lc3RlZCBhcnJheSBzdHJ1Y3R1cmVcblx0Y29uc3QgdmVsb2NpdHlGaWVsZCA9IFtdO1xuXG5cdC8vIEZpbGwgd2l0aCB2ZWxvY2l0eSBjb21wb25lbnRzXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcblx0XHRjb25zdCByb3cgPSBbXTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcblx0XHRcdC8vIEZvciBlYWNoIGNlbGwsIHN0b3JlIFt2eCwgdnldIGNvbXBvbmVudHNcblx0XHRcdC8vIENyZWF0ZSBhIHNpbXBsZSBjaXJjdWxhciBmbG93IHBhdHRlcm4gYXMgYW4gZXhhbXBsZVxuXHRcdFx0Ly8gY29uc3QgY2VudGVyWCA9IHdpZHRoIC8gMjtcblx0XHRcdC8vIGNvbnN0IGNlbnRlclkgPSBoZWlnaHQgLyAyO1xuXHRcdFx0Ly8gY29uc3QgZHggPSBqIC0gY2VudGVyWDtcblx0XHRcdC8vIGNvbnN0IGR5ID0gaSAtIGNlbnRlclk7XG5cdFx0XHQvLyBjb25zdCBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cblx0XHRcdC8vIC8vIENyZWF0ZSBjaXJjdWxhciB2ZWxvY2l0eSBmaWVsZFxuXHRcdFx0Ly8gY29uc3Qgc2lnbWEgPSA1MDtcblx0XHRcdC8vIHZhciByaG8gPSBNYXRoLmV4cCgoLWRpc3RhbmNlICogZGlzdGFuY2UpIC8gKDIgKiBzaWdtYSAqIHNpZ21hKSk7XG5cblx0XHRcdC8vIHJobyA9IHJobyAqIE1hdGguZXhwKCgtKGRpc3RhbmNlIC0gNTApICogKGRpc3RhbmNlIC0gNTApKSAvIDIwMCk7XG5cdFx0XHQvLyBjb25zdCB2eCA9IChkeSAvIGRpc3RhbmNlKSAqIHJobztcblx0XHRcdC8vIGNvbnN0IHZ5ID0gKGR4IC8gZGlzdGFuY2UpICogcmhvO1xuXG5cdFx0XHQvLyByYW5kb20gdmVsb2NpdHlcblx0XHRcdGNvbnN0IHZ4ID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxOyAvLyBSYW5kb20gdmFsdWUgYmV0d2VlbiAtMSBhbmQgMVxuXHRcdFx0Y29uc3QgdnkgPSBNYXRoLnJhbmRvbSgpICogMiAtIDE7IC8vIFJhbmRvbSB2YWx1ZSBiZXR3ZWVuIC0xIGFuZCAxXG5cblx0XHRcdHJvdy5wdXNoKFt2eCAvIDEwLCB2eSAvIDEwXSk7XG5cdFx0fVxuXHRcdHZlbG9jaXR5RmllbGQucHVzaChyb3cpO1xuXHR9XG5cblx0cmV0dXJuIHZlbG9jaXR5RmllbGQ7XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxEZWZvcm1hdGlvbkdyYWRpZW50KGhlaWdodDogbnVtYmVyLCB3aWR0aDogbnVtYmVyKSB7XG5cdGNvbnN0IGRlZm9ybWF0aW9uID0gW107XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcblx0XHRjb25zdCByb3cgPSBbXTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcblx0XHRcdGNvbnN0IGNlbnRlclggPSB3aWR0aCAvIDI7XG5cdFx0XHRjb25zdCBjZW50ZXJZID0gaGVpZ2h0IC8gMjtcblx0XHRcdGNvbnN0IGR4ID0gaiAtIGNlbnRlclg7XG5cdFx0XHRjb25zdCBkeSA9IGkgLSBjZW50ZXJZO1xuXHRcdFx0Y29uc3QgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXHRcdFx0Y29uc3Qgc2RmID0gZGlzdGFuY2UgLSAxMDAwOyAvLyBFeGFtcGxlIFNERiB2YWx1ZVxuXHRcdFx0cm93LnB1c2goW3NkZiA8IDAgPyAxIDogMCwgMCwgMCwgc2RmIDwgMCA/IDEgOiAwXSk7XG5cdFx0fVxuXHRcdGRlZm9ybWF0aW9uLnB1c2gocm93KTtcblx0fVxuXHRyZXR1cm4gZGVmb3JtYXRpb247XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFcXVpbGlicml1bShkZW5zaXR5OiBudW1iZXJbXVtdW10sIHZlbG9jaXR5OiBudW1iZXJbXVtdW10pIHtcblx0Y29uc3QgZXF1aWxpYnJpdW0gPSBbXTtcblx0Y29uc3QgaGVpZ2h0ID0gZGVuc2l0eS5sZW5ndGg7XG5cdGNvbnN0IHdpZHRoID0gZGVuc2l0eVswXS5sZW5ndGg7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcblx0XHRjb25zdCByb3cgPSBbXTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcblx0XHRcdGNvbnN0IGNlbGwgPSBbXTtcblx0XHRcdGZvciAobGV0IGsgPSAwOyBrIDwgOTsgaysrKSB7XG5cdFx0XHRcdGNvbnN0IHNwZWVkID0gTWF0aC5zcXJ0KFxuXHRcdFx0XHRcdHZlbG9jaXR5W2ldW2pdWzBdICogdmVsb2NpdHlbaV1bal1bMF0gK1xuXHRcdFx0XHRcdFx0dmVsb2NpdHlbaV1bal1bMV0gKiB2ZWxvY2l0eVtpXVtqXVsxXVxuXHRcdFx0XHQpO1xuXHRcdFx0XHRjb25zdCBsYXR0aWNlX3NwZWVkID1cblx0XHRcdFx0XHRsYXR0aWNlX3ZlY3RvcltrXVswXSAqIHZlbG9jaXR5W2ldW2pdWzBdICtcblx0XHRcdFx0XHRsYXR0aWNlX3ZlY3RvcltrXVsxXSAqIHZlbG9jaXR5W2ldW2pdWzFdO1xuXG5cdFx0XHRcdGNvbnN0IGZfZXEgPVxuXHRcdFx0XHRcdGxhdHRpY2Vfd2VpZ2h0W2tdICpcblx0XHRcdFx0XHRkZW5zaXR5W2ldW2pdWzBdICpcblx0XHRcdFx0XHQoMS4wICtcblx0XHRcdFx0XHRcdDMuMCAqIGxhdHRpY2Vfc3BlZWQgK1xuXHRcdFx0XHRcdFx0NC41ICogbGF0dGljZV9zcGVlZCAqIGxhdHRpY2Vfc3BlZWQgLVxuXHRcdFx0XHRcdFx0MS41ICogc3BlZWQgKiBzcGVlZCk7XG5cblx0XHRcdFx0Y2VsbC5wdXNoKGZfZXEpO1xuXHRcdFx0fVxuXHRcdFx0cm93LnB1c2goY2VsbCk7XG5cdFx0fVxuXHRcdGVxdWlsaWJyaXVtLnB1c2gocm93KTtcblx0fVxuXHRyZXR1cm4gZXF1aWxpYnJpdW07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluZGV4KCk6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBpc01vYmlsZURldmljZSA9XG5cdFx0L0FuZHJvaWR8aVBob25lfGlQYWR8aVBvZHxPcGVyYSBNaW5pfElFTW9iaWxlfFdQRGVza3RvcC9pLnRlc3QoXG5cdFx0XHRuYXZpZ2F0b3IudXNlckFnZW50XG5cdFx0KTtcblx0Y29uc3QgY29tcHV0ZV9pdGVycyA9IGlzTW9iaWxlRGV2aWNlID8gMSA6IDEwO1xuXG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblxuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cblx0Y29uc3QgQklORElOR1NfVEVYVFVSRSA9IHtcblx0XHRTVFJFU1M6IDAsXG5cdFx0REVGT1JNQVRJT046IDEsXG5cdFx0RElTVFJJQlVUSU9OOiAyLFxuXHR9O1xuXHRjb25zdCBCSU5ESU5HU19CVUZGRVIgPSB7IElOVEVSQUNUSU9OOiAzLCBDQU5WQVM6IDQgfTtcblx0Ly8gY2FudmFzLnNpemUgPSB7IHdpZHRoOiA2NCwgaGVpZ2h0OiA2NCB9O1xuXG5cdGNvbnN0IGRlbnNpdHkgPSBpbml0aWFsRGVuc2l0eShjYW52YXMuc2l6ZS5oZWlnaHQsIGNhbnZhcy5zaXplLndpZHRoKTtcblx0Y29uc3QgdmVsb2NpdHkgPSBpbml0aWFsVmVsb2NpdHkoY2FudmFzLnNpemUuaGVpZ2h0LCBjYW52YXMuc2l6ZS53aWR0aCk7XG5cdGNvbnN0IGVxdWlsaWJyaXVtID0gY29tcHV0ZUVxdWlsaWJyaXVtKGRlbnNpdHksIHZlbG9jaXR5KTtcblx0Y29uc3QgZGVmb3JtYXRpb24gPSBpbml0aWFsRGVmb3JtYXRpb25HcmFkaWVudChcblx0XHRjYW52YXMuc2l6ZS5oZWlnaHQsXG5cdFx0Y2FudmFzLnNpemUud2lkdGhcblx0KTtcblxuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoXG5cdFx0ZGV2aWNlLFxuXHRcdE9iamVjdC52YWx1ZXMoQklORElOR1NfVEVYVFVSRSksXG5cdFx0e1xuXHRcdFx0W0JJTkRJTkdTX1RFWFRVUkUuRElTVFJJQlVUSU9OXTogZXF1aWxpYnJpdW0sXG5cdFx0XHRbQklORElOR1NfVEVYVFVSRS5ERUZPUk1BVElPTl06IGRlZm9ybWF0aW9uLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOiB7XG5cdFx0XHRcdFtCSU5ESU5HU19URVhUVVJFLkRJU1RSSUJVVElPTl06IDksXG5cdFx0XHRcdFtCSU5ESU5HU19URVhUVVJFLlNUUkVTU106IDQsXG5cdFx0XHRcdFtCSU5ESU5HU19URVhUVVJFLkRFRk9STUFUSU9OXTogNCxcblx0XHRcdH0sXG5cdFx0XHR3aWR0aDogY2FudmFzLnNpemUud2lkdGgsXG5cdFx0XHRoZWlnaHQ6IGNhbnZhcy5zaXplLmhlaWdodCxcblx0XHR9XG5cdCk7XG5cblx0Y29uc3QgV09SS0dST1VQX1NJWkUgPSA4O1xuXHRjb25zdCBUSUxFX1NJWkUgPSAyO1xuXHRjb25zdCBIQUxPX1NJWkUgPSAyO1xuXG5cdGNvbnN0IENBQ0hFX1NJWkUgPSBUSUxFX1NJWkUgKiBXT1JLR1JPVVBfU0laRTtcblx0Y29uc3QgRElTUEFUQ0hfU0laRSA9IENBQ0hFX1NJWkUgLSAyICogSEFMT19TSVpFO1xuXG5cdGNvbnN0IFdPUktHUk9VUF9DT1VOVDogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS53aWR0aCAvIERJU1BBVENIX1NJWkUpLFxuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLmhlaWdodCAvIERJU1BBVENIX1NJWkUpLFxuXHRdO1xuXG5cdC8vIHNldHVwIGludGVyYWN0aW9uc1xuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblxuXHRjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcblx0XHRsYWJlbDogXCJiaW5kR3JvdXBMYXlvdXRcIixcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX1RFWFRVUkUpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZTogdGV4dHVyZXMuYmluZGluZ0xheW91dFtiaW5kaW5nXSxcblx0XHRcdH0pKSxcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfQlVGRkVSKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0YnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIGFzIEdQVUJ1ZmZlckJpbmRpbmdUeXBlIH0sXG5cdFx0XHR9KSksXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0bGFiZWw6IGBCaW5kIEdyb3VwYCxcblx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX1RFWFRVUkUpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW2JpbmRpbmddLmNyZWF0ZVZpZXcoKSxcblx0XHRcdH0pKSxcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfQlVGRkVSKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0YnVmZmVyOlxuXHRcdFx0XHRcdFx0YmluZGluZyA9PT0gQklORElOR1NfQlVGRkVSLklOVEVSQUNUSU9OXG5cdFx0XHRcdFx0XHRcdD8gaW50ZXJhY3Rpb25zLmJ1ZmZlclxuXHRcdFx0XHRcdFx0XHQ6IHRleHR1cmVzLmNhbnZhcy5idWZmZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSksXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgcGlwZWxpbmVMYXlvdXQgPSBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuXHRcdGxhYmVsOiBcInBpcGVsaW5lTGF5b3V0XCIsXG5cdFx0YmluZEdyb3VwTGF5b3V0czogW2JpbmRHcm91cExheW91dF0sXG5cdH0pO1xuXG5cdC8vIGNvbXBpbGUgc2hhZGVyc1xuXHRjb25zdCB0aW1lc3RlcFNoYWRlck1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdGxhYmVsOiBcInRpbWVzdGVwQ29tcHV0ZVNoYWRlclwiLFxuXHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIFtjYWNoZVV0aWxzLCBiaW5kaW5nc10pLFxuXHR9KTtcblxuXHRjb25zdCBsYXR0aWNlQm9sdHptYW5uUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJsYXR0aWNlQm9sdHptYW5uUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdGNvbXB1dGU6IHtcblx0XHRcdGVudHJ5UG9pbnQ6IFwibGF0dGljZV9ib2x0em1hbm5cIixcblx0XHRcdG1vZHVsZTogdGltZXN0ZXBTaGFkZXJNb2R1bGUsXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgcmVuZGVyUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInJlbmRlclBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHR2ZXJ0ZXg6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsVmVydGV4U2hhZGVyLCBbYmluZGluZ3NdKSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbFZlcnRleFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHRidWZmZXJzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhcnJheVN0cmlkZTogcXVhZC5hcnJheVN0cmlkZSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZvcm1hdDogcXVhZC5mb3JtYXQsXG5cdFx0XHRcdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0XHRcdFx0c2hhZGVyTG9jYXRpb246IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRmcmFnbWVudDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKGNlbGxGcmFnbWVudFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3JtYXQ6IGNhbnZhcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdGxvYWRPcDogXCJsb2FkXCIsXG5cdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0fSxcblx0XTtcblx0Y29uc3QgcmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG5cdFx0Y29sb3JBdHRhY2htZW50czogY29sb3JBdHRhY2htZW50cyxcblx0fTtcblxuXHRmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Ly8gY29tcHV0ZSBwYXNzXG5cdFx0Y29uc3QgY29tcHV0ZVBhc3MgPSBjb21tYW5kLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblx0XHRjb21wdXRlUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cCk7XG5cblx0XHQvLyBpbnRlcmFjdGlvbnNcblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoaW50ZXJhY3Rpb25zLmJ1ZmZlciwgMCwgaW50ZXJhY3Rpb25zLmRhdGEpO1xuXG5cdFx0Ly8gbGF0dGljZSBib2x0em1hbm4gbWV0aG9kXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb21wdXRlX2l0ZXJzOyBpKyspIHtcblx0XHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKGxhdHRpY2VCb2x0em1hbm5QaXBlbGluZSk7XG5cdFx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoLi4uV09SS0dST1VQX0NPVU5UKTtcblx0XHR9XG5cblx0XHRjb21wdXRlUGFzcy5lbmQoKTtcblxuXHRcdC8vIHJlbmRlciBwYXNzXG5cdFx0Y29uc3QgdGV4dHVyZSA9IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCk7XG5cdFx0Y29uc3QgdmlldyA9IHRleHR1cmUuY3JlYXRlVmlldygpO1xuXG5cdFx0cmVuZGVyUGFzc0Rlc2NyaXB0b3IuY29sb3JBdHRhY2htZW50c1tSRU5ERVJfSU5ERVhdLnZpZXcgPSB2aWV3O1xuXHRcdGNvbnN0IHJlbmRlclBhc3MgPSBjb21tYW5kLmJlZ2luUmVuZGVyUGFzcyhyZW5kZXJQYXNzRGVzY3JpcHRvcik7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cCk7XG5cblx0XHRyZW5kZXJQYXNzLnNldFBpcGVsaW5lKHJlbmRlclBpcGVsaW5lKTtcblx0XHRyZW5kZXJQYXNzLnNldFZlcnRleEJ1ZmZlcihWRVJURVhfSU5ERVgsIHF1YWQudmVydGV4QnVmZmVyKTtcblxuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0XHR0ZXh0dXJlLmRlc3Ryb3koKTtcblx0XHRmcmFtZV9pbmRleCsrO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCJmdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7XG5cdFx0cG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIixcblx0fSxcblx0cmVxdWlyZWRGZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtdLFxuXHRyZXF1aXJlZExpbWl0czogUmVjb3JkPHN0cmluZywgdW5kZWZpbmVkIHwgbnVtYmVyPiA9IHtcblx0XHRtYXhTdG9yYWdlVGV4dHVyZXNQZXJTaGFkZXJTdGFnZTogNCxcblx0XHRtYXhDb21wdXRlV29ya2dyb3VwU3RvcmFnZVNpemU6IDE3NDA4LCAvLyBub3QgbW9iaWxlLWZyaWVuZGx5XG5cdH1cbik6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKG9wdGlvbnMpO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKHtcblx0XHRyZXF1aXJlZEZlYXR1cmVzOiByZXF1aXJlZEZlYXR1cmVzLFxuXHRcdHJlcXVpcmVkTGltaXRzOiByZXF1aXJlZExpbWl0cyxcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemUgPSB7IHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgfVxuKToge1xuXHRjb250ZXh0OiBHUFVDYW52YXNDb250ZXh0O1xuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCBjYW52YXMgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHNpemUpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cblx0Y29uc3QgY29udGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIikhLmdldENvbnRleHQoXCJ3ZWJncHVcIik7XG5cdGlmICghY29udGV4dCkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIkNhbnZhcyBkb2VzIG5vdCBzdXBwb3J0IFdlYkdQVVwiKTtcblxuXHRjb25zdCBmb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXHRjb250ZXh0LmNvbmZpZ3VyZSh7XG5cdFx0ZGV2aWNlOiBkZXZpY2UsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcblx0XHRhbHBoYU1vZGU6IFwicHJlbXVsdGlwbGllZFwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCwgc2l6ZTogc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdHZlcnRleEJ1ZmZlcixcblx0XHQvKmJ1ZmZlck9mZnNldD0qLyAwLFxuXHRcdC8qZGF0YT0qLyBhcnJheVxuXHQpO1xuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFRleHR1cmVzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0YmluZGluZ3M6IG51bWJlcltdLFxuXHRkYXRhOiB7IFtrZXk6IG51bWJlcl06IG51bWJlcltdW11bXSB9LFxuXHRzaXplOiB7XG5cdFx0ZGVwdGhPckFycmF5TGF5ZXJzPzogeyBba2V5OiBudW1iZXJdOiBudW1iZXIgfTtcblx0XHR3aWR0aDogbnVtYmVyO1xuXHRcdGhlaWdodDogbnVtYmVyO1xuXHR9XG4pOiB7XG5cdGNhbnZhczoge1xuXHRcdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRcdGRhdGE6IEJ1ZmZlclNvdXJjZSB8IFNoYXJlZEFycmF5QnVmZmVyO1xuXHRcdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xuXHR9O1xuXHR0ZXh0dXJlczogeyBba2V5OiBudW1iZXJdOiBHUFVUZXh0dXJlIH07XG5cdGJpbmRpbmdMYXlvdXQ6IHsgW2tleTogbnVtYmVyXTogR1BVU3RvcmFnZVRleHR1cmVCaW5kaW5nTGF5b3V0IH07XG5cdHNpemU6IHtcblx0XHRkZXB0aE9yQXJyYXlMYXllcnM/OiB7IFtrZXk6IG51bWJlcl06IG51bWJlciB9O1xuXHRcdHdpZHRoOiBudW1iZXI7XG5cdFx0aGVpZ2h0OiBudW1iZXI7XG5cdH07XG59IHtcblx0Y29uc3QgRk9STUFUID0gXCJyMzJmbG9hdFwiO1xuXHRjb25zdCBDSEFOTkVMUyA9IGNoYW5uZWxDb3VudChGT1JNQVQpO1xuXG5cdGNvbnN0IHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfSA9IHt9O1xuXHRjb25zdCBiaW5kaW5nTGF5b3V0OiB7IFtrZXk6IG51bWJlcl06IEdQVVN0b3JhZ2VUZXh0dXJlQmluZGluZ0xheW91dCB9ID0ge307XG5cdGNvbnN0IGRlcHRoT3JBcnJheUxheWVycyA9IHNpemUuZGVwdGhPckFycmF5TGF5ZXJzIHx8IHt9O1xuXG5cdGJpbmRpbmdzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdHRleHR1cmVzW2tleV0gPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcblx0XHRcdGZvcm1hdDogRk9STUFULFxuXHRcdFx0c2l6ZToge1xuXHRcdFx0XHR3aWR0aDogc2l6ZS53aWR0aCxcblx0XHRcdFx0aGVpZ2h0OiBzaXplLmhlaWdodCxcblx0XHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOlxuXHRcdFx0XHRcdGtleSBpbiBkZXB0aE9yQXJyYXlMYXllcnMgPyBkZXB0aE9yQXJyYXlMYXllcnNba2V5XSA6IDEsXG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9KTtcblxuXHRPYmplY3Qua2V5cyh0ZXh0dXJlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0Y29uc3QgbGF5ZXJzID1cblx0XHRcdGtleSBpbiBkZXB0aE9yQXJyYXlMYXllcnMgPyBkZXB0aE9yQXJyYXlMYXllcnNbcGFyc2VJbnQoa2V5KV0gOiAxO1xuXG5cdFx0YmluZGluZ0xheW91dFtwYXJzZUludChrZXkpXSA9IHtcblx0XHRcdGZvcm1hdDogRk9STUFULFxuXHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdHZpZXdEaW1lbnNpb246IGxheWVycyA+IDEgPyBcIjJkLWFycmF5XCIgOiBcIjJkXCIsXG5cdFx0fTtcblxuXHRcdGNvbnN0IGFycmF5ID1cblx0XHRcdGtleSBpbiBkYXRhXG5cdFx0XHRcdD8gbmV3IEZsb2F0MzJBcnJheShmbGF0dGVuKGRhdGFbcGFyc2VJbnQoa2V5KV0pKVxuXHRcdFx0XHQ6IG5ldyBGbG9hdDMyQXJyYXkoXG5cdFx0XHRcdFx0XHRmbGF0dGVuKHplcm9zKHNpemUuaGVpZ2h0LCBzaXplLndpZHRoLCBsYXllcnMpKVxuXHRcdFx0XHQgICk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdFx0eyB0ZXh0dXJlOiB0ZXh0dXJlc1twYXJzZUludChrZXkpXSB9LFxuXHRcdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdFx0LypkYXRhTGF5b3V0PSovIHtcblx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRcdHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQsXG5cdFx0XHR9LFxuXHRcdFx0LypzaXplPSovIHtcblx0XHRcdFx0d2lkdGg6IHNpemUud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogc2l6ZS5oZWlnaHQsXG5cdFx0XHRcdGRlcHRoT3JBcnJheUxheWVyczogbGF5ZXJzLFxuXHRcdFx0fVxuXHRcdCk7XG5cdH0pO1xuXG5cdGxldCBjYW52YXNEYXRhID0gbmV3IFVpbnQzMkFycmF5KFtzaXplLndpZHRoLCBzaXplLmhlaWdodCwgMCwgMF0pO1xuXHRjb25zdCBjYW52YXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJDYW52YXMgQnVmZmVyXCIsXG5cdFx0c2l6ZTogY2FudmFzRGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihjYW52YXNCdWZmZXIsIC8qb2Zmc2V0PSovIDAsIC8qZGF0YT0qLyBjYW52YXNEYXRhKTtcblxuXHRyZXR1cm4ge1xuXHRcdGNhbnZhczoge1xuXHRcdFx0YnVmZmVyOiBjYW52YXNCdWZmZXIsXG5cdFx0XHRkYXRhOiBjYW52YXNEYXRhLFxuXHRcdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdFx0fSxcblx0XHR0ZXh0dXJlczogdGV4dHVyZXMsXG5cdFx0YmluZGluZ0xheW91dDogYmluZGluZ0xheW91dCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuKG5lc3RlZEFycmF5OiBudW1iZXJbXVtdW10pOiBudW1iZXJbXSB7XG5cdGNvbnN0IGZsYXR0ZW5lZCA9IFtdO1xuXHRmb3IgKGxldCBrID0gMDsgayA8IG5lc3RlZEFycmF5WzBdWzBdLmxlbmd0aDsgaysrKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRBcnJheS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBuZXN0ZWRBcnJheVswXS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRmbGF0dGVuZWQucHVzaChuZXN0ZWRBcnJheVtpXVtqXVtrXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZsYXR0ZW5lZDtcbn1cblxuZnVuY3Rpb24gemVyb3MoXG5cdGhlaWdodDogbnVtYmVyLFxuXHR3aWR0aDogbnVtYmVyLFxuXHRsYXllcnM6IG51bWJlciA9IDFcbik6IG51bWJlcltdW11bXSB7XG5cdGNvbnN0IHplcm9BcnJheSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcblx0XHRjb25zdCByb3cgPSBbXTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcblx0XHRcdGNvbnN0IGxheWVyID0gW107XG5cdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IGxheWVyczsgaysrKSB7XG5cdFx0XHRcdGxheWVyLnB1c2goMCk7XG5cdFx0XHR9XG5cdFx0XHRyb3cucHVzaChsYXllcik7XG5cdFx0fVxuXHRcdHplcm9BcnJheS5wdXNoKHJvdyk7XG5cdH1cblxuXHRyZXR1cm4gemVyb0FycmF5O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogbnVtYmVyID0gMTAwXG4pOiB7XG5cdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcblx0bGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuXHR2YXIgc2lnbiA9IDE7XG5cblx0bGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG5cdGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG5cdGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG5cdGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuXHRcdC8vIGRpc2FibGUgY29udGV4dCBtZW51XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIGV2ZW50c1xuXHRcdFtcIm1vdXNlbW92ZVwiLCBcInRvdWNobW92ZVwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC5vZmZzZXRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCB4ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGxldCB5ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi55IC8gY2FudmFzLmhlaWdodCkgKiB0ZXh0dXJlLmhlaWdodFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRkYXRhLnNldChbeCwgeV0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIHpvb20gZXZlbnRzIFRPRE8oQGdzemVwKSBhZGQgcGluY2ggYW5kIHNjcm9sbCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIndoZWVsXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS54ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS55ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaXplICs9IHZlbG9jaXR5Lnk7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyBjbGljayBldmVudHMgVE9ETyhAZ3N6ZXApIGltcGxlbWVudCByaWdodCBjbGljayBlcXVpdmFsZW50IGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wibW91c2Vkb3duXCIsIFwidG91Y2hzdGFydFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IDEgLSBldmVudC5idXR0b247XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSA/IC0xIDogMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpZ24gKiBzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdFtcIm1vdXNldXBcIiwgXCJ0b3VjaGVuZFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW05hTl0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXHRjb25zdCB1bmlmb3JtQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiSW50ZXJhY3Rpb24gQnVmZmVyXCIsXG5cdFx0c2l6ZTogZGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YnVmZmVyOiB1bmlmb3JtQnVmZmVyLFxuXHRcdGRhdGE6IGRhdGEsXG5cdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoYW5uZWxDb3VudChmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQpOiBudW1iZXIge1xuXHRpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiYVwiKSkge1xuXHRcdHJldHVybiA0O1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYlwiKSkge1xuXHRcdHJldHVybiAzO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnXCIpKSB7XG5cdFx0cmV0dXJuIDI7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwiclwiKSkge1xuXHRcdHJldHVybiAxO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZm9ybWF0OiBcIiArIGZvcm1hdCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcHJlcGVuZEluY2x1ZGVzKGNvZGU6IHN0cmluZywgaW5jbHVkZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcblx0Y29kZSA9IGNvZGUucmVwbGFjZSgvXiNpbXBvcnQuKi9nbSwgXCJcIik7XG5cdHJldHVybiBpbmNsdWRlcy5yZWR1Y2UoKGFjYywgaW5jbHVkZSkgPT4gaW5jbHVkZSArIFwiXFxuXCIgKyBhY2MsIGNvZGUpO1xufVxuXG5leHBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0cHJlcGVuZEluY2x1ZGVzLFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==