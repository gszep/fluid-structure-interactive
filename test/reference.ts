// CPU reference implementation of the LBRMT solver.
//
// This mirrors src/shaders/lbrmt.comp.wgsl line-for-line (advect + collide
// passes) so that solver physics can be tested without a GPU. Any change to
// the WGSL must be reflected here.

export const C: number[][] = [
	[0, 0],
	[1, 0], [0, 1], [-1, 0], [0, -1],
	[1, 1], [-1, 1], [-1, -1], [1, -1],
];
export const WEIGHTS: number[] = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];

export const wrap = (x: number, n: number): number => ((x % n) + n) % n;
export const unwrap = (v: number, ref: number, n: number): number => v - n * Math.round((v - ref) / n);

export function capsule(px: number, py: number, hl: number, r: number): number {
	const qx = Math.abs(px) - hl;
	return (qx < 0 ? Math.abs(py) : Math.hypot(qx, py)) - r;
}

/** Three-pronged smooth rotor (lbrmt obj_smooth_rotor::phi). */
export function smoothRotor(px: number, py: number, l: number, r: number, s: number): number {
	let X = px;
	let Y = Math.abs(py);
	if (X * -0.8660254 + Y * 0.5 > 0) {
		const yy = Math.abs(X * -0.8660254 + Y * -0.5);
		X = X * -0.5 + Y * 0.8660254;
		Y = yy;
	}
	const q = (r + s) * 0.57735027;
	if (X > l) return Math.hypot(X - l, Y) - r;
	if (X > q) return Y - r;
	return s - Math.hypot(X - q, Y - r - s);
}

/** Seven-pointed star with tips at distance cr (lbrmt obj_seven_point::phi). */
export function sevenStar(px: number, py: number, cr: number): number {
	const fac = (2 * Math.PI) / 7;
	let theta = Math.abs(Math.atan2(py, px));
	const R = Math.hypot(px, py);
	theta = Math.abs(theta - fac * Math.round(theta / fac));
	const X = R * Math.cos(theta) - cr;
	const Y = R * Math.sin(theta);
	const c = Math.cos(0.25 * fac);
	const s = Math.sin(0.25 * fac);
	return X * c - Y * s > 0 ? Math.hypot(X, Y) : Y * c + X * s;
}

export function eno2(v0: number, v1: number, v2: number, v3: number): number {
	const a = Math.abs(v0 - 2 * v1 + v2);
	const b = Math.abs(v1 - 2 * v2 + v3);
	return a < b ? 0.5 * (v0 - v2) : 1.5 * v1 - 2 * v2 + 0.5 * v3;
}

export function equilibrium(rho: number, u: number, v: number): number[] {
	const usq = u * u + v * v;
	const feq = new Array(9);
	for (let i = 0; i < 9; i++) {
		const cu = C[i][0] * u + C[i][1] * v;
		feq[i] = WEIGHTS[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * usq);
	}
	return feq;
}

export interface SolverParams {
	width?: number;
	height?: number;
	tau?: number;
	G?: number;
	kappa?: number;
	epsilon?: number;
	cx?: number;
	cy?: number;
	halfLength?: number;
	radius?: number;
	muscleHalfLength?: number;
	muscleRadius?: number;
	actuationAmp?: number;
	actuationFreq?: number;
	forceClamp?: number;
	velocityClamp?: number;
	externalForce?: ExternalForce | null;
	shape?: number;
	pivotRadius?: number;
	spinAngle?: number;
	spinFreq?: number;
}

export type ExternalForce = (x: number, y: number, step: number) => [number, number];

export interface Diagnostics {
	meanDensity: number;
	maxVelocity: number;
	solidArea: number;
	centroid: [number, number];
	invalid: number;
}

