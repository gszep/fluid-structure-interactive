struct Invocation {
    @builtin(workgroup_id) workGroupID: vec3<u32>,
    @builtin(local_invocation_id) localInvocationID: vec3<u32>,
}

struct Index {
    global: vec2<u32>,
    local: vec2<u32>,
}

struct IndexFloat {
    global: vec2<f32>,
    local: vec2<f32>,
}

struct Canvas {
    size: vec2<u32>,
    frame_index: u32,
}

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
const HALO_SIZE = 2u;

const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;
const DISPATCH_SIZE = (CACHE_SIZE - 2u * HALO_SIZE);

@group(GROUP_INDEX) @binding(CANVAS)
var<uniform> canvas: Canvas;

var<workgroup> cache_f32: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 1>;
var<workgroup> cache_vec4: array<f32, CACHE_SIZE * CACHE_SIZE * 8>;
var<workgroup> cache_vec9: array<f32, CACHE_SIZE * CACHE_SIZE * 9>;

fn load_cache_f32(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            cache_f32[idx][index.local.x][index.local.y] = load_value(F, index.global);
        }
    }
}

fn load_cache_vec4(id: Invocation, idx: u32, F: texture_storage_2d_array<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            for (var i = 0; i < 4; i++) {

                let cache_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + u32(i) + (index.local.x * 4u) + (index.local.y * CACHE_SIZE * 4u);
                cache_vec4[cache_idx] = load_component_value(F, index.global, i);
            }
        }
    }
}

fn load_cache_vec9(id: Invocation, F: texture_storage_2d_array<r32float, read_write>) {

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            for (var i = 0; i < 9; i++) {

                let idx = u32(i) + (index.local.x * 9u) + (index.local.y * CACHE_SIZE * 9u);
                cache_vec9[idx] = load_component_value(F, index.global, i);
            }
        }
    }
}

fn cached_value_f32(idx: u32, x: vec2<u32>) -> f32 {
    return cache_f32[idx][x.x][x.y];
}

fn cached_value_vec4(idx: u32, x: vec2<u32>) -> vec4<f32> {
    let base_idx = (idx * CACHE_SIZE * CACHE_SIZE * 4u) + (x.x * 4u) + (x.y * CACHE_SIZE * 4u);
    return vec4<f32>(cache_vec4[base_idx + 0u], cache_vec4[base_idx + 1u], cache_vec4[base_idx + 2u], cache_vec4[base_idx + 3u]);
}

fn cached_value_vec9(x: vec2<u32>) -> array<f32, 9> {
    var vec9: array<f32, 9>;
    for (var i = 0; i < 9; i++) {

        let idx = u32(i) + (x.x * 9u) + (x.y * CACHE_SIZE * 9u);
        vec9[i] = cache_vec9[idx];
    }
    return vec9;
}

fn as_r32float(r: f32) -> vec4<f32> {
    return vec4<f32>(f32(r), 0.0, 0.0, 1.0);
}

fn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> f32 {
    let y = x + canvas.size;
    return f32(textureLoad(F, vec2<i32>(y % canvas.size)).r);
}

fn load_component_value(F: texture_storage_2d_array<r32float, read_write>, x: vec2<u32>, component: i32) -> f32 {
    let y = x + canvas.size;
    return f32(textureLoad(F, vec2<i32>(y % canvas.size), component).r);
}

fn store_value(F: texture_storage_2d<r32float, read_write>, index: Index, value: f32) {
    let y = index.global + canvas.size;
    textureStore(F, vec2<i32>(y % canvas.size), as_r32float(value));
}

fn store_component_value(F: texture_storage_2d_array<r32float, read_write>, index: Index, component: i32, value: f32) {
    let y = index.global + canvas.size;
    textureStore(F, vec2<i32>(y % canvas.size), component, as_r32float(value));
}

fn check_bounds(index: Index) -> bool {
    return (HALO_SIZE <= index.local.x) && (index.local.x <= DISPATCH_SIZE + HALO_SIZE - 1u) && (HALO_SIZE <= index.local.y) && (index.local.y <= DISPATCH_SIZE + HALO_SIZE - 1u);
}

fn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {
    let tile = vec2<u32>(tile_x, tile_y);

    let local = tile + TILE_SIZE * id.localInvocationID.xy;
    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;
    return Index(global, local);
}