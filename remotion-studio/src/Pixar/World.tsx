import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { mulberry32 } from "../Realistic/util";
import { bulbPos, butterflyPos, ease, seg } from "./anim";

// Çayırdaki karakter yolunu boş bırak
const onPath = (x: number, z: number) => x > -12 && x < 2.5 && Math.abs(z) < 1.8;

const Ground: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(160, 160);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const a = new THREE.Color("#5fb043");
    const b = new THREE.Color("#86c95a");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      const roll = Math.max(0, d - 14) * 0.04;
      pos.setY(i, Math.sin(x / 9) * Math.cos(z / 11) * roll * 2.2);
      c.copy(a).lerp(b, 0.5 + 0.5 * Math.sin(x / 5 + Math.cos(z / 4)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
};

const Tree: React.FC<{ p: [number, number, number]; s: number; c: string }> = ({ p, s, c }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.2, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.32, 2.4, 12]} />
      <meshStandardMaterial color="#a06a42" roughness={0.9} />
    </mesh>
    {[
      [0, 3.2, 0, 1.5],
      [-0.9, 2.6, 0.3, 1.0],
      [0.9, 2.7, -0.2, 1.1],
      [0.2, 4.1, 0.1, 1.0],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
        <sphereGeometry args={[r, 32, 24]} />
        <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.6} sheenColor="#d8ffb0" />
      </mesh>
    ))}
  </group>
);

const Mushroom: React.FC<{ p: [number, number, number]; s: number; rot?: number }> = ({ p, s, rot = 0 }) => (
  <group position={p} scale={s} rotation={[0, 0, rot]}>
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.22, 0.9, 16]} />
      <meshPhysicalMaterial color="#fff3df" roughness={0.6} sheen={1} sheenColor="#ffffff" />
    </mesh>
    <mesh position={[0, 0.88, 0]} scale={[1, 0.62, 1]} castShadow>
      <sphereGeometry args={[0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color="#ff4d5e" roughness={0.35} clearcoat={0.6} />
    </mesh>
    {[
      [0.25, 1.2, 0.3],
      [-0.3, 1.18, 0.2],
      [0.05, 1.27, -0.3],
      [-0.1, 1.08, 0.48],
      [0.42, 1.02, -0.12],
    ].map(([x, y, z], i) => (
      <mesh key={i} position={[x, y, z]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    ))}
  </group>
);

const Flowers: React.FC = () => {
  const { heads, stems } = useMemo(() => {
    const rnd = mulberry32(21);
    const N = 420;
    const hg = new THREE.SphereGeometry(0.09, 12, 8);
    const sg = new THREE.CylinderGeometry(0.012, 0.012, 1, 5);
    sg.translate(0, 0.5, 0);
    const h = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ roughness: 0.6 }), N);
    const st = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: "#4f9a3c" }), N);
    const cols = ["#ffffff", "#ffd84d", "#ff8fb8", "#c7a4ff", "#fff1a8"].map((c) => new THREE.Color(c));
    const m = new THREE.Object3D();
    let i = 0;
    while (i < N) {
      const x = (rnd() - 0.5) * 40;
      const z = -18 + rnd() * 24;
      if (onPath(x, z)) continue;
      const hh = 0.2 + rnd() * 0.35;
      m.position.set(x, 0, z);
      m.scale.set(1, hh, 1);
      m.updateMatrix();
      st.setMatrixAt(i, m.matrix);
      m.position.set(x, hh, z);
      const s = 0.8 + rnd() * 0.8;
      m.scale.set(s, s * 0.7, s);
      m.updateMatrix();
      h.setMatrixAt(i, m.matrix);
      h.setColorAt(i, cols[Math.floor(rnd() * cols.length)]);
      i++;
    }
    h.castShadow = true;
    return { heads: h, stems: st };
  }, []);
  return (
    <>
      <primitive object={heads} />
      <primitive object={stems} />
    </>
  );
};

const Grass: React.FC = () => {
  const mesh = useMemo(() => {
    const rnd = mulberry32(5);
    const N = 1600;
    const g = new THREE.ConeGeometry(0.05, 0.45, 4);
    g.translate(0, 0.22, 0);
    const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
    const m = new THREE.Object3D();
    const c = new THREE.Color();
    let i = 0;
    while (i < N) {
      const x = (rnd() - 0.5) * 36;
      const z = -16 + rnd() * 22;
      if (onPath(x, z) && rnd() < 0.85) continue;
      m.position.set(x, 0, z);
      m.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4);
      const s = 0.6 + rnd() * 0.9;
      m.scale.set(s, s, s);
      m.updateMatrix();
      im.setMatrixAt(i, m.matrix);
      c.setHSL(0.26 + rnd() * 0.05, 0.55, 0.35 + rnd() * 0.12);
      im.setColorAt(i, c);
      i++;
    }
    im.receiveShadow = true;
    return im;
  }, []);
  return <primitive object={mesh} />;
};

