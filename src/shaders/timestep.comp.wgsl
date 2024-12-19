struct Input {
  @builtin(workgroup_id) workGroupID: vec3<u32>,
  @builtin(local_invocation_id) localInvocationID: vec3<u32>,
  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,
};

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;
const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);
const level: i32 = 0;

const dx = vec2<i32>(1, 0);
const dy = vec2<i32>(0, 1);

@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<STORAGE_FORMAT, write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    return value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);
}

fn jacobi_iteration(F: texture_2d<f32>, x: vec2<i32>, h: f32) -> f32 {
    return (value(F, x + dx).z + value(F, x - dx).z + value(F, x + dy).z + value(F, x - dy).z - h * value(F, x).w) / 4;
}

fn advection(F: texture_2d<f32>, x: vec2<i32>) -> f32 {
    let vx = value(F, x + dy).z - value(F, x - dy).z;
    let vy = value(F, x - dx).z - value(F, x + dx).z;

    let wx = value(F, x + dx).w - value(F, x - dx).w;
    let wy = value(F, x + dy).w - value(F, x - dy).w;

    return vx * wx + vy * wy;
}


fn value(F: texture_2d<f32>, x: vec2<i32>) -> vec4<f32> {
    let y = x + size ; // not sure why this is necessary
    return textureLoad(F, y % size, level);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let x = vec2<i32>(input.globalInvocationID.xy);
    var Fdt = value(F, x);

    // brush interaction
    let distance = vec2<f32>(x) - interaction.position;
    let norm = dot(distance, distance);

    if sqrt(norm) < abs(interaction.size) {
        Fdt.w += 0.01 * sign(interaction.size) * exp(- norm / abs(interaction.size));
    }
    
    // relaxation of poisson equation for stream function F.z
    Fdt.z = jacobi_iteration(F, x, 1);
    // workgroupBarrier();

    // update vorticity F.w
    // Fdt.w += laplacian(F, x).w * 0.2;

    Fdt.x = abs(laplacian(F, x).z - value(F, x).w) / (1 + value(F, x).w);
    textureStore(Fdash, x, Fdt);
}