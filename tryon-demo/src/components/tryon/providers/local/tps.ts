// Thin-plate-spline warp: maps a set of control points to targets and gives a smooth deformation for every other
// point. This is what bends a flat garment image around tracked shoulders, elbows, wrists and hips.
//
// f(p) = a0 + a1·x + a2·y + Σ wᵢ·U(|p − pᵢ|),  U(r) = r²·ln(r²), with Σwᵢ = Σwᵢxᵢ = Σwᵢyᵢ = 0.
// Plain TypeScript, no DOM, unit-tested in Node.

export type Pt = { x: number; y: number };

export type TpsMap = (x: number, y: number) => Pt;

function kernel(r2: number): number {
  return r2 > 1e-12 ? r2 * Math.log(r2) : 0;
}

/** Solve A·x = b in place (Gaussian elimination, partial pivoting). A is n×n row-major. */
function solve(A: Float64Array, b: Float64Array, n: number): Float64Array {
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r * n + c]) > Math.abs(A[pivot * n + c])) pivot = r;
    if (pivot !== c) {
      for (let k = 0; k < n; k++) {
        const t = A[c * n + k];
        A[c * n + k] = A[pivot * n + k];
        A[pivot * n + k] = t;
      }
      const t = b[c];
      b[c] = b[pivot];
      b[pivot] = t;
    }
    const d = A[c * n + c];
    if (Math.abs(d) < 1e-12) continue; // singular direction: leave it (regularisation keeps this rare)
    for (let r = c + 1; r < n; r++) {
      const f = A[r * n + c] / d;
      if (f === 0) continue;
      for (let k = c; k < n; k++) A[r * n + k] -= f * A[c * n + k];
      b[r] -= f * b[c];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r * n + k] * x[k];
    const d = A[r * n + r];
    x[r] = Math.abs(d) < 1e-12 ? 0 : s / d;
  }
  return x;
}

/**
 * Build the warp. `src` are control points in the garment image's space, `dst` where each should land on screen.
 * `lambda` > 0 relaxes exact interpolation (smoother, slightly off the targets); 0 passes through every point.
 */
export function solveTps(src: Pt[], dst: Pt[], lambda = 0): TpsMap {
  const n = src.length;
  if (n !== dst.length) throw new Error("tps: src and dst must have the same length");
  if (n < 3) throw new Error("tps: need at least 3 control points");

  // Normalise the source space to a unit box: keeps the kernel well-conditioned whatever the image size.
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of src) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const scale = Math.max(maxX - minX, maxY - minY) || 1;
  const nx = (x: number) => (x - minX) / scale;
  const ny = (y: number) => (y - minY) / scale;
  const sx = src.map((p) => nx(p.x));
  const sy = src.map((p) => ny(p.y));

  const m = n + 3;
  const A = new Float64Array(m * m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = sx[i] - sx[j];
      const dy = sy[i] - sy[j];
      A[i * m + j] = kernel(dx * dx + dy * dy) + (i === j ? lambda : 0);
    }
    A[i * m + n] = 1;
    A[i * m + n + 1] = sx[i];
    A[i * m + n + 2] = sy[i];
    A[n * m + i] = 1;
    A[(n + 1) * m + i] = sx[i];
    A[(n + 2) * m + i] = sy[i];
  }
  const bx = new Float64Array(m);
  const by = new Float64Array(m);
  for (let i = 0; i < n; i++) {
    bx[i] = dst[i].x;
    by[i] = dst[i].y;
  }
  const wx = solve(A.slice(), bx, m);
  const wy = solve(A, by, m);

  return (x, y) => {
    const u = nx(x);
    const v = ny(y);
    let ox = wx[n] + wx[n + 1] * u + wx[n + 2] * v;
    let oy = wy[n] + wy[n + 1] * u + wy[n + 2] * v;
    for (let i = 0; i < n; i++) {
      const dx = u - sx[i];
      const dy = v - sy[i];
      const k = kernel(dx * dx + dy * dy);
      ox += wx[i] * k;
      oy += wy[i] * k;
    }
    return { x: ox, y: oy };
  };
}

/**
 * A regular grid over the garment image, as a triangle mesh. `uv` is in image fractions (0..1);
 * `pos` is filled per frame by `warpMesh`. Triangle indices are shared.
 */
export type Mesh = {
  cols: number;
  rows: number;
  uv: Float32Array; // 2 per vertex
  pos: Float32Array; // 2 per vertex, screen px
  index: Uint16Array; // 3 per triangle
  vertexCount: number;
};

export function buildMesh(cols: number, rows: number): Mesh {
  const vertexCount = (cols + 1) * (rows + 1);
  const uv = new Float32Array(vertexCount * 2);
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const i = (r * (cols + 1) + c) * 2;
      uv[i] = c / cols;
      uv[i + 1] = r / rows;
    }
  }
  const index = new Uint16Array(cols * rows * 6);
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + 1;
      const d = a + (cols + 1);
      const e = d + 1;
      index[k++] = a;
      index[k++] = d;
      index[k++] = b;
      index[k++] = b;
      index[k++] = d;
      index[k++] = e;
    }
  }
  return { cols, rows, uv, pos: new Float32Array(vertexCount * 2), index, vertexCount };
}

/** Fill `mesh.pos` by pushing every grid vertex (in image px; the grid covers `w`×`h` from `origin`) through the warp. */
export function warpMesh(mesh: Mesh, w: number, h: number, map: TpsMap, origin: Pt = { x: 0, y: 0 }): void {
  const { uv, pos, vertexCount } = mesh;
  for (let i = 0; i < vertexCount; i++) {
    const p = map(origin.x + uv[i * 2] * w, origin.y + uv[i * 2 + 1] * h);
    pos[i * 2] = p.x;
    pos[i * 2 + 1] = p.y;
  }
}
