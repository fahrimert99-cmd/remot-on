import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { charState, ease, lerp, PIXAR_LEN, seg } from "./anim";
import { Character } from "./Character";
import { World } from "./World";

const Rig: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, gl } = useThree();
  gl.toneMappingExposure = 1.05;
  const t = ease(f / PIXAR_LEN);
  const push = ease(seg(f, 250, 300)) * 0.8;
  // Zıplamaları yumuşakça takip et (son 8 karenin ortalaması)
  let follow = 0;
  for (let k = 0; k < 8; k++) follow += charState(f - k).y / 8;
  camera.position.set(lerp(-3.5, 1.0, t), lerp(3.2, 2.3, t) + follow * 0.55, lerp(15, 8.6, t) - push);
  camera.lookAt(lerp(-4.5, 0.2, ease(seg(f, 0, 110))), lerp(1.4, 1.9, t) + follow * 0.8, 0);
  return null;
};

const Sky: React.FC = () => (
  <mesh>
    <sphereGeometry args={[400, 32, 16]} />
    <shaderMaterial
      side={THREE.BackSide}
      depthWrite={false}
      fog={false}
      vertexShader={`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
      fragmentShader={`varying vec3 vP; void main(){ float h = clamp(vP.y,0.0,1.0);
        vec3 hor = vec3(1.0,0.90,0.76); vec3 mid = vec3(0.62,0.82,1.0); vec3 top = vec3(0.36,0.62,0.98);
        vec3 c = mix(hor, mid, smoothstep(0.0,0.18,h)); c = mix(c, top, smoothstep(0.18,0.7,h));
        gl_FragColor = vec4(pow(c, vec3(2.2)),1.0); }`}
    />
  </mesh>
);

const Scene: React.FC = () => (
  <>
    <Rig />
    <Sky />
    <fog attach="fog" args={["#ffe6c8", 45, 140]} />
    <hemisphereLight args={["#cfe8ff", "#6fa84a", 0.9]} />
    <directionalLight
      position={[-8, 12, 9]}
      color="#fff0d8"
      intensity={2.6}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-16}
      shadow-camera-right={16}
      shadow-camera-top={14}
      shadow-camera-bottom={-10}
      shadow-camera-far={60}
      shadow-bias={-0.0005}
      shadow-radius={6}
      shadow-blurSamples={16}
    />
    {/* Kenar (rim) ışığı: karakteri arka plandan ayırır */}
    <directionalLight position={[6, 5, -10]} color="#ffd3a0" intensity={1.6} />
    <Character />
    <World />
  </>
);

export const PixarScene: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const title = interpolate(f, [266, 282], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const intro = interpolate(f, [0, 10, 40, 55], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#bfe0ff" }}>
      <ThreeCanvas width={width} height={height} shadows="variance" camera={{ fov: 35, near: 0.1, far: 1000 }} gl={{ antialias: true }}>
        <Scene />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(60,30,10,0.28) 100%)" }} />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 90,
          fontFamily: "Inter, sans-serif",
          color: "white",
          textShadow: "0 4px 24px rgba(80,40,10,0.45)",
        }}
      >
        <div style={{ opacity: intro, fontSize: 30, letterSpacing: 6, fontWeight: 600, position: "absolute", top: 70 }}>
          BİR REMOTION KISA FİLMİ
        </div>
        <div style={{ opacity: title, transform: `scale(${0.9 + title * 0.1})`, fontSize: 96, fontWeight: 900 }}>
          Pıtır ile Kelebek
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
