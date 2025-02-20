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
    const XVELOCITY = 2;
    const YVELOCITY = 3;
    const XMAP = 4;
    const YMAP = 5;
    const INTERACTION = 6;
    const CANVAS = 7;
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, [VORTICITY, STREAMFUNCTION, XVELOCITY, YVELOCITY, XMAP, YMAP], {}, { width: canvas.size.width, height: canvas.size.height });
    const WORKGROUP_SIZE = 16;
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
                binding: XVELOCITY,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
            {
                binding: YVELOCITY,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
            {
                binding: XMAP,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: "read-write",
                    format: textures.format.storage,
                },
            },
            {
                binding: YMAP,
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
                binding: XVELOCITY,
                resource: textures.textures[XVELOCITY].createView(),
            },
            {
                binding: YVELOCITY,
                resource: textures.textures[YVELOCITY].createView(),
            },
            {
                binding: XMAP,
                resource: textures.textures[XMAP].createView(),
            },
            {
                binding: YMAP,
                resource: textures.textures[YMAP].createView(),
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n  };\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(XVELOCITY) var xvelocity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(YVELOCITY) var yvelocity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    // vorticity map\n    let omega = textureLoad(vorticity, x);\n    output.color.g = 5.0 * max(0.0, omega.r);\n    output.color.r = 5.0 * max(0.0, -omega.r);\n\n    // stream function map\n    // let phi = textureLoad(phi, x);\n    // output.color.b = abs(phi.r);\n\n    // debug map\n    // let debug = textureLoad(debug, x);\n    output.color.a = 1.0;\n    return output;\n}";

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

module.exports = "const GROUP_INDEX = 0;\nconst VERTEX_INDEX = 0;\nconst RENDER_INDEX = 0;\n\nconst VORTICITY = 0u;\nconst STREAMFUNCTION = 1u;\nconst XVELOCITY = 2u;\nconst YVELOCITY = 3u;\nconst XMAP = 4u;\nconst YMAP = 5u;\n\nconst INTERACTION = 6;\nconst CANVAS = 7;";

/***/ }),

