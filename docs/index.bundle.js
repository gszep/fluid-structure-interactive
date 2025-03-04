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
        XVELOCITY: 2,
        YVELOCITY: 3,
        XMAP: 4,
        YMAP: 5,
    };
    const BINDINGS_BUFFER = { INTERACTION: 6, CANVAS: 7 };
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
        depthOrArrayLayers: [2, 2, 2, 2, 2, 2],
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
                storageTexture: textures.bindingLayout,
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
    bindings.forEach((key) => {
        textures[key] = device.createTexture({
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
            format: FORMAT,
            size: {
                width: size.width,
                height: size.height,
                depthOrArrayLayers: key in size.depthOrArrayLayers
                    ? size.depthOrArrayLayers[key]
                    : 1,
            },
        });
    });
    Object.keys(textures).forEach((key) => {
        const random = new Array(size.width * size.height);
        const depthOrArrayLayers = key in size.depthOrArrayLayers
            ? size.depthOrArrayLayers[parseInt(key)]
            : 1;
        for (let i = 0; i < size.width * size.height; i++) {
            random[i] = [];
            for (let j = 0; j < depthOrArrayLayers; j++) {
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
            depthOrArrayLayers: depthOrArrayLayers,
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
        bindingLayout: {
            format: FORMAT,
            access: "read-write",
            viewDimension: "2d-array",
        },
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

module.exports = "#import includes::bindings\n\nstruct Input {\n    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n  };\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));\n\n    // vorticity map\n    let omega = textureLoad(vorticity, x, 0);\n    output.color.g = 5.0 * max(0.0, omega.r);\n    output.color.r = 5.0 * max(0.0, -omega.r);\n\n    output.color.a = 1.0;\n    return output;\n}";

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

module.exports = "struct Invocation {\n    @builtin(workgroup_id) workGroupID: vec3<u32>,\n    @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n};\n\nstruct Index {\n    global: vec2<u32>,\n    local: vec2<u32>,\n};\n\nstruct IndexFloat {\n    global: vec2<f32>,\n    local: vec2<f32>,\n};\n\nstruct Canvas {\n    size: vec2<u32>,\n    frame_index: u32,\n};\n\nfn indexf(index: Index) -> IndexFloat {\n    return IndexFloat(vec2<f32>(index.global), vec2<f32>(index.local));\n}\n\nfn add(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global + y, x.local + y);\n}\n\nfn addf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global + y, x.local + y);\n}\n\nfn sub(x: Index, y: vec2<u32>) -> Index {\n    return Index(x.global - y, x.local - y);\n}\n\nfn subf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {\n    return IndexFloat(x.global - y, x.local - y);\n}\n\nconst dx = vec2<u32>(1u, 0u);\nconst dy = vec2<u32>(0u, 1u);\n\nconst TILE_SIZE = 2u;\nconst WORKGROUP_SIZE = 8u;\nconst HALO_SIZE = 1u;\n\nconst CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;\nconst DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);\n\n@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;\nvar<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 16>;\n\nfn update_cache(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n            let index = get_index(id, tile_x, tile_y);\n\n            cache[idx][index.local.x][index.local.y] = load_value(F, index.global).r;\n        }\n    }\n}\n\nfn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {\n    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1.0);\n}\n\nfn load_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {\n    let y = x + canvas.size; // ensure positive coordinates\n    return textureLoad(F, vec2<i32>(y % canvas.size), 0);  // periodic boundary conditions\n}\n\nfn check_bounds(index: Index) -> bool {\n    return (0u < index.local.x) && (index.local.x <= DISPATCH_SIZE) && (0u < index.local.y) && (index.local.y <= DISPATCH_SIZE);\n}\n\nfn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {\n    let tile = vec2<u32>(tile_x, tile_y);\n\n    let local = tile + TILE_SIZE * id.localInvocationID.xy;\n    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;\n    return Index(global, local);\n}";

/***/ }),

/***/ "./src/shaders/vorticity-streamfunction.comp.wgsl":
/*!********************************************************!*\
  !*** ./src/shaders/vorticity-streamfunction.comp.wgsl ***!
  \********************************************************/
/***/ ((module) => {

module.exports = "#import includes::bindings\n#import includes::cache\n\nconst EPS = 1e-37;\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\n@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(XVELOCITY) var xvelocity: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(YVELOCITY) var yvelocity: texture_storage_2d_array<r32float, read_write>;\n@group(GROUP_INDEX) @binding(XMAP) var xmap: texture_storage_2d_array<r32float, read>;\n@group(GROUP_INDEX) @binding(YMAP) var ymap: texture_storage_2d_array<r32float, read>;\n@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;\n\nfn get_streamfunction(index: Index) -> vec4<f32> {\n    return cached_value(STREAMFUNCTION, index.local);\n}\n\nfn get_vorticity(index: Index) -> vec4<f32> {\n    return cached_value(VORTICITY, index.local);\n}\n\nfn get_velocity(index: Index) -> vec2<f32> {\n    return vec2<f32>(cached_value(XVELOCITY, index.local).r, cached_value(YVELOCITY, index.local).r);\n}\n\nfn get_reference_map(index: Index) -> vec2<f32> {\n    return vec2<f32>(cached_value(XMAP, index.local).r, cached_value(YMAP, index.local).r);\n}\n\nfn get_vorticity_interpolate(index: IndexFloat) -> vec4<f32> {\n    let x = index.local;\n\n    let fraction = fract(x);\n    let y = vec2<u32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            cached_value(VORTICITY, y),\n            cached_value(VORTICITY, y + dx),\n            fraction.x\n        ),\n        mix(\n            cached_value(VORTICITY, y + dy),\n            cached_value(VORTICITY, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\nfn diffuse_vorticity(x: Index) -> vec4<f32> {\n    let laplacian = 2.0 * (get_vorticity(add(x, dx)) + get_vorticity(sub(x, dx)) + get_vorticity(add(x, dy)) + get_vorticity(add(x, dx + dy))) + get_vorticity(add(x, dx - dy)) + get_vorticity(add(x, dy - dx)) + get_vorticity(sub(x, dx + dy)) - 12.0 * get_vorticity(x);\n    return laplacian / 4.0;\n}\n\nfn velocity(x: Index, max_norm: f32) -> vec2<f32> {\n\n    let v = get_velocity(x);\n    let norm = length(v);\n\n    return (v / max(norm, EPS)) * min(norm, max_norm);\n}\n\nfn update_velocity(id: Invocation) {\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let xvelocity_update = (get_streamfunction(add(index, dy)) - get_streamfunction(sub(index, dy))) / 2.0;\n                let yvelocity_update = (get_streamfunction(sub(index, dx)) - get_streamfunction(add(index, dx))) / 2.0;\n\n                textureStore(xvelocity, vec2<i32>(index.global), 0, xvelocity_update);\n                textureStore(yvelocity, vec2<i32>(index.global), 0, yvelocity_update);\n            }\n        }\n    }\n}\n\nfn jacobi_iteration(x: Index, relaxation: f32) -> vec4<f32> {\n    return (1.0 - relaxation) * get_streamfunction(x) + (relaxation / 4.0) * (get_streamfunction(add(x, dx)) + get_streamfunction(sub(x, dx)) + get_streamfunction(add(x, dy)) + get_streamfunction(sub(x, dy)) + get_vorticity(x));\n}\n\nfn advect_vorticity(x: Index) -> vec4<f32> {\n    const max_norm = f32(HALO_SIZE);\n    let y = subf(indexf(x), velocity(x, max_norm));\n    return get_vorticity_interpolate(y);\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn interact(id: Invocation) {\n\n    update_cache(id, VORTICITY, vorticity);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let x = vec2<f32>(index.global);\n                let y = interaction.position + 8.0 * sign(interaction.size) ;\n\n                let dims = vec2<f32>(canvas.size);\n                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));\n\n                var brush = 0.0;\n                if distance < abs(interaction.size) {\n                    brush += 0.1 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));\n                }\n\n                var vorticity_update = get_vorticity(index) + brush;\n                textureStore(vorticity, vec2<i32>(index.global), 0, vorticity_update);\n            }\n        }\n    }\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn advection(id: Invocation) {\n\n    update_cache(id, VORTICITY, vorticity);\n    update_cache(id, XVELOCITY, xvelocity);\n    update_cache(id, YVELOCITY, yvelocity);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                let vorticity_update = advect_vorticity(index) + diffuse_vorticity(index) * 0.01;\n                textureStore(vorticity, vec2<i32>(index.global), 0, vorticity_update);\n            }\n        }\n    }\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn projection(id: Invocation) {\n\n    update_cache(id, VORTICITY, vorticity);\n    update_cache(id, XVELOCITY, xvelocity);\n    update_cache(id, YVELOCITY, yvelocity);\n    update_cache(id, STREAMFUNCTION, streamfunction);\n    workgroupBarrier();\n\n    const relaxation = 1.4;\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // Red update\n                if (index.local.x + index.local.y) % 2u == 0u {\n                    let streamfunction_update = jacobi_iteration(index, relaxation);\n                    textureStore(streamfunction, vec2<i32>(index.global), 0, streamfunction_update);\n                }\n            }\n        }\n    }\n    update_cache(id, STREAMFUNCTION, streamfunction);\n    workgroupBarrier();\n\n    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {\n        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {\n\n            let index = get_index(id, tile_x, tile_y);\n            if check_bounds(index) {\n\n                // Black update\n                if (index.local.x + index.local.y) % 2u != 0u {\n                    let streamfunction_update = jacobi_iteration(index, relaxation);\n                    textureStore(streamfunction, vec2<i32>(index.global), 0, streamfunction_update);\n                }\n            }\n        }\n    }\n    update_velocity(id);\n}";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LE1BQU0sRUFBRSxhQUFhO1FBQ3JCLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLFNBQVM7S0FDZixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLE1BQXdCO0lBQzdDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25DLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztTQUFNLENBQUM7UUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7QUFDRixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBWSxFQUFFLFFBQWtCO0lBQ3hELElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBiaW5kaW5ncyBmcm9tIFwiLi9zaGFkZXJzL2luY2x1ZGVzL2JpbmRpbmdzLndnc2xcIjtcbmltcG9ydCBjYWNoZVV0aWxzIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvY2FjaGUud2dzbFwiO1xuXG5pbXBvcnQgY2VsbFZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2NlbGwudmVydC53Z3NsXCI7XG5pbXBvcnQgY2VsbEZyYWdtZW50U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC5mcmFnLndnc2xcIjtcbmltcG9ydCB0aW1lc3RlcENvbXB1dGVTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy92b3J0aWNpdHktc3RyZWFtZnVuY3Rpb24uY29tcC53Z3NsXCI7XG5cbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDE7XG5sZXQgZnJhbWVfaW5kZXggPSAwO1xuXG5hc3luYyBmdW5jdGlvbiBpbmRleCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0Ly8gc2V0dXAgYW5kIGNvbmZpZ3VyZSBXZWJHUFVcblx0Y29uc3QgZGV2aWNlID0gYXdhaXQgcmVxdWVzdERldmljZSgpO1xuXHRjb25zdCBjYW52YXMgPSBjb25maWd1cmVDYW52YXMoZGV2aWNlKTtcblxuXHQvLyBpbml0aWFsaXplIHZlcnRleCBidWZmZXIgYW5kIHRleHR1cmVzXG5cdGNvbnN0IFFVQUQgPSBbLTEsIC0xLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAxLCAxLCAtMSwgMV07XG5cdGNvbnN0IHF1YWQgPSBzZXR1cFZlcnRleEJ1ZmZlcihkZXZpY2UsIFwiUXVhZCBWZXJ0ZXggQnVmZmVyXCIsIFFVQUQpO1xuXG5cdGNvbnN0IEdST1VQX0lOREVYID0gMDtcblx0Y29uc3QgVkVSVEVYX0lOREVYID0gMDtcblx0Y29uc3QgUkVOREVSX0lOREVYID0gMDtcblxuXHRjb25zdCBCSU5ESU5HU19URVhUVVJFID0ge1xuXHRcdFZPUlRJQ0lUWTogMCxcblx0XHRTVFJFQU1GVU5DVElPTjogMSxcblx0XHRYVkVMT0NJVFk6IDIsXG5cdFx0WVZFTE9DSVRZOiAzLFxuXHRcdFhNQVA6IDQsXG5cdFx0WU1BUDogNSxcblx0fTtcblx0Y29uc3QgQklORElOR1NfQlVGRkVSID0geyBJTlRFUkFDVElPTjogNiwgQ0FOVkFTOiA3IH07XG5cblx0Y29uc3QgeG1hcCA9IG5ldyBBcnJheShjYW52YXMuc2l6ZS5oZWlnaHQpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGNhbnZhcy5zaXplLmhlaWdodDsgaSsrKSB7XG5cdFx0eG1hcFtpXSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBjYW52YXMuc2l6ZS53aWR0aDsgaisrKSB7XG5cdFx0XHR4bWFwW2ldLnB1c2goaiAvIGNhbnZhcy5zaXplLndpZHRoKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCB5bWFwID0gbmV3IEFycmF5KGNhbnZhcy5zaXplLmhlaWdodCk7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY2FudmFzLnNpemUuaGVpZ2h0OyBpKyspIHtcblx0XHR5bWFwW2ldID0gW107XG5cblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IGNhbnZhcy5zaXplLndpZHRoOyBqKyspIHtcblx0XHRcdHltYXBbaV0ucHVzaChpIC8gY2FudmFzLnNpemUuaGVpZ2h0KTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCB0ZXh0dXJlcyA9IHNldHVwVGV4dHVyZXMoXG5cdFx0ZGV2aWNlLFxuXHRcdE9iamVjdC52YWx1ZXMoQklORElOR1NfVEVYVFVSRSksXG5cdFx0e30sXG5cdFx0e1xuXHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOiBbMiwgMiwgMiwgMiwgMiwgMl0sXG5cdFx0XHR3aWR0aDogY2FudmFzLnNpemUud2lkdGgsXG5cdFx0XHRoZWlnaHQ6IGNhbnZhcy5zaXplLmhlaWdodCxcblx0XHR9XG5cdCk7XG5cblx0Y29uc3QgV09SS0dST1VQX1NJWkUgPSA4O1xuXHRjb25zdCBUSUxFX1NJWkUgPSAyO1xuXHRjb25zdCBIQUxPX1NJWkUgPSAxO1xuXG5cdGNvbnN0IENBQ0hFX1NJWkUgPSBUSUxFX1NJWkUgKiBXT1JLR1JPVVBfU0laRTtcblx0Y29uc3QgRElTUEFUQ0hfU0laRSA9IENBQ0hFX1NJWkUgLSAyICogSEFMT19TSVpFO1xuXG5cdGNvbnN0IFdPUktHUk9VUF9DT1VOVDogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwodGV4dHVyZXMuc2l6ZS53aWR0aCAvIERJU1BBVENIX1NJWkUpLFxuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLmhlaWdodCAvIERJU1BBVENIX1NJWkUpLFxuXHRdO1xuXG5cdC8vIHNldHVwIGludGVyYWN0aW9uc1xuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzLFxuXHRcdHRleHR1cmVzLnNpemVcblx0KTtcblxuXHRjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcblx0XHRsYWJlbDogXCJiaW5kR3JvdXBMYXlvdXRcIixcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX1RFWFRVUkUpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0dmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQgfCBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZTogdGV4dHVyZXMuYmluZGluZ0xheW91dCxcblx0XHRcdH0pKSxcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfQlVGRkVSKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UIHwgR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcblx0XHRcdFx0YnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIGFzIEdQVUJ1ZmZlckJpbmRpbmdUeXBlIH0sXG5cdFx0XHR9KSksXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgYmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0bGFiZWw6IGBCaW5kIEdyb3VwYCxcblx0XHRsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHQuLi5PYmplY3QudmFsdWVzKEJJTkRJTkdTX1RFWFRVUkUpLm1hcCgoYmluZGluZykgPT4gKHtcblx0XHRcdFx0YmluZGluZzogYmluZGluZyxcblx0XHRcdFx0cmVzb3VyY2U6IHRleHR1cmVzLnRleHR1cmVzW2JpbmRpbmddLmNyZWF0ZVZpZXcoKSxcblx0XHRcdH0pKSxcblx0XHRcdC4uLk9iamVjdC52YWx1ZXMoQklORElOR1NfQlVGRkVSKS5tYXAoKGJpbmRpbmcpID0+ICh7XG5cdFx0XHRcdGJpbmRpbmc6IGJpbmRpbmcsXG5cdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0YnVmZmVyOlxuXHRcdFx0XHRcdFx0YmluZGluZyA9PT0gQklORElOR1NfQlVGRkVSLklOVEVSQUNUSU9OXG5cdFx0XHRcdFx0XHRcdD8gaW50ZXJhY3Rpb25zLmJ1ZmZlclxuXHRcdFx0XHRcdFx0XHQ6IHRleHR1cmVzLmNhbnZhcy5idWZmZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSksXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgcGlwZWxpbmVMYXlvdXQgPSBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuXHRcdGxhYmVsOiBcInBpcGVsaW5lTGF5b3V0XCIsXG5cdFx0YmluZEdyb3VwTGF5b3V0czogW2JpbmRHcm91cExheW91dF0sXG5cdH0pO1xuXG5cdC8vIGNvbXBpbGUgc2hhZGVyc1xuXHRjb25zdCB0aW1lc3RlcFNoYWRlck1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdGxhYmVsOiBcInRpbWVzdGVwQ29tcHV0ZVNoYWRlclwiLFxuXHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyh0aW1lc3RlcENvbXB1dGVTaGFkZXIsIFtiaW5kaW5ncywgY2FjaGVVdGlsc10pLFxuXHR9KTtcblxuXHRjb25zdCBpbnRlcmFjdGlvblBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiaW50ZXJhY3Rpb25QaXBlbGluZVwiLFxuXHRcdGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG5cdFx0Y29tcHV0ZToge1xuXHRcdFx0ZW50cnlQb2ludDogXCJpbnRlcmFjdFwiLFxuXHRcdFx0bW9kdWxlOiB0aW1lc3RlcFNoYWRlck1vZHVsZSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBhZHZlY3Rpb25QaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcImFkdmVjdGlvblBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRlbnRyeVBvaW50OiBcImFkdmVjdGlvblwiLFxuXHRcdFx0bW9kdWxlOiB0aW1lc3RlcFNoYWRlck1vZHVsZSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBwcm9qZWN0aW9uUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcblx0XHRsYWJlbDogXCJwcm9qZWN0aW9uUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdGNvbXB1dGU6IHtcblx0XHRcdGVudHJ5UG9pbnQ6IFwicHJvamVjdGlvblwiLFxuXHRcdFx0bW9kdWxlOiB0aW1lc3RlcFNoYWRlck1vZHVsZSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogcHJlcGVuZEluY2x1ZGVzKGNlbGxWZXJ0ZXhTaGFkZXIsIFtiaW5kaW5nc10pLFxuXHRcdFx0XHRsYWJlbDogXCJjZWxsVmVydGV4U2hhZGVyXCIsXG5cdFx0XHR9KSxcblx0XHRcdGJ1ZmZlcnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGFycmF5U3RyaWRlOiBxdWFkLmFycmF5U3RyaWRlLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Zm9ybWF0OiBxdWFkLmZvcm1hdCxcblx0XHRcdFx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRcdFx0XHRzaGFkZXJMb2NhdGlvbjogVkVSVEVYX0lOREVYLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHRcdGZyYWdtZW50OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoY2VsbEZyYWdtZW50U2hhZGVyLCBbYmluZGluZ3NdKSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbEZyYWdtZW50U2hhZGVyXCIsXG5cdFx0XHR9KSxcblx0XHRcdHRhcmdldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGZvcm1hdDogY2FudmFzLmZvcm1hdCxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgY29sb3JBdHRhY2htZW50czogR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudFtdID0gW1xuXHRcdHtcblx0XHRcdHZpZXc6IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpLFxuXHRcdFx0bG9hZE9wOiBcImxvYWRcIixcblx0XHRcdHN0b3JlT3A6IFwic3RvcmVcIixcblx0XHR9LFxuXHRdO1xuXHRjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvciA9IHtcblx0XHRjb2xvckF0dGFjaG1lbnRzOiBjb2xvckF0dGFjaG1lbnRzLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHRjb25zdCBjb21tYW5kID0gZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cblx0XHQvLyBjb21wdXRlIHBhc3Ncblx0XHRjb25zdCBjb21wdXRlUGFzcyA9IGNvbW1hbmQuYmVnaW5Db21wdXRlUGFzcygpO1xuXHRcdGNvbXB1dGVQYXNzLnNldEJpbmRHcm91cChHUk9VUF9JTkRFWCwgYmluZEdyb3VwKTtcblxuXHRcdC8vIGludGVyYWN0XG5cdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUoaW50ZXJhY3Rpb25QaXBlbGluZSk7XG5cdFx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGludGVyYWN0aW9ucy5idWZmZXIsIDAsIGludGVyYWN0aW9ucy5kYXRhKTtcblx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoLi4uV09SS0dST1VQX0NPVU5UKTtcblxuXHRcdC8vIHByb2plY3Rcblx0XHRjb21wdXRlUGFzcy5zZXRQaXBlbGluZShwcm9qZWN0aW9uUGlwZWxpbmUpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMzA7IGkrKykge1xuXHRcdFx0Y29tcHV0ZVBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLldPUktHUk9VUF9DT1VOVCk7XG5cdFx0fVxuXG5cdFx0Ly8gYWR2ZWN0XG5cdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUoYWR2ZWN0aW9uUGlwZWxpbmUpO1xuXHRcdGNvbXB1dGVQYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5XT1JLR1JPVVBfQ09VTlQpO1xuXG5cdFx0Y29tcHV0ZVBhc3MuZW5kKCk7XG5cblx0XHQvLyByZW5kZXIgcGFzc1xuXHRcdGNvbnN0IHRleHR1cmUgPSBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuXHRcdGNvbnN0IHZpZXcgPSB0ZXh0dXJlLmNyZWF0ZVZpZXcoKTtcblxuXHRcdHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHNbUkVOREVSX0lOREVYXS52aWV3ID0gdmlldztcblx0XHRjb25zdCByZW5kZXJQYXNzID0gY29tbWFuZC5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuXHRcdHJlbmRlclBhc3Muc2V0QmluZEdyb3VwKEdST1VQX0lOREVYLCBiaW5kR3JvdXApO1xuXG5cdFx0cmVuZGVyUGFzcy5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRWZXJ0ZXhCdWZmZXIoVkVSVEVYX0lOREVYLCBxdWFkLnZlcnRleEJ1ZmZlcik7XG5cblx0XHRyZW5kZXJQYXNzLmRyYXcocXVhZC52ZXJ0ZXhDb3VudCk7XG5cdFx0cmVuZGVyUGFzcy5lbmQoKTtcblxuXHRcdC8vIHN1Ym1pdCB0aGUgY29tbWFuZCBidWZmZXJcblx0XHRkZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kLmZpbmlzaCgpXSk7XG5cdFx0dGV4dHVyZS5kZXN0cm95KCk7XG5cdFx0ZnJhbWVfaW5kZXgrKztcblx0fVxuXG5cdHNldEludGVydmFsKHJlbmRlciwgVVBEQVRFX0lOVEVSVkFMKTtcblx0cmV0dXJuO1xufVxuXG5pbmRleCgpO1xuIiwiZnVuY3Rpb24gdGhyb3dEZXRlY3Rpb25FcnJvcihlcnJvcjogc3RyaW5nKTogbmV2ZXIge1xuXHQoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi53ZWJncHUtbm90LXN1cHBvcnRlZFwiKSBhcyBIVE1MRWxlbWVudFxuXHQpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblx0dGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGluaXRpYWxpemUgV2ViR1BVOiBcIiArIGVycm9yKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWVzdERldmljZShcblx0b3B0aW9uczogR1BVUmVxdWVzdEFkYXB0ZXJPcHRpb25zID0ge1xuXHRcdHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIsXG5cdH0sXG5cdHJlcXVpcmVkRmVhdHVyZXM6IEdQVUZlYXR1cmVOYW1lW10gPSBbXSxcblx0cmVxdWlyZWRMaW1pdHM6IFJlY29yZDxzdHJpbmcsIHVuZGVmaW5lZCB8IG51bWJlcj4gPSB7XG5cdFx0bWF4U3RvcmFnZVRleHR1cmVzUGVyU2hhZGVyU3RhZ2U6IDgsXG5cdH1cbik6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKG9wdGlvbnMpO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKHtcblx0XHRyZXF1aXJlZEZlYXR1cmVzOiByZXF1aXJlZEZlYXR1cmVzLFxuXHRcdHJlcXVpcmVkTGltaXRzOiByZXF1aXJlZExpbWl0cyxcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemUgPSB7IHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgfVxuKToge1xuXHRjb250ZXh0OiBHUFVDYW52YXNDb250ZXh0O1xuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfTtcbn0ge1xuXHRjb25zdCBjYW52YXMgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHNpemUpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cblx0Y29uc3QgY29udGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIikhLmdldENvbnRleHQoXCJ3ZWJncHVcIik7XG5cdGlmICghY29udGV4dCkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIkNhbnZhcyBkb2VzIG5vdCBzdXBwb3J0IFdlYkdQVVwiKTtcblxuXHRjb25zdCBmb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXHRjb250ZXh0LmNvbmZpZ3VyZSh7XG5cdFx0ZGV2aWNlOiBkZXZpY2UsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcblx0XHRhbHBoYU1vZGU6IFwicHJlbXVsdGlwbGllZFwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCwgc2l6ZTogc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFxuXHRcdHZlcnRleEJ1ZmZlcixcblx0XHQvKmJ1ZmZlck9mZnNldD0qLyAwLFxuXHRcdC8qZGF0YT0qLyBhcnJheVxuXHQpO1xuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFRleHR1cmVzKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0YmluZGluZ3M6IG51bWJlcltdLFxuXHRkYXRhOiB7IFtrZXk6IG51bWJlcl06IG51bWJlcltdIH0sXG5cdHNpemU6IHtcblx0XHRkZXB0aE9yQXJyYXlMYXllcnM6IHsgW2tleTogbnVtYmVyXTogbnVtYmVyIH07XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fVxuKToge1xuXHRjYW52YXM6IHtcblx0XHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0XHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0XHR0eXBlOiBHUFVCdWZmZXJCaW5kaW5nVHlwZTtcblx0fTtcblx0dGV4dHVyZXM6IHsgW2tleTogbnVtYmVyXTogR1BVVGV4dHVyZSB9O1xuXHRiaW5kaW5nTGF5b3V0OiBHUFVTdG9yYWdlVGV4dHVyZUJpbmRpbmdMYXlvdXQ7XG5cdHNpemU6IHtcblx0XHRkZXB0aE9yQXJyYXlMYXllcnM6IHsgW2tleTogbnVtYmVyXTogbnVtYmVyIH07XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fTtcbn0ge1xuXHRjb25zdCBGT1JNQVQgPSBcInIzMmZsb2F0XCI7XG5cdGNvbnN0IENIQU5ORUxTID0gY2hhbm5lbENvdW50KEZPUk1BVCk7XG5cdGNvbnN0IHRleHR1cmVzOiB7IFtrZXk6IG51bWJlcl06IEdQVVRleHR1cmUgfSA9IHt9O1xuXG5cdGJpbmRpbmdzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdHRleHR1cmVzW2tleV0gPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcblx0XHRcdGZvcm1hdDogRk9STUFULFxuXHRcdFx0c2l6ZToge1xuXHRcdFx0XHR3aWR0aDogc2l6ZS53aWR0aCxcblx0XHRcdFx0aGVpZ2h0OiBzaXplLmhlaWdodCxcblx0XHRcdFx0ZGVwdGhPckFycmF5TGF5ZXJzOlxuXHRcdFx0XHRcdGtleSBpbiBzaXplLmRlcHRoT3JBcnJheUxheWVyc1xuXHRcdFx0XHRcdFx0PyBzaXplLmRlcHRoT3JBcnJheUxheWVyc1trZXldXG5cdFx0XHRcdFx0XHQ6IDEsXG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9KTtcblxuXHRPYmplY3Qua2V5cyh0ZXh0dXJlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0Y29uc3QgcmFuZG9tID0gbmV3IEFycmF5KHNpemUud2lkdGggKiBzaXplLmhlaWdodCk7XG5cdFx0Y29uc3QgZGVwdGhPckFycmF5TGF5ZXJzID1cblx0XHRcdGtleSBpbiBzaXplLmRlcHRoT3JBcnJheUxheWVyc1xuXHRcdFx0XHQ/IHNpemUuZGVwdGhPckFycmF5TGF5ZXJzW3BhcnNlSW50KGtleSldXG5cdFx0XHRcdDogMTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0OyBpKyspIHtcblx0XHRcdHJhbmRvbVtpXSA9IFtdO1xuXG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IGRlcHRoT3JBcnJheUxheWVyczsgaisrKSB7XG5cdFx0XHRcdHJhbmRvbVtpXS5wdXNoKDIgKiBNYXRoLnJhbmRvbSgpIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXJyYXkgPVxuXHRcdFx0a2V5IGluIGRhdGFcblx0XHRcdFx0PyBuZXcgRmxvYXQzMkFycmF5KGRhdGFbcGFyc2VJbnQoa2V5KV0uZmxhdCgpKVxuXHRcdFx0XHQ6IG5ldyBGbG9hdDMyQXJyYXkocmFuZG9tLmZsYXQoKSk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdFx0eyB0ZXh0dXJlOiB0ZXh0dXJlc1twYXJzZUludChrZXkpXSB9LFxuXHRcdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdFx0LypkYXRhTGF5b3V0PSovIHtcblx0XHRcdFx0b2Zmc2V0OiAwLFxuXHRcdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRcdHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQsXG5cdFx0XHR9LFxuXHRcdFx0LypzaXplPSovIHtcblx0XHRcdFx0d2lkdGg6IHNpemUud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogc2l6ZS5oZWlnaHQsXG5cdFx0XHRcdGRlcHRoT3JBcnJheUxheWVyczogZGVwdGhPckFycmF5TGF5ZXJzLFxuXHRcdFx0fVxuXHRcdCk7XG5cdH0pO1xuXG5cdGxldCBjYW52YXNEYXRhID0gbmV3IFVpbnQzMkFycmF5KFtzaXplLndpZHRoLCBzaXplLmhlaWdodCwgMCwgMF0pO1xuXHRjb25zdCBjYW52YXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJDYW52YXMgQnVmZmVyXCIsXG5cdFx0c2l6ZTogY2FudmFzRGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihjYW52YXNCdWZmZXIsIC8qb2Zmc2V0PSovIDAsIC8qZGF0YT0qLyBjYW52YXNEYXRhKTtcblxuXHRyZXR1cm4ge1xuXHRcdGNhbnZhczoge1xuXHRcdFx0YnVmZmVyOiBjYW52YXNCdWZmZXIsXG5cdFx0XHRkYXRhOiBjYW52YXNEYXRhLFxuXHRcdFx0dHlwZTogXCJ1bmlmb3JtXCIsXG5cdFx0fSxcblx0XHR0ZXh0dXJlczogdGV4dHVyZXMsXG5cdFx0YmluZGluZ0xheW91dDoge1xuXHRcdFx0Zm9ybWF0OiBGT1JNQVQsXG5cdFx0XHRhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuXHRcdFx0dmlld0RpbWVuc2lvbjogXCIyZC1hcnJheVwiLFxuXHRcdH0sXG5cdFx0c2l6ZTogc2l6ZSxcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBJbnRlcmFjdGlvbnMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgT2Zmc2NyZWVuQ2FudmFzLFxuXHR0ZXh0dXJlOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG5cdHNpemU6IG51bWJlciA9IDEwMFxuKToge1xuXHRidWZmZXI6IEdQVUJ1ZmZlcjtcblx0ZGF0YTogQnVmZmVyU291cmNlIHwgU2hhcmVkQXJyYXlCdWZmZXI7XG5cdHR5cGU6IEdQVUJ1ZmZlckJpbmRpbmdUeXBlO1xufSB7XG5cdGxldCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcblx0dmFyIHNpZ24gPSAxO1xuXG5cdGxldCBwb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xuXHRsZXQgdmVsb2NpdHkgPSB7IHg6IDAsIHk6IDAgfTtcblxuXHRkYXRhLnNldChbcG9zaXRpb24ueCwgcG9zaXRpb24ueV0pO1xuXHRpZiAoY2FudmFzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcblx0XHQvLyBkaXNhYmxlIGNvbnRleHQgbWVudVxuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgeCA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueSAvIGNhbnZhcy5oZWlnaHQpICogdGV4dHVyZS5oZWlnaHRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyB6b29tIGV2ZW50cyBUT0RPKEBnc3plcCkgYWRkIHBpbmNoIGFuZCBzY3JvbGwgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJ3aGVlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2l6ZSArPSB2ZWxvY2l0eS55O1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY2xpY2sgZXZlbnRzIFRPRE8oQGdzemVwKSBpbXBsZW1lbnQgcmlnaHQgY2xpY2sgZXF1aXZhbGVudCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSAxIC0gZXZlbnQuYnV0dG9uO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaWduICogc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRbXCJtb3VzZXVwXCIsIFwidG91Y2hlbmRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtOYU5dLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByZXBlbmRJbmNsdWRlcyhjb2RlOiBzdHJpbmcsIGluY2x1ZGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG5cdGNvZGUgPSBjb2RlLnJlcGxhY2UoL14jaW1wb3J0LiovZ20sIFwiXCIpO1xuXHRyZXR1cm4gaW5jbHVkZXMucmVkdWNlKChhY2MsIGluY2x1ZGUpID0+IGluY2x1ZGUgKyBcIlxcblwiICsgYWNjLCBjb2RlKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=