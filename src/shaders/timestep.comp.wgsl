struct Input {
  @builtin(global_invocation_id) position: vec3<u32>,
};

@group(0) @binding(0) var<uniform> grid: vec2<f32>;
@group(0) @binding(1) var<storage> inputState: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputState: array<u32>;

fn instance_index(position: vec2<i32>) -> i32 {
    return position.y * i32(grid.x) + position.x;
}

fn state(position: vec2<i32>) -> u32 {
    return inputState[instance_index(position)];
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let position = vec2<i32>(input.position.xy);
    let boundary = vec2<i32>(grid);
    var neighbors = 0u;

    var dI = vec2<i32>(0, 0);
    for (var i: i32 = -1; i < 2; i = i + 1) {
        for (var j: i32 = -1; j < 2; j = j + 1) {

            dI.x = i;
            dI.y = j;

            // ignore the current cell
            if dI.x == 0 && dI.y == 0 {
                continue;
            }

            // periodic boundary conditions
            neighbors += state((position + dI) % boundary);
        }
    }

    // Conway's game of life rules
    let i = instance_index(position);
    switch neighbors {
        case 2: {
            outputState[i] = inputState[i];
        }
        case 3: {
            outputState[i] = 1u;
        }
        default: {
            outputState[i] = 0u;
        }
    }
}