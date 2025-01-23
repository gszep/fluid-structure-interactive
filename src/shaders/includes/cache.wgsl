struct Index {
    global: vec2<u32>,
    local: vec2<u32>,
};

const size = vec2<u32>(WIDTH, HEIGHT);
const CACHE_SIZE = TILE_SIZE * WORKGROUP_SIZE;

var<workgroup> cache: array<array<array<f32, CACHE_SIZE>, CACHE_SIZE>, 4>;
const DISPATCH_SIZE = (CACHE_SIZE - 2 * HALO_SIZE);

fn update_cache(id: Invocation, idx: u32, F: texture_storage_2d<r32float, read_write>) {
    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {
            let index = get_index(id, tile_x, tile_y);

            cache[idx][index.local.x][index.local.y] = load_value(F, index.global).r;
        }
    }
}

fn cached_value(idx: u32, x: vec2<u32>) -> vec4<f32> {
    return vec4<f32>(cache[idx][x.x][x.y], 0.0, 0.0, 1);
}

fn load_value(F: texture_storage_2d<r32float, read_write>, x: vec2<u32>) -> vec4<f32> {
    let y = x + size; // ensure positive coordinates
    return textureLoad(F, y % size);  // periodic boundary conditions
}

fn get_bounds(id: Invocation) -> vec4<u32> {
    return vec4<u32>(
        DISPATCH_SIZE * id.workGroupID.xy,
        min(size, DISPATCH_SIZE * (id.workGroupID.xy + 1))
    );
}

fn check_bounds(index: Index, bounds: vec4<u32>) -> bool {
    return all(index.global >= bounds.xy) && all(index.global < bounds.zw);
}

fn get_index(id: Invocation, tile_x: u32, tile_y: u32) -> Index {
    let tile = vec2<u32>(tile_x, tile_y);

    let local = tile + TILE_SIZE * id.localInvocationID.xy;
    let global = local + DISPATCH_SIZE * id.workGroupID.xy - HALO_SIZE;
    return Index(global, local);
}