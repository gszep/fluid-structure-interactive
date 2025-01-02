struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(VORTICITY) var W: texture_storage_2d<FORMAT, read_write>;
const size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);

@fragment
fn main(input: Input) -> Output {
    var output: Output;

    let x = vec2<i32>((1 + input.coordinate) / 2 * size);

    // vorticity map
    output.color.r = textureLoad(W, x).r;
    // output.color.r = 5 * max(0, -F.w);

    // stream function map
    // output.color.b = abs(F.z);

    output.color.a = 1;//F.x;
    return output;
}