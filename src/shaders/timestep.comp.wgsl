#import includes::bindings
#import includes::cache

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

@group(GROUP_INDEX) @binding(VORTICITY) var vorticity: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn get_streamfunction(index: Index) -> vec4<f32> {
    return cached_value(STREAMFUNCTION, index.local);
}

fn get_vorticity(index: Index) -> vec4<f32> {
    return cached_value(VORTICITY, index.local);
}

fn get_vorticity_interpolate(index: IndexFloat) -> vec4<f32> {
    let x = index.local;

    let fraction = fract(x);
    let y = vec2<u32>(x + (0.5 - fraction));

    return mix(
        mix(
            cached_value(VORTICITY, y),
            cached_value(VORTICITY, y + dx),
            fraction.x
        ),
        mix(
            cached_value(VORTICITY, y + dy),
            cached_value(VORTICITY, y + dx + dy),
            fraction.x
        ),
        fraction.y
    );
}

fn diffuse_vorticity(x: Index) -> vec4<f32> {
    return get_vorticity(add(x, dx)) + get_vorticity(sub(x, dx)) + get_vorticity(add(x, dy)) + get_vorticity(sub(x, dy)) - 4.0 * get_vorticity(x);
}

fn velocity(x: Index) -> vec2<f32> {

    let u = (get_streamfunction(add(x, dy)) - get_streamfunction(sub(x, dy))) / 2.0;
    let v = (get_streamfunction(sub(x, dx)) - get_streamfunction(add(x, dx))) / 2.0;

    return vec2<f32>(u.x, v.x);
}

fn jacobi_iteration(x: Index, relaxation: f32) -> vec4<f32> {
    return (1.0 - relaxation) * get_streamfunction(x) + (relaxation / 4.0) * (get_streamfunction(add(x, dx)) + get_streamfunction(sub(x, dx)) + get_streamfunction(add(x, dy)) + get_streamfunction(sub(x, dy)) + get_vorticity(x));
}

fn advect_vorticity(x: Index, dt: f32) -> vec4<f32> {
    let y = subf(indexf(x), velocity(x) * dt);
    return get_vorticity_interpolate(y);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn interact(id: Invocation) {

    update_cache(id, VORTICITY, vorticity);
    update_cache(id, STREAMFUNCTION, streamfunction);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let x = vec2<f32>(index.global);
                let y = interaction.position;

                let dims = vec2<f32>(canvas.size);
                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

                var brush = 0.0;
                if distance < abs(interaction.size) {
                    brush += 0.1 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
                }

                var vorticity_update = get_vorticity(index) + brush;
                textureStore(vorticity, vec2<i32>(index.global), vorticity_update);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn advection(id: Invocation) {

    update_cache(id, VORTICITY, vorticity);
    update_cache(id, STREAMFUNCTION, streamfunction);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let vorticity_update = advect_vorticity(index, 0.1) + diffuse_vorticity(index) * 0.01;
                textureStore(vorticity, vec2<i32>(index.global), vorticity_update);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn projection(id: Invocation) {

    update_cache(id, VORTICITY, vorticity);
    update_cache(id, STREAMFUNCTION, streamfunction);
    workgroupBarrier();

    const relaxation = 1.4;
    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // Red update
                if (index.local.x + index.local.y) % 2u == 0u {
                    let streamfunction_update = jacobi_iteration(index, relaxation);
                    textureStore(streamfunction, vec2<i32>(index.global), streamfunction_update);
                }
            }
        }
    }
    // update_cache(id, VORTICITY, vorticity);
    update_cache(id, STREAMFUNCTION, streamfunction);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // Black update
                if (index.local.x + index.local.y) % 2u != 0u {
                    let streamfunction_update = jacobi_iteration(index, relaxation);
                    textureStore(streamfunction, vec2<i32>(index.global), streamfunction_update);
                }
            }
        }
    }
}