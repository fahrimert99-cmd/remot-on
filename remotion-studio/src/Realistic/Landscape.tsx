import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { Overlay } from "./Overlay";
import { mulberry32, SCENE_LEN, smoothstep } from "./util";

const perlin = new ImprovedNoise();
const SIZE = 1800;
const SEG = 460;
const WATER = 2;

const riverX = (z: number) => -Math.sin(z / 70) * 22;

// Sırt (ridged) fraktal gürültü ile dağ yüksekliği
export const heightAt = (x: number, z: number) => {
  let hills = 0;
  let a = 1;
  let f = 1 / 110;
  for (let i = 0; i < 4; i++) {
    hills += perlin.noise(x * f, 1.3, z * f) * a;
    a *= 0.5;
    f *= 2;
  }
  let ridge = 0;
  let sum = 0;
  a = 1;
  f = 1 / 190;
  for (let i = 0; i < 6; i++) {
    const n = 1 - Math.abs(perlin.noise(x * f, 3.7, z * f));
    ridge += n * n * a;
    sum += a;
    a *= 0.5;
    f *= 2.07;
  }
  ridge /= sum;
  const valley = smoothstep(16, 110, Math.abs(x - riverX(z)));
  // Kenarlarda uzak dağ sıraları: ufuk çizgisi hep dağlarla kapansın
  const edge = smoothstep(480, 820, Math.max(Math.abs(x), Math.abs(z)));
  return 3 + hills * 7 + ridge * 135 * Math.max(valley * (0.6 + valley * 0.4), edge) + edge * 70 - (1 - valley) * 4 * (1 - edge);
};

const useTerrain = () =>
  useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    const nor = geo.attributes.normal as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const sand = new THREE.Color("#8a7a5c");
    const grass = new THREE.Color("#3a5422");
    const grass2 = new THREE.Color("#5b6e30");
    const rock = new THREE.Color("#5e5650");
    const rock2 = new THREE.Color("#7a7068");
    const snow = new THREE.Color("#eef1f6");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const slope = 1 - nor.getY(i);
      const n = perlin.noise(pos.getX(i) / 9, 0.5, pos.getZ(i) / 9);
      c.copy(grass).lerp(grass2, smoothstep(-0.4, 0.5, n));
      c.lerp(sand, 1 - smoothstep(WATER, WATER + 2.5, y));
      c.lerp(rock, smoothstep(0.18, 0.35, slope) * 0.9 + smoothstep(40, 70, y) * 0.6);
      c.lerp(rock2, smoothstep(-0.2, 0.6, n) * smoothstep(0.3, 0.5, slope) * 0.5);
      const snowLine = 78 + n * 12;
      c.lerp(snow, smoothstep(snowLine, snowLine + 10, y) * (1 - smoothstep(0.45, 0.65, slope)));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

const TREES = 6500;
const Trees: React.FC = () => {
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(1.3, 6, 7);
    geo.translate(0, 3, 0);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    const m = new THREE.InstancedMesh(geo, mat, TREES);
    const rnd = mulberry32(42);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let placed = 0;
    let guard = 0;
    while (placed < TREES && guard++ < 200000) {
      const x = (rnd() - 0.5) * 760;
      const z = (rnd() - 0.5) * 760;
      const y = heightAt(x, z);
      const slope = Math.abs(heightAt(x + 1.5, z) - y) + Math.abs(heightAt(x, z + 1.5) - y);
      const cluster = perlin.noise(x / 40, 9.1, z / 40);
      if (y < WATER + 1.5 || y > 52 || slope > 1.3 || cluster < -0.05) continue;
      const s = 0.7 + rnd() * 0.9;
      dummy.position.set(x, y - 0.3, z);
      dummy.scale.set(s, s * (0.9 + rnd() * 0.5), s);
      dummy.rotation.y = rnd() * Math.PI;
      dummy.updateMatrix();
      m.setMatrixAt(placed, dummy.matrix);
      col.setHSL(0.27 + rnd() * 0.06, 0.45, 0.12 + rnd() * 0.08);
      m.setColorAt(placed, col);
      placed++;
    }
    m.count = placed;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, []);
  return <primitive object={mesh} />;
};

// Tekrarlanabilir dalga normal haritası (sinüs toplamı -> dikiş yok)
const useWaterNormal = () =>
  useMemo(() => {
    const N = 256;
    const data = new Uint8Array(N * N * 4);
    const waves = [
      [3, 1, 0.5, 0.2],
      [-2, 5, 0.35, 1.1],
      [7, -3, 0.2, 2.3],
      [11, 6, 0.12, 0.7],
      [-13, 17, 0.08, 4.1],
    ];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let dx = 0;
        let dy = 0;
        for (const [kx, ky, a, p] of waves) {
          const ph = 2 * Math.PI * ((kx * x) / N + (ky * y) / N) + p;
          dx += a * kx * Math.cos(ph);
          dy += a * ky * Math.cos(ph);
        }
        const v = new THREE.Vector3(-dx * 0.05, -dy * 0.05, 1).normalize();
        const i = (y * N + x) * 4;
        data[i] = (v.x * 0.5 + 0.5) * 255;
        data[i + 1] = (v.y * 0.5 + 0.5) * 255;
        data[i + 2] = (v.z * 0.5 + 0.5) * 255;
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, N, N);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(60, 60);
    tex.needsUpdate = true;
    return tex;
  }, []);

