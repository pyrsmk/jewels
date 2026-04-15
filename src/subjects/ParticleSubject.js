import { AbstractSubject } from '../core/AbstractSubject.js';
import { sharedShaderLibrary } from '../core/SharedShaderLibrary.js';
import { createProgram } from '../utils/webgl.js';
import { rand, clamp, smooth, fbm } from '../utils/math.js';

export class ParticleSubject extends AbstractSubject {
  static uiTitle = 'Particules';

  constructor(options = {}) {
    const defaults = {
      particleShape: 'pearls',
      flowDirection: 'free',
      surfaceImperfections: false,
      particleCount: 0.316,
      speed: 0.047,
      size: 9,
      particleJitter: 0.3,
    };
    super(
      { ...defaults, ...options },
      ['particleShape', 'flowDirection', 'surfaceImperfections', 'particleCount', 'speed', 'size',
        'particleJitter'],
      ['particleCountVal', 'speedVal', 'sizeVal'],
    );
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.locs = null;
    this.particles = [];
    this.particleData = new Float32Array(0);
    this.bufferInitialized = false;
    this.flowFrameCounter = 0;
    this.flowOffset = [0, 0];
    this.flowField = { cols: 72, rows: 72, vectors: new Float32Array(72 * 72 * 2) };
    this.vortexSeeds = [];
    this.imperfectionSeeds = [];
  }

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;
    this.program = createProgram(gl, this.getVertexShaderSource(), this.getFragmentShaderSource());
    this.buffer = gl.createBuffer();
    this.locs = this._resolveAllLocs(gl, this.program);
  }

  bindVertexAttributes() {
    const gl = this.gl;
    gl.enableVertexAttribArray(this.locs.a_data);
    gl.vertexAttribPointer(this.locs.a_data, 4, gl.FLOAT, false, 0, 0);
  }

  getVertexShaderSource() {
    return `
precision highp float;
attribute vec4 a_data;
uniform vec2 u_camera;
uniform float u_size;
uniform float u_dpr;
varying float v_depth;
varying float v_alpha;
varying vec2 v_sceneUv;
void main() {
  vec2 pos = a_data.xy + u_camera;
  gl_Position = vec4(pos, 0.0, 1.0);
  v_sceneUv = pos * 0.5 + 0.5;
  v_alpha = a_data.w;
  float depth = 0.25 + a_data.z * 0.95;
  float sizePx = u_size;
  sizePx *= mix(0.7, 1.0, depth);
  gl_PointSize = max(sizePx * u_dpr, 1.0);
  v_depth = depth;
}
`;
  }

  getFragmentShaderSource() {
    return `
precision highp float;
varying float v_depth;
varying float v_alpha;
varying vec2 v_sceneUv;
uniform vec3 u_accents[8];
uniform int u_accentCount;
uniform float u_colorEnabled;
uniform float u_particleShape;
uniform float u_time;
${sharedShaderLibrary.getColorHelpers()}
${sharedShaderLibrary.getNoiseHelpers()}
mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}
float particleFlowAngle(vec2 uv) {
  vec2 q = uv * 6.0 + vec2(1.7, -2.3);
  float n1 = noise21(q);
  float n2 = noise21(q + vec2(4.2, 7.1));
  return (n1 * 2.0 - 1.0) * 1.8 + (n2 * 2.0 - 1.0) * 0.35;
}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);
  vec3 base = vec3(0.02, 0.035, 0.09) * mix(0.75, 1.25, v_depth);
  if (u_colorEnabled > 0.5 && u_accentCount > 0) {
    vec3 pal = paletteColor(clamp(v_sceneUv.x, 0.0, 1.0));
    base = pal * mix(0.42, 0.82, v_depth);
  }
  float shape = floor(u_particleShape + 0.5);
  float mask = 0.0;
  float halo = 0.0;
  float sparkle = 0.0;
  float sizeNorm = 1.0;
  float randRot = (hash21(floor(v_sceneUv * 512.0)) - 0.5) * 0.4;
  if (shape < 0.5) {
    // Pearls
    sizeNorm = 1.00;
    vec2 ps = p / sizeNorm;
    float rs = length(ps);
    if (rs > 1.0) discard;
    float core = smoothstep(0.65, 0.0, rs);
    float ring = smoothstep(0.98, 0.72, rs) * smoothstep(0.35, 0.55, rs);
    halo = smoothstep(1.0, 0.15, rs);
    mask = max(core * 0.55, ring * 0.95);
    sparkle = ring * 0.9;
  }
  else if (shape < 1.5) {
    // Pixel
    sizeNorm = 1.16;
    vec2 q = p / sizeNorm;
    float d = max(abs(q.x), abs(q.y)) - 0.78;
    if (d > 0.0) discard;
    mask = 0.92;
    halo = 0.02;
  }
  else if (shape < 2.5) {
    // Flow
    sizeNorm = 1.22;
    float a = particleFlowAngle(v_sceneUv) + randRot;
    vec2 q = rot(a) * (p / sizeNorm);
    float line = exp(-pow(abs(q.y) / 0.16, 2.0)) * exp(-pow(abs(q.x) / 1.02, 2.0));
    mask = line;
    halo = exp(-pow(abs(q.y) / 0.34, 2.0)) * exp(-pow(abs(q.x) / 1.22, 2.0)) * 0.18;
    if (mask + halo < 0.01) discard;
  }
  else if (shape < 3.5) {
    // Carré soft
    sizeNorm = 1.08;
    vec2 q = p / sizeNorm;
    float box = max(abs(q.x), abs(q.y));
    float soft = smoothstep(0.95, 0.2, box);
    float inner = smoothstep(0.6, 0.0, box);
    if (soft <= 0.001) discard;
    mask = soft * (0.6 + inner * 0.4);
    halo = smoothstep(1.1, 0.35, box) * 0.15;
  }
  else if (shape < 4.5) {
    // Core
    sizeNorm = 1.05;
    vec2 qs = p / sizeNorm;
    float rs = length(qs);
    if (rs > 1.0) discard;
    float c1 = smoothstep(1.0, 0.0, rs);
    float c2 = smoothstep(0.8, 0.0, rs);
    mask = c1 * 0.62 + c2 * 0.46;
    halo = smoothstep(1.0, 0.35, rs) * 0.18;
  }
  else {
    // Glitter
    float seed = hash21(floor(v_sceneUv * 1024.0));
    float flickerPhase = fract(seed * 13.7 + u_time * (0.8 + seed * 1.4));
    float flicker = smoothstep(0.0, 0.15, flickerPhase) * smoothstep(0.45, 0.20, flickerPhase);
    vec2 q = rot((seed - 0.5) * 0.52) * p;
    float sq = max(abs(q.x), abs(q.y));
    if (sq > 0.90) discard;
    float face = smoothstep(0.90, 0.68, sq);
    float bright = smoothstep(0.90, 0.0, sq);
    mask = face * (0.55 + flicker * 0.45);
    sparkle = bright * (0.5 + flicker * 0.8);
    halo = smoothstep(1.0, 0.82, sq) * 0.12;
  }
  vec3 col = base * (0.82 + mask * 0.92);
  col += vec3(1.0) * sparkle;
  col += vec3(1.0) * halo * 0.32;
  float alpha = clamp(mask + halo * 0.6, 0.0, 1.0) * v_alpha;
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
  }

  getParticleCountFromSlider() {
    const t = +(this.options.particleCount ?? 0.316);
    if (t < 0.20) {
      const local = smooth(t / 0.20);
      return Math.round(100 + (1000 - 100) * local);
    }
    if (t < 0.85) {
      const local = smooth((t - 0.20) / 0.65);
      return Math.round(1000 + (50000 - 1000) * local);
    }
    const local = smooth((t - 0.85) / 0.15);
    return Math.round(50000 + (100000 - 50000) * local);
  }

  getParticleSpeedFromSlider() {
    const t = +(this.options.speed ?? 0.047);
    if (t < 0.5) return 0.4 * (t / 0.5);
    return 0.4 + (3.0 - 0.4) * ((t - 0.5) / 0.5);
  }

  getParticleSpeedDisplayPxPerSec() {
    const referencePxScale = 540.0;
    const flowDisplayRef = 0.0065;
    return this.getParticleSpeedFromSlider() * flowDisplayRef * 60.0 * referencePxScale;
  }

  getDrawCount() {
    return this.particles.length;
  }

  getFlowDirection() {
    return this.options.flowDirection ?? 'free';
  }

  useSurfaceImperfections() {
    return !!this.options.surfaceImperfections;
  }

  createImperfectionSeed(ageOffset) {
    const lifetime = rand(40, 60);
    const fadeDur = 3.0;
    return {
      x: rand(-0.9, 0.9),
      y: rand(-0.9, 0.9),
      amplitude: rand(0.006, 0.014),
      radius: rand(0.3, 0.7),
      lifetime,
      fadeDur,
      age: ageOffset !== undefined ? ageOffset : 0,
    };
  }

  initImperfectionSeeds() {
    const count = 4;
    this.imperfectionSeeds = [];
    for (let i = 0; i < count; i++) {
      this.imperfectionSeeds.push(this.createImperfectionSeed(rand(0, 30)));
    }
  }

  updateImperfectionSeeds(dt) {
    for (let i = 0; i < this.imperfectionSeeds.length; i++) {
      const s = this.imperfectionSeeds[i];
      s.age += dt;
      if (s.age >= s.lifetime) {
        this.imperfectionSeeds[i] = this.createImperfectionSeed(0);
      }
    }
  }

  imperfectionField(x, y) {
    let perp = 0.0;
    for (let i = 0; i < this.imperfectionSeeds.length; i++) {
      const s = this.imperfectionSeeds[i];
      const dx = x - s.x;
      const dy = y - s.y;
      const d2 = dx * dx + dy * dy;
      const r2 = s.radius * s.radius;
      if (d2 >= r2) continue;
      const gaussian = Math.exp(-d2 / (r2 * 0.25));
      const fadeIn = clamp(s.age / s.fadeDur, 0, 1);
      const fadeOut = clamp((s.lifetime - s.age) / s.fadeDur, 0, 1);
      perp += gaussian * s.amplitude * fadeIn * fadeOut;
    }
    return perp;
  }

  initFlowSeeds() {
    this.vortexSeeds = [];
    const count = 5;
    const strength = 0.0065;
    for (let i = 0; i < count; i++) {
      this.vortexSeeds.push({
        x: 0,
        y: 0,
        sign: Math.random() > 0.5 ? 1 : -1,
        phase: rand(0, Math.PI * 2),
        freqA: rand(0.018, 0.038),
        freqB: rand(0.011, 0.025),
        freqC: rand(0.031, 0.055),
        ampA: rand(0.20, 0.32),
        ampB: rand(0.10, 0.20),
        ampC: rand(0.05, 0.12),
        strength,
      });
    }
  }

  spawnParticleForRespawn(p, zOverride, scatterInit) {
    const z = zOverride !== undefined ? zOverride : Math.random();
    const margin = 1.15;
    const dir = this.getFlowDirection();
    if (scatterInit) {
      p.x = rand(-1.0, 1.0);
      p.y = rand(-1.0, 1.0);
    } else if (dir === 'horizontal') {
      p.x = -margin;
      p.y = rand(-1.0, 1.0);
    } else if (dir === 'horizontal-rev') {
      p.x = margin;
      p.y = rand(-1.0, 1.0);
    } else if (dir === 'vertical') {
      p.y = -margin;
      p.x = rand(-1.0, 1.0);
    } else if (dir === 'vertical-rev') {
      p.y = margin;
      p.x = rand(-1.0, 1.0);
    } else {
      p.x = rand(-1.0, 1.0);
      p.y = rand(-1.0, 1.0);
    }
    p.vx = rand(-0.0005, 0.0005);
    p.vy = rand(-0.0005, 0.0005);
    p.z = z;
    p.bright = 0;
    p.fade = 0;
    const randFade = 500;
    const baseIn = 3000;
    const baseOut = 1900;
    p.fadeInDur = Math.max(50, baseIn + rand(-randFade, randFade)) / 1000;
    p.fadeOutDur = Math.max(50, baseOut + rand(-randFade, randFade)) / 1000;
    p.life = scatterInit ? p.fadeInDur + rand(0, 8.0) : 0;
  }

  baseDirection() {
    switch (this.getFlowDirection()) {
      case 'horizontal': return [1, 0];
      case 'horizontal-rev': return [-1, 0];
      case 'vertical': return [0, 1];
      case 'vertical-rev': return [0, -1];
      default: {
        const a = performance.now() * 0.00008;
        return [Math.cos(a), Math.sin(a)];
      }
    }
  }

  fieldNoise(x, y, t) {
    const scale = 0.45;
    const tx = x * scale + this.flowOffset[0] + t * 0.06;
    const ty = y * scale + this.flowOffset[1] + t * 0.05;
    const e = 0.12;
    const s1 = fbm(tx, ty + e);
    const s2 = fbm(tx, ty - e);
    const s3 = fbm(tx + e, ty);
    const s4 = fbm(tx - e, ty);
    const dsdx = (s3 - s4) / (2.0 * e);
    const dsdy = (s1 - s2) / (2.0 * e);
    let vx = dsdy;
    let vy = -dsdx;
    const len = Math.hypot(vx, vy) || 1.0;
    return [vx / len, vy / len];
  }

  updateVortexPositions(t) {
    for (let i = 0; i < this.vortexSeeds.length; i++) {
      const s = this.vortexSeeds[i];
      const offsetX =
        Math.sin(t * s.freqA + s.phase) * s.ampA +
        Math.sin(t * s.freqB + s.phase * 1.37) * s.ampB +
        Math.sin(t * s.freqC + s.phase * 0.71) * s.ampC;
      const offsetY =
        Math.cos(t * s.freqA + s.phase * 1.13) * s.ampA +
        Math.cos(t * s.freqB + s.phase * 0.89) * s.ampB +
        Math.cos(t * s.freqC + s.phase * 1.54) * s.ampC;
      s.cx = clamp(offsetX, -0.95, 0.95);
      s.cy = clamp(offsetY, -0.95, 0.95);
    }
  }

  fieldVortex(x, y) {
    let vx = 0.0, vy = 0.0;
    for (let i = 0; i < this.vortexSeeds.length; i++) {
      const s = this.vortexSeeds[i];
      const dx = x - s.cx;
      const dy = y - s.cy;
      const d2 = Math.max(dx * dx + dy * dy, 0.08);
      vx += (-dy / d2) * s.strength * s.sign;
      vy += (dx / d2) * s.strength * s.sign;
    }
    return [vx, vy];
  }

  computeFlowRaw(x, y, t) {
    const bd = this.baseDirection();
    let vx = 0.0;
    let vy = 0.0;
    const flowRadius = 0.22;
    const dir = this.getFlowDirection();
    const nA = this.fieldNoise(x, y, t);
    const nB = this.fieldNoise(x + flowRadius, y, t);
    const nC = this.fieldNoise(x - flowRadius, y, t);
    const nD = this.fieldNoise(x, y + flowRadius, t);
    const nE = this.fieldNoise(x, y - flowRadius, t);
    const noise = [
      (nA[0] + nB[0] + nC[0] + nD[0] + nE[0]) / 5,
      (nA[1] + nB[1] + nC[1] + nD[1] + nE[1]) / 5,
    ];
    const useImperfections = this.useSurfaceImperfections();
    if (
      dir === 'horizontal' || dir === 'horizontal-rev' ||
      dir === 'vertical' || dir === 'vertical-rev'
    ) {
      const perpX = -bd[1], perpY = bd[0];
      const noiseAlong = noise[0] * bd[0] + noise[1] * bd[1];
      const noisePerp = noise[0] * perpX + noise[1] * perpY;
      const imperf = useImperfections ? this.imperfectionField(x, y) : 0.0;
      vx += bd[0] * 0.018 + bd[0] * noiseAlong * 0.003 + perpX * (noisePerp * 0.006 + imperf);
      vy += bd[1] * 0.018 + bd[1] * noiseAlong * 0.003 + perpY * (noisePerp * 0.006 + imperf);
    } else {
      vx += bd[0] * 0.0045;
      vy += bd[1] * 0.0045;
      const vA = this.fieldVortex(x, y);
      const vB = this.fieldVortex(x + flowRadius, y);
      const vC = this.fieldVortex(x - flowRadius, y);
      const vD = this.fieldVortex(x, y + flowRadius);
      const vE = this.fieldVortex(x, y - flowRadius);
      const vortex = [
        (vA[0] + vB[0] + vC[0] + vD[0] + vE[0]) / 5,
        (vA[1] + vB[1] + vC[1] + vD[1] + vE[1]) / 5,
      ];
      const imperf = useImperfections ? this.imperfectionField(x, y) : 0.0;
      vx += noise[0] * 0.0045 + vortex[0] * 0.9 + imperf;
      vy += noise[1] * 0.0045 + vortex[1] * 0.9 + imperf;
    }
    return [vx, vy];
  }

  rebuildFlowField(t) {
    this.updateVortexPositions(t);
    const cols = this.flowField.cols;
    const rows = this.flowField.rows;
    const flowData = this.flowField.vectors;

    let ptr = 0;
    for (let gy = 0; gy < rows; gy++) {
      const y = -1.0 + (gy / (rows - 1)) * 2.0;
      for (let gx = 0; gx < cols; gx++) {
        const x = -1.0 + (gx / (cols - 1)) * 2.0;
        const flow = this.computeFlowRaw(x, y, t);
        const drift = this.fieldNoise(x + 5.0, y - 3.0, t * 0.9 + 17.0);
        flowData[ptr] = flow[0] + drift[0] * 0.00008;
        flowData[ptr + 1] = flow[1] + drift[1] * 0.00008;
        ptr += 2;
      }
    }
  }

  sampleField(data, cols, rows, x, y) {
    const fx = clamp((x * 0.5 + 0.5) * (cols - 1), 0, cols - 1);
    const fy = clamp((y * 0.5 + 0.5) * (rows - 1), 0, rows - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, cols - 1);
    const y1 = Math.min(y0 + 1, rows - 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const i00 = (y0 * cols + x0) * 2;
    const i10 = (y0 * cols + x1) * 2;
    const i01 = (y1 * cols + x0) * 2;
    const i11 = (y1 * cols + x1) * 2;
    const vx0 = data[i00] * (1 - tx) + data[i10] * tx;
    const vy0 = data[i00 + 1] * (1 - tx) + data[i10 + 1] * tx;
    const vx1 = data[i01] * (1 - tx) + data[i11] * tx;
    const vy1 = data[i01 + 1] * (1 - tx) + data[i11 + 1] * tx;
    return [vx0 * (1 - ty) + vx1 * ty, vy0 * (1 - ty) + vy1 * ty];
  }

  sampleFlowField(x, y) {
    const { cols, rows, vectors } = this.flowField;
    return this.sampleField(vectors, cols, rows, x, y);
  }

  shouldRespawn(p) {
    const dir = this.getFlowDirection(), m = 1.22;
    if (dir === 'horizontal') return p.x > m || p.y < -m || p.y > m;
    if (dir === 'horizontal-rev') return p.x < -m || p.y < -m || p.y > m;
    if (dir === 'vertical') return p.y > m || p.x < -m || p.x > m;
    if (dir === 'vertical-rev') return p.y < -m || p.x < -m || p.x > m;
    return p.x < -m || p.x > m || p.y < -m || p.y > m;
  }

  computeRespawnFade(p) {
    const fadeInSec = p.fadeInDur || 3.0;
    const fadeOutSec = p.fadeOutDur || 1.9;
    const fadeIn = clamp(p.life / fadeInSec, 0, 1);
    let exitFade = 1;
    const dir = this.getFlowDirection();
    const fadeDist = 0.15 + (fadeOutSec * 0.25);
    if (dir === 'horizontal') exitFade = clamp((1.18 - p.x) / fadeDist, 0, 1);
    else if (dir === 'horizontal-rev') exitFade = clamp((1.18 + p.x) / fadeDist, 0, 1);
    else if (dir === 'vertical') exitFade = clamp((1.18 - p.y) / fadeDist, 0, 1);
    else if (dir === 'vertical-rev') exitFade = clamp((1.18 + p.y) / fadeDist, 0, 1);
    else {
      const edgeDist = Math.min(p.x + 1.18, 1.18 - p.x, p.y + 1.18, 1.18 - p.y);
      exitFade = clamp(edgeDist / fadeDist, 0, 1);
    }
    return fadeIn * exitFade;
  }

  particleBrightness(p, speed) {
    const motion = Math.min(1.0, Math.hypot(p.vx, p.vy) / Math.max(speed, 0.0001));
    const depth = 0.45 + p.z * 0.75;
    return clamp((0.35 + motion * 0.65) * p.fade * depth, 0, 1);
  }

  syncValueDisplays() {}

  reseedParticles() {
    const count = this.getParticleCountFromSlider();
    this.particles = new Array(count);
    this.particleData = new Float32Array(count * 4);
    this.bufferInitialized = false;
    this.initFlowSeeds();
    this.flowOffset = [rand(0, 100), rand(0, 100)];
    this.initImperfectionSeeds();
    this.rebuildFlowField(0);
    for (let i = 0; i < count; i++) {
      const p = {
        x: 0, y: 0, vx: 0, vy: 0, z: Math.random(), bright: 0,
        life: 0, fade: 1, fadeInDur: 0, fadeOutDur: 0,
        noiseOffsetX: rand(0, 100),
        noiseOffsetY: rand(0, 100),
        jitterVx: 0, jitterVy: 0,
        jitterAge: Math.floor(Math.random() * 4),
      };
      this.spawnParticleForRespawn(p, Math.random(), true);
      this.particles[i] = p;
    }
    this.uploadParticles();
  }

  uploadParticles() {
    const gl = this.gl;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const j = i * 4;
      this.particleData[j] = p.x;
      this.particleData[j + 1] = p.y;
      this.particleData[j + 2] = p.z;
      this.particleData[j + 3] = p.fade;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    if (!this.bufferInitialized) {
      gl.bufferData(gl.ARRAY_BUFFER, this.particleData, gl.DYNAMIC_DRAW);
      this.bufferInitialized = true;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData);
    }
  }

  update({ deltaTime, time } = {}) {
    const dt = deltaTime ?? 0;
    const t = time ?? 0;
    const speed = this.getParticleSpeedFromSlider();
    this.flowFrameCounter++;
    if ((this.flowFrameCounter & 1) === 0) this.rebuildFlowField(t);
    if (this.useSurfaceImperfections()) this.updateImperfectionSeeds(dt);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const depthFactor = 0.55 + p.z * 1.35;
      p.life += dt;
      const flow = this.sampleFlowField(p.x, p.y);
      let targetVx = flow[0] * speed * depthFactor;
      let targetVy = flow[1] * speed * depthFactor;
      const jitter = this.options.particleJitter ?? 0.3;
      if (jitter > 0) {
        p.jitterAge++;
        if (p.jitterAge >= 4) {
          p.jitterAge = 0;
          const jn = this.fieldNoise(p.x + p.noiseOffsetX, p.y + p.noiseOffsetY, t * 0.4);
          p.jitterVx = jn[0];
          p.jitterVy = jn[1];
        }
        const jitterScale = jitter * jitter * 0.012;
        targetVx += p.jitterVx * jitterScale * speed * depthFactor;
        targetVy += p.jitterVy * jitterScale * speed * depthFactor;
      }
      const dir = this.getFlowDirection();
      if (dir === 'horizontal' || dir === 'horizontal-rev') {
        const edgeProximity = Math.max(0, (Math.abs(p.y) - 0.6) / 0.4);
        targetVy *= 1.0 - edgeProximity * edgeProximity;
      } else if (dir === 'vertical' || dir === 'vertical-rev') {
        const edgeProximity = Math.max(0, (Math.abs(p.x) - 0.6) / 0.4);
        targetVx *= 1.0 - edgeProximity * edgeProximity;
      }
      const response = 0.06 + speed * 0.08;
      p.vx += (targetVx - p.vx) * response;
      p.vy += (targetVy - p.vy) * response;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.x += p.vx * dt * 60.0;
      p.y += p.vy * dt * 60.0;
      if (this.shouldRespawn(p)) {
        this.spawnParticleForRespawn(p);
      }
      p.fade = this.computeRespawnFade(p);
      p.bright = this.particleBrightness(p, speed);
    }
    this.uploadParticles();
  }

  renderSubject({ gl, locs, time, dpr }) {
    gl.uniform2f(locs.u_camera, 0.0, 0.0);
    gl.uniform1f(locs.u_size, +(this.options.size ?? 9));
    gl.uniform1f(locs.u_dpr, dpr ?? 1);
    const shapeValue = this.options.particleShape ?? 'pearls';
    const particleShape = shapeValue === 'pixel' ? 1
      : shapeValue === 'flowline' ? 2
      : shapeValue === 'softsquare' ? 3
      : shapeValue === 'core' ? 4
      : shapeValue === 'glitter' ? 5 : 0;
    gl.uniform1f(locs.u_particleShape, particleShape);
    gl.uniform1f(locs.u_time, time);
  }
}