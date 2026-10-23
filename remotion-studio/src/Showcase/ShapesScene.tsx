import { interpolatePath, translatePath } from "@remotion/paths";
import { makeCircle, makePolygon, makeStar } from "@remotion/shapes";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Label } from "./Label";
import { C } from "./theme";

const SIZE = 420;
const star = makeStar({ points: 6, innerRadius: 110, outerRadius: 210 });
const hex = makePolygon({ points: 6, radius: 200 });
const circle = makeCircle({ radius: 190 });
const tri = makePolygon({ points: 3, radius: 210 });

// Şekil dizisi sırayla birbirine dönüşür
const center = (sh: { path: string; width: number; height: number }) =>
  translatePath(sh.path, (SIZE - sh.width) / 2, (SIZE - sh.height) / 2);
const SEQ = [star, circle, tri, hex, star].map(center);

export const ShapesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const prog = interpolate(frame, [10, 140], [0, SEQ.length - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const i = Math.min(Math.floor(prog), SEQ.length - 2);
  const local = prog - i;
  const eased = local * local * (3 - 2 * local);
  const d = interpolatePath(eased, SEQ[i], SEQ[i + 1]);

  const pop = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle, #1c0f33, ${C.bg} 70%)` }}>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="morph" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.pink} />
            <stop offset="1" stopColor={C.gold} />
          </linearGradient>
        </defs>
        {/* Dönen halkalar */}
        {new Array(24).fill(0).map((_, k) => {
          const a = (k / 24) * 360 + frame * 1.2;
          const rr = 360 + Math.sin(frame / 15 + k) * 20;
          return (
            <g key={k} transform={`translate(${width / 2 + 200} ${height / 2}) rotate(${a}) translate(${rr} 0) rotate(${frame * 4})`}>
              <path
                d={makePolygon({ points: 3 + (k % 4), radius: 22 }).path}
                transform="translate(-22 -22)"
                fill="none"
                stroke={k % 2 ? C.cyan : C.violet}
                strokeWidth={3}
                opacity={pop}
              />
            </g>
          );
        })}
        <g
          transform={`translate(${width / 2 + 200} ${height / 2}) rotate(${frame * 0.8}) scale(${pop}) translate(${-SIZE / 2} ${-SIZE / 2})`}
        >
          <path d={d} fill="url(#morph)" />
        </g>
      </svg>
      <Label n="04 — ŞEKİLLER" title="Şekil Dönüşümü" sub="Yıldız → daire → üçgen → altıgen" />
    </AbsoluteFill>
  );
};
