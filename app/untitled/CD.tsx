"use client";
import { useGSAP } from "@gsap/react";
import { useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import gsap from "gsap";
import { useControls } from "leva";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Memoize chromatic aberration offset to avoid recreating Vector2 each render
const chromaticOffsetVec = new THREE.Vector2();

// Optimized segments - 128 is visually indistinguishable from 1000 but much faster
const DEFAULT_SEGMENTS = 128;

function Disc() {
  const texture = useTexture(
    "/assets/cduvmap/textures/M_CompactDisc00_baseColor.png",
  );

  const {
    outerRadius,
    innerRadius,
    thickness,
    metalness,
    roughness,
    iridescence,
    iridescenceIOR,
    iridescenceMin,
    iridescenceMax,
  } = useControls("CD Material", {
    outerRadius: { value: 0.8, min: 0.3, max: 3, step: 0.1 },
    innerRadius: { value: 0.11, min: 0.05, max: 0.5, step: 0.01 },
    thickness: { value: 0.02, min: 0.005, max: 0.1, step: 0.005 },
    metalness: { value: 1, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.2, min: 0, max: 1, step: 0.01 },
    iridescence: { value: 1, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: 1.05, min: 1, max: 2.5, step: 0.01 },
    iridescenceMin: { value: 70, min: 0, max: 500, step: 10 },
    iridescenceMax: { value: 1040, min: 100, max: 1200, step: 10 },
  });

  // Memoize iridescence range to prevent array recreation
  const iridescenceRange = useMemo<[number, number]>(
    () => [iridescenceMin, iridescenceMax],
    [iridescenceMin, iridescenceMax],
  );

  const geometry = useMemo(() => {
    const segments = DEFAULT_SEGMENTS;

    // Create top and bottom ring faces
    const topRing = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      segments,
      1,
    );
    const bottomRing = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      segments,
      1,
    );

    // Remap UVs to radial (center-to-edge) mapping for texture
    [topRing, bottomRing].forEach((ring) => {
      const uvs = ring.attributes.uv;
      const positions = ring.attributes.position;
      const count = uvs.count;

      for (let i = 0; i < count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        const angle = Math.atan2(y, x);
        const radius = Math.sqrt(x * x + y * y);

        const u = (angle + Math.PI) / (Math.PI * 2);
        const v = 1 - (radius - innerRadius) / (outerRadius - innerRadius);

        uvs.setXY(i, u, v);
      }
      //   uvs.needsUpdate = true;
    });

    // Position top and bottom
    topRing.translate(0, 0, thickness / 2);
    bottomRing.rotateX(Math.PI);
    bottomRing.translate(0, 0, -thickness / 2);

    // Create edge (outer rim)
    const outerEdge = new THREE.CylinderGeometry(
      outerRadius,
      outerRadius,
      thickness,
      segments,
      1,
      true,
    );
    outerEdge.rotateX(Math.PI / 2);

    // Create inner edge (hole rim)
    const innerEdge = new THREE.CylinderGeometry(
      innerRadius,
      innerRadius,
      thickness,
      segments,
      1,
      true,
    );
    innerEdge.rotateX(Math.PI / 2);

    // Merge all geometries
    const merged = new THREE.BufferGeometry();
    const geometries = [topRing, bottomRing, outerEdge, innerEdge];

    // Count total vertices and indices
    let totalVertices = 0;
    geometries.forEach((g) => {
      totalVertices += g.attributes.position.count;
    });

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const indices: number[] = [];

    let vertexOffset = 0;

    geometries.forEach((g) => {
      const pos = g.attributes.position;
      const norm = g.attributes.normal;
      const uv = g.attributes.uv;
      const count = pos.count;

      for (let i = 0; i < count; i++) {
        const idx3 = (vertexOffset + i) * 3;
        const idx2 = (vertexOffset + i) * 2;

        positions[idx3] = pos.getX(i);
        positions[idx3 + 1] = pos.getY(i);
        positions[idx3 + 2] = pos.getZ(i);

        normals[idx3] = norm.getX(i);
        normals[idx3 + 1] = norm.getY(i);
        normals[idx3 + 2] = norm.getZ(i);

        uvs[idx2] = uv.getX(i);
        uvs[idx2 + 1] = uv.getY(i);
      }

      if (g.index) {
        const indexCount = g.index.count;
        for (let i = 0; i < indexCount; i++) {
          indices.push(g.index.getX(i) + vertexOffset);
        }
      }

      vertexOffset += count;
    });

    merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    merged.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    merged.setIndex(indices);

    // Cleanup source geometries
    geometries.forEach((g) => g.dispose());

    return merged;
  }, [outerRadius, innerRadius, thickness]);

  // Configure texture once
  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }, [texture]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        map={texture}
        metalness={metalness}
        roughness={roughness}
        iridescence={iridescence}
        iridescenceIOR={iridescenceIOR}
        iridescenceThicknessRange={iridescenceRange}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Memoize light positions to avoid object recreation
