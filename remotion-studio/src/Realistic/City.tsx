import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Overlay } from "./Overlay";
import { makeGlowTexture, mulberry32, SCENE_LEN } from "./util";

const BLOCK = 40;
const ROAD = 10;
const CELL = BLOCK + ROAD;
const N = 9; // merkezden her yöne blok sayısı
const VARIANTS = 5;
const TEX_W = 32; // dokunun temsil ettiği dünya genişliği
const TEX_H = 128;

// Işıklı pencere dokusu
const makeWindowTexture = (seed: number, litProb: number) => {
  const rnd = mulberry32(seed);
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#05070b";
  g.fillRect(0, 0, 256, 512);
  const warm = ["#ffd9a0", "#ffc87a", "#fff1d6", "#ffe2b8"];
  const cool = ["#cfe6ff", "#a9d1ff", "#e8f3ff"];
  for (let row = 0; row < 32; row++) {
    const floorLit = rnd() < 0.85;
    for (let col = 0; col < 16; col++) {
      const x = col * 16;
      const y = row * 16;
      const lit = floorLit && rnd() < litProb;
      if (lit) {
        const pal = rnd() < 0.75 ? warm : cool;
        g.globalAlpha = 0.55 + rnd() * 0.45;
        g.fillStyle = pal[Math.floor(rnd() * pal.length)];
      } else {
        g.globalAlpha = 1;
        g.fillStyle = rnd() < 0.5 ? "#0d121b" : "#111826";
      }
      g.fillRect(x + 3, y + 4, 10, 9);
    }
  }
  g.globalAlpha = 1;
  // Sol üst köşe: çatı için koyu piksel
  g.fillStyle = "#040507";
  g.fillRect(0, 0, 3, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
};

const buildCity = () => {
  const rnd = mulberry32(7);
  const groups: THREE.BufferGeometry[][] = Array.from({ length: VARIANTS }, () => []);
  for (let bx = -N; bx <= N; bx++) {
    for (let bz = -N; bz <= N; bz++) {
      const cx = bx * CELL;
      const cz = bz * CELL;
      const centerF = Math.exp(-Math.hypot(cx, cz) / 230);
      for (let lx = 0; lx < 2; lx++) {
        for (let lz = 0; lz < 2; lz++) {
          const w = 14 + rnd() * 4;
          const d = 14 + rnd() * 4;
          const h = 8 + rnd() * 22 + Math.pow(rnd(), 2.2) * 230 * centerF;
          const geo = new THREE.BoxGeometry(w, h, d);
          const uv = geo.attributes.uv as THREE.BufferAttribute;
          const ox = rnd();
          const oy = rnd();
          // Yüz sırası: +x, -x, +y, -y, +z, -z (her biri 4 köşe)
          for (let f = 0; f < 6; f++) {
            for (let k = 0; k < 4; k++) {
              const i = f * 4 + k;
              if (f === 2 || f === 3) {
                uv.setXY(i, 0.001, 0.999);
              } else {
                const faceW = f < 2 ? d : w;
                uv.setXY(i, uv.getX(i) * (faceW / TEX_W) + ox, uv.getY(i) * (h / TEX_H) + oy);
              }
            }
          }
          geo.translate(cx - BLOCK / 4 + lx * (BLOCK / 2), h / 2, cz - BLOCK / 4 + lz * (BLOCK / 2));
          groups[Math.floor(rnd() * VARIANTS)].push(geo);
        }
      }
    }
  }
  return groups.map((g) => mergeGeometries(g));
};

const ROADS = (() => {
  const arr: number[] = [];
  for (let k = -N; k < N; k++) arr.push(k * CELL + CELL / 2);
  return arr;
})();
const EXTENT = (N + 0.5) * CELL;
const CARS_PER_LANE = 22;

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const durationInFrames = SCENE_LEN;
  const { camera, gl } = useThree();
  gl.toneMappingExposure = 1.1;

  const { meshes, glow, street, stars, carGeo } = useMemo(() => {
    const geos = buildCity();
    const mats = geos.map((_, v) => {
      const tex = makeWindowTexture(100 + v, 0.22 + v * 0.07);
      return new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 1.6,
        roughness: 0.45,
        metalness: 0.4,
      });
    });
    const glowTex = makeGlowTexture();

    // Sokak lambaları
    const sl: number[] = [];
    for (const r of ROADS) {
      for (let p = -EXTENT; p < EXTENT; p += 18) {
        sl.push(r + 5, 7, p, p, 7, r + 5);
      }
    }
    const streetGeo = new THREE.BufferGeometry();
    streetGeo.setAttribute("position", new THREE.Float32BufferAttribute(sl, 3));

    // Yıldızlar
    const rs = mulberry32(3);
    const st: number[] = [];
    for (let i = 0; i < 2500; i++) {
      const th = rs() * Math.PI * 2;
      const ph = Math.acos(rs() * 0.9);
      st.push(
        Math.sin(ph) * Math.cos(th) * 8000,
        Math.cos(ph) * 8000 + 300,
        Math.sin(ph) * Math.sin(th) * 8000,
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(st, 3));

    const count = ROADS.length * 2 * 2 * CARS_PER_LANE;
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    cg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    return {
      meshes: geos.map((g, i) => new THREE.Mesh(g, mats[i])),
      glow: glowTex,
      street: streetGeo,
      stars: starGeo,
      carGeo: cg,
    };
  }, []);

  // Araç farları: her yolda iki şerit (beyaz farlar / kırmızı stop lambaları)
  {
    const pos = carGeo.attributes.position as THREE.BufferAttribute;
    const col = carGeo.attributes.color as THREE.BufferAttribute;
    const rnd = mulberry32(11);
    const L = EXTENT * 2;
    let i = 0;
    for (const r of ROADS) {
      for (const axis of [0, 1]) {
        for (const lane of [-1, 1]) {
          for (let c = 0; c < CARS_PER_LANE; c++) {
            const speed = 0.9 + rnd() * 0.6;
            const s = ((rnd() * L + frame * speed * lane) % L + L) % L - EXTENT;
            const off = r + lane * 2.2;
            if (axis === 0) pos.setXYZ(i, s, 1, off);
            else pos.setXYZ(i, off, 1, s);
            if (lane > 0) col.setXYZ(i, 1.0, 0.92, 0.78);
            else col.setXYZ(i, 1.0, 0.12, 0.08);
            i++;
          }
        }
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  // Drone kamerası: yol boyunca alçalarak ilerler
  const t = frame / durationInFrames;
  const e = t * t * (3 - 2 * t);
  const roadX = CELL / 2;
  camera.position.set(roadX + Math.sin(t * 2) * 1.5, 170 - e * 75, 520 - e * 380);
  camera.lookAt(roadX - 20 * e, 30 - e * 5, camera.position.z - 220);

  const blink = Math.floor(frame / 20) % 2 === 0 ? 1 : 0.15;

  return (
    <>
      <color attach="background" args={["#04050c"]} />
      <fogExp2 attach="fog" args={["#141a32", 0.0021]} />
      <ambientLight intensity={0.25} color="#6f7cff" />
      <directionalLight position={[-300, 400, -500]} intensity={0.35} color="#9fb4ff" />

      {/* Gökyüzü kubbesi */}
      <mesh>
        <sphereGeometry args={[9000, 32, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{}}
          vertexShader={`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
          fragmentShader={`varying vec3 vP; void main(){ float h = clamp(vP.y,0.0,1.0);
            vec3 hor = vec3(0.30,0.20,0.30); vec3 mid = vec3(0.07,0.09,0.20); vec3 top = vec3(0.01,0.012,0.04);
            vec3 c = mix(hor, mid, smoothstep(0.0,0.12,h)); c = mix(c, top, smoothstep(0.12,0.6,h));
            gl_FragColor = vec4(c,1.0); }`}
        />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial size={1.6} sizeAttenuation={false} color="#dfe6ff" fog={false} transparent opacity={0.8} />
      </points>
      {/* Ay */}
      <sprite position={[-2600, 1500, -6000]} scale={[700, 700, 1]}>
        <spriteMaterial map={glow} color="#cdd8ff" blending={THREE.AdditiveBlending} fog={false} depthWrite={false} />
      </sprite>
      <mesh position={[-2600, 1500, -6000]}>
        <sphereGeometry args={[110, 32, 16]} />
        <meshBasicMaterial color="#f2f4ff" fog={false} toneMapped={false} />
      </mesh>

      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}

      {/* Zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.75} metalness={0.3} />
      </mesh>

      <points geometry={street}>
        <pointsMaterial map={glow} size={15} color="#ffb06a" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      <points geometry={carGeo}>
        <pointsMaterial map={glow} size={8} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>

      {/* Uçak ikaz lambası */}
      {[[-CELL / 4, -CELL / 4], [CELL * 0.75, -CELL / 4]].map(([x, z], k) => (
        <sprite key={k} position={[x, 250, z]} scale={[18, 18, 1]}>
          <spriteMaterial map={glow} color="#ff2a2a" opacity={blink} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </>
  );
};

export const City: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 55, near: 0.5, far: 20000 }} gl={{ antialias: true }}>
        <Scene />
      </ThreeCanvas>
      <Overlay title="Gece Şehri" sub="1.444 bina · 1.584 araç · tamamen kodla üretildi" />
    </AbsoluteFill>
  );
};
