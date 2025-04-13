#import includes::bindings
#import includes::cache

const EPS = 1e-37;
struct Interaction {
    position: vec2<f32>,
    size: f32,
};

struct State {
    f: array<f32, 9>,
    density: f32,
    velocity: vec2<f32>,
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
    load_cache_vec4(id, 0u, deformation);
    load_cache_vec4(id, 1u, stress);
}

fn get_deformation_gradient(index: Index) -> vec4<f32> {
    return cached_value_vec4(0u, index.local);
}

fn get_cauchy_stress(index: Index) -> vec4<f32> {
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

fn get_force(index: Index) -> vec2<f32> {

    let dx_s = (get_cauchy_stress(add(index, dx)) - get_cauchy_stress(sub(index, dx))) / 2.0;
    let dy_s = (get_cauchy_stress(add(index, dy)) - get_cauchy_stress(sub(index, dy))) / 2.0;

    var force = vec2<f32>(dx_s[0] + dy_s[1], dx_s[2] + dy_s[3]);
    
    let x = vec2<f32>(index.global);
    let y = interaction.position + sign(interaction.size);

    let dims = vec2<f32>(canvas.size);
    let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));

    if distance < abs(interaction.size) {
        force += 0.01 * sign(interaction.size) * exp(- distance * distance / abs(interaction.size));
    }
    return force;
}

fn advect_deformation_gradient(index: Index) -> vec4<f32> {
    const max_norm = f32(HALO_SIZE);

    let velocity = get_velocity(index);
    let norm = length(velocity);

    return upwinding(index, (velocity / max(norm, EPS)) * min(norm, max_norm));
}

fn upwinding(index: Index, v: vec2<f32>) -> vec4<f32> {
    let F = get_deformation_gradient(index);

    var dx_F:  vec4<f32>;
    if (v.x > 0.0) {
        dx_F = 3*F - 4*get_deformation_gradient(sub(index,dx)) + get_deformation_gradient(sub(index,2*dx));
    } else {
        dx_F = -3*F + 4*get_deformation_gradient(add(index,dx)) - get_deformation_gradient(add(index,2*dx));
    }

    var dy_F:  vec4<f32>;
    if (v.y > 0.0) {
        dy_F = 3*F - 4*get_deformation_gradient(sub(index,dy)) + get_deformation_gradient(sub(index,2*dy));
    } else {
        dy_F = -3*F + 4*get_deformation_gradient(add(index,dy)) - get_deformation_gradient(add(index,2*dy));
    }

    return -(v.x * dx_F + v.y * dy_F) / 2;
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

fn constitutive_law(F: vec4<f32>, g:f32, kappa:f32) -> vec4<f32> {
    let I = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    let J = max(F[0] * F[3] - F[1] * F[2], EPS);
    let B = vec4<f32>(
        F[0] * F[0] + F[1] * F[1],
        F[0] * F[2] + F[1] * F[3],
        F[2] * F[0] + F[3] * F[1],
        F[2] * F[2] + F[3] * F[3]
    );

    return g * pow(J,-5/3) * (B - I/3 * (B[0] + B[3])) + kappa * (J - 1) * I;
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

                var F = get_deformation_gradient(index);
                F += advect_deformation_gradient(index);

                let dv = get_velocity_jacobian(index);
                F[0] += F[0] * dv[0][0] + F[1] * dv[1][0];
                F[1] += F[0] * dv[0][1] + F[1] * dv[1][1];
                F[2] += F[2] * dv[0][0] + F[3] * dv[1][0];
                F[3] += F[2] * dv[0][1] + F[3] * dv[1][1];

                var sigma = constitutive_law(F, g, kappa);

                for (var i = 0; i < 4; i++) {
                    store_component_value(deformation, index, i, F[i]);
                    store_component_value(stress, index, i, sigma[i]);
                }
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