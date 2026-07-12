import { MeshTransmissionMaterial } from "@react-three/drei";
import LightScene from "../LightScene";

export default function Search() {
  return (
    <>
      <LightScene className="absolute inset-0 w-full h-full z-10">
        <mesh scale={[2, 0.8, 0.1]}>
          <planeGeometry args={[1, 1]} />
          <MeshTransmissionMaterial
            transmission={0.9}
            roughness={0.1}
            thickness={0.5}
            chromaticAberration={0.2}
            ior={1.5}
            backside
          />
        </mesh>
      </LightScene>
    </>
  );
}
