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
/* harmony import */ var _shaders_vorticity_streamfunction_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shaders/vorticity-streamfunction.comp.wgsl */ "./src/shaders/vorticity-streamfunction.comp.wgsl");






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
    const BINDINGS_TEXTURE = {
        VORTICITY: 0,
        STREAMFUNCTION: 1,
        VELOCITY: 2,
        MAP: 3,
        DISTRIBUTION: 4,
    };
    const BINDINGS_BUFFER = { INTERACTION: 5, CANVAS: 6 };
    const xmap = new Array(canvas.size.height);
    for (let i = 0; i < canvas.size.height; i++) {
        xmap[i] = [];
        for (let j = 0; j < canvas.size.width; j++) {
            xmap[i].push(j / canvas.size.width);
        }
    }
    const ymap = new Array(canvas.size.height);
    for (let i = 0; i < canvas.size.height; i++) {
        ymap[i] = [];
        for (let j = 0; j < canvas.size.width; j++) {
            ymap[i].push(i / canvas.size.height);
        }
    }
    const textures = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(device, Object.values(BINDINGS_TEXTURE), {}, {
        depthOrArrayLayers: {
            [BINDINGS_TEXTURE.VORTICITY]: 1,
            [BINDINGS_TEXTURE.STREAMFUNCTION]: 1,
            [BINDINGS_TEXTURE.VELOCITY]: 2,
            [BINDINGS_TEXTURE.MAP]: 2,
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
        code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_vorticity_streamfunction_comp_wgsl__WEBPACK_IMPORTED_MODULE_5__, [_shaders_includes_bindings_wgsl__WEBPACK_IMPORTED_MODULE_1__, _shaders_includes_cache_wgsl__WEBPACK_IMPORTED_MODULE_2__]),
    });
    const interactionPipeline = device.createComputePipeline({
        label: "interactionPipeline",
        layout: pipelineLayout,
        compute: {
            entryPoint: "interact",
            module: timestepShaderModule,
        },
    });
    const advectionPipeline = device.createComputePipeline({
        label: "advectionPipeline",
        layout: pipelineLayout,
        compute: {
            entryPoint: "advection",
            module: timestepShaderModule,
        },
    });
    const projectionPipeline = device.createComputePipeline({
        label: "projectionPipeline",
        layout: pipelineLayout,
        compute: {
            entryPoint: "projection",
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
        // interact
        computePass.setPipeline(interactionPipeline);
        device.queue.writeBuffer(interactions.buffer, 0, interactions.data);
        computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
        // project
        computePass.setPipeline(projectionPipeline);
        for (let i = 0; i < 30; i++) {
            computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
        }
        // advect
        computePass.setPipeline(advectionPipeline);
        computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
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
        const random = new Array(size.width * size.height);
        const layers = key in depthOrArrayLayers ? depthOrArrayLayers[parseInt(key)] : 1;
        bindingLayout[parseInt(key)] = {
            format: FORMAT,
            access: "read-write",
            viewDimension: layers > 1 ? "2d-array" : "2d",
        };
        for (let i = 0; i < size.width * size.height; i++) {
            random[i] = [];
            for (let j = 0; j < layers; j++) {
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n  };\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    // vorticity map\n    let omega = textureLoad(vorticity, x);\n    output.color.g = 5.0 * max(0.0, omega.r);\n    output.color.r = 5.0 * max(0.0, -omega.r);\n\n    output.color.a = 1.0;\n    return output;\n}";

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

module.exports = "const GROUP_INDEX = 0;\nconst VERTEX_INDEX = 0;\nconst RENDER_INDEX = 0;\n\nconst VORTICITY = 0u;\nconst STREAMFUNCTION = 1u;\nconst VELOCITY = 2u;\nconst MAP = 3u;\nconst DISTRIBUTION = 4u;\n\nconst INTERACTION = 5;\nconst CANVAS = 6;";

/***/ }),

/***/ "./src/shaders/includes/cache.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/includes/cache.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n};\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n};\n\nstruct IndexFloat {\n    global: vec2<f32>,\n    local: vec2<f32>,\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n    frame_index: u32,\n};\n\nfn indexf(index: Index) -> IndexFloat {\n    return IndexFloat(vec2<f32>(index.global), vec2<f32>(index.local));\n}\n\nfn add(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global + y, x.local + y);\n}\n\nfn addf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global + y, x.local + y);\n}\n\nfn sub(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global - y, x.local - y);\n}\n\nfn subf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global - y, x.local - y);\n}\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 8u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\nvar<workgroup> cache_f32: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 2>;\nvar<workgroup> cache_vec2: array<array<array<vec2<f32>, CACHE_SIZE>, CACHE_SIZE>, 2>;\nvar<workgroup> cache_vec9: array<array<array<f32, 9>, CACHE_SIZE>, CACHE_SIZE>;\n\nfn update_cache_f32(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n\n            cache_f32[idx][index.local.x][index.local.y] = load_value(F, index.global).r;\n        }\n    }\n}\n\nfn update_cache_vec2(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n\n            cache_vec2[idx][index.local.x][index.local.y].x = load_component_value(F, index.global, 0).r;\n            cache_vec2[idx][index.local.x][index.local.y].y = load_component_value(F, index.global, 1).r;\n        }\n    }\n}\n\nfn update_cache_vec9(id: Invocation, F: texture_storage_2d_array<r32float, read_write>) {\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            for (var i = 0; i < 9; i++) {\n                cache_vec9[index.local.x][index.local.y][i] = load_component_value(F, index.global, i).r;\n            }\n        }\n    }\n}\n\nfn cached_value_f32(idx: u32, x: vec2<u32>) -> f32 {\n    return cache_f32[idx][x.x][x.y];\n}\n\nfn cached_value_vec2(idx: u32, x: vec2<u32>) -> vec2<f32> {\n    return cache_vec2[idx][x.x][x.y];\n}\n\nfn cached_value_vec9(x: vec2<u32>) -> array<f32, 9> {\n    return cache_vec9[x.x][x.y];\n}\n\nfn as_r32float(r: f32) -> vec4<f32> {\n    return vec4<f32>(r, 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, vec2<i32>(y % canvas.size));  // periodic boundary conditions\n}\n\nfn load_component_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>, component: i32) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, vec2<i32>(y % canvas.size), component);  // periodic boundary conditions\n}\n\nfn store_value(F: texture_storage_2d<r32float, read_write>, index: Index, value: f32) {\n    textureStore(F, vec2<i32>(index.global), as_r32float(value));\n}\n\nfn store_component_value(F: texture_storage_2d_array<r32float, read_write>, index: Index, component: i32, value: f32) {\n    textureStore(F, vec2<i32>(index.global), component, as_r32float(value));\n}\n\nfn check_bounds(index: Index) -> bool {\n    return (0u < index.local.x) && (index.local.x <= DISPATCH_SIZE) && (0u < index.local.y) && (index.local.y <= DISPATCH_SIZE);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/vorticity-streamfunction.comp.wgsl":
/*!********************************************************!*\
  !*** ./src/shaders/vorticity-streamfunction.comp.wgsl ***!
  \********************************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nconst EPS = 1e-37;\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d<r32float, read_write>;\n@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(DISTRIBUTION) var distribution: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;\n\nfn get_streamfunction(index: Index) -> f32 {\n    return cached_value_f32(STREAMFUNCTION, index.local);\n}\n\nfn get_vorticity(index: Index) -> f32 {\n    return cached_value_f32(VORTICITY, index.local);\n}\n\nfn get_velocity(index: Index) -> vec2<f32> {\n    return cached_value_vec2(VELOCITY, index.local);\n}\n\nfn get_reference_map(index: Index) -> vec2<f32> {\n    return cached_value_vec2(MAP, index.local);\n}\n\nfn get_distribution(index: Index) -> array<f32, 9> {\n    return cached_value_vec9(index.local);\n}\n\nfn get_vorticity_interpolate(index: IndexFloat) -> f32 {\n    let x = index.local;\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value_f32(VORTICITY, y),\n            cached_value_f32(VORTICITY, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value_f32(VORTICITY, y + dy),\n            cached_value_f32(VORTICITY, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\nfn diffuse_vorticity(x: Index) -> f32 {\n    let laplacian = 2.0 * (get_vorticity(add(x, dx)) + get_vorticity(sub(x, dx)) + get_vorticity(add(x, dy)) + get_vorticity(add(x, dx + dy))) + get_vorticity(add(x, dx - dy)) + get_vorticity(add(x, dy - dx)) + get_vorticity(sub(x, dx + dy)) - 12.0 * get_vorticity(x);\n    return laplacian / 4.0;\n}\n\nfn get_velocity_clipped(x: Index, max_norm: f32) -> vec2<f32> {\n\n    let v = get_velocity(x);\n    let norm = length(v);\n\n    return (v / max(norm, EPS)) * min(norm, max_norm);\n}\n\nfn update_velocity(id: Invocation) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let xvelocity_update = (get_streamfunction(add(index, dy)) - get_streamfunction(sub(index, dy))) / 2.0;\n                let yvelocity_update = (get_streamfunction(sub(index, dx)) - get_streamfunction(add(index, dx))) / 2.0;\n\n                store_component_value(velocity, index, 0, xvelocity_update);\n                store_component_value(velocity, index, 1, yvelocity_update);\n            }\n        }\n    }\n}\n\nfn jacobi_iteration(x: Index, relaxation: f32) -> f32 {\n    return (1.0 - relaxation) * get_streamfunction(x) + (relaxation / 4.0) * (get_streamfunction(add(x, dx)) + get_streamfunction(sub(x, dx)) + get_streamfunction(add(x, dy)) + get_streamfunction(sub(x, dy)) + get_vorticity(x));\n}\n\nfn advect_vorticity(x: Index) -> f32 {\n    const max_norm = f32(HALO_SIZE);\n    let y = subf(indexf(x), get_velocity_clipped(x, max_norm));\n    return get_vorticity_interpolate(y);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn interact(id: Invocation) {\n\n    update_cache_f32(id, VORTICITY, vorticity);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let x = vec2<f32>(index.global);\n                let y = interaction.position + 8.0 * sign(interaction.size) ;\n\n                let dims = vec2<f32>(canvas.size);\n                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));\n\n                var brush = 0.0;\n                if distance < abs(interaction.size) {\n                    brush += 0.1 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));\n                }\n\n                var vorticity_update = get_vorticity(index) + brush;\n                store_value(vorticity, index, vorticity_update);\n            }\n        }\n    }\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn advection(id: Invocation) {\n\n    update_cache_f32(id, VORTICITY, vorticity);\n    update_cache_vec2(id, VELOCITY, velocity);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let vorticity_update = advect_vorticity(index) + diffuse_vorticity(index) * 0.01;\n                store_value(vorticity, index, vorticity_update);\n            }\n        }\n    }\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn projection(id: Invocation) {\n\n    update_cache_f32(id, VORTICITY, vorticity);\n    update_cache_f32(id, STREAMFUNCTION, streamfunction);\n    update_cache_vec2(id, VELOCITY, velocity);\n\n    workgroupBarrier();\n\n    const relaxation = 1.4;\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // Red update\n                if (index.local.x + index.local.y) % 2u == 0u {\n                    let streamfunction_update = jacobi_iteration(index, relaxation);\n                    store_value(streamfunction, index, streamfunction_update);\n                }\n            }\n        }\n    }\n    update_cache_f32(id, STREAMFUNCTION, streamfunction);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // Black update\n                if (index.local.x + index.local.y) % 2u != 0u {\n                    let streamfunction_update = jacobi_iteration(index, relaxation);\n                    store_value(streamfunction, index, streamfunction_update);\n                }\n            }\n        }\n    }\n    update_velocity(id);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn streaming(id: Invocation) {\n\n    update_cache_vec9(id, distribution);\n    workgroupBarrier();\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQVNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRzZXR1cFRleHR1cmVzLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0cHJlcGVuZEluY2x1ZGVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgYmluZGluZ3MgZnJvbSBcIi4vc2hhZGVycy9pbmNsdWRlcy9iaW5kaW5ncy53Z3NsXCI7XG5pbXBvcnQgY2FjaGVVdGlscyBmcm9tIFwiLi9zaGFkZXJzL2luY2x1ZGVzL2NhY2hlLndnc2xcIjtcblxuaW1wb3J0IGNlbGxWZXJ0ZXhTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLnZlcnQud2dzbFwiO1xuaW1wb3J0IGNlbGxGcmFnbWVudFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwuZnJhZy53Z3NsXCI7XG5pbXBvcnQgdGltZXN0ZXBDb21wdXRlU2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvdm9ydGljaXR5LXN0cmVhbWZ1bmN0aW9uLmNvbXAud2dzbFwiO1xuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cblx0Ly8gaW5pdGlhbGl6ZSB2ZXJ0ZXggYnVmZmVyIGFuZCB0ZXh0dXJlc1xuXHRjb25zdCBRVUFEID0gWy0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIDFdO1xuXHRjb25zdCBxdWFkID0gc2V0dXBWZXJ0ZXhCdWZmZXIoZGV2aWNlLCBcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLCBRVUFEKTtcblxuXHRjb25zdCBHUk9VUF9JTkRFWCA9IDA7XG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFJFTkRFUl9JTkRFWCA9IDA7XG5cblx0Y29uc3QgQklORElOR1NfVEVYVFVSRSA9IHtcblx0XHRWT1JUSUNJVFk6IDAsXG5cdFx0U1RSRUFNRlVOQ1RJT046IDEsXG5cdFx0VkVMT0NJVFk6IDIsXG5cdFx0TUFQOiAzLFxuXHRcdERJU1RSSUJVVElPTjogNCxcblx0fTtcblx0Y29uc3QgQklORElOR1NfQlVGRkVSID0geyBJTlRFUkFDVElPTjogNSwgQ0FOVkFTOiA2IH07XG5cblx0Y29uc3QgeG1hcCA9IG5ldyBBcnJheShjYW52YXMuc2l6ZS5oZWlnaHQpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGNhbnZhcy5zaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0eG1hcFtpXSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBjYW52YXMuc2l6ZS53aWR0aDsgaisrKSB7XG5cdFx0XHR4bWFwW2ldLnB1c2goaiAvIGNhbnZhcy5zaXplLndpZHRoKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCB5bWFwID0gbmV3IEFycmF5KGNhbnZhcy5zaXplLmhlaWdodCk7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY2FudmFzLnNpemUuaGVpZ2h0OyBpKyspIHtcblx0XHR5bWFwW2ldID0gW107XG5cblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IGNhbnZhcy5zaXplLndpZHRoOyBqKyspIHtcblx0XHRcdHltYXBbaV0ucHVzaChpIC8gY2FudmFzLnNpemUuaGVpZ2h0KTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoXG5cdFx0ZGV2aWNlLFxuXHRcdE9iamVjdC52YWx1ZXMoQklORElOR1NfVEVYVFVSRSksXG5cdFx0e30sXG5cdFx0e1xuXHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOiB7XG5cdFx0XHRcdFtCSU5ESU5HU19URVhUVVJFLlZPUlRJQ0lUWV06IDEsXG5cdFx0XHRcdFtCSU5ESU5HU19URVhUVVJFLlNUUkVBTUZVTkNUSU9OXTogMSxcblx0XHRcdFx0W0JJTkRJTkdTX1RFWFRVUkUuVkVMT0NJVFldOiAyLFxuXHRcdFx0XHRbQklORElOR1NfVEVYVFVSRS5NQVBdOiAyLFxuXHRcdFx0fSxcblx0XHRcdHdpZHRoOiBjYW52YXMuc2l6ZS53aWR0aCxcblx0XHRcdGhlaWdodDogY2FudmFzLnNpemUuaGVpZ2h0LFxuXHRcdH1cblx0KTtcblxuXHRjb25zdCBXT1JLR1JPVVBfU0laRSA9IDg7XG5cdGNvbnN0IFRJTEVfU0laRSA9IDI7XG5cdGNvbnN0IEhBTE9fU0laRSA9IDE7XG5cblx0Y29uc3QgQ0FDSEVfU0laRSA9IFRJTEVfU0laRSAqIFdPUktHUk9VUF9TSVpFO1xuXHRjb25zdCBESVNQQVRDSF9TSVpFID0gQ0FDSEVfU0laRSAtIDIgKiBIQUxPX1NJWkU7XG5cblx0Y29uc3QgV09SS0dST1VQX0NPVU5UOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLndpZHRoIC8gRElTUEFUQ0hfU0laRSksXG5cdFx0TWF0aC5jZWlsKHRleHR1cmVzLnNpemUuaGVpZ2h0IC8gRElTUEFUQ0hfU0laRSksXG5cdF07XG5cblx0Ly8gc2V0dXAgaW50ZXJhY3Rpb25zXG5cdGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKFxuXHRcdGRldmljZSxcblx0XHRjYW52YXMuY29udGV4dC5jYW52YXMsXG5cdFx0dGV4dHVyZXMuc2l6ZVxuXHQpO1xuXG5cdGNvbnN0IGJpbmRHcm91cExheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcImJpbmRHcm91cExheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfVEVYVFVSRSkubWFwKChiaW5kaW5nKSA9PiAoe1xuXHRcdFx0XHRiaW5kaW5nOiBiaW5kaW5nLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB0ZXh0dXJlcy5iaW5kaW5nTGF5b3V0W2JpbmRpbmddLFxuXHRcdFx0fSkpLFxuXHRcdFx0Li4uT2JqZWN0LnZhbHVlcyhCSU5ESU5HU19CVUZGRVIpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRidWZmZXI6IHsgdHlwZTogXCJ1bmlmb3JtXCIgYXMgR1BVQnVmZmVyQmluZGluZ1R5cGUgfSxcblx0XHRcdH0pKSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBiaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRsYWJlbDogYEJpbmQgR3JvdXBgLFxuXHRcdGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfVEVYVFVSRSkubWFwKChiaW5kaW5nKSA9PiAoe1xuXHRcdFx0XHRiaW5kaW5nOiBiaW5kaW5nLFxuXHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbYmluZGluZ10uY3JlYXRlVmlldygpLFxuXHRcdFx0fSkpLFxuXHRcdFx0Li4uT2JqZWN0LnZhbHVlcyhCSU5ESU5HU19CVUZGRVIpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRidWZmZXI6XG5cdFx0XHRcdFx0XHRiaW5kaW5nID09PSBCSU5ESU5HU19CVUZGRVIuSU5URVJBQ1RJT05cblx0XHRcdFx0XHRcdFx0PyBpbnRlcmFjdGlvbnMuYnVmZmVyXG5cdFx0XHRcdFx0XHRcdDogdGV4dHVyZXMuY2FudmFzLmJ1ZmZlcixcblx0XHRcdFx0fSxcblx0XHRcdH0pKSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBwaXBlbGluZUxheW91dCA9IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG5cdFx0bGFiZWw6IFwicGlwZWxpbmVMYXlvdXRcIixcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XSxcblx0fSk7XG5cblx0Ly8gY29tcGlsZSBzaGFkZXJzXG5cdGNvbnN0IHRpbWVzdGVwU2hhZGVyTW9kdWxlID0gZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0bGFiZWw6IFwidGltZXN0ZXBDb21wdXRlU2hhZGVyXCIsXG5cdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwgW2JpbmRpbmdzLCBjYWNoZVV0aWxzXSksXG5cdH0pO1xuXG5cdGNvbnN0IGludGVyYWN0aW9uUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJpbnRlcmFjdGlvblBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRlbnRyeVBvaW50OiBcImludGVyYWN0XCIsXG5cdFx0XHRtb2R1bGU6IHRpbWVzdGVwU2hhZGVyTW9kdWxlLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IGFkdmVjdGlvblBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiYWR2ZWN0aW9uUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdGNvbXB1dGU6IHtcblx0XHRcdGVudHJ5UG9pbnQ6IFwiYWR2ZWN0aW9uXCIsXG5cdFx0XHRtb2R1bGU6IHRpbWVzdGVwU2hhZGVyTW9kdWxlLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IHByb2plY3Rpb25QaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInByb2plY3Rpb25QaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0ZW50cnlQb2ludDogXCJwcm9qZWN0aW9uXCIsXG5cdFx0XHRtb2R1bGU6IHRpbWVzdGVwU2hhZGVyTW9kdWxlLFxuXHRcdH0sXG5cdH0pO1xuXG5cdGNvbnN0IHJlbmRlclBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZVJlbmRlclBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJyZW5kZXJQaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0dmVydGV4OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoY2VsbFZlcnRleFNoYWRlciwgW2JpbmRpbmdzXSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIFtiaW5kaW5nc10pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsRnJhZ21lbnRTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Zm9ybWF0OiBjYW52YXMuZm9ybWF0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXG5cdFx0e1xuXHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRsb2FkT3A6IFwibG9hZFwiLFxuXHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdH0sXG5cdF07XG5cdGNvbnN0IHJlbmRlclBhc3NEZXNjcmlwdG9yID0ge1xuXHRcdGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMsXG5cdH07XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcblxuXHRcdC8vIGNvbXB1dGUgcGFzc1xuXHRcdGNvbnN0IGNvbXB1dGVQYXNzID0gY29tbWFuZC5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cdFx0Y29tcHV0ZVBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXG5cdFx0Ly8gaW50ZXJhY3Rcblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShpbnRlcmFjdGlvblBpcGVsaW5lKTtcblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoaW50ZXJhY3Rpb25zLmJ1ZmZlciwgMCwgaW50ZXJhY3Rpb25zLmRhdGEpO1xuXHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXG5cdFx0Ly8gcHJvamVjdFxuXHRcdGNvbXB1dGVQYXNzLnNldFBpcGVsaW5lKHByb2plY3Rpb25QaXBlbGluZSk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAzMDsgaSsrKSB7XG5cdFx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoLi4uV09SS0dST1VQX0NPVU5UKTtcblx0XHR9XG5cblx0XHQvLyBhZHZlY3Rcblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShhZHZlY3Rpb25QaXBlbGluZSk7XG5cdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cblx0XHRjb21wdXRlUGFzcy5lbmQoKTtcblxuXHRcdC8vIHJlbmRlciBwYXNzXG5cdFx0Y29uc3QgdGV4dHVyZSA9IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCk7XG5cdFx0Y29uc3QgdmlldyA9IHRleHR1cmUuY3JlYXRlVmlldygpO1xuXG5cdFx0cmVuZGVyUGFzc0Rlc2NyaXB0b3IuY29sb3JBdHRhY2htZW50c1tSRU5ERVJfSU5ERVhdLnZpZXcgPSB2aWV3O1xuXHRcdGNvbnN0IHJlbmRlclBhc3MgPSBjb21tYW5kLmJlZ2luUmVuZGVyUGFzcyhyZW5kZXJQYXNzRGVzY3JpcHRvcik7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cCk7XG5cblx0XHRyZW5kZXJQYXNzLnNldFBpcGVsaW5lKHJlbmRlclBpcGVsaW5lKTtcblx0XHRyZW5kZXJQYXNzLnNldFZlcnRleEJ1ZmZlcihWRVJURVhfSU5ERVgsIHF1YWQudmVydGV4QnVmZmVyKTtcblxuXHRcdHJlbmRlclBhc3MuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXJQYXNzLmVuZCgpO1xuXG5cdFx0Ly8gc3VibWl0IHRoZSBjb21tYW5kIGJ1ZmZlclxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmQuZmluaXNoKCldKTtcblx0XHR0ZXh0dXJlLmRlc3Ryb3koKTtcblx0XHRmcmFtZV9pbmRleCsrO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCJmdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7XG5cdFx0cG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIixcblx0fSxcblx0cmVxdWlyZWRGZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtdLFxuXHRyZXF1aXJlZExpbWl0czogUmVjb3JkPHN0cmluZywgdW5kZWZpbmVkIHwgbnVtYmVyPiA9IHtcblx0XHRtYXhTdG9yYWdlVGV4dHVyZXNQZXJTaGFkZXJTdGFnZTogOCxcblx0fVxuKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIob3B0aW9ucyk7XG5cdGlmICghYWRhcHRlcikgdGhyb3dEZXRlY3Rpb25FcnJvcihcIk5vIEdQVSBhZGFwdGVyIGZvdW5kXCIpO1xuXG5cdHJldHVybiBhZGFwdGVyLnJlcXVlc3REZXZpY2Uoe1xuXHRcdHJlcXVpcmVkRmVhdHVyZXM6IHJlcXVpcmVkRmVhdHVyZXMsXG5cdFx0cmVxdWlyZWRMaW1pdHM6IHJlcXVpcmVkTGltaXRzLFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0c2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG5cdGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG5cdGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcblx0c2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKSEuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0dmVydGV4QnVmZmVyLFxuXHRcdC8qYnVmZmVyT2Zmc2V0PSovIDAsXG5cdFx0LypkYXRhPSovIGFycmF5XG5cdCk7XG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVGV4dHVyZXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRiaW5kaW5nczogbnVtYmVyW10sXG5cdGRhdGE6IHsgW2tleTogbnVtYmVyXTogbnVtYmVyW10gfSxcblx0c2l6ZToge1xuXHRcdGRlcHRoT3JBcnJheUxheWVycz86IHsgW2tleTogbnVtYmVyXTogbnVtYmVyIH07XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fVxuKToge1xuXHRjYW52YXM6IHtcblx0XHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0XHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0XHR0eXBlOiBHUFVCdWZmZXJCaW5kaW5nVHlwZTtcblx0fTtcblx0dGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9O1xuXHRiaW5kaW5nTGF5b3V0OiB7IFtrZXk6IG51bWJlcl06IEdQVVN0b3JhZ2VUZXh0dXJlQmluZGluZ0xheW91dCB9O1xuXHRzaXplOiB7XG5cdFx0ZGVwdGhPckFycmF5TGF5ZXJzPzogeyBba2V5OiBudW1iZXJdOiBudW1iZXIgfTtcblx0XHR3aWR0aDogbnVtYmVyO1xuXHRcdGhlaWdodDogbnVtYmVyO1xuXHR9O1xufSB7XG5cdGNvbnN0IEZPUk1BVCA9IFwicjMyZmxvYXRcIjtcblx0Y29uc3QgQ0hBTk5FTFMgPSBjaGFubmVsQ291bnQoRk9STUFUKTtcblxuXHRjb25zdCB0ZXh0dXJlczogeyBba2V5OiBudW1iZXJdOiBHUFVUZXh0dXJlIH0gPSB7fTtcblx0Y29uc3QgYmluZGluZ0xheW91dDogeyBba2V5OiBudW1iZXJdOiBHUFVTdG9yYWdlVGV4dHVyZUJpbmRpbmdMYXlvdXQgfSA9IHt9O1xuXHRjb25zdCBkZXB0aE9yQXJyYXlMYXllcnMgPSBzaXplLmRlcHRoT3JBcnJheUxheWVycyB8fCB7fTtcblxuXHRiaW5kaW5ncy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHR0ZXh0dXJlc1trZXldID0gZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuXHRcdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QsXG5cdFx0XHRmb3JtYXQ6IEZPUk1BVCxcblx0XHRcdHNpemU6IHtcblx0XHRcdFx0d2lkdGg6IHNpemUud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogc2l6ZS5oZWlnaHQsXG5cdFx0XHRcdGRlcHRoT3JBcnJheUxheWVyczpcblx0XHRcdFx0XHRrZXkgaW4gZGVwdGhPckFycmF5TGF5ZXJzID8gZGVwdGhPckFycmF5TGF5ZXJzW2tleV0gOiAxLFxuXHRcdFx0fSxcblx0XHR9KTtcblx0fSk7XG5cblx0T2JqZWN0LmtleXModGV4dHVyZXMpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdGNvbnN0IHJhbmRvbSA9IG5ldyBBcnJheShzaXplLndpZHRoICogc2l6ZS5oZWlnaHQpO1xuXHRcdGNvbnN0IGxheWVycyA9XG5cdFx0XHRrZXkgaW4gZGVwdGhPckFycmF5TGF5ZXJzID8gZGVwdGhPckFycmF5TGF5ZXJzW3BhcnNlSW50KGtleSldIDogMTtcblxuXHRcdGJpbmRpbmdMYXlvdXRbcGFyc2VJbnQoa2V5KV0gPSB7XG5cdFx0XHRmb3JtYXQ6IEZPUk1BVCxcblx0XHRcdGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG5cdFx0XHR2aWV3RGltZW5zaW9uOiBsYXllcnMgPiAxID8gXCIyZC1hcnJheVwiIDogXCIyZFwiLFxuXHRcdH07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGggKiBzaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0XHRyYW5kb21baV0gPSBbXTtcblxuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBsYXllcnM7IGorKykge1xuXHRcdFx0XHRyYW5kb21baV0ucHVzaCgyICogTWF0aC5yYW5kb20oKSAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGFycmF5ID1cblx0XHRcdGtleSBpbiBkYXRhXG5cdFx0XHRcdD8gbmV3IEZsb2F0MzJBcnJheShkYXRhW3BhcnNlSW50KGtleSldLmZsYXQoKSlcblx0XHRcdFx0OiBuZXcgRmxvYXQzMkFycmF5KHJhbmRvbS5mbGF0KCkpO1xuXG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlVGV4dHVyZShcblx0XHRcdHsgdGV4dHVyZTogdGV4dHVyZXNbcGFyc2VJbnQoa2V5KV0gfSxcblx0XHRcdC8qZGF0YT0qLyBhcnJheSxcblx0XHRcdC8qZGF0YUxheW91dD0qLyB7XG5cdFx0XHRcdG9mZnNldDogMCxcblx0XHRcdFx0Ynl0ZXNQZXJSb3c6IHNpemUud2lkdGggKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIENIQU5ORUxTLFxuXHRcdFx0XHRyb3dzUGVySW1hZ2U6IHNpemUuaGVpZ2h0LFxuXHRcdFx0fSxcblx0XHRcdC8qc2l6ZT0qLyB7XG5cdFx0XHRcdHdpZHRoOiBzaXplLndpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IHNpemUuaGVpZ2h0LFxuXHRcdFx0XHRkZXB0aE9yQXJyYXlMYXllcnM6IGxheWVycyxcblx0XHRcdH1cblx0XHQpO1xuXHR9KTtcblxuXHRsZXQgY2FudmFzRGF0YSA9IG5ldyBVaW50MzJBcnJheShbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQsIDAsIDBdKTtcblx0Y29uc3QgY2FudmFzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiQ2FudmFzIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGNhbnZhc0RhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoY2FudmFzQnVmZmVyLCAvKm9mZnNldD0qLyAwLCAvKmRhdGE9Ki8gY2FudmFzRGF0YSk7XG5cblx0cmV0dXJuIHtcblx0XHRjYW52YXM6IHtcblx0XHRcdGJ1ZmZlcjogY2FudmFzQnVmZmVyLFxuXHRcdFx0ZGF0YTogY2FudmFzRGF0YSxcblx0XHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHRcdH0sXG5cdFx0dGV4dHVyZXM6IHRleHR1cmVzLFxuXHRcdGJpbmRpbmdMYXlvdXQ6IGJpbmRpbmdMYXlvdXQsXG5cdFx0c2l6ZTogc2l6ZSxcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgT2Zmc2NyZWVuQ2FudmFzLFxuXHR0ZXh0dXJlOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdHNpemU6IG51bWJlciA9IDEwMFxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcblx0dmFyIHNpZ24gPSAxO1xuXG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbcG9zaXRpb24ueCwgcG9zaXRpb24ueV0pO1xuXHRpZiAoY2FudmFzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcblx0XHQvLyBkaXNhYmxlIGNvbnRleHQgbWVudVxuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgeCA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueSAvIGNhbnZhcy5oZWlnaHQpICogdGV4dHVyZS5oZWlnaHRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyB6b29tIGV2ZW50cyBUT0RPKEBnc3plcCkgYWRkIHBpbmNoIGFuZCBzY3JvbGwgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJ3aGVlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2l6ZSArPSB2ZWxvY2l0eS55O1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY2xpY2sgZXZlbnRzIFRPRE8oQGdzemVwKSBpbXBsZW1lbnQgcmlnaHQgY2xpY2sgZXF1aXZhbGVudCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSAxIC0gZXZlbnQuYnV0dG9uO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaWduICogc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRbXCJtb3VzZXVwXCIsIFwidG91Y2hlbmRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtOYU5dLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByZXBlbmRJbmNsdWRlcyhjb2RlOiBzdHJpbmcsIGluY2x1ZGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG5cdGNvZGUgPSBjb2RlLnJlcGxhY2UoL14jaW1wb3J0LiovZ20sIFwiXCIpO1xuXHRyZXR1cm4gaW5jbHVkZXMucmVkdWNlKChhY2MsIGluY2x1ZGUpID0+IGluY2x1ZGUgKyBcIlxcblwiICsgYWNjLCBjb2RlKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=