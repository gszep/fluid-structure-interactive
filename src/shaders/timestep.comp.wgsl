// cpu-side code uses setValues during shader construction to set static values
// such as WORKGROUP_SIZE, TILE_SIZE GROUP_INDEX and other names in ALL CAPS
// Code under the src/shaders/includes director is prepended to this shader

const GROUP_INDEX = 0;
const XVELOCITY = 0;
const YVELOCITY = 1;
const XMAP = 2;
const YMAP = 3;
const VISCOSITY = 4;
const INTERACTION = 5;

const WORKGROUP_SIZE = 16;
const TILE_SIZE = 2;
const HALO_SIZE = 16;

struct Index {
    global: vec2<u32>,
    local: vec2<u32>,
};

const size = vec2<i32>(WIDTH, HEIGHT);
const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;

var<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 4>;
const DISPATCH_SIZE = (CACHE_SIZE - 2 * HALO_SIZE);

fn update_cache(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {
    for (var tile_x = 0; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0; tile_y < TILE_SIZE; tile_y++) {
            let tile = vec2<i32>(tile_x, tile_y);

            let local = tile + TILE_SIZE * id.localInvocationID.xy;
            let global = local + DISPATCH_SIZE * id.workGroupID.xy;
            cache[idx][local.x][local.y] = load_value(F, global).r;
        }
    }
}

fn cached_value(idx: i32, x: vec2<u32>) -> vec4<f32> {
    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1.0);
}

fn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<i32>) -> vec4<f32> {
    let y = x + size; // ensure positive coordinates
    return textureLoad(F, y % size);  // periodic boundary conditions
}

fn check_bounds(id: Invocation) -> bool {
    return TILE_SIZE * id.localInvocationID.x < DISPATCH_SIZE && TILE_SIZE * id.localInvocationID.y < DISPATCH_SIZE;
}

fn get_index(id: Invocation, tile_x: i32, tile_y: i32) -> Index {
    let tile = vec2<i32>(tile_x, tile_y);

    let local = tile + TILE_SIZE * id.localInvocationID.xy;
    let global = local + DISPATCH_SIZE * id.workGroupID.xy;

    let wrapped_global = (global + size) % size;
    return Index(global, local);
}

struct Invocation {
    @builtin(workgroup_id) workGroupID: vec3<i32>,
    @builtin(local_invocation_id) localInvocationID: vec3<i32>,
};

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const dx = vec2<u32>(1u, 0u);
const dy = vec2<u32>(0u, 1u);

@group(GROUP_INDEX) @binding(XVELOCITY) var vel_x: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(YVELOCITY) var vel_y: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(XMAP) var eta_x: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(YMAP) var eta_y: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn get_reference_map(x: vec2<u32>) -> vec2<f32> {
    return vec2<f32>(cached_value(XMAP, x).x, cached_value(YMAP, x).x);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(id: Invocation) {

    update_cache(id, XVELOCITY, vel_x);
    update_cache(id, YVELOCITY, vel_y);
    workgroupBarrier();

    if check_bounds(id) {
        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {
                let index = get_index(id, tile_x, tile_y);

                // brush interaction
                let distance = vec2<f32>(index.global) - interaction.position;
                let norm = dot(distance, distance);

                var brush = 0.0;
                if sqrt(norm) < abs(interaction.size) {
                    brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));
                }

                let vel_x_update = cached_value(XVELOCITY, index.local) + brush;
                textureStore(vel_x, index.global, vel_x_update);

                let vel_y_update = cached_value(YVELOCITY, index.local) + brush;
                textureStore(vel_y, index.global, vel_y_update);
            }
        }
    }

    update_cache(id, XVELOCITY, vel_x);
    update_cache(id, YVELOCITY, vel_y);
    workgroupBarrier();

    if check_bounds(id) {
        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {
                let index = get_index(id, tile_x, tile_y);
                
                // diffuse velocities with laplacian
                var laplacian = 0.0;
                laplacian += 0.25 * (cached_value(XVELOCITY, index.local + dx).x + cached_value(XVELOCITY, index.local - dx).x + cached_value(XVELOCITY, index.local + dy).x + cached_value(XVELOCITY, index.local - dy).x - 4.0 * cached_value(XVELOCITY, index.local).x);

                let vel_x_update = cached_value(XVELOCITY, index.local) + laplacian;
                textureStore(vel_x, index.global, vel_x_update);

                let vel_y_update = cached_value(YVELOCITY, index.local) + laplacian;
                textureStore(vel_y, index.global, vel_y_update);
            }
        }
    }
}