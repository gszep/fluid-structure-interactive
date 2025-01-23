struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;

const size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1 + input.coordinate) / 2 * size);

    // vorticity map
    let omega = textureLoad(omega, x);
    output.color.g = 5 * max(0, omega.r);
    output.color.r = 5 * max(0, -omega.r);

    // stream function map
    let phi = textureLoad(phi, x);
    // output.color.b = abs(phi.r);

    // debug map
    // let debug = textureLoad(debug, x);
    output.color.a = 1;
    return output;
}