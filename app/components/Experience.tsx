"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { GradientPlane } from "./GradientPlane";

export default function Experience() {
  return (
    <Canvas>
      <OrbitControls />
      <GradientPlane />
    </Canvas>
  );
}
