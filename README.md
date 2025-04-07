# Interactive Fluid-Structure Simulation

## Bleeding-edge WebGPU

As WebGPU is still in active development, it is likely not yet available in release builds of recent browsers. In particular, chrome users on linux systems must use the following startup flags

```bash
--enable-unsafe-webgpu --enable-features=Vulkan,VulkanFromANGLE,DefaultANGLEVulkan
```

Other methods can be found [here](https://developer.chrome.com/en/docs/web-platform/webgpu/#use).

## References

### Fluid Simulation References

-   Jos Stam Paper : https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf
-   Nvidia GPUGem's Chapter 38 : https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu
-   Jamie Wong's Fluid simulation : https://jamie-wong.com/2016/08/05/webgl-fluid-simulation/
-   PavelDoGreat's Fluid simulation : https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
-   Stam's Stable Fluids : https://pages.cs.wisc.edu/~chaol/data/cs777/stam-stable_fluids.pdf

### WebGPU References

-   WebGPU Official Reference : https://www.w3.org/TR/webgpu/
-   WGSL Official Reference : https://www.w3.org/TR/WGSL/
-   Get started with GPU Compute on the web : https://web.dev/gpu-compute/
-   Raw WebGPU Tutorial : https://alain.xyz/blog/raw-webgpu

## Theoretical Background

Let's begin with the Navier–Stokes and continuity equations for a two-dimensional velocity field $\mathbf{u}=\hat{\mathbf{x}}u+\hat{\mathbf{y}}v$ of an incompressible homogenous non-Newtonian fluid with viscosity law $\eta(\dot\gamma)$ that is only a function of a scalar shear rate $\dot\gamma$

$$
\rho\left(\frac{\partial\mathbf{u}}{\partial t}+\left(\mathbf{u}\cdot\nabla\right)\mathbf{u}\right)
-\nabla\cdot\left(2\eta\mathbf{D}\right)+\nabla p=0\\
\mathrm{where}\quad
\nabla\cdot\mathbf{u}=0\\
\quad\\
\mathbf{D}:=
\frac{1}{2}\begin{pmatrix}
2\frac{\partial u}{\partial x} &
\frac{\partial v}{\partial x}+\frac{\partial u}{\partial y} \\
\frac{\partial v}{\partial x}+\frac{\partial u}{\partial y} &
2\frac{\partial v}{\partial y}
\end{pmatrix}\\
\quad\\
\dot\gamma:=\sqrt{
 \left(\frac{\partial u}{\partial x}\right)^2
+\frac{1}{2}\left(\frac{\partial v}{\partial x}+\frac{\partial u}{\partial y}\right)^2
+\left(\frac{\partial v}{\partial y}\right)^2
}
$$

Taking the curl of this vector equation to obtain a scalar equation for the vorticity $\omega$ allows us to eliminate the pressure term $\nabla p$ and vortex stretching term $\left(\boldsymbol{\omega}\cdot\nabla\right)\mathbf{u}$ since partial derivatives with respect to $z$ vanish

$$
\rho\left(\frac{\partial}{\partial t}+u\frac{\partial}{\partial x}+v\frac{\partial}{\partial y}\right)\omega=\nabla\times\nabla\cdot\left(2\eta\mathbf{D}\right)
\quad\mathrm{where}\quad \omega=\frac{\partial v}{\partial x}-\frac{\partial u}{\partial y}
$$

Without loss of generality we can let the divergence-free velocity field be defined by a stream function $\psi$

$$
u=\frac{\partial\psi}{\partial y}
\qquad
v=-\frac{\partial\psi}{\partial x}
$$

yielding scalar non-linear equations in the vorticity $\omega$ and stream function $\psi$

$$
\omega=-\left(\frac{\partial^2}{\partial x^2}+\frac{\partial^2}{\partial y^2}\right)\psi\\
\rho\left(\frac{\partial}{\partial t}+\frac{\partial\psi}{\partial y}\frac{\partial}{\partial x}-\frac{\partial\psi}{\partial x}\frac{\partial}{\partial y}\right)\omega=\nabla\times\nabla\cdot\left(2\eta\mathbf{D}\right)
\quad\\\quad\\
\mathbf{D}:=
\frac{1}{2}\begin{pmatrix}
2\frac{\partial^2}{\partial x \partial y} &
\frac{\partial^2}{\partial y^2}-\frac{\partial^2}{\partial x^2} \\
\frac{\partial^2}{\partial y^2}-\frac{\partial^2}{\partial x^2} &
-2\frac{\partial^2}{\partial x \partial y}
\end{pmatrix}\psi\\
\quad\\
\dot\gamma:=\sqrt{
 2\left(\frac{\partial^2\psi}{\partial x \partial y}\right)^2
+\frac{1}{2}\left(\frac{\partial^2\psi}{\partial y^2}-\frac{\partial^2\psi}{\partial x^2}\right)^2
}
$$

Let's try to simplify the ghastly viscosity term

$$
\nabla\times\nabla\cdot\left(2\eta\mathbf{D}\right)=
\frac{\partial}{\partial x}\left(
 \frac{\partial(2\eta[\mathbf{D}]_{xy})}{\partial x}
+\frac{\partial(2\eta[\mathbf{D}]_{yy})}{\partial y}
\right)-
\frac{\partial}{\partial y}\left(
 \frac{\partial(2\eta[\mathbf{D}]_{xx})}{\partial x}
+\frac{\partial(2\eta[\mathbf{D}]_{yx})}{\partial y}
\right)\\
=
\left(
 \frac{\partial^2}{\partial x^2}
-\frac{\partial^2}{\partial y^2}\right)\left(2\eta[\mathbf{D}]_{xy}\right)
+
2\frac{\partial^2}{\partial x \partial y}\left(
\eta[\mathbf{D}]_{yy}
-\eta[\mathbf{D}]_{xx}
\right)\\
\quad\qquad=
-\left(
 \frac{\partial^2}{\partial x^2}
-\frac{\partial^2}{\partial y^2}\right)\left(
 \eta\left(
 \frac{\partial^2}{\partial x^2}
-\frac{\partial^2}{\partial y^2}\right)\psi
\right)
-4\frac{\partial^2}{\partial x \partial y}\left(
 \eta\frac{\partial^2 \psi}{\partial x \partial y }
\right)\\
\qquad\qquad\quad
=\left(\frac{\partial^2}{\partial x^2}+\frac{\partial^2}{\partial y^2}\right)\left(\eta\omega\right)
+2\left(
  \frac{\partial^2\psi}{\partial^2 x}\frac{\partial^2\eta}{\partial^2 y}
-2\frac{\partial^2\psi}{\partial x\partial y}\frac{\partial^2\eta}{\partial x\partial y}
+ \frac{\partial^2\psi}{\partial^2 y}\frac{\partial^2\eta}{\partial^2 x}
\right)
$$

## Numerical Integration

We begin with the two dimensional velocity field $(u,v)$ at the start time $t$ and grid points $(x,y)$. Lets assume a uniform discretization over the grid with spacing $\Delta$

#### 1. Compute the vorticity $\omega$ from velocity field

This can be done with a central finite-difference stencil on the grid

$$
\omega=\frac{v_{x+\Delta}-v_{x-\Delta}-u_{y+\Delta}+u_{y-\Delta}}{2\Delta}
$$

#### 2. Solve poisson equation for $\psi$ starting with initial guess $\psi'$

This can be done with iterative methods

$$
\nabla^2\psi=-\omega
$$

#### 3. Perform time step for vorticity $\omega$ and store previous $\psi$

$$
\omega\leftarrow\omega+
\left(\nabla^2\left(\eta\omega\right)
+
2\frac{\psi_x\eta_y-2\psi_{xy}\eta_{xy}+\eta_x\psi_y}{\Delta^4}
-\rho\frac{\omega_{xy}}{2\Delta }\right)\frac{\Delta t}{\rho}
\qquad
\psi'\leftarrow\psi
\\\quad\\
\mathrm{where}\quad \omega_{xy}:=\omega_{x+\Delta}u-\omega_{x-\Delta}u+\omega_{y+\Delta}v-\omega_{y-\Delta}v
$$

#### 4. Repeat step 2.

#### 5. Semi-Lagrangian Advection

The semi-Lagrangian advection method traces the characteristics of the flow backward in time and interpolates the values from the previous time step. This ensures stability by tracing the flow backward in time to find the departure point and then interpolating the values from the previous time step at that point.

Equation of Motion for the Jacobian of a Vector Field Under Advection
To derive the equation of motion for the Jacobian of a two-dimensional vector field $\mathbf{f}(x,y)$ that is advected by an external vector field $\boldsymbol{\eta}(x,y)$, I'll work through this systematically.

Starting Point: Advection Equation
The advection of vector field $\mathbf{f} = (f_1, f_2)$ by vector field $\boldsymbol{\eta} = (\eta_1, \eta_2)$ is given by:

$$\frac{\partial \mathbf{f}}{\partial t} + (\boldsymbol{\eta} \cdot \nabla)\mathbf{f} = 0$$

In component form: $$\frac{\partial f_1}{\partial t} + \eta_1 \frac{\partial f_1}{\partial x} + \eta_2 \frac{\partial f_1}{\partial y} = 0$$ $$\frac{\partial f_2}{\partial t} + \eta_1 \frac{\partial f_2}{\partial x} + \eta_2 \frac{\partial f_2}{\partial y} = 0$$

The Jacobian
The Jacobian of $\mathbf{f}$ is defined as:

$$J_f = \begin{pmatrix} \frac{\partial f_1}{\partial x} & \frac{\partial f_1}{\partial y} \ \frac{\partial f_2}{\partial x} & \frac{\partial f_2}{\partial y} \end{pmatrix}$$

Let's denote:

$a = \frac{\partial f_1}{\partial x}$
$b = \frac{\partial f_1}{\partial y}$
$c = \frac{\partial f_2}{\partial x}$
$d = \frac{\partial f_2}{\partial y}$
The Jacobian determinant is: $$J = \det(J_f) = ad - bc$$

Deriving the Time Evolution
To find the equation of motion for $J$, I need to find $\frac{\partial J}{\partial t}$.

First, differentiate the original advection equations with respect to $x$ and $y$:

$$\frac{\partial a}{\partial t} = -\frac{\partial \eta_1}{\partial x}a - \eta_1\frac{\partial a}{\partial x} - \frac{\partial \eta_2}{\partial x}b - \eta_2\frac{\partial b}{\partial x}$$

$$\frac{\partial b}{\partial t} = -\frac{\partial \eta_1}{\partial y}a - \eta_1\frac{\partial a}{\partial y} - \frac{\partial \eta_2}{\partial y}b - \eta_2\frac{\partial b}{\partial y}$$

$$\frac{\partial c}{\partial t} = -\frac{\partial \eta_1}{\partial x}c - \eta_1\frac{\partial c}{\partial x} - \frac{\partial \eta_2}{\partial x}d - \eta_2\frac{\partial d}{\partial x}$$

$$\frac{\partial d}{\partial t} = -\frac{\partial \eta_1}{\partial y}c - \eta_1\frac{\partial c}{\partial y} - \frac{\partial \eta_2}{\partial y}d - \eta_2\frac{\partial d}{\partial y}$$

Now, for the time derivative of $J$: $$\frac{\partial J}{\partial t} = \frac{\partial a}{\partial t}d + a\frac{\partial d}{\partial t} - \frac{\partial b}{\partial t}c - b\frac{\partial c}{\partial t}$$

Substituting the expressions for $\frac{\partial a}{\partial t}$, $\frac{\partial b}{\partial t}$, $\frac{\partial c}{\partial t}$, and $\frac{\partial d}{\partial t}$ and after algebraic simplification:

$$\frac{\partial J}{\partial t} = -(\eta_1\frac{\partial J}{\partial x} + \eta_2\frac{\partial J}{\partial y}) - (\frac{\partial \eta_1}{\partial x} + \frac{\partial \eta_2}{\partial y})J$$

Final Result
The equation of motion for the Jacobian determinant is:

$$\boxed{\frac{\partial J}{\partial t} + (\boldsymbol{\eta} \cdot \nabla)J = -(\nabla \cdot \boldsymbol{\eta})J}$$

Which can also be written as:

$$\frac{DJ}{Dt} = -(\nabla \cdot \boldsymbol{\eta})J$$

Where $\frac{D}{Dt} = \frac{\partial}{\partial t} + (\boldsymbol{\eta} \cdot \nabla)$ is the material derivative.

This equation shows that the Jacobian is advected by the flow field $\boldsymbol{\eta}$ while also being affected by the divergence of $\boldsymbol{\eta}$. For an incompressible flow where $\nabla \cdot \boldsymbol{\eta} = 0$, the Jacobian is simply advected without changing along flow trajectories.
