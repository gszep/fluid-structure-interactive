#import includes::bindings
#import includes::cache

const EPS = 1e-37;
struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));
const lattice_weight = array<f32, 9>(4.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0);

@group(GROUP_INDEX) @binding(DISTRIBUTION) var distribution: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(FORCE) var force: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn load_macroscopics_cache(id: Invocation) {
    load_cache_vec2(id, 0u, velocity);
    load_cache_vec2(id, 1u, map);
    load_cache_vec2(id, 2u, force);
}

fn get_velocity(index: Index) -> vec2<f32> {
    return cached_value_vec2(0u, index.local);
}

fn get_reference_map(index: Index) -> vec2<f32> {
    return cached_value_vec2(1u, index.local);
}

fn get_force(index: Index) -> vec2<f32> {
    return cached_value_vec2(2u, index.local);
}

fn load_distribution_cache(id: Invocation) {
    load_cache_vec9(id, distribution);
}

fn get_distribution(index: Index) -> array<f32, 9> {
    return cached_value_vec9(index.local);
}

fn get_force_distribution(index: Index, v: vec2<f32>) -> array<f32, 9> {
    let F = get_force(index);

    return array<f32, 9>(
        1.0 * lattice_weight[0] * (-v.x * F.x - v.y * F.y),
        3.0 * lattice_weight[1] * ((2.0 * v.x + 1.0) * F.x - v.y * F.y),
        3.0 * lattice_weight[2] * (-v.x * (2.0 * v.y + 1.0) * F.y),
        3.0 * lattice_weight[3] * ((2.0 * v.x - 1.0) * F.x - v.y * F.y),
        3.0 * lattice_weight[4] * (-v.x * (2.0 * v.y - 1.0) * F.y),
        3.0 * lattice_weight[5] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y + 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),
        3.0 * lattice_weight[6] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y + 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x)),
        3.0 * lattice_weight[7] * ((2.0 * v.x - 1.0) * F.x + (2.0 * v.y - 1.0) * F.y + 3.0 * (v.x * F.y + v.y * F.x)),
        3.0 * lattice_weight[8] * ((2.0 * v.x + 1.0) * F.x + (2.0 * v.y - 1.0) * F.y - 3.0 * (v.x * F.y + v.y * F.x))
    );
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn lattice_boltzmann(id: Invocation) {
    let relaxation_frequency = 1.0; // between 0.0 and 2.0

    load_macroscopics_cache(id);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                var force_update = vec2<f32>(0.0, 0.0);
                let x = vec2<f32>(index.global);
                let y = interaction.position + sign(interaction.size) ;

                let dims = vec2<f32>(canvas.size);
                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

                if distance < abs(interaction.size) {
                    force_update += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
                }

                store_component_value(force, index, 0, force_update.x);
                store_component_value(force, index, 1, force_update.y);
            }
        }
    }

    load_macroscopics_cache(id);
    load_distribution_cache(id);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // read distribution from neighbors
                var f: array<f32, 9>;
                for (var i = 0u; i < 9u; i++) {

                    let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));
                    f[i] = get_distribution(y)[i];
                }
                
                // update macroscopics
                var density = 0.0;
                var momentum = vec2<f32>(0.0, 0.0);

                for (var i = 0; i < 9; i++) {
                    density += f[i];
                    momentum += f[i] * vec2<f32>(lattice_vector[i]);
                }

                let velocity_update = momentum / max(density, EPS);
                store_component_value(velocity, index, 0, velocity_update.x);
                store_component_value(velocity, index, 1, velocity_update.y);


                let F = get_force_distribution(index, velocity_update);
                let speed = length(velocity_update);

                for (var i = 0; i < 9; i++) {

                    // compute distribution equilibrium
                    let lattice_speed = dot(velocity_update, vec2<f32>(lattice_vector[i]));
                    let equilibrium = lattice_weight[i] * density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);
                
                    // BGK collision
                    let distribution_update = (1.0 - relaxation_frequency) * f[i] + relaxation_frequency * equilibrium + (1.0 - relaxation_frequency / 2.0) * F[i];
                    store_component_value(distribution, index, i, distribution_update);
                }
            }
        }
    }
}


    // for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
    //     for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

    //         let index = get_index(id, tile_x, tile_y);
    //         if check_bounds(index) {

    //             // update macroscopics
    //             let f = get_distribution(index);
    //             var F = get_force_distribution(index, get_velocity(index));

    //             var density = f[0] + f[1] + f[2] + f[3] + f[4] + f[5] + f[6] + f[7] + f[8] + (F[0] + F[1] + F[2] + F[3] + F[4] + F[5] + F[6] + F[7] + F[8]) / 2.0;
    //             var velocity_update = (f[0] * vec2<f32>(lattice_vector[0]) + f[1] * vec2<f32>(lattice_vector[1]) + f[2] * vec2<f32>(lattice_vector[2]) + f[3] * vec2<f32>(lattice_vector[3]) + f[4] * vec2<f32>(lattice_vector[4]) + f[5] * vec2<f32>(lattice_vector[5]) + f[6] * vec2<f32>(lattice_vector[6]) + f[7] * vec2<f32>(lattice_vector[7]) + f[8] * vec2<f32>(lattice_vector[8]) + (F[0] * vec2<f32>(lattice_vector[0]) + F[1] * vec2<f32>(lattice_vector[1]) + F[2] * vec2<f32>(lattice_vector[2]) + F[3] * vec2<f32>(lattice_vector[3]) + F[4] * vec2<f32>(lattice_vector[4]) + F[5] * vec2<f32>(lattice_vector[5]) + F[6] * vec2<f32>(lattice_vector[6]) + F[7] * vec2<f32>(lattice_vector[7]) + F[8] * vec2<f32>(lattice_vector[8])) / 2.0) / density;

    //             store_component_value(velocity, index, 0, velocity_update.x);
    //             store_component_value(velocity, index, 1, velocity_update.y);

    //             // compute distribution equilibrium
    //             let speed = length(velocity_update);

    //             var equilibrium = array<f32, 9>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    //             for (var i = 0; i < 9; i++) {

    //                 let lattice_speed = dot(velocity_update, vec2<f32>(lattice_vector[i]));
    //                 equilibrium[i] = lattice_weight[i] * density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);
    //             }

    //             // perform collision-streaming update
    //             F = get_force_distribution(index, velocity_update);  // use updated velocity
    //             for (var i = 0; i < 9; i++) {

    //                 let distribution_update = (1.0 - relaxation_frequency) * f[i] + relaxation_frequency * equilibrium[i] + (1.0 - relaxation_frequency / 2.0) * F[i];
    //                 let y = Index(index.global + vec2<u32>(lattice_vector[i]), index.local + vec2<u32>(lattice_vector[i]));

    //                 store_component_value(distribution, y, i, distribution_update);
    //             }
    //         }
    //     }
    // }