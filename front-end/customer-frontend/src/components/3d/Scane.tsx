"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode } from "react";

interface SceneProps {
  children: ReactNode;
  className?: string;
}

export default function Scene({ children, className }: SceneProps) {
  return (
    <Canvas className={className}>
      {children}
      <OrbitControls />
    </Canvas>
  );
}
