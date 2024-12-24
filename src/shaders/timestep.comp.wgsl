struct Input {
  @builtin(workgroup_id) workGroupID: vec3<u32>,
  @builtin(local_invocation_id) localInvocationID: vec3<u32>,
  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,
};

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

struct Curl {
    x: vec2<f32>,
    y: vec2<f32>,
    z: vec2<f32>,
    w: vec2<f32>,
};

const dx = vec2<i32>(1, 0);
const dy = vec2<i32>(0, 1);

@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_storage_2d<FORMAT, read>;
const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);

@group(GROUP_INDEX) @binding(WRITE_BINDING) var Fdash: texture_storage_2d<FORMAT, write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {
    return value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);
}

fn curl(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> Curl {

    let u = (value(F, x + dy) - value(F, x - dy)) / 2;
    let v = (value(F, x - dx) - value(F, x + dx)) / 2;
    var w: Curl;

    w.x = vec2<f32>(u.x, v.x);
    w.y = vec2<f32>(u.y, v.y);
    w.z = vec2<f32>(u.z, v.z);
    w.w = vec2<f32>(u.w, v.w);

    return w;
}

fn jacobi_iteration(F: texture_storage_2d<FORMAT, read>, w: f32, x: vec2<i32>, h: f32) -> f32 {
    return (value(F, x + dx).z + value(F, x - dx).z + value(F, x + dy).z + value(F, x - dy).z + h * w) / 4;
}

fn advected_value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>, dt: f32) -> vec4<f32> {
    let y = vec2<f32>(x) - curl(F, x).z * dt;
    return interpolate_value(F, y);
}

fn value(F: texture_storage_2d<FORMAT, read>, x: vec2<i32>) -> vec4<f32> {
    let y = x + size ; // not sure why this is necessary
    return textureLoad(F, y % size);  // periodic boundary conditions
}

fn interpolate_value(F: texture_storage_2d<FORMAT, read>, x: vec2<f32>) -> vec4<f32> {

    let fraction = fract(x);
    let y = vec2<i32>(x + (0.5 - fraction));

    return mix(
        mix(
            value(F, y),
            value(F, y + dx),
            fraction.x
        ),
        mix(
            value(F, y + dy),
            value(F, y + dx + dy),
            fraction.x
        ),
        fraction.y
    );
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let x = vec2<i32>(input.globalInvocationID.xy);

    if !(interaction.size < 1000000) {
        var Fdt = value(F, x);
        Fdt.z = jacobi_iteration(F, Fdt.w, x, 10);

        Fdt.x = abs(laplacian(F, x).z + value(F, x).w) / (1 + value(F, x).w);
        textureStore(Fdash, x, Fdt);
        return;
    }
    // vorticity timestep
    var Fdt = advected_value(F, x, 1);
    Fdt.w += laplacian(F, x).w * 0.05;

    // BUG (gszep) use advected values
    // relaxation of poisson equation for stream function
    // Fdt.z = jacobi_iteration(F, Fdt.w, x, 1);

    // error calculation
    Fdt.x = abs(laplacian(F, x).z + value(F, x).w) / (1 + value(F, x).w);

    // brush interaction
    let distance = vec2<f32>(x) - interaction.position;
    let norm = dot(distance, distance);

    if sqrt(norm) < abs(interaction.size) {
        Fdt.w += 0.01 * sign(interaction.size) * exp(- norm / abs(interaction.size));
    }

    textureStore(Fdash, x, Fdt);
}