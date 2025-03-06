#import includes::bindings
#import includes::cache

const EPS = 1e-37;
struct Interaction {
    position: vec2<f32>,
    size: f32,
};

@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn get_streamfunction(index: Index) -> f32 {
    return cached_value_f32(STREAMFUNCTION, index.local);
}

fn get_vorticity(index: Index) -> f32 {
    return cached_value_f32(VORTICITY, index.local);
}

fn get_velocity(index: Index) -> vec2<f32> {
    return cached_value_vec2(VELOCITY, index.local);
}

fn get_reference_map(index: Index) -> vec2<f32> {
    return cached_value_vec2(MAP, index.local);
}

fn get_vorticity_interpolate(index: IndexFloat) -> f32 {
    let x = index.local;

    let fraction = fract(x);
    let y = vec2<u32>(x + (0.5 - fraction));

    return mix(
        mix(
            cached_value_f32(VORTICITY, y),
            cached_value_f32(VORTICITY, y + dx),
            fraction.x
        ),
        mix(
            cached_value_f32(VORTICITY, y + dy),
            cached_value_f32(VORTICITY, y + dx + dy),
            fraction.x
        ),
        fraction.y
    );
}

fn diffuse_vorticity(x: Index) -> f32 {
    let laplacian = 2.0 * (get_vorticity(add(x, dx)) + get_vorticity(sub(x, dx)) + get_vorticity(add(x, dy)) + get_vorticity(add(x, dx + dy))) + get_vorticity(add(x, dx - dy)) + get_vorticity(add(x, dy - dx)) + get_vorticity(sub(x, dx + dy)) - 12.0 * get_vorticity(x);
    return laplacian / 4.0;
}

fn get_velocity_clipped(x: Index, max_norm: f32) -> vec2<f32> {

    let v = get_velocity(x);
    let norm = length(v);

    return (v / max(norm, EPS)) * min(norm, max_norm);
}

fn update_velocity(id: Invocation) {
    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let xvelocity_update = (get_streamfunction(add(index, dy)) - get_streamfunction(sub(index, dy))) / 2.0;
                let yvelocity_update = (get_streamfunction(sub(index, dx)) - get_streamfunction(add(index, dx))) / 2.0;

                store_value(velocity, index, 0, xvelocity_update);
                store_value(velocity, index, 1, yvelocity_update);
            }
        }
    }
}

fn jacobi_iteration(x: Index, relaxation: f32) -> f32 {
    return (1.0 - relaxation) * get_streamfunction(x) + (relaxation / 4.0) * (get_streamfunction(add(x, dx)) + get_streamfunction(sub(x, dx)) + get_streamfunction(add(x, dy)) + get_streamfunction(sub(x, dy)) + get_vorticity(x));
}

fn advect_vorticity(x: Index) -> f32 {
    const max_norm = f32(HALO_SIZE);
    let y = subf(indexf(x), get_velocity_clipped(x, max_norm));
    return get_vorticity_interpolate(y);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn interact(id: Invocation) {

    update_cache_f32(id, VORTICITY, vorticity);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let x = vec2<f32>(index.global);
                let y = interaction.position + 8.0 * sign(interaction.size) ;

                let dims = vec2<f32>(canvas.size);
                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

                var brush = 0.0;
                if distance < abs(interaction.size) {
                    brush += 0.1 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
                }

                var vorticity_update = get_vorticity(index) + brush;
                store_value(vorticity, index, 0, vorticity_update);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn advection(id: Invocation) {

    update_cache_f32(id, VORTICITY, vorticity);
    update_cache_vec2(id, VELOCITY, velocity);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let vorticity_update = advect_vorticity(index) + diffuse_vorticity(index) * 0.01;
                store_value(vorticity, index, 0, vorticity_update);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn projection(id: Invocation) {

    update_cache_f32(id, VORTICITY, vorticity);
    update_cache_f32(id, STREAMFUNCTION, streamfunction);
    update_cache_vec2(id, VELOCITY, velocity);

    workgroupBarrier();

    const relaxation = 1.4;
    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // Red update
                if (index.local.x + index.local.y) % 2u == 0u {
                    let streamfunction_update = jacobi_iteration(index, relaxation);
                    store_value(streamfunction, index, 0, streamfunction_update);
                }
            }
        }
    }
    update_cache_f32(id, STREAMFUNCTION, streamfunction);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // Black update
                if (index.local.x + index.local.y) % 2u != 0u {
                    let streamfunction_update = jacobi_iteration(index, relaxation);
                    store_value(streamfunction, index, 0, streamfunction_update);
                }
            }
        }
    }
    update_velocity(id);
}