/***/ "./src/shaders/includes/cache.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/includes/cache.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n};\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 16u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\nvar<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 4>;\n\nfn update_cache(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n            let index = get_index(id, tile_x, tile_y);\n\n            cache[idx][index.local.x][index.local.y] = load_value(F, index.global).r;\n        }\n    }\n}\n\nfn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, vec2<i32>(y % canvas.size));  // periodic boundary conditions\n}\n\nfn get_bounds(id: Invocation) -> vec4<u32> {\n    return vec4<u32>(\n        DISPATCH_SIZE * id.workGroupID.xy,\n        min(canvas.size, DISPATCH_SIZE * (id.workGroupID.xy + 1u))\n    );\n}\n\nfn check_bounds(index: Index, bounds: vec4<u32>) -> bool {\n    return all(index.global >= bounds.xy) && all(index.global < bounds.zw);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/timestep.comp.wgsl":
/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(XVELOCITY) var xvelocity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(YVELOCITY) var yvelocity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;\n\nfn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {\n    return cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4.0 * cached_value(F, x);\n}\n\nfn velocity(x: vec2<u32>) -> vec2<f32> {\n\n    let u = (cached_value(STREAMFUNCTION, x + dy) - cached_value(STREAMFUNCTION, x - dy)) / 2.0;\n    let v = (cached_value(STREAMFUNCTION, x - dx) - cached_value(STREAMFUNCTION, x + dx)) / 2.0;\n\n    return vec2<f32>(u.x, v.x);\n}\n\nfn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {\n    return (1.0 - relaxation) * cached_value(F, x) + (relaxation / 4.0) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));\n}\n\nfn advected_value(F: u32, x: vec2<u32>, dt: f32) -> vec4<f32> {\n    let y = vec2<f32>(x) - velocity(x) * dt;\n    return interpolate_value(F, y);\n}\n\nfn interpolate_value(F: u32, x: vec2<f32>) -> vec4<f32> {\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value(F, y),\n            cached_value(F, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value(F, y + dy),\n            cached_value(F, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(id: Invocation) {\n    let bounds = get_bounds(id);\n\n    // vorticity timestep\n    update_cache(id, VORTICITY, vorticity);\n    update_cache(id, STREAMFUNCTION, streamfunction);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index, bounds) {\n\n                // brush interaction\n                let distance = vec2<f32>(index.global) - interaction.position;\n                let norm = dot(distance, distance);\n\n                var brush = 0.0;\n                if sqrt(norm) < abs(interaction.size) {\n                    brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n                }\n\n                // advection + diffusion\n                let vorticity_update = advected_value(VORTICITY, index.local, 0.1) + laplacian(VORTICITY, index.local) * 0.01 + brush;\n                textureStore(vorticity, vec2<i32>(index.global), vorticity_update);\n            }\n        }\n    }\n\n    update_cache(id, VORTICITY, vorticity);\n    workgroupBarrier();\n\n    // solve poisson equation for stream function\n    const relaxation = 1.0;\n    for (var n = 0; n < 50; n++) {\n\n        update_cache(id, STREAMFUNCTION, streamfunction);\n        workgroupBarrier();\n\n        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n                let index = get_index(id, tile_x, tile_y);\n                if check_bounds(index, bounds) {\n\n                    let streamfunction_update = jacobi_iteration(STREAMFUNCTION, VORTICITY, index.local, relaxation);\n                    textureStore(streamfunction, vec2<i32>(index.global), streamfunction_update);\n                }\n            }\n        }\n    }\n\n    // update_cache(id, STREAMFUNCTION, phi);\n    // workgroupBarrier();\n\n    // // debug\n    // for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n    //     for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n    //         let index = get_index(id, tile_x, tile_y);\n    //         if check_bounds(index, bounds) {\n\n    //             let error = abs(cached_value(VORTICITY, index.local) + laplacian(STREAMFUNCTION, index.local));\n    //             textureStore(debug, index.global, error);\n    //         }\n    //     }\n    // }\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LENBQUMsUUFBUTtLQUN2RCxDQUFDLENBQUM7SUFFSCxPQUFPO1FBQ04sTUFBTSxFQUFFLGFBQWE7UUFDckIsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsU0FBUztLQUNmLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7SUFDN0MsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFZLEVBQUUsUUFBa0I7SUFDeEQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFTQyIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IGJpbmRpbmdzIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvYmluZGluZ3Mud2dzbFwiO1xuaW1wb3J0IGNhY2hlVXRpbHMgZnJvbSBcIi4vc2hhZGVycy9pbmNsdWRlcy9jYWNoZS53Z3NsXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3RpbWVzdGVwLmNvbXAud2dzbFwiO1xuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblxuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cblx0Y29uc3QgVk9SVElDSVRZID0gMDtcblx0Y29uc3QgU1RSRUFNRlVOQ1RJT04gPSAxO1xuXHRjb25zdCBYVkVMT0NJVFkgPSAyO1xuXHRjb25zdCBZVkVMT0NJVFkgPSAzO1xuXHRjb25zdCBYTUFQID0gNDtcblx0Y29uc3QgWU1BUCA9IDU7XG5cblx0Y29uc3QgSU5URVJBQ1RJT04gPSA2O1xuXHRjb25zdCBDQU5WQVMgPSA3O1xuXG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhcblx0XHRkZXZpY2UsXG5cdFx0W1ZPUlRJQ0lUWSwgU1RSRUFNRlVOQ1RJT04sIFhWRUxPQ0lUWSwgWVZFTE9DSVRZLCBYTUFQLCBZTUFQXSxcblx0XHR7fSxcblx0XHR7IHdpZHRoOiBjYW52YXMuc2l6ZS53aWR0aCwgaGVpZ2h0OiBjYW52YXMuc2l6ZS5oZWlnaHQgfVxuXHQpO1xuXG5cdGNvbnN0IFdPUktHUk9VUF9TSVpFID0gMTY7XG5cdGNvbnN0IFRJTEVfU0laRSA9IDI7XG5cdGNvbnN0IEhBTE9fU0laRSA9IDE7XG5cblx0Y29uc3QgQ0FDSEVfU0laRSA9IFRJTEVfU0laRSAqIFdPUktHUk9VUF9TSVpFO1xuXHRjb25zdCBESVNQQVRDSF9TSVpFID0gQ0FDSEVfU0laRSAtIDIgKiBIQUxPX1NJWkU7XG5cblx0Y29uc3QgV09SS0dST1VQX0NPVU5UOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLndpZHRoIC8gRElTUEFUQ0hfU0laRSksXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUuaGVpZ2h0IC8gRElTUEFUQ0hfU0laRSksXG5cdF07XG5cblx0Ly8gc2V0dXAgaW50ZXJhY3Rpb25zXG5cdGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKFxuXHRcdGRldmljZSxcblx0XHRjYW52YXMuY29udGV4dC5jYW52YXMsXG5cdFx0dGV4dHVyZXMuc2l6ZVxuXHQpO1xuXG5cdGNvbnN0IGJpbmRHcm91cExheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcImJpbmRHcm91cExheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogVk9SVElDSVRZLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogU1RSRUFNRlVOQ1RJT04sXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBYVkVMT0NJVFksXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBZVkVMT0NJVFksXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBYTUFQLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogWU1BUCxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IElOVEVSQUNUSU9OLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IENBTlZBUyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0bGFiZWw6IGBCaW5kIEdyb3VwYCxcblx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFZPUlRJQ0lUWSxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW1ZPUlRJQ0lUWV0uY3JlYXRlVmlldygpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogU1RSRUFNRlVOQ1RJT04sXG5cdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tTVFJFQU1GVU5DVElPTl0uY3JlYXRlVmlldygpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogWFZFTE9DSVRZLFxuXHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbWFZFTE9DSVRZXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBZVkVMT0NJVFksXG5cdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tZVkVMT0NJVFldLmNyZWF0ZVZpZXcoKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IFhNQVAsXG5cdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tYTUFQXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBZTUFQLFxuXHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbWU1BUF0uY3JlYXRlVmlldygpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT04sXG5cdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0YnVmZmVyOiBpbnRlcmFjdGlvbnMuYnVmZmVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogQ0FOVkFTLFxuXHRcdFx0XHRyZXNvdXJjZToge1xuXHRcdFx0XHRcdGJ1ZmZlcjogdGV4dHVyZXMuY2FudmFzLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIFtcblx0XHRcdFx0XHRiaW5kaW5ncyxcblx0XHRcdFx0XHRjYWNoZVV0aWxzLFxuXHRcdFx0XHRdKSxcblx0XHRcdH0pLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IHJlbmRlclBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZVJlbmRlclBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJyZW5kZXJQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0dmVydGV4OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoY2VsbFZlcnRleFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIFtiaW5kaW5nc10pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBjYW52YXMuZm9ybWF0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXG5cdFx0e1xuXHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRsb2FkT3A6IFwibG9hZFwiLFxuXHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdH0sXG5cdF07XG5cdGNvbnN0IHJlbmRlclBhc3NEZXNjcmlwdG9yID0ge1xuXHRcdGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMsXG5cdH07XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcblxuXHRcdC8vIGNvbXB1dGUgcGFzc1xuXHRcdGNvbnN0IGNvbXB1dGVQYXNzID0gY29tbWFuZC5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShjb21wdXRlUGlwZWxpbmUpO1xuXHRcdGNvbXB1dGVQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3VwKTtcblxuXHRcdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHRcdGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHQvKm9mZnNldD0qLyAwLFxuXHRcdFx0LypkYXRhPSovIGludGVyYWN0aW9ucy5kYXRhXG5cdFx0KTtcblxuXHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXHRcdGNvbXB1dGVQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gcmVuZGVyIHBhc3Ncblx0XHRjb25zdCB0ZXh0dXJlID0gY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKTtcblx0XHRjb25zdCB2aWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KCk7XG5cblx0XHRyZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzW1JFTkRFUl9JTkRFWF0udmlldyA9IHZpZXc7XG5cdFx0Y29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmQuYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcblxuXHRcdHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlclBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXHRcdHJlbmRlclBhc3Muc2V0VmVydGV4QnVmZmVyKFZFUlRFWF9JTkRFWCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0XHR0ZXh0dXJlLmRlc3Ryb3koKTtcblx0XHRmcmFtZV9pbmRleCsrO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCJmdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7XG5cdFx0cG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIixcblx0fSxcblx0cmVxdWlyZWRGZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtdLFxuXHRyZXF1aXJlZExpbWl0czogUmVjb3JkPHN0cmluZywgdW5kZWZpbmVkIHwgbnVtYmVyPiA9IHtcblx0XHRtYXhTdG9yYWdlVGV4dHVyZXNQZXJTaGFkZXJTdGFnZTogOCxcblx0fVxuKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIob3B0aW9ucyk7XG5cdGlmICghYWRhcHRlcikgdGhyb3dEZXRlY3Rpb25FcnJvcihcIk5vIEdQVSBhZGFwdGVyIGZvdW5kXCIpO1xuXG5cdHJldHVybiBhZGFwdGVyLnJlcXVlc3REZXZpY2Uoe1xuXHRcdHJlcXVpcmVkRmVhdHVyZXM6IHJlcXVpcmVkRmVhdHVyZXMsXG5cdFx0cmVxdWlyZWRMaW1pdHM6IHJlcXVpcmVkTGltaXRzLFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0dmVydGV4QnVmZmVyLFxuXHRcdC8qYnVmZmVyT2Zmc2V0PSovIDAsXG5cdFx0LypkYXRhPSovIGFycmF5XG5cdCk7XG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVGV4dHVyZXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRiaW5kaW5nczogbnVtYmVyW10sXG5cdGRhdGE6IHsgW2tleTogbnVtYmVyXTogbnVtYmVyW10gfSxcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRmb3JtYXQ6IHtcblx0XHRzdG9yYWdlOiBHUFVUZXh0dXJlRm9ybWF0O1xuXHR9ID0ge1xuXHRcdHN0b3JhZ2U6IFwicjMyZmxvYXRcIixcblx0fVxuKToge1xuXHRjYW52YXM6IEdQVUJ1ZmZlcjtcblx0dGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9O1xuXHRmb3JtYXQ6IHtcblx0XHRzdG9yYWdlOiBHUFVUZXh0dXJlRm9ybWF0O1xuXHR9O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgQ0hBTk5FTFMgPSBjaGFubmVsQ291bnQoZm9ybWF0LnN0b3JhZ2UpO1xuXG5cdGNvbnN0IHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfSA9IHt9O1xuXHRiaW5kaW5ncy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHR0ZXh0dXJlc1trZXldID0gZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuXHRcdFx0bGFiZWw6IGBUZXh0dXJlICR7a2V5fWAsXG5cdFx0XHRzaXplOiBbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLFxuXHRcdFx0Zm9ybWF0OiBmb3JtYXQuc3RvcmFnZSxcblx0XHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHRcdH0pO1xuXHR9KTtcblxuXHRPYmplY3Qua2V5cyh0ZXh0dXJlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0Y29uc3QgcmFuZG9tID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzaXplLndpZHRoICogc2l6ZS5oZWlnaHQ7IGkrKykge1xuXHRcdFx0cmFuZG9tW2ldID0gW107XG5cblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgQ0hBTk5FTFM7IGorKykge1xuXHRcdFx0XHRyYW5kb21baV0ucHVzaCgyICogTWF0aC5yYW5kb20oKSAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGFycmF5ID1cblx0XHRcdGtleSBpbiBkYXRhXG5cdFx0XHRcdD8gbmV3IEZsb2F0MzJBcnJheShkYXRhW3BhcnNlSW50KGtleSldLmZsYXQoKSlcblx0XHRcdFx0OiBuZXcgRmxvYXQzMkFycmF5KHJhbmRvbS5mbGF0KCkpO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlVGV4dHVyZShcblx0XHRcdHsgdGV4dHVyZTogdGV4dHVyZXNbcGFyc2VJbnQoa2V5KV0gfSxcblx0XHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHRcdC8qZGF0YUxheW91dD0qLyB7XG5cdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0XHRyb3dzUGVySW1hZ2U6IHNpemUuaGVpZ2h0LFxuXHRcdFx0fSxcblx0XHRcdC8qc2l6ZT0qLyBzaXplXG5cdFx0KTtcblx0fSk7XG5cblx0bGV0IGNhbnZhcyA9IG5ldyBVaW50MzJBcnJheShbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdKTtcblx0Y29uc3QgY2FudmFzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiQ2FudmFzIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGNhbnZhcy5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihjYW52YXNCdWZmZXIsIC8qb2Zmc2V0PSovIDAsIC8qZGF0YT0qLyBjYW52YXMpO1xuXG5cdHJldHVybiB7XG5cdFx0Y2FudmFzOiBjYW52YXNCdWZmZXIsXG5cdFx0dGV4dHVyZXM6IHRleHR1cmVzLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHNpemU6IHNpemUsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwSW50ZXJhY3Rpb25zKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0Y2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IE9mZnNjcmVlbkNhbnZhcyxcblx0dGV4dHVyZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRzaXplOiBudW1iZXIgPSAxMDBcbik6IHtcblx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdGRhdGE6IEJ1ZmZlclNvdXJjZSB8IFNoYXJlZEFycmF5QnVmZmVyO1xuXHR0eXBlOiBHUFVCdWZmZXJCaW5kaW5nVHlwZTtcbn0ge1xuXHRsZXQgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG5cdHZhciBzaWduID0gMTtcblxuXHRsZXQgcG9zaXRpb24gPSB7IHg6IDAsIHk6IDAgfTtcblx0bGV0IHZlbG9jaXR5ID0geyB4OiAwLCB5OiAwIH07XG5cblx0ZGF0YS5zZXQoW3Bvc2l0aW9uLngsIHBvc2l0aW9uLnldKTtcblx0aWYgKGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG5cdFx0Ly8gZGlzYWJsZSBjb250ZXh0IG1lbnVcblx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChldmVudCkgPT4ge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgZXZlbnRzXG5cdFx0W1wibW91c2Vtb3ZlXCIsIFwidG91Y2htb3ZlXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQub2Zmc2V0WDtcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50Lm9mZnNldFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueSA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IHggPSBNYXRoLmZsb29yKFxuXHRcdFx0XHRcdFx0KHBvc2l0aW9uLnggLyBjYW52YXMud2lkdGgpICogdGV4dHVyZS53aWR0aFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0bGV0IHkgPSBNYXRoLmZsb29yKFxuXHRcdFx0XHRcdFx0KHBvc2l0aW9uLnkgLyBjYW52YXMuaGVpZ2h0KSAqIHRleHR1cmUuaGVpZ2h0XG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGRhdGEuc2V0KFt4LCB5XSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gem9vbSBldmVudHMgVE9ETyhAZ3N6ZXApIGFkZCBwaW5jaCBhbmQgc2Nyb2xsIGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wid2hlZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFdoZWVsRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHZlbG9jaXR5LnggPSBldmVudC5kZWx0YVk7XG5cdFx0XHRcdFx0XHRcdHZlbG9jaXR5LnkgPSBldmVudC5kZWx0YVk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNpemUgKz0gdmVsb2NpdHkueTtcblx0XHRcdFx0XHRkYXRhLnNldChbc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIGNsaWNrIGV2ZW50cyBUT0RPKEBnc3plcCkgaW1wbGVtZW50IHJpZ2h0IGNsaWNrIGVxdWl2YWxlbnQgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJtb3VzZWRvd25cIiwgXCJ0b3VjaHN0YXJ0XCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuXHRcdFx0XHRcdFx0XHRzaWduID0gMSAtIGV2ZW50LmJ1dHRvbjtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRzaWduID0gZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxID8gLTEgOiAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhLnNldChbc2lnbiAqIHNpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdFx0W1wibW91c2V1cFwiLCBcInRvdWNoZW5kXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRkYXRhLnNldChbTmFOXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJJbnRlcmFjdGlvbiBCdWZmZXJcIixcblx0XHRzaXplOiBkYXRhLmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRidWZmZXI6IHVuaWZvcm1CdWZmZXIsXG5cdFx0ZGF0YTogZGF0YSxcblx0XHR0eXBlOiBcInVuaWZvcm1cIixcblx0fTtcbn1cblxuZnVuY3Rpb24gY2hhbm5lbENvdW50KGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCk6IG51bWJlciB7XG5cdGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JhXCIpKSB7XG5cdFx0cmV0dXJuIDQ7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiXCIpKSB7XG5cdFx0cmV0dXJuIDM7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdcIikpIHtcblx0XHRyZXR1cm4gMjtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyXCIpKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBmb3JtYXQ6IFwiICsgZm9ybWF0KTtcblx0fVxufVxuXG5mdW5jdGlvbiBwcmVwZW5kSW5jbHVkZXMoY29kZTogc3RyaW5nLCBpbmNsdWRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuXHRjb2RlID0gY29kZS5yZXBsYWNlKC9eI2ltcG9ydC4qL2dtLCBcIlwiKTtcblx0cmV0dXJuIGluY2x1ZGVzLnJlZHVjZSgoYWNjLCBpbmNsdWRlKSA9PiBpbmNsdWRlICsgXCJcXG5cIiArIGFjYywgY29kZSk7XG59XG5cbmV4cG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9