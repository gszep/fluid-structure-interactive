struct Input {
  @location(0) cell: vec2<f32>,
};

struct Output {
  @location(0) color: vec4<f32>
};

@group(0) @binding(0) var<uniform> grid: vec2<f32>;

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let color = input.cell / grid;
    output.color = vec4<f32>(color, 1 - color.g, 1);
    return output;
}