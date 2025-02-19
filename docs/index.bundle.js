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
/* harmony import */ var _shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shaders/timestep.comp.wgsl */ "./src/shaders/timestep.comp.wgsl");






const UPDATE_INTERVAL = 1;
let frame_index = 0;
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
    const VORTICITY = 0;
    const STREAMFUNCTION = 1;
    const DEBUG = 3;
    const INTERACTION = 2;
    const CANVAS = 4;
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, [VORTICITY, STREAMFUNCTION, DEBUG], {}, canvas.size);
    const WORKGROUP_SIZE = 16;
    const DISPATCH_SIZE = 2 * WORKGROUP_SIZE - 2;
    const WORKGROUP_COUNT = [
        Math.ceil(textures.size.width / DISPATCH_SIZE),
        Math.ceil(textures.size.height / DISPATCH_SIZE),
    ];
    // setup interactions
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
                binding: DEBUG,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
            {
                binding: INTERACTION,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "uniform",
                },
            },
            {
                binding: CANVAS,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                buffer: {
                    type: "uniform",
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
                binding: DEBUG,
                resource: textures.textures[DEBUG].createView(),
            },
            {
                binding: INTERACTION,
                resource: {
                    buffer: interactions.buffer,
                },
            },
            {
                binding: CANVAS,
                resource: {
                    buffer: textures.canvas,
                },
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
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__, [
                    _shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__,
                    _shaders_includes_cache_wgsl__WEBPACK_IMPORTED_MODULE_2__,
                ]),
            }),
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
    maxStorageTexturesPerShaderStage: 8,
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
function setupTextures(device, bindings, data, size, format = {
    storage: "r32float",
}) {
    const CHANNELS = channelCount(format.storage);
    const textures = {};
    bindings.forEach((key) => {
        textures[key] = device.createTexture({
            label: `Texture ${key}`,
            size: [size.width, size.height],
            format: format.storage,
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
        });
    });
    Object.keys(textures).forEach((key) => {
        const random = new Array(size.width * size.height);
        for (let i = 0; i < size.width * size.height; i++) {
            random[i] = [];
            for (let j = 0; j < CHANNELS; j++) {
                random[i].push(2 * Math.random() - 1);
            }
        }
        const array = key in data
            ? new Float32Array(data[parseInt(key)].flat())
            : new Float32Array(random.flat());
        device.queue.writeTexture({ texture: textures[parseInt(key)] }, 
        /*data=*/ array, 
        /*dataLayout=*/ {
            offset: 0,
            bytesPerRow: size.width * array.BYTES_PER_ELEMENT * CHANNELS,
            rowsPerImage: size.height,
        }, 
        /*size=*/ size);
    });
    let canvas = new Uint32Array([size.width, size.height]);
    const canvasBuffer = device.createBuffer({
        label: "Canvas Buffer",
        size: canvas.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(canvasBuffer, /*offset=*/ 0, /*data=*/ canvas);
    return {
        canvas: canvasBuffer,
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n  };\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    // vorticity map\n    let omega = textureLoad(omega, x);\n    output.color.g = 5.0 * max(0.0, omega.r);\n    output.color.r = 5.0 * max(0.0, -omega.r);\n\n    // stream function map\n    let phi = textureLoad(phi, x);\n    // output.color.b = abs(phi.r);\n\n    // debug map\n    // let debug = textureLoad(debug, x);\n    output.color.a = 1.0;\n    return output;\n}";

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

module.exports = "const GROUP_INDEX = 0;\nconst VERTEX_INDEX = 0;\nconst RENDER_INDEX = 0;\n\nconst VORTICITY = 0u;\nconst STREAMFUNCTION = 1u;\nconst DEBUG = 3u;\n\nconst INTERACTION = 2;\nconst CANVAS = 4;";

/***/ }),

/***/ "./src/shaders/includes/cache.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/includes/cache.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n};\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 16u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\nvar<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 2>;\n\nfn update_cache(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n            let index = get_index(id, tile_x, tile_y);\n\n            cache[idx][index.local.x][index.local.y] = load_value(F, index.global).r;\n        }\n    }\n}\n\nfn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, vec2<i32>(y % canvas.size));  // periodic boundary conditions\n}\n\nfn get_bounds(id: Invocation) -> vec4<u32> {\n    return vec4<u32>(\n        DISPATCH_SIZE * id.workGroupID.xy,\n        min(canvas.size, DISPATCH_SIZE * (id.workGroupID.xy + 1u))\n    );\n}\n\nfn check_bounds(index: Index, bounds: vec4<u32>) -> bool {\n    return all(index.global >= bounds.xy) && all(index.global < bounds.zw);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/timestep.comp.wgsl":
/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;\n\nfn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {\n    return cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4.0 * cached_value(F, x);\n}\n\nfn curl(F: u32, x: vec2<u32>) -> vec2<f32> {\n\n    let u = (cached_value(F, x + dy) - cached_value(F, x - dy)) / 2.0;\n    let v = (cached_value(F, x - dx) - cached_value(F, x + dx)) / 2.0;\n\n    return vec2<f32>(u.x, v.x);\n}\n\nfn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {\n    return (1.0 - relaxation) * cached_value(F, x) + (relaxation / 4.0) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));\n}\n\nfn advected_value(F: u32, x: vec2<u32>, dt: f32) -> vec4<f32> {\n    let y = vec2<f32>(x) - curl(STREAMFUNCTION, x) * dt;\n    return interpolate_value(F, y);\n}\n\nfn interpolate_value(F: u32, x: vec2<f32>) -> vec4<f32> {\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value(F, y),\n            cached_value(F, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value(F, y + dy),\n            cached_value(F, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(id: Invocation) {\n    let bounds = get_bounds(id);\n\n    // vorticity timestep\n    update_cache(id, VORTICITY, omega);\n    update_cache(id, STREAMFUNCTION, phi);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index, bounds) {\n\n                // brush interaction\n                let distance = vec2<f32>(index.global) - interaction.position;\n                let norm = dot(distance, distance);\n\n                var brush = 0.0;\n                if sqrt(norm) < abs(interaction.size) {\n                    brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n                }\n\n                // advection + diffusion\n                let omega_update = advected_value(VORTICITY, index.local, 0.1) + laplacian(VORTICITY, index.local) * 0.01 + brush;\n                textureStore(omega, vec2<i32>(index.global), omega_update);\n            }\n        }\n    }\n\n    update_cache(id, VORTICITY, omega);\n    workgroupBarrier();\n\n    // solve poisson equation for stream function\n    const relaxation = 1.0;\n    for (var n = 0; n < 50; n++) {\n\n        update_cache(id, STREAMFUNCTION, phi);\n        workgroupBarrier();\n\n        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n                let index = get_index(id, tile_x, tile_y);\n                if check_bounds(index, bounds) {\n\n                    let phi_update = jacobi_iteration(STREAMFUNCTION, VORTICITY, index.local, relaxation);\n                    textureStore(phi, vec2<i32>(index.global), phi_update);\n                }\n            }\n        }\n    }\n\n    // update_cache(id, STREAMFUNCTION, phi);\n    // workgroupBarrier();\n\n    // // debug\n    // for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n    //     for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n    //         let index = get_index(id, tile_x, tile_y);\n    //         if check_bounds(index, bounds) {\n\n    //             let error = abs(cached_value(VORTICITY, index.local) + laplacian(STREAMFUNCTION, index.local));\n    //             textureStore(debug, index.global, error);\n    //         }\n    //     }\n    // }\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBRSxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25DLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLENBQUM7UUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7QUFDRixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBWSxFQUFFLFFBQWtCO0lBQ3hELElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBiaW5kaW5ncyBmcm9tIFwiLi9zaGFkZXJzL2luY2x1ZGVzL2JpbmRpbmdzLndnc2xcIjtcbmltcG9ydCBjYWNoZVV0aWxzIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvY2FjaGUud2dzbFwiO1xuXG5pbXBvcnQgY2VsbFZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwudmVydC53Z3NsXCI7XG5pbXBvcnQgY2VsbEZyYWdtZW50U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC5mcmFnLndnc2xcIjtcbmltcG9ydCB0aW1lc3RlcENvbXB1dGVTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy90aW1lc3RlcC5jb21wLndnc2xcIjtcblxuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMTtcbmxldCBmcmFtZV9pbmRleCA9IDA7XG5cbmFzeW5jIGZ1bmN0aW9uIGluZGV4KCk6IFByb21pc2U8dm9pZD4ge1xuXHQvLyBzZXR1cCBhbmQgY29uZmlndXJlIFdlYkdQVVxuXHRjb25zdCBkZXZpY2UgPSBhd2FpdCByZXF1ZXN0RGV2aWNlKCk7XG5cdGNvbnN0IGNhbnZhcyA9IGNvbmZpZ3VyZUNhbnZhcyhkZXZpY2UpO1xuXG5cdC8vIGluaXRpYWxpemUgdmVydGV4IGJ1ZmZlciBhbmQgdGV4dHVyZXNcblx0Y29uc3QgUVVBRCA9IFstMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSwgLTEsIDEsIDEsIC0xLCAxXTtcblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKGRldmljZSwgXCJRdWFkIFZlcnRleCBCdWZmZXJcIiwgUVVBRCk7XG5cblx0Y29uc3QgR1JPVVBfSU5ERVggPSAwO1xuXHRjb25zdCBWRVJURVhfSU5ERVggPSAwO1xuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXG5cdGNvbnN0IFZPUlRJQ0lUWSA9IDA7XG5cdGNvbnN0IFNUUkVBTUZVTkNUSU9OID0gMTtcblx0Y29uc3QgREVCVUcgPSAzO1xuXG5cdGNvbnN0IElOVEVSQUNUSU9OID0gMjtcblx0Y29uc3QgQ0FOVkFTID0gNDtcblxuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoXG5cdFx0ZGV2aWNlLFxuXHRcdFtWT1JUSUNJVFksIFNUUkVBTUZVTkNUSU9OLCBERUJVR10sXG5cdFx0e30sXG5cdFx0Y2FudmFzLnNpemVcblx0KTtcblxuXHRjb25zdCBXT1JLR1JPVVBfU0laRSA9IDE2O1xuXHRjb25zdCBESVNQQVRDSF9TSVpFID0gMiAqIFdPUktHUk9VUF9TSVpFIC0gMjtcblxuXHRjb25zdCBXT1JLR1JPVVBfQ09VTlQ6IFtudW1iZXIsIG51bWJlcl0gPSBbXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUud2lkdGggLyBESVNQQVRDSF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBESVNQQVRDSF9TSVpFKSxcblx0XTtcblxuXHQvLyBzZXR1cCBpbnRlcmFjdGlvbnNcblx0Y29uc3QgaW50ZXJhY3Rpb25zID0gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdFx0ZGV2aWNlLFxuXHRcdGNhbnZhcy5jb250ZXh0LmNhbnZhcyxcblx0XHR0ZXh0dXJlcy5zaXplXG5cdCk7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBWT1JUSUNJVFksXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBTVFJFQU1GVU5DVElPTixcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IERFQlVHLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT04sXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjoge1xuXHRcdFx0XHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogQ0FOVkFTLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjoge1xuXHRcdFx0XHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBiaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRsYWJlbDogYEJpbmQgR3JvdXBgLFxuXHRcdGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogVk9SVElDSVRZLFxuXHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbVk9SVElDSVRZXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBTVFJFQU1GVU5DVElPTixcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW1NUUkVBTUZVTkNUSU9OXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBERUJVRyxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW0RFQlVHXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTixcblx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBDQU5WQVMsXG5cdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0YnVmZmVyOiB0ZXh0dXJlcy5jYW52YXMsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZVBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwgW1xuXHRcdFx0XHRcdGJpbmRpbmdzLFxuXHRcdFx0XHRcdGNhY2hlVXRpbHMsXG5cdFx0XHRcdF0pLFxuXHRcdFx0fSksXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgcmVuZGVyUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInJlbmRlclBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHR2ZXJ0ZXg6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsVmVydGV4U2hhZGVyLCBbYmluZGluZ3NdKSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbFZlcnRleFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHRidWZmZXJzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhcnJheVN0cmlkZTogcXVhZC5hcnJheVN0cmlkZSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZvcm1hdDogcXVhZC5mb3JtYXQsXG5cdFx0XHRcdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0XHRcdFx0c2hhZGVyTG9jYXRpb246IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRmcmFnbWVudDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKGNlbGxGcmFnbWVudFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3JtYXQ6IGNhbnZhcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdGxvYWRPcDogXCJsb2FkXCIsXG5cdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0fSxcblx0XTtcblx0Y29uc3QgcmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG5cdFx0Y29sb3JBdHRhY2htZW50czogY29sb3JBdHRhY2htZW50cyxcblx0fTtcblxuXHRmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Ly8gY29tcHV0ZSBwYXNzXG5cdFx0Y29uc3QgY29tcHV0ZVBhc3MgPSBjb21tYW5kLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblxuXHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdFx0aW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdC8qb2Zmc2V0PSovIDAsXG5cdFx0XHQvKmRhdGE9Ki8gaW50ZXJhY3Rpb25zLmRhdGFcblx0XHQpO1xuXG5cdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cdFx0Y29tcHV0ZVBhc3MuZW5kKCk7XG5cblx0XHQvLyByZW5kZXIgcGFzc1xuXHRcdGNvbnN0IHRleHR1cmUgPSBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuXHRcdGNvbnN0IHZpZXcgPSB0ZXh0dXJlLmNyZWF0ZVZpZXcoKTtcblxuXHRcdHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHNbUkVOREVSX0lOREVYXS52aWV3ID0gdmlldztcblx0XHRjb25zdCByZW5kZXJQYXNzID0gY29tbWFuZC5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuXG5cdFx0cmVuZGVyUGFzcy5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cCk7XG5cdFx0cmVuZGVyUGFzcy5zZXRWZXJ0ZXhCdWZmZXIoVkVSVEVYX0lOREVYLCBxdWFkLnZlcnRleEJ1ZmZlcik7XG5cdFx0cmVuZGVyUGFzcy5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlclBhc3MuZW5kKCk7XG5cblx0XHQvLyBzdWJtaXQgdGhlIGNvbW1hbmQgYnVmZmVyXG5cdFx0ZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZC5maW5pc2goKV0pO1xuXHRcdHRleHR1cmUuZGVzdHJveSgpO1xuXHRcdGZyYW1lX2luZGV4Kys7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZW5kZXIsIFVQREFURV9JTlRFUlZBTCk7XG5cdHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsImZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG5cdG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHtcblx0XHRwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiLFxuXHR9LFxuXHRyZXF1aXJlZEZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW10sXG5cdHJlcXVpcmVkTGltaXRzOiBSZWNvcmQ8c3RyaW5nLCB1bmRlZmluZWQgfCBudW1iZXI+ID0ge1xuXHRcdG1heFN0b3JhZ2VUZXh0dXJlc1BlclNoYWRlclN0YWdlOiA4LFxuXHR9XG4pOiBQcm9taXNlPEdQVURldmljZT4ge1xuXHRpZiAoIW5hdmlnYXRvci5ncHUpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJXZWJHUFUgTk9UIFN1cHBvcnRlZFwiKTtcblxuXHRjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcihvcHRpb25zKTtcblx0aWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cblx0cmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSh7XG5cdFx0cmVxdWlyZWRGZWF0dXJlczogcmVxdWlyZWRGZWF0dXJlcyxcblx0XHRyZXF1aXJlZExpbWl0czogcmVxdWlyZWRMaW1pdHMsXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBjb25maWd1cmVDYW52YXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRzaXplID0geyB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IH1cbik6IHtcblx0Y29udGV4dDogR1BVQ2FudmFzQ29udGV4dDtcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgY2FudmFzID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLCBzaXplKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG5cdGNvbnN0IGNvbnRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiY2FudmFzXCIpIS5nZXRDb250ZXh0KFwid2ViZ3B1XCIpO1xuXHRpZiAoIWNvbnRleHQpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJDYW52YXMgZG9lcyBub3Qgc3VwcG9ydCBXZWJHUFVcIik7XG5cblx0Y29uc3QgZm9ybWF0ID0gbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKTtcblx0Y29udGV4dC5jb25maWd1cmUoe1xuXHRcdGRldmljZTogZGV2aWNlLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG5cdFx0YWxwaGFNb2RlOiBcInByZW11bHRpcGxpZWRcIixcblx0fSk7XG5cblx0cmV0dXJuIHsgY29udGV4dDogY29udGV4dCwgZm9ybWF0OiBmb3JtYXQsIHNpemU6IHNpemUgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBWZXJ0ZXhCdWZmZXIoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRsYWJlbDogc3RyaW5nLFxuXHRkYXRhOiBudW1iZXJbXVxuKToge1xuXHR2ZXJ0ZXhCdWZmZXI6IEdQVUJ1ZmZlcjtcblx0dmVydGV4Q291bnQ6IG51bWJlcjtcblx0YXJyYXlTdHJpZGU6IG51bWJlcjtcblx0Zm9ybWF0OiBHUFVWZXJ0ZXhGb3JtYXQ7XG59IHtcblx0Y29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXHRjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogbGFiZWwsXG5cdFx0c2l6ZTogYXJyYXkuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVkVSVEVYIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHR2ZXJ0ZXhCdWZmZXIsXG5cdFx0LypidWZmZXJPZmZzZXQ9Ki8gMCxcblx0XHQvKmRhdGE9Ki8gYXJyYXlcblx0KTtcblx0cmV0dXJuIHtcblx0XHR2ZXJ0ZXhCdWZmZXI6IHZlcnRleEJ1ZmZlcixcblx0XHR2ZXJ0ZXhDb3VudDogYXJyYXkubGVuZ3RoIC8gMixcblx0XHRhcnJheVN0cmlkZTogMiAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuXHRcdGZvcm1hdDogXCJmbG9hdDMyeDJcIixcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUZXh0dXJlcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGJpbmRpbmdzOiBudW1iZXJbXSxcblx0ZGF0YTogeyBba2V5OiBudW1iZXJdOiBudW1iZXJbXSB9LFxuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdGZvcm1hdDoge1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdH0gPSB7XG5cdFx0c3RvcmFnZTogXCJyMzJmbG9hdFwiLFxuXHR9XG4pOiB7XG5cdGNhbnZhczogR1BVQnVmZmVyO1xuXHR0ZXh0dXJlczogeyBba2V5OiBudW1iZXJdOiBHUFVUZXh0dXJlIH07XG5cdGZvcm1hdDoge1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdH07XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCBDSEFOTkVMUyA9IGNoYW5uZWxDb3VudChmb3JtYXQuc3RvcmFnZSk7XG5cblx0Y29uc3QgdGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9ID0ge307XG5cdGJpbmRpbmdzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdHRleHR1cmVzW2tleV0gPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHRsYWJlbDogYFRleHR1cmUgJHtrZXl9YCxcblx0XHRcdHNpemU6IFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0sXG5cdFx0XHRmb3JtYXQ6IGZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QsXG5cdFx0fSk7XG5cdH0pO1xuXG5cdE9iamVjdC5rZXlzKHRleHR1cmVzKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRjb25zdCByYW5kb20gPSBuZXcgQXJyYXkoc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0KTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0XHRyYW5kb21baV0gPSBbXTtcblxuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBDSEFOTkVMUzsgaisrKSB7XG5cdFx0XHRcdHJhbmRvbVtpXS5wdXNoKDIgKiBNYXRoLnJhbmRvbSgpIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXJyYXkgPVxuXHRcdFx0a2V5IGluIGRhdGFcblx0XHRcdFx0PyBuZXcgRmxvYXQzMkFycmF5KGRhdGFbcGFyc2VJbnQoa2V5KV0uZmxhdCgpKVxuXHRcdFx0XHQ6IG5ldyBGbG9hdDMyQXJyYXkocmFuZG9tLmZsYXQoKSk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdFx0eyB0ZXh0dXJlOiB0ZXh0dXJlc1twYXJzZUludChrZXkpXSB9LFxuXHRcdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdFx0LypkYXRhTGF5b3V0PSovIHtcblx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRcdHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQsXG5cdFx0XHR9LFxuXHRcdFx0LypzaXplPSovIHNpemVcblx0XHQpO1xuXHR9KTtcblxuXHRsZXQgY2FudmFzID0gbmV3IFVpbnQzMkFycmF5KFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0pO1xuXHRjb25zdCBjYW52YXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJDYW52YXMgQnVmZmVyXCIsXG5cdFx0c2l6ZTogY2FudmFzLmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGNhbnZhc0J1ZmZlciwgLypvZmZzZXQ9Ki8gMCwgLypkYXRhPSovIGNhbnZhcyk7XG5cblx0cmV0dXJuIHtcblx0XHRjYW52YXM6IGNhbnZhc0J1ZmZlcixcblx0XHR0ZXh0dXJlczogdGV4dHVyZXMsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0c2l6ZTogc2l6ZSxcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgT2Zmc2NyZWVuQ2FudmFzLFxuXHR0ZXh0dXJlOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdHNpemU6IG51bWJlciA9IDEwMFxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcblx0dmFyIHNpZ24gPSAxO1xuXG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbcG9zaXRpb24ueCwgcG9zaXRpb24ueV0pO1xuXHRpZiAoY2FudmFzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcblx0XHQvLyBkaXNhYmxlIGNvbnRleHQgbWVudVxuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgeCA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueSAvIGNhbnZhcy5oZWlnaHQpICogdGV4dHVyZS5oZWlnaHRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyB6b29tIGV2ZW50cyBUT0RPKEBnc3plcCkgYWRkIHBpbmNoIGFuZCBzY3JvbGwgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJ3aGVlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2l6ZSArPSB2ZWxvY2l0eS55O1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY2xpY2sgZXZlbnRzIFRPRE8oQGdzemVwKSBpbXBsZW1lbnQgcmlnaHQgY2xpY2sgZXF1aXZhbGVudCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSAxIC0gZXZlbnQuYnV0dG9uO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaWduICogc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRbXCJtb3VzZXVwXCIsIFwidG91Y2hlbmRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtOYU5dLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByZXBlbmRJbmNsdWRlcyhjb2RlOiBzdHJpbmcsIGluY2x1ZGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG5cdGNvZGUgPSBjb2RlLnJlcGxhY2UoL14jaW1wb3J0LiovZ20sIFwiXCIpO1xuXHRyZXR1cm4gaW5jbHVkZXMucmVkdWNlKChhY2MsIGluY2x1ZGUpID0+IGluY2x1ZGUgKyBcIlxcblwiICsgYWNjLCBjb2RlKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=