struct Input {
  @builtin(global_invocation_id) position: vec3<u32>,
};

@group(0) @binding(1) var inputState: texture_storage_2d<r32float, read>;
@group(0) @binding(2) var outputState: texture_storage_2d<r32float, write>;

fn state(position: vec2<i32>) -> u32 {
    return u32(textureLoad(inputState, position).r);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let position = vec2<i32>(input.position.xy);
    let boundary = vec2<i32>(textureDimensions(inputState));
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
    var next_state: f32;
    switch neighbors {
        case 2: {
            next_state = f32(state(position));
        }
        case 3: {
            next_state = 1.0;
        }
        default: {
            next_state = 0.0;
        }
    }
    var color = vec4<f32>(next_state, next_state, next_state, 1.0);
    textureStore(outputState, position, color);
}