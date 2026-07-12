import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode } from "react";

interface SceneProps {
  children: ReactNode;
  className: string;
}

export default function LightScene({ children, className }: SceneProps) {
  return (
    <Canvas className={className}>
      <ambientLight intensity={0.5} />
      {/* change the ambient and directional Light props with your condition */}
      <directionalLight position={[10, 10, 5]} />
      {children}
      <OrbitControls />
    </Canvas>
  );
}
