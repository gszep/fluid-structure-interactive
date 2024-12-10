struct Input {
  @builtin(global_invocation_id) position: vec3<u32>,
};

@group(0) @binding(0) var inputState: texture_storage_2d<FORMAT, read>;
@group(0) @binding(1) var outputState: texture_storage_2d<FORMAT, write>;

fn state(position: vec2<i32>) -> vec4<f32> {
    return textureLoad(inputState, position);
}

@compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
fn main(input: Input) {

    let position = vec2<i32>(input.position.xy);
    let boundary = vec2<i32>(textureDimensions(inputState));
    var neighbors = vec4<u32>(0, 0, 0, 0);

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
            neighbors += vec4<u32>(state((position + dI) % boundary));
        }
    }

    // Conway's game of life rules
    var next_state = vec4<f32>(0, 0, 0, 0);
    for (var k: i32 = 0; k < 4; k = k + 1) {
        switch neighbors[k] {
            case 2: {
                next_state[k] = state(position)[k];
            }
            case 3: {
                next_state[k] = 1;
            }
            default: {
                next_state[k] = 0;
            }
        }
    }
    textureStore(outputState, position, next_state);
}