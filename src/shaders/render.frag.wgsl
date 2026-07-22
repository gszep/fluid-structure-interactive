#import includes::common

// Visualization: fluid vorticity (warm/cool glow) and the solid, shaded with
// its deformed reference-space grid.

struct Input {
    @location(0) @interpolate(linear, center) coordinate: vec2<f32>,
};

struct Output {
    @location(0) color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var xi_tex: texture_2d<f32>;
@group(0) @binding(2) var f_tex: texture_2d_array<f32>;

fn velocity(x: vec2<i32>) -> vec2<f32> {
    var rho = 0.0;
    var mom = vec2<f32>(0.0);
    for (var i = 0; i < 9; i++) {
        let fi = textureLoad(f_tex, wrap_i(x), i, 0).r;
        rho += fi;
        mom += fi * vec2<f32>(C[i]);
    }
    return mom / max(rho, EPS);
}

@fragment
fn main(input: Input) -> Output {
    var output: Output;
    let x = vec2<i32>(vec2<f32>(params.size) * (0.5 * input.coordinate + 0.5));

    // fluid: vorticity + a hint of speed
    let vort = 0.5 * ((velocity(x + vec2(1, 0)).y - velocity(x - vec2(1, 0)).y)
                    - (velocity(x + vec2(0, 1)).x - velocity(x - vec2(0, 1)).x));
    let speed = length(velocity(x));

    var color = vec3<f32>(0.03, 0.04, 0.06);
    let xi = xi_at(x);
    let phi = level_set_at(xi, vec2<f32>(x));

    // vorticity glow, faded near the interface where it only shows
    // single-cell blur-zone dither
    let fade = smoothstep(0.0, 3.0 * params.epsilon, phi);
    let w = clamp(vort * 150.0, -1.0, 1.0) * fade;
    color += max(w, 0.0) * vec3<f32>(0.9, 0.25, 0.1);
    color += max(-w, 0.0) * vec3<f32>(0.1, 0.4, 0.9);
    color += min(speed * 3.0, 0.5) * fade * vec3<f32>(0.25, 0.25, 0.3);

    // solid: a crisp edge (sharpened solid fraction) shaded with its
    // (deformed) reference-space grid
    let lambda = smoothstep(0.3, 0.7, solid_fraction(phi));
    if (lambda > 0.0) {
        let X = reference_coord(xi);
        let g = cos(X.x * PI / 4.0) * cos(X.y * PI / 4.0);
        let grid = smoothstep(-0.3, 0.3, g);
        let solid_color = mix(vec3<f32>(0.85, 0.35, 0.08), vec3<f32>(1.0, 0.8, 0.25), grid);
        color = mix(color, solid_color, lambda);
    }

    output.color = vec4<f32>(color, 1.0);
    return output;
}
