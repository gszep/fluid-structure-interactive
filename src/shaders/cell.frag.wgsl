struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(READ_BINDING) var F: texture_2d<f32>;
@group(GROUP_INDEX) @binding(SAMPLER_BINDING) var Sampler: sampler;

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let F = textureSample(F, Sampler, (1 + input.coordinate) / 2);

    // vorticity map
    output.color.g = 5 * max(0, F.w);
    output.color.r = 5 * max(0, -F.w);

    // stream function map
    // output.color.b = abs(F.z);

    output.color.a = 1;//F.x;
    return output;
}