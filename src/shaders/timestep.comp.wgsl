struct Invocation {
  @builtin(workgroup_id) workGroupID: vec3<u32>,
  @builtin(local_invocation_id) localInvocationID: vec3<u32>,
  @builtin(global_invocation_id) globalInvocationID: vec3<u32>,
};

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const dx = vec2<u32>(1, 0);
const dy = vec2<u32>(0, 1);

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION_BINDING) var<uniform> interaction: Interaction;

fn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {
    return  cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4 * cached_value(F, x);
}

fn curl(F: u32, x: vec2<u32>) -> vec2<f32> {
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

    let u = (cached_value(F, x + dy) - cached_value(F, x - dy)) / 2;
    let v = (cached_value(F, x - dx) - cached_value(F, x + dx)) / 2;

    return vec2<f32>(u.x, v.x);
}

fn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {
    return (1 - relaxation) * cached_value(F, x) + (relaxation / 4) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));
}

fn advected_value(F: u32, x: vec2<u32>, dt: f32) -> vec4<f32> {
    let y = vec2<f32>(x) - curl(STREAMFUNCTION, x) * dt;
    return interpolate_value(F, y);
}

fn interpolate_value(F: u32, x: vec2<f32>) -> vec4<f32> {

    let fraction = fract(x);
    let y = vec2<u32>(x + (0.5 - fraction));

    return mix(
        mix(
            cached_value(F, y),
            cached_value(F, y + dx),
            fraction.x
        ),
        mix(
            cached_value(F, y + dy),
            cached_value(F, y + dx + dy),
            fraction.x
        ),
        fraction.y
    );
}

var<workgroup> cache: array<array<array<vec4<f32>, WORKGROUP_SIZE+2>, WORKGROUP_SIZE+2>, 2>;
fn load_cache(id: Invocation, idx: u32, F: texture_storage_2d<FORMAT, read_write>) {
    let global = vec2<i32>(id.globalInvocationID.xy);
    let local = id.localInvocationID.xy + 1;

    const loweidx = 0;
    const uppeidx = WORKGROUP_SIZE + 1;

    const dx = vec2<i32>(1, 0);
    const dy = vec2<i32>(0, 1);

    // load the tile and nearest neighbours into shared memory
    cache[idx][local.x][local.y] = load_value(F, global);

    // edge neighbours
    if local.x == (loweidx + 1) {
        cache[idx][loweidx][local.y] = load_value(F, global - dx);
    }
    if local.x == (uppeidx - 1) {
        cache[idx][uppeidx][local.y] = load_value(F, global + dx);
    }
    if local.y == (loweidx + 1) {
        cache[idx][local.x][loweidx] = load_value(F, global - dy);
    }
    if local.y == (uppeidx - 1) {
        cache[idx][local.x][uppeidx] = load_value(F, global + dy);
    }

    // corner neighbours
    if local.x == (loweidx + 1) && local.y == (loweidx + 1) {
        cache[idx][loweidx][loweidx] = load_value(F, global - dx - dy);
    }
    if local.x == (uppeidx - 1) && local.y == (loweidx + 1) {
        cache[idx][uppeidx][loweidx] = load_value(F, global + dx - dy);
    }
    if local.x == (loweidx + 1) && local.y == (uppeidx - 1) {
        cache[idx][loweidx][uppeidx] = load_value(F, global - dx + dy);
    }
    if local.x == (uppeidx - 1) && local.y == (uppeidx - 1) {
        cache[idx][uppeidx][uppeidx] = load_value(F, global + dx + dy);
    }

    workgroupBarrier();
}

fn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {
    return cache[idx][x.x + 1][x.y + 1];
}

fn load_value(F: texture_storage_2d<FORMAT, read_write>, x: vec2<i32>) -> vec4<f32> {
    const size: vec2<i32> = vec2<i32>(WIDTH, HEIGHT);

    let y = x + size; // ensure positive coordinates
    return textureLoad(F, y % size);  // periodic boundary conditions
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(id: Invocation) {
    let global = id.globalInvocationID.xy;
    let local = id.localInvocationID.xy;

    // brush interaction
    let distance = vec2<f32>(global) - interaction.position;
    let norm = dot(distance, distance);

    var brush = 0.0;
    if sqrt(norm) < abs(interaction.size) {
        brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));
    }

    load_cache(id, VORTICITY, omega);
    load_cache(id, STREAMFUNCTION, phi);

    // vorticity timestep;
    textureStore(omega, global, advected_value(VORTICITY, local, 0.0) + laplacian(VORTICITY, local) * 0.1 + brush);
    load_cache(id, VORTICITY, omega);

    // solve poisson equation for stream function
    const relaxation = 1.0;
    for (var i = 0; i < 100; i = i + 1) {
        load_cache(id, STREAMFUNCTION, phi);
        textureStore(phi, global, jacobi_iteration(STREAMFUNCTION, VORTICITY, local, relaxation));
    }

    // debug
    load_cache(id, VORTICITY, omega);
    load_cache(id, STREAMFUNCTION, phi);

    let error = abs(cached_value(VORTICITY, local) + laplacian(STREAMFUNCTION, local));
    textureStore(debug, global, error);
}