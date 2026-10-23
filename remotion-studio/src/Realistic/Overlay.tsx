import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCENE_LEN } from "./util";

const FONT = "Inter, 'DejaVu Sans', sans-serif";

// Sinematik katman: siyah bantlar, vinyet, film greni, başlık
export const Overlay: React.FC<{ title: string; sub: string }> = ({ title, sub }) => {
  const frame = useCurrentFrame();
  const durationInFrames = SCENE_LEN;
  const text = interpolate(
    frame,
    [25, 50, durationInFrames - 50, durationInFrames - 25],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 104, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 104, background: "#000" }} />
      <div
        style={{
          position: "absolute",
          left: 110,
          bottom: 160,
          fontFamily: FONT,
          color: "white",
          opacity: text,
          transform: `translateY(${(1 - text) * 20}px)`,
          textShadow: "0 2px 20px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 8, opacity: 0.75, fontWeight: 600 }}>
          REMOTION · THREE.JS
        </div>
        <div style={{ fontSize: 76, fontWeight: 300, letterSpacing: 2, marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 26, opacity: 0.8, marginTop: 6 }}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};
