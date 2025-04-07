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

const EPS = 1e-37;
const lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));

@group(GROUP_INDEX) @binding(DISTRIBUTION) var distribution: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;

fn get_velocity(x: vec2<i32>) -> vec4<f32> {

    var density = 0.0;
    var momentum = vec2<f32>(0.0, 0.0);

    for (var i = 0; i < 9; i++) {
        let f = textureLoad(distribution, x, i).r;

        density += f;
        momentum += f * vec2<f32>(lattice_vector[i]);
    }

    let velocity = momentum / max(density, EPS);

    let angle = atan2(velocity.x, velocity.y);
    let norm = length(velocity);

    // rainbow along the angle
    return vec4<f32>(
        0.5 + 0.5 * cos(angle + 0.0),
        0.5 + 0.5 * cos(angle + 2.094),
        0.5 + 0.5 * cos(angle + 4.188),
        100.0 * norm
    );
}

fn get_reference_map(x: vec2<i32>) -> vec2<f32> {
    return vec2<f32>(textureLoad(map, x, 0).r, textureLoad(map, x, 1).r);
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    let reference_map = get_reference_map(x)/ vec2<f32>(canvas.size);

    output.color.r = reference_map.x;
    output.color.g = reference_map.y;
    
    output.color.a = 1.0;
    return output;
} 