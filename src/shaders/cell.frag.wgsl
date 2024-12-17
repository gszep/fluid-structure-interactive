struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(READ_BINDING) var state: texture_2d<f32>;

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    const level: i32 = 0;

    let uv = vec2<u32>(input.coordinate * vec2<f32>(textureDimensions(state)));
    output.color = textureLoad(state, uv, level);

    return output;
}