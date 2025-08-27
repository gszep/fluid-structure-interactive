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

fn get_deformation(x: vec2<i32>) -> mat2x2<f32> {
    return mat2x2<f32>(textureLoad(deformation, x, 0).r, textureLoad(deformation, x, 1).r, textureLoad(deformation, x, 2).r, textureLoad(deformation, x, 3).r);
}

fn trace(A: mat2x2<f32>) -> f32 {
    return A[0][0] + A[1][1];
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * vec2<f32>(canvas.size));

    let F = get_deformation(x);
    let det = determinant(F);
    let tr = trace(F);

    output.color.r = F[0][0] / f32(canvas.size.x);
    output.color.g = F[1][1] / f32(canvas.size.y);
    
    output.color.a = 1.0;
    return output;
} 