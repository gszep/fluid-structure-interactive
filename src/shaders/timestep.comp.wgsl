#import includes::bindings
#import includes::cache

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const dx = vec2<u32>(1u, 0u);
const dy = vec2<u32>(0u, 1u);

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn laplacian(F: u32, x: vec2<u32>) -> vec4<f32> {
    return cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) - 4.0 * cached_value(F, x);
}

fn curl(F: u32, x: vec2<u32>) -> vec2<f32> {

    let u = (cached_value(F, x + dy) - cached_value(F, x - dy)) / 2.0;
    let v = (cached_value(F, x - dx) - cached_value(F, x + dx)) / 2.0;

    return vec2<f32>(u.x, v.x);
}

fn jacobi_iteration(F: u32, G: u32, x: vec2<u32>, relaxation: f32) -> vec4<f32> {
    return (1.0 - relaxation) * cached_value(F, x) + (relaxation / 4.0) * (cached_value(F, x + dx) + cached_value(F, x - dx) + cached_value(F, x + dy) + cached_value(F, x - dy) + cached_value(G, x));
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

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(id: Invocation) {
    let bounds = get_bounds(id);

    // vorticity timestep
    update_cache(id, VORTICITY, omega);
    update_cache(id, STREAMFUNCTION, phi);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index, bounds) {

                // brush interaction
                let distance = vec2<f32>(index.global) - interaction.position;
                let norm = dot(distance, distance);

                var brush = 0.0;
                if sqrt(norm) < abs(interaction.size) {
                    brush += 0.1 * sign(interaction.size) * exp(- norm / abs(interaction.size));
                }

                // advection + diffusion
                let omega_update = advected_value(VORTICITY, index.local, 0.1) + laplacian(VORTICITY, index.local) * 0.01 + brush;
                textureStore(omega, vec2<i32>(index.global), omega_update);
            }
        }
    }

    update_cache(id, VORTICITY, omega);
    workgroupBarrier();

    // solve poisson equation for stream function
    const relaxation = 1.0;
    for (var n = 0; n < 50; n++) {

        update_cache(id, STREAMFUNCTION, phi);
        workgroupBarrier();

        for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
            for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

                let index = get_index(id, tile_x, tile_y);
                if check_bounds(index, bounds) {

                    let phi_update = jacobi_iteration(STREAMFUNCTION, VORTICITY, index.local, relaxation);
                    textureStore(phi, vec2<i32>(index.global), phi_update);
                }
            }
        }
    }

    // update_cache(id, STREAMFUNCTION, phi);
    // workgroupBarrier();

    // // debug
    // for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
    //     for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

    //         let index = get_index(id, tile_x, tile_y);
    //         if check_bounds(index, bounds) {

    //             let error = abs(cached_value(VORTICITY, index.local) + laplacian(STREAMFUNCTION, index.local));
    //             textureStore(debug, index.global, error);
    //         }
    //     }
    // }
}