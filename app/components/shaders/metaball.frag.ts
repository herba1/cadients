// Constants for cluster configuration
export const MAX_BALLS = 15; // 3 clusters × 5 balls
export const BALLS_PER_CLUSTER = 5;
export const MAX_CLUSTERS = 3;

export const fragmentShader = `
  uniform float uTime;
  uniform float uThreshold;
  uniform float uEdgeSoftness;
  uniform float uAnimationSpeed;
  uniform vec3 uBackgroundColor;

  // Cluster-based blob data: 15 balls (3 clusters × 5 balls each)
  uniform vec2 uBlobPositions[${MAX_BALLS}];
  uniform vec3 uBlobColors[${MAX_BALLS}];
  uniform float uBlobRadii[${MAX_BALLS}];
  uniform int uActiveBalls; // How many balls are actually active

  varying vec2 vUv;

  //
  // Simplex 2D noise - by Stefan Gustavson and Ian McEwan
  // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
  //
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Metaball influence function
  float metaball(vec2 p, vec2 center, float radius) {
    float dist = distance(p, center);
    return (radius * radius) / (dist * dist + 0.0001);
  }

  void main() {
    // Map UV to aspect-corrected coordinates (16:8 plane)
    vec2 uv = vUv;
    uv.x *= 2.0;

    // Calculate individual ball influences and accumulate color
    float totalInfluence = 0.0;
    vec3 weightedColor = vec3(0.0);

    for (int i = 0; i < ${MAX_BALLS}; i++) {
      if (i >= uActiveBalls) break;

      float influence = metaball(uv, uBlobPositions[i], uBlobRadii[i]);
      totalInfluence += influence;
      weightedColor += uBlobColors[i] * influence;
    }

    // Calculate blob color (weighted average)
    vec3 blobColor = vec3(0.0);
    if (totalInfluence > 0.0) {
      blobColor = weightedColor / totalInfluence;
    }

    // Pure white background
    vec3 white = vec3(1.0, 1.0, 1.0);

    // Smooth fade from white background to blob color
    // uThreshold controls where the blob starts to appear
    // uEdgeSoftness controls how gradual the fade is
    float fadeStart = uThreshold - uEdgeSoftness;
    float fadeEnd = uThreshold + uEdgeSoftness;
    float alpha = smoothstep(fadeStart, fadeEnd, totalInfluence);

    // Mix white background with blob colors based on influence
    vec3 finalColor = mix(white, blobColor, alpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
