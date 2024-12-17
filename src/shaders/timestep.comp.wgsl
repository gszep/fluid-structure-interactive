struct Input {
  @builtin(global_invocation_id) position: vec3<u32>,
};

struct Interaction {
    position: vec2<i32>,
    size: vec2<i32>,
};

@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;
@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<STORAGE_FORMAT, write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(f: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    const kernel = mat3x3<f32>(
        0.05, 0.20, 0.05,
        0.20, -1.0, 0.20,
        0.05, 0.20, 0.05,
    );

    var dx = vec2<i32>(0, 0);
    var result = vec4<f32>(0, 0, 0, 0);

    for (var i: i32 = -1; i < 2; i = i + 1) {
        for (var j: i32 = -1; j < 2; j = j + 1) {
            dx.x = i;
            dx.y = j;

            result += kernel[i + 1][j + 1] * value(f, x + dx);
        }
    }

    return result;
}

fn value(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    const level: i32 = 0;

    let boundary = vec2<i32>(textureDimensions(F));
    return textureLoad(F, x % boundary, level);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let x = vec2<i32>(input.position.xy);
    var neighbors = vec4<u32>(0, 0, 0, 0);

    var dx = vec2<i32>(0, 0);
    for (var i: i32 = -1; i < 2; i = i + 1) {
        for (var j: i32 = -1; j < 2; j = j + 1) {

            dx.x = i;
            dx.y = j;

            // ignore the current cell
            if dx.x == 0 && dx.y == 0 {
                continue;
            }

            // periodic boundary conditions
            neighbors += vec4<u32>(value(F, x + dx));
        }
    }

    // brush interaction
    let distance = abs(x - interaction.position);
    if all(distance < interaction.size) {
        neighbors += vec4<u32>(1, 1, 1, 1);
    }

    // Conway's game of life rules
    var Fdt = value(F, x);
    for (var k: i32 = 0; k < 4; k = k + 1) {
        switch neighbors[k] {
            case 2: {
            }
            case 3: {
                Fdt[k] = 1;
            }
            default: {
                Fdt[k] = 0;
            }
        }
    }
    textureStore(Fdash, x, Fdt);
}