struct Input {
  @location(VERTEX_INDEX) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
  @location(RENDER_INDEX) color: vec4<f32>
};

@group(GROUP_INDEX) @binding(XVELOCITY) var vel_x: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(YVELOCITY) var vel_y: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(XMAP) var eta_x: texture_storage_2d<FORMAT, read_write>;
@group(GROUP_INDEX) @binding(YMAP) var eta_y: texture_storage_2d<FORMAT, read_write>;

const size: vec2<f32> = vec2<f32>(WIDTH, HEIGHT);

fn get_reference_map(x: vec2<i32>) -> vec2<f32> {
    return vec2<f32>(textureLoad(eta_x, x).x, textureLoad(eta_y, x).x);
}

fn get_velocity_field(x: vec2<i32>) -> vec2<f32> {
    return vec2<f32>(textureLoad(vel_x, x).x, textureLoad(vel_y, x).x);
}

fn velocity_map(v: vec2<f32>) -> vec4<f32> {
  
    let angle = atan2(v.y, v.x);
    let norm = length(v);

    return vec4<f32>(
        0.5 + 0.5 * cos(angle),
        0.5 + 0.5 * cos(angle + 2.094),
        0.5 + 0.5 * cos(angle + 4.188),
        norm
    );
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
  
    let x = vec2<i32>((1 + input.coordinate) / 2 * size);
    let v = get_velocity_field(x);

    output.color = velocity_map(v);    
    return output;
}