const defaultLight1Pos = { x: 11, y: 1, z: -5 };
const defaultLight2Pos = { x: 1.88, y: 2.15, z: -0.34 };
const defaultLight3Pos = { x: 10.8, y: 3.7, z: 3.8 };

function Lights() {
  const {
    ambientIntensity,
    light1Intensity,
    light1Position,
    light2Intensity,
    light2Position,
    light3Intensity,
    light3Position,
  } = useControls("Lighting", {
    ambientIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
    light1Intensity: { value: 3, min: 0, max: 10, step: 0.1 },
    light1Position: { value: defaultLight1Pos },
    light2Intensity: { value: 0.5, min: 0, max: 10, step: 0.1 },
    light2Position: { value: defaultLight2Pos },
    light3Intensity: { value: 0.3, min: 0, max: 10, step: 0.1 },
    light3Position: { value: defaultLight3Pos },
  });

  // Memoize position arrays
  const pos1 = useMemo<[number, number, number]>(
    () => [light1Position.x, light1Position.y, light1Position.z],
    [light1Position.x, light1Position.y, light1Position.z],
  );
  const pos2 = useMemo<[number, number, number]>(
    () => [light2Position.x, light2Position.y, light2Position.z],
    [light2Position.x, light2Position.y, light2Position.z],
  );
  const pos3 = useMemo<[number, number, number]>(
    () => [light3Position.x, light3Position.y, light3Position.z],
    [light3Position.x, light3Position.y, light3Position.z],
  );

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={pos1} intensity={light1Intensity} />
      <directionalLight position={pos2} intensity={light2Intensity} />
      <pointLight position={pos3} intensity={light3Intensity} />
    </>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const mouseWrapperRef = useRef<THREE.Group>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  const {
    positionX,
    positionY,
    positionZ,
    rotationX,
    rotationY,
    spinDuration,
    mouseSensitivity,
  } = useControls("Disc Transform", {
    positionX: { value: 0.09, min: -5, max: 5, step: 0.01 },
    positionY: { value: 0, min: -5, max: 5, step: 0.01 },
    positionZ: { value: 0.8, min: -5, max: 5, step: 0.01 },
    rotationX: { value: -24, min: -180, max: 180, step: 1 },
    rotationY: { value: 43, min: -180, max: 180, step: 1 },
    spinDuration: { value: 8, min: 1, max: 30, step: 0.5 },
    mouseSensitivity: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
  });

  // Memoize position and rotation arrays
  const position = useMemo<[number, number, number]>(
    () => [positionX, positionY, positionZ],
    [positionX, positionY, positionZ],
  );
  const rotation = useMemo<[number, number, number]>(
    () => [(rotationX * Math.PI) / 180, (rotationY * Math.PI) / 180, 0],
    [rotationX, rotationY],
  );

  // Track mouse position with passive listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mousePos.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Use lerp instead of gsap.to in useFrame for better performance
  useFrame((_, delta) => {
    if (!mouseWrapperRef.current) return;

    // Target rotation based on mouse
    targetRotation.current.x = mousePos.current.y * mouseSensitivity;
    targetRotation.current.y = mousePos.current.x * mouseSensitivity;

    // Lerp toward target (smooth follow)
    const lerpFactor = 1 - Math.pow(0.001, delta);
    mouseWrapperRef.current.rotation.x +=
      (targetRotation.current.x - mouseWrapperRef.current.rotation.x) *
      lerpFactor;
    mouseWrapperRef.current.rotation.y +=
      (targetRotation.current.y - mouseWrapperRef.current.rotation.y) *
      lerpFactor;
  });

  useGSAP(
    () => {
      if (!groupRef.current) return;

      // positionX: { value: 0.09, min: -5, max: 5, step: 0.01 },
      // positionY: { value: 0, min: -5, max: 5, step: 0.01 },
      // positionZ: { value: 0.8, min: -5, max: 5, step: 0.01 },
      // rotationX: { value: -24, min: -180, max: 180, step: 1 },
      // rotationY: { value: 43, min: -180, max: 180, step: 1 },
      // spinDuration: { value: 8, min: 1, max: 30, step: 0.5 },
      // mouseSensitivity: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
      // Set Position
      gsap.set(groupRef.current.position, {
        x: 0.09,
        y: 0,
        z: 0.8,
      });

      // Set Rotation (Convert degrees to radians for Three.js)
      // Formula: degrees * (Math.PI / 180)
      gsap.set(groupRef.current.rotation, {
        x: -24 * (Math.PI / 180),
        y: 43 * (Math.PI / 180),
        z: 0, // Start Z at 0
      });
      const tl = gsap.timeline({});

      tl.from(
        groupRef.current.position,
        {
          ease: "power3.out",
          duration: 1,
          x: 0,
          y: 2,
          z: 1,
        },
        0,
      );

      gsap.to(groupRef.current.rotation, {
        z: Math.PI * 2,
        duration: spinDuration,
        ease: "none",
        repeat: -1,
      });
    },
    { dependencies: [spinDuration], scope: groupRef },
  );

  return (
    <group ref={mouseWrapperRef}>
      <group ref={groupRef}>
        <Disc />
      </group>
    </group>
  );
}

