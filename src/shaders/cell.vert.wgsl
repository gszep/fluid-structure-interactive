struct Input {
  @builtin(instance_index) instance: u32,
  @location(0) position: vec2<f32>,
};

struct Output {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(linear, center) coordinate: vec2<f32>,
};

@vertex
fn main(input: Input) -> Output {
    var output: Output;

    output.position = vec4<f32>(2 * input.position - 1, 0, 1);
    output.coordinate = input.position;

    return output;
}