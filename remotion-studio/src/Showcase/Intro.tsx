import { noise2D } from "@remotion/noise";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "./theme";

const WORD = "REMOTION";
const PARTICLES = 260;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const subtitle = spring({ frame: frame - 45, fps, config: { damping: 200 } });
  const glow = interpolate(Math.sin(frame / 10), [-1, 1], [20, 60]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${C.bg2}, ${C.bg} 70%)`,
        overflow: "hidden",
      }}
    >
      {/* Gürültü ile süzülen parçacıklar */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {new Array(PARTICLES).fill(0).map((_, i) => {
          const bx = random(`x${i}`) * width;
          const by = random(`y${i}`) * height;
          const dx = noise2D("dx", i, frame / 120) * 140;
          const dy = noise2D("dy", i, frame / 120) * 140;
          const r = 1 + random(`r${i}`) * 3;
          const col = [C.violet, C.cyan, C.pink][i % 3];
          return (
            <circle
              key={i}
              cx={bx + dx}
              cy={by + dy - frame * (0.3 + random(`s${i}`))}
              r={r}
              fill={col}
              opacity={0.25 + random(`o${i}`) * 0.6}
            />
          );
        })}
      </svg>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: FONT }}>
          {WORD.split("").map((ch, i) => {
            const s = spring({
              frame: frame - i * 4,
              fps,
              config: { damping: 9, stiffness: 120 },
            });
            const rot = interpolate(s, [0, 1], [-90, 0]);
            return (
              <span
                key={i}
                style={{
                  fontSize: 220,
                  fontWeight: 900,
                  color: C.white,
                  display: "inline-block",
                  transform: `translateY(${interpolate(s, [0, 1], [300, 0])}px) rotateX(${rot}deg) scale(${s})`,
                  textShadow: `0 0 ${glow}px ${i % 2 ? C.cyan : C.violet}`,
                  letterSpacing: 4,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            color: C.cyan,
            marginTop: 20,
            letterSpacing: interpolate(subtitle, [0, 1], [40, 12]),
            opacity: subtitle,
            fontWeight: 600,
          }}
        >
          SINIRLARI ZORLUYORUZ
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            color: C.muted,
            marginTop: 24,
            opacity: interpolate(frame, [70, 90], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Bu videodaki her kare React koduyla üretildi
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
