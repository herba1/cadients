"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { vertexShader } from "./shaders/metaball.vert";
import {
  fragmentShader,
  MAX_BALLS,
  BALLS_PER_CLUSTER,
  MAX_CLUSTERS,
} from "./shaders/metaball.frag";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Helper to convert hex color to THREE.Color
function hexToVec3(hex: string): THREE.Vector3 {
  const color = new THREE.Color(hex);
  return new THREE.Vector3(color.r, color.g, color.b);
}

// Retro Atari-style rainbow colors (5 colors for the rainbow gradient)
const RETRO_RAINBOW = [
  "#c68903", 
  "#ffff00", 
  "#ffff00", 
  "#ffff00", 
  "#ffff00", 
];

// Varied radius multipliers for each ball position within a cluster
// Creates organic variety - some balls larger, some smaller
const BALL_RADIUS_MULTIPLIERS = [
  1.4, // Ball 0 (center/red): largest - dominates the center
  0.9, // Ball 1 (top/orange): medium-small
  1.2, // Ball 2 (right/yellow): large
  0.85, // Ball 3 (bottom/green): small
  1.1, // Ball 4 (left/cyan): medium-large
];

export function GradientPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const clustersRef = useRef([
    { x: 0.45, y: 0.5, spread: 0.14 },
    { x: 1.75, y: 0.48, spread: 0.14 },
    { x: 1.1, y: 0.55, spread: 0.14 },
  ]);

  // Metaball controls
  const metaballControls = useControls("Metaballs", {
    threshold: { value: 1.97, min: 0.1, max: 3.0, step: 0.01 },
    edgeSoftness: { value: 0.5, min: 0.01, max: 0.5, step: 0.01 },
    animationSpeed: { value: 0.2, min: 0.0, max: 3.0, step: 0.1 },
    clusterCount: { value: 3, min: 1, max: MAX_CLUSTERS, step: 1 },
    // Control how much the ball sizes vary (0 = all same, 1 = full variation)
    sizeVariation: { value: 0.85, min: 0.0, max: 1.5, step: 0.05 },
    // Rotation speed for balls around cluster center
    rotationSpeed: { value: 1.3, min: -2.0, max: 2.0, step: 0.05 },
  });

  // Rainbow color controls (shared across all clusters)
  const rainbowControls = useControls("Rainbow Colors", {
    color1: RETRO_RAINBOW[0],
    color2: RETRO_RAINBOW[1],
    color3: RETRO_RAINBOW[2],
    color4: RETRO_RAINBOW[3],
    color5: RETRO_RAINBOW[4],
    background: "#0a0a0a",
  });

  useGSAP(() => {
    const tl = gsap.timeline();

    // Animate Cluster 1 (Left) moving to the center
    tl.from(clustersRef.current[0], {
      x: 0.4,
      y: 0.25,
      spread: 0.1, // Make it explode slightly
      duration: 2,
      ease: "power4.out",
    });
    tl.from(
      clustersRef.current[2],
      {
        x: 1.02,
        y: 0.29,
        spread: 0.1, // Contract it tight
        duration: 2,
        ease: "power4.out",
      },
      "<+=0.2",
    ).from(
      clustersRef.current[1],
      {
        x: 1.65,
        y: 0.25,
        spread: 0.08,
        duration: 2,
        ease: "power4.out",
      },
      "<+=0.2",
    );
  }, []);

  // Cluster 1 controls - positioned left side
  const cluster1 = useControls("Cluster 1", {
    centerX: { value: 0.4, min: 0.0, max: 2.0, step: 0.01 },
    centerY: { value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    // TIGHT spread for overlapping balls (key for continuous mass)
    spread: { value: 0.14, min: 0.01, max: 0.15, step: 0.005 },
    // Larger radius ensures overlap
    baseRadius: { value: 0.08, min: 0.05, max: 0.25, step: 0.01 },
    moveRangeX: { value: 0, min: 0.0, max: 0.8, step: 0.01 },
    moveRangeY: { value: 0, min: 0.0, max: 0.5, step: 0.01 },
    speedX: { value: 0.4, min: 0.0, max: 2.0, step: 0.1 },
    speedY: { value: 0.5, min: 0.0, max: 2.0, step: 0.1 },
  });

  // Cluster 2 controls - positioned right side (similar to cluster 1)
  const cluster2 = useControls("Cluster 2", {
    centerX: { value: 1.65, min: 0.0, max: 2.0, step: 0.01 },
    centerY: { value: 0.48, min: 0.0, max: 1.0, step: 0.01 },
    // Same spread as cluster 1
    spread: { value: 0.14, min: 0.01, max: 0.3, step: 0.005 },
    // Same radius as cluster 1
    baseRadius: { value: 0.08, min: 0.05, max: 0.25, step: 0.01 },
    moveRangeX: { value: 0, min: 0.0, max: 0.8, step: 0.01 },
    moveRangeY: { value: 0, min: 0.0, max: 0.5, step: 0.01 },
    speedX: { value: 0.5, min: 0.0, max: 2.0, step: 0.1 },
    speedY: { value: 0.4, min: 0.0, max: 2.0, step: 0.1 },
  });

  // Cluster 3 controls - positioned center-top (similar to cluster 1)
  const cluster3 = useControls("Cluster 3", {
    centerX: { value: 1.02, min: 0.0, max: 2.0, step: 0.01 },
    centerY: { value: 0.55, min: 0.0, max: 1.0, step: 0.01 },
    // Same spread as cluster 1
    spread: { value: 0.14, min: 0.01, max: 0.3, step: 0.005 },
    // Same radius as cluster 1
    baseRadius: { value: 0.08, min: 0.05, max: 0.25, step: 0.01 },
    moveRangeX: { value: 0, min: 0.0, max: 0.8, step: 0.01 },
    moveRangeY: { value: 0, min: 0.0, max: 0.5, step: 0.01 },
    speedX: { value: 0, min: 0.0, max: 2.0, step: 0.1 },
    speedY: { value: 0.55, min: 0.0, max: 2.0, step: 0.1 },
  });

  const clusters = [cluster1, cluster2, cluster3];

  // Shared rainbow colors for all clusters
  const rainbowColors = [
    rainbowControls.color1,
    rainbowControls.color2,
    rainbowControls.color3,
    rainbowControls.color4,
    rainbowControls.color5,
  ];

  // Initialize uniform arrays
  const uniforms = useMemo(() => {
    // Create arrays for all balls
    const positions: THREE.Vector2[] = [];
    const colors: THREE.Vector3[] = [];
    const radii: number[] = [];

    // Initialize with zeros (will be updated in useFrame)
    for (let i = 0; i < MAX_BALLS; i++) {
      positions.push(new THREE.Vector2(0, 0));
      colors.push(new THREE.Vector3(1, 1, 1));
      radii.push(0.05);
    }

    return {
      uTime: { value: 0 },
      uThreshold: { value: metaballControls.threshold },
      uEdgeSoftness: { value: metaballControls.edgeSoftness },
      uAnimationSpeed: { value: metaballControls.animationSpeed },
      uBackgroundColor: { value: hexToVec3(rainbowControls.background) },
      uBlobPositions: { value: positions },
      uBlobColors: { value: colors },
      uBlobRadii: { value: radii },
      uActiveBalls: {
        value: metaballControls.clusterCount * BALLS_PER_CLUSTER,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log uniform structure on mount for verification
  useEffect(() => {
    console.log("Cluster Metaball Uniforms initialized:");
    console.log("- MAX_BALLS:", MAX_BALLS);
    console.log("- BALLS_PER_CLUSTER:", BALLS_PER_CLUSTER);
    console.log("- MAX_CLUSTERS:", MAX_CLUSTERS);
    console.log("- Active clusters:", metaballControls.clusterCount);
    console.log(
      "- Active balls:",
      metaballControls.clusterCount * BALLS_PER_CLUSTER,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;

    const t = state.clock.elapsedTime * metaballControls.animationSpeed;

    // Update basic uniforms
    materialRef.current.uniforms.uTime.value = t;
    materialRef.current.uniforms.uThreshold.value = metaballControls.threshold;
    materialRef.current.uniforms.uEdgeSoftness.value =
      metaballControls.edgeSoftness;
    materialRef.current.uniforms.uBackgroundColor.value.copy(
      hexToVec3(rainbowControls.background),
    );
    materialRef.current.uniforms.uActiveBalls.value =
      metaballControls.clusterCount * BALLS_PER_CLUSTER;

    const positions = materialRef.current.uniforms.uBlobPositions.value;
    const blobColors = materialRef.current.uniforms.uBlobColors.value;
    const radii = materialRef.current.uniforms.uBlobRadii.value;

    // Update each cluster's balls
    for (
      let clusterIdx = 0;
      clusterIdx < metaballControls.clusterCount;
      clusterIdx++
    ) {
      const activeState = clustersRef.current[clusterIdx];

      const noiseX = Math.sin(t * 0.5 + clusterIdx) * 0.01;
      const noiseY = Math.cos(t * 0.3 + clusterIdx) * 0.01;

      const cluster = clusters[clusterIdx];

      // Calculate cluster center position (animated) OLDOLDOLD
      // const clusterCenterX =
      //   cluster.centerX +
      //   Math.sin(t * cluster.speedX + clusterIdx * 2.0) * cluster.moveRangeX;
      // const clusterCenterY =
      //   cluster.centerY +
      //   Math.cos(t * cluster.speedY + clusterIdx * 1.5) * cluster.moveRangeY;

      // NEW
      const clusterCenterX = activeState.x + noiseX;
      const clusterCenterY = activeState.y + noiseY;
      const currentSpread = activeState.spread;

      // Position each ball in the cluster - TIGHT arrangement for overlap
      // Ball arrangement: center ball + 4 surrounding balls in a tight cross/flower pattern
      // Add rotation around cluster center OLD OLD OLD
      // const clusterRotation =
      //   t * metaballControls.rotationSpeed + clusterIdx * ((Math.PI * 2) / 3);

      // NEW
      const clusterRotation = t * metaballControls.rotationSpeed + clusterIdx;

      for (let ballIdx = 0; ballIdx < BALLS_PER_CLUSTER; ballIdx++) {
        const globalIdx = clusterIdx * BALLS_PER_CLUSTER + ballIdx;

        let offsetX = 0;
        let offsetY = 0;

        if (ballIdx === 0) {
          // Center ball - stays at cluster center
          offsetX = 0;
          offsetY = 0;
        } else {
          // Surrounding balls in a tight cross pattern
          // Ball 1: top, Ball 2: right, Ball 3: bottom, Ball 4: left
          // Add rotation to the base angle
          const baseAngle = ((ballIdx - 1) / 4) * Math.PI * 2;
          const rotatedAngle = baseAngle + clusterRotation;
          // Very small offset - balls should heavily overlap
          offsetX = Math.cos(rotatedAngle) * currentSpread;
          offsetY = Math.sin(rotatedAngle) * currentSpread;
        }

        // Add subtle organic movement (very small wobble to keep cohesion)
        const wobbleAmount = 0.008;
        const wobbleX =
          Math.sin(t * 0.8 + ballIdx * 1.5 + clusterIdx * 2.0) * wobbleAmount;
        const wobbleY =
          Math.cos(t * 0.9 + ballIdx * 1.2 + clusterIdx * 1.5) * wobbleAmount;

        positions[globalIdx].x = clusterCenterX + offsetX + wobbleX;
        positions[globalIdx].y = clusterCenterY + offsetY + wobbleY;

        // Each cluster uses the same rainbow colors (shared retro palette)
        blobColors[globalIdx].copy(hexToVec3(rainbowColors[ballIdx]));

        // Apply varied radius multipliers for organic variety
        // Lerp between 1.0 (uniform) and the varied multiplier based on sizeVariation
        const baseMultiplier = BALL_RADIUS_MULTIPLIERS[ballIdx];
        const variationAmount = metaballControls.sizeVariation;
        const finalMultiplier = 1.0 + (baseMultiplier - 1.0) * variationAmount;
        radii[globalIdx] = cluster.baseRadius * finalMultiplier;
      }
    }
  });

  return (
    <>
      <mesh rotation={[0, Math.PI / 16, Math.PI / -15]}>
        <planeGeometry args={[16, 8]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </>
  );
}