function Effects() {
  const {
    bloomIntensity,
    bloomThreshold,
    bloomSmoothing,
    bloomRadius,
    toneMapping,
    exposure,
  } = useControls("Bloom", {
    bloomIntensity: { value: 3, min: 0, max: 3, step: 0.01 },
    bloomThreshold: { value: 0, min: 0, max: 1, step: 0.01 },
    bloomSmoothing: { value: 0, min: 0, max: 1, step: 0.01 },
    bloomRadius: { value: 0.19, min: 0, max: 1, step: 0.01 },
    toneMapping: {
      value: "NEUTRAL",
      options: [
        "ACES_FILMIC",
        "REINHARD",
        "REINHARD2",
        "CINEON",
        "LINEAR",
        "NEUTRAL",
      ],
    },
    exposure: { value: 0, min: 0, max: 3, step: 0.01 },
  });

  const { chromaticOffset, vignetteIntensity, vignetteDarkness, noiseOpacity } =
    useControls("Lens Effects", {
      chromaticOffset: { value: 0, min: 0, max: 0.02, step: 0.001 },
      vignetteIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
      vignetteDarkness: { value: 0, min: 0, max: 1, step: 0.01 },
      noiseOpacity: { value: 0.3, min: 0, max: 0.3, step: 0.01 },
    });

  // Memoize tone mapping mode
  const toneMappingMode = useMemo(
    () => ToneMappingMode[toneMapping as keyof typeof ToneMappingMode],
    [toneMapping],
  );

  // Update chromatic offset vector instead of creating new one
  chromaticOffsetVec.set(chromaticOffset, chromaticOffset);

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
        radius={bloomRadius}
        blendFunction={BlendFunction.ADD}
      />

      <ChromaticAberration
        offset={chromaticOffsetVec}
        radialModulation
        modulationOffset={0.5}
      />
      <Vignette
        offset={vignetteIntensity}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />

      <ToneMapping
        mode={toneMappingMode}
        exposure={exposure}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default function CD() {
  const { cameraZ, cameraFov } = useControls("Camera", {
    cameraZ: { value: 3, min: 1, max: 10, step: 0.1 },
    cameraFov: { value: 50, min: 20, max: 120, step: 1 },
  });

  // Memoize camera position
  const cameraPosition = useMemo<[number, number, number]>(
    () => [0, 0, cameraZ],
    [cameraZ],
  );

  return (
    <div
      className="z-0 pointer-events-none"
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    >
      <Canvas
        className="pointer-events-none"
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <Lights />
        <Scene />
        <Effects />
      </Canvas>
    </div>
  );
}
