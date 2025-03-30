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

@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;

fn get_velocity(x: vec2<i32>) -> vec4<f32> {
    let u = textureLoad(velocity, x, 0).r;
    let v = textureLoad(velocity, x, 1).r;

    let angle = atan2(u, v);
    let norm = length(vec2<f32>(u, v));

    // rainbow along the angle
    return vec4<f32>(
        0.5 + 0.5 * cos(angle + 0.0),
        0.5 + 0.5 * cos(angle + 2.094),
        0.5 + 0.5 * cos(angle + 4.188),
        100.0 * norm
    );
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    var eta = vec2<f32>(0.0, 0.0);
    eta.x = textureLoad(map, x, 0).r;
    eta.y = textureLoad(map, x, 1).r;

    eta /= vec2<f32>(canvas.size);
    output.color = get_velocity(x);

    return output;
}