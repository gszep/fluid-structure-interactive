struct Input {
    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
    @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(DEBUG) var debug: texture_storage_2d<FORMAT, read_write>;

const size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>((1.0 + input.coordinate) / 2.0 * size);

    let v = textureLoad(debug, x).r;

    let black = vec3<f32>(0.0, 0.0, 0.0);
    let sodium_lamp = vec3<f32>(1.0, 0.7, 0.2);
    let white = vec3<f32>(1.0, 1.0, 1.0);

    var color = mix(black, sodium_lamp, smoothstep(0.0, 0.5, v));
    color = mix(color, white, smoothstep(0.5, 1.0, v));

    output.color = vec4<f32>(color, 1.0);
    return output;
}