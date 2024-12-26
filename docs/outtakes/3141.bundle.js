"use strict";
(self["webpackChunkfluid_structure_interactive"] =
	self["webpackChunkfluid_structure_interactive"] || []).push([
	["index"],
	{
		/***/ "./src/index.ts":
			/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
			/***/ (
				__unused_webpack_module,
				__webpack_exports__,
				__webpack_require__
			) => {
				__webpack_require__.r(__webpack_exports__);
				/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ =
					__webpack_require__(/*! ./utils */ "./src/utils.ts");
				/* harmony import */ var _shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_1__ =
					__webpack_require__(
						/*! ./shaders/cell.vert.wgsl */ "./src/shaders/cell.vert.wgsl"
					);
				/* harmony import */ var _shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_2__ =
					__webpack_require__(
						/*! ./shaders/cell.frag.wgsl */ "./src/shaders/cell.frag.wgsl"
					);
				/* harmony import */ var _shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_3__ =
					__webpack_require__(
						/*! ./shaders/timestep.comp.wgsl */ "./src/shaders/timestep.comp.wgsl"
					);

				const WORKGROUP_SIZE = 8;
				const UPDATE_INTERVAL = 1;
				let frame_index = 0;
				async function index() {
					// setup and configure WebGPU
					const device = await (0,
					_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
					const canvas = (0,
					_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(
						device
					);
					const GROUP_INDEX = 0;
					// initialize vertex buffer and textures
					const VERTEX_INDEX = 0;
					const QUAD = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
					const quad = (0,
					_utils__WEBPACK_IMPORTED_MODULE_0__.setupVertexBuffer)(
						device,
						"Quad Vertex Buffer",
						QUAD
					);
					const textures = (0,
					_utils__WEBPACK_IMPORTED_MODULE_0__.setupTextures)(
						device,
						canvas.size
					);
					const READ_BINDING = 0;
					const WRITE_BINDING = 1;
					const WORKGROUP_COUNT = [
						Math.ceil(textures.size.width / WORKGROUP_SIZE),
						Math.ceil(textures.size.height / WORKGROUP_SIZE),
					];
					// setup interactions
					const INTERACTION_BINDING = 2;
					const interactions = (0,
					_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(
						device,
						canvas.context.canvas,
						textures.size
					);
					const bindGroupLayout = device.createBindGroupLayout({
						label: "bindGroupLayout",
						entries: [
							{
								binding: READ_BINDING,
								visibility:
									GPUShaderStage.FRAGMENT |
									GPUShaderStage.COMPUTE,
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
					const bindGroups = [0, 1].map((i) =>
						device.createBindGroup({
							label: `Bind Group > ${textures.textures[i].label}`,
							layout: bindGroupLayout,
							entries: [
								{
									binding: READ_BINDING,
									resource:
										textures.textures[i % 2].createView(),
								},
								{
									binding: WRITE_BINDING,
									resource:
										textures.textures[
											(i + 1) % 2
										].createView(),
								},
								{
									binding: INTERACTION_BINDING,
									resource: {
										buffer: interactions.buffer,
									},
								},
							],
						})
					);
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
								code: (0,
								_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(
									_shaders_timestep_comp_wgsl__WEBPACK_IMPORTED_MODULE_3__,
									{
										WORKGROUP_SIZE: WORKGROUP_SIZE,
										GROUP_INDEX: GROUP_INDEX,
										READ_BINDING: READ_BINDING,
										WRITE_BINDING: WRITE_BINDING,
										INTERACTION_BINDING:
											INTERACTION_BINDING,
										FORMAT: textures.format.storage,
										WIDTH: textures.size.width,
										HEIGHT: textures.size.height,
									}
								),
							}),
						},
					});
					const RENDER_INDEX = 0;
					const renderPipeline = device.createRenderPipeline({
						label: "renderPipeline",
						layout: pipelineLayout,
						vertex: {
							module: device.createShaderModule({
								code: (0,
								_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(
									_shaders_cell_vert_wgsl__WEBPACK_IMPORTED_MODULE_1__,
									{
										VERTEX_INDEX: VERTEX_INDEX,
									}
								),
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
								code: (0,
								_utils__WEBPACK_IMPORTED_MODULE_0__.setValues)(
									_shaders_cell_frag_wgsl__WEBPACK_IMPORTED_MODULE_2__,
									{
										GROUP_INDEX: GROUP_INDEX,
										FORMAT: textures.format.storage,
										READ_BINDING: READ_BINDING,
										VERTEX_INDEX: VERTEX_INDEX,
										RENDER_INDEX: RENDER_INDEX,
										WIDTH: textures.size.width,
										HEIGHT: textures.size.height,
									}
								),
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
							view: canvas.context
								.getCurrentTexture()
								.createView(),
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
						computePass.setBindGroup(
							GROUP_INDEX,
							bindGroups[frame_index % 2]
						);
						device.queue.writeBuffer(
							interactions.buffer,
							/*offset=*/ 0,
							/*data=*/ interactions.data
						);
						computePass.dispatchWorkgroups(...WORKGROUP_COUNT);
						computePass.end();
						frame_index++;
						// render pass
						const texture = canvas.context.getCurrentTexture();
						const view = texture.createView();
						renderPassDescriptor.colorAttachments[
							RENDER_INDEX
						].view = view;
						const renderPass =
							command.beginRenderPass(renderPassDescriptor);
						renderPass.setPipeline(renderPipeline);
						renderPass.setBindGroup(
							GROUP_INDEX,
							bindGroups[frame_index % 2]
						);
						renderPass.setVertexBuffer(
							VERTEX_INDEX,
							quad.vertexBuffer
						);
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

				/***/
			},

		/***/ "./src/utils.ts":
			/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
			/***/ (
				__unused_webpack_module,
				__webpack_exports__,
				__webpack_require__
			) => {
				__webpack_require__.r(__webpack_exports__);
				/* harmony export */ __webpack_require__.d(
					__webpack_exports__,
					{
						/* harmony export */ configureCanvas: () =>
							/* binding */ configureCanvas,
						/* harmony export */ requestDevice: () =>
							/* binding */ requestDevice,
						/* harmony export */ setValues: () =>
							/* binding */ setValues,
						/* harmony export */ setupInteractions: () =>
							/* binding */ setupInteractions,
						/* harmony export */ setupTextures: () =>
							/* binding */ setupTextures,
						/* harmony export */ setupVertexBuffer: () =>
							/* binding */ setupVertexBuffer,
						/* harmony export */
					}
				);
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
					document.querySelector(
						".webgpu-not-supported"
					).style.visibility = "visible";
					throw new Error("Could not initialize WebGPU: " + error);
				}
				async function requestDevice(
					options = { powerPreference: "high-performance" },
					requiredFeatures = []
				) {
					if (!navigator.gpu)
						throwDetectionError("WebGPU NOT Supported");
					const adapter = await navigator.gpu.requestAdapter(options);
					if (!adapter) throwDetectionError("No GPU adapter found");
					return adapter.requestDevice({
						requiredFeatures: requiredFeatures,
					});
				}
				function configureCanvas(
					device,
					size = {
						width: window.innerWidth,
						height: window.innerHeight,
					}
				) {
					const canvas = Object.assign(
						document.createElement("canvas"),
						size
					);
					document.body.appendChild(canvas);
					const context = document
						.querySelector("canvas")
						.getContext("webgpu");
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
					device.queue.writeBuffer(
						vertexBuffer,
						/*bufferOffset=*/ 0,
						/*data=*/ array
					);
					return {
						vertexBuffer: vertexBuffer,
						vertexCount: array.length / 2,
						arrayStride: 2 * array.BYTES_PER_ELEMENT,
						format: "float32x2",
					};
				}
				function setupTextures(
					device,
					size,
					format = {
						sampleType: "float",
						storage: "rgba32float",
						texture: "f32",
					}
				) {
					const textureData = new Array(size.width * size.height);
					const CHANNELS = channelCount(format.storage);
					for (let i = 0; i < size.width * size.height; i++) {
						textureData[i] = [];
						for (let j = 0; j < CHANNELS; j++) {
							textureData[i].push(Math.random() > 1 ? 1 : 0);
						}
					}
					const stateTextures = ["A", "B"].map((label) =>
						device.createTexture({
							label: `State Texture ${label}`,
							size: [size.width, size.height],
							format: format.storage,
							usage:
								GPUTextureUsage.STORAGE_BINDING |
								GPUTextureUsage.COPY_DST,
						})
					);
					const texture = stateTextures[0];
					const array = new Float32Array(textureData.flat());
					device.queue.writeTexture(
						{ texture },
						/*data=*/ array,
						/*dataLayout=*/ {
							offset: 0,
							bytesPerRow:
								size.width * array.BYTES_PER_ELEMENT * CHANNELS,
							rowsPerImage: size.height,
						},
						/*size=*/ size
					);
					return {
						textures: stateTextures,
						format: format,
						size: size,
					};
				}
				function setupInteractions(
					device,
					canvas,
					texture,
					size = 1000
				) {
					let data = new Float32Array(4);
					var sign = 1;
					let position = { x: 0, y: 0 };
					let velocity = { x: 0, y: 0 };
					data.set([position.x, position.y, NaN, NaN]);
					if (canvas instanceof HTMLCanvasElement) {
						// disable context menu
						canvas.addEventListener("contextmenu", (event) => {
							event.preventDefault();
						});
						// move events
						["mousemove", "touchmove"].forEach((type) => {
							canvas.addEventListener(
								type,
								(event) => {
									switch (true) {
										case event instanceof MouseEvent:
											position.x = event.offsetX;
											position.y = event.offsetY;
											break;
										case event instanceof TouchEvent:
											position.x =
												event.touches[0].clientX;
											position.y =
												event.touches[0].clientY;
											break;
									}
									let x = Math.floor(
										(position.x / canvas.width) *
											texture.width
									);
									let y = Math.floor(
										(position.y / canvas.height) *
											texture.height
									);
									data.set([x, y]);
								},
								{ passive: true }
							);
						});
						// zoom events TODO(@gszep) add pinch and scroll for touch devices
						["wheel"].forEach((type) => {
							canvas.addEventListener(
								type,
								(event) => {
									switch (true) {
										case event instanceof WheelEvent:
											velocity.x = event.deltaY;
											velocity.y = event.deltaY;
											break;
									}
									size += velocity.y;
									data.set([size], 2);
								},
								{ passive: true }
							);
						});
						// click events TODO(@gszep) implement right click equivalent for touch devices
						["mousedown", "touchstart"].forEach((type) => {
							canvas.addEventListener(
								type,
								(event) => {
									switch (true) {
										case event instanceof MouseEvent:
											sign = 1 - event.button;
											break;
										case event instanceof TouchEvent:
											sign =
												event.touches.length > 1
													? -1
													: 1;
									}
									data.set([sign * size], 2);
								},
								{ passive: true }
							);
						});
						["mouseup", "touchend"].forEach((type) => {
							canvas.addEventListener(
								type,
								(event) => {
									data.set([NaN], 2);
								},
								{ passive: true }
							);
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
					} else if (format.includes("rgb")) {
						return 3;
					} else if (format.includes("rg")) {
						return 2;
					} else if (format.includes("r")) {
						return 1;
					} else {
						throw new Error("Invalid format: " + format);
					}
				}
				function setValues(code, variables) {
					const reg = new RegExp(
						Object.keys(variables).join("|"),
						"g"
					);
					return code.replace(reg, (k) => variables[k].toString());
				}

				/***/
			},

		/***/ "./src/shaders/cell.frag.wgsl":
			/*!************************************!*\
  !*** ./src/shaders/cell.frag.wgsl ***!
  \************************************/
			/***/ (module) => {
				module.exports =
					"struct Input {\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\nstruct Output {\n  @location(RENDER_INDEX) color: vec4<f32>\n};\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_storage_2d<FORMAT, read>;\nconst size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);\n\n@fragment\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    let x = vec2<i32>((1 + input.coordinate) / 2 * size);\n    let F = textureLoad(F, x);\n\n    // vorticity map\n    output.color.g = 5 * max(0, F.w);\n    output.color.r = 5 * max(0, -F.w);\n\n    // stream function map\n    output.color.b = abs(F.z);\n\n    output.color.a = F.x;\n    return output;\n}";

				/***/
			},

		/***/ "./src/shaders/cell.vert.wgsl":
			/*!************************************!*\
  !*** ./src/shaders/cell.vert.wgsl ***!
  \************************************/
			/***/ (module) => {
				module.exports =
					"struct Input {\n  @builtin(instance_index) instance: u32,\n  @location(VERTEX_INDEX) position: vec2<f32>,\n};\n\nstruct Output {\n  @builtin(position) position: vec4<f32>,\n  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,\n};\n\n@vertex\nfn main(input: Input) -> Output {\n    var output: Output;\n\n    output.position.x = input.position.x;\n    output.position.y = -input.position.y;\n\n    output.position.z = 0;\n    output.position.w = 1;\n\n    output.coordinate = input.position;\n    return output;\n}";

				/***/
			},

		/***/ "./src/shaders/timestep.comp.wgsl":
			/*!****************************************!*\
  !*** ./src/shaders/timestep.comp.wgsl ***!
  \****************************************/
			/***/ (module) => {
				module.exports =
					"struct Input {\n  @builtin(workgroup_id) workGroupID: vec3<u32>,\n  @builtin(local_invocation_id) localInvocationID: vec3<u32>,\n  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,\n};\n\nstruct Interaction {\n    position: vec2<f32>,\n    size: f32,\n};\n\nstruct Curl {\n    x: vec2<f32>,\n    y: vec2<f32>,\n    z: vec2<f32>,\n    w: vec2<f32>,\n};\n\nconst dx = vec2<i32>(1, 0);\nconst dy = vec2<i32>(0, 1);\n\n@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_storage_2d<FORMAT, read>;\nconst size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);\n\n@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<FORMAT, write>;\n@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;\n\nfn laplacian(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {\n    return value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);\n}\n\nfn curl(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> Curl {\n\n    let u = (value(F, x + dy) - value(F, x - dy)) / 2;\n    let v = (value(F, x - dx) - value(F, x + dx)) / 2;\n    var w: Curl;\n\n    w.x = vec2<f32>(u.x, v.x);\n    w.y = vec2<f32>(u.y, v.y);\n    w.z = vec2<f32>(u.z, v.z);\n    w.w = vec2<f32>(u.w, v.w);\n\n    return w;\n}\n\nfn jacobi_iteration(F: texture_storage_2d<FORMAT, read>, w: f32, x: vec2<i32>, h: f32) -> f32 {\n    return (value(F, x + dx).z + value(F, x - dx).z + value(F, x + dy).z + value(F, x - dy).z + h * w) / 4;\n}\n\nfn advected_value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>, dt: f32) -> vec4<f32> {\n    let y = vec2<f32>(x) - curl(F, x).z * dt;\n    return interpolate_value(F, y);\n}\n\nfn value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {\n    let y = x + size ; // not sure why this is necessary\n    return textureLoad(F, y % size);  // periodic boundary conditions\n}\n\nfn interpolate_value(F: texture_storage_2d<FORMAT, read>, x: vec2<f32>) -> vec4<f32> {\n\n    let fraction = fract(x);\n    let y = vec2<i32>(x + (0.5 - fraction));\n\n    return mix(\n        mix(\n            value(F, y),\n            value(F, y + dx),\n            fraction.x\n        ),\n        mix(\n            value(F, y + dy),\n            value(F, y + dx + dy),\n            fraction.x\n        ),\n        fraction.y\n    );\n}\n\n@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)\nfn main(input: Input) {\n\n    let x = vec2<i32>(input.globalInvocationID.xy);\n\n    if !(interaction.size < 0.0 || 0.0 < interaction.size) {\n        var Fdt = value(F, x);\n        Fdt.z = jacobi_iteration(F, Fdt.w, x, 10);\n\n        Fdt.x = abs(laplacian(F, x).z + value(F, x).w) / (1 + value(F, x).w);\n        textureStore(Fdash, x, Fdt);\n        return;\n    }\n    // vorticity timestep\n    var Fdt = advected_value(F, x, 1);\n    Fdt.w += laplacian(F, x).w * 0.05;\n\n    // BUG (gszep) use advected values\n    // relaxation of poisson equation for stream function\n    // Fdt.z = jacobi_iteration(F, Fdt.w, x, 1);\n\n    // error calculation\n    Fdt.x = abs(laplacian(F, x).z + value(F, x).w) / (1 + value(F, x).w);\n\n    // brush interaction\n    let distance = vec2<f32>(x) - interaction.position;\n    let norm = dot(distance, distance);\n\n    if sqrt(norm) < abs(interaction.size) {\n        Fdt.w += 0.01 * sign(interaction.size) * exp(- norm / abs(interaction.size));\n    }\n\n    textureStore(Fdash, x, Fdt);\n}";

				/***/
			},
	},
	/******/ (__webpack_require__) => {
		// webpackRuntimeModules
		/******/ var __webpack_exec__ = (moduleId) =>
			__webpack_require__((__webpack_require__.s = moduleId));
		/******/ var __webpack_exports__ = __webpack_exec__("./src/index.ts");
		/******/
	},
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNsQyxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7U0FBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNqQyxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7U0FBTSxDQUFDO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUM5QyxDQUFDO0FBQ0YsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxTQUE4QjtJQUM5RCxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM5RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbHVpZC1zdHJ1Y3R1cmUtaW50ZXJhY3RpdmUvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZmx1aWQtc3RydWN0dXJlLWludGVyYWN0aXZlLy4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdHJlcXVlc3REZXZpY2UsXG5cdGNvbmZpZ3VyZUNhbnZhcyxcblx0c2V0dXBWZXJ0ZXhCdWZmZXIsXG5cdHNldHVwVGV4dHVyZXMsXG5cdHNldHVwSW50ZXJhY3Rpb25zLFxuXHRzZXRWYWx1ZXMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBjZWxsVmVydGV4U2hhZGVyIGZyb20gXCIuL3NoYWRlcnMvY2VsbC52ZXJ0Lndnc2xcIjtcbmltcG9ydCBjZWxsRnJhZ21lbnRTaGFkZXIgZnJvbSBcIi4vc2hhZGVycy9jZWxsLmZyYWcud2dzbFwiO1xuaW1wb3J0IHRpbWVzdGVwQ29tcHV0ZVNoYWRlciBmcm9tIFwiLi9zaGFkZXJzL3RpbWVzdGVwLmNvbXAud2dzbFwiO1xuXG5jb25zdCBXT1JLR1JPVVBfU0laRSA9IDg7XG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAxO1xubGV0IGZyYW1lX2luZGV4ID0gMDtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG5cdGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcblx0Y29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG5cdGNvbnN0IEdST1VQX0lOREVYID0gMDtcblxuXHQvLyBpbml0aWFsaXplIHZlcnRleCBidWZmZXIgYW5kIHRleHR1cmVzXG5cdGNvbnN0IFZFUlRFWF9JTkRFWCA9IDA7XG5cdGNvbnN0IFFVQUQgPSBbLTEsIC0xLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAxLCAxLCAtMSwgMV07XG5cblx0Y29uc3QgcXVhZCA9IHNldHVwVmVydGV4QnVmZmVyKGRldmljZSwgXCJRdWFkIFZlcnRleCBCdWZmZXJcIiwgUVVBRCk7XG5cdGNvbnN0IHRleHR1cmVzID0gc2V0dXBUZXh0dXJlcyhkZXZpY2UsIGNhbnZhcy5zaXplKTtcblxuXHRjb25zdCBSRUFEX0JJTkRJTkcgPSAwO1xuXHRjb25zdCBXUklURV9CSU5ESU5HID0gMTtcblx0Y29uc3QgV09SS0dST1VQX0NPVU5UOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLndpZHRoIC8gV09SS0dST1VQX1NJWkUpLFxuXHRcdE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLmhlaWdodCAvIFdPUktHUk9VUF9TSVpFKSxcblx0XTtcblxuXHQvLyBzZXR1cCBpbnRlcmFjdGlvbnNcblx0Y29uc3QgSU5URVJBQ1RJT05fQklORElORyA9IDI7XG5cdGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKFxuXHRcdGRldmljZSxcblx0XHRjYW52YXMuY29udGV4dC5jYW52YXMsXG5cdFx0dGV4dHVyZXMuc2l6ZVxuXHQpO1xuXG5cdGNvbnN0IGJpbmRHcm91cExheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuXHRcdGxhYmVsOiBcImJpbmRHcm91cExheW91dFwiLFxuXHRcdGVudHJpZXM6IFtcblx0XHRcdHtcblx0XHRcdFx0YmluZGluZzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCB8IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdHN0b3JhZ2VUZXh0dXJlOiB7XG5cdFx0XHRcdFx0YWNjZXNzOiBcInJlYWQtb25seVwiLFxuXHRcdFx0XHRcdGZvcm1hdDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRiaW5kaW5nOiBXUklURV9CSU5ESU5HLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuXHRcdFx0XHRzdG9yYWdlVGV4dHVyZToge1xuXHRcdFx0XHRcdGFjY2VzczogXCJ3cml0ZS1vbmx5XCIsXG5cdFx0XHRcdFx0Zm9ybWF0OiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGJpbmRpbmc6IElOVEVSQUNUSU9OX0JJTkRJTkcsXG5cdFx0XHRcdHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG5cdFx0XHRcdGJ1ZmZlcjoge1xuXHRcdFx0XHRcdHR5cGU6IGludGVyYWN0aW9ucy50eXBlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcblxuXHRjb25zdCBiaW5kR3JvdXBzID0gWzAsIDFdLm1hcCgoaSkgPT5cblx0XHRkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcblx0XHRcdGxhYmVsOiBgQmluZCBHcm91cCA+ICR7dGV4dHVyZXMudGV4dHVyZXNbaV0ubGFiZWx9YCxcblx0XHRcdGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxuXHRcdFx0ZW50cmllczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmluZGluZzogUkVBRF9CSU5ESU5HLFxuXHRcdFx0XHRcdHJlc291cmNlOiB0ZXh0dXJlcy50ZXh0dXJlc1tpICUgMl0uY3JlYXRlVmlldygpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmluZGluZzogV1JJVEVfQklORElORyxcblx0XHRcdFx0XHRyZXNvdXJjZTogdGV4dHVyZXMudGV4dHVyZXNbKGkgKyAxKSAlIDJdLmNyZWF0ZVZpZXcoKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJpbmRpbmc6IElOVEVSQUNUSU9OX0JJTkRJTkcsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRcdGJ1ZmZlcjogaW50ZXJhY3Rpb25zLmJ1ZmZlcixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9KVxuXHQpO1xuXG5cdGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcblx0XHRsYWJlbDogXCJwaXBlbGluZUxheW91dFwiLFxuXHRcdGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdLFxuXHR9KTtcblxuXHQvLyBjb21waWxlIHNoYWRlcnNcblx0Y29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwiY29tcHV0ZVBpcGVsaW5lXCIsXG5cdFx0bGF5b3V0OiBwaXBlbGluZUxheW91dCxcblx0XHRjb21wdXRlOiB7XG5cdFx0XHRtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuXHRcdFx0XHRsYWJlbDogXCJ0aW1lc3RlcENvbXB1dGVTaGFkZXJcIixcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKHRpbWVzdGVwQ29tcHV0ZVNoYWRlciwge1xuXHRcdFx0XHRcdFdPUktHUk9VUF9TSVpFOiBXT1JLR1JPVVBfU0laRSxcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0UkVBRF9CSU5ESU5HOiBSRUFEX0JJTkRJTkcsXG5cdFx0XHRcdFx0V1JJVEVfQklORElORzogV1JJVEVfQklORElORyxcblx0XHRcdFx0XHRJTlRFUkFDVElPTl9CSU5ESU5HOiBJTlRFUkFDVElPTl9CSU5ESU5HLFxuXHRcdFx0XHRcdEZPUk1BVDogdGV4dHVyZXMuZm9ybWF0LnN0b3JhZ2UsXG5cdFx0XHRcdFx0V0lEVEg6IHRleHR1cmVzLnNpemUud2lkdGgsXG5cdFx0XHRcdFx0SEVJR0hUOiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBSRU5ERVJfSU5ERVggPSAwO1xuXHRjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG5cdFx0bGFiZWw6IFwicmVuZGVyUGlwZWxpbmVcIixcblx0XHRsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuXHRcdHZlcnRleDoge1xuXHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcblx0XHRcdFx0Y29kZTogc2V0VmFsdWVzKGNlbGxWZXJ0ZXhTaGFkZXIsIHtcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxhYmVsOiBcImNlbGxWZXJ0ZXhTaGFkZXJcIixcblx0XHRcdH0pLFxuXHRcdFx0YnVmZmVyczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXJyYXlTdHJpZGU6IHF1YWQuYXJyYXlTdHJpZGUsXG5cdFx0XHRcdFx0YXR0cmlidXRlczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmb3JtYXQ6IHF1YWQuZm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRcdFx0XHRcdHNoYWRlckxvY2F0aW9uOiBWRVJURVhfSU5ERVgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0ZnJhZ21lbnQ6IHtcblx0XHRcdG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG5cdFx0XHRcdGNvZGU6IHNldFZhbHVlcyhjZWxsRnJhZ21lbnRTaGFkZXIsIHtcblx0XHRcdFx0XHRHUk9VUF9JTkRFWDogR1JPVVBfSU5ERVgsXG5cdFx0XHRcdFx0Rk9STUFUOiB0ZXh0dXJlcy5mb3JtYXQuc3RvcmFnZSxcblx0XHRcdFx0XHRSRUFEX0JJTkRJTkc6IFJFQURfQklORElORyxcblx0XHRcdFx0XHRWRVJURVhfSU5ERVg6IFZFUlRFWF9JTkRFWCxcblx0XHRcdFx0XHRSRU5ERVJfSU5ERVg6IFJFTkRFUl9JTkRFWCxcblx0XHRcdFx0XHRXSURUSDogdGV4dHVyZXMuc2l6ZS53aWR0aCxcblx0XHRcdFx0XHRIRUlHSFQ6IHRleHR1cmVzLnNpemUuaGVpZ2h0LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bGFiZWw6IFwiY2VsbEZyYWdtZW50U2hhZGVyXCIsXG5cdFx0XHR9KSxcblx0XHRcdHRhcmdldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGZvcm1hdDogY2FudmFzLmZvcm1hdCxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0fSk7XG5cblx0Y29uc3QgY29sb3JBdHRhY2htZW50czogR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudFtdID0gW1xuXHRcdHtcblx0XHRcdHZpZXc6IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpLFxuXHRcdFx0bG9hZE9wOiBcImxvYWRcIixcblx0XHRcdHN0b3JlT3A6IFwic3RvcmVcIixcblx0XHR9LFxuXHRdO1xuXHRjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvciA9IHtcblx0XHRjb2xvckF0dGFjaG1lbnRzOiBjb2xvckF0dGFjaG1lbnRzLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHRjb25zdCBjb21tYW5kID0gZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cblx0XHQvLyBjb21wdXRlIHBhc3Ncblx0XHRjb25zdCBjb21wdXRlUGFzcyA9IGNvbW1hbmQuYmVnaW5Db21wdXRlUGFzcygpO1xuXG5cdFx0Y29tcHV0ZVBhc3Muc2V0UGlwZWxpbmUoY29tcHV0ZVBpcGVsaW5lKTtcblx0XHRjb21wdXRlUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cHNbZnJhbWVfaW5kZXggJSAyXSk7XG5cblx0XHRkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoXG5cdFx0XHRpbnRlcmFjdGlvbnMuYnVmZmVyLFxuXHRcdFx0LypvZmZzZXQ9Ki8gMCxcblx0XHRcdC8qZGF0YT0qLyBpbnRlcmFjdGlvbnMuZGF0YVxuXHRcdCk7XG5cblx0XHRjb21wdXRlUGFzcy5kaXNwYXRjaFdvcmtncm91cHMoLi4uV09SS0dST1VQX0NPVU5UKTtcblx0XHRjb21wdXRlUGFzcy5lbmQoKTtcblxuXHRcdGZyYW1lX2luZGV4Kys7XG5cblx0XHQvLyByZW5kZXIgcGFzc1xuXHRcdGNvbnN0IHRleHR1cmUgPSBjYW52YXMuY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuXHRcdGNvbnN0IHZpZXcgPSB0ZXh0dXJlLmNyZWF0ZVZpZXcoKTtcblxuXHRcdHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHNbUkVOREVSX0lOREVYXS52aWV3ID0gdmlldztcblx0XHRjb25zdCByZW5kZXJQYXNzID0gY29tbWFuZC5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuXG5cdFx0cmVuZGVyUGFzcy5zZXRQaXBlbGluZShyZW5kZXJQaXBlbGluZSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoR1JPVVBfSU5ERVgsIGJpbmRHcm91cHNbZnJhbWVfaW5kZXggJSAyXSk7XG5cdFx0cmVuZGVyUGFzcy5zZXRWZXJ0ZXhCdWZmZXIoVkVSVEVYX0lOREVYLCBxdWFkLnZlcnRleEJ1ZmZlcik7XG5cdFx0cmVuZGVyUGFzcy5kcmF3KHF1YWQudmVydGV4Q291bnQpO1xuXHRcdHJlbmRlclBhc3MuZW5kKCk7XG5cblx0XHQvLyBzdWJtaXQgdGhlIGNvbW1hbmQgYnVmZmVyXG5cdFx0ZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZC5maW5pc2goKV0pO1xuXHRcdHRleHR1cmUuZGVzdHJveSgpO1xuXHR9XG5cblx0c2V0SW50ZXJ2YWwocmVuZGVyLCBVUERBVEVfSU5URVJWQUwpO1xuXHRyZXR1cm47XG59XG5cbmluZGV4KCk7XG4iLCIvLyAvLyBDcmVhdGVzIGFuZCBtYW5hZ2UgbXVsdGktZGltZW5zaW9uYWwgYnVmZmVycyBieSBjcmVhdGluZyBhIGJ1ZmZlciBmb3IgZWFjaCBkaW1lbnNpb25cbi8vIGNsYXNzIER5bmFtaWNCdWZmZXIge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0ZGltcyA9IDEsIC8vIE51bWJlciBvZiBkaW1lbnNpb25zXG4vLyBcdFx0dyA9IHNldHRpbmdzLmdyaWRfdywgLy8gQnVmZmVyIHdpZHRoXG4vLyBcdFx0aCA9IHNldHRpbmdzLmdyaWRfaCwgLy8gQnVmZmVyIGhlaWdodFxuLy8gXHR9ID0ge30pIHtcbi8vIFx0XHR0aGlzLmRpbXMgPSBkaW1zO1xuLy8gXHRcdHRoaXMuYnVmZmVyU2l6ZSA9IHcgKiBoICogNDtcbi8vIFx0XHR0aGlzLncgPSB3O1xuLy8gXHRcdHRoaXMuaCA9IGg7XG4vLyBcdFx0dGhpcy5idWZmZXJzID0gbmV3IEFycmF5KGRpbXMpLmZpbGwoKS5tYXAoKF8pID0+XG4vLyBcdFx0XHRkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbi8vIFx0XHRcdFx0c2l6ZTogdGhpcy5idWZmZXJTaXplLFxuLy8gXHRcdFx0XHR1c2FnZTpcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHxcbi8vIFx0XHRcdFx0XHRHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyB8XG4vLyBcdFx0XHRcdFx0R1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KVxuLy8gXHRcdCk7XG4vLyBcdH1cblxuLy8gXHQvLyBDb3B5IGVhY2ggYnVmZmVyIHRvIGFub3RoZXIgRHluYW1pY0J1ZmZlcidzIGJ1ZmZlcnMuXG4vLyBcdC8vIElmIHRoZSBkaW1lbnNpb25zIGRvbid0IG1hdGNoLCB0aGUgbGFzdCBub24tZW1wdHkgZGltZW5zaW9uIHdpbGwgYmUgY29waWVkIGluc3RlYWRcbi8vIFx0Y29weVRvKGJ1ZmZlciwgY29tbWFuZEVuY29kZXIpIHtcbi8vIFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWF4KHRoaXMuZGltcywgYnVmZmVyLmRpbXMpOyBpKyspIHtcbi8vIFx0XHRcdGNvbW1hbmRFbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJzW01hdGgubWluKGksIHRoaXMuYnVmZmVycy5sZW5ndGggLSAxKV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdGJ1ZmZlci5idWZmZXJzW01hdGgubWluKGksIGJ1ZmZlci5idWZmZXJzLmxlbmd0aCAtIDEpXSxcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0dGhpcy5idWZmZXJTaXplXG4vLyBcdFx0XHQpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdC8vIFJlc2V0IGFsbCB0aGUgYnVmZmVyc1xuLy8gXHRjbGVhcihxdWV1ZSkge1xuLy8gXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kaW1zOyBpKyspIHtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcnNbaV0sXG4vLyBcdFx0XHRcdDAsXG4vLyBcdFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkodGhpcy53ICogdGhpcy5oKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHR9XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8gTWFuYWdlIHVuaWZvcm0gYnVmZmVycyByZWxhdGl2ZSB0byB0aGUgY29tcHV0ZSBzaGFkZXJzICYgdGhlIGd1aVxuLy8gY2xhc3MgVW5pZm9ybSB7XG4vLyBcdGNvbnN0cnVjdG9yKFxuLy8gXHRcdG5hbWUsXG4vLyBcdFx0e1xuLy8gXHRcdFx0c2l6ZSxcbi8vIFx0XHRcdHZhbHVlLFxuLy8gXHRcdFx0bWluLFxuLy8gXHRcdFx0bWF4LFxuLy8gXHRcdFx0c3RlcCxcbi8vIFx0XHRcdG9uQ2hhbmdlLFxuLy8gXHRcdFx0ZGlzcGxheU5hbWUsXG4vLyBcdFx0XHRhZGRUb0dVSSA9IHRydWUsXG4vLyBcdFx0fSA9IHt9XG4vLyBcdCkge1xuLy8gXHRcdHRoaXMubmFtZSA9IG5hbWU7XG4vLyBcdFx0dGhpcy5zaXplID0gc2l6ZSA/PyAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUubGVuZ3RoIDogMSk7XG4vLyBcdFx0dGhpcy5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSkge1xuLy8gXHRcdFx0aWYgKHNldHRpbmdzW25hbWVdID09IG51bGwpIHtcbi8vIFx0XHRcdFx0c2V0dGluZ3NbbmFtZV0gPSB2YWx1ZSA/PyAwO1xuLy8gXHRcdFx0XHR0aGlzLmFsd2F5c1VwZGF0ZSA9IHRydWU7XG4vLyBcdFx0XHR9IGVsc2UgaWYgKGFkZFRvR1VJKSB7XG4vLyBcdFx0XHRcdGd1aS5hZGQoc2V0dGluZ3MsIG5hbWUsIG1pbiwgbWF4LCBzdGVwKVxuLy8gXHRcdFx0XHRcdC5vbkNoYW5nZSgodikgPT4ge1xuLy8gXHRcdFx0XHRcdFx0aWYgKG9uQ2hhbmdlKSBvbkNoYW5nZSh2KTtcbi8vIFx0XHRcdFx0XHRcdHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuLy8gXHRcdFx0XHRcdH0pXG4vLyBcdFx0XHRcdFx0Lm5hbWUoZGlzcGxheU5hbWUgPz8gbmFtZSk7XG4vLyBcdFx0XHR9XG4vLyBcdFx0fVxuXG4vLyBcdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMSB8fCB2YWx1ZSAhPSBudWxsKSB7XG4vLyBcdFx0XHR0aGlzLmJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuLy8gXHRcdFx0XHRtYXBwZWRBdENyZWF0aW9uOiB0cnVlLFxuLy8gXHRcdFx0XHRzaXplOiB0aGlzLnNpemUgKiA0LFxuLy8gXHRcdFx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuLy8gXHRcdFx0fSk7XG5cbi8vIFx0XHRcdGNvbnN0IGFycmF5QnVmZmVyID0gdGhpcy5idWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKTtcbi8vIFx0XHRcdG5ldyBGbG9hdDMyQXJyYXkoYXJyYXlCdWZmZXIpLnNldChcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbc2V0dGluZ3NbbmFtZV1dKVxuLy8gXHRcdFx0KTtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyLnVubWFwKCk7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdHRoaXMuYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4vLyBcdFx0XHRcdHNpemU6IHRoaXMuc2l6ZSAqIDQsXG4vLyBcdFx0XHRcdHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4vLyBcdFx0XHR9KTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRnbG9iYWxVbmlmb3Jtc1tuYW1lXSA9IHRoaXM7XG4vLyBcdH1cblxuLy8gXHRzZXRWYWx1ZSh2YWx1ZSkge1xuLy8gXHRcdHNldHRpbmdzW3RoaXMubmFtZV0gPSB2YWx1ZTtcbi8vIFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbi8vIFx0fVxuXG4vLyBcdC8vIFVwZGF0ZSB0aGUgR1BVIGJ1ZmZlciBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWRcbi8vIFx0dXBkYXRlKHF1ZXVlLCB2YWx1ZSkge1xuLy8gXHRcdGlmICh0aGlzLm5lZWRzVXBkYXRlIHx8IHRoaXMuYWx3YXlzVXBkYXRlIHx8IHZhbHVlICE9IG51bGwpIHtcbi8vIFx0XHRcdGlmICh0eXBlb2YgdGhpcy5uZWVkc1VwZGF0ZSAhPT0gXCJib29sZWFuXCIpIHZhbHVlID0gdGhpcy5uZWVkc1VwZGF0ZTtcbi8vIFx0XHRcdHF1ZXVlLndyaXRlQnVmZmVyKFxuLy8gXHRcdFx0XHR0aGlzLmJ1ZmZlcixcbi8vIFx0XHRcdFx0MCxcbi8vIFx0XHRcdFx0bmV3IEZsb2F0MzJBcnJheSh2YWx1ZSA/PyBbcGFyc2VGbG9hdChzZXR0aW5nc1t0aGlzLm5hbWVdKV0pLFxuLy8gXHRcdFx0XHQwLFxuLy8gXHRcdFx0XHR0aGlzLnNpemVcbi8vIFx0XHRcdCk7XG4vLyBcdFx0XHR0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyB9XG5cbi8vIC8vIE9uIGZpcnN0IGNsaWNrOiBzdGFydCByZWNvcmRpbmcgdGhlIG1vdXNlIHBvc2l0aW9uIGF0IGVhY2ggZnJhbWVcbi8vIC8vIE9uIHNlY29uZCBjbGljazogcmVzZXQgdGhlIGNhbnZhcywgc3RhcnQgcmVjb3JkaW5nIHRoZSBjYW52YXMsXG4vLyAvLyBvdmVycmlkZSB0aGUgbW91c2UgcG9zaXRpb24gd2l0aCB0aGUgcHJldmlvdXNseSByZWNvcmRlZCB2YWx1ZXNcbi8vIC8vIGFuZCBmaW5hbGx5IGRvd25sb2FkcyBhIC53ZWJtIDYwZnBzIGZpbGVcbi8vIGNsYXNzIFJlY29yZGVyIHtcbi8vIFx0Y29uc3RydWN0b3IocmVzZXRTaW11bGF0aW9uKSB7XG4vLyBcdFx0dGhpcy5tb3VzZURhdGEgPSBbXTtcblxuLy8gXHRcdHRoaXMuY2FwdHVyZXIgPSBuZXcgQ0NhcHR1cmUoe1xuLy8gXHRcdFx0Zm9ybWF0OiBcIndlYm1cIixcbi8vIFx0XHRcdGZyYW1lcmF0ZTogNjAsXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gZmFsc2U7XG5cbi8vIFx0XHQvLyBSZWNvcmRlciBpcyBkaXNhYmxlZCB1bnRpbCBJIG1ha2UgYSB0b29sdGlwIGV4cGxhaW5pbmcgaG93IGl0IHdvcmtzXG4vLyBcdFx0Ly8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuLy8gXHRcdC8vICAgICBpZiAodGhpcy5pc1JlY29yZGluZykgdGhpcy5zdG9wKClcbi8vIFx0XHQvLyAgICAgZWxzZSB0aGlzLnN0YXJ0KClcbi8vIFx0XHQvLyB9KVxuXG4vLyBcdFx0dGhpcy5yZXNldFNpbXVsYXRpb24gPSByZXNldFNpbXVsYXRpb247XG4vLyBcdH1cblxuLy8gXHRzdGFydCgpIHtcbi8vIFx0XHRpZiAodGhpcy5pc1JlY29yZGluZyAhPT0gXCJtb3VzZVwiKSB7XG4vLyBcdFx0XHQvLyBTdGFydCByZWNvcmRpbmcgbW91c2UgcG9zaXRpb25cbi8vIFx0XHRcdHRoaXMuaXNSZWNvcmRpbmcgPSBcIm1vdXNlXCI7XG4vLyBcdFx0fSBlbHNlIHtcbi8vIFx0XHRcdC8vIFN0YXJ0IHJlY29yZGluZyB0aGUgY2FudmFzXG4vLyBcdFx0XHR0aGlzLmlzUmVjb3JkaW5nID0gXCJmcmFtZXNcIjtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc3RhcnQoKTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRjb25zb2xlLmxvZyhcInN0YXJ0XCIsIHRoaXMuaXNSZWNvcmRpbmcpO1xuLy8gXHR9XG5cbi8vIFx0dXBkYXRlKCkge1xuLy8gXHRcdGlmICh0aGlzLmlzUmVjb3JkaW5nID09PSBcIm1vdXNlXCIpIHtcbi8vIFx0XHRcdC8vIFJlY29yZCBjdXJyZW50IGZyYW1lJ3MgbW91c2UgZGF0YVxuLy8gXHRcdFx0aWYgKG1vdXNlSW5mb3MuY3VycmVudClcbi8vIFx0XHRcdFx0dGhpcy5tb3VzZURhdGEucHVzaChbXG4vLyBcdFx0XHRcdFx0Li4ubW91c2VJbmZvcy5jdXJyZW50LFxuLy8gXHRcdFx0XHRcdC4uLm1vdXNlSW5mb3MudmVsb2NpdHksXG4vLyBcdFx0XHRcdF0pO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gUmVjb3JkIGN1cnJlbnQgZnJhbWUncyBjYW52YXNcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuY2FwdHVyZShjYW52YXMpO1xuLy8gXHRcdH1cbi8vIFx0fVxuXG4vLyBcdHN0b3AoKSB7XG4vLyBcdFx0aWYgKHRoaXMuaXNSZWNvcmRpbmcgPT09IFwibW91c2VcIikge1xuLy8gXHRcdFx0Ly8gUmVzZXQgdGhlIHNpbXVsYXRpb24gYW5kIHN0YXJ0IHRoZSBjYW52YXMgcmVjb3JkXG4vLyBcdFx0XHR0aGlzLnJlc2V0U2ltdWxhdGlvbigpO1xuLy8gXHRcdFx0dGhpcy5zdGFydCgpO1xuLy8gXHRcdH0gZWxzZSBpZiAodGhpcy5pc1JlY29yZGluZyA9PT0gXCJmcmFtZXNcIikge1xuLy8gXHRcdFx0Ly8gU3RvcCB0aGUgcmVjb3JkaW5nIGFuZCBzYXZlIHRoZSB2aWRlbyBmaWxlXG4vLyBcdFx0XHR0aGlzLmNhcHR1cmVyLnN0b3AoKTtcbi8vIFx0XHRcdHRoaXMuY2FwdHVyZXIuc2F2ZSgpO1xuLy8gXHRcdFx0dGhpcy5pc1JlY29yZGluZyA9IGZhbHNlO1xuLy8gXHRcdH1cbi8vIFx0fVxuLy8gfVxuXG4vLyAvLyBDcmVhdGVzIGEgc2hhZGVyIG1vZHVsZSwgY29tcHV0ZSBwaXBlbGluZSAmIGJpbmQgZ3JvdXAgdG8gdXNlIHdpdGggdGhlIEdQVVxuLy8gY2xhc3MgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRidWZmZXJzID0gW10sIC8vIFN0b3JhZ2UgYnVmZmVyc1xuLy8gXHRcdHVuaWZvcm1zID0gW10sIC8vIFVuaWZvcm0gYnVmZmVyc1xuLy8gXHRcdHNoYWRlciwgLy8gV0dTTCBDb21wdXRlIFNoYWRlciBhcyBhIHN0cmluZ1xuLy8gXHRcdGRpc3BhdGNoWCA9IHNldHRpbmdzLmdyaWRfdywgLy8gRGlzcGF0Y2ggd29ya2VycyB3aWR0aFxuLy8gXHRcdGRpc3BhdGNoWSA9IHNldHRpbmdzLmdyaWRfaCwgLy8gRGlzcGF0Y2ggd29ya2VycyBoZWlnaHRcbi8vIFx0fSkge1xuLy8gXHRcdC8vIENyZWF0ZSB0aGUgc2hhZGVyIG1vZHVsZSB1c2luZyB0aGUgV0dTTCBzdHJpbmcgYW5kIHVzZSBpdFxuLy8gXHRcdC8vIHRvIGNyZWF0ZSBhIGNvbXB1dGUgcGlwZWxpbmUgd2l0aCAnYXV0bycgYmluZGluZyBsYXlvdXRcbi8vIFx0XHR0aGlzLmNvbXB1dGVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuLy8gXHRcdFx0bGF5b3V0OiBcImF1dG9cIixcbi8vIFx0XHRcdGNvbXB1dGU6IHtcbi8vIFx0XHRcdFx0bW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHsgY29kZTogc2hhZGVyIH0pLFxuLy8gXHRcdFx0XHRlbnRyeVBvaW50OiBcIm1haW5cIixcbi8vIFx0XHRcdH0sXG4vLyBcdFx0fSk7XG5cbi8vIFx0XHQvLyBDb25jYXQgdGhlIGJ1ZmZlciAmIHVuaWZvcm1zIGFuZCBmb3JtYXQgdGhlIGVudHJpZXMgdG8gdGhlIHJpZ2h0IFdlYkdQVSBmb3JtYXRcbi8vIFx0XHRsZXQgZW50cmllcyA9IGJ1ZmZlcnNcbi8vIFx0XHRcdC5tYXAoKGIpID0+IGIuYnVmZmVycylcbi8vIFx0XHRcdC5mbGF0KClcbi8vIFx0XHRcdC5tYXAoKGJ1ZmZlcikgPT4gKHsgYnVmZmVyIH0pKTtcbi8vIFx0XHRlbnRyaWVzLnB1c2goLi4udW5pZm9ybXMubWFwKCh7IGJ1ZmZlciB9KSA9PiAoeyBidWZmZXIgfSkpKTtcbi8vIFx0XHRlbnRyaWVzID0gZW50cmllcy5tYXAoKGUsIGkpID0+ICh7XG4vLyBcdFx0XHRiaW5kaW5nOiBpLFxuLy8gXHRcdFx0cmVzb3VyY2U6IGUsXG4vLyBcdFx0fSkpO1xuXG4vLyBcdFx0Ly8gQ3JlYXRlIHRoZSBiaW5kIGdyb3VwIHVzaW5nIHRoZXNlIGVudHJpZXMgJiBhdXRvLWxheW91dCBkZXRlY3Rpb25cbi8vIFx0XHR0aGlzLmJpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuLy8gXHRcdFx0bGF5b3V0OiB0aGlzLmNvbXB1dGVQaXBlbGluZS5nZXRCaW5kR3JvdXBMYXlvdXQoMCAvKiBpbmRleCAqLyksXG4vLyBcdFx0XHRlbnRyaWVzOiBlbnRyaWVzLFxuLy8gXHRcdH0pO1xuXG4vLyBcdFx0dGhpcy5kaXNwYXRjaFggPSBkaXNwYXRjaFg7XG4vLyBcdFx0dGhpcy5kaXNwYXRjaFkgPSBkaXNwYXRjaFk7XG4vLyBcdH1cblxuLy8gXHQvLyBEaXNwYXRjaCB0aGUgY29tcHV0ZSBwaXBlbGluZSB0byB0aGUgR1BVXG4vLyBcdGRpc3BhdGNoKHBhc3NFbmNvZGVyKSB7XG4vLyBcdFx0cGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy5jb21wdXRlUGlwZWxpbmUpO1xuLy8gXHRcdHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCB0aGlzLmJpbmRHcm91cCk7XG4vLyBcdFx0cGFzc0VuY29kZXIuZGlzcGF0Y2hXb3JrZ3JvdXBzKFxuLy8gXHRcdFx0TWF0aC5jZWlsKHRoaXMuZGlzcGF0Y2hYIC8gOCksXG4vLyBcdFx0XHRNYXRoLmNlaWwodGhpcy5kaXNwYXRjaFkgLyA4KVxuLy8gXHRcdCk7XG4vLyBcdH1cbi8vIH1cblxuLy8gLy8vIFVzZWZ1bCBjbGFzc2VzIGZvciBjbGVhbmVyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIGlucHV0IGFuZCBvdXRwdXQgYnVmZmVyc1xuLy8gLy8vIHVzZWQgaW4gdGhlIGRlY2xhcmF0aW9ucyBvZiBwcm9ncmFtcyAmIGZsdWlkIHNpbXVsYXRpb24gc3RlcHNcblxuLy8gY2xhc3MgQWR2ZWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcXVhbnRpdHksXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3F1YW50aXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGFkdmVjdFNoYWRlcixcbi8vIFx0XHQuLi5wcm9wc1xuLy8gXHR9KSB7XG4vLyBcdFx0dW5pZm9ybXMgPz89IFtnbG9iYWxVbmlmb3Jtcy5ncmlkU2l6ZV07XG4vLyBcdFx0c3VwZXIoe1xuLy8gXHRcdFx0YnVmZmVyczogW2luX3F1YW50aXR5LCBpbl92ZWxvY2l0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgRGl2ZXJnZW5jZVByb2dyYW0gZXh0ZW5kcyBQcm9ncmFtIHtcbi8vIFx0Y29uc3RydWN0b3Ioe1xuLy8gXHRcdGluX3ZlbG9jaXR5LFxuLy8gXHRcdG91dF9kaXZlcmdlbmNlLFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGRpdmVyZ2VuY2VTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X2RpdmVyZ2VuY2VdLCB1bmlmb3Jtcywgc2hhZGVyIH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFByZXNzdXJlUHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fZGl2ZXJnZW5jZSxcbi8vIFx0XHRvdXRfcHJlc3N1cmUsXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gcHJlc3N1cmVTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX2RpdmVyZ2VuY2UsIG91dF9wcmVzc3VyZV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBHcmFkaWVudFN1YnRyYWN0UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fcHJlc3N1cmUsXG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IGdyYWRpZW50U3VidHJhY3RTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7XG4vLyBcdFx0XHRidWZmZXJzOiBbaW5fcHJlc3N1cmUsIGluX3ZlbG9jaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgQm91bmRhcnlQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gYm91bmRhcnlTaGFkZXIsXG4vLyBcdH0pIHtcbi8vIFx0XHR1bmlmb3JtcyA/Pz0gW2dsb2JhbFVuaWZvcm1zLmdyaWRTaXplXTtcbi8vIFx0XHRzdXBlcih7IGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSwgdW5pZm9ybXMsIHNoYWRlciB9KTtcbi8vIFx0fVxuLy8gfVxuXG4vLyBjbGFzcyBVcGRhdGVQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl9xdWFudGl0eSxcbi8vIFx0XHRvdXRfcXVhbnRpdHksXG4vLyBcdFx0dW5pZm9ybXMsXG4vLyBcdFx0c2hhZGVyID0gdXBkYXRlVmVsb2NpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl9xdWFudGl0eSwgb3V0X3F1YW50aXR5XSxcbi8vIFx0XHRcdHVuaWZvcm1zLFxuLy8gXHRcdFx0c2hhZGVyLFxuLy8gXHRcdFx0Li4ucHJvcHMsXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH1cblxuLy8gY2xhc3MgVm9ydGljaXR5UHJvZ3JhbSBleHRlbmRzIFByb2dyYW0ge1xuLy8gXHRjb25zdHJ1Y3Rvcih7XG4vLyBcdFx0aW5fdmVsb2NpdHksXG4vLyBcdFx0b3V0X3ZvcnRpY2l0eSxcbi8vIFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRzaGFkZXIgPSB2b3J0aWNpdHlTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgb3V0X3ZvcnRpY2l0eV0sXG4vLyBcdFx0XHR1bmlmb3Jtcyxcbi8vIFx0XHRcdHNoYWRlcixcbi8vIFx0XHRcdC4uLnByb3BzLFxuLy8gXHRcdH0pO1xuLy8gXHR9XG4vLyB9XG5cbi8vIGNsYXNzIFZvcnRpY2l0eUNvbmZpbm1lbnRQcm9ncmFtIGV4dGVuZHMgUHJvZ3JhbSB7XG4vLyBcdGNvbnN0cnVjdG9yKHtcbi8vIFx0XHRpbl92ZWxvY2l0eSxcbi8vIFx0XHRpbl92b3J0aWNpdHksXG4vLyBcdFx0b3V0X3ZlbG9jaXR5LFxuLy8gXHRcdHVuaWZvcm1zLFxuLy8gXHRcdHNoYWRlciA9IHZvcnRpY2l0eUNvbmZpbm1lbnRTaGFkZXIsXG4vLyBcdFx0Li4ucHJvcHNcbi8vIFx0fSkge1xuLy8gXHRcdHVuaWZvcm1zID8/PSBbZ2xvYmFsVW5pZm9ybXMuZ3JpZFNpemVdO1xuLy8gXHRcdHN1cGVyKHtcbi8vIFx0XHRcdGJ1ZmZlcnM6IFtpbl92ZWxvY2l0eSwgaW5fdm9ydGljaXR5LCBvdXRfdmVsb2NpdHldLFxuLy8gXHRcdFx0dW5pZm9ybXMsXG4vLyBcdFx0XHRzaGFkZXIsXG4vLyBcdFx0XHQuLi5wcm9wcyxcbi8vIFx0XHR9KTtcbi8vIFx0fVxuLy8gfVxuXG5mdW5jdGlvbiB0aHJvd0RldGVjdGlvbkVycm9yKGVycm9yOiBzdHJpbmcpOiBuZXZlciB7XG5cdChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLndlYmdwdS1ub3Qtc3VwcG9ydGVkXCIpIGFzIEhUTUxFbGVtZW50XG5cdCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBXZWJHUFU6IFwiICsgZXJyb3IpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0RGV2aWNlKFxuXHRvcHRpb25zOiBHUFVSZXF1ZXN0QWRhcHRlck9wdGlvbnMgPSB7IHBvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCIgfSxcblx0cmVxdWlyZWRGZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtcImZsb2F0MzItZmlsdGVyYWJsZVwiXVxuKTogUHJvbWlzZTxHUFVEZXZpY2U+IHtcblx0aWYgKCFuYXZpZ2F0b3IuZ3B1KSB0aHJvd0RldGVjdGlvbkVycm9yKFwiV2ViR1BVIE5PVCBTdXBwb3J0ZWRcIik7XG5cblx0Y29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIob3B0aW9ucyk7XG5cdGlmICghYWRhcHRlcikgdGhyb3dEZXRlY3Rpb25FcnJvcihcIk5vIEdQVSBhZGFwdGVyIGZvdW5kXCIpO1xuXG5cdHJldHVybiBhZGFwdGVyLnJlcXVlc3REZXZpY2UoeyByZXF1aXJlZEZlYXR1cmVzOiByZXF1aXJlZEZlYXR1cmVzIH0pO1xufVxuXG5mdW5jdGlvbiBjb25maWd1cmVDYW52YXMoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRzaXplID0geyB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IH1cbik6IHtcblx0Y29udGV4dDogR1BVQ2FudmFzQ29udGV4dDtcblx0Zm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgY2FudmFzID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLCBzaXplKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG5cdGNvbnN0IGNvbnRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiY2FudmFzXCIpIS5nZXRDb250ZXh0KFwid2ViZ3B1XCIpO1xuXHRpZiAoIWNvbnRleHQpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJDYW52YXMgZG9lcyBub3Qgc3VwcG9ydCBXZWJHUFVcIik7XG5cblx0Y29uc3QgZm9ybWF0ID0gbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKTtcblx0Y29udGV4dC5jb25maWd1cmUoe1xuXHRcdGRldmljZTogZGV2aWNlLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG5cdFx0YWxwaGFNb2RlOiBcInByZW11bHRpcGxpZWRcIixcblx0fSk7XG5cblx0cmV0dXJuIHsgY29udGV4dDogY29udGV4dCwgZm9ybWF0OiBmb3JtYXQsIHNpemU6IHNpemUgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBWZXJ0ZXhCdWZmZXIoXG5cdGRldmljZTogR1BVRGV2aWNlLFxuXHRsYWJlbDogc3RyaW5nLFxuXHRkYXRhOiBudW1iZXJbXVxuKToge1xuXHR2ZXJ0ZXhCdWZmZXI6IEdQVUJ1ZmZlcjtcblx0dmVydGV4Q291bnQ6IG51bWJlcjtcblx0YXJyYXlTdHJpZGU6IG51bWJlcjtcblx0Zm9ybWF0OiBHUFVWZXJ0ZXhGb3JtYXQ7XG59IHtcblx0Y29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXHRjb25zdCB2ZXJ0ZXhCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcblx0XHRsYWJlbDogbGFiZWwsXG5cdFx0c2l6ZTogYXJyYXkuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVkVSVEVYIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG5cdH0pO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcblx0XHR2ZXJ0ZXhCdWZmZXIsXG5cdFx0LypidWZmZXJPZmZzZXQ9Ki8gMCxcblx0XHQvKmRhdGE9Ki8gYXJyYXlcblx0KTtcblx0cmV0dXJuIHtcblx0XHR2ZXJ0ZXhCdWZmZXI6IHZlcnRleEJ1ZmZlcixcblx0XHR2ZXJ0ZXhDb3VudDogYXJyYXkubGVuZ3RoIC8gMixcblx0XHRhcnJheVN0cmlkZTogMiAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5ULFxuXHRcdGZvcm1hdDogXCJmbG9hdDMyeDJcIixcblx0fTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUZXh0dXJlcyhcblx0ZGV2aWNlOiBHUFVEZXZpY2UsXG5cdHNpemU6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSxcblx0Zm9ybWF0OiB7XG5cdFx0c2FtcGxlVHlwZTogR1BVVGV4dHVyZVNhbXBsZVR5cGU7XG5cdFx0c3RvcmFnZTogR1BVVGV4dHVyZUZvcm1hdDtcblx0XHR0ZXh0dXJlOiBzdHJpbmc7XG5cdH0gPSB7XG5cdFx0c2FtcGxlVHlwZTogXCJmbG9hdFwiLFxuXHRcdHN0b3JhZ2U6IFwicmdiYTMyZmxvYXRcIixcblx0XHR0ZXh0dXJlOiBcImYzMlwiLFxuXHR9XG4pOiB7XG5cdHRleHR1cmVzOiBHUFVUZXh0dXJlW107XG5cdGZvcm1hdDoge1xuXHRcdHNhbXBsZVR5cGU6IEdQVVRleHR1cmVTYW1wbGVUeXBlO1xuXHRcdHN0b3JhZ2U6IEdQVVRleHR1cmVGb3JtYXQ7XG5cdFx0dGV4dHVyZTogc3RyaW5nO1xuXHR9O1xuXHRzaXplOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59IHtcblx0Y29uc3QgdGV4dHVyZURhdGEgPSBuZXcgQXJyYXkoc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0KTtcblx0Y29uc3QgQ0hBTk5FTFMgPSBjaGFubmVsQ291bnQoZm9ybWF0LnN0b3JhZ2UpO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZS53aWR0aCAqIHNpemUuaGVpZ2h0OyBpKyspIHtcblx0XHR0ZXh0dXJlRGF0YVtpXSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBDSEFOTkVMUzsgaisrKSB7XG5cdFx0XHR0ZXh0dXJlRGF0YVtpXS5wdXNoKE1hdGgucmFuZG9tKCkgPiAxID8gMSA6IDApO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHN0YXRlVGV4dHVyZXMgPSBbXCJBXCIsIFwiQlwiXS5tYXAoKGxhYmVsKSA9PlxuXHRcdGRldmljZS5jcmVhdGVUZXh0dXJlKHtcblx0XHRcdGxhYmVsOiBgU3RhdGUgVGV4dHVyZSAke2xhYmVsfWAsXG5cdFx0XHRzaXplOiBbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdLFxuXHRcdFx0Zm9ybWF0OiBmb3JtYXQuc3RvcmFnZSxcblx0XHRcdHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuXHRcdH0pXG5cdCk7XG5cblx0Y29uc3QgdGV4dHVyZSA9IHN0YXRlVGV4dHVyZXNbMF07XG5cdGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlRGF0YS5mbGF0KCkpO1xuXG5cdGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG5cdFx0eyB0ZXh0dXJlIH0sXG5cdFx0LypkYXRhPSovIGFycmF5LFxuXHRcdC8qZGF0YUxheW91dD0qLyB7XG5cdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHRieXRlc1BlclJvdzogc2l6ZS53aWR0aCAqIGFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogQ0hBTk5FTFMsXG5cdFx0XHRyb3dzUGVySW1hZ2U6IHNpemUuaGVpZ2h0LFxuXHRcdH0sXG5cdFx0LypzaXplPSovIHNpemVcblx0KTtcblxuXHRyZXR1cm4ge1xuXHRcdHRleHR1cmVzOiBzdGF0ZVRleHR1cmVzLFxuXHRcdGZvcm1hdDogZm9ybWF0LFxuXHRcdHNpemU6IHNpemUsXG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldHVwSW50ZXJhY3Rpb25zKFxuXHRkZXZpY2U6IEdQVURldmljZSxcblx0Y2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IE9mZnNjcmVlbkNhbnZhcyxcblx0dGV4dHVyZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxuXHRzaXplOiBudW1iZXIgPSAxMDAwXG4pOiB7XG5cdGJ1ZmZlcjogR1BVQnVmZmVyO1xuXHRkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcblx0dHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcblx0bGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuXHR2YXIgc2lnbiA9IDE7XG5cblx0bGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG5cdGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG5cdGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBOYU4sIE5hTl0pO1xuXHRpZiAoY2FudmFzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcblx0XHQvLyBkaXNhYmxlIGNvbnRleHQgbWVudVxuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSBldmVudHNcblx0XHRbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaG1vdmVcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uLnggPSBldmVudC5vZmZzZXRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQub2Zmc2V0WTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi54ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbi55ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgeCA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRsZXQgeSA9IE1hdGguZmxvb3IoXG5cdFx0XHRcdFx0XHQocG9zaXRpb24ueSAvIGNhbnZhcy5oZWlnaHQpICogdGV4dHVyZS5oZWlnaHRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0ZGF0YS5zZXQoW3gsIHldKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHQvLyB6b29tIGV2ZW50cyBUT0RPKEBnc3plcCkgYWRkIHBpbmNoIGFuZCBzY3JvbGwgZm9yIHRvdWNoIGRldmljZXNcblx0XHRbXCJ3aGVlbFwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG5cdFx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0KGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0c3dpdGNoICh0cnVlKSB7XG5cdFx0XHRcdFx0XHRjYXNlIGV2ZW50IGluc3RhbmNlb2YgV2hlZWxFdmVudDpcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueCA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0dmVsb2NpdHkueSA9IGV2ZW50LmRlbHRhWTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2l6ZSArPSB2ZWxvY2l0eS55O1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaXplXSwgMik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHsgcGFzc2l2ZTogdHJ1ZSB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY2xpY2sgZXZlbnRzIFRPRE8oQGdzemVwKSBpbXBsZW1lbnQgcmlnaHQgY2xpY2sgZXF1aXZhbGVudCBmb3IgdG91Y2ggZGV2aWNlc1xuXHRcdFtcIm1vdXNlZG93blwiLCBcInRvdWNoc3RhcnRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdHN3aXRjaCAodHJ1ZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSAxIC0gZXZlbnQuYnV0dG9uO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0Y2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG5cdFx0XHRcdFx0XHRcdHNpZ24gPSBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEgPyAtMSA6IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRhdGEuc2V0KFtzaWduICogc2l6ZV0sIDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7IHBhc3NpdmU6IHRydWUgfVxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRbXCJtb3VzZXVwXCIsIFwidG91Y2hlbmRcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuXHRcdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdChldmVudCkgPT4ge1xuXHRcdFx0XHRcdGRhdGEuc2V0KFtOYU5dLCAyKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eyBwYXNzaXZlOiB0cnVlIH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgdW5pZm9ybUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuXHRcdGxhYmVsOiBcIkludGVyYWN0aW9uIEJ1ZmZlclwiLFxuXHRcdHNpemU6IGRhdGEuYnl0ZUxlbmd0aCxcblx0XHR1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcblx0XHRkYXRhOiBkYXRhLFxuXHRcdHR5cGU6IFwidW5pZm9ybVwiLFxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGFubmVsQ291bnQoZm9ybWF0OiBHUFVUZXh0dXJlRm9ybWF0KTogbnVtYmVyIHtcblx0aWYgKGZvcm1hdC5pbmNsdWRlcyhcInJnYmFcIikpIHtcblx0XHRyZXR1cm4gNDtcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ2JcIikpIHtcblx0XHRyZXR1cm4gMztcblx0fSBlbHNlIGlmIChmb3JtYXQuaW5jbHVkZXMoXCJyZ1wiKSkge1xuXHRcdHJldHVybiAyO1xuXHR9IGVsc2UgaWYgKGZvcm1hdC5pbmNsdWRlcyhcInJcIikpIHtcblx0XHRyZXR1cm4gMTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdDogXCIgKyBmb3JtYXQpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlcyhjb2RlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG5cdGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAoT2JqZWN0LmtleXModmFyaWFibGVzKS5qb2luKFwifFwiKSwgXCJnXCIpO1xuXHRyZXR1cm4gY29kZS5yZXBsYWNlKHJlZywgKGspID0+IHZhcmlhYmxlc1trXS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IHtcblx0cmVxdWVzdERldmljZSxcblx0Y29uZmlndXJlQ2FudmFzLFxuXHRzZXR1cFZlcnRleEJ1ZmZlcixcblx0c2V0dXBUZXh0dXJlcyxcblx0c2V0dXBJbnRlcmFjdGlvbnMsXG5cdHNldFZhbHVlcyxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
