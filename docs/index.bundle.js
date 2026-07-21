"use strict";
(self["webpackChunkfluid_structure_interactive"] = self["webpackChunkfluid_structure_interactive"] || []).push([["index"],{

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
/* harmony import */ var _shaders_includes_common_wgsl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shaders/includes/common.wgsl */ "./src/shaders/includes/common.wgsl");
/* harmony import */ var _shaders_lbrmt_comp_wgsl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shaders/lbrmt.comp.wgsl */ "./src/shaders/lbrmt.comp.wgsl");
/* harmony import */ var _shaders_quad_vert_wgsl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shaders/quad.vert.wgsl */ "./src/shaders/quad.vert.wgsl");
/* harmony import */ var _shaders_render_frag_wgsl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shaders/render.frag.wgsl */ "./src/shaders/render.frag.wgsl");





const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
const SIM_SCALE = isMobile ? 3 : 2; // canvas pixels per simulation cell
const SUBSTEPS = isMobile ? 2 : 8; // simulation steps per rendered frame
const WORKGROUP_SIZE = 8;
async function main() {
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    const grid = {
        width: Math.ceil(canvas.size.width / SIM_SCALE),
        height: Math.ceil(canvas.size.height / SIM_SCALE),
    };
    // ------------------------- simulation parameters -------------------------
    const scale = Math.min(grid.width, grid.height);
    const muscleRadius = 0.018 * scale;
    const settings = {
        tau: 0.8, // LB relaxation time; viscosity nu = (tau - 0.5) / 3
        shearModulus: 0.04, // G (LB units); shear wave speed = sqrt(G / rho)
        bulkModulus: 0.12, // kappa ~ 3G
        epsilon: 2.0, // blur-zone half-width (cells)
        center: [grid.width / 2, grid.height / 2],
        halfLength: 0.1 * scale,
        radius: 0.035 * scale,
        muscleHalfLength: 0.06 * scale,
        muscleRadius: muscleRadius,
        actuationAmp: Math.log(1.8) / muscleRadius, // max active stretch 1.8x
        actuationFreq: (2 * Math.PI) / 500, // one stroke every 500 steps
    };
    const paramsData = new ArrayBuffer(64);
    const paramsU32 = new Uint32Array(paramsData);
    const paramsF32 = new Float32Array(paramsData);
    paramsU32.set([grid.width, grid.height, 0, SUBSTEPS], 0);
    paramsF32.set([
        settings.tau,
        settings.shearModulus,
        settings.bulkModulus,
        settings.epsilon,
        ...settings.center,
        settings.halfLength,
        settings.radius,
        settings.muscleHalfLength,
        settings.muscleRadius,
        settings.actuationAmp,
        settings.actuationFreq,
    ], 4);
    const paramsBuffer = device.createBuffer({
        label: "Params Buffer",
        size: paramsData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const interactions = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(device, canvas.context.canvas, grid);
    // --------------------- state textures (ping-pong) ------------------------
    // reference map xi = (X, Y) and D2Q9 populations f_0..f_8
    const xi = [0, 1].map((i) => (0,_utils__WEBPACK_IMPORTED_MODULE_0__.createFieldTexture)(device, `xi${i}`, grid, "rg32float"));
    const dist = [0, 1].map((i) => (0,_utils__WEBPACK_IMPORTED_MODULE_0__.createFieldTexture)(device, `dist${i}`, grid, "r32float", 9));
    // identity reference map
    const cells = grid.width * grid.height;
    const xiInit = new Float32Array(cells * 2);
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            const i = 2 * (y * grid.width + x);
            xiInit[i] = x;
            xiInit[i + 1] = y;
        }
    }
    xi.forEach((t) => (0,_utils__WEBPACK_IMPORTED_MODULE_0__.writeFieldTexture)(device, t, grid, 1, 8, xiInit));
    // equilibrium populations of a quiescent fluid (rho = 1, v = 0)
    const weights = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
    const fInit = new Float32Array(cells * 9);
    weights.forEach((w, layer) => fInit.fill(w, layer * cells, (layer + 1) * cells));
    dist.forEach((t) => (0,_utils__WEBPACK_IMPORTED_MODULE_0__.writeFieldTexture)(device, t, grid, 9, 4, fInit));
    // ------------------------------ pipelines --------------------------------
    const computeLayout = device.createBindGroupLayout({
        label: "computeLayout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "unfilterable-float" } },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "unfilterable-float", viewDimension: "2d-array" } },
            { binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: "write-only", format: "rg32float" } },
            { binding: 5, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: "write-only", format: "r32float", viewDimension: "2d-array" } },
        ],
    });
    const renderLayout = device.createBindGroupLayout({
        label: "renderLayout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float", viewDimension: "2d-array" } },
        ],
    });
    const computeModule = device.createShaderModule({
        label: "lbrmtComputeShader",
        code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_lbrmt_comp_wgsl__WEBPACK_IMPORTED_MODULE_2__, [_shaders_includes_common_wgsl__WEBPACK_IMPORTED_MODULE_1__]),
    });
    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeLayout],
    });
    const [advectPipeline, collidePipeline] = ["advect", "collide"].map((entryPoint) => device.createComputePipeline({
        label: entryPoint,
        layout: computePipelineLayout,
        compute: { module: computeModule, entryPoint: entryPoint },
    }));
    const quad = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(device, "Quad Vertex Buffer", [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
    const renderPipeline = device.createRenderPipeline({
        label: "renderPipeline",
        layout: device.createPipelineLayout({ bindGroupLayouts: [renderLayout] }),
        vertex: {
            module: device.createShaderModule({
                label: "quadVertexShader",
                code: _shaders_quad_vert_wgsl__WEBPACK_IMPORTED_MODULE_3__,
            }),
            buffers: [
                {
                    arrayStride: quad.arrayStride,
                    attributes: [{ format: quad.format, offset: 0, shaderLocation: 0 }],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({
                label: "renderFragmentShader",
                code: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.prependIncludes)(_shaders_render_frag_wgsl__WEBPACK_IMPORTED_MODULE_4__, [_shaders_includes_common_wgsl__WEBPACK_IMPORTED_MODULE_1__]),
            }),
            targets: [{ format: canvas.format }],
        },
    });
    // ------------------------------ bind groups ------------------------------
    const xiViews = xi.map((t) => t.createView());
    const fViews = dist.map((t) => t.createView());
    const computeBindGroup = (label, xiSrc, fSrc, xiDst, fDst) => device.createBindGroup({
        label: label,
        layout: computeLayout,
        entries: [
            { binding: 0, resource: { buffer: paramsBuffer } },
            { binding: 1, resource: { buffer: interactions.buffer } },
            { binding: 2, resource: xiViews[xiSrc] },
            { binding: 3, resource: fViews[fSrc] },
            { binding: 4, resource: xiViews[xiDst] },
            { binding: 5, resource: fViews[fDst] },
        ],
    });
    // d = index of the textures holding the current state
    // advect: reads xi[d], f[d] -> writes xi[1-d]
    // collide: reads xi[1-d] (new), f[d] -> writes f[1-d]
    const advectGroups = [0, 1].map((d) => computeBindGroup(`advect${d}`, d, d, 1 - d, 1 - d));
    const collideGroups = [0, 1].map((d) => computeBindGroup(`collide${d}`, 1 - d, d, d, 1 - d));
    const renderGroups = [0, 1].map((d) => device.createBindGroup({
        label: `render${d}`,
        layout: renderLayout,
        entries: [
            { binding: 0, resource: { buffer: paramsBuffer } },
            { binding: 1, resource: xiViews[d] },
            { binding: 2, resource: fViews[d] },
        ],
    }));
    // ------------------------------ main loop --------------------------------
    const workgroups = [
        Math.ceil(grid.width / WORKGROUP_SIZE),
        Math.ceil(grid.height / WORKGROUP_SIZE),
    ];
    let current = 0;
    let step = 0;
    function frame() {
        paramsU32[2] = step;
        device.queue.writeBuffer(paramsBuffer, 0, paramsData);
        device.queue.writeBuffer(interactions.buffer, 0, interactions.data);
        const encoder = device.createCommandEncoder();
        const compute = encoder.beginComputePass();
        for (let s = 0; s < SUBSTEPS; s++) {
            compute.setPipeline(advectPipeline);
            compute.setBindGroup(0, advectGroups[current]);
            compute.dispatchWorkgroups(...workgroups);
            compute.setPipeline(collidePipeline);
            compute.setBindGroup(0, collideGroups[current]);
            compute.dispatchWorkgroups(...workgroups);
            current = 1 - current;
        }
        compute.end();
        step += SUBSTEPS;
        const render = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: canvas.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    storeOp: "store",
                },
            ],
        });
        render.setPipeline(renderPipeline);
        render.setBindGroup(0, renderGroups[current]);
        render.setVertexBuffer(0, quad.vertexBuffer);
        render.draw(quad.vertexCount);
        render.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
