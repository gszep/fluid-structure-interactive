#import includes::bindings
#import includes::cache

const EPS = 1e-37;
const I = mat2x2<f32>(1.0, 0.0, 0.0, 1.0);

struct Interaction {
    position: vec2<f32>,
    size: f32,
};

struct State {
    f: array<f32, 9>,
    density: f32,
    velocity: vec2<f32>,
};

struct Partials {
    x: mat2x2<f32>,
    y: mat2x2<f32>,
};

const lattice_vector = array<vec2<i32>, 9>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(-1, 0), vec2<i32>(0, -1), vec2<i32>(1, 1), vec2<i32>(-1, 1), vec2<i32>(-1, -1), vec2<i32>(1, -1));
const lattice_weight = array<f32, 9>(4.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 9.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0, 1.0 / 36.0);

@group(GROUP_INDEX) @binding(DISTRIBUTION)
var distribution: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(DEFORMATION)
var deformation: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(STRESS)
var stress: texture_storage_2d_array<r32float, read_write>;

@group(GROUP_INDEX) @binding(INTERACTION)
var<uniform> interaction: Interaction;

fn load_macroscopics_cache(id: Invocation) {
    load_cache_mat2x2(id, 0u, deformation);
    load_cache_mat2x2(id, 1u, stress);
}

fn get_deformation(index: Index) -> mat2x2<f32> {
    return cached_value_mat2x2(0u, index.local);
}

fn get_stress(index: Index) -> mat2x2<f32> {
    return cached_value_mat2x2(1u, index.local);
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

fn get_force(index: Index) -> vec2<f32> {

    let dx_s = get_stress(add(index, dx)) - get_stress(sub(index, dx));
    let dy_s = get_stress(add(index, dy)) - get_stress(sub(index, dy));

    var force = vec2<f32>(dx_s[0][0] + dy_s[0][1], dx_s[1][0] + dy_s[1][1]) / 2.0;
    
    let x = vec2<f32>(index.global);
    let y = interaction.position + sign(interaction.size);

    let dims = vec2<f32>(canvas.size);
    let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

    if distance < abs(interaction.size) {
        force += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
    }
    return force;
}

fn get_deformation_partials(index: Index, v: vec2<f32>) -> Partials {

    var partial_x: mat2x2<f32>;
    if (v.x > 0.0) {
        partial_x = 1.5*get_deformation(index) - 2*get_deformation(sub(index,dx)) + 0.5*get_deformation(sub(index,2*dx));
    } else {
        partial_x = -1.5*get_deformation(index) + 2*get_deformation(add(index,dx)) - 0.5*get_deformation(add(index,2*dx));
    }

    var partial_y: mat2x2<f32>;
    if (v.y > 0.0) {
        partial_y = 1.5*get_deformation(index) - 2*get_deformation(sub(index,dy)) + 0.5*get_deformation(sub(index,2*dy));
    } else {
        partial_y = -1.5*get_deformation(index) + 2*get_deformation(add(index,dy)) - 0.5*get_deformation(add(index,2*dy));
    }

    return Partials(partial_x, partial_y);
}

fn get_state(index: Index) -> State {
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
    return State(f, density, velocity);
}

fn get_velocity(index: Index) -> vec2<f32> {
    let state = get_state(index);
    return state.velocity;
}

fn get_velocity_jacobian(index: Index) -> mat2x2<f32> {
    let dx_v = (get_velocity(add(index, dx)) - get_velocity(sub(index, dx))) / 2.0;
    let dy_v = (get_velocity(add(index, dy)) - get_velocity(sub(index, dy))) / 2.0;
    return mat2x2<f32>(dx_v, dy_v);
}

fn constitutive_law(F: mat2x2<f32>, g:f32, kappa:f32) -> mat2x2<f32> {
    const third = 1.0 / 3.0;

    let J = max(determinant(F), EPS);
    let B = F * transpose(F);

    return g * pow(J, -5.0 / 3.0) * (B - third * I * trace(B)) + kappa * (J - 1) * I;
}

fn trace(A: mat2x2<f32>) -> f32 {
    return A[0][0] + A[1][1];
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn lattice_boltzmann(id: Invocation) {

    load_macroscopics_cache(id);
    load_distribution_cache(id);
    workgroupBarrier();

    let g = 0.0; // small-strain shear modulus
    let kappa = 3*g; // bulk modulus

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                let v = get_velocity(index);
                let dv = get_velocity_jacobian(index);

                let f = get_deformation(index);
                let df = get_deformation_partials(index, v);

                let F = f - (v.x * df.x + v.y * df.y);

                // F[0] += F[0] * dv[0][0] + F[1] * dv[1][0];
                // F[1] += F[0] * dv[0][1] + F[1] * dv[1][1];
                // F[2] += F[2] * dv[0][0] + F[3] * dv[1][0];
                // F[3] += F[2] * dv[0][1] + F[3] * dv[1][1];

                var sigma = constitutive_law(F, g, kappa);

                store_component_value(deformation, index, 0, F[0][0]);
                store_component_value(deformation, index, 1, F[0][1]);
                store_component_value(deformation, index, 2, F[1][0]);
                store_component_value(deformation, index, 3, F[1][1]);

                store_component_value(stress, index, 0, sigma[0][0]);
                store_component_value(stress, index, 1, sigma[0][1]);
                store_component_value(stress, index, 2, sigma[1][0]);
                store_component_value(stress, index, 3, sigma[1][1]);
            }
        }
    }

    load_distribution_cache(id);
    workgroupBarrier();

    let relaxation_frequency = 1.8; // between 0.0 and 2.0

    for (var tile_x = 0u; tile_x < TILE_SIZE; tile_x++) {
        for (var tile_y = 0u; tile_y < TILE_SIZE; tile_y++) {

            let index = get_index(id, tile_x, tile_y);
            if check_bounds(index) {

                // read distribution from neighbors
                let state = get_state(index);

                // include external forces
                let speed = length(state.velocity);
                let F = get_force_distribution(index, state.velocity);

                for (var i = 0; i < 9; i++) {

                    // compute distribution equilibrium
                    let lattice_speed = dot(state.velocity, vec2<f32>(lattice_vector[i]));
                    let equilibrium = lattice_weight[i] * state.density * (1.0 + 3.0 * lattice_speed + 4.5 * lattice_speed * lattice_speed - 1.5 * speed * speed);
                
                    // BGK collision
                    let distribution_update = (1.0 - relaxation_frequency) * state.f[i] + relaxation_frequency * equilibrium + (1.0 - relaxation_frequency / 2.0) * F[i];
                    store_component_value(distribution, index, i, distribution_update);
                }
            }
        }
    }
}