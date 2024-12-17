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
const dt: f32 = 0.01;
const viscosity: f32 = 0.0001;

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

const dx = vec2<i32>(1, 0);
const dy = vec2<i32>(0, 1);

fn advection(F: texture_2d<f32>, x: vec2<i32>) -> f32 {
    let v = velocity(F, x);
    let pos = vec2<f32>(x) - v * dt;

    let x0 = vec2<i32>(floor(pos));
    let x1 = x0 + dx;
    let y0 = vec2<i32>(floor(pos));
    let y1 = y0 + dy;

    let s1 = pos.x - f32(x0.x);
    let s0 = 1.0 - s1;
    let t1 = pos.y - f32(y0.y);
    let t0 = 1.0 - t1;

    let f00 = value(F, x0).w;
    let f10 = value(F, x1).w;
    let f01 = value(F, y0).w;
    let f11 = value(F, y1).w;

    return s0 * (t0 * f00 + t1 * f01) + s1 * (t0 * f10 + t1 * f11);
}

fn velocity(F: texture_2d<f32>, x: vec2<i32>) -> vec2<f32> {
    let u = value(F, x + dy).z - value(F, x).z;
    let v = value(F, x).z - value(F, x + dx).z;

    return vec2<f32>(u, v);
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
    let distance = abs(x - interaction.position);
    if all(distance * distance < interaction.size) {
        Fdt.w += exp(-f32(dot(distance, distance)) / 10);
    }
    
    // relaxation of poisson equation for stream function F.z
    Fdt.z += (laplacian(F, x).z + Fdt.w) * 0.25;

    // update vorticity F.w
    Fdt.w += (laplacian(F, x).w * 0.00 - advection(F, x) * 0.01) ;

    textureStore(Fdash, x, Fdt);
}