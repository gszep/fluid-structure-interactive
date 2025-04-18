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
@group(GROUP_INDEX) @binding(DEFORMATION) var deformation: texture_storage_2d_array<r32float, read_write>;
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

fn get_deformation_gradient(x: vec2<i32>) -> vec4<f32> {
    return vec4<f32>(textureLoad(deformation, x, 0).r, textureLoad(deformation, x, 1).r, textureLoad(deformation, x, 2).r, textureLoad(deformation, x, 3).r);
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    let F = get_deformation_gradient(x);
    let det = F[0] * F[3] - F[1] * F[2];
    let tr = F[0] + F[3];

    output.color.r = det / 2;
    output.color.g = tr / 10;
    
    output.color.a = 1.0;
    return output;
} 