export type LandscapeLook = {
  elevation: number;
  azimuth: number;
  turbidity: number;
  rayleigh: number;
  fog: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  exposure: number;
  path: "river" | "high";
};

const World: React.FC<{ look: LandscapeLook }> = ({ look }) => {
  const frame = useCurrentFrame();
  const durationInFrames = SCENE_LEN;
  const { gl, scene, camera } = useThree();
  const terrain = useTerrain();
  const waterNormal = useWaterNormal();

  const sunDir = useMemo(() => {
    const v = new THREE.Vector3();
    v.setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(90 - look.elevation),
      THREE.MathUtils.degToRad(look.azimuth),
    );
    return v;
  }, [look.elevation, look.azimuth]);

  const sky = useMemo(() => {
    const s = new Sky();
    s.scale.setScalar(20000);
    const u = s.material.uniforms;
    u.turbidity.value = look.turbidity;
    u.rayleigh.value = look.rayleigh;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.86;
    u.sunPosition.value.copy(sunDir);
    return s;
  }, [look, sunDir]);

  // Gökyüzünden ortam ışığı/yansıma haritası üret
  useLayoutEffect(() => {
    gl.toneMappingExposure = look.exposure;
    const pm = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    envScene.add(sky.clone());
    scene.environment = pm.fromScene(envScene).texture;
    scene.environmentIntensity = 0.45;
    pm.dispose();
  }, [gl, scene, sky, look.exposure]);

  // Kamera hareketi (kareye bağlı -> deterministik)
  const t = frame / durationInFrames;
  const ease = t * t * (3 - 2 * t) * 0.5 + t * 0.5;
  if (look.path === "river") {
    const z = 330 - ease * 230;
    const x = riverX(z);
    const y = Math.max(heightAt(x, z), WATER) + 14 + ease * 8;
    camera.position.set(x, y, z);
    const lz = z - 120;
    camera.lookAt(riverX(lz) * 0.6, y + 6 - ease * 4, lz);
  } else {
    const a = -0.6 + ease * 0.55;
    camera.position.set(Math.sin(a) * 300, 150 - ease * 25, Math.cos(a) * 300);
    camera.lookAt(Math.sin(a) * 40, 55, Math.cos(a) * 40 - 120);
  }
  waterNormal.offset.set(frame * 0.0015, frame * 0.0009);

  const sunPos = sunDir.clone().multiplyScalar(500);

  return (
    <>
      <primitive object={sky} />
      <fogExp2 attach="fog" args={[look.fog, look.fogDensity]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiIntensity]} />
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        color={look.sunColor}
        intensity={look.sunIntensity}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-420}
        shadow-camera-right={420}
        shadow-camera-top={420}
        shadow-camera-bottom={-420}
        shadow-camera-near={1}
        shadow-camera-far={1400}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      />
      <mesh geometry={terrain} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
      </mesh>
      <Trees />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshPhysicalMaterial
          color="#0d2633"
          roughness={0.04}
          metalness={0}
          ior={1.33}
          normalMap={waterNormal}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          envMapIntensity={2.2}
        />
      </mesh>
    </>
  );
};

export const Landscape: React.FC<{ look: LandscapeLook; title: string; sub: string }> = ({
  look,
  title,
  sub,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        camera={{ fov: 50, near: 0.5, far: 30000, position: [0, 30, 300] }}
        gl={{ antialias: true }}
      >
        <World look={look} />
      </ThreeCanvas>
      <Overlay title={title} sub={sub} />
    </AbsoluteFill>
  );
};

export const SUNSET: LandscapeLook = {
  elevation: 0.8,
  azimuth: 180,
  turbidity: 12,
  rayleigh: 3.2,
  fog: "#c98a62",
  fogDensity: 0.003,
  sunColor: "#ffc48a",
  sunIntensity: 3.2,
  hemiSky: "#a9b9e8",
  hemiGround: "#3b2a1c",
  hemiIntensity: 0.55,
  exposure: 0.42,
  path: "river",
};

export const DAWN: LandscapeLook = {
  elevation: 1.2,
  azimuth: 115,
  turbidity: 2.5,
  rayleigh: 3.2,
  fog: "#b3aec4",
  fogDensity: 0.0032,
  sunColor: "#ffb0a0",
  sunIntensity: 2.2,
  hemiSky: "#8ea4e0",
  hemiGround: "#2a2a3a",
  hemiIntensity: 0.7,
  exposure: 0.6,
  path: "high",
};
