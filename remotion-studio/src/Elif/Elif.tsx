import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Karakter sayfasından kesilen pozlar (genişlik/yükseklik oranları)
export const POSES = {
  front: 750 / 1176,
  q34: 735 / 1176,
  side: 660 / 1176,
  back: 825 / 1176,
  excited: 618 / 549,
  curious: 624 / 564,
  determined: 624 / 564,
  scared: 590 / 549,
  laughing: 545 / 547,
  sleepy: 630 / 547,
};
export type Pose = keyof typeof POSES;

// Sahne ışığına uyması için sıcak/soğuk renk katmanı (görselin kendi şekliyle maskelenir)
const Tinted: React.FC<{ pose: Pose; h: number; flip?: boolean }> = ({ pose, h, flip }) => {
  const src = staticFile(`elif/${pose}.png`);
  const w = h * POSES[pose];
  return (
    <div style={{ position: "relative", width: w, height: h, transform: flip ? "scaleX(-1)" : undefined }}>
      <Img src={src} style={{ width: w, height: h, filter: "saturate(1.08) contrast(1.03)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(100deg, rgba(120,90,180,0.35) 0%, rgba(0,0,0,0) 45%, rgba(255,170,90,0.55) 100%)",
          mixBlendMode: "soft-light",
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${src})`,
          maskSize: "100% 100%",
        }}
      />
    </div>
  );
};

// Tam boy Elif: nefes alma, hafif salınım, isteğe bağlı zıplayarak yürüme
export const ElifFull: React.FC<{
  pose: Pose;
  x: number;
  ground: number;
  h: number;
  flip?: boolean;
  walk?: number; // 0..1 yürüme yoğunluğu
  hop?: number; // anlık zıplama yüksekliği (px)
}> = ({ pose, x, ground, h, flip, walk = 0, hop = 0 }) => {
  const f = useCurrentFrame();
  const breathe = 1 + 0.012 * Math.sin(f / 9);
  const step = Math.abs(Math.sin(f / 4)) * 14 * walk;
  const sway = Math.sin(f / 4) * 2.5 * walk + Math.sin(f / 30) * 0.6;
  const w = h * POSES[pose];
  const lift = step + hop;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - w * 0.42,
          top: ground - 18,
          width: w * 0.84,
          height: 36,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(60,25,10,0.55), transparent 70%)",
          transform: `scale(${1 - lift / 250})`,
          opacity: 1 - lift / 300,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - w / 2,
          top: ground - h * 0.985 - lift,
          transformOrigin: "50% 100%",
          transform: `rotate(${sway}deg) scale(${1 / Math.sqrt(breathe)}, ${breathe})`,
        }}
      >
        <Tinted pose={pose} h={h} flip={flip} />
      </div>
    </>
  );
};

// Yakın çekim: ifadeler arası "pop" geçişli büst
export const ElifBust: React.FC<{
  seq: { at: number; pose: Pose }[];
  x: number;
  h: number;
}> = ({ seq, x, h }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = 0;
  for (let i = 0; i < seq.length; i++) if (f >= seq[i].at) idx = i;
  const cur = seq[idx];
  const prev = seq[idx - 1];
  const since = f - cur.at;
  const fade = prev ? interpolate(since, [0, 5], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const pop = prev ? 1 + 0.05 * (1 - spring({ frame: since, fps, config: { damping: 9, stiffness: 180 } })) : 1;
  const breathe = 1 + 0.01 * Math.sin(f / 10);
  const bob = Math.sin(f / 22) * 4;

  const layer = (pose: Pose, opacity: number) => {
    const w = h * POSES[pose];
    return (
      <div
        style={{
          position: "absolute",
          left: x - w / 2,
          bottom: -110 + bob,
          opacity,
          transformOrigin: "50% 100%",
          transform: `scale(${pop * breathe}, ${pop / breathe})`,
        }}
      >
        <Tinted pose={pose} h={h} />
      </div>
    );
  };
  return (
    <>
      {prev && fade < 1 ? layer(prev.pose, 1 - fade) : null}
      {layer(cur.pose, fade)}
    </>
  );
};