const Cloud: React.FC<{ p: [number, number, number]; s: number }> = ({ p, s }) => {
  const f = useCurrentFrame();
  return (
    <group position={[p[0] + f * 0.01, p[1], p[2]]} scale={s}>
      {[
        [0, 0, 0, 1.6],
        [1.6, -0.3, 0.2, 1.2],
        [-1.6, -0.35, 0, 1.15],
        [0.7, 0.8, -0.2, 1.1],
        [-0.8, 0.6, 0.1, 1.0],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 32, 24]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff6ea" emissiveIntensity={0.55} roughness={1} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

const Butterfly: React.FC = () => {
  const f = useCurrentFrame();
  const bulb = bulbPos(f);
  const p = butterflyPos(f, bulb);
  const q = butterflyPos(f - 1, bulbPos(f - 1));
  const sitting = f >= 258;
  const flap = sitting ? 0.95 + 0.25 * Math.sin(f / 9) : 0.25 + 1.15 * Math.abs(Math.sin(f * 0.85));
  const heading = sitting ? Math.PI / 2 - 0.25 : Math.atan2(p[0] - q[0], p[2] - q[2] + 1e-4);
  const wing = (side: number) => (
    <group rotation={[0, 0, side * flap]}>
      <mesh position={[side * 0.2, 0.05, 0.06]} scale={[0.22, 0.18, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#b77dff" emissive="#7a3cff" emissiveIntensity={0.35} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
      <mesh position={[side * 0.15, 0.05, -0.14]} scale={[0.14, 0.12, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#ff8fd0" emissive="#ff4fa8" emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
  return (
    <group position={p} rotation={[0, heading, 0]} scale={1.8}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.22, 6, 12]} />
        <meshStandardMaterial color="#3a2a4a" />
      </mesh>
      {wing(1)}
      {wing(-1)}
    </group>
  );
};

const Sparkles: React.FC = () => {
  const f = useCurrentFrame();
  const t = seg(f, 254, 290);
  if (t <= 0 || t >= 1) return null;
  const top = bulbPos(f);
  return (
    <>
      {new Array(18).fill(0).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = ease(t) * (1.4 + (i % 3) * 0.4);
        const s = Math.sin(t * Math.PI) * 0.09;
        return (
          <mesh key={i} position={[top[0] + Math.cos(a) * r, top[1] - 0.3 + Math.sin(a) * r * 0.7, Math.sin(a * 2) * 0.4]} rotation={[f / 5, f / 7, 0]} scale={s}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={i % 2 ? "#fff3a0" : "#ffd0f0"} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
};

export const World: React.FC = () => (
  <>
    <Ground />
    {/* Arka plandaki tepeler */}
    {[
      [-30, -14, -55, 26, "#7cc46a"],
      [10, -18, -62, 30, "#95d27a"],
      [42, -12, -50, 22, "#6db45f"],
      [-55, -10, -40, 20, "#88cc70"],
    ].map(([x, y, z, r, c], i) => (
      <mesh key={i} position={[x as number, y as number, z as number]} receiveShadow>
        <sphereGeometry args={[r as number, 64, 32]} />
        <meshStandardMaterial color={c as string} roughness={0.95} />
      </mesh>
    ))}
    <Tree p={[-8, 0, -9]} s={1.2} c="#5fb85a" />
    <Tree p={[6.5, 0, -11]} s={1.5} c="#6cc35c" />
    <Tree p={[-15, 0, -14]} s={1.7} c="#56aa52" />
    <Tree p={[14, 0, -7]} s={1.1} c="#63b957" />
    <Tree p={[1.5, 0, -18]} s={1.9} c="#5aaf56" />
    <Mushroom p={[2.9, 0, -1.6]} s={1.3} rot={0.06} />
    <Mushroom p={[3.8, 0, -0.5]} s={0.7} rot={-0.12} />
    <Mushroom p={[-5, 0, -2.8]} s={0.9} />
    {[
      [4.6, 0.15, 0.9, 0.35],
      [-2.5, 0.1, -2.2, 0.25],
      [-8, 0.2, 1.8, 0.4],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} scale={[1, 0.7, 1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[r, 1]} />
        <meshStandardMaterial color="#b9b4c6" roughness={0.8} />
      </mesh>
    ))}
    <Flowers />
    <Grass />
    <Cloud p={[-22, 20, -70]} s={2.4} />
    <Cloud p={[8, 24, -80]} s={3} />
    <Cloud p={[30, 18, -65]} s={2} />
    <Cloud p={[-48, 22, -75]} s={2.6} />
    <Butterfly />
    <Sparkles />
  </>
);
