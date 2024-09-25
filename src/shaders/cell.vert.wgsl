struct Input {
  @location(0) pos: vec2<f32>,
  @builtin(instance_index) instance: u32,
};

struct Output {
  @builtin(position) pos: vec4<f32>,
  @location(0) cell: vec2<f32>,
};

@group(0) @binding(0) var<uniform> grid: vec2<f32>;
@group(0) @binding(1) var<storage> cellState: array<u32>;

@vertex
fn main(input: Input) -> Output {

    let i = f32(input.instance);
    let cell = vec2<f32>(i % grid.x, floor(i / grid.x));
    let state = f32(cellState[input.instance]);

    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos * state + 1) / grid - 1 + cellOffset;

    var output: Output;
    output.pos = vec4<f32>(gridPos, 0, 1);
    output.cell = cell;
    return output;
}