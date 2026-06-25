// Shared shaders for cellular automata sources

export const quadVS = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

export const HASH_GLSL = `
float hash(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  uint h = v.x * 1597334677u ^ v.y * 3812015801u;
  h ^= h >> 16u;
  h *= 2246822519u;
  h ^= h >> 13u;
  h *= 3266489917u;
  h ^= h >> 16u;
  return float(h) / 4294967295.0;
}`;

export const paletteRenderFS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_state;
uniform vec3 u_palDark;
uniform vec3 u_palMid;
uniform vec3 u_palBright;
out vec4 fragColor;
void main() {
  float state = texture(u_state, v_uv).r;
  vec3 color;
  if (state < 0.5) {
    color = mix(u_palDark, u_palMid, state * 2.0);
  } else {
    color = mix(u_palMid, u_palBright, (state - 0.5) * 2.0);
  }
  fragColor = vec4(color, 1.0);
}`;
