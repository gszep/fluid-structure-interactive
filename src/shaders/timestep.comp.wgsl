struct Invocation {
  @builtin(workgroup_id) workGroupID: vec3<u32>,
  @builtin(local_invocation_id) localInvocationID: vec3<u32>,
  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,
};

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const dx = vec2<i32>(1, 0);
const dy = vec2<i32>(0, 1);

const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>) -> vec4<f32> {
    return  value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) - 4 * value(F, x);
}

fn curl(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>) -> vec2<f32> {
    // curl of a scalar field yields a vector defined as (u,v) := (dF/dy, -dF/dx)
    // we approximate the derivatives using central differences with a staggered grid
    // where scalar field F is defined at the center and vector components (u,v) are
    // defined parallel to the edges of the cell.
    //
    //              |   F+dy  |      
    //              |         |    
    //       ———————|——— u1 ——|———————
    //              |         |
    //        F-dx  v0   F   v1   F+dx
    //              |         |
    //       ———————|—— u0 ———|———————
    //              |         |
    //              |   F-dy  |    
    //
    // the resulting vector field is defined at the center.
    // Bi-linear interpolation is used to approximate.

    let u = (value(F, x + dy) - value(F, x - dy)) / 2;
    let v = (value(F, x - dx) - value(F, x + dx)) / 2;

    return vec2<f32>(u.x, v.x);
}

fn jacobi_iteration(F: texture_storage_2d<FORMAT, read_write>, G: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>, relaxation: f32) -> vec4<f32> {
    return (1 - relaxation) * value(F, x) + (relaxation / 4) * (value(F, x + dx) + value(F, x - dx) + value(F, x + dy) + value(F, x - dy) + value(G, x));
}

fn advected_value(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>, dt: f32) -> vec4<f32> {
    let y = vec2<f32>(x) - curl(phi, x) * dt;
    return interpolate_value(F, y);
}

fn value(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>) -> vec4<f32> {
    let y = x + size; // ensure positive coordinates
    return textureLoad(F, y % size);  // periodic boundary conditions
}

fn interpolate_value(F: texture_storage_2d<FORMAT, read_write>, x: vec2<f32>) -> vec4<f32> {

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

var<workgroup> cached_value: array<array<array<vec4<f32>, WORKGROUP_SIZE+2>, WORKGROUP_SIZE+2>, 2>;
fn load_cache(id: Invocation, idx: u32, F: texture_storage_2d<FORMAT, read_write>) {
    let global = vec2<i32>(id.globalInvocationID.xy);
    let local = id.localInvocationID.xy + 1;

    const loweidx = 0;
    const uppeidx = WORKGROUP_SIZE + 1;

    // load the tile and nearest neighbours into shared memory
    cached_value[idx][local.x][local.y] = value(F, global);

    // edge neighbours
    if local.x == 1 {
        cached_value[idx][loweidx][local.y] = value(F, global - dx);
    }
    if local.x == WORKGROUP_SIZE {
        cached_value[idx][uppeidx][local.y] = value(F, global + dx);
    }
    if local.y == 1 {
        cached_value[idx][local.x][loweidx] = value(F, global - dy);
    }
    if local.y == WORKGROUP_SIZE {
        cached_value[idx][local.x][uppeidx] = value(F, global + dy);
    }

    // corner neighbours
    if local.x == 1 && local.y == 1 {
        cached_value[idx][loweidx][loweidx] = value(F, global - dx - dy);
    }
    if local.x == WORKGROUP_SIZE && local.y == 1 {
        cached_value[idx][uppeidx][loweidx] = value(F, global + dx - dy);
    }
    if local.x == 1 && local.y == WORKGROUP_SIZE {
        cached_value[idx][loweidx][uppeidx] = value(F, global - dx + dy);
    }
    if local.x == WORKGROUP_SIZE && local.y == WORKGROUP_SIZE {
        cached_value[idx][uppeidx][uppeidx] = value(F, global + dx + dy);
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(id: Invocation) {

    load_cache(id, VORTICITY, omega);
    load_cache(id, STREAMFUNCTION, phi);
    workgroupBarrier();

    let global = vec2<i32>(id.globalInvocationID.xy);
    let local = id.localInvocationID.xy + 1;

    // brush interaction
    let distance = vec2<f32>(global) - interaction.position;
    let norm = dot(distance, distance);

    var brush = 0.0;
    if sqrt(norm) < abs(interaction.size) {
        brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));
    }

    // vorticity timestep
    textureStore(omega, global, advected_value(omega, global, 0.01) + laplacian(omega, global) * 0.001 + brush);

    // solve poisson equation for stream function
    const relaxation = 1.5;
    for (var i = 0; i < 4; i = i + 1) {
        workgroupBarrier();
        if (global.x + global.y) % 2 == 0 {
            textureStore(phi, global, jacobi_iteration(phi, omega, global, relaxation));
        }
        workgroupBarrier();
        if (global.x + global.y) % 2 == 1 {
            textureStore(phi, global, jacobi_iteration(phi, omega, global, relaxation));
        }
    }

    // debug
    let error = abs(value(omega, global) + laplacian(phi, global));
    textureStore(debug, global, error);
}