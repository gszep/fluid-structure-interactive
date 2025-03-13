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

@group(GROUP_INDEX) @binding(DENSITY) var density: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    // density map
    output.color.r = textureLoad(density, x).r;
    output.color.g = textureLoad(velocity, x, 0).r;
    output.color.b = textureLoad(velocity, x, 1).r;

    output.color.a = 1.0;
    return output;
}