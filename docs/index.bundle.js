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
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, [VORTICITY, STREAMFUNCTION, DEBUG], {
        width: 128,
        height: 128,
    });
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
            textureData[i].push(Math.random() > 1 / 2 ? 1 : -1);
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
    let canvas = new Float32Array([size.width, size.height]);
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n  };\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<f32>,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * canvas.size);\n\n    // vorticity map\n    let omega = textureLoad(omega, x);\n    output.color.g = 5.0 * max(0.0, omega.r);\n    output.color.r = 5.0 * max(0.0, -omega.r);\n\n    // stream function map\n    let phi = textureLoad(phi, x);\n    // output.color.b = abs(phi.r);\n\n    // debug map\n    // let debug = textureLoad(debug, x);\n    output.color.a = 1.0;\n    return output;\n}";

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

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n};\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 16u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\nvar<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 2>;\n\nfn update_cache(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n            let index = get_index(id, tile_x, tile_y);\n\n            cache[idx][index.local.x][index.local.y] = load_value(F, index.global).r;\n        }\n    }\n}\n\nfn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, y % canvas.size);  // periodic boundary conditions\n}\n\nfn get_bounds(id: Invocation) -> vec4<u32> {\n    return vec4<u32>(\n        DISPATCH_SIZE * id.workGroupID.xy,\n        min(canvas.size, DISPATCH_SIZE * (id.workGroupID.xy + 1u))\n    );\n}\n\nfn check_bounds(index: Index, bounds: vec4<u32>) -> bool {\n    return all(index.global >= bounds.xy) && all(index.global < bounds.zw);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/timestep.comp.wgsl":
/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\n@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;\n\nfn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {\n    return cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4.0 * cached_value(F, x);\n}\n\nfn curl(F: u32, x: vec2<u32>) -> vec2<f32> {\n    // curl of a scalar field yields a vector defined as (u,v) := (dF/dy, -dF/dx)\n    // we approximate the derivatives using central differences with a staggered grid\n    // where scalar field F is defined at the center and vector components (u,v) are\n    // defined parallel to the edges of the cell.\n    //\n    //              |   F+dy  |      \n    //              |         |    \n    //       ———————|——— u1 ——|———————\n    //              |         |\n    //        F-dx  v0   F   v1   F+dx\n    //              |         |\n    //       ———————|—— u0 ———|———————\n    //              |         |\n    //              |   F-dy  |    \n    //\n    // the resulting vector field is defined at the center.\n    // Bi-linear interpolation is used to approximate.\n\n    let u = (cached_value(F, x + dy) - cached_value(F, x - dy)) / 2.0;\n    let v = (cached_value(F, x - dx) - cached_value(F, x + dx)) / 2.0;\n\n    return vec2<f32>(u.x, v.x);\n}\n\nfn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {\n    return (1.0 - relaxation) * cached_value(F, x) + (relaxation / 4.0) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));\n}\n\nfn advected_value(F: u32, G: u32, x: vec2<u32>, dt: f32) -> vec4<f32> {\n    let y = vec2<f32>(x) - curl(G, x) * dt;\n    return interpolate_value(F, y);\n}\n\nfn interpolate_value(F: u32, x: vec2<f32>) -> vec4<f32> {\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value(F, y),\n            cached_value(F, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value(F, y + dy),\n            cached_value(F, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(id: Invocation) {\n    let bounds = get_bounds(id);\n\n    // vorticity timestep\n    update_cache(id, VORTICITY, omega);\n    update_cache(id, STREAMFUNCTION, phi);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index, bounds) {\n\n                // brush interaction\n                let distance = vec2<f32>(index.global) - interaction.position;\n                let norm = dot(distance, distance);\n\n                var brush = 0.0;\n                if sqrt(norm) < abs(interaction.size) {\n                    brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n                }\n\n                // advection + diffusion\n                let omega_update = advected_value(VORTICITY, STREAMFUNCTION, index.local, 0.0) + laplacian(VORTICITY, index.local) * 0.1 + brush;\n                textureStore(omega, vec2<i32>(index.global), omega_update);\n            }\n        }\n    }\n\n    update_cache(id, VORTICITY, omega);\n    workgroupBarrier();\n\n    // solve poisson equation for stream function\n    const relaxation = 1.0;\n    for (var n = 0u; n < 1u; n++) {\n\n        update_cache(id, STREAMFUNCTION, phi);\n        workgroupBarrier();\n\n        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n                let index = get_index(id, tile_x, tile_y);\n                if check_bounds(index, bounds) {\n\n                    let phi_update = jacobi_iteration(STREAMFUNCTION, VORTICITY, index.local, relaxation);\n                    textureStore(phi, vec2<i32>(index.global), phi_update);\n                }\n            }\n        }\n    }\n\n    // update_cache(id, STREAMFUNCTION, phi);\n    // workgroupBarrier();\n\n    // // debug\n    // for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n    //     for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n    //         let index = get_index(id, tile_x, tile_y);\n    //         if check_bounds(index, bounds) {\n\n    //             let error = abs(cached_value(VORTICITY, index.local) + laplacian(STREAMFUNCTION, index.local));\n    //             textureStore(debug, index.global, error);\n    //         }\n    //     }\n    // }\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUM7UUFDbEMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNGLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFZLEVBQUUsUUFBa0I7SUFDeEQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFTQyIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IGJpbmRpbmdzIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvYmluZGluZ3Mud2dzbFwiO1xuaW1wb3J0IGNhY2hlVXRpbHMgZnJvbSBcIi4vc2hhZGVycy9pbmNsdWRlcy9jYWNoZS53Z3NsXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3RpbWVzdGVwLmNvbXAud2dzbFwiO1xuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblxuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cblx0Y29uc3QgVk9SVElDSVRZID0gMDtcblx0Y29uc3QgU1RSRUFNRlVOQ1RJT04gPSAxO1xuXHRjb25zdCBERUJVRyA9IDM7XG5cblx0Y29uc3QgSU5URVJBQ1RJT04gPSAyO1xuXHRjb25zdCBDQU5WQVMgPSA0O1xuXG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhkZXZpY2UsIFtWT1JUSUNJVFksIFNUUkVBTUZVTkNUSU9OLCBERUJVR10sIHtcblx0XHR3aWR0aDogMTI4LFxuXHRcdGhlaWdodDogMTI4LFxuXHR9KTtcblxuXHRjb25zdCBXT1JLR1JPVVBfU0laRSA9IDE2O1xuXHRjb25zdCBESVNQQVRDSF9TSVpFID0gMiAqIFdPUktHUk9VUF9TSVpFIC0gMjtcblxuXHRjb25zdCBXT1JLR1JPVVBfQ09VTlQ6IFtudW1iZXIsIG51bWJlcl0gPSBbXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUud2lkdGggLyBESVNQQVRDSF9TSVpFKSxcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS5oZWlnaHQgLyBESVNQQVRDSF9TSVpFKSxcblx0XTtcblxuXHQvLyBzZXR1cCBpbnRlcmFjdGlvbnNcblx0Y29uc3QgaW50ZXJhY3Rpb25zID0gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdFx0ZGV2aWNlLFxuXHRcdGNhbnZhcy5jb250ZXh0LmNhbnZhcyxcblx0XHR0ZXh0dXJlcy5zaXplXG5cdCk7XG5cblx0Y29uc3QgYmluZEdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiYmluZEdyb3VwTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBWT1JUSUNJVFksXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0c3RvcmFnZVRleHR1cmU6IHtcblx0XHRcdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBTVFJFQU1GVU5DVElPTixcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IERFQlVHLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtd3JpdGVcIixcblx0XHRcdFx0XHRmb3JtYXQ6IHRleHR1cmVzLmZvcm1hdC5zdG9yYWdlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogSU5URVJBQ1RJT04sXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjoge1xuXHRcdFx0XHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogQ0FOVkFTLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjoge1xuXHRcdFx0XHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBiaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRsYWJlbDogYEJpbmQgR3JvdXBgLFxuXHRcdGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogVk9SVElDSVRZLFxuXHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbVk9SVElDSVRZXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBTVFJFQU1GVU5DVElPTixcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW1NUUkVBTUZVTkNUSU9OXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBERUJVRyxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW0RFQlVHXS5jcmVhdGVWaWV3KCksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBJTlRFUkFDVElPTixcblx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRidWZmZXI6IGludGVyYWN0aW9ucy5idWZmZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBDQU5WQVMsXG5cdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0YnVmZmVyOiB0ZXh0dXJlcy5jYW52YXMsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZVBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwgW1xuXHRcdFx0XHRcdGJpbmRpbmdzLFxuXHRcdFx0XHRcdGNhY2hlVXRpbHMsXG5cdFx0XHRcdF0pLFxuXHRcdFx0fSksXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgcmVuZGVyUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInJlbmRlclBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHR2ZXJ0ZXg6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsVmVydGV4U2hhZGVyLCBbYmluZGluZ3NdKSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbFZlcnRleFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHRidWZmZXJzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhcnJheVN0cmlkZTogcXVhZC5hcnJheVN0cmlkZSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZvcm1hdDogcXVhZC5mb3JtYXQsXG5cdFx0XHRcdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0XHRcdFx0c2hhZGVyTG9jYXRpb246IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRmcmFnbWVudDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKGNlbGxGcmFnbWVudFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3JtYXQ6IGNhbnZhcy5mb3JtYXQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtcblx0XHR7XG5cdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdGxvYWRPcDogXCJsb2FkXCIsXG5cdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0fSxcblx0XTtcblx0Y29uc3QgcmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG5cdFx0Y29sb3JBdHRhY2htZW50czogY29sb3JBdHRhY2htZW50cyxcblx0fTtcblxuXHRmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Ly8gY29tcHV0ZSBwYXNzXG5cdFx0Y29uc3QgY29tcHV0ZVBhc3MgPSBjb21tYW5kLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblxuXHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdFx0aW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdC8qb2Zmc2V0PSovIDAsXG5cdFx0XHQvKmRhdGE9Ki8gaW50ZXJhY3Rpb25zLmRhdGFcblx0XHQpO1xuXG5cdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cdFx0Y29tcHV0ZVBhc3MuZW5kKCk7XG5cblx0XHQvLyByZW5kZXIgcGFzc1xuXHRcdGNvbnN0IHRleHR1cmUgPSBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuXHRcdGNvbnN0IHZpZXcgPSB0ZXh0dXJlLmNyZWF0ZVZpZXcoKTtcblxuXHRcdHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHNbUkVOREVSX0lOREVYXS52aWV3ID0gdmlldztcblx0XHRjb25zdCByZW5kZXJQYXNzID0gY29tbWFuZC5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuXG5cdFx0cmVuZGVyUGFzcy5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cCk7XG5cdFx0cmVuZGVyUGFzcy5zZXRWZXJ0ZXhCdWZmZXIoVkVSVEVYX0lOREVYLCBxdWFkLnZlcnRleEJ1ZmZlcik7XG5cdFx0cmVuZGVyUGFzcy5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlclBhc3MuZW5kKCk7XG5cblx0XHQvLyBzdWJtaXQgdGhlIGNvbW1hbmQgYnVmZmVyXG5cdFx0ZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZC5maW5pc2goKV0pO1xuXHRcdHRleHR1cmUuZGVzdHJveSgpO1xuXHRcdGZyYW1lX2luZGV4Kys7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZW5kZXIsIFVQREFURV9JTlRFUlZBTCk7XG5cdHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsImZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG5cdG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHsgcG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIiB9LFxuXHRyZXF1aXJlZEZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW11cbik6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKG9wdGlvbnMpO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKHsgcmVxdWlyZWRGZWF0dXJlczogcmVxdWlyZWRGZWF0dXJlcyB9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0dmVydGV4QnVmZmVyLFxuXHRcdC8qYnVmZmVyT2Zmc2V0PSovIDAsXG5cdFx0LypkYXRhPSovIGFycmF5XG5cdCk7XG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVGV4dHVyZXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRiaW5kaW5nczogbnVtYmVyW10sXG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0Zm9ybWF0OiB7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0fSA9IHtcblx0XHRzdG9yYWdlOiBcInIzMmZsb2F0XCIsXG5cdH1cbik6IHtcblx0Y2FudmFzOiBHUFVCdWZmZXI7XG5cdHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfTtcblx0Zm9ybWF0OiB7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0fTtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IHRleHR1cmVEYXRhID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KGZvcm1hdC5zdG9yYWdlKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0dGV4dHVyZURhdGFbaV0gPSBbXTtcblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgQ0hBTk5FTFM7IGorKykge1xuXHRcdFx0dGV4dHVyZURhdGFbaV0ucHVzaChNYXRoLnJhbmRvbSgpID4gMSAvIDIgPyAxIDogLTEpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfSA9IHt9O1xuXHRiaW5kaW5ncy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHR0ZXh0dXJlc1trZXldID0gZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuXHRcdFx0bGFiZWw6IGBUZXh0dXJlICR7a2V5fWAsXG5cdFx0XHRzaXplOiBbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLFxuXHRcdFx0Zm9ybWF0OiBmb3JtYXQuc3RvcmFnZSxcblx0XHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHRcdH0pO1xuXHR9KTtcblxuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZURhdGEuZmxhdCgpKTtcblx0T2JqZWN0LnZhbHVlcyh0ZXh0dXJlcykuZm9yRWFjaCgodGV4dHVyZSkgPT4ge1xuXHRcdGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG5cdFx0XHR7IHRleHR1cmUgfSxcblx0XHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHRcdC8qZGF0YUxheW91dD0qLyB7XG5cdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0XHRyb3dzUGVySW1hZ2U6IHNpemUuaGVpZ2h0LFxuXHRcdFx0fSxcblx0XHRcdC8qc2l6ZT0qLyBzaXplXG5cdFx0KTtcblx0fSk7XG5cblx0bGV0IGNhbnZhcyA9IG5ldyBGbG9hdDMyQXJyYXkoW3NpemUud2lkdGgsIHNpemUuaGVpZ2h0XSk7XG5cdGNvbnN0IGNhbnZhc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkNhbnZhcyBCdWZmZXJcIixcblx0XHRzaXplOiBjYW52YXMuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoY2FudmFzQnVmZmVyLCAvKm9mZnNldD0qLyAwLCAvKmRhdGE9Ki8gY2FudmFzKTtcblxuXHRyZXR1cm4ge1xuXHRcdGNhbnZhczogY2FudmFzQnVmZmVyLFxuXHRcdHRleHR1cmVzOiB0ZXh0dXJlcyxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiBzaXplLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXMsXG5cdHRleHR1cmU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0c2l6ZTogbnVtYmVyID0gMTAwXG4pOiB7XG5cdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcblx0bGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuXHR2YXIgc2lnbiA9IDE7XG5cblx0bGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG5cdGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG5cdGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG5cdGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuXHRcdC8vIGRpc2FibGUgY29udGV4dCBtZW51XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIGV2ZW50c1xuXHRcdFtcIm1vdXNlbW92ZVwiLCBcInRvdWNobW92ZVwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0cG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC5vZmZzZXRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCB4ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi54IC8gY2FudmFzLndpZHRoKSAqIHRleHR1cmUud2lkdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGxldCB5ID0gTWF0aC5mbG9vcihcblx0XHRcdFx0XHRcdChwb3NpdGlvbi55IC8gY2FudmFzLmhlaWdodCkgKiB0ZXh0dXJlLmhlaWdodFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRkYXRhLnNldChbeCwgeV0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdC8vIHpvb20gZXZlbnRzIFRPRE8oQGdzemVwKSBhZGQgcGluY2ggYW5kIHNjcm9sbCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIndoZWVsXCJdLmZvckVhY2goKHR5cGUpID0+IHtcblx0XHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRzd2l0Y2ggKHRydWUpIHtcblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50OlxuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS54ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHR2ZWxvY2l0eS55ID0gZXZlbnQuZGVsdGFZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaXplICs9IHZlbG9jaXR5Lnk7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpemVdLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyBjbGljayBldmVudHMgVE9ETyhAZ3N6ZXApIGltcGxlbWVudCByaWdodCBjbGljayBlcXVpdmFsZW50IGZvciB0b3VjaCBkZXZpY2VzXG5cdFx0W1wibW91c2Vkb3duXCIsIFwidG91Y2hzdGFydFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IDEgLSBldmVudC5idXR0b247XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDpcblx0XHRcdFx0XHRcdFx0c2lnbiA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSA/IC0xIDogMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3NpZ24gKiBzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdFtcIm1vdXNldXBcIiwgXCJ0b3VjaGVuZFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0ZGF0YS5zZXQoW05hTl0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXHRjb25zdCB1bmlmb3JtQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiSW50ZXJhY3Rpb24gQnVmZmVyXCIsXG5cdFx0c2l6ZTogZGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YnVmZmVyOiB1bmlmb3JtQnVmZmVyLFxuXHRcdGRhdGE6IGRhdGEsXG5cdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoYW5uZWxDb3VudChmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQpOiBudW1iZXIge1xuXHRpZiAoZm9ybWF0LmluY2x1ZGVzKFwicmdiYVwiKSkge1xuXHRcdHJldHVybiA0O1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYlwiKSkge1xuXHRcdHJldHVybiAzO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnXCIpKSB7XG5cdFx0cmV0dXJuIDI7XG5cdH0gZWxzZSBpZiAoZm9ybWF0LmluY2x1ZGVzKFwiclwiKSkge1xuXHRcdHJldHVybiAxO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZm9ybWF0OiBcIiArIGZvcm1hdCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcHJlcGVuZEluY2x1ZGVzKGNvZGU6IHN0cmluZywgaW5jbHVkZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcblx0Y29kZSA9IGNvZGUucmVwbGFjZSgvXiNpbXBvcnQuKi9nbSwgXCJcIik7XG5cdHJldHVybiBpbmNsdWRlcy5yZWR1Y2UoKGFjYywgaW5jbHVkZSkgPT4gaW5jbHVkZSArIFwiXFxuXCIgKyBhY2MsIGNvZGUpO1xufVxuXG5leHBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0cHJlcGVuZEluY2x1ZGVzLFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==