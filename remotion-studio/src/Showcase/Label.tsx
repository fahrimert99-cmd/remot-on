import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

// Sahne etiketi: sol üstte numara + başlık
export const Label: React.FC<{ n: string; title: string; sub: string }> = ({
  n,
  title,
  sub,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 70,
        fontFamily: FONT,
        transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
        opacity: s,
      }}
    >
      <div style={{ color: C.cyan, fontSize: 26, letterSpacing: 6, fontWeight: 700 }}>
        {n}
      </div>
      <div style={{ color: C.white, fontSize: 64, fontWeight: 800, marginTop: 6 }}>
        {title}
      </div>
      <div style={{ color: C.muted, fontSize: 28, marginTop: 6 }}>{sub}</div>
      <div
        style={{
          height: 4,
          width: 160 * s,
          marginTop: 18,
          background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};