main();


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   configureCanvas: () => (/* binding */ configureCanvas),
/* harmony export */   createFieldTexture: () => (/* binding */ createFieldTexture),
/* harmony export */   prependIncludes: () => (/* binding */ prependIncludes),
/* harmony export */   requestDevice: () => (/* binding */ requestDevice),
/* harmony export */   setupInteractions: () => (/* binding */ setupInteractions),
/* harmony export */   setupVertexBuffer: () => (/* binding */ setupVertexBuffer),
/* harmony export */   writeFieldTexture: () => (/* binding */ writeFieldTexture)
/* harmony export */ });
function throwDetectionError(error) {
    document.querySelector(".webgpu-not-supported").style.visibility = "visible";
    throw new Error("Could not initialize WebGPU: " + error);
}
async function requestDevice() {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
    });
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    return adapter.requestDevice();
}
function configureCanvas(device, size = { width: window.innerWidth, height: window.innerHeight }) {
    const canvas = Object.assign(document.createElement("canvas"), size);
    document.body.appendChild(canvas);
    const context = canvas.getContext("webgpu");
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
    device.queue.writeBuffer(vertexBuffer, 0, array);
    return {
        vertexBuffer: vertexBuffer,
        vertexCount: array.length / 2,
        arrayStride: 2 * array.BYTES_PER_ELEMENT,
        format: "float32x2",
    };
}
/** Create a texture used as both a sampled source and a storage destination. */
function createFieldTexture(device, label, size, format, layers = 1) {
    return device.createTexture({
        label: label,
        format: format,
        size: { width: size.width, height: size.height, depthOrArrayLayers: layers },
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.STORAGE_BINDING |
            GPUTextureUsage.COPY_DST,
    });
}
function writeFieldTexture(device, texture, size, layers, bytesPerTexel, data) {
    device.queue.writeTexture({ texture: texture }, data, { bytesPerRow: size.width * bytesPerTexel, rowsPerImage: size.height }, { width: size.width, height: size.height, depthOrArrayLayers: layers });
}
/**
 * Cursor interactions. Returns a uniform buffer of [x, y, signedRadius, pad]
 * in simulation-grid coordinates. signedRadius is positive while pushing
 * (left click / one finger), negative while pulling (right click / two
 * fingers) and zero when inactive. Scroll adjusts the radius.
 */
function setupInteractions(device, canvas, grid, radius = 50) {
    const data = new Float32Array(4);
    let sign = 1;
    const setPosition = (x, y) => {
        data[0] = (x / canvas.width) * grid.width;
        data[1] = (y / canvas.height) * grid.height;
    };
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("mousemove", (event) => setPosition(event.offsetX, event.offsetY), { passive: true });
    canvas.addEventListener("touchmove", (event) => setPosition(event.touches[0].clientX, event.touches[0].clientY), { passive: true });
    canvas.addEventListener("mousedown", (event) => {
        sign = event.button === 2 ? -1 : 1;
        setPosition(event.offsetX, event.offsetY);
        data[2] = sign * radius;
    });
    canvas.addEventListener("touchstart", (event) => {
        sign = event.touches.length > 1 ? -1 : 1;
        setPosition(event.touches[0].clientX, event.touches[0].clientY);
        data[2] = sign * radius;
    }, { passive: true });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((type) => {
        canvas.addEventListener(type, () => {
            data[2] = 0;
        });
    });
    canvas.addEventListener("wheel", (event) => {
        const limit = 0.5 * Math.min(grid.width, grid.height);
        radius = Math.min(Math.max(radius + event.deltaY * 0.05, 5), limit);
        if (data[2] !== 0)
            data[2] = sign * radius;
    }, { passive: true });
    const buffer = device.createBuffer({
        label: "Interaction Buffer",
        size: data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    return { buffer: buffer, data: data };
}
/** Replace `#import` directives by prepending the included source files. */
function prependIncludes(code, includes) {
    code = code.replace(/^#import.*/gm, "");
    return includes.reduce((acc, include) => include + "\n" + acc, code);
}



/***/ }),

/***/ "./src/shaders/includes/common.wgsl":
/*!******************************************!*\
  !*** ./src/shaders/includes/common.wgsl ***!
  \******************************************/
/***/ ((module) => {

module.exports = "// Shared constants, structs and helpers for the lattice-Boltzmann\n// reference map technique (LBRMT) solver.\n//\n// References:\n//   Sun (2020), \"A lattice Boltzmann implementation of the reference map technique\"\n//   Sun & Rycroft (2025), JCP 526 113774, https://github.com/yue-sun/lbrmt\n//\n// Shaders that include this file must declare:\n//   var<uniform> params: Params;\n//   var xi_tex: texture_2d<f32>;        // current reference map (X, Y)\n//   (WGSL module-scope declarations are order-independent.)\n\nconst PI = 3.141592653589793;\nconst EPS = 1e-6;\n\n// D2Q9 lattice vectors and weights\nconst C = array<vec2<i32>, 9>(\n    vec2<i32>(0, 0),\n    vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1),\n    vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1),\n);\nconst W = array<f32, 9>(\n    4.0 / 9.0,\n    1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0,\n    1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0,\n);\n\nstruct Params {\n    size: vec2<u32>,           // simulation grid size\n    step: u32,                 // global step counter\n    substeps: u32,             // steps per rendered frame\n    tau: f32,                  // LB relaxation time (viscosity)\n    shear_modulus: f32,        // G of the neo-Hookean solid\n    bulk_modulus: f32,         // kappa, resists volume change\n    epsilon: f32,              // blur-zone half-width (cells)\n    center: vec2<f32>,         // shape centre in reference space\n    half_length: f32,          // capsule half-length\n    radius: f32,               // capsule radius\n    muscle_half_length: f32,   // actuated region half-length\n    muscle_radius: f32,        // actuated region radius\n    actuation_amp: f32,        // log(max stretch) / muscle_radius\n    actuation_freq: f32,       // radians per step\n};\n\nstruct Interaction {\n    position: vec2<f32>,       // cursor position (grid cells)\n    size: f32,                 // signed radius; 0 = inactive\n};\n\n// Periodic wrap of integer grid coordinates.\nfn wrap_i(x: vec2<i32>) -> vec2<i32> {\n    let s = vec2<i32>(params.size);\n    return (x % s + s) % s;\n}\n\nfn xi_at(x: vec2<i32>) -> vec2<f32> {\n    return textureLoad(xi_tex, wrap_i(x), 0).xy;\n}\n\n// Reference map of a neighbour, unwrapped to be continuous with `ref`\n// (on a torus the reference map is multivalued modulo the domain size).\nfn xi_near(x: vec2<i32>, ref: vec2<f32>) -> vec2<f32> {\n    let s = vec2<f32>(params.size);\n    let v = xi_at(x);\n    return v - s * round((v - ref) / s);\n}\n\n// Position in the solid's reference frame (relative to the shape centre).\nfn reference_coord(xi: vec2<f32>) -> vec2<f32> {\n    let s = vec2<f32>(params.size);\n    let d = xi - params.center;\n    return d - s * round(d / s);\n}\n\n// Signed distance of a capsule (segment of half-length hl, radius r).\nfn capsule(p: vec2<f32>, hl: f32, r: f32) -> f32 {\n    let qx = abs(p.x) - hl;\n    return select(length(vec2<f32>(qx, p.y)), abs(p.y), qx < 0.0) - r;\n}\n\n// Level set of the solid, evaluated through the reference map:\n// phi < 0 inside the solid, phi > 0 in the fluid.\nfn level_set(xi: vec2<f32>) -> f32 {\n    return capsule(reference_coord(xi), params.half_length, params.radius);\n}\n\n// Smoothed Heaviside: 1 in the solid, 0 in the fluid,\n// blur zone of half-width epsilon (2020 JFM transition function).\nfn solid_fraction(phi: f32) -> f32 {\n    let e = params.epsilon;\n    if (phi >= e) { return 0.0; }\n    if (phi <= -e) { return 1.0; }\n    let t = phi / e;\n    return 0.5 - 0.5 * t - sin(PI * t) / (2.0 * PI);\n}\n\nfn clamp_mag(v: vec2<f32>, m: f32) -> vec2<f32> {\n    let l = length(v);\n    return select(v, v * (m / l), l > m);\n}\n\n// Maxwell-Boltzmann equilibrium populations (second-order expansion).\nfn equilibrium(rho: f32, v: vec2<f32>) -> array<f32, 9> {\n    var feq: array<f32, 9>;\n    let usq = dot(v, v);\n    for (var i = 0; i < 9; i++) {\n        let cu = dot(vec2<f32>(C[i]), v);\n        feq[i] = W[i] * rho * (1.0 + 3.0 * cu + 4.5 * cu * cu - 1.5 * usq);\n    }\n    return feq;\n}\n\n// Second-order ENO derivative (Shu 1998), component-wise on vec2.\n// For positive advection velocity call with (downwind, centre, upwind, upwind2);\n// negate and mirror the arguments for negative velocity.\nfn eno2(v0: vec2<f32>, v1: vec2<f32>, v2: vec2<f32>, v3: vec2<f32>) -> vec2<f32> {\n    let a = abs(v0 - 2.0 * v1 + v2);\n    let b = abs(v1 - 2.0 * v2 + v3);\n    let central = 0.5 * (v0 - v2);\n    let onesided = 1.5 * v1 - 2.0 * v2 + 0.5 * v3;\n    return select(onesided, central, a < b);\n}\n";

/***/ }),

/***/ "./src/shaders/lbrmt.comp.wgsl":
/*!*************************************!*\
  !*** ./src/shaders/lbrmt.comp.wgsl ***!
  \*************************************/
/***/ ((module) => {

module.exports = "#import includes::common\n\n// LBRMT compute passes.\n//\n// Each timestep runs two dispatches over ping-pong textures:\n//   1. `advect`  - update the reference map xi with the local fluid velocity\n//   2. `collide` - solid stress from xi, then a forced lattice-Boltzmann\n//                  update (pull streaming + BGK collision with Guo forcing)\n//\n// The reference map is advected *everywhere*: it is the backward flow map, so\n// the solid region is exactly { x : phi(xi(x)) < 0 }. This replaces the\n// layer-by-layer least-squares extrapolation of the original method with an\n// embarrassingly parallel scheme.\n\n@group(0) @binding(0) var<uniform> params: Params;\n@group(0) @binding(1) var<uniform> interaction: Interaction;\n@group(0) @binding(2) var xi_tex: texture_2d<f32>;\n@group(0) @binding(3) var f_tex: texture_2d_array<f32>;\n@group(0) @binding(4) var xi_out: texture_storage_2d<rg32float, write>;\n@group(0) @binding(5) var f_out: texture_storage_2d_array<r32float, write>;\n\n// Populations streamed to node x (pull scheme):\n// f_i(x, t+1) = f^post-collision_i(x - c_i, t).\nfn pull(x: vec2<i32>) -> array<f32, 9> {\n    var f: array<f32, 9>;\n    for (var i = 0; i < 9; i++) {\n        f[i] = textureLoad(f_tex, wrap_i(x - C[i]), i, 0).r;\n    }\n    return f;\n}\n\n// Zeroth and first moments: (rho, momentum).\nfn moments(f: array<f32, 9>) -> vec3<f32> {\n    var rho = 0.0;\n    var mom = vec2<f32>(0.0);\n    for (var i = 0; i < 9; i++) {\n        rho += f[i];\n        mom += f[i] * vec2<f32>(C[i]);\n    }\n    return vec3<f32>(rho, mom);\n}\n\n// ---------------------------------------------------------------------------\n// Pass 1: advect the reference map, d xi/dt + (v . grad) xi = 0.\n// ---------------------------------------------------------------------------\n@compute @workgroup_size(8, 8)\nfn advect(@builtin(global_invocation_id) gid: vec3<u32>) {\n    if (any(gid.xy >= params.size)) { return; }\n    let x = vec2<i32>(gid.xy);\n\n    let m = moments(pull(x));\n    let v = m.yz / max(m.x, EPS);\n\n    let c = xi_at(x);\n    let r1 = xi_near(x + vec2(1, 0), c);\n    let r2 = xi_near(x + vec2(2, 0), c);\n    let l1 = xi_near(x - vec2(1, 0), c);\n    let l2 = xi_near(x - vec2(2, 0), c);\n    let u1 = xi_near(x + vec2(0, 1), c);\n    let u2 = xi_near(x + vec2(0, 2), c);\n    let d1 = xi_near(x - vec2(0, 1), c);\n    let d2 = xi_near(x - vec2(0, 2), c);\n\n    var ddx: vec2<f32>;\n    if (v.x > 0.0) { ddx = eno2(r1, c, l1, l2); } else { ddx = -eno2(l1, c, r1, r2); }\n    var ddy: vec2<f32>;\n    if (v.y > 0.0) { ddy = eno2(u1, c, d1, d2); } else { ddy = -eno2(d1, c, u1, u2); }\n\n    var xi_new = c - (v.x * ddx + v.y * ddy);\n\n    // Far from the solid the reference map is never used for stresses; gently\n    // diffuse it there to keep the field smooth and bounded.\n    let w = 0.1 * smoothstep(2.0 * params.epsilon, 6.0 * params.epsilon, level_set(c));\n    xi_new = mix(xi_new, 0.25 * (r1 + l1 + u1 + d1), w);\n\n    textureStore(xi_out, x, vec4<f32>(xi_new, 0.0, 0.0));\n}\n\n// ---------------------------------------------------------------------------\n// Pass 2: solid stress + forced lattice-Boltzmann update.\n// ---------------------------------------------------------------------------\n\n// Time-periodic muscle contraction: one-sided pulses (power stroke) with\n// elastic recovery in between, like the lbrmt jellyfish flapper.\nfn contraction() -> f32 {\n    let s = sin(params.actuation_freq * f32(params.step));\n    let s2 = s * s;\n    let s4 = s2 * s2;\n    return -params.actuation_amp * s4 * s4;\n}\n\n// Neo-Hookean stress at a cell edge, from the Jacobian of the reference map,\n// smoothed by the solid fraction. Includes the active muscle deformation.\nfn edge_stress(jac: mat2x2<f32>, xi_edge: vec2<f32>, phi_edge: f32, con: f32) -> mat2x2<f32> {\n    let zero = mat2x2<f32>(vec2<f32>(0.0), vec2<f32>(0.0));\n    let sf = solid_fraction(phi_edge);\n    if (sf <= 0.0) { return zero; }\n\n    let det = determinant(jac);\n    if (abs(det) < 1e-3) { return zero; }\n\n    // Deformation gradient F = (d xi / d x)^-1\n    var F = mat2x2<f32>(\n        vec2<f32>(jac[1][1], -jac[0][1]),\n        vec2<f32>(-jac[1][0], jac[0][0]),\n    ) * (1.0 / det);\n\n    // Active deformation: area-preserving stretch along the body axis, graded\n    // across the thickness (X.y) so the body bends.\n    let X = reference_coord(xi_edge);\n    let muscle = solid_fraction(capsule(X, params.muscle_half_length, params.muscle_radius));\n    let fac = clamp(exp(con * X.y * muscle), 0.5, 2.0);\n    F[0] *= fac;\n    F[1] *= 1.0 / fac;\n\n    // Compressible neo-Hookean constitutive law (plane strain)\n    let J = clamp(1.0 / det, 0.1, 10.0);\n    let B = F * transpose(F);\n    let I = mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0));\n    let dev = B - ((B[0][0] + B[1][1] + 1.0) / 3.0) * I;\n    return sf * (params.shear_modulus * dev + params.bulk_modulus * (J - 1.0) * I);\n}\n\n// Radial push (left click / one finger) or pull (right click / two fingers).\nfn interaction_force(p: vec2<f32>) -> vec2<f32> {\n    let a = abs(interaction.size);\n    if (a < 1.0) { return vec2<f32>(0.0); }\n    let s = vec2<f32>(params.size);\n    var d = p - interaction.position;\n    d -= s * round(d / s);\n    let r = length(d);\n    if (r >= a || r < 1e-3) { return vec2<f32>(0.0); }\n    return (0.02 * sign(interaction.size) * exp(-r * r / a) / r) * d;\n}\n\n@compute @workgroup_size(8, 8)\nfn collide(@builtin(global_invocation_id) gid: vec3<u32>) {\n    if (any(gid.xy >= params.size)) { return; }\n    let x = vec2<i32>(gid.xy);\n\n    // 3x3 neighbourhood of the freshly advected reference map\n    var xi: array<vec2<f32>, 9>; // index (dx+1) + 3*(dy+1)\n    var phi: array<f32, 9>;\n    let ctr = xi_at(x);\n    for (var dy = -1; dy <= 1; dy++) {\n        for (var dx = -1; dx <= 1; dx++) {\n            let n = xi_near(x + vec2(dx, dy), ctr);\n            xi[(dx + 1) + 3 * (dy + 1)] = n;\n            phi[(dx + 1) + 3 * (dy + 1)] = level_set(n);\n        }\n    }\n    let dl = 0; let dd = 1; let dr = 2;\n    let ll = 3; let cc = 4; let rr = 5;\n    let ul = 6; let uu = 7; let ur = 8;\n\n    let con = contraction();\n\n    // Half-edge stresses (second-order finite differences of xi, as in lbrmt)\n    let sL = edge_stress(\n        mat2x2<f32>(xi[cc] - xi[ll], 0.25 * (xi[uu] + xi[ul] - xi[dd] - xi[dl])),\n        0.5 * (xi[cc] + xi[ll]), 0.5 * (phi[cc] + phi[ll]), con);\n    let sR = edge_stress(\n        mat2x2<f32>(xi[rr] - xi[cc], 0.25 * (xi[ur] + xi[uu] - xi[dr] - xi[dd])),\n        0.5 * (xi[rr] + xi[cc]), 0.5 * (phi[rr] + phi[cc]), con);\n    let sB = edge_stress(\n        mat2x2<f32>(0.25 * (xi[rr] + xi[dr] - xi[ll] - xi[dl]), xi[cc] - xi[dd]),\n        0.5 * (xi[cc] + xi[dd]), 0.5 * (phi[cc] + phi[dd]), con);\n    let sT = edge_stress(\n        mat2x2<f32>(0.25 * (xi[ur] + xi[rr] - xi[ul] - xi[ll]), xi[uu] - xi[cc]),\n        0.5 * (xi[uu] + xi[cc]), 0.5 * (phi[uu] + phi[cc]), con);\n\n    // Divergence of the solid stress + user interaction\n    var force = (sR[0] - sL[0]) + (sT[1] - sB[1]);\n    force += interaction_force(vec2<f32>(x));\n    force = clamp_mag(force, 0.1);\n\n    // Forced BGK collision (Guo forcing, second order in velocity space)\n    let f = pull(x);\n    let m = moments(f);\n    let rho = max(m.x, EPS);\n    var v = (m.yz + 0.5 * force) / rho;\n    v = clamp_mag(v, 0.35);\n\n    let feq = equilibrium(rho, v);\n    let itau = 1.0 / params.tau;\n    let fw = 1.0 - 0.5 * itau;\n\n    for (var i = 0; i < 9; i++) {\n        let ci = vec2<f32>(C[i]);\n        let Fi = W[i] * (3.0 * dot(ci - v, force) + 9.0 * dot(ci, v) * dot(ci, force));\n        let fi = f[i] - itau * (f[i] - feq[i]) + fw * Fi;\n        textureStore(f_out, x, i, vec4<f32>(fi, 0.0, 0.0, 0.0));\n    }\n}\n";

/***/ }),

/***/ "./src/shaders/quad.vert.wgsl":
/*!************************************!*\
  !*** ./src/shaders/quad.vert.wgsl ***!
  \************************************/
/***/ ((module) => {

module.exports = "struct Output {\n    @builtin(position) position: vec4<f32>,\n    @location(0) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\n@vertex\nfn main(@location(0) position: vec2<f32>) -> Output {\n    var output: Output;\n    output.position = vec4<f32>(position.x, -position.y, 0.0, 1.0);\n    output.coordinate = position;\n    return output;\n}\n";

/***/ }),

/***/ "./src/shaders/render.frag.wgsl":
/*!**************************************!*\
  !*** ./src/shaders/render.frag.wgsl ***!
  \**************************************/
/***/ ((module) => {

module.exports = "#import includes::common\n\n// Visualization: fluid vorticity (warm/cool glow) and the solid, shaded with\n// its deformed reference-space grid.\n\nstruct Input {\n    @location(0) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n    @location(0) color: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> params: Params;\n@group(0) @binding(1) var xi_tex: texture_2d<f32>;\n@group(0) @binding(2) var f_tex: texture_2d_array<f32>;\n\nfn velocity(x: vec2<i32>) -> vec2<f32> {\n    var rho = 0.0;\n    var mom = vec2<f32>(0.0);\n    for (var i = 0; i < 9; i++) {\n        let fi = textureLoad(f_tex, wrap_i(x), i, 0).r;\n        rho += fi;\n        mom += fi * vec2<f32>(C[i]);\n    }\n    return mom / max(rho, EPS);\n}\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>(vec2<f32>(params.size) * (0.5 * input.coordinate + 0.5));\n\n    // fluid: vorticity + a hint of speed\n    let vort = 0.5 * ((velocity(x + vec2(1, 0)).y - velocity(x - vec2(1, 0)).y)\n                    - (velocity(x + vec2(0, 1)).x - velocity(x - vec2(0, 1)).x));\n    let speed = length(velocity(x));\n\n    var color = vec3<f32>(0.03, 0.04, 0.06);\n    let w = clamp(vort * 300.0, -1.0, 1.0);\n    color += max(w, 0.0) * vec3<f32>(0.9, 0.25, 0.1);\n    color += max(-w, 0.0) * vec3<f32>(0.1, 0.4, 0.9);\n    color += min(speed * 3.0, 0.5) * vec3<f32>(0.25, 0.25, 0.3);\n\n    // solid: shaded with its (deformed) reference-space grid\n    let xi = xi_at(x);\n    let phi = level_set(xi);\n    let lambda = solid_fraction(phi);\n    if (lambda > 0.0) {\n        let X = reference_coord(xi);\n        let g = cos(X.x * PI / 4.0) * cos(X.y * PI / 4.0);\n        let grid = smoothstep(-0.3, 0.3, g);\n        let solid_color = mix(vec3<f32>(0.85, 0.35, 0.08), vec3<f32>(1.0, 0.8, 0.25), grid);\n        color = mix(color, solid_color, lambda);\n    }\n\n    output.color = vec4<f32>(color, 1.0);\n    return output;\n}\n";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFXQyIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0Y3JlYXRlRmllbGRUZXh0dXJlLFxuXHR3cml0ZUZpZWxkVGV4dHVyZSxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHByZXBlbmRJbmNsdWRlcyxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IGNvbW1vbiBmcm9tIFwiLi9zaGFkZXJzL2luY2x1ZGVzL2NvbW1vbi53Z3NsXCI7XG5pbXBvcnQgY29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL2xicm10LmNvbXAud2dzbFwiO1xuaW1wb3J0IHZlcnRleFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3F1YWQudmVydC53Z3NsXCI7XG5pbXBvcnQgZnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9yZW5kZXIuZnJhZy53Z3NsXCI7XG5cbmNvbnN0IGlzTW9iaWxlID0gL0FuZHJvaWR8aVBob25lfGlQYWR8aVBvZHxPcGVyYSBNaW5pfElFTW9iaWxlfFdQRGVza3RvcC9pLnRlc3QoXG5cdG5hdmlnYXRvci51c2VyQWdlbnRcbik7XG5cbmNvbnN0IFNJTV9TQ0FMRSA9IGlzTW9iaWxlID8gMyA6IDI7IC8vIGNhbnZhcyBwaXhlbHMgcGVyIHNpbXVsYXRpb24gY2VsbFxuY29uc3QgU1VCU1RFUFMgPSBpc01vYmlsZSA/IDIgOiA4OyAvLyBzaW11bGF0aW9uIHN0ZXBzIHBlciByZW5kZXJlZCBmcmFtZVxuY29uc3QgV09SS0dST1VQX1NJWkUgPSA4O1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBkZXZpY2UgPSBhd2FpdCByZXF1ZXN0RGV2aWNlKCk7XG5cdGNvbnN0IGNhbnZhcyA9IGNvbmZpZ3VyZUNhbnZhcyhkZXZpY2UpO1xuXHRjb25zdCBncmlkID0ge1xuXHRcdHdpZHRoOiBNYXRoLmNlaWwoY2FudmFzLnNpemUud2lkdGggLyBTSU1fU0NBTEUpLFxuXHRcdGhlaWdodDogTWF0aC5jZWlsKGNhbnZhcy5zaXplLmhlaWdodCAvIFNJTV9TQ0FMRSksXG5cdH07XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBzaW11bGF0aW9uIHBhcmFtZXRlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRjb25zdCBzY2FsZSA9IE1hdGgubWluKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KTtcblx0Y29uc3QgbXVzY2xlUmFkaXVzID0gMC4wMTggKiBzY2FsZTtcblx0Y29uc3Qgc2V0dGluZ3MgPSB7XG5cdFx0dGF1OiAwLjgsIC8vIExCIHJlbGF4YXRpb24gdGltZTsgdmlzY29zaXR5IG51ID0gKHRhdSAtIDAuNSkgLyAzXG5cdFx0c2hlYXJNb2R1bHVzOiAwLjA0LCAvLyBHIChMQiB1bml0cyk7IHNoZWFyIHdhdmUgc3BlZWQgPSBzcXJ0KEcgLyByaG8pXG5cdFx0YnVsa01vZHVsdXM6IDAuMTIsIC8vIGthcHBhIH4gM0dcblx0XHRlcHNpbG9uOiAyLjAsIC8vIGJsdXItem9uZSBoYWxmLXdpZHRoIChjZWxscylcblx0XHRjZW50ZXI6IFtncmlkLndpZHRoIC8gMiwgZ3JpZC5oZWlnaHQgLyAyXSxcblx0XHRoYWxmTGVuZ3RoOiAwLjEgKiBzY2FsZSxcblx0XHRyYWRpdXM6IDAuMDM1ICogc2NhbGUsXG5cdFx0bXVzY2xlSGFsZkxlbmd0aDogMC4wNiAqIHNjYWxlLFxuXHRcdG11c2NsZVJhZGl1czogbXVzY2xlUmFkaXVzLFxuXHRcdGFjdHVhdGlvbkFtcDogTWF0aC5sb2coMS44KSAvIG11c2NsZVJhZGl1cywgLy8gbWF4IGFjdGl2ZSBzdHJldGNoIDEuOHhcblx0XHRhY3R1YXRpb25GcmVxOiAoMiAqIE1hdGguUEkpIC8gNTAwLCAvLyBvbmUgc3Ryb2tlIGV2ZXJ5IDUwMCBzdGVwc1xuXHR9O1xuXG5cdGNvbnN0IHBhcmFtc0RhdGEgPSBuZXcgQXJyYXlCdWZmZXIoNjQpO1xuXHRjb25zdCBwYXJhbXNVMzIgPSBuZXcgVWludDMyQXJyYXkocGFyYW1zRGF0YSk7XG5cdGNvbnN0IHBhcmFtc0YzMiA9IG5ldyBGbG9hdDMyQXJyYXkocGFyYW1zRGF0YSk7XG5cdHBhcmFtc1UzMi5zZXQoW2dyaWQud2lkdGgsIGdyaWQuaGVpZ2h0LCAwLCBTVUJTVEVQU10sIDApO1xuXHRwYXJhbXNGMzIuc2V0KFxuXHRcdFtcblx0XHRcdHNldHRpbmdzLnRhdSxcblx0XHRcdHNldHRpbmdzLnNoZWFyTW9kdWx1cyxcblx0XHRcdHNldHRpbmdzLmJ1bGtNb2R1bHVzLFxuXHRcdFx0c2V0dGluZ3MuZXBzaWxvbixcblx0XHRcdC4uLnNldHRpbmdzLmNlbnRlcixcblx0XHRcdHNldHRpbmdzLmhhbGZMZW5ndGgsXG5cdFx0XHRzZXR0aW5ncy5yYWRpdXMsXG5cdFx0XHRzZXR0aW5ncy5tdXNjbGVIYWxmTGVuZ3RoLFxuXHRcdFx0c2V0dGluZ3MubXVzY2xlUmFkaXVzLFxuXHRcdFx0c2V0dGluZ3MuYWN0dWF0aW9uQW1wLFxuXHRcdFx0c2V0dGluZ3MuYWN0dWF0aW9uRnJlcSxcblx0XHRdLFxuXHRcdDRcblx0KTtcblxuXHRjb25zdCBwYXJhbXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogXCJQYXJhbXMgQnVmZmVyXCIsXG5cdFx0c2l6ZTogcGFyYW1zRGF0YS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKFxuXHRcdGRldmljZSxcblx0XHRjYW52YXMuY29udGV4dC5jYW52YXMgYXMgSFRNTENhbnZhc0VsZW1lbnQsXG5cdFx0Z3JpZFxuXHQpO1xuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLSBzdGF0ZSB0ZXh0dXJlcyAocGluZy1wb25nKSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gcmVmZXJlbmNlIG1hcCB4aSA9IChYLCBZKSBhbmQgRDJROSBwb3B1bGF0aW9ucyBmXzAuLmZfOFxuXHRjb25zdCB4aSA9IFswLCAxXS5tYXAoKGkpID0+XG5cdFx0Y3JlYXRlRmllbGRUZXh0dXJlKGRldmljZSwgYHhpJHtpfWAsIGdyaWQsIFwicmczMmZsb2F0XCIpXG5cdCk7XG5cdGNvbnN0IGRpc3QgPSBbMCwgMV0ubWFwKChpKSA9PlxuXHRcdGNyZWF0ZUZpZWxkVGV4dHVyZShkZXZpY2UsIGBkaXN0JHtpfWAsIGdyaWQsIFwicjMyZmxvYXRcIiwgOSlcblx0KTtcblxuXHQvLyBpZGVudGl0eSByZWZlcmVuY2UgbWFwXG5cdGNvbnN0IGNlbGxzID0gZ3JpZC53aWR0aCAqIGdyaWQuaGVpZ2h0O1xuXHRjb25zdCB4aUluaXQgPSBuZXcgRmxvYXQzMkFycmF5KGNlbGxzICogMik7XG5cdGZvciAobGV0IHkgPSAwOyB5IDwgZ3JpZC5oZWlnaHQ7IHkrKykge1xuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgZ3JpZC53aWR0aDsgeCsrKSB7XG5cdFx0XHRjb25zdCBpID0gMiAqICh5ICogZ3JpZC53aWR0aCArIHgpO1xuXHRcdFx0eGlJbml0W2ldID0geDtcblx0XHRcdHhpSW5pdFtpICsgMV0gPSB5O1xuXHRcdH1cblx0fVxuXHR4aS5mb3JFYWNoKCh0KSA9PiB3cml0ZUZpZWxkVGV4dHVyZShkZXZpY2UsIHQsIGdyaWQsIDEsIDgsIHhpSW5pdCkpO1xuXG5cdC8vIGVxdWlsaWJyaXVtIHBvcHVsYXRpb25zIG9mIGEgcXVpZXNjZW50IGZsdWlkIChyaG8gPSAxLCB2ID0gMClcblx0Y29uc3Qgd2VpZ2h0cyA9IFs0IC8gOSwgMSAvIDksIDEgLyA5LCAxIC8gOSwgMSAvIDksIDEgLyAzNiwgMSAvIDM2LCAxIC8gMzYsIDEgLyAzNl07XG5cdGNvbnN0IGZJbml0ID0gbmV3IEZsb2F0MzJBcnJheShjZWxscyAqIDkpO1xuXHR3ZWlnaHRzLmZvckVhY2goKHcsIGxheWVyKSA9PiBmSW5pdC5maWxsKHcsIGxheWVyICogY2VsbHMsIChsYXllciArIDEpICogY2VsbHMpKTtcblx0ZGlzdC5mb3JFYWNoKCh0KSA9PiB3cml0ZUZpZWxkVGV4dHVyZShkZXZpY2UsIHQsIGdyaWQsIDksIDQsIGZJbml0KSk7XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHBpcGVsaW5lcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRjb25zdCBjb21wdXRlTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZUxheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHsgYmluZGluZzogMCwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogMSwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogMiwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgdGV4dHVyZTogeyBzYW1wbGVUeXBlOiBcInVuZmlsdGVyYWJsZS1mbG9hdFwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogMywgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgdGV4dHVyZTogeyBzYW1wbGVUeXBlOiBcInVuZmlsdGVyYWJsZS1mbG9hdFwiLCB2aWV3RGltZW5zaW9uOiBcIjJkLWFycmF5XCIgfSB9LFxuXHRcdFx0eyBiaW5kaW5nOiA0LCB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLCBzdG9yYWdlVGV4dHVyZTogeyBhY2Nlc3M6IFwid3JpdGUtb25seVwiLCBmb3JtYXQ6IFwicmczMmZsb2F0XCIgfSB9LFxuXHRcdFx0eyBiaW5kaW5nOiA1LCB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLCBzdG9yYWdlVGV4dHVyZTogeyBhY2Nlc3M6IFwid3JpdGUtb25seVwiLCBmb3JtYXQ6IFwicjMyZmxvYXRcIiwgdmlld0RpbWVuc2lvbjogXCIyZC1hcnJheVwiIH0gfSxcblx0XHRdLFxuXHR9KTtcblx0Y29uc3QgcmVuZGVyTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG5cdFx0bGFiZWw6IFwicmVuZGVyTGF5b3V0XCIsXG5cdFx0ZW50cmllczogW1xuXHRcdFx0eyBiaW5kaW5nOiAwLCB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogMSwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsIHRleHR1cmU6IHsgc2FtcGxlVHlwZTogXCJ1bmZpbHRlcmFibGUtZmxvYXRcIiB9IH0sXG5cdFx0XHR7IGJpbmRpbmc6IDIsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5ULCB0ZXh0dXJlOiB7IHNhbXBsZVR5cGU6IFwidW5maWx0ZXJhYmxlLWZsb2F0XCIsIHZpZXdEaW1lbnNpb246IFwiMmQtYXJyYXlcIiB9IH0sXG5cdFx0XSxcblx0fSk7XG5cblx0Y29uc3QgY29tcHV0ZU1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdGxhYmVsOiBcImxicm10Q29tcHV0ZVNoYWRlclwiLFxuXHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhjb21wdXRlU2hhZGVyLCBbY29tbW9uXSksXG5cdH0pO1xuXHRjb25zdCBjb21wdXRlUGlwZWxpbmVMYXlvdXQgPSBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuXHRcdGJpbmRHcm91cExheW91dHM6IFtjb21wdXRlTGF5b3V0XSxcblx0fSk7XG5cdGNvbnN0IFthZHZlY3RQaXBlbGluZSwgY29sbGlkZVBpcGVsaW5lXSA9IFtcImFkdmVjdFwiLCBcImNvbGxpZGVcIl0ubWFwKFxuXHRcdChlbnRyeVBvaW50KSA9PlxuXHRcdFx0ZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0XHRcdGxhYmVsOiBlbnRyeVBvaW50LFxuXHRcdFx0XHRsYXlvdXQ6IGNvbXB1dGVQaXBlbGluZUxheW91dCxcblx0XHRcdFx0Y29tcHV0ZTogeyBtb2R1bGU6IGNvbXB1dGVNb2R1bGUsIGVudHJ5UG9pbnQ6IGVudHJ5UG9pbnQgfSxcblx0XHRcdH0pXG5cdCk7XG5cblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKFxuXHRcdGRldmljZSxcblx0XHRcIlF1YWQgVmVydGV4IEJ1ZmZlclwiLFxuXHRcdFstMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSwgLTEsIDEsIDEsIC0xLCAxXVxuXHQpO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7IGJpbmRHcm91cExheW91dHM6IFtyZW5kZXJMYXlvdXRdIH0pLFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0bGFiZWw6IFwicXVhZFZlcnRleFNoYWRlclwiLFxuXHRcdFx0XHRjb2RlOiB2ZXJ0ZXhTaGFkZXIsXG5cdFx0XHR9KSxcblx0XHRcdGJ1ZmZlcnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGFycmF5U3RyaWRlOiBxdWFkLmFycmF5U3RyaWRlLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IFt7IGZvcm1hdDogcXVhZC5mb3JtYXQsIG9mZnNldDogMCwgc2hhZGVyTG9jYXRpb246IDAgfV0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGxhYmVsOiBcInJlbmRlckZyYWdtZW50U2hhZGVyXCIsXG5cdFx0XHRcdGNvZGU6IHByZXBlbmRJbmNsdWRlcyhmcmFnbWVudFNoYWRlciwgW2NvbW1vbl0pLFxuXHRcdFx0fSksXG5cdFx0XHR0YXJnZXRzOiBbeyBmb3JtYXQ6IGNhbnZhcy5mb3JtYXQgfV0sXG5cdFx0fSxcblx0fSk7XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbmQgZ3JvdXBzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRjb25zdCB4aVZpZXdzID0geGkubWFwKCh0KSA9PiB0LmNyZWF0ZVZpZXcoKSk7XG5cdGNvbnN0IGZWaWV3cyA9IGRpc3QubWFwKCh0KSA9PiB0LmNyZWF0ZVZpZXcoKSk7XG5cblx0Y29uc3QgY29tcHV0ZUJpbmRHcm91cCA9IChcblx0XHRsYWJlbDogc3RyaW5nLFxuXHRcdHhpU3JjOiBudW1iZXIsXG5cdFx0ZlNyYzogbnVtYmVyLFxuXHRcdHhpRHN0OiBudW1iZXIsXG5cdFx0ZkRzdDogbnVtYmVyXG5cdCkgPT5cblx0XHRkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRcdGxhYmVsOiBsYWJlbCxcblx0XHRcdGxheW91dDogY29tcHV0ZUxheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0eyBiaW5kaW5nOiAwLCByZXNvdXJjZTogeyBidWZmZXI6IHBhcmFtc0J1ZmZlciB9IH0sXG5cdFx0XHRcdHsgYmluZGluZzogMSwgcmVzb3VyY2U6IHsgYnVmZmVyOiBpbnRlcmFjdGlvbnMuYnVmZmVyIH0gfSxcblx0XHRcdFx0eyBiaW5kaW5nOiAyLCByZXNvdXJjZTogeGlWaWV3c1t4aVNyY10gfSxcblx0XHRcdFx0eyBiaW5kaW5nOiAzLCByZXNvdXJjZTogZlZpZXdzW2ZTcmNdIH0sXG5cdFx0XHRcdHsgYmluZGluZzogNCwgcmVzb3VyY2U6IHhpVmlld3NbeGlEc3RdIH0sXG5cdFx0XHRcdHsgYmluZGluZzogNSwgcmVzb3VyY2U6IGZWaWV3c1tmRHN0XSB9LFxuXHRcdFx0XSxcblx0XHR9KTtcblxuXHQvLyBkID0gaW5kZXggb2YgdGhlIHRleHR1cmVzIGhvbGRpbmcgdGhlIGN1cnJlbnQgc3RhdGVcblx0Ly8gYWR2ZWN0OiByZWFkcyB4aVtkXSwgZltkXSAtPiB3cml0ZXMgeGlbMS1kXVxuXHQvLyBjb2xsaWRlOiByZWFkcyB4aVsxLWRdIChuZXcpLCBmW2RdIC0+IHdyaXRlcyBmWzEtZF1cblx0Y29uc3QgYWR2ZWN0R3JvdXBzID0gWzAsIDFdLm1hcCgoZCkgPT5cblx0XHRjb21wdXRlQmluZEdyb3VwKGBhZHZlY3Qke2R9YCwgZCwgZCwgMSAtIGQsIDEgLSBkKVxuXHQpO1xuXHRjb25zdCBjb2xsaWRlR3JvdXBzID0gWzAsIDFdLm1hcCgoZCkgPT5cblx0XHRjb21wdXRlQmluZEdyb3VwKGBjb2xsaWRlJHtkfWAsIDEgLSBkLCBkLCBkLCAxIC0gZClcblx0KTtcblx0Y29uc3QgcmVuZGVyR3JvdXBzID0gWzAsIDFdLm1hcCgoZCkgPT5cblx0XHRkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRcdGxhYmVsOiBgcmVuZGVyJHtkfWAsXG5cdFx0XHRsYXlvdXQ6IHJlbmRlckxheW91dCxcblx0XHRcdGVudHJpZXM6IFtcblx0XHRcdFx0eyBiaW5kaW5nOiAwLCByZXNvdXJjZTogeyBidWZmZXI6IHBhcmFtc0J1ZmZlciB9IH0sXG5cdFx0XHRcdHsgYmluZGluZzogMSwgcmVzb3VyY2U6IHhpVmlld3NbZF0gfSxcblx0XHRcdFx0eyBiaW5kaW5nOiAyLCByZXNvdXJjZTogZlZpZXdzW2RdIH0sXG5cdFx0XHRdLFxuXHRcdH0pXG5cdCk7XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1haW4gbG9vcCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRjb25zdCB3b3JrZ3JvdXBzOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuXHRcdE1hdGguY2VpbChncmlkLndpZHRoIC8gV09SS0dST1VQX1NJWkUpLFxuXHRcdE1hdGguY2VpbChncmlkLmhlaWdodCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XTtcblxuXHRsZXQgY3VycmVudCA9IDA7XG5cdGxldCBzdGVwID0gMDtcblxuXHRmdW5jdGlvbiBmcmFtZSgpIHtcblx0XHRwYXJhbXNVMzJbMl0gPSBzdGVwO1xuXHRcdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihwYXJhbXNCdWZmZXIsIDAsIHBhcmFtc0RhdGEpO1xuXHRcdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihpbnRlcmFjdGlvbnMuYnVmZmVyLCAwLCBpbnRlcmFjdGlvbnMuZGF0YSk7XG5cblx0XHRjb25zdCBlbmNvZGVyID0gZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cblx0XHRjb25zdCBjb21wdXRlID0gZW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKCk7XG5cdFx0Zm9yIChsZXQgcyA9IDA7IHMgPCBTVUJTVEVQUzsgcysrKSB7XG5cdFx0XHRjb21wdXRlLnNldFBpcGVsaW5lKGFkdmVjdFBpcGVsaW5lKTtcblx0XHRcdGNvbXB1dGUuc2V0QmluZEdyb3VwKDAsIGFkdmVjdEdyb3Vwc1tjdXJyZW50XSk7XG5cdFx0XHRjb21wdXRlLmRpc3BhdGNoV29ya2dyb3VwcyguLi53b3JrZ3JvdXBzKTtcblxuXHRcdFx0Y29tcHV0ZS5zZXRQaXBlbGluZShjb2xsaWRlUGlwZWxpbmUpO1xuXHRcdFx0Y29tcHV0ZS5zZXRCaW5kR3JvdXAoMCwgY29sbGlkZUdyb3Vwc1tjdXJyZW50XSk7XG5cdFx0XHRjb21wdXRlLmRpc3BhdGNoV29ya2dyb3VwcyguLi53b3JrZ3JvdXBzKTtcblxuXHRcdFx0Y3VycmVudCA9IDEgLSBjdXJyZW50O1xuXHRcdH1cblx0XHRjb21wdXRlLmVuZCgpO1xuXHRcdHN0ZXAgKz0gU1VCU1RFUFM7XG5cblx0XHRjb25zdCByZW5kZXIgPSBlbmNvZGVyLmJlZ2luUmVuZGVyUGFzcyh7XG5cdFx0XHRjb2xvckF0dGFjaG1lbnRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2aWV3OiBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0XHRsb2FkT3A6IFwiY2xlYXJcIixcblx0XHRcdFx0XHRjbGVhclZhbHVlOiB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDEgfSxcblx0XHRcdFx0XHRzdG9yZU9wOiBcInN0b3JlXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0pO1xuXHRcdHJlbmRlci5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyLnNldEJpbmRHcm91cCgwLCByZW5kZXJHcm91cHNbY3VycmVudF0pO1xuXHRcdHJlbmRlci5zZXRWZXJ0ZXhCdWZmZXIoMCwgcXVhZC52ZXJ0ZXhCdWZmZXIpO1xuXHRcdHJlbmRlci5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlci5lbmQoKTtcblxuXHRcdGRldmljZS5xdWV1ZS5zdWJtaXQoW2VuY29kZXIuZmluaXNoKCldKTtcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuXHR9XG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG59XG5cbm1haW4oKTtcbiIsImludGVyZmFjZSBTaXplIHtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcblx0KFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnRcblx0KS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIFdlYkdQVTogXCIgKyBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIoe1xuXHRcdHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIsXG5cdH0pO1xuXHRpZiAoIWFkYXB0ZXIpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJObyBHUFUgYWRhcHRlciBmb3VuZFwiKTtcblxuXHRyZXR1cm4gYWRhcHRlci5yZXF1ZXN0RGV2aWNlKCk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemU6IFNpemUgPSB7IHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgfVxuKToge1xuXHRjb250ZXh0OiBHUFVDYW52YXNDb250ZXh0O1xuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdHNpemU6IFNpemU7XG59IHtcblx0Y29uc3QgY2FudmFzID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLCBzaXplKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG5cdGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdwdVwiKTtcblx0aWYgKCFjb250ZXh0KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiQ2FudmFzIGRvZXMgbm90IHN1cHBvcnQgV2ViR1BVXCIpO1xuXG5cdGNvbnN0IGZvcm1hdCA9IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCk7XG5cdGNvbnRleHQuY29uZmlndXJlKHtcblx0XHRkZXZpY2U6IGRldmljZSxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHR1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuXHRcdGFscGhhTW9kZTogXCJwcmVtdWx0aXBsaWVkXCIsXG5cdH0pO1xuXG5cdHJldHVybiB7IGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwVmVydGV4QnVmZmVyKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0ZGF0YTogbnVtYmVyW11cbik6IHtcblx0dmVydGV4QnVmZmVyOiBHUFVCdWZmZXI7XG5cdHZlcnRleENvdW50OiBudW1iZXI7XG5cdGFycmF5U3RyaWRlOiBudW1iZXI7XG5cdGZvcm1hdDogR1BVVmVydGV4Rm9ybWF0O1xufSB7XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblx0Y29uc3QgdmVydGV4QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdHNpemU6IGFycmF5LmJ5dGVMZW5ndGgsXG5cdFx0dXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblx0ZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKHZlcnRleEJ1ZmZlciwgMCwgYXJyYXkpO1xuXG5cdHJldHVybiB7XG5cdFx0dmVydGV4QnVmZmVyOiB2ZXJ0ZXhCdWZmZXIsXG5cdFx0dmVydGV4Q291bnQ6IGFycmF5Lmxlbmd0aCAvIDIsXG5cdFx0YXJyYXlTdHJpZGU6IDIgKiBhcnJheS5CWVRFU19QRVJfRUxFTUVOVCxcblx0XHRmb3JtYXQ6IFwiZmxvYXQzMngyXCIsXG5cdH07XG59XG5cbi8qKiBDcmVhdGUgYSB0ZXh0dXJlIHVzZWQgYXMgYm90aCBhIHNhbXBsZWQgc291cmNlIGFuZCBhIHN0b3JhZ2UgZGVzdGluYXRpb24uICovXG5mdW5jdGlvbiBjcmVhdGVGaWVsZFRleHR1cmUoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRsYWJlbDogc3RyaW5nLFxuXHRzaXplOiBTaXplLFxuXHRmb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQsXG5cdGxheWVyczogbnVtYmVyID0gMVxuKTogR1BVVGV4dHVyZSB7XG5cdHJldHVybiBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHNpemU6IHsgd2lkdGg6IHNpemUud2lkdGgsIGhlaWdodDogc2l6ZS5oZWlnaHQsIGRlcHRoT3JBcnJheUxheWVyczogbGF5ZXJzIH0sXG5cdFx0dXNhZ2U6XG5cdFx0XHRHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHxcblx0XHRcdEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcgfFxuXHRcdFx0R1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVGaWVsZFRleHR1cmUoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHR0ZXh0dXJlOiBHUFVUZXh0dXJlLFxuXHRzaXplOiBTaXplLFxuXHRsYXllcnM6IG51bWJlcixcblx0Ynl0ZXNQZXJUZXhlbDogbnVtYmVyLFxuXHRkYXRhOiBGbG9hdDMyQXJyYXlcbik6IHZvaWQge1xuXHRkZXZpY2UucXVldWUud3JpdGVUZXh0dXJlKFxuXHRcdHsgdGV4dHVyZTogdGV4dHVyZSB9LFxuXHRcdGRhdGEsXG5cdFx0eyBieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGJ5dGVzUGVyVGV4ZWwsIHJvd3NQZXJJbWFnZTogc2l6ZS5oZWlnaHQgfSxcblx0XHR7IHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBkZXB0aE9yQXJyYXlMYXllcnM6IGxheWVycyB9XG5cdCk7XG59XG5cbi8qKlxuICogQ3Vyc29yIGludGVyYWN0aW9ucy4gUmV0dXJucyBhIHVuaWZvcm0gYnVmZmVyIG9mIFt4LCB5LCBzaWduZWRSYWRpdXMsIHBhZF1cbiAqIGluIHNpbXVsYXRpb24tZ3JpZCBjb29yZGluYXRlcy4gc2lnbmVkUmFkaXVzIGlzIHBvc2l0aXZlIHdoaWxlIHB1c2hpbmdcbiAqIChsZWZ0IGNsaWNrIC8gb25lIGZpbmdlciksIG5lZ2F0aXZlIHdoaWxlIHB1bGxpbmcgKHJpZ2h0IGNsaWNrIC8gdHdvXG4gKiBmaW5nZXJzKSBhbmQgemVybyB3aGVuIGluYWN0aXZlLiBTY3JvbGwgYWRqdXN0cyB0aGUgcmFkaXVzLlxuICovXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsXG5cdGdyaWQ6IFNpemUsXG5cdHJhZGl1czogbnVtYmVyID0gNTBcbik6IHtcblx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdGRhdGE6IEZsb2F0MzJBcnJheTtcbn0ge1xuXHRjb25zdCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcblx0bGV0IHNpZ24gPSAxO1xuXG5cdGNvbnN0IHNldFBvc2l0aW9uID0gKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB7XG5cdFx0ZGF0YVswXSA9ICh4IC8gY2FudmFzLndpZHRoKSAqIGdyaWQud2lkdGg7XG5cdFx0ZGF0YVsxXSA9ICh5IC8gY2FudmFzLmhlaWdodCkgKiBncmlkLmhlaWdodDtcblx0fTtcblxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG5cblx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XCJtb3VzZW1vdmVcIixcblx0XHQoZXZlbnQpID0+IHNldFBvc2l0aW9uKGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkpLFxuXHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdCk7XG5cdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFwidG91Y2htb3ZlXCIsXG5cdFx0KGV2ZW50KSA9PlxuXHRcdFx0c2V0UG9zaXRpb24oZXZlbnQudG91Y2hlc1swXS5jbGllbnRYLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkpLFxuXHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdCk7XG5cblx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2ZW50KSA9PiB7XG5cdFx0c2lnbiA9IGV2ZW50LmJ1dHRvbiA9PT0gMiA/IC0xIDogMTtcblx0XHRzZXRQb3NpdGlvbihldmVudC5vZmZzZXRYLCBldmVudC5vZmZzZXRZKTtcblx0XHRkYXRhWzJdID0gc2lnbiAqIHJhZGl1cztcblx0fSk7XG5cdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFwidG91Y2hzdGFydFwiLFxuXHRcdChldmVudCkgPT4ge1xuXHRcdFx0c2lnbiA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSA/IC0xIDogMTtcblx0XHRcdHNldFBvc2l0aW9uKGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCwgZXZlbnQudG91Y2hlc1swXS5jbGllbnRZKTtcblx0XHRcdGRhdGFbMl0gPSBzaWduICogcmFkaXVzO1xuXHRcdH0sXG5cdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0KTtcblxuXHRbXCJtb3VzZXVwXCIsIFwibW91c2VsZWF2ZVwiLCBcInRvdWNoZW5kXCIsIFwidG91Y2hjYW5jZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsICgpID0+IHtcblx0XHRcdGRhdGFbMl0gPSAwO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcIndoZWVsXCIsXG5cdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBsaW1pdCA9IDAuNSAqIE1hdGgubWluKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KTtcblx0XHRcdHJhZGl1cyA9IE1hdGgubWluKE1hdGgubWF4KHJhZGl1cyArIGV2ZW50LmRlbHRhWSAqIDAuMDUsIDUpLCBsaW1pdCk7XG5cdFx0XHRpZiAoZGF0YVsyXSAhPT0gMCkgZGF0YVsyXSA9IHNpZ24gKiByYWRpdXM7XG5cdFx0fSxcblx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHQpO1xuXG5cdGNvbnN0IGJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4geyBidWZmZXI6IGJ1ZmZlciwgZGF0YTogZGF0YSB9O1xufVxuXG4vKiogUmVwbGFjZSBgI2ltcG9ydGAgZGlyZWN0aXZlcyBieSBwcmVwZW5kaW5nIHRoZSBpbmNsdWRlZCBzb3VyY2UgZmlsZXMuICovXG5mdW5jdGlvbiBwcmVwZW5kSW5jbHVkZXMoY29kZTogc3RyaW5nLCBpbmNsdWRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuXHRjb2RlID0gY29kZS5yZXBsYWNlKC9eI2ltcG9ydC4qL2dtLCBcIlwiKTtcblx0cmV0dXJuIGluY2x1ZGVzLnJlZHVjZSgoYWNjLCBpbmNsdWRlKSA9PiBpbmNsdWRlICsgXCJcXG5cIiArIGFjYywgY29kZSk7XG59XG5cbmV4cG9ydCB7XG5cdFNpemUsXG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdGNyZWF0ZUZpZWxkVGV4dHVyZSxcblx0d3JpdGVGaWVsZFRleHR1cmUsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9