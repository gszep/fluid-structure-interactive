struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(READ_BINDING) var state: texture_storage_2d<FORMAT, read>;

@fragment
fn main(input: Input) -> Output {
    var output: Output;

    let uv = vec2<u32>(input.coordinate * vec2<f32>(textureDimensions(state)));
    output.color = textureLoad(state, uv);

    return output;
}