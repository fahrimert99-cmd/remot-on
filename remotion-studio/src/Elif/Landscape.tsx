import { useCurrentFrame } from "remotion";
import { mulberry32 } from "../Realistic/util";

// Kapadokya: gün doğumu, peri bacaları ve balonlar (katmanlı 2D, parallax)

const W = 1920;
const H = 1080;

export type Cam = { x: number; y: number; zoom: number; blur: number };

// Peri bacası silueti: gövde + boyun + şapka
const chimneyPath = (w: number, h: number) => {
  const neck = w * 0.32;
  const capW = w * 0.62;
  const capH = h * 0.16;
  const bodyTop = h * 0.78;
  return {
    body: `M ${-w / 2} 0 C ${-w * 0.45} ${-h * 0.35}, ${-neck} ${-bodyTop * 0.75}, ${-neck / 2} ${-bodyTop}
           L ${neck / 2} ${-bodyTop} C ${neck} ${-bodyTop * 0.75}, ${w * 0.45} ${-h * 0.35}, ${w / 2} 0 Z`,
    cap: `M ${-capW / 2} ${-bodyTop + 4} C ${-capW / 2} ${-bodyTop - capH * 1.2}, ${capW / 2} ${-bodyTop - capH * 1.2}, ${capW / 2} ${-bodyTop + 4} Z`,
  };
};

type Chimney = { x: number; w: number; h: number; win: number[] };

const makeChimneys = (seed: number, n: number, y: number, minH: number, maxH: number) => {
  const r = mulberry32(seed);
  const arr: (Chimney & { y: number })[] = [];
  for (let i = 0; i < n; i++) {
    const h = minH + r() * (maxH - minH);
    arr.push({
      x: -400 + (i / n) * (W + 800) + (r() - 0.5) * 120,
      y: y + r() * 30,
      w: h * (0.42 + r() * 0.2),
      h,
      win: r() < 0.6 ? [r(), r(), r()] : [],
    });
  }
  return arr;
};

const LAYERS = [
  { id: "far", depth: 0.25, items: makeChimneys(3, 22, 760, 90, 170), light: "#e9b9a6", shade: "#b08aa0", cap: "#9c7a8e", haze: 0.55 },
  { id: "mid", depth: 0.5, items: makeChimneys(8, 14, 860, 180, 300), light: "#f1bf98", shade: "#b57f6c", cap: "#8f6455", haze: 0.3 },
  { id: "near", depth: 0.8, items: makeChimneys(15, 7, 990, 330, 520), light: "#f6c493", shade: "#a8694f", cap: "#7c4c3c", haze: 0.08 },
];

type BalloonDef = { x: number; y: number; s: number; c: string[]; speed: number; depth: number; phase: number };
const BALLOONS: BalloonDef[] = (() => {
  const r = mulberry32(44);
  const pals = [
    ["#e63946", "#ffd166"],
    ["#2a9d8f", "#f4f1de"],
    ["#ff7b00", "#7b2cbf"],
    ["#ef476f", "#118ab2"],
    ["#ffb703", "#fb8500"],
    ["#06d6a0", "#ffffff"],
    ["#c1121f", "#fdf0d5"],
  ];
  return new Array(16).fill(0).map((_, i) => {
    const depth = 0.2 + r() * 0.6;
    return {
      x: -200 + r() * (W + 400),
      y: 250 + r() * 500,
      s: 0.25 + depth * 0.9,
      c: pals[i % pals.length],
      speed: 0.15 + r() * 0.3,
      depth,
      phase: r() * 10,
    };
  }).sort((a, b) => a.depth - b.depth);
})();

