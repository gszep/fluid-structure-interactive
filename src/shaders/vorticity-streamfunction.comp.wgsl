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
@group(GROUP_INDEX) @binding(DENSITY) var density: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(VELOCITY) var velocity: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(MAP) var map: texture_storage_2d_array<r32float, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var streamfunction: texture_storage_2d<r32float, read_write>;
@group(GROUP_INDEX) @binding(INTERACTION) var<uniform> interaction: Interaction;

fn load_macroscopics_cache(id: Invocation) {
    load_cache_f32(id, 0u, density);
    load_cache_vec2(id, 0u, velocity);
}

fn get_density(index: Index) -> f32 {
    return cached_value_f32(0u, index.local);
}

fn get_velocity(index: Index) -> vec2<f32> {
    return cached_value_vec2(0u, index.local);
}

fn load_distribution_cache(id: Invocation) {
    load_cache_vec9(id, distribution);
}

fn get_distribution(index: Index) -> array<f32, 9> {
    return cached_value_vec9(index.local);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn interact(id: Invocation) {

    load_macroscopics_cache(id);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let x = vec2<f32>(index.global);
                let y = interaction.position + sign(interaction.size) ;

                let dims = vec2<f32>(canvas.size);
                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

                var brush = 0.0;
                if distance < abs(interaction.size) {
                    brush += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
                }

                var velocity_update = get_velocity(index) + brush;
                store_component_value(velocity, index, 0, velocity_update.x);
                store_component_value(velocity, index, 1, velocity_update.y);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn lattice_boltzmann(id: Invocation) {

    load_distribution_cache(id);
    load_macroscopics_cache(id);

    workgroupBarrier();

    let relaxation_frequency = 1.0; // between 0.0 and 2.0
    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // equilibrium
                let density = get_density(index);
                let velocity = get_velocity(index);
                let speed = length(velocity);

                var equilibrium = array<f32, 9>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
                for (var i = 0; i < 9; i++) {

                    let lattice_speed = dot(velocity, vec2<f32>(lattice_vector[i]));
                    equilibrium[i] = lattice_weight[i] * density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);
                }

                // collision-streaming
                let f = get_distribution(index);
                for (var i = 0; i < 9; i++) {

                    let distribution_update = (1.0 - relaxation_frequency) * f[i] + relaxation_frequency * equilibrium[i];
                    let y = Index(index.global + vec2<u32>(lattice_vector[i]), index.local + vec2<u32>(lattice_vector[i]));

                    store_component_value(distribution, y, i, distribution_update);
                }
            }
        }
    }

    load_distribution_cache(id);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // hydro
                let f = get_distribution(index);
                let density_update = f[0] + f[1] + f[2] + f[3] + f[4] + f[5] + f[6] + f[7] + f[8];
                let velocity_update = (f[0] * vec2<f32>(lattice_vector[0]) + f[1] * vec2<f32>(lattice_vector[1]) + f[2] * vec2<f32>(lattice_vector[2]) + f[3] * vec2<f32>(lattice_vector[3]) + f[4] * vec2<f32>(lattice_vector[4]) + f[5] * vec2<f32>(lattice_vector[5]) + f[6] * vec2<f32>(lattice_vector[6]) + f[7] * vec2<f32>(lattice_vector[7]) + f[8] * vec2<f32>(lattice_vector[8])) / density_update;

                store_value(density, index, density_update);
                store_component_value(velocity, index, 0, velocity_update.x);
                store_component_value(velocity, index, 1, velocity_update.y);
            }
        }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn reference_map_technique(id: Invocation) {

    load_macroscopics_cache(id);
    workgroupBarrier();
}