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
const WORKGROUP_SIZE = 8;
async function main() {
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    const grid = {
        width: Math.ceil(canvas.size.width / SIM_SCALE),
        height: Math.ceil(canvas.size.height / SIM_SCALE),
    };
    // ------------------------- simulation parameters -------------------------
    // scenes:
    //   rotors  (default) - four rotors in contact, JCP paper section 4.2
    //   rotor             - one seven-pointed rotor, thesis section 3.3
    //   flapper           - swimming actuated capsule
    const scene = new URLSearchParams(window.location.search).get("scene") ?? "rotor";
    const shape = { flapper: 0, rotor: 1, rotors: 2 }[scene] ?? 1;
    // anchored rotors need a slow drive (tip speed well below the shear wave
    // speed) but many substeps keep the wall-clock speed real-time
    const SUBSTEPS = isMobile ? (shape === 0 ? 2 : 8) : shape === 0 ? 8 : 32;
    const scale = Math.min(grid.width, grid.height);
    // four-rotor scene (paper Fig. 9): each rotor lives in an L x L box with
    // prong length 0.2L and pivot radius 0.025L; the lattice pitch is L/2 of
    // the shorter screen dimension, so facing prongs exactly touch
    const L = Math.min(grid.width, grid.height);
    const muscleRadius = 0.022 * scale;
    // Anchored-rotor parameters were tuned with the CUDA reference
    // (cuda/lbrmt.cu): stable over 4+ full cycles at 448^2 with
    // tau=0.8, G=0.05, kappa=0.15, T=54000, friction=heal=3e-4.
    const settings = {
        // LB relaxation time; nu = (tau - 0.5) / 3. The TRT collision
        // operator keeps tau = 0.55 stable (Re high enough for vortex
        // shedding); the soft four-rotor lattice prefers a calmer fluid.
        tau: shape === 2 ? 0.7 : 0.55,
        shearModulus: shape === 0 ? 0.06 : 0.05,
        bulkModulus: shape === 0 ? 0.18 : 0.15, // kappa ~ 3G
        epsilon: 2.0, // blur-zone half-width (cells)
        center: shape === 2
            ? [grid.width / 4, grid.height / 4]
            : [grid.width / 2, grid.height / 2],
        // flapper: capsule half-length; rotor: star tip radius;
        // rotors: smooth-rotor prong length (slightly under 0.2L so adjacent
        // prongs get close but do not weld - min-SDF has no object identity)
        halfLength: shape === 2 ? 0.174 * L : shape === 1 ? 0.16 * scale : 0.1 * scale,
        // flapper: capsule radius; rotor: star dilation (fattens the wedge arms,
        // whose bending stiffness goes as thickness^3); rotors: end-cap radius
        radius: shape === 2 ? 0.04 * L : shape === 1 ? 0.04 * scale : 0.035 * scale,
        muscleHalfLength: 0.085 * scale, // muscle spans most of the body
        // flapper: muscle radius; rotors: prong fillet radius
        muscleRadius: shape === 2 ? 0.04 * L : muscleRadius,
        // max |con * Y| ~ 1.2 at the muscle edge (tuned in CUDA: strong
        // enough for ~1 body length per 20 strokes)
        actuationAmp: 1.2 / muscleRadius,
        actuationFreq: (2 * Math.PI) / 300, // one stroke every 300 steps
        // traveling-wave number: wavelength ~ 0.9 body lengths
        waveNumber: 35.8 / scale,
        shape: shape,
        pivotRadius: 0.1 * (shape === 2 ? L : scale),
        spinAngle: Math.PI, // theta(t) = spinAngle * (1 - cos(spinFreq t))
        // one revolution out and one back per cycle; the tip speed
        // (tip radius * spinAngle * spinFreq) must stay well below the shear
        // wave speed sqrt(G), or the arms wind up and shear off
        spinFreq: (2 * Math.PI) / 54000,
        friction: shape === 0 ? 0 : 3e-4,
        heal: shape === 0 ? 0 : 3e-4,
    };
    const paramsData = new ArrayBuffer(96);
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
    paramsU32.set([settings.shape], 16);
    paramsF32.set([
        settings.pivotRadius,
        settings.spinAngle,
        settings.spinFreq,
        settings.friction,
        settings.heal,
        settings.waveNumber,
    ], 17);
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
    // staging buffer to read back the reference map under a grab click:
    // the grabbed material point is identified by its reference coordinates
    const grabStaging = device.createBuffer({
        label: "Grab Staging Buffer",
        size: 256,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    let grabInFlight = false;
    function requestGrab(at) {
        grabInFlight = true;
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer({
            texture: xi[current],
            origin: {
                x: Math.min(Math.max(Math.floor(at[0]), 0), grid.width - 1),
                y: Math.min(Math.max(Math.floor(at[1]), 0), grid.height - 1),
            },
        }, { buffer: grabStaging, bytesPerRow: 256 }, { width: 1, height: 1 });
        device.queue.submit([encoder.finish()]);
        grabStaging.mapAsync(GPUMapMode.READ).then(() => {
            const xiGrab = new Float32Array(grabStaging.getMappedRange(0, 8));
            interactions.data[6] = xiGrab[0];
            interactions.data[7] = xiGrab[1];
            // activate only if the button is still held
            interactions.data[3] = interactions.data[2] > 0 ? 1 : 0;
            grabStaging.unmap();
            grabInFlight = false;
        });
    }
    function frame() {
        interactions.update();
        const grabAt = interactions.consumeGrabRequest();
        if (grabAt && !grabInFlight)
            requestGrab(grabAt);
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
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.COPY_SRC,
    });
}
function writeFieldTexture(device, texture, size, layers, bytesPerTexel, data) {
    device.queue.writeTexture({ texture: texture }, data, { bytesPerRow: size.width * bytesPerTexel, rowsPerImage: size.height }, { width: size.width, height: size.height, depthOrArrayLayers: layers });
}
/**
 * Cursor interactions. Returns a uniform buffer laid out as
 * [x, y, signedRadius, pad, vx, vy, pad, pad] in simulation-grid coordinates.
 * signedRadius is positive while pushing (left click / one finger), negative
 * while pulling (right click / two fingers) and zero when inactive. (vx, vy)
 * is the smoothed cursor velocity, used to drag the fluid and solid around.
 * Scroll adjusts the radius. Call update() once per frame.
 */
function setupInteractions(device, canvas, grid, radius = 50) {
    const data = new Float32Array(8);
    let sign = 1;
    let previous = null;
    let grabRequest = null;
    // raw cursor position; while grabbing, data[0..1] is a rate-limited
    // towpoint chasing it, so the solid is never yanked faster than it can
    // physically follow (it would tear apart)
    let raw = [0, 0];
    const setPosition = (x, y) => {
        raw = [(x / canvas.width) * grid.width, (y / canvas.height) * grid.height];
        if (data[3] === 0) {
            data[0] = raw[0];
            data[1] = raw[1];
        }
    };
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("mousemove", (event) => setPosition(event.offsetX, event.offsetY), { passive: true });
    canvas.addEventListener("touchmove", (event) => setPosition(event.touches[0].clientX, event.touches[0].clientY), { passive: true });
    canvas.addEventListener("mousedown", (event) => {
        sign = event.button === 2 ? -1 : 1;
        setPosition(event.offsetX, event.offsetY);
        data[2] = sign * radius;
        if (sign > 0)
            grabRequest = [data[0], data[1]];
    });
    canvas.addEventListener("touchstart", (event) => {
        sign = event.touches.length > 1 ? -1 : 1;
        setPosition(event.touches[0].clientX, event.touches[0].clientY);
        data[2] = sign * radius;
        if (sign > 0)
            grabRequest = [data[0], data[1]];
    }, { passive: true });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((type) => {
        canvas.addEventListener(type, () => {
            data[2] = 0;
            data[3] = 0; // release the grab
            grabRequest = null;
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
    // per-frame: advance the towpoint and the smoothed cursor velocity
    const update = () => {
        if (data[3] > 0) {
            const maxStep = 2; // cells per frame
            const dx = raw[0] - data[0];
            const dy = raw[1] - data[1];
            const dist = Math.hypot(dx, dy);
            const scale = dist > maxStep ? maxStep / dist : 1;
            data[0] += dx * scale;
            data[1] += dy * scale;
        }
        else {
            data[0] = raw[0];
            data[1] = raw[1];
        }
        if (previous && data[2] !== 0) {
            data[4] = 0.6 * data[4] + 0.4 * (data[0] - previous[0]);
            data[5] = 0.6 * data[5] + 0.4 * (data[1] - previous[1]);
        }
        else {
            data[4] = 0;
            data[5] = 0;
        }
        previous = [data[0], data[1]];
    };
    const consumeGrabRequest = () => {
        const request = grabRequest;
        grabRequest = null;
        return request;
    };
    return {
        buffer: buffer,
        data: data,
        update: update,
        consumeGrabRequest: consumeGrabRequest,
    };
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

module.exports = "// Shared constants, structs and helpers for the lattice-Boltzmann\n// reference map technique (LBRMT) solver.\n//\n// References:\n//   Sun (2020), \"A lattice Boltzmann implementation of the reference map technique\"\n//   Sun & Rycroft (2025), JCP 526 113774, https://github.com/yue-sun/lbrmt\n//\n// Shaders that include this file must declare:\n//   var<uniform> params: Params;\n//   var xi_tex: texture_2d<f32>;        // current reference map (X, Y)\n//   (WGSL module-scope declarations are order-independent.)\n\nconst PI = 3.141592653589793;\nconst EPS = 1e-6;\n\n// D2Q9 lattice vectors and weights\nconst C = array<vec2<i32>, 9>(\n    vec2<i32>(0, 0),\n    vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1),\n    vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1),\n);\nconst W = array<f32, 9>(\n    4.0 / 9.0,\n    1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0,\n    1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0,\n);\n// opposite directions, for the TRT collision operator\nconst OPP = array<i32, 9>(0, 3, 4, 1, 2, 7, 8, 5, 6);\n\nstruct Params {\n    size: vec2<u32>,           // simulation grid size\n    step: u32,                 // global step counter\n    substeps: u32,             // steps per rendered frame\n    tau: f32,                  // LB relaxation time (viscosity)\n    shear_modulus: f32,        // G of the neo-Hookean solid\n    bulk_modulus: f32,         // kappa, resists volume change\n    epsilon: f32,              // blur-zone half-width (cells)\n    center: vec2<f32>,         // shape centre in reference space\n    half_length: f32,          // capsule half-length\n    radius: f32,               // capsule radius\n    muscle_half_length: f32,   // actuated region half-length\n    muscle_radius: f32,        // actuated region radius\n    actuation_amp: f32,        // log(max stretch) / muscle_radius\n    actuation_freq: f32,       // radians per step\n    shape: u32,                // 0 = flapper, 1 = one rotor, 2 = 2x2 rotor lattice\n    pivot_radius: f32,         // rotor: radius of the anchored pivot region\n    spin_angle: f32,           // rotor: half of the maximum spin angle\n    spin_freq: f32,            // rotor: angular velocity of the spin drive\n    friction: f32,             // Rayleigh friction (momentum sink; the\n                               // periodic box has no walls to absorb the\n                               // momentum anchored rotors pump into it)\n    heal: f32,                 // anchored scenes: relax xi toward the ideal\n                               // rigidly-rotated map (analytic substitute\n                               // for the paper's extrapolation zone)\n    wave_number: f32,          // flapper: traveling-wave number of the muscle\n    pad1: f32,\n};\n\nstruct Interaction {\n    position: vec2<f32>,       // cursor position (grid cells)\n    size: f32,                 // signed radius; 0 = inactive\n    grab_active: f32,          // 1 while a grab anchor is held\n    velocity: vec2<f32>,       // smoothed cursor velocity (cells / frame)\n    grab_ref: vec2<f32>,       // reference-map coords of the grabbed material\n};\n\n// Periodic wrap of integer grid coordinates.\nfn wrap_i(x: vec2<i32>) -> vec2<i32> {\n    let s = vec2<i32>(params.size);\n    return (x % s + s) % s;\n}\n\nfn xi_at(x: vec2<i32>) -> vec2<f32> {\n    return textureLoad(xi_tex, wrap_i(x), 0).xy;\n}\n\n// Reference map of a neighbour, unwrapped to be continuous with `ref`\n// (on a torus the reference map is multivalued modulo the domain size).\nfn xi_near(x: vec2<i32>, anchor: vec2<f32>) -> vec2<f32> {\n    let s = vec2<f32>(params.size);\n    let v = xi_at(x);\n    return v - s * round((v - anchor) / s);\n}\n\n// Position in the solid's reference frame (relative to the shape centre).\nfn reference_coord(xi: vec2<f32>) -> vec2<f32> {\n    let s = vec2<f32>(params.size);\n    let d = xi - params.center;\n    return d - s * round(d / s);\n}\n\n// Signed distance of a capsule (segment of half-length hl, radius r).\nfn capsule(p: vec2<f32>, hl: f32, r: f32) -> f32 {\n    let qx = abs(p.x) - hl;\n    return select(length(vec2<f32>(qx, p.y)), abs(p.y), qx < 0.0) - r;\n}\n\n// Signed distance of a seven-pointed star with tips at distance cr\n// (obj_seven_point::phi in the lbrmt reference code).\nfn seven_star(p: vec2<f32>, cr: f32) -> f32 {\n    let fac = 2.0 * PI / 7.0;\n    var theta = abs(atan2(p.y, p.x));\n    let R = length(p);\n    theta = abs(theta - fac * round(theta / fac));\n    let X = R * cos(theta) - cr;\n    let Y = R * sin(theta);\n    let c = cos(0.25 * fac);\n    let s = sin(0.25 * fac);\n    return select(Y * c + X * s, length(vec2<f32>(X, Y)), X * c - Y * s > 0.0);\n}\n\n// 2x2 rotor lattice (JCP paper section 4.2): rotors sit at half-period\n// spacing starting from params.center. Returns the offset to the nearest\n// rotor centre (xy) and the spin direction of that rotor's row (z):\n// the top row turns counter-clockwise, the bottom row clockwise.\nfn rotor_lattice(p: vec2<f32>) -> vec3<f32> {\n    let pitch = 0.5 * vec2<f32>(params.size);\n    let k = round(p / pitch);\n    let rel = p - k * pitch;\n    let row = ((i32(k.y) % 2) + 2) % 2;\n    return vec3<f32>(rel, select(1.0, -1.0, row == 1));\n}\n\n// Three-pronged smooth rotor (obj_smooth_rotor::phi in the lbrmt code):\n// prongs of length l with end caps of radius r, filleted with radius s.\n// Used for the four-rotor contact scene (JCP paper Fig. 9) - the fat prongs\n// survive full revolutions where the thin star arms would wind up and shear.\nfn smooth_rotor(p: vec2<f32>, l: f32, r: f32, s: f32) -> f32 {\n    var X = p.x;\n    var Y = abs(p.y);\n    // fold the three-fold symmetry into one prong sector\n    if (X * -0.8660254 + Y * 0.5 > 0.0) {\n        let yy = abs(X * -0.8660254 + Y * -0.5);\n        X = X * -0.5 + Y * 0.8660254;\n        Y = yy;\n    }\n    let q = (r + s) * 0.57735027; // (r+s)/sqrt(3)\n    if (X > l) { return length(vec2<f32>(X - l, Y)) - r; }\n    if (X > q) { return Y - r; }\n    return s - length(vec2<f32>(X - q, Y - r - s));\n}\n\nfn sdf_shape(p: vec2<f32>) -> f32 {\n    if (params.shape == 1u) {\n        // dilate by radius: rounds the tips and thickens the wedge arms,\n        // which would otherwise erode inside the blur zone\n        return seven_star(p, params.half_length) - params.radius;\n    }\n    if (params.shape == 2u) {\n        // muscle_radius doubles as the fillet radius here\n        return smooth_rotor(rotor_lattice(p).xy, params.half_length, params.radius, params.muscle_radius);\n    }\n    return capsule(p, params.half_length, params.radius);\n}\n\n// Level set of the solid, evaluated through the reference map:\n// phi < 0 inside the solid, phi > 0 in the fluid.\nfn level_set(xi: vec2<f32>) -> f32 {\n    return sdf_shape(reference_coord(xi));\n}\n\n// Level set gated by world position: an *anchored* rotor cannot leave the\n// neighbourhood of its pivot, so any apparent solid beyond the gate radius\n// is a phantom (wound-up far-field reference map) and is treated as fluid.\n// The far-field xi is then purely cosmetic for anchored scenes.\nfn level_set_at(xi: vec2<f32>, p: vec2<f32>) -> f32 {\n    let phi = level_set(xi);\n    if (params.shape == 0u) { return phi; }\n    let s = vec2<f32>(params.size);\n    var d = p - params.center;\n    d -= s * round(d / s);\n    if (params.shape == 2u) { d = rotor_lattice(d).xy; }\n    let gate = params.half_length + params.radius + 4.0 * params.epsilon;\n    return max(phi, length(d) - gate);\n}\n\n// Smoothed Heaviside: 1 in the solid, 0 in the fluid,\n// blur zone of half-width epsilon (2020 JFM transition function).\nfn solid_fraction(phi: f32) -> f32 {\n    let e = params.epsilon;\n    if (phi >= e) { return 0.0; }\n    if (phi <= -e) { return 1.0; }\n    let t = phi / e;\n    return 0.5 - 0.5 * t - sin(PI * t) / (2.0 * PI);\n}\n\nfn clamp_mag(v: vec2<f32>, m: f32) -> vec2<f32> {\n    let l = length(v);\n    return select(v, v * (m / l), l > m);\n}\n\n// Maxwell-Boltzmann equilibrium populations (second-order expansion).\nfn equilibrium(rho: f32, v: vec2<f32>) -> array<f32, 9> {\n    var feq: array<f32, 9>;\n    let usq = dot(v, v);\n    for (var i = 0; i < 9; i++) {\n        let cu = dot(vec2<f32>(C[i]), v);\n        feq[i] = W[i] * rho * (1.0 + 3.0 * cu + 4.5 * cu * cu - 1.5 * usq);\n    }\n    return feq;\n}\n\n// Second-order ENO derivative (Shu 1998), component-wise on vec2.\n// For positive advection velocity call with (downwind, centre, upwind, upwind2);\n// negate and mirror the arguments for negative velocity.\nfn eno2(v0: vec2<f32>, v1: vec2<f32>, v2: vec2<f32>, v3: vec2<f32>) -> vec2<f32> {\n    let a = abs(v0 - 2.0 * v1 + v2);\n    let b = abs(v1 - 2.0 * v2 + v3);\n    let central = 0.5 * (v0 - v2);\n    let onesided = 1.5 * v1 - 2.0 * v2 + 0.5 * v3;\n    return select(onesided, central, a < b);\n}\n";

/***/ }),

/***/ "./src/shaders/lbrmt.comp.wgsl":
/*!*************************************!*\
  !*** ./src/shaders/lbrmt.comp.wgsl ***!
  \*************************************/
/***/ ((module) => {

module.exports = "#import includes::common\n\n// LBRMT compute passes.\n//\n// Each timestep runs two dispatches over ping-pong textures:\n//   1. `advect`  - update the reference map xi with the local fluid velocity\n//   2. `collide` - solid stress from xi, then a forced lattice-Boltzmann\n//                  update (pull streaming + BGK collision with Guo forcing)\n//\n// The reference map is advected *everywhere*: it is the backward flow map, so\n// the solid region is exactly { x : phi(xi(x)) < 0 }. This replaces the\n// layer-by-layer least-squares extrapolation of the original method with an\n// embarrassingly parallel scheme.\n\n@group(0) @binding(0) var<uniform> params: Params;\n@group(0) @binding(1) var<uniform> interaction: Interaction;\n@group(0) @binding(2) var xi_tex: texture_2d<f32>;\n@group(0) @binding(3) var f_tex: texture_2d_array<f32>;\n@group(0) @binding(4) var xi_out: texture_storage_2d<rg32float, write>;\n@group(0) @binding(5) var f_out: texture_storage_2d_array<r32float, write>;\n\n// Populations streamed to node x (pull scheme):\n// f_i(x, t+1) = f^post-collision_i(x - c_i, t).\nfn pull(x: vec2<i32>) -> array<f32, 9> {\n    var f: array<f32, 9>;\n    for (var i = 0; i < 9; i++) {\n        f[i] = textureLoad(f_tex, wrap_i(x - C[i]), i, 0).r;\n    }\n    return f;\n}\n\n// Zeroth and first moments: (rho, momentum).\nfn moments(f: array<f32, 9>) -> vec3<f32> {\n    var rho = 0.0;\n    var mom = vec2<f32>(0.0);\n    for (var i = 0; i < 9; i++) {\n        rho += f[i];\n        mom += f[i] * vec2<f32>(C[i]);\n    }\n    return vec3<f32>(rho, mom);\n}\n\n// ---------------------------------------------------------------------------\n// Pass 1: advect the reference map, d xi/dt + (v . grad) xi = 0.\n//\n// IMPORTANT: the advection velocity must include the Guo half-force\n// correction, v = (sum f_i c_i + F/2) / rho. Advecting with the uncorrected\n// velocity couples the force back into the reference map with the wrong sign\n// and drives an explosive checkerboard instability (verified in the CPU\n// reference tests).\n// ---------------------------------------------------------------------------\n@compute @workgroup_size(8, 8)\nfn advect(@builtin(global_invocation_id) gid: vec3<u32>) {\n    if (any(gid.xy >= params.size)) { return; }\n    let x = vec2<i32>(gid.xy);\n\n    var force = total_force(x);\n    let m = moments(pull(x));\n    let rho = max(m.x, EPS);\n    // cap the *acceleration*: near-vacuum cells must not be blown apart\n    force = clamp_mag(force, 0.2 * min(rho, 1.0));\n    var v = (m.yz + 0.5 * force) / rho;\n    v = clamp_mag(v, 0.25);\n\n    let c = xi_at(x);\n    let r1 = xi_near(x + vec2(1, 0), c);\n    let r2 = xi_near(x + vec2(2, 0), c);\n    let l1 = xi_near(x - vec2(1, 0), c);\n    let l2 = xi_near(x - vec2(2, 0), c);\n    let u1 = xi_near(x + vec2(0, 1), c);\n    let u2 = xi_near(x + vec2(0, 2), c);\n    let d1 = xi_near(x - vec2(0, 1), c);\n    let d2 = xi_near(x - vec2(0, 2), c);\n\n    var ddx: vec2<f32>;\n    if (v.x > 0.0) { ddx = eno2(r1, c, l1, l2); } else { ddx = -eno2(l1, c, r1, r2); }\n    var ddy: vec2<f32>;\n    if (v.y > 0.0) { ddy = eno2(u1, c, d1, d2); } else { ddy = -eno2(d1, c, u1, u2); }\n\n    var xi_new = c - (v.x * ddx + v.y * ddy);\n\n    // Outside the solid the reference map is never used for stresses; diffuse\n    // it there to keep the field smooth and bounded. Starting right at the\n    // blur-zone edge erodes the thin smeared-xi filaments that would\n    // otherwise condense into phantom solid fragments in the wake, while the\n    // solid interior (phi < 0) is untouched.\n    let phi_here = level_set_at(c, vec2<f32>(x));\n    // starting inside the outer half of the blur zone (0.5 eps) erodes the\n    // interface dither that otherwise inflates swimming bodies\n    let w = 0.3 * smoothstep(0.5 * params.epsilon, 3.0 * params.epsilon, phi_here);\n    xi_new = mix(xi_new, 0.25 * (r1 + l1 + u1 + d1), w);\n\n    // Anchored scenes: the drive angle is known exactly, so the ideal\n    // (rigidly rotated) reference map is available analytically. Relax xi\n    // toward it - strongly in the fluid (substituting for the paper's\n    // extrapolation zone, curing phantom solids and interface smear) and\n    // weakly inside the solid (healing the slow inflation of the body while\n    // leaving elastic bending free).\n    if (params.shape != 0u && params.heal > 0.0) {\n        let s = vec2<f32>(params.size);\n        var d = vec2<f32>(x) - params.center;\n        d -= s * round(d / s);\n        var spin = 1.0;\n        if (params.shape == 2u) {\n            let rl = rotor_lattice(d);\n            d = rl.xy;\n            spin = rl.z;\n        }\n        let theta = spin * params.spin_angle * (1.0 - cos(params.spin_freq * f32(params.step)));\n        let ct = cos(theta);\n        let st = sin(theta);\n        // rotation about this cell's own rotor centre: (x - d) + R(-theta) d\n        var ideal = vec2<f32>(x) - d + vec2<f32>(d.x * ct + d.y * st, -d.x * st + d.y * ct);\n        ideal -= s * round((ideal - c) / s);\n        let lam = solid_fraction(phi_here);\n        let hw = params.heal * (0.25 + 0.75 * (1.0 - lam));\n        xi_new = mix(xi_new, ideal, hw);\n    }\n\n    textureStore(xi_out, x, vec4<f32>(xi_new, 0.0, 0.0));\n}\n\n// ---------------------------------------------------------------------------\n// Pass 2: solid stress + forced lattice-Boltzmann update.\n// ---------------------------------------------------------------------------\n\n// Flapper muscle activation: a wave traveling along the body (+X) pushes\n// fluid backward and drives the swimmer forward. The returned value\n// multiplies Y in the active stretch exp(con * Y), bending the body locally.\nfn contraction(X: f32) -> f32 {\n    let s = sin(params.actuation_freq * f32(params.step) - params.wave_number * X);\n    return -params.actuation_amp * s;\n}\n\n// Neo-Hookean stress at a cell edge, from the Jacobian of the reference map,\n// smoothed by the solid fraction. Includes the active muscle deformation.\nfn edge_stress(jac: mat2x2<f32>, xi_edge: vec2<f32>, phi_edge: f32) -> mat2x2<f32> {\n    let zero = mat2x2<f32>(vec2<f32>(0.0), vec2<f32>(0.0));\n    let sf = solid_fraction(phi_edge);\n    if (sf <= 0.0) { return zero; }\n\n    let det = determinant(jac);\n    if (abs(det) < 1e-3) { return zero; }\n\n    // Deformation gradient F = (d xi / d x)^-1\n    var F = mat2x2<f32>(\n        vec2<f32>(jac[1][1], -jac[0][1]),\n        vec2<f32>(-jac[1][0], jac[0][0]),\n    ) * (1.0 / det);\n\n    // Active deformation (capsule flapper only): area-preserving stretch\n    // along the body axis, graded across the thickness (X.y) so the body\n    // bends. The rotor is driven by an anchor force instead.\n    if (params.shape == 0u) {\n        let X = reference_coord(xi_edge);\n        let muscle = solid_fraction(capsule(X, params.muscle_half_length, params.muscle_radius));\n        let fac = clamp(exp(contraction(X.x) * X.y * muscle), 0.5, 2.0);\n        F[0] *= fac;\n        F[1] *= 1.0 / fac;\n    }\n\n    // Compressible neo-Hookean constitutive law (plane strain). The\n    // volumetric term (J - 1/J)/2 linearizes like (J - 1) at J = 1 but is\n    // much stiffer in compression, resisting the slow \"puffing\" of\n    // vigorously actuated bodies.\n    let J = clamp(1.0 / det, 0.1, 10.0);\n    let B = F * transpose(F);\n    let I = mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0));\n    let dev = B - ((B[0][0] + B[1][1] + 1.0) / 3.0) * I;\n    let vol = params.bulk_modulus * 0.5 * (J - 1.0 / J);\n    return sf * (params.shear_modulus * dev + vol * I);\n}\n\n// Divergence of the solid stress at node x, plus the user interaction force.\nfn total_force(x: vec2<i32>) -> vec2<f32> {\n    // 3x3 neighbourhood of the reference map, unwrapped around the centre\n    var xi: array<vec2<f32>, 9>; // index (dx+1) + 3*(dy+1)\n    var phi: array<f32, 9>;\n    let ctr = xi_at(x);\n    for (var dy = -1; dy <= 1; dy++) {\n        for (var dx = -1; dx <= 1; dx++) {\n            let n = xi_near(x + vec2(dx, dy), ctr);\n            xi[(dx + 1) + 3 * (dy + 1)] = n;\n            phi[(dx + 1) + 3 * (dy + 1)] = level_set_at(n, vec2<f32>(x + vec2(dx, dy)));\n        }\n    }\n    let dl = 0; let dd = 1; let dr = 2;\n    let ll = 3; let cc = 4; let rr = 5;\n    let ul = 6; let uu = 7; let ur = 8;\n\n    // Half-edge stresses (second-order finite differences of xi, as in lbrmt)\n    let sL = edge_stress(\n        mat2x2<f32>(xi[cc] - xi[ll], 0.25 * (xi[uu] + xi[ul] - xi[dd] - xi[dl])),\n        0.5 * (xi[cc] + xi[ll]), 0.5 * (phi[cc] + phi[ll]));\n    let sR = edge_stress(\n        mat2x2<f32>(xi[rr] - xi[cc], 0.25 * (xi[ur] + xi[uu] - xi[dr] - xi[dd])),\n        0.5 * (xi[rr] + xi[cc]), 0.5 * (phi[rr] + phi[cc]));\n    let sB = edge_stress(\n        mat2x2<f32>(0.25 * (xi[rr] + xi[dr] - xi[ll] - xi[dl]), xi[cc] - xi[dd]),\n        0.5 * (xi[cc] + xi[dd]), 0.5 * (phi[cc] + phi[dd]));\n    let sT = edge_stress(\n        mat2x2<f32>(0.25 * (xi[ur] + xi[rr] - xi[ul] - xi[ll]), xi[uu] - xi[cc]),\n        0.5 * (xi[uu] + xi[cc]), 0.5 * (phi[uu] + phi[cc]));\n\n    var force = (sR[0] - sL[0]) + (sT[1] - sB[1]);\n    force += anchor_force(vec2<f32>(x), xi[cc], phi[cc]);\n    force += interaction_force(vec2<f32>(x), xi[cc]);\n    return force; // clamped against the local density by the caller\n}\n\n// Rotor drive (thesis section 3.3 / JCP paper section 4.2, lbrmt\n// obj_seven_point::accel): material in a small pivot region around each\n// rotor centre is pulled toward its *rotated* reference position by a\n// spring, with the target angle swinging\n// theta(t) = spin_angle * (1 - cos(spin_freq * t)). With spin_angle = pi the\n// rotor makes a full 2pi revolution in the first half period, then reverses\n// for a full revolution back, twisting its arms through the fluid. In the\n// 2x2 lattice the top row turns counter-clockwise and the bottom clockwise.\nfn anchor_force(p: vec2<f32>, xi_c: vec2<f32>, phi_c: f32) -> vec2<f32> {\n    if (params.shape == 0u) { return vec2<f32>(0.0); }\n    let s = vec2<f32>(params.size);\n\n    var d = p - params.center;\n    d -= s * round(d / s);\n    var xrel = d;\n    var spin = 1.0;\n    if (params.shape == 2u) {\n        let here = rotor_lattice(d);\n        xrel = here.xy;\n        spin = here.z;\n    }\n\n    // smooth anchor footprint: full strength inside the pivot, fading over\n    // 2 epsilon (a hard cutoff ring concentrates stress and tears material)\n    let r = length(xrel);\n    let w = 1.0 - smoothstep(params.pivot_radius, params.pivot_radius + 2.0 * params.epsilon, r);\n    if (w <= 0.0) { return vec2<f32>(0.0); }\n\n    var Xrel = reference_coord(xi_c);\n    if (params.shape == 2u) { Xrel = rotor_lattice(Xrel).xy; }\n\n    let theta = spin * params.spin_angle * (1.0 - cos(params.spin_freq * f32(params.step)));\n    let ct = cos(theta);\n    let st = sin(theta);\n    let rotated = vec2<f32>(Xrel.x * ct - Xrel.y * st, Xrel.x * st + Xrel.y * ct);\n    // displacement-capped spring: the drive acts like a motor with slip, so\n    // a lagging rotor feels a bounded, gentle torque instead of a runaway\n    // pull that cavitates the fluid\n    let disp = clamp_mag(xrel - rotated, 4.0);\n    return -0.02 * solid_fraction(phi_c) * w * disp;\n}\n\n// Cursor forces.\n//  - Left click-drag-release on the solid grabs it: material whose reference\n//    map lies near the grabbed material point (grab_ref) is pulled toward the\n//    cursor by a spring. The anchor lives in reference space, so the grip\n//    sticks to the material even as it deforms and translates.\n//  - Otherwise: drag injects momentum along the cursor motion, and a press\n//    pushes (left) or pulls (right) radially.\nfn interaction_force(p: vec2<f32>, xi_c: vec2<f32>) -> vec2<f32> {\n    let a = abs(interaction.size);\n    if (a < 1.0) { return vec2<f32>(0.0); }\n    let s = vec2<f32>(params.size);\n    var d = p - interaction.position;\n    d -= s * round(d / s);\n    let r = length(d);\n\n    let grabbing = interaction.grab_active > 0.5\n        && interaction.size > 0.0\n        && level_set(interaction.grab_ref) < params.epsilon;\n\n    if (grabbing) {\n        // tow the whole body: the grip is body-scale in *reference* space, so\n        // the force is nearly uniform over the solid and it moves as a whole\n        // (a localized grip would drag one patch through the body and tear\n        // it). Deformation while towing comes from the fluid drag.\n        var dref = xi_c - interaction.grab_ref;\n        dref -= s * round(dref / s);\n        let width = params.half_length * params.half_length;\n        let grip = exp(-dot(dref, dref) / (2.0 * width));\n        return 0.01 * grip * clamp_mag(-d, 2.0);\n    }\n\n    if (r >= a) { return vec2<f32>(0.0); }\n    let blob = exp(-r * r / a);\n    // drag along the cursor velocity\n    var force = 0.01 * blob * clamp_mag(interaction.velocity, 5.0);\n    // radial push/pull\n    if (r > 1e-3) {\n        force += (0.02 * sign(interaction.size) * blob / r) * d;\n    }\n    return force;\n}\n\n@compute @workgroup_size(8, 8)\nfn collide(@builtin(global_invocation_id) gid: vec3<u32>) {\n    if (any(gid.xy >= params.size)) { return; }\n    let x = vec2<i32>(gid.xy);\n\n    // Divergence of the solid stress (from the freshly advected xi) + user interaction\n    var force = total_force(x);\n\n    // Forced BGK collision (Guo forcing, second order in velocity space)\n    let f = pull(x);\n    let m = moments(f);\n    let rho = max(m.x, EPS);\n    force = clamp_mag(force, 0.2 * min(rho, 1.0));\n    var v = (m.yz + 0.5 * force) / rho;\n    v = clamp_mag(v, 0.25);\n    // weak Rayleigh friction: the periodic box has no walls to absorb the\n    // momentum that anchored rotors continuously pump into the fluid\n    v *= 1.0 - params.friction;\n\n    let feq = equilibrium(rho, v);\n    // TRT collision (two relaxation times): even modes relax with 1/tau\n    // (setting the viscosity), odd modes with the \"magic\" combination\n    // Lambda = (tau+ - 1/2)(tau- - 1/2) = 1/4. Markedly more stable than BGK\n    // at low viscosity and damps the staircase noise that BGK produces\n    // around fast-moving interfaces (needed for clean vortex shedding).\n    let wp = 1.0 / params.tau;\n    let wm = 1.0 / (0.5 + 0.25 / (params.tau - 0.5));\n    let fw = 1.0 - 0.5 * wp;\n\n    for (var i = 0; i < 9; i++) {\n        let j = OPP[i];\n        let fp = 0.5 * (f[i] + f[j]);\n        let fm = 0.5 * (f[i] - f[j]);\n        let ep = 0.5 * (feq[i] + feq[j]);\n        let em = 0.5 * (feq[i] - feq[j]);\n        let ci = vec2<f32>(C[i]);\n        let Fi = W[i] * (3.0 * dot(ci - v, force) + 9.0 * dot(ci, v) * dot(ci, force));\n        let fi = f[i] - wp * (fp - ep) - wm * (fm - em) + fw * Fi;\n        textureStore(f_out, x, i, vec4<f32>(fi, 0.0, 0.0, 0.0));\n    }\n}\n";

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

module.exports = "#import includes::common\n\n// Visualization: fluid vorticity (warm/cool glow) and the solid, shaded with\n// its deformed reference-space grid.\n\nstruct Input {\n    @location(0) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n    @location(0) color: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> params: Params;\n@group(0) @binding(1) var xi_tex: texture_2d<f32>;\n@group(0) @binding(2) var f_tex: texture_2d_array<f32>;\n\nfn velocity(x: vec2<i32>) -> vec2<f32> {\n    var rho = 0.0;\n    var mom = vec2<f32>(0.0);\n    for (var i = 0; i < 9; i++) {\n        let fi = textureLoad(f_tex, wrap_i(x), i, 0).r;\n        rho += fi;\n        mom += fi * vec2<f32>(C[i]);\n    }\n    return mom / max(rho, EPS);\n}\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n    let x = vec2<i32>(vec2<f32>(params.size) * (0.5 * input.coordinate + 0.5));\n\n    // fluid: vorticity + a hint of speed\n    let vort = 0.5 * ((velocity(x + vec2(1, 0)).y - velocity(x - vec2(1, 0)).y)\n                    - (velocity(x + vec2(0, 1)).x - velocity(x - vec2(0, 1)).x));\n    let speed = length(velocity(x));\n\n    var color = vec3<f32>(0.03, 0.04, 0.06);\n    let xi = xi_at(x);\n    let phi = level_set_at(xi, vec2<f32>(x));\n\n    // vorticity glow, faded near the interface where it only shows\n    // single-cell blur-zone dither\n    let fade = smoothstep(0.0, 3.0 * params.epsilon, phi);\n    let w = clamp(vort * 150.0, -1.0, 1.0) * fade;\n    color += max(w, 0.0) * vec3<f32>(0.9, 0.25, 0.1);\n    color += max(-w, 0.0) * vec3<f32>(0.1, 0.4, 0.9);\n    color += min(speed * 3.0, 0.5) * fade * vec3<f32>(0.25, 0.25, 0.3);\n\n    // solid: a crisp edge (sharpened solid fraction) shaded with its\n    // (deformed) reference-space grid\n    let lambda = smoothstep(0.3, 0.7, solid_fraction(phi));\n    if (lambda > 0.0) {\n        let X = reference_coord(xi);\n        let g = cos(X.x * PI / 4.0) * cos(X.y * PI / 4.0);\n        let grid = smoothstep(-0.3, 0.3, g);\n        let solid_color = mix(vec3<f32>(0.85, 0.35, 0.08), vec3<f32>(1.0, 0.8, 0.25), grid);\n        color = mix(color, solid_color, lambda);\n    }\n\n    output.color = vec4<f32>(color, 1.0);\n    return output;\n}\n";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEMsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQVdDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2ZsdWlkLXN0cnVjdHVyZS1pbnRlcmFjdGl2ZS8uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRyZXF1ZXN0RGV2aWNlLFxuXHRjb25maWd1cmVDYW52YXMsXG5cdHNldHVwVmVydGV4QnVmZmVyLFxuXHRjcmVhdGVGaWVsZFRleHR1cmUsXG5cdHdyaXRlRmllbGRUZXh0dXJlLFxuXHRzZXR1cEludGVyYWN0aW9ucyxcblx0cHJlcGVuZEluY2x1ZGVzLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgY29tbW9uIGZyb20gXCIuL3NoYWRlcnMvaW5jbHVkZXMvY29tbW9uLndnc2xcIjtcbmltcG9ydCBjb21wdXRlU2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvbGJybXQuY29tcC53Z3NsXCI7XG5pbXBvcnQgdmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvcXVhZC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBmcmFnbWVudFNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3JlbmRlci5mcmFnLndnc2xcIjtcblxuY29uc3QgaXNNb2JpbGUgPSAvQW5kcm9pZHxpUGhvbmV8aVBhZHxpUG9kfE9wZXJhIE1pbml8SUVNb2JpbGV8V1BEZXNrdG9wL2kudGVzdChcblx0bmF2aWdhdG9yLnVzZXJBZ2VudFxuKTtcblxuY29uc3QgU0lNX1NDQUxFID0gaXNNb2JpbGUgPyAzIDogMjsgLy8gY2FudmFzIHBpeGVscyBwZXIgc2ltdWxhdGlvbiBjZWxsXG5jb25zdCBXT1JLR1JPVVBfU0laRSA9IDg7XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cdGNvbnN0IGdyaWQgPSB7XG5cdFx0d2lkdGg6IE1hdGguY2VpbChjYW52YXMuc2l6ZS53aWR0aCAvIFNJTV9TQ0FMRSksXG5cdFx0aGVpZ2h0OiBNYXRoLmNlaWwoY2FudmFzLnNpemUuaGVpZ2h0IC8gU0lNX1NDQUxFKSxcblx0fTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHNpbXVsYXRpb24gcGFyYW1ldGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vIHNjZW5lczpcblx0Ly8gICByb3RvcnMgIChkZWZhdWx0KSAtIGZvdXIgcm90b3JzIGluIGNvbnRhY3QsIEpDUCBwYXBlciBzZWN0aW9uIDQuMlxuXHQvLyAgIHJvdG9yICAgICAgICAgICAgIC0gb25lIHNldmVuLXBvaW50ZWQgcm90b3IsIHRoZXNpcyBzZWN0aW9uIDMuM1xuXHQvLyAgIGZsYXBwZXIgICAgICAgICAgIC0gc3dpbW1pbmcgYWN0dWF0ZWQgY2Fwc3VsZVxuXHRjb25zdCBzY2VuZSA9XG5cdFx0bmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS5nZXQoXCJzY2VuZVwiKSA/PyBcInJvdG9yXCI7XG5cdGNvbnN0IHNoYXBlID0geyBmbGFwcGVyOiAwLCByb3RvcjogMSwgcm90b3JzOiAyIH1bc2NlbmVdID8/IDE7XG5cdC8vIGFuY2hvcmVkIHJvdG9ycyBuZWVkIGEgc2xvdyBkcml2ZSAodGlwIHNwZWVkIHdlbGwgYmVsb3cgdGhlIHNoZWFyIHdhdmVcblx0Ly8gc3BlZWQpIGJ1dCBtYW55IHN1YnN0ZXBzIGtlZXAgdGhlIHdhbGwtY2xvY2sgc3BlZWQgcmVhbC10aW1lXG5cdGNvbnN0IFNVQlNURVBTID0gaXNNb2JpbGUgPyAoc2hhcGUgPT09IDAgPyAyIDogOCkgOiBzaGFwZSA9PT0gMCA/IDggOiAzMjtcblx0Y29uc3Qgc2NhbGUgPSBNYXRoLm1pbihncmlkLndpZHRoLCBncmlkLmhlaWdodCk7XG5cdC8vIGZvdXItcm90b3Igc2NlbmUgKHBhcGVyIEZpZy4gOSk6IGVhY2ggcm90b3IgbGl2ZXMgaW4gYW4gTCB4IEwgYm94IHdpdGhcblx0Ly8gcHJvbmcgbGVuZ3RoIDAuMkwgYW5kIHBpdm90IHJhZGl1cyAwLjAyNUw7IHRoZSBsYXR0aWNlIHBpdGNoIGlzIEwvMiBvZlxuXHQvLyB0aGUgc2hvcnRlciBzY3JlZW4gZGltZW5zaW9uLCBzbyBmYWNpbmcgcHJvbmdzIGV4YWN0bHkgdG91Y2hcblx0Y29uc3QgTCA9IE1hdGgubWluKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KTtcblx0Y29uc3QgbXVzY2xlUmFkaXVzID0gMC4wMjIgKiBzY2FsZTtcblx0Ly8gQW5jaG9yZWQtcm90b3IgcGFyYW1ldGVycyB3ZXJlIHR1bmVkIHdpdGggdGhlIENVREEgcmVmZXJlbmNlXG5cdC8vIChjdWRhL2xicm10LmN1KTogc3RhYmxlIG92ZXIgNCsgZnVsbCBjeWNsZXMgYXQgNDQ4XjIgd2l0aFxuXHQvLyB0YXU9MC44LCBHPTAuMDUsIGthcHBhPTAuMTUsIFQ9NTQwMDAsIGZyaWN0aW9uPWhlYWw9M2UtNC5cblx0Y29uc3Qgc2V0dGluZ3MgPSB7XG5cdFx0Ly8gTEIgcmVsYXhhdGlvbiB0aW1lOyBudSA9ICh0YXUgLSAwLjUpIC8gMy4gVGhlIFRSVCBjb2xsaXNpb25cblx0XHQvLyBvcGVyYXRvciBrZWVwcyB0YXUgPSAwLjU1IHN0YWJsZSAoUmUgaGlnaCBlbm91Z2ggZm9yIHZvcnRleFxuXHRcdC8vIHNoZWRkaW5nKTsgdGhlIHNvZnQgZm91ci1yb3RvciBsYXR0aWNlIHByZWZlcnMgYSBjYWxtZXIgZmx1aWQuXG5cdFx0dGF1OiBzaGFwZSA9PT0gMiA/IDAuNyA6IDAuNTUsXG5cdFx0c2hlYXJNb2R1bHVzOiBzaGFwZSA9PT0gMCA/IDAuMDYgOiAwLjA1LFxuXHRcdGJ1bGtNb2R1bHVzOiBzaGFwZSA9PT0gMCA/IDAuMTggOiAwLjE1LCAvLyBrYXBwYSB+IDNHXG5cdFx0ZXBzaWxvbjogMi4wLCAvLyBibHVyLXpvbmUgaGFsZi13aWR0aCAoY2VsbHMpXG5cdFx0Y2VudGVyOlxuXHRcdFx0c2hhcGUgPT09IDJcblx0XHRcdFx0PyBbZ3JpZC53aWR0aCAvIDQsIGdyaWQuaGVpZ2h0IC8gNF1cblx0XHRcdFx0OiBbZ3JpZC53aWR0aCAvIDIsIGdyaWQuaGVpZ2h0IC8gMl0sXG5cdFx0Ly8gZmxhcHBlcjogY2Fwc3VsZSBoYWxmLWxlbmd0aDsgcm90b3I6IHN0YXIgdGlwIHJhZGl1cztcblx0XHQvLyByb3RvcnM6IHNtb290aC1yb3RvciBwcm9uZyBsZW5ndGggKHNsaWdodGx5IHVuZGVyIDAuMkwgc28gYWRqYWNlbnRcblx0XHQvLyBwcm9uZ3MgZ2V0IGNsb3NlIGJ1dCBkbyBub3Qgd2VsZCAtIG1pbi1TREYgaGFzIG5vIG9iamVjdCBpZGVudGl0eSlcblx0XHRoYWxmTGVuZ3RoOiBzaGFwZSA9PT0gMiA/IDAuMTc0ICogTCA6IHNoYXBlID09PSAxID8gMC4xNiAqIHNjYWxlIDogMC4xICogc2NhbGUsXG5cdFx0Ly8gZmxhcHBlcjogY2Fwc3VsZSByYWRpdXM7IHJvdG9yOiBzdGFyIGRpbGF0aW9uIChmYXR0ZW5zIHRoZSB3ZWRnZSBhcm1zLFxuXHRcdC8vIHdob3NlIGJlbmRpbmcgc3RpZmZuZXNzIGdvZXMgYXMgdGhpY2tuZXNzXjMpOyByb3RvcnM6IGVuZC1jYXAgcmFkaXVzXG5cdFx0cmFkaXVzOiBzaGFwZSA9PT0gMiA/IDAuMDQgKiBMIDogc2hhcGUgPT09IDEgPyAwLjA0ICogc2NhbGUgOiAwLjAzNSAqIHNjYWxlLFxuXHRcdG11c2NsZUhhbGZMZW5ndGg6IDAuMDg1ICogc2NhbGUsIC8vIG11c2NsZSBzcGFucyBtb3N0IG9mIHRoZSBib2R5XG5cdFx0Ly8gZmxhcHBlcjogbXVzY2xlIHJhZGl1czsgcm90b3JzOiBwcm9uZyBmaWxsZXQgcmFkaXVzXG5cdFx0bXVzY2xlUmFkaXVzOiBzaGFwZSA9PT0gMiA/IDAuMDQgKiBMIDogbXVzY2xlUmFkaXVzLFxuXHRcdC8vIG1heCB8Y29uICogWXwgfiAxLjIgYXQgdGhlIG11c2NsZSBlZGdlICh0dW5lZCBpbiBDVURBOiBzdHJvbmdcblx0XHQvLyBlbm91Z2ggZm9yIH4xIGJvZHkgbGVuZ3RoIHBlciAyMCBzdHJva2VzKVxuXHRcdGFjdHVhdGlvbkFtcDogMS4yIC8gbXVzY2xlUmFkaXVzLFxuXHRcdGFjdHVhdGlvbkZyZXE6ICgyICogTWF0aC5QSSkgLyAzMDAsIC8vIG9uZSBzdHJva2UgZXZlcnkgMzAwIHN0ZXBzXG5cdFx0Ly8gdHJhdmVsaW5nLXdhdmUgbnVtYmVyOiB3YXZlbGVuZ3RoIH4gMC45IGJvZHkgbGVuZ3Roc1xuXHRcdHdhdmVOdW1iZXI6IDM1LjggLyBzY2FsZSxcblx0XHRzaGFwZTogc2hhcGUsXG5cdFx0cGl2b3RSYWRpdXM6IDAuMSAqIChzaGFwZSA9PT0gMiA/IEwgOiBzY2FsZSksXG5cdFx0c3BpbkFuZ2xlOiBNYXRoLlBJLCAvLyB0aGV0YSh0KSA9IHNwaW5BbmdsZSAqICgxIC0gY29zKHNwaW5GcmVxIHQpKVxuXHRcdC8vIG9uZSByZXZvbHV0aW9uIG91dCBhbmQgb25lIGJhY2sgcGVyIGN5Y2xlOyB0aGUgdGlwIHNwZWVkXG5cdFx0Ly8gKHRpcCByYWRpdXMgKiBzcGluQW5nbGUgKiBzcGluRnJlcSkgbXVzdCBzdGF5IHdlbGwgYmVsb3cgdGhlIHNoZWFyXG5cdFx0Ly8gd2F2ZSBzcGVlZCBzcXJ0KEcpLCBvciB0aGUgYXJtcyB3aW5kIHVwIGFuZCBzaGVhciBvZmZcblx0XHRzcGluRnJlcTogKDIgKiBNYXRoLlBJKSAvIDU0MDAwLFxuXHRcdGZyaWN0aW9uOiBzaGFwZSA9PT0gMCA/IDAgOiAzZS00LFxuXHRcdGhlYWw6IHNoYXBlID09PSAwID8gMCA6IDNlLTQsXG5cdH07XG5cblx0Y29uc3QgcGFyYW1zRGF0YSA9IG5ldyBBcnJheUJ1ZmZlcig5Nik7XG5cdGNvbnN0IHBhcmFtc1UzMiA9IG5ldyBVaW50MzJBcnJheShwYXJhbXNEYXRhKTtcblx0Y29uc3QgcGFyYW1zRjMyID0gbmV3IEZsb2F0MzJBcnJheShwYXJhbXNEYXRhKTtcblx0cGFyYW1zVTMyLnNldChbZ3JpZC53aWR0aCwgZ3JpZC5oZWlnaHQsIDAsIFNVQlNURVBTXSwgMCk7XG5cdHBhcmFtc0YzMi5zZXQoXG5cdFx0W1xuXHRcdFx0c2V0dGluZ3MudGF1LFxuXHRcdFx0c2V0dGluZ3Muc2hlYXJNb2R1bHVzLFxuXHRcdFx0c2V0dGluZ3MuYnVsa01vZHVsdXMsXG5cdFx0XHRzZXR0aW5ncy5lcHNpbG9uLFxuXHRcdFx0Li4uc2V0dGluZ3MuY2VudGVyLFxuXHRcdFx0c2V0dGluZ3MuaGFsZkxlbmd0aCxcblx0XHRcdHNldHRpbmdzLnJhZGl1cyxcblx0XHRcdHNldHRpbmdzLm11c2NsZUhhbGZMZW5ndGgsXG5cdFx0XHRzZXR0aW5ncy5tdXNjbGVSYWRpdXMsXG5cdFx0XHRzZXR0aW5ncy5hY3R1YXRpb25BbXAsXG5cdFx0XHRzZXR0aW5ncy5hY3R1YXRpb25GcmVxLFxuXHRcdF0sXG5cdFx0NFxuXHQpO1xuXHRwYXJhbXNVMzIuc2V0KFtzZXR0aW5ncy5zaGFwZV0sIDE2KTtcblx0cGFyYW1zRjMyLnNldChcblx0XHRbXG5cdFx0XHRzZXR0aW5ncy5waXZvdFJhZGl1cyxcblx0XHRcdHNldHRpbmdzLnNwaW5BbmdsZSxcblx0XHRcdHNldHRpbmdzLnNwaW5GcmVxLFxuXHRcdFx0c2V0dGluZ3MuZnJpY3Rpb24sXG5cdFx0XHRzZXR0aW5ncy5oZWFsLFxuXHRcdFx0c2V0dGluZ3Mud2F2ZU51bWJlcixcblx0XHRdLFxuXHRcdDE3XG5cdCk7XG5cblx0Y29uc3QgcGFyYW1zQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiUGFyYW1zIEJ1ZmZlclwiLFxuXHRcdHNpemU6IHBhcmFtc0RhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRjb25zdCBpbnRlcmFjdGlvbnMgPSBzZXR1cEludGVyYWN0aW9ucyhcblx0XHRkZXZpY2UsXG5cdFx0Y2FudmFzLmNvbnRleHQuY2FudmFzIGFzIEhUTUxDYW52YXNFbGVtZW50LFxuXHRcdGdyaWRcblx0KTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0gc3RhdGUgdGV4dHVyZXMgKHBpbmctcG9uZykgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vIHJlZmVyZW5jZSBtYXAgeGkgPSAoWCwgWSkgYW5kIEQyUTkgcG9wdWxhdGlvbnMgZl8wLi5mXzhcblx0Y29uc3QgeGkgPSBbMCwgMV0ubWFwKChpKSA9PlxuXHRcdGNyZWF0ZUZpZWxkVGV4dHVyZShkZXZpY2UsIGB4aSR7aX1gLCBncmlkLCBcInJnMzJmbG9hdFwiKVxuXHQpO1xuXHRjb25zdCBkaXN0ID0gWzAsIDFdLm1hcCgoaSkgPT5cblx0XHRjcmVhdGVGaWVsZFRleHR1cmUoZGV2aWNlLCBgZGlzdCR7aX1gLCBncmlkLCBcInIzMmZsb2F0XCIsIDkpXG5cdCk7XG5cblx0Ly8gaWRlbnRpdHkgcmVmZXJlbmNlIG1hcFxuXHRjb25zdCBjZWxscyA9IGdyaWQud2lkdGggKiBncmlkLmhlaWdodDtcblx0Y29uc3QgeGlJbml0ID0gbmV3IEZsb2F0MzJBcnJheShjZWxscyAqIDIpO1xuXHRmb3IgKGxldCB5ID0gMDsgeSA8IGdyaWQuaGVpZ2h0OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IGdyaWQud2lkdGg7IHgrKykge1xuXHRcdFx0Y29uc3QgaSA9IDIgKiAoeSAqIGdyaWQud2lkdGggKyB4KTtcblx0XHRcdHhpSW5pdFtpXSA9IHg7XG5cdFx0XHR4aUluaXRbaSArIDFdID0geTtcblx0XHR9XG5cdH1cblx0eGkuZm9yRWFjaCgodCkgPT4gd3JpdGVGaWVsZFRleHR1cmUoZGV2aWNlLCB0LCBncmlkLCAxLCA4LCB4aUluaXQpKTtcblxuXHQvLyBlcXVpbGlicml1bSBwb3B1bGF0aW9ucyBvZiBhIHF1aWVzY2VudCBmbHVpZCAocmhvID0gMSwgdiA9IDApXG5cdGNvbnN0IHdlaWdodHMgPSBbNCAvIDksIDEgLyA5LCAxIC8gOSwgMSAvIDksIDEgLyA5LCAxIC8gMzYsIDEgLyAzNiwgMSAvIDM2LCAxIC8gMzZdO1xuXHRjb25zdCBmSW5pdCA9IG5ldyBGbG9hdDMyQXJyYXkoY2VsbHMgKiA5KTtcblx0d2VpZ2h0cy5mb3JFYWNoKCh3LCBsYXllcikgPT4gZkluaXQuZmlsbCh3LCBsYXllciAqIGNlbGxzLCAobGF5ZXIgKyAxKSAqIGNlbGxzKSk7XG5cdGRpc3QuZm9yRWFjaCgodCkgPT4gd3JpdGVGaWVsZFRleHR1cmUoZGV2aWNlLCB0LCBncmlkLCA5LCA0LCBmSW5pdCkpO1xuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwaXBlbGluZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Y29uc3QgY29tcHV0ZUxheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcImNvbXB1dGVMYXlvdXRcIixcblx0XHRlbnRyaWVzOiBbXG5cdFx0XHR7IGJpbmRpbmc6IDAsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsIGJ1ZmZlcjogeyB0eXBlOiBcInVuaWZvcm1cIiB9IH0sXG5cdFx0XHR7IGJpbmRpbmc6IDEsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsIGJ1ZmZlcjogeyB0eXBlOiBcInVuaWZvcm1cIiB9IH0sXG5cdFx0XHR7IGJpbmRpbmc6IDIsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsIHRleHR1cmU6IHsgc2FtcGxlVHlwZTogXCJ1bmZpbHRlcmFibGUtZmxvYXRcIiB9IH0sXG5cdFx0XHR7IGJpbmRpbmc6IDMsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsIHRleHR1cmU6IHsgc2FtcGxlVHlwZTogXCJ1bmZpbHRlcmFibGUtZmxvYXRcIiwgdmlld0RpbWVuc2lvbjogXCIyZC1hcnJheVwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogNCwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgc3RvcmFnZVRleHR1cmU6IHsgYWNjZXNzOiBcIndyaXRlLW9ubHlcIiwgZm9ybWF0OiBcInJnMzJmbG9hdFwiIH0gfSxcblx0XHRcdHsgYmluZGluZzogNSwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgc3RvcmFnZVRleHR1cmU6IHsgYWNjZXNzOiBcIndyaXRlLW9ubHlcIiwgZm9ybWF0OiBcInIzMmZsb2F0XCIsIHZpZXdEaW1lbnNpb246IFwiMmQtYXJyYXlcIiB9IH0sXG5cdFx0XSxcblx0fSk7XG5cdGNvbnN0IHJlbmRlckxheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcInJlbmRlckxheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHsgYmluZGluZzogMCwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsIGJ1ZmZlcjogeyB0eXBlOiBcInVuaWZvcm1cIiB9IH0sXG5cdFx0XHR7IGJpbmRpbmc6IDEsIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5ULCB0ZXh0dXJlOiB7IHNhbXBsZVR5cGU6IFwidW5maWx0ZXJhYmxlLWZsb2F0XCIgfSB9LFxuXHRcdFx0eyBiaW5kaW5nOiAyLCB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCwgdGV4dHVyZTogeyBzYW1wbGVUeXBlOiBcInVuZmlsdGVyYWJsZS1mbG9hdFwiLCB2aWV3RGltZW5zaW9uOiBcIjJkLWFycmF5XCIgfSB9LFxuXHRcdF0sXG5cdH0pO1xuXG5cdGNvbnN0IGNvbXB1dGVNb2R1bGUgPSBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRsYWJlbDogXCJsYnJtdENvbXB1dGVTaGFkZXJcIixcblx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoY29tcHV0ZVNoYWRlciwgW2NvbW1vbl0pLFxuXHR9KTtcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRiaW5kR3JvdXBMYXlvdXRzOiBbY29tcHV0ZUxheW91dF0sXG5cdH0pO1xuXHRjb25zdCBbYWR2ZWN0UGlwZWxpbmUsIGNvbGxpZGVQaXBlbGluZV0gPSBbXCJhZHZlY3RcIiwgXCJjb2xsaWRlXCJdLm1hcChcblx0XHQoZW50cnlQb2ludCkgPT5cblx0XHRcdGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuXHRcdFx0XHRsYWJlbDogZW50cnlQb2ludCxcblx0XHRcdFx0bGF5b3V0OiBjb21wdXRlUGlwZWxpbmVMYXlvdXQsXG5cdFx0XHRcdGNvbXB1dGU6IHsgbW9kdWxlOiBjb21wdXRlTW9kdWxlLCBlbnRyeVBvaW50OiBlbnRyeVBvaW50IH0sXG5cdFx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHF1YWQgPSBzZXR1cFZlcnRleEJ1ZmZlcihcblx0XHRkZXZpY2UsXG5cdFx0XCJRdWFkIFZlcnRleCBCdWZmZXJcIixcblx0XHRbLTEsIC0xLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAxLCAxLCAtMSwgMV1cblx0KTtcblx0Y29uc3QgcmVuZGVyUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuXHRcdGxhYmVsOiBcInJlbmRlclBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoeyBiaW5kR3JvdXBMYXlvdXRzOiBbcmVuZGVyTGF5b3V0XSB9KSxcblx0XHR2ZXJ0ZXg6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGxhYmVsOiBcInF1YWRWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogdmVydGV4U2hhZGVyLFxuXHRcdFx0fSksXG5cdFx0XHRidWZmZXJzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhcnJheVN0cmlkZTogcXVhZC5hcnJheVN0cmlkZSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBbeyBmb3JtYXQ6IHF1YWQuZm9ybWF0LCBvZmZzZXQ6IDAsIHNoYWRlckxvY2F0aW9uOiAwIH1dLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHRcdGZyYWdtZW50OiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJyZW5kZXJGcmFnbWVudFNoYWRlclwiLFxuXHRcdFx0XHRjb2RlOiBwcmVwZW5kSW5jbHVkZXMoZnJhZ21lbnRTaGFkZXIsIFtjb21tb25dKSxcblx0XHRcdH0pLFxuXHRcdFx0dGFyZ2V0czogW3sgZm9ybWF0OiBjYW52YXMuZm9ybWF0IH1dLFxuXHRcdH0sXG5cdH0pO1xuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW5kIGdyb3VwcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Y29uc3QgeGlWaWV3cyA9IHhpLm1hcCgodCkgPT4gdC5jcmVhdGVWaWV3KCkpO1xuXHRjb25zdCBmVmlld3MgPSBkaXN0Lm1hcCgodCkgPT4gdC5jcmVhdGVWaWV3KCkpO1xuXG5cdGNvbnN0IGNvbXB1dGVCaW5kR3JvdXAgPSAoXG5cdFx0bGFiZWw6IHN0cmluZyxcblx0XHR4aVNyYzogbnVtYmVyLFxuXHRcdGZTcmM6IG51bWJlcixcblx0XHR4aURzdDogbnVtYmVyLFxuXHRcdGZEc3Q6IG51bWJlclxuXHQpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogbGFiZWwsXG5cdFx0XHRsYXlvdXQ6IGNvbXB1dGVMYXlvdXQsXG5cdFx0XHRlbnRyaWVzOiBbXG5cdFx0XHRcdHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiBwYXJhbXNCdWZmZXIgfSB9LFxuXHRcdFx0XHR7IGJpbmRpbmc6IDEsIHJlc291cmNlOiB7IGJ1ZmZlcjogaW50ZXJhY3Rpb25zLmJ1ZmZlciB9IH0sXG5cdFx0XHRcdHsgYmluZGluZzogMiwgcmVzb3VyY2U6IHhpVmlld3NbeGlTcmNdIH0sXG5cdFx0XHRcdHsgYmluZGluZzogMywgcmVzb3VyY2U6IGZWaWV3c1tmU3JjXSB9LFxuXHRcdFx0XHR7IGJpbmRpbmc6IDQsIHJlc291cmNlOiB4aVZpZXdzW3hpRHN0XSB9LFxuXHRcdFx0XHR7IGJpbmRpbmc6IDUsIHJlc291cmNlOiBmVmlld3NbZkRzdF0gfSxcblx0XHRcdF0sXG5cdFx0fSk7XG5cblx0Ly8gZCA9IGluZGV4IG9mIHRoZSB0ZXh0dXJlcyBob2xkaW5nIHRoZSBjdXJyZW50IHN0YXRlXG5cdC8vIGFkdmVjdDogcmVhZHMgeGlbZF0sIGZbZF0gLT4gd3JpdGVzIHhpWzEtZF1cblx0Ly8gY29sbGlkZTogcmVhZHMgeGlbMS1kXSAobmV3KSwgZltkXSAtPiB3cml0ZXMgZlsxLWRdXG5cdGNvbnN0IGFkdmVjdEdyb3VwcyA9IFswLCAxXS5tYXAoKGQpID0+XG5cdFx0Y29tcHV0ZUJpbmRHcm91cChgYWR2ZWN0JHtkfWAsIGQsIGQsIDEgLSBkLCAxIC0gZClcblx0KTtcblx0Y29uc3QgY29sbGlkZUdyb3VwcyA9IFswLCAxXS5tYXAoKGQpID0+XG5cdFx0Y29tcHV0ZUJpbmRHcm91cChgY29sbGlkZSR7ZH1gLCAxIC0gZCwgZCwgZCwgMSAtIGQpXG5cdCk7XG5cdGNvbnN0IHJlbmRlckdyb3VwcyA9IFswLCAxXS5tYXAoKGQpID0+XG5cdFx0ZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG5cdFx0XHRsYWJlbDogYHJlbmRlciR7ZH1gLFxuXHRcdFx0bGF5b3V0OiByZW5kZXJMYXlvdXQsXG5cdFx0XHRlbnRyaWVzOiBbXG5cdFx0XHRcdHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiBwYXJhbXNCdWZmZXIgfSB9LFxuXHRcdFx0XHR7IGJpbmRpbmc6IDEsIHJlc291cmNlOiB4aVZpZXdzW2RdIH0sXG5cdFx0XHRcdHsgYmluZGluZzogMiwgcmVzb3VyY2U6IGZWaWV3c1tkXSB9LFxuXHRcdFx0XSxcblx0XHR9KVxuXHQpO1xuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtYWluIGxvb3AgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Y29uc3Qgd29ya2dyb3VwczogW251bWJlciwgbnVtYmVyXSA9IFtcblx0XHRNYXRoLmNlaWwoZ3JpZC53aWR0aCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XHRNYXRoLmNlaWwoZ3JpZC5oZWlnaHQgLyBXT1JLR1JPVVBfU0laRSksXG5cdF07XG5cblx0bGV0IGN1cnJlbnQgPSAwO1xuXHRsZXQgc3RlcCA9IDA7XG5cblx0Ly8gc3RhZ2luZyBidWZmZXIgdG8gcmVhZCBiYWNrIHRoZSByZWZlcmVuY2UgbWFwIHVuZGVyIGEgZ3JhYiBjbGljazpcblx0Ly8gdGhlIGdyYWJiZWQgbWF0ZXJpYWwgcG9pbnQgaXMgaWRlbnRpZmllZCBieSBpdHMgcmVmZXJlbmNlIGNvb3JkaW5hdGVzXG5cdGNvbnN0IGdyYWJTdGFnaW5nID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG5cdFx0bGFiZWw6IFwiR3JhYiBTdGFnaW5nIEJ1ZmZlclwiLFxuXHRcdHNpemU6IDI1Nixcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuTUFQX1JFQUQgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cdGxldCBncmFiSW5GbGlnaHQgPSBmYWxzZTtcblxuXHRmdW5jdGlvbiByZXF1ZXN0R3JhYihhdDogW251bWJlciwgbnVtYmVyXSkge1xuXHRcdGdyYWJJbkZsaWdodCA9IHRydWU7XG5cdFx0Y29uc3QgZW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXHRcdGVuY29kZXIuY29weVRleHR1cmVUb0J1ZmZlcihcblx0XHRcdHtcblx0XHRcdFx0dGV4dHVyZTogeGlbY3VycmVudF0sXG5cdFx0XHRcdG9yaWdpbjoge1xuXHRcdFx0XHRcdHg6IE1hdGgubWluKE1hdGgubWF4KE1hdGguZmxvb3IoYXRbMF0pLCAwKSwgZ3JpZC53aWR0aCAtIDEpLFxuXHRcdFx0XHRcdHk6IE1hdGgubWluKE1hdGgubWF4KE1hdGguZmxvb3IoYXRbMV0pLCAwKSwgZ3JpZC5oZWlnaHQgLSAxKSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7IGJ1ZmZlcjogZ3JhYlN0YWdpbmcsIGJ5dGVzUGVyUm93OiAyNTYgfSxcblx0XHRcdHsgd2lkdGg6IDEsIGhlaWdodDogMSB9XG5cdFx0KTtcblx0XHRkZXZpY2UucXVldWUuc3VibWl0KFtlbmNvZGVyLmZpbmlzaCgpXSk7XG5cdFx0Z3JhYlN0YWdpbmcubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKS50aGVuKCgpID0+IHtcblx0XHRcdGNvbnN0IHhpR3JhYiA9IG5ldyBGbG9hdDMyQXJyYXkoZ3JhYlN0YWdpbmcuZ2V0TWFwcGVkUmFuZ2UoMCwgOCkpO1xuXHRcdFx0aW50ZXJhY3Rpb25zLmRhdGFbNl0gPSB4aUdyYWJbMF07XG5cdFx0XHRpbnRlcmFjdGlvbnMuZGF0YVs3XSA9IHhpR3JhYlsxXTtcblx0XHRcdC8vIGFjdGl2YXRlIG9ubHkgaWYgdGhlIGJ1dHRvbiBpcyBzdGlsbCBoZWxkXG5cdFx0XHRpbnRlcmFjdGlvbnMuZGF0YVszXSA9IGludGVyYWN0aW9ucy5kYXRhWzJdID4gMCA/IDEgOiAwO1xuXHRcdFx0Z3JhYlN0YWdpbmcudW5tYXAoKTtcblx0XHRcdGdyYWJJbkZsaWdodCA9IGZhbHNlO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZnJhbWUoKSB7XG5cdFx0aW50ZXJhY3Rpb25zLnVwZGF0ZSgpO1xuXHRcdGNvbnN0IGdyYWJBdCA9IGludGVyYWN0aW9ucy5jb25zdW1lR3JhYlJlcXVlc3QoKTtcblx0XHRpZiAoZ3JhYkF0ICYmICFncmFiSW5GbGlnaHQpIHJlcXVlc3RHcmFiKGdyYWJBdCk7XG5cdFx0cGFyYW1zVTMyWzJdID0gc3RlcDtcblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIocGFyYW1zQnVmZmVyLCAwLCBwYXJhbXNEYXRhKTtcblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoaW50ZXJhY3Rpb25zLmJ1ZmZlciwgMCwgaW50ZXJhY3Rpb25zLmRhdGEpO1xuXG5cdFx0Y29uc3QgZW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuXG5cdFx0Y29uc3QgY29tcHV0ZSA9IGVuY29kZXIuYmVnaW5Db21wdXRlUGFzcygpO1xuXHRcdGZvciAobGV0IHMgPSAwOyBzIDwgU1VCU1RFUFM7IHMrKykge1xuXHRcdFx0Y29tcHV0ZS5zZXRQaXBlbGluZShhZHZlY3RQaXBlbGluZSk7XG5cdFx0XHRjb21wdXRlLnNldEJpbmRHcm91cCgwLCBhZHZlY3RHcm91cHNbY3VycmVudF0pO1xuXHRcdFx0Y29tcHV0ZS5kaXNwYXRjaFdvcmtncm91cHMoLi4ud29ya2dyb3Vwcyk7XG5cblx0XHRcdGNvbXB1dGUuc2V0UGlwZWxpbmUoY29sbGlkZVBpcGVsaW5lKTtcblx0XHRcdGNvbXB1dGUuc2V0QmluZEdyb3VwKDAsIGNvbGxpZGVHcm91cHNbY3VycmVudF0pO1xuXHRcdFx0Y29tcHV0ZS5kaXNwYXRjaFdvcmtncm91cHMoLi4ud29ya2dyb3Vwcyk7XG5cblx0XHRcdGN1cnJlbnQgPSAxIC0gY3VycmVudDtcblx0XHR9XG5cdFx0Y29tcHV0ZS5lbmQoKTtcblx0XHRzdGVwICs9IFNVQlNURVBTO1xuXG5cdFx0Y29uc3QgcmVuZGVyID0gZW5jb2Rlci5iZWdpblJlbmRlclBhc3Moe1xuXHRcdFx0Y29sb3JBdHRhY2htZW50czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmlldzogY2FudmFzLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKS5jcmVhdGVWaWV3KCksXG5cdFx0XHRcdFx0bG9hZE9wOiBcImNsZWFyXCIsXG5cdFx0XHRcdFx0Y2xlYXJWYWx1ZTogeyByOiAwLCBnOiAwLCBiOiAwLCBhOiAxIH0sXG5cdFx0XHRcdFx0c3RvcmVPcDogXCJzdG9yZVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9KTtcblx0XHRyZW5kZXIuc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXHRcdHJlbmRlci5zZXRCaW5kR3JvdXAoMCwgcmVuZGVyR3JvdXBzW2N1cnJlbnRdKTtcblx0XHRyZW5kZXIuc2V0VmVydGV4QnVmZmVyKDAsIHF1YWQudmVydGV4QnVmZmVyKTtcblx0XHRyZW5kZXIuZHJhdyhxdWFkLnZlcnRleENvdW50KTtcblx0XHRyZW5kZXIuZW5kKCk7XG5cblx0XHRkZXZpY2UucXVldWUuc3VibWl0KFtlbmNvZGVyLmZpbmlzaCgpXSk7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcblx0fVxuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xufVxuXG5tYWluKCk7XG4iLCJpbnRlcmZhY2UgU2l6ZSB7XG5cdHdpZHRoOiBudW1iZXI7XG5cdGhlaWdodDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKCk6IFByb21pc2U8R1BVRGV2aWNlPiB7XG5cdGlmICghbmF2aWdhdG9yLmdwdSkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIldlYkdQVSBOT1QgU3VwcG9ydGVkXCIpO1xuXG5cdGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKHtcblx0XHRwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiLFxuXHR9KTtcblx0aWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cblx0cmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSgpO1xufVxuXG5mdW5jdGlvbiBjb25maWd1cmVDYW52YXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRzaXplOiBTaXplID0geyB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IH1cbik6IHtcblx0Y29udGV4dDogR1BVQ2FudmFzQ29udGV4dDtcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRzaXplOiBTaXplO1xufSB7XG5cdGNvbnN0IGNhbnZhcyA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSwgc2l6ZSk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuXHRjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJncHVcIik7XG5cdGlmICghY29udGV4dCkgdGhyb3dEZXRlY3Rpb25FcnJvcihcIkNhbnZhcyBkb2VzIG5vdCBzdXBwb3J0IFdlYkdQVVwiKTtcblxuXHRjb25zdCBmb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXHRjb250ZXh0LmNvbmZpZ3VyZSh7XG5cdFx0ZGV2aWNlOiBkZXZpY2UsXG5cdFx0Zm9ybWF0OiBmb3JtYXQsXG5cdFx0dXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcblx0XHRhbHBoYU1vZGU6IFwicHJlbXVsdGlwbGllZFwiLFxuXHR9KTtcblxuXHRyZXR1cm4geyBjb250ZXh0OiBjb250ZXh0LCBmb3JtYXQ6IGZvcm1hdCwgc2l6ZTogc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFZlcnRleEJ1ZmZlcihcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGxhYmVsOiBzdHJpbmcsXG5cdGRhdGE6IG51bWJlcltdXG4pOiB7XG5cdHZlcnRleEJ1ZmZlcjogR1BVQnVmZmVyO1xuXHR2ZXJ0ZXhDb3VudDogbnVtYmVyO1xuXHRhcnJheVN0cmlkZTogbnVtYmVyO1xuXHRmb3JtYXQ6IEdQVVZlcnRleEZvcm1hdDtcbn0ge1xuXHRjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cdGNvbnN0IHZlcnRleEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRzaXplOiBhcnJheS5ieXRlTGVuZ3RoLFxuXHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5WRVJURVggfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcblx0fSk7XG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcih2ZXJ0ZXhCdWZmZXIsIDAsIGFycmF5KTtcblxuXHRyZXR1cm4ge1xuXHRcdHZlcnRleEJ1ZmZlcjogdmVydGV4QnVmZmVyLFxuXHRcdHZlcnRleENvdW50OiBhcnJheS5sZW5ndGggLyAyLFxuXHRcdGFycmF5U3RyaWRlOiAyICogYXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXG5cdFx0Zm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxuXHR9O1xufVxuXG4vKiogQ3JlYXRlIGEgdGV4dHVyZSB1c2VkIGFzIGJvdGggYSBzYW1wbGVkIHNvdXJjZSBhbmQgYSBzdG9yYWdlIGRlc3RpbmF0aW9uLiAqL1xuZnVuY3Rpb24gY3JlYXRlRmllbGRUZXh0dXJlKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0bGFiZWw6IHN0cmluZyxcblx0c2l6ZTogU2l6ZSxcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0LFxuXHRsYXllcnM6IG51bWJlciA9IDFcbik6IEdQVVRleHR1cmUge1xuXHRyZXR1cm4gZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuXHRcdGxhYmVsOiBsYWJlbCxcblx0XHRmb3JtYXQ6IGZvcm1hdCxcblx0XHRzaXplOiB7IHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBkZXB0aE9yQXJyYXlMYXllcnM6IGxheWVycyB9LFxuXHRcdHVzYWdlOlxuXHRcdFx0R1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8XG5cdFx0XHRHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHxcblx0XHRcdEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCB8XG5cdFx0XHRHUFVUZXh0dXJlVXNhZ2UuQ09QWV9TUkMsXG5cdH0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZpZWxkVGV4dHVyZShcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHRleHR1cmU6IEdQVVRleHR1cmUsXG5cdHNpemU6IFNpemUsXG5cdGxheWVyczogbnVtYmVyLFxuXHRieXRlc1BlclRleGVsOiBudW1iZXIsXG5cdGRhdGE6IEZsb2F0MzJBcnJheVxuKTogdm9pZCB7XG5cdGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG5cdFx0eyB0ZXh0dXJlOiB0ZXh0dXJlIH0sXG5cdFx0ZGF0YSxcblx0XHR7IGJ5dGVzUGVyUm93OiBzaXplLndpZHRoICogYnl0ZXNQZXJUZXhlbCwgcm93c1BlckltYWdlOiBzaXplLmhlaWdodCB9LFxuXHRcdHsgd2lkdGg6IHNpemUud2lkdGgsIGhlaWdodDogc2l6ZS5oZWlnaHQsIGRlcHRoT3JBcnJheUxheWVyczogbGF5ZXJzIH1cblx0KTtcbn1cblxuLyoqXG4gKiBDdXJzb3IgaW50ZXJhY3Rpb25zLiBSZXR1cm5zIGEgdW5pZm9ybSBidWZmZXIgbGFpZCBvdXQgYXNcbiAqIFt4LCB5LCBzaWduZWRSYWRpdXMsIHBhZCwgdngsIHZ5LCBwYWQsIHBhZF0gaW4gc2ltdWxhdGlvbi1ncmlkIGNvb3JkaW5hdGVzLlxuICogc2lnbmVkUmFkaXVzIGlzIHBvc2l0aXZlIHdoaWxlIHB1c2hpbmcgKGxlZnQgY2xpY2sgLyBvbmUgZmluZ2VyKSwgbmVnYXRpdmVcbiAqIHdoaWxlIHB1bGxpbmcgKHJpZ2h0IGNsaWNrIC8gdHdvIGZpbmdlcnMpIGFuZCB6ZXJvIHdoZW4gaW5hY3RpdmUuICh2eCwgdnkpXG4gKiBpcyB0aGUgc21vb3RoZWQgY3Vyc29yIHZlbG9jaXR5LCB1c2VkIHRvIGRyYWcgdGhlIGZsdWlkIGFuZCBzb2xpZCBhcm91bmQuXG4gKiBTY3JvbGwgYWRqdXN0cyB0aGUgcmFkaXVzLiBDYWxsIHVwZGF0ZSgpIG9uY2UgcGVyIGZyYW1lLlxuICovXG5mdW5jdGlvbiBzZXR1cEludGVyYWN0aW9ucyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsXG5cdGdyaWQ6IFNpemUsXG5cdHJhZGl1czogbnVtYmVyID0gNTBcbik6IHtcblx0YnVmZmVyOiBHUFVCdWZmZXI7XG5cdGRhdGE6IEZsb2F0MzJBcnJheTtcblx0dXBkYXRlOiAoKSA9PiB2b2lkO1xuXHRjb25zdW1lR3JhYlJlcXVlc3Q6ICgpID0+IFtudW1iZXIsIG51bWJlcl0gfCBudWxsO1xufSB7XG5cdGNvbnN0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDgpO1xuXHRsZXQgc2lnbiA9IDE7XG5cdGxldCBwcmV2aW91czogW251bWJlciwgbnVtYmVyXSB8IG51bGwgPSBudWxsO1xuXHRsZXQgZ3JhYlJlcXVlc3Q6IFtudW1iZXIsIG51bWJlcl0gfCBudWxsID0gbnVsbDtcblx0Ly8gcmF3IGN1cnNvciBwb3NpdGlvbjsgd2hpbGUgZ3JhYmJpbmcsIGRhdGFbMC4uMV0gaXMgYSByYXRlLWxpbWl0ZWRcblx0Ly8gdG93cG9pbnQgY2hhc2luZyBpdCwgc28gdGhlIHNvbGlkIGlzIG5ldmVyIHlhbmtlZCBmYXN0ZXIgdGhhbiBpdCBjYW5cblx0Ly8gcGh5c2ljYWxseSBmb2xsb3cgKGl0IHdvdWxkIHRlYXIgYXBhcnQpXG5cdGxldCByYXc6IFtudW1iZXIsIG51bWJlcl0gPSBbMCwgMF07XG5cblx0Y29uc3Qgc2V0UG9zaXRpb24gPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcblx0XHRyYXcgPSBbKHggLyBjYW52YXMud2lkdGgpICogZ3JpZC53aWR0aCwgKHkgLyBjYW52YXMuaGVpZ2h0KSAqIGdyaWQuaGVpZ2h0XTtcblx0XHRpZiAoZGF0YVszXSA9PT0gMCkge1xuXHRcdFx0ZGF0YVswXSA9IHJhd1swXTtcblx0XHRcdGRhdGFbMV0gPSByYXdbMV07XG5cdFx0fVxuXHR9O1xuXG5cdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcblxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcIm1vdXNlbW92ZVwiLFxuXHRcdChldmVudCkgPT4gc2V0UG9zaXRpb24oZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSksXG5cdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0KTtcblx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XCJ0b3VjaG1vdmVcIixcblx0XHQoZXZlbnQpID0+XG5cdFx0XHRzZXRQb3NpdGlvbihldmVudC50b3VjaGVzWzBdLmNsaWVudFgsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSksXG5cdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0KTtcblxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXZlbnQpID0+IHtcblx0XHRzaWduID0gZXZlbnQuYnV0dG9uID09PSAyID8gLTEgOiAxO1xuXHRcdHNldFBvc2l0aW9uKGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkpO1xuXHRcdGRhdGFbMl0gPSBzaWduICogcmFkaXVzO1xuXHRcdGlmIChzaWduID4gMCkgZ3JhYlJlcXVlc3QgPSBbZGF0YVswXSwgZGF0YVsxXV07XG5cdH0pO1xuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcInRvdWNoc3RhcnRcIixcblx0XHQoZXZlbnQpID0+IHtcblx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRzZXRQb3NpdGlvbihldmVudC50b3VjaGVzWzBdLmNsaWVudFgsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSk7XG5cdFx0XHRkYXRhWzJdID0gc2lnbiAqIHJhZGl1cztcblx0XHRcdGlmIChzaWduID4gMCkgZ3JhYlJlcXVlc3QgPSBbZGF0YVswXSwgZGF0YVsxXV07XG5cdFx0fSxcblx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHQpO1xuXG5cdFtcIm1vdXNldXBcIiwgXCJtb3VzZWxlYXZlXCIsIFwidG91Y2hlbmRcIiwgXCJ0b3VjaGNhbmNlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKCkgPT4ge1xuXHRcdFx0ZGF0YVsyXSA9IDA7XG5cdFx0XHRkYXRhWzNdID0gMDsgLy8gcmVsZWFzZSB0aGUgZ3JhYlxuXHRcdFx0Z3JhYlJlcXVlc3QgPSBudWxsO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcIndoZWVsXCIsXG5cdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBsaW1pdCA9IDAuNSAqIE1hdGgubWluKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KTtcblx0XHRcdHJhZGl1cyA9IE1hdGgubWluKE1hdGgubWF4KHJhZGl1cyArIGV2ZW50LmRlbHRhWSAqIDAuMDUsIDUpLCBsaW1pdCk7XG5cdFx0XHRpZiAoZGF0YVsyXSAhPT0gMCkgZGF0YVsyXSA9IHNpZ24gKiByYWRpdXM7XG5cdFx0fSxcblx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHQpO1xuXG5cdGNvbnN0IGJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHQvLyBwZXItZnJhbWU6IGFkdmFuY2UgdGhlIHRvd3BvaW50IGFuZCB0aGUgc21vb3RoZWQgY3Vyc29yIHZlbG9jaXR5XG5cdGNvbnN0IHVwZGF0ZSA9ICgpID0+IHtcblx0XHRpZiAoZGF0YVszXSA+IDApIHtcblx0XHRcdGNvbnN0IG1heFN0ZXAgPSAyOyAvLyBjZWxscyBwZXIgZnJhbWVcblx0XHRcdGNvbnN0IGR4ID0gcmF3WzBdIC0gZGF0YVswXTtcblx0XHRcdGNvbnN0IGR5ID0gcmF3WzFdIC0gZGF0YVsxXTtcblx0XHRcdGNvbnN0IGRpc3QgPSBNYXRoLmh5cG90KGR4LCBkeSk7XG5cdFx0XHRjb25zdCBzY2FsZSA9IGRpc3QgPiBtYXhTdGVwID8gbWF4U3RlcCAvIGRpc3QgOiAxO1xuXHRcdFx0ZGF0YVswXSArPSBkeCAqIHNjYWxlO1xuXHRcdFx0ZGF0YVsxXSArPSBkeSAqIHNjYWxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhWzBdID0gcmF3WzBdO1xuXHRcdFx0ZGF0YVsxXSA9IHJhd1sxXTtcblx0XHR9XG5cdFx0aWYgKHByZXZpb3VzICYmIGRhdGFbMl0gIT09IDApIHtcblx0XHRcdGRhdGFbNF0gPSAwLjYgKiBkYXRhWzRdICsgMC40ICogKGRhdGFbMF0gLSBwcmV2aW91c1swXSk7XG5cdFx0XHRkYXRhWzVdID0gMC42ICogZGF0YVs1XSArIDAuNCAqIChkYXRhWzFdIC0gcHJldmlvdXNbMV0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhWzRdID0gMDtcblx0XHRcdGRhdGFbNV0gPSAwO1xuXHRcdH1cblx0XHRwcmV2aW91cyA9IFtkYXRhWzBdLCBkYXRhWzFdXTtcblx0fTtcblxuXHRjb25zdCBjb25zdW1lR3JhYlJlcXVlc3QgPSAoKTogW251bWJlciwgbnVtYmVyXSB8IG51bGwgPT4ge1xuXHRcdGNvbnN0IHJlcXVlc3QgPSBncmFiUmVxdWVzdDtcblx0XHRncmFiUmVxdWVzdCA9IG51bGw7XG5cdFx0cmV0dXJuIHJlcXVlc3Q7XG5cdH07XG5cblx0cmV0dXJuIHtcblx0XHRidWZmZXI6IGJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHVwZGF0ZTogdXBkYXRlLFxuXHRcdGNvbnN1bWVHcmFiUmVxdWVzdDogY29uc3VtZUdyYWJSZXF1ZXN0LFxuXHR9O1xufVxuXG4vKiogUmVwbGFjZSBgI2ltcG9ydGAgZGlyZWN0aXZlcyBieSBwcmVwZW5kaW5nIHRoZSBpbmNsdWRlZCBzb3VyY2UgZmlsZXMuICovXG5mdW5jdGlvbiBwcmVwZW5kSW5jbHVkZXMoY29kZTogc3RyaW5nLCBpbmNsdWRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuXHRjb2RlID0gY29kZS5yZXBsYWNlKC9eI2ltcG9ydC4qL2dtLCBcIlwiKTtcblx0cmV0dXJuIGluY2x1ZGVzLnJlZHVjZSgoYWNjLCBpbmNsdWRlKSA9PiBpbmNsdWRlICsgXCJcXG5cIiArIGFjYywgY29kZSk7XG59XG5cbmV4cG9ydCB7XG5cdFNpemUsXG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdGNyZWF0ZUZpZWxkVGV4dHVyZSxcblx0d3JpdGVGaWVsZFRleHR1cmUsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRwcmVwZW5kSW5jbHVkZXMsXG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9