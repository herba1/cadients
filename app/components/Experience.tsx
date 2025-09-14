"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useControls, button } from "leva";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uAnimationSpeed;

  // Layer 1 controls
  uniform float uLayer1Scale;
  uniform float uLayer1Speed;
  uniform float uLayer1Amplitude;

  // Layer 2 controls
  uniform float uLayer2Scale;
  uniform float uLayer2Speed;
  uniform float uLayer2Amplitude;

  // Sharpness control
  uniform float uSharpness;

  // Noise type selector (0 = simplex, 1 = classic, 2 = voronoise, 3 = soft fbm, 4 = smooth)
  uniform float uNoiseType;

  // VoroNoise parameters
  uniform float uVoroU;
  uniform float uVoroV;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  varying vec2 vUv;

  // Simplex 2D noise
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Classic Perlin noise
  vec4 mod289v4(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289v4(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec2 fade(vec2 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod289v4(Pi);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;

    vec4 i = permute(permute(ix) + iy);

    vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;

    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);

    vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;

    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));

    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

  // Hash functions for VoroNoise
  vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                  dot(p, vec2(269.5, 183.3)),
                  dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
  }

  // VoroNoise function
  float voronoise(in vec2 x, float u, float v) {
    vec2 p = floor(x);
    vec2 f = fract(x);

    float k = 1.0 + 63.0 * pow(1.0 - v, 4.0);

    float va = 0.0;
    float wt = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        vec2 g = vec2(float(i), float(j));
        vec3 o = hash3(p + g) * vec3(u, u, 1.0);
        vec2 r = g - f + o.xy;
        float d = dot(r, r);
        float ww = pow(1.0 - smoothstep(0.0, 1.414, sqrt(d)), k);
        va += o.z * ww;
        wt += ww;
      }
    }

    return va / wt;
  }

  // Simple random function for fBm
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Improved noise for fBm
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Smooth rounded noise with cosine interpolation
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Cosine interpolation for smoother curves
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Soft fBm with fewer octaves for rounded patterns
  float softFbm(vec2 x) {
    float v = 0.0;
    float a = 0.6; // Higher base amplitude for smoother result
    vec2 shift = vec2(100);

    // Less aggressive rotation for smoother patterns
    mat2 rot = mat2(cos(0.3), sin(0.3), -sin(0.3), cos(0.3));

    // Only 3 octaves instead of 5 for smoother result
    for (int i = 0; i < 3; ++i) {
      v += a * smoothNoise(x);
      x = rot * x * 1.8 + shift; // Less frequency doubling
      a *= 0.6; // Gentler amplitude reduction
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * uAnimationSpeed;

    // Choose noise function based on uNoiseType
    float noise1, noise2;
    if (uNoiseType < 0.5) {
      // Simplex noise
      noise1 = snoise(uv * uLayer1Scale + vec2(time * uLayer1Speed, time * uLayer1Speed * 0.7)) * uLayer1Amplitude;
      noise2 = snoise(uv * uLayer2Scale + vec2(time * uLayer2Speed * 0.8, -time * uLayer2Speed * 0.6)) * uLayer2Amplitude;
    } else if (uNoiseType < 1.5) {
      // Classic Perlin noise
      noise1 = cnoise(uv * uLayer1Scale + vec2(time * uLayer1Speed, time * uLayer1Speed * 0.7)) * uLayer1Amplitude;
      noise2 = cnoise(uv * uLayer2Scale + vec2(time * uLayer2Speed * 0.8, -time * uLayer2Speed * 0.6)) * uLayer2Amplitude;
    } else if (uNoiseType < 2.5) {
      // VoroNoise
      noise1 = voronoise(uv * uLayer1Scale + vec2(time * uLayer1Speed, time * uLayer1Speed * 0.7), uVoroU, uVoroV) * uLayer1Amplitude;
      noise2 = voronoise(uv * uLayer2Scale + vec2(time * uLayer2Speed * 0.8, -time * uLayer2Speed * 0.6), uVoroU, uVoroV) * uLayer2Amplitude;
    } else if (uNoiseType < 3.5) {
      // Soft Fractional Brownian Motion
      noise1 = softFbm(uv * uLayer1Scale + vec2(time * uLayer1Speed, time * uLayer1Speed * 0.7)) * uLayer1Amplitude;
      noise2 = softFbm(uv * uLayer2Scale + vec2(time * uLayer2Speed * 0.8, -time * uLayer2Speed * 0.6)) * uLayer2Amplitude;
    } else {
      // Smooth rounded noise
      noise1 = smoothNoise(uv * uLayer1Scale + vec2(time * uLayer1Speed, time * uLayer1Speed * 0.7)) * uLayer1Amplitude;
      noise2 = smoothNoise(uv * uLayer2Scale + vec2(time * uLayer2Speed * 0.8, -time * uLayer2Speed * 0.6)) * uLayer2Amplitude;
    }

    // Combine layers
    float combinedNoise = noise1 + noise2;

    // Create gradient coordinates
    float gradientFactor = (uv.y + combinedNoise + 1.0) * 0.5;
    gradientFactor = clamp(gradientFactor, 0.0, 1.0);

    // Apply sharpness control using power curve
    gradientFactor = pow(gradientFactor, uSharpness);

    // Four-color gradient interpolation
    vec3 finalColor;
    if (gradientFactor < 0.33) {
      finalColor = mix(uColor1, uColor2, gradientFactor * 3.0);
    } else if (gradientFactor < 0.66) {
      finalColor = mix(uColor2, uColor3, (gradientFactor - 0.33) * 3.0);
    } else {
      finalColor = mix(uColor3, uColor4, (gradientFactor - 0.66) * 3.0);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function GradientPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Helper function to generate random hex color
  const randomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  // Helper function to generate random value in range
  const randomInRange = (min: number, max: number) => {
    return min + Math.random() * (max - min);
  };

  const [values, set] = useControls('Gradient Controls', () => ({
    animationSpeed: { value: 0.5, min: 0, max: 2, step: 0.01 },
    layer1Scale: { value: 2.0, min: 0.1, max: 10, step: 0.1 },
    layer1Speed: { value: 0.3, min: 0, max: 2, step: 0.01 },
    layer1Amplitude: { value: 0.4, min: 0, max: 1, step: 0.01 },
    layer2Scale: { value: 8.0, min: 0.1, max: 20, step: 0.1 },
    layer2Speed: { value: 0.7, min: 0, max: 2, step: 0.01 },
    layer2Amplitude: { value: 0.2, min: 0, max: 1, step: 0.01 },
    sharpness: { value: 1.0, min: 0.1, max: 4.0, step: 0.01 },
    noiseType: { value: 'simplex', options: ['simplex', 'classic', 'voronoise', 'soft-fbm', 'smooth'] },
    voroU: { value: 1.0, min: 0.0, max: 2.0, step: 0.01 },
    voroV: { value: 1.0, min: 0.0, max: 2.0, step: 0.01 },
    color1: '#1a0d4d', // Deep purple
    color2: '#cc3399', // Magenta
    color3: '#ff6619', // Orange
    color4: '#ffe54d', // Yellow
    randomize: button(() => {
      const noiseTypes = ['simplex', 'classic', 'voronoise', 'soft-fbm', 'smooth'];
      set({
        animationSpeed: randomInRange(0.1, 1.5),
        layer1Scale: randomInRange(0.5, 8),
        layer1Speed: randomInRange(0.1, 1.5),
        layer1Amplitude: randomInRange(0.1, 0.8),
        layer2Scale: randomInRange(2, 15),
        layer2Speed: randomInRange(0.2, 1.8),
        layer2Amplitude: randomInRange(0.05, 0.6),
        sharpness: randomInRange(0.3, 3),
        noiseType: noiseTypes[Math.floor(Math.random() * noiseTypes.length)],
        voroU: randomInRange(0.2, 1.8),
        voroV: randomInRange(0.2, 1.8),
        color1: randomColor(),
        color2: randomColor(),
        color3: randomColor(),
        color4: randomColor()
      });
    })
  }));

  const {
    animationSpeed,
    layer1Scale,
    layer1Speed,
    layer1Amplitude,
    layer2Scale,
    layer2Speed,
    layer2Amplitude,
    sharpness,
    noiseType,
    voroU,
    voroV,
    color1,
    color2,
    color3,
    color4
  } = values;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAnimationSpeed: { value: 0.5 },
    uLayer1Scale: { value: 2.0 },
    uLayer1Speed: { value: 0.3 },
    uLayer1Amplitude: { value: 0.4 },
    uLayer2Scale: { value: 8.0 },
    uLayer2Speed: { value: 0.7 },
    uLayer2Amplitude: { value: 0.2 },
    uSharpness: { value: 1.0 },
    uNoiseType: { value: 0.0 },
    uVoroU: { value: 1.0 },
    uVoroV: { value: 1.0 },
    uColor1: { value: new THREE.Color('#1a0d4d') },
    uColor2: { value: new THREE.Color('#cc3399') },
    uColor3: { value: new THREE.Color('#ff6619') },
    uColor4: { value: new THREE.Color('#ffe54d') }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uAnimationSpeed.value = animationSpeed;
      materialRef.current.uniforms.uLayer1Scale.value = layer1Scale;
      materialRef.current.uniforms.uLayer1Speed.value = layer1Speed;
      materialRef.current.uniforms.uLayer1Amplitude.value = layer1Amplitude;
      materialRef.current.uniforms.uLayer2Scale.value = layer2Scale;
      materialRef.current.uniforms.uLayer2Speed.value = layer2Speed;
      materialRef.current.uniforms.uLayer2Amplitude.value = layer2Amplitude;
      materialRef.current.uniforms.uSharpness.value = sharpness;

      // Convert noise type string to number
      let noiseTypeValue = 0.0;
      if (noiseType === 'classic') noiseTypeValue = 1.0;
      else if (noiseType === 'voronoise') noiseTypeValue = 2.0;
      else if (noiseType === 'soft-fbm') noiseTypeValue = 3.0;
      else if (noiseType === 'smooth') noiseTypeValue = 4.0;

      materialRef.current.uniforms.uNoiseType.value = noiseTypeValue;
      materialRef.current.uniforms.uVoroU.value = voroU;
      materialRef.current.uniforms.uVoroV.value = voroV;
      materialRef.current.uniforms.uColor1.value.set(color1);
      materialRef.current.uniforms.uColor2.value.set(color2);
      materialRef.current.uniforms.uColor3.value.set(color3);
      materialRef.current.uniforms.uColor4.value.set(color4);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[5, 5]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function Experience() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5}/>
      <spotLight position={[1,2,3]} intensity={4}/>
      <GradientPlane />
    </Canvas>
  );
}
