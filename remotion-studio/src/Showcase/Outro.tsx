import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "./theme";

const STATS = [
  { v: 1920, s: "×1080", l: "Çözünürlük" },
  { v: 30, s: " FPS", l: "Kare hızı" },
  { v: 7, s: " sahne", l: "Tek dosyada" },
  { v: 100, s: "%", l: "Kod ile", pre: true },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame, fps, config: { damping: 12 } });
  const hue = frame * 2;

  return (
    <AbsoluteFill
      style={{
        background: `conic-gradient(from ${hue}deg at 50% 50%, ${C.bg}, #1b0d36, ${C.bg}, #071d2e, ${C.bg})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: C.white,
          transform: `scale(${title})`,
          textAlign: "center",
        }}
      >
        Hepsi sadece{" "}
        <span
          style={{
            background: `linear-gradient(90deg, ${C.cyan}, ${C.violet}, ${C.pink})`,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          React
        </span>
        .
      </div>

      <div style={{ display: "flex", gap: 60, marginTop: 80 }}>
        {STATS.map((st, i) => {
          const s = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 200 } });
          const val = Math.round(
            interpolate(frame, [20 + i * 8, 70 + i * 8], [0, st.v], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          );
          return (
            <div
              key={st.l}
              style={{
                width: 300,
                padding: "30px 0",
                borderRadius: 24,
                background: "#ffffff0d",
                border: "1px solid #ffffff1f",
                textAlign: "center",
                opacity: s,
                transform: `translateY(${(1 - s) * 60}px)`,
              }}
            >
              <div style={{ fontSize: 58, fontWeight: 900, color: C.cyan, fontVariantNumeric: "tabular-nums" }}>
                {st.pre ? `${st.s}${val}` : `${val}${st.s}`}
              </div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>{st.l}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 80,
          fontSize: 34,
          color: C.gold,
          letterSpacing: 8,
          opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        REMOTION.DEV
      </div>
    </AbsoluteFill>
  );
};
