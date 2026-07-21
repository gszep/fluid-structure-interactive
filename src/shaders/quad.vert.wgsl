struct Output {
    @builtin(position) position: vec4<f32>,
    @location(0) @interpolate(linear, center) coordinate: vec2<f32>,
};

@vertex
fn main(@location(0) position: vec2<f32>) -> Output {
    var output: Output;
    output.position = vec4<f32>(position.x, -position.y, 0.0, 1.0);
    output.coordinate = position;
    return output;
}
