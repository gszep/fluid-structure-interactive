struct Input {
  @location(0) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(0) color: vec4<f32>
};

@group(0) @binding(1) var state: texture_storage_2d<r32float, read>;

@fragment
fn main(input: Input) -> Output {
    var output: Output;

    let uv = vec2<u32>(input.coordinate * vec2<f32>(textureDimensions(state)));
    output.color = textureLoad(state, uv);

    return output;
}