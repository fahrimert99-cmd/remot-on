import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Label } from "./Label";
import { C } from "./theme";

const ORBIT = 14;

export const ThreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg}, #1a0b2e)` }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 55 }}>
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 6, 6]} intensity={180} color={C.cyan} />
        <pointLight position={[-6, -4, 4]} intensity={160} color={C.pink} />
        <directionalLight position={[0, 5, 5]} intensity={1.2} />

        <mesh rotation={[t * 0.6, t * 0.9, 0]} position={[1.6, 0, 0]}>
          <torusKnotGeometry args={[1.5, 0.45, 220, 32, 2, 3]} />
          <meshStandardMaterial color={C.violet} metalness={0.7} roughness={0.2} />
        </mesh>

        {new Array(ORBIT).fill(0).map((_, i) => {
          const a = (i / ORBIT) * Math.PI * 2 + t * 0.8;
          return (
            <mesh
              key={i}
              position={[1.6 + Math.cos(a) * 3.4, Math.sin(a * 2) * 0.6, Math.sin(a) * 3.4]}
              rotation={[t * 2 + i, t * 1.5, 0]}
            >
              <boxGeometry args={[0.35, 0.35, 0.35]} />
              <meshStandardMaterial
                color={i % 2 ? C.cyan : C.gold}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </ThreeCanvas>
      <Label n="01 — 3D" title="Gerçek 3D Grafik" sub="Three.js + ışık + malzeme" />
    </AbsoluteFill>
  );
};
