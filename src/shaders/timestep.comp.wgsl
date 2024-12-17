struct Input {
  @builtin(workgroup_id) workGroupID: vec3<u32>,
  @builtin(local_invocation_id) localInvocationID: vec3<u32>,
  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,
};

struct Interaction {
    position: vec2<i32>,
    size: vec2<i32>,
};

@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;
const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);
const level: i32 = 0;
const dt: f32 = 0.1;

@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<STORAGE_FORMAT, write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    const kernel = mat3x3<f32>(
        0, 1, 0,
        1, -4, 1,
        0, 1, 0,
    );

    var dx = vec2<i32>(0, 0);
    var result = vec4<f32>(0, 0, 0, 0);

    for (var i: i32 = -1; i < 2; i = i + 1) {
        for (var j: i32 = -1; j < 2; j = j + 1) {
            dx.x = i;
            dx.y = j;

            result += kernel[i + 1][j + 1] * value(F, x + dx);
        }
    }

    return result;
}

fn value(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    let y = x + size ; // not sure why this is necessary
    return textureLoad(F, y % size, level);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let x = vec2<i32>(input.globalInvocationID.xy);
    var Fdt = value(F, x) + laplacian(F, x) * dt;

    // brush interaction
    let distance = abs(x - interaction.position);
    if all(distance < interaction.size) {
        Fdt += vec4<f32>(1, 1, 1, 1);
    }

    textureStore(Fdash, x, Fdt);
}