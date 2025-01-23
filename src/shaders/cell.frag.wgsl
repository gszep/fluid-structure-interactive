struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(VORTICITY) var omega: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(STREAMFUNCTION) var phi: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(XMAP) var eta_x: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(YMAP) var eta_y: texture_storage_2d<FORMAT, read_write>;

const size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);

fn get_reference_map(x: vec2<i32>) -> vec2<f32> {
    return vec2<f32>(textureLoad(eta_x, x).x, textureLoad(eta_y, x).x);
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1 + input.coordinate) / 2 * size);

    // reference map
    let eta = get_reference_map(x);
    let norm = sqrt(dot(eta, eta));

    let w = 1 - exp(-abs((norm - 0.5) / 0.02));
    output.color.a = w;

    // vorticity map
    let omega = textureLoad(omega, x);
    output.color.b = 5 * max(0, omega.r);
    output.color.g = 5 * max(0, -omega.r);
    output.color.r = output.color.b - output.color.g;

    output.color.g = tanh(output.color.b);
    output.color.r = 0.15;

    // conditionally add speckles
    let speckle = 0.1 * (fract(eta.x * 1000) + fract(eta.y * 100));
    output.color.r += speckle;



    // stream function map
    let phi = textureLoad(phi, x);
    // output.color.b = abs(phi.r);

    // debug map
    // let debug = textureLoad(debug, x);
    // output.color.a = 1;
    return output;
}