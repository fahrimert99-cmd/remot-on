import { evolvePath } from "@remotion/paths";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Label } from "./Label";
import { C, FONT } from "./theme";

const BARS = [
  { k: "Oca", v: 42 },
  { k: "Şub", v: 58 },
  { k: "Mar", v: 51 },
  { k: "Nis", v: 73 },
  { k: "May", v: 66 },
  { k: "Haz", v: 88 },
  { k: "Tem", v: 95 },
];

const CHART = { x: 120, y: 330, w: 1000, h: 560 };

export const DataScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bw = CHART.w / BARS.length;

  const pts = BARS.map((b, i) => [
    CHART.x + bw * i + bw / 2,
    CHART.y + CHART.h - (b.v / 100) * CHART.h - 40,
  ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const lineP = interpolate(frame, [40, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const evo = evolvePath(lineP, d);

  const total = interpolate(frame, [10, 90], [0, 1284750], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pct = interpolate(frame, [10, 90], [0, 126], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ring = interpolate(frame, [20, 110], [0, 0.78], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const R = 130;
  const circ = 2 * Math.PI * R;

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="1" stopColor={C.violet} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={CHART.x}
            x2={CHART.x + CHART.w}
            y1={CHART.y + CHART.h - g * CHART.h}
            y2={CHART.y + CHART.h - g * CHART.h}
            stroke="#ffffff14"
          />
        ))}
        {BARS.map((b, i) => {
          const s = spring({ frame: frame - i * 5, fps, config: { damping: 14 } });
          const h = (b.v / 100) * CHART.h * s;
          return (
            <g key={b.k}>
              <rect
                x={CHART.x + bw * i + 18}
                y={CHART.y + CHART.h - h}
                width={bw - 36}
                height={h}
                rx={10}
                fill="url(#bar)"
              />
              <text
                x={CHART.x + bw * i + bw / 2}
                y={CHART.y + CHART.h + 44}
                fill={C.muted}
                fontSize={26}
                textAnchor="middle"
              >
                {b.k}
              </text>
              <text
                x={CHART.x + bw * i + bw / 2}
                y={CHART.y + CHART.h - h - 14}
                fill={C.white}
                fontSize={24}
                fontWeight={700}
                textAnchor="middle"
                opacity={s}
              >
                {Math.round(b.v * s)}
              </text>
            </g>
          );
        })}
        <path
          d={d}
          stroke={C.pink}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={evo.strokeDasharray}
          strokeDashoffset={evo.strokeDashoffset}
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={10}
            fill={C.pink}
            opacity={lineP * (BARS.length - 1) >= i ? 1 : 0}
          />
        ))}

        {/* Halka gösterge */}
        <g transform="translate(1530 430)">
          <circle r={R} stroke="#ffffff14" strokeWidth={26} fill="none" />
          <circle
            r={R}
            stroke={C.gold}
            strokeWidth={26}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ring)}
            transform="rotate(-90)"
          />
          <text textAnchor="middle" y={18} fill={C.white} fontSize={64} fontWeight={800}>
            %{Math.round(ring * 100)}
          </text>
          <text textAnchor="middle" y={62} fill={C.muted} fontSize={24}>
            hedef
          </text>
        </g>
      </svg>

      <div style={{ position: "absolute", left: 1320, top: 660, color: C.white }}>
        <div style={{ fontSize: 26, color: C.muted }}>Toplam</div>
        <div style={{ fontSize: 76, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(total).toLocaleString("tr-TR")}
        </div>
        <div style={{ fontSize: 36, color: C.cyan, fontWeight: 700 }}>
          ▲ %{pct.toFixed(1)} büyüme
        </div>
      </div>

      <Label n="02 — VERİ" title="Canlı Veri Görselleştirme" sub="Grafikler, sayaçlar, göstergeler" />
    </AbsoluteFill>
  );
};
