struct Invocation {
    @builtin(workgroup_id) workGroupID: vec3<u32>,
    @builtin(local_invocation_id) localInvocationID: vec3<u32>,
};

struct Index {
    global: vec2<u32>,
    local: vec2<u32>,
};

struct IndexFloat {
    global: vec2<f32>,
    local: vec2<f32>,
};

struct Canvas {
    size: vec2<u32>,
    frame_index: u32,
};

fn indexf(index: Index) -> IndexFloat {
    return IndexFloat(vec2<f32>(index.global), vec2<f32>(index.local));
}

fn add(x: Index, y: vec2<u32>) -> Index {
    return Index(x.global + y, x.local + y);
}

fn addf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {
    return IndexFloat(x.global + y, x.local + y);
}

fn sub(x: Index, y: vec2<u32>) -> Index {
    return Index(x.global - y, x.local - y);
}

fn subf(x: IndexFloat, y: vec2<f32>) -> IndexFloat {
    return IndexFloat(x.global - y, x.local - y);
}

const dx = vec2<u32>(1u, 0u);
const dy = vec2<u32>(0u, 1u);

const TILE_SIZE = 2u;
const WORKGROUP_SIZE = 8u;
const HALO_SIZE = 1u;

const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;
const DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);

@group(GROUP_INDEX) @binding(CANVAS) var<uniform> canvas: Canvas;
var<workgroup> cache_f32: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 2>;
var<workgroup> cache_vec2: array<array<array<vec2<f32>, CACHE_SIZE>, CACHE_SIZE>, 2>;
var<workgroup> cache_vec9: array<array<array<f32, 9>, CACHE_SIZE>, CACHE_SIZE>;

fn update_cache_f32(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);

            cache_f32[idx][index.local.x][index.local.y] = load_value(F, index.global, 0).r;
        }
    }
}

fn update_cache_vec2(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);

            cache_vec2[idx][index.local.x][index.local.y].x = load_value(F, index.global, 0).r;
            cache_vec2[idx][index.local.x][index.local.y].y = load_value(F, index.global, 1).r;
        }
    }
}

fn update_cache_vec9(id: Invocation, F: texture_storage_2d_array<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            for (var i = 0; i < 9; i++) {
                cache_vec9[index.local.x][index.local.y][i] = load_value(F, index.global, i).r;
            }
        }
    }
}

fn cached_value_f32(idx: u32, x: vec2<u32>) -> f32 {
    return cache_f32[idx][x.x][x.y];
}

fn cached_value_vec2(idx: u32, x: vec2<u32>) -> vec2<f32> {
    return cache_vec2[idx][x.x][x.y];
}

fn cached_value_vec9(x: vec2<u32>) -> array<f32, 9> {
    return cache_vec9[x.x][x.y];
}

fn as_r32float(r: f32) -> vec4<f32> {
    return vec4<f32>(r, 0.0, 0.0, 1.0);
}

fn load_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>, component: i32) -> vec4<f32> {
    let y = x + canvas.size; // ensure positive coordinates
    return textureLoad(F, vec2<i32>(y % canvas.size), component);  // periodic boundary conditions
}

fn store_value(F: texture_storage_2d_array<r32float, read_write>, index: Index, component: i32, value: f32) {
    textureStore(F, vec2<i32>(index.global), component, as_r32float(value));
}

fn check_bounds(index: Index) -> bool {
    return (0u < index.local.x) && (index.local.x <= DISPATCH_SIZE) && (0u < index.local.y) && (index.local.y <= DISPATCH_SIZE);
}

fn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {
    let tile = vec2<u32>(tile_x, tile_y);

    let local = tile + TILE_SIZE * id.localInvocationID.xy;
    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;
    return Index(global, local);
}