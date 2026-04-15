export function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function fract(x) {
  return x - Math.floor(x);
}

export function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

export function smooth(t) {
  return t * t * (3.0 - 2.0 * t);
}

export function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi);
  const b = hash2(xi + 1.0, yi);
  const c = hash2(xi, yi + 1.0);
  const d = hash2(xi + 1.0, yi + 1.0);
  const ux = smooth(xf), uy = smooth(yf);
  return (a * (1.0 - ux) + b * ux) * (1.0 - uy) + (c * (1.0 - ux) + d * ux) * uy;
}

export function fbm(x, y) {
  let v = 0.0, a = 0.5, fx = x, fy = y;
  for (let i = 0; i < 4; i++) {
    v += valueNoise(fx, fy) * a;
    fx *= 2.02;
    fy *= 2.02;
    a *= 0.5;
  }
  return v;
}