export class Solver {
	width!: number;
	height!: number;
	tau!: number;
	G!: number;
	kappa!: number;
	epsilon!: number;
	cx!: number;
	cy!: number;
	halfLength!: number;
	radius!: number;
	muscleHalfLength!: number;
	muscleRadius!: number;
	actuationAmp!: number;
	actuationFreq!: number;
	forceClamp!: number;
	velocityClamp!: number;
	externalForce!: ExternalForce | null;
	shape!: number;
	pivotRadius!: number;
	spinAngle!: number;
	spinFreq!: number;
	xiX!: Float32Array;
	xiY!: Float32Array;
	f!: Float32Array[];
	step_!: number;

	constructor(params: SolverParams) {
		const defaults = {
			width: 96,
			height: 64,
			tau: 0.8,
			G: 0.04,
			kappa: 0.12,
			epsilon: 2.0,
			cx: 48,
			cy: 32,
			halfLength: 6,
			radius: 2,
			muscleHalfLength: 4,
			muscleRadius: 1,
			actuationAmp: 0,
			actuationFreq: 2 * Math.PI / 500,
			forceClamp: 0.1,
			velocityClamp: 0.25,
			externalForce: null, // (x, y, step) => [Fx, Fy]
			shape: 0, // 0 = capsule flapper, 1 = seven-pointed rotor
			pivotRadius: 4,
			spinAngle: Math.PI,
			spinFreq: (2 * Math.PI) / 3000,
		};
		Object.assign(this, defaults, params);

		const n = this.width * this.height;
		this.xiX = new Float32Array(n);
		this.xiY = new Float32Array(n);
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				this.xiX[y * this.width + x] = x;
				this.xiY[y * this.width + x] = y;
			}
		this.f = Array.from({ length: 9 }, (_, i) => new Float32Array(n).fill(WEIGHTS[i]));
		this.step_ = 0;
	}

	idx(x: number, y: number): number {
		return wrap(y, this.height) * this.width + wrap(x, this.width);
	}

	/** Initialize populations to equilibrium of a given macroscopic state. */
	setHydro(fn: (x: number, y: number) => [number, number, number]): void {
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				const [rho, u, v] = fn(x, y);
				const feq = equilibrium(rho, u, v);
				for (let i = 0; i < 9; i++) this.f[i][y * this.width + x] = feq[i];
			}
	}

	/** Override the reference map. */
	setReferenceMap(fn: (x: number, y: number) => [number, number]): void {
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				const [X, Y] = fn(x, y);
				this.xiX[y * this.width + x] = X;
				this.xiY[y * this.width + x] = Y;
			}
	}

	refCoord(X: number, Y: number): [number, number] {
		return [unwrap(X - this.cx, 0, this.width), unwrap(Y - this.cy, 0, this.height)];
	}

	/** Offset to the nearest rotor centre in the 2x2 lattice, and that row's
	 * spin direction (top row counter-clockwise, bottom clockwise). */
	rotorLattice(px: number, py: number): [number, number, number] {
		const pitchX = this.width / 2, pitchY = this.height / 2;
		const kx = Math.round(px / pitchX), ky = Math.round(py / pitchY);
		const row = ((ky % 2) + 2) % 2;
		return [px - kx * pitchX, py - ky * pitchY, row === 1 ? -1 : 1];
	}

	levelSet(X: number, Y: number): number {
		let [a, b] = this.refCoord(X, Y);
		if (this.shape === 1) return sevenStar(a, b, this.halfLength);
		if (this.shape === 2) {
			const [ra, rb] = this.rotorLattice(a, b);
			return smoothRotor(ra, rb, this.halfLength, this.radius, this.muscleRadius);
		}
		return capsule(a, b, this.halfLength, this.radius);
	}

	solidFraction(phi: number): number {
		if (phi >= this.epsilon) return 0;
		if (phi <= -this.epsilon) return 1;
		const t = phi / this.epsilon;
		return 0.5 - 0.5 * t - Math.sin(Math.PI * t) / (2 * Math.PI);
	}

	pull(x: number, y: number): number[] {
		const out = new Array(9);
		for (let i = 0; i < 9; i++) out[i] = this.f[i][this.idx(x - C[i][0], y - C[i][1])];
		return out;
	}

	moments(f: number[]): [number, number, number] {
		let rho = 0, mx = 0, my = 0;
		for (let i = 0; i < 9; i++) {
			rho += f[i];
			mx += f[i] * C[i][0];
			my += f[i] * C[i][1];
		}
		return [rho, mx, my];
	}

	velocity(x: number, y: number): [number, number] {
		const [rho, mx, my] = this.moments(this.pull(x, y));
		return [mx / Math.max(rho, 1e-6), my / Math.max(rho, 1e-6)];
	}

	contraction(): number {
		const s = Math.sin(this.actuationFreq * this.step_);
		return -this.actuationAmp * s * s;
	}

	clampMag(vx: number, vy: number, m: number): [number, number] {
		const l = Math.hypot(vx, vy);
		return l > m ? [vx * m / l, vy * m / l] : [vx, vy];
	}

	edgeStress(Xx: number, Xy: number, Yx: number, Yy: number, Xe: number, Ye: number, phiE: number, con: number): number[][] {
		const sf = this.solidFraction(phiE);
		if (sf <= 0) return [[0, 0], [0, 0]];
		const det = Xx * Yy - Xy * Yx;
		if (Math.abs(det) < 1e-3) return [[0, 0], [0, 0]];
		let F11 = Yy / det, F12 = -Xy / det, F21 = -Yx / det, F22 = Xx / det;

		if (this.shape === 0) {
			const [Xr, Yr] = this.refCoord(Xe, Ye);
			const muscle = this.solidFraction(capsule(Xr, Yr, this.muscleHalfLength, this.muscleRadius));
			const fac = Math.min(2, Math.max(0.5, Math.exp(con * Yr * muscle)));
			F11 *= fac; F21 *= fac; F12 /= fac; F22 /= fac;
		}

		const J = Math.min(10, Math.max(0.1, 1 / det));
		const B11 = F11 * F11 + F12 * F12;
		const B12 = F11 * F21 + F12 * F22;
		const B22 = F21 * F21 + F22 * F22;
		const tr = (B11 + B22 + 1) / 3;
		return [
			[sf * (this.G * (B11 - tr) + this.kappa * (J - 1)), sf * this.G * B12],
			[sf * this.G * B12, sf * (this.G * (B22 - tr) + this.kappa * (J - 1))],
		];
	}

	/** Divergence of the solid stress at node (x, y) from the xi field. */
	solidForce(x: number, y: number, con: number): [number, number] {
		const { width: W, height: H } = this;
		const k = y * W + x, cX = this.xiX[k], cY = this.xiY[k];
		const nb = (dx: number, dy: number): [number, number] => {
			const kk = this.idx(x + dx, y + dy);
			return [unwrap(this.xiX[kk], cX, W), unwrap(this.xiY[kk], cY, H)];
		};
		const cc = nb(0, 0), ll = nb(-1, 0), rr = nb(1, 0), uu = nb(0, 1), dd = nb(0, -1);
		const ul = nb(-1, 1), ur = nb(1, 1), dl = nb(-1, -1), dr = nb(1, -1);
		const phi = (p: [number, number]) => this.levelSet(p[0], p[1]);

		const sL = this.edgeStress(
			cc[0] - ll[0], 0.25 * (uu[0] + ul[0] - dd[0] - dl[0]),
			cc[1] - ll[1], 0.25 * (uu[1] + ul[1] - dd[1] - dl[1]),
			0.5 * (cc[0] + ll[0]), 0.5 * (cc[1] + ll[1]), 0.5 * (phi(cc) + phi(ll)), con);
		const sR = this.edgeStress(
			rr[0] - cc[0], 0.25 * (ur[0] + uu[0] - dr[0] - dd[0]),
			rr[1] - cc[1], 0.25 * (ur[1] + uu[1] - dr[1] - dd[1]),
			0.5 * (rr[0] + cc[0]), 0.5 * (rr[1] + cc[1]), 0.5 * (phi(rr) + phi(cc)), con);
		const sB = this.edgeStress(
			0.25 * (rr[0] + dr[0] - ll[0] - dl[0]), cc[0] - dd[0],
			0.25 * (rr[1] + dr[1] - ll[1] - dl[1]), cc[1] - dd[1],
			0.5 * (cc[0] + dd[0]), 0.5 * (cc[1] + dd[1]), 0.5 * (phi(cc) + phi(dd)), con);
		const sT = this.edgeStress(
			0.25 * (ur[0] + rr[0] - ul[0] - ll[0]), uu[0] - cc[0],
			0.25 * (ur[1] + rr[1] - ul[1] - ll[1]), uu[1] - cc[1],
			0.5 * (uu[0] + cc[0]), 0.5 * (uu[1] + cc[1]), 0.5 * (phi(uu) + phi(cc)), con);

		let Fx = (sR[0][0] - sL[0][0]) + (sT[0][1] - sB[0][1]);
		let Fy = (sR[1][0] - sL[1][0]) + (sT[1][1] - sB[1][1]);
		if (this.shape >= 1) {
			// rotor drive: spring toward the rotated reference position
			let xrelX = unwrap(x - this.cx, 0, this.width);
			let xrelY = unwrap(y - this.cy, 0, this.height);
			let [X, Y] = this.refCoord(cX, cY);
			let spin = 1;
			if (this.shape === 2) {
				[xrelX, xrelY, spin] = this.rotorLattice(xrelX, xrelY);
				[X, Y] = this.rotorLattice(X, Y);
			}
			const pr = this.pivotRadius + this.epsilon;
			if (xrelX * xrelX + xrelY * xrelY < pr * pr) {
				const theta = spin * this.spinAngle * (1 - Math.cos(this.spinFreq * this.step_));
				const ct = Math.cos(theta), st = Math.sin(theta);
				const rx = X * ct - Y * st;
				const ry = X * st + Y * ct;
				const lam = this.solidFraction(this.levelSet(cX, cY));
				Fx += -0.01 * lam * (xrelX - rx);
				Fy += -0.01 * lam * (xrelY - ry);
			}
		}
		if (this.externalForce) {
			const [ex, ey] = this.externalForce(x, y, this.step_);
			Fx += ex;
			Fy += ey;
		}
		return this.clampMag(Fx, Fy, this.forceClamp);
	}

	/** Force-corrected macroscopic velocity (Guo), used for advection and collision. */
	hydroVelocity(x: number, y: number, Fx: number, Fy: number): [number, number, number] {
		const [rho0, mx, my] = this.moments(this.pull(x, y));
		const rho = Math.max(rho0, 1e-6);
		const [u, v] = this.clampMag((mx + 0.5 * Fx) / rho, (my + 0.5 * Fy) / rho, this.velocityClamp);
		return [rho, u, v];
	}

	advance(): void {
		const { width: W, height: H } = this;
		const con = this.contraction();
		// ---- pass 1: advect xi (with the half-force corrected velocity) ----
		const nxiX = new Float32Array(W * H), nxiY = new Float32Array(W * H);
		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				const [Fx, Fy] = this.solidForce(x, y, con);
				const [, u, v] = this.hydroVelocity(x, y, Fx, Fy);
				const k = y * W + x, cX = this.xiX[k], cY = this.xiY[k];
				const g = (dx: number, dy: number, c: number, arr: Float32Array, n: number) => unwrap(arr[this.idx(x + dx, y + dy)], c, n);
				const XR1 = g(1, 0, cX, this.xiX, W), XR2 = g(2, 0, cX, this.xiX, W);
				const XL1 = g(-1, 0, cX, this.xiX, W), XL2 = g(-2, 0, cX, this.xiX, W);
				const XU1 = g(0, 1, cX, this.xiX, W), XU2 = g(0, 2, cX, this.xiX, W);
				const XD1 = g(0, -1, cX, this.xiX, W), XD2 = g(0, -2, cX, this.xiX, W);
				const YR1 = g(1, 0, cY, this.xiY, H), YR2 = g(2, 0, cY, this.xiY, H);
				const YL1 = g(-1, 0, cY, this.xiY, H), YL2 = g(-2, 0, cY, this.xiY, H);
				const YU1 = g(0, 1, cY, this.xiY, H), YU2 = g(0, 2, cY, this.xiY, H);
				const YD1 = g(0, -1, cY, this.xiY, H), YD2 = g(0, -2, cY, this.xiY, H);
				const dXdx = u > 0 ? eno2(XR1, cX, XL1, XL2) : -eno2(XL1, cX, XR1, XR2);
				const dYdx = u > 0 ? eno2(YR1, cY, YL1, YL2) : -eno2(YL1, cY, YR1, YR2);
				const dXdy = v > 0 ? eno2(XU1, cX, XD1, XD2) : -eno2(XD1, cX, XU1, XU2);
				const dYdy = v > 0 ? eno2(YU1, cY, YD1, YD2) : -eno2(YD1, cY, YU1, YU2);
				let nX = cX - (u * dXdx + v * dXdy);
				let nY = cY - (u * dYdx + v * dYdy);
				// far-field smoothing (smoothstep(2e, 6e, phi) * 0.1)
				const phi = this.levelSet(cX, cY);
				const t = Math.min(1, Math.max(0, (phi - this.epsilon) / (2 * this.epsilon)));
				const w = 0.1 * t * t * (3 - 2 * t);
				nX = nX * (1 - w) + w * 0.25 * (XR1 + XL1 + XU1 + XD1);
				nY = nY * (1 - w) + w * 0.25 * (YR1 + YL1 + YU1 + YD1);
				nxiX[k] = nX;
				nxiY[k] = nY;
			}
		this.xiX = nxiX;
		this.xiY = nxiY;

		// ---- pass 2: collide (force from the freshly advected xi) ----
		const nf = Array.from({ length: 9 }, () => new Float32Array(W * H));
		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				const k = y * W + x;
				const [Fx, Fy] = this.solidForce(x, y, con);
				const f = this.pull(x, y);
				const [rho, u, v] = this.hydroVelocity(x, y, Fx, Fy);

				const feq = equilibrium(rho, u, v);
				const itau = 1 / this.tau, fw = 1 - 0.5 * itau;
				for (let i = 0; i < 9; i++) {
					const Fi = WEIGHTS[i] * (
						3 * ((C[i][0] - u) * Fx + (C[i][1] - v) * Fy) +
						9 * (C[i][0] * u + C[i][1] * v) * (C[i][0] * Fx + C[i][1] * Fy));
					nf[i][k] = f[i] - itau * (f[i] - feq[i]) + fw * Fi;
				}
			}
		this.f = nf;
		this.step_++;
	}

	run(steps: number): void {
		for (let s = 0; s < steps; s++) this.advance();
	}

	diagnostics(): Diagnostics {
		let mass = 0, maxv = 0, area = 0, cxm = 0, cym = 0, invalid = 0;
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				const [rho] = this.moments(this.pull(x, y));
				if (!isFinite(rho)) invalid++;
				mass += rho;
				const [u, v] = this.velocity(x, y);
				maxv = Math.max(maxv, Math.hypot(u, v));
				const k = y * this.width + x;
				const lam = this.solidFraction(this.levelSet(this.xiX[k], this.xiY[k]));
				area += lam;
				cxm += lam * unwrap(x, this.cx, this.width);
				cym += lam * unwrap(y, this.cy, this.height);
			}
		return {
			meanDensity: mass / (this.width * this.height),
			maxVelocity: maxv,
			solidArea: area,
			centroid: area > 0 ? [cxm / area, cym / area] : [NaN, NaN],
			invalid,
		};
	}
}
