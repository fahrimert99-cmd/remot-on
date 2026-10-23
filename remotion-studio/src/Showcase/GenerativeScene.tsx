import { noise3D } from "@remotion/noise";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { Label } from "./Label";
import { C } from "./theme";

const COLS = 64;
const ROWS = 36;

export const GenerativeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gx = width / COLS;
  const gy = height / ROWS;

  const dots = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const n = noise3D("field", x / 14, y / 14, frame / 45);
      const n2 = noise3D("hue", x / 30, y / 30, frame / 90);
      const cx = x * gx + gx / 2 + n * 18;
      const cy = y * gy + gy / 2 + Math.sin(frame / 12 + x / 4) * 6;
      const r = Math.max(0.6, (n + 1) * 7);
      const fill = interpolateColors(n2, [-1, 0, 1], [C.violet, C.cyan, C.pink]);
      dots.push(<circle key={`${x}-${y}`} cx={cx} cy={cy} r={r} fill={fill} opacity={0.85} />);
    }
  }

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={width} height={height}>{dots}</svg>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 20% 15%, ${C.bg}ee, transparent 45%)` }}
      />
      <Label
        n="03 — ÜRETKEN SANAT"
        title={`${COLS * ROWS} Canlı Nokta`}
        sub="Perlin gürültüsüyle her karede yeniden hesaplanıyor"
      />
    </AbsoluteFill>
  );
};
