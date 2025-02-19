#import includes::bindings

struct Input {
    @builtin(instance_index) instance: u32,
    @location(VERTEX_INDEX) position: vec2<f32>,
};

struct Output {
    @builtin(position) position: vec4<f32>,
    @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

@vertex
fn main(input: Input) -> Output {
    var output: Output;

    output.position.x = input.position.x;
    output.position.y = -input.position.y;

    output.position.z = 0.0;
    output.position.w = 1.0;

    output.coordinate = input.position;
    return output;
}