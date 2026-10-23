import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { blink, butterflyPos, bulbPos, charState, clamp01, ease, seg, smile } from "./anim";

const BODY = "#ff7440";
const BODY_DARK = "#e85a2c";

const bodyMat = {
  color: BODY,
  roughness: 0.42,
  sheen: 1,
  sheenColor: new THREE.Color("#ffd2b8"),
  sheenRoughness: 0.5,
  clearcoat: 0.25,
  clearcoatRoughness: 0.4,
};

const Eye: React.FC<{ x: number; gaze: [number, number]; lid: number }> = ({ x, gaze, lid }) => {
  const n = new THREE.Vector3(gaze[0], gaze[1], 1).normalize();
  return (
    <group position={[x, 1.47, 0.72]} scale={[1, 1 - lid * 0.92, 1]}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 48, 32]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={1} />
      </mesh>
      <group position={[n.x * 0.19, n.y * 0.19, n.z * 0.19]}>
        <mesh>
          <sphereGeometry args={[0.15, 32, 24]} />
          <meshPhysicalMaterial color="#3a2414" roughness={0.1} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <sphereGeometry args={[0.095, 24, 16]} />
          <meshStandardMaterial color="#0b0604" roughness={0.1} />
        </mesh>
        <mesh position={[0.05, 0.06, 0.12]}>
          <sphereGeometry args={[0.04, 16, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

export const Character: React.FC = () => {
  const f = useCurrentFrame();
  const s = charState(f);
  const prev = charState(f - 2);
  const sm = smile(f);
  const lid = blink(f);
  const sx = 1 / Math.sqrt(s.sy);

  // Göz takibi: kelebek karakterin yerel uzayına dönüştürülür
  const bulb = bulbPos(f);
  const b = butterflyPos(f, bulb);
  const lx = b[0] - s.x;
  const ly = b[1] - (s.y + 1.47);
  const lz = b[2];
  const cos = Math.cos(-s.yaw);
  const sin = Math.sin(-s.yaw);
  const rx = lx * cos + lz * sin;
  const rz = -lx * sin + lz * cos;
  const track = f >= 150 ? ease(seg(f, 150, 160)) : 0;
  const idleGaze: [number, number] = f < 110 ? [0.25 * (1 - ease(seg(f, 92, 106))), -0.05] : [0.3 * Math.sin(((f - 110) / 40) * Math.PI * 2), 0.05];
  const len = Math.hypot(rx, ly, Math.max(rz, 1));
  const gaze: [number, number] = [
    idleGaze[0] * (1 - track) + clamp(rx / len, 0.55) * track,
    idleGaze[1] * (1 - track) + clamp(ly / len, 0.55) * track,
  ];

  // Anten: gövdenin hareketini gecikmeli takip eder (follow-through)
  const bend = (prev.sy - s.sy) * 2.2 + (prev.y - s.y) * 0.25 + 0.06 * Math.sin(f / 9) - s.lean * 1.4;
  const happy = f >= 252 ? ease(seg(f, 252, 262)) : 0;
  const glow = 1 + 1.5 * clamp01(1 - Math.hypot(b[0] - bulb[0], b[1] - bulb[1], b[2] - bulb[2]) / 3);

  const armUp = happy * (0.9 + 0.35 * Math.sin(f / 3));

  return (
    <group position={[s.x, s.y, 0]} rotation={[0, s.yaw, s.lean]}>
      {/* Ayaklar */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.09, 0.22]} scale={[0.34, 0.17, 0.44]} castShadow>
          <sphereGeometry args={[1, 32, 16]} />
          <meshPhysicalMaterial {...bodyMat} color={BODY_DARK} />
        </mesh>
      ))}
      <group scale={[sx, s.sy, sx]}>
        <mesh position={[0, 1.15, 0]} scale={[1, 1.15, 1]} castShadow receiveShadow>
          <sphereGeometry args={[1, 96, 64]} />
          <meshPhysicalMaterial {...bodyMat} />
        </mesh>
        {/* Karın */}
        <mesh position={[0, 0.78, 0.66]} scale={[0.62, 0.55, 0.36]}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshPhysicalMaterial color="#ffe7c9" roughness={0.5} sheen={1} sheenColor="#fff4e6" />
        </mesh>
        <Eye x={-0.36} gaze={gaze} lid={lid} />
        <Eye x={0.36} gaze={gaze} lid={lid} />
        {/* Kaşlar */}
        {[-1, 1].map((d) => (
          <mesh
            key={d}
            position={[d * 0.36, 1.86 + happy * 0.06, 0.82]}
            rotation={[0, 0, d * (-0.15 - happy * 0.15)]}
            scale={[0.18, 0.045, 0.05]}
          >
            <sphereGeometry args={[1, 16, 8]} />
            <meshStandardMaterial color="#5a2a14" />
          </mesh>
        ))}
        {/* Yanaklar */}
        {[-1, 1].map((d) => (
          <mesh key={d} position={[d * 0.66, 1.17, 0.7]} rotation={[0, d * 0.75, 0]} scale={[0.17, 0.1, 0.04]}>
            <sphereGeometry args={[1, 24, 12]} />
            <meshStandardMaterial color="#ff5f7e" transparent opacity={0.35 + sm * 0.4} />
          </mesh>
        ))}
        {/* Ağız: gülümseme yayı */}
        <mesh position={[0, 1.1 - sm * 0.02, 0.975]} rotation={[-0.15, 0, Math.PI]}>
          <torusGeometry args={[0.13 + sm * 0.09, 0.035, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#4a1c10" roughness={0.6} />
        </mesh>
        {/* Kollar */}
        {[-1, 1].map((d) => (
          <group key={d} position={[d * 0.95, 1.05, 0.1]} rotation={[0, 0, d * (0.5 + armUp) + s.crouch * d * -0.3]}>
            <mesh position={[d * 0.18, -0.12, 0]} rotation={[0, 0, d * 1.1]} castShadow>
              <capsuleGeometry args={[0.12, 0.28, 8, 16]} />
              <meshPhysicalMaterial {...bodyMat} />
            </mesh>
          </group>
        ))}
        {/* Anten */}
        <group position={[0, 2.25, 0]} rotation={[bend * 0.4, 0, bend]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 0.6, 12]} />
            <meshPhysicalMaterial {...bodyMat} color={BODY_DARK} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.14, 32, 16]} />
            <meshStandardMaterial color="#ffe27a" emissive="#ffc93a" emissiveIntensity={glow} />
          </mesh>
          <pointLight position={[0, 0.65, 0]} color="#ffd36a" intensity={glow * 0.8} distance={3} />
        </group>
      </group>
    </group>
  );
};

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