export const Balloon: React.FC<{ c: string[]; id: string; burner?: number }> = ({ c, id, burner = 0 }) => (
  <g>
    <defs>
      <clipPath id={`env-${id}`}>
        <path d="M 0 -150 C 95 -150, 110 -50, 60 20 L 25 70 L -25 70 L -60 20 C -110 -50, -95 -150, 0 -150 Z" />
      </clipPath>
      <radialGradient id={`shade-${id}`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#2a0a20" stopOpacity="0.45" />
      </radialGradient>
    </defs>
    <g clipPath={`url(#env-${id})`}>
      {new Array(8).fill(0).map((_, k) => (
        <rect key={k} x={-110 + k * 27.5} y={-160} width={27.5} height={240} fill={c[k % 2]} />
      ))}
      <rect x={-110} y={-160} width={220} height={240} fill={`url(#shade-${id})`} />
    </g>
    <path d="M -25 70 L -14 108 M 25 70 L 14 108" stroke="#4a3020" strokeWidth={2} />
    {burner > 0 ? <ellipse cx={0} cy={88} rx={8} ry={14 * burner} fill="#ffb347" opacity={0.9} /> : null}
    <rect x={-16} y={106} width={32} height={24} rx={4} fill="#8a5a36" />
    <rect x={-16} y={106} width={32} height={6} fill="#a8774d" />
  </g>
);

const ChimneyLayer: React.FC<{ layer: (typeof LAYERS)[number] }> = ({ layer }) => (
  <g>
    <defs>
      <linearGradient id={`ch-${layer.id}`} x1="0" x2="1">
        <stop offset="0" stopColor={layer.light} />
        <stop offset="0.55" stopColor={layer.light} />
        <stop offset="1" stopColor={layer.shade} />
      </linearGradient>
    </defs>
    {/* Taban tepeleri */}
    <path
      d={`M -600 ${layer.items[0].y + 20} ${layer.items
        .map((it) => `Q ${it.x - it.w} ${it.y - it.h * 0.15}, ${it.x} ${it.y - it.h * 0.08}`)
        .join(" ")} L ${W + 600} ${layer.items[0].y + 20} L ${W + 600} ${H + 400} L -600 ${H + 400} Z`}
      fill={`url(#ch-${layer.id})`}
    />
    {layer.items.map((it, i) => {
      const p = chimneyPath(it.w, it.h);
      return (
        <g key={i} transform={`translate(${it.x} ${it.y})`}>
          <path d={p.body} fill={`url(#ch-${layer.id})`} />
          <path d={p.cap} fill={layer.cap} />
          {it.win.map((v, k) => (
            <path
              key={k}
              d={`M ${(v - 0.5) * it.w * 0.4 - 6} ${-it.h * (0.25 + k * 0.17)} a 6 8 0 0 1 12 0 v 8 h -12 Z`}
              fill="#3a2220"
              opacity={0.75}
            />
          ))}
        </g>
      );
    })}
  </g>
);

export const Landscape: React.FC<{ cam: Cam; sunRise?: number }> = ({ cam, sunRise = 0 }) => {
  const f = useCurrentFrame();
  const sunY = 640 - sunRise * 120 - f * 0.08;

  // Her katman, derinliğine göre kamera hareketinden farklı oranda etkilenir
  const layerStyle = (depth: number): React.CSSProperties => {
    const z = 1 + (cam.zoom - 1) * depth;
    const blur = cam.blur * Math.max(0, 1 - depth) ** 0.8;
    return {
      position: "absolute",
      inset: 0,
      transform: `translate(${-cam.x * depth}px, ${-cam.y * depth}px) scale(${z})`,
      transformOrigin: "50% 75%",
      filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
    };
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Gökyüzü */}
      <div
        style={{
          ...layerStyle(0.02),
          background: "linear-gradient(180deg, #33427e 0%, #7b6fb3 28%, #d98d8f 52%, #f7b07c 68%, #ffd9a3 80%)",
        }}
      />
      <div style={layerStyle(0.05)}>
        <div
          style={{
            position: "absolute",
            left: 1380 - 450,
            top: sunY - 450,
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,240,200,0.95) 0%, rgba(255,200,130,0.5) 12%, rgba(255,170,110,0.18) 35%, transparent 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1380 - 55,
            top: sunY - 55,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "#fff6dc",
            boxShadow: "0 0 60px 20px rgba(255,230,180,0.8)",
          }}
        />
      </div>
      {/* Uzak dağ sırtı */}
      <svg viewBox={`0 0 ${W} ${H}`} style={layerStyle(0.12)}>
        <path d="M -300 760 Q 200 640 600 700 T 1300 680 T 2300 700 L 2300 1400 L -300 1400 Z" fill="#c98f9c" opacity={0.75} />
      </svg>
      {LAYERS.map((layer, li) => (
        <div key={layer.id}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ ...layerStyle(layer.depth), overflow: "visible" }}>
            {BALLOONS.filter((b) => b.depth < layer.depth && b.depth >= (LAYERS[li - 1]?.depth ?? 0)).map((b, i) => (
              <g
                key={i}
                transform={`translate(${b.x + Math.sin(f / 40 + b.phase) * 15} ${b.y - f * b.speed}) scale(${b.s})`}
                opacity={0.6 + b.depth * 0.4}
              >
                <Balloon c={b.c} id={`${layer.id}-${i}`} burner={Math.sin(f / 7 + b.phase) > 0.85 ? 1 : 0} />
              </g>
            ))}
            <ChimneyLayer layer={layer} />
          </svg>
          {/* Atmosferik pus: uzak katmanları açar */}
          <div
            style={{
              ...layerStyle(layer.depth),
              background: `linear-gradient(180deg, transparent 45%, rgba(255,214,170,${layer.haze}) 85%)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Ön plan: karakterin durduğu tepe
export const Foreground: React.FC<{ cam: Cam }> = ({ cam }) => (
  <svg
    viewBox={`0 0 ${W} ${H}`}
    style={{
      position: "absolute",
      inset: 0,
      transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.zoom})`,
      transformOrigin: "50% 75%",
      overflow: "visible",
    }}
  >
    <defs>
      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d99a62" />
        <stop offset="1" stopColor="#7a4a2e" />
      </linearGradient>
    </defs>
    <path d="M -600 1010 Q 300 930 900 955 T 2500 990 L 2500 1600 L -600 1600 Z" fill="url(#fg)" />
    {new Array(60).fill(0).map((_, i) => {
      const x = -500 + i * 50 + ((i * 37) % 23);
      const y = 975 + Math.sin(i) * 12 + (i % 3) * 8;
      return <path key={i} d={`M ${x} ${y} q -4 -26 -10 -34 M ${x} ${y} q 3 -22 10 -30`} stroke="#8c7a3a" strokeWidth={3} fill="none" opacity={0.7} />;
    })}
  </svg>
);
