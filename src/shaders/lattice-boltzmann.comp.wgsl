#import includes::bindings
#import includes::cache

const EPS = 1e-37;
struct Interaction {
    position: vec2<f32>,
    size: f32,
};

const lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));
const lattice_weight = array<f32, 9>(4.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0);

@group(GROUP_INDEX) @binding(DISTRIBUTION)
var distribution: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(DEFORMATION)
var deformation: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(FORCE)
var force: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(INTERACTION)
var<uniform> interaction: Interaction;

fn load_macroscopics_cache(id: Invocation) {
    load_cache_vec4(id, 0u, deformation);
    load_cache_vec4(id, 1u, force);
}

fn get_deformation_gradient(index: Index) -> vec4<f32> {
    return cached_value_vec4(0u, index.local);
}

fn _get_deformation_gradient(x: vec2<u32>) -> vec4<f32> {
    return cached_value_vec4(0u, x);
}

fn get_force(index: Index) -> vec4<f32> {
    return cached_value_vec4(1u, index.local);
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

fn advect_deformation_gradient(index: Index) -> vec4<f32> {
    const max_norm = f32(HALO_SIZE);

    // compute velocity
    var density = 0.0;
    var momentum = vec2<f32>(0.0, 0.0);
    
    var f: array<f32, 9>;
    for (var i = 0u; i < 9u; i++) {

        let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));
        f[i] = get_distribution(y)[i];

        density += f[i];
        momentum += f[i] * vec2<f32>(lattice_vector[i]);
    }

    let velocity = momentum / max(density, EPS);
    let norm = length(velocity);

    let y = subf(indexf(index), (velocity / max(norm, EPS)) * min(norm, max_norm));
    return get_deformation_gradient_interpolate(y);
}

fn get_deformation_gradient_interpolate(index: IndexFloat) -> vec4<f32> {
    let x = index.local;

    let fraction = fract(x);
    let y = vec2<u32>(x + (0.5 - fraction));

    return mix(
        mix(
            _get_deformation_gradient(y),
            _get_deformation_gradient(y + dx),
            fraction.x
        ),
        mix(
            _get_deformation_gradient(y + dy),
            _get_deformation_gradient(y + dx + dy),
            fraction.x
        ),
        fraction.y
    );
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn lattice_boltzmann(id: Invocation) {
    let relaxation_frequency = 1.8; // between 0.0 and 2.0

    load_macroscopics_cache(id);
    load_distribution_cache(id);
    workgroupBarrier();

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let x = vec2<f32>(index.global);
                let y = interaction.position + sign(interaction.size);

                let dims = vec2<f32>(canvas.size);
                let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

                var force_update = vec4<f32>(0.0, 0.0, 0.0, 0.0);
                if distance < abs(interaction.size) {
                    force_update += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
                }
                let deformation_gradient_update = advect_deformation_gradient(index);

                for (var i = 0; i < 4; i++) {
                    store_component_value(deformation, index, i, deformation_gradient_update[i]);
                    store_component_value(force, index, i, force_update[i]);
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

                // read distribution from neighbors
                var density = 0.0;
                var momentum = vec2<f32>(0.0, 0.0);
                
                var f: array<f32, 9>;
                for (var i = 0; i < 9; i++) {

                    let y = Index(index.global - vec2<u32>(lattice_vector[i]), index.local - vec2<u32>(lattice_vector[i]));
                    f[i] = get_distribution(y)[i];

                    density += f[i];
                    momentum += f[i] * vec2<f32>(lattice_vector[i]);
                }

                // include external forces
                let velocity = momentum / max(density, EPS);
                let speed = length(velocity);

                let F = get_force_distribution(index, velocity);
                for (var i = 0; i < 9; i++) {

                    // compute distribution equilibrium
                    let lattice_speed = dot(velocity, vec2<f32>(lattice_vector[i]));
                    let equilibrium = lattice_weight[i] * density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);
                
                    // BGK collision
                    let distribution_update = (1.0 - relaxation_frequency) * f[i] + relaxation_frequency * equilibrium + (1.0 - relaxation_frequency / 2.0) * F[i];
                    store_component_value(distribution, index, i, distribution_update);
                }
            }
        }
    }
}