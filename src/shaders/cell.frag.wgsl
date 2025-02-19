#import includes::bindings

struct Input {
    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
  };

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

struct Canvas {
    size: vec2<u32>,
};

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    // vorticity map
    let omega = textureLoad(omega, x);
    output.color.g = 5.0 * max(0.0, omega.r);
    output.color.r = 5.0 * max(0.0, -omega.r);

    // stream function map
    let phi = textureLoad(phi, x);
    // output.color.b = abs(phi.r);

    // debug map
    // let debug = textureLoad(debug, x);
    output.color.a = 1.0;
    return output;
}