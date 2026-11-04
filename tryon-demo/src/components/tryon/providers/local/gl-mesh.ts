// A tiny WebGL renderer: draws a garment texture over a warped triangle mesh into a transparent canvas.
// The 2D compositor then draws this canvas over the camera frame. Kept deliberately small: one program, one
// texture bound per draw, no state beyond buffers.
import type { Mesh } from "./tps.ts";

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
uniform vec2 u_res;
varying vec2 v_uv;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = a_uv;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_alpha;
varying vec2 v_uv;
void main() {
  vec4 c = texture2D(u_tex, v_uv);
  // A touch of fall-off toward the hem so the flat image reads as a volume, not a sticker.
  c.rgb *= 1.0 - 0.10 * v_uv.y;
  gl_FragColor = vec4(c.rgb, c.a * u_alpha);
}`;

export class GlMesh {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private aPos: number;
  private aUv: number;
  private uRes: WebGLUniformLocation;
  private uAlpha: WebGLUniformLocation;
  private posBuf: WebGLBuffer;
  private uvBuf: WebGLBuffer;
  private idxBuf: WebGLBuffer;
  private textures = new Map<string, WebGLTexture>();

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const gl = this.canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error("webgl unavailable");
    this.gl = gl;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error("shader alloc failed");
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader: ${gl.getShaderInfoLog(s) ?? "?"}`);
      return s;
    };
    const program = gl.createProgram();
    if (!program) throw new Error("program alloc failed");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`program: ${gl.getProgramInfoLog(program) ?? "?"}`);
    this.program = program;
    gl.useProgram(program);

    this.aPos = gl.getAttribLocation(program, "a_pos");
    this.aUv = gl.getAttribLocation(program, "a_uv");
    const uRes = gl.getUniformLocation(program, "u_res");
    const uAlpha = gl.getUniformLocation(program, "u_alpha");
    if (!uRes || !uAlpha) throw new Error("uniforms missing");
    this.uRes = uRes;
    this.uAlpha = uAlpha;
    const mk = () => {
      const b = gl.createBuffer();
      if (!b) throw new Error("buffer alloc failed");
      return b;
    };
    this.posBuf = mk();
    this.uvBuf = mk();
    this.idxBuf = mk();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.uRes, width, height);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  /** Upload (once) a decoded image as the texture for `id`. */
  texture(id: string, image: TexImageSource): void {
    if (this.textures.has(id)) return;
    const gl = this.gl;
    const t = gl.createTexture();
    if (!t) throw new Error("texture alloc failed");
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.textures.set(id, t);
  }

  has(id: string): boolean {
    return this.textures.has(id);
  }

  clear(): void {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Draw `mesh` (positions in canvas px) textured with `id` at the given opacity. */
  draw(mesh: Mesh, id: string, alpha = 1): void {
    const tex = this.textures.get(id);
    if (!tex) return;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1f(this.uAlpha, alpha);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.aUv);
    gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.index, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, mesh.index.length, gl.UNSIGNED_SHORT, 0);
  }

  dispose(): void {
    const gl = this.gl;
    for (const t of this.textures.values()) gl.deleteTexture(t);
    this.textures.clear();
    gl.deleteBuffer(this.posBuf);
    gl.deleteBuffer(this.uvBuf);
    gl.deleteBuffer(this.idxBuf);
    gl.deleteProgram(this.program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
