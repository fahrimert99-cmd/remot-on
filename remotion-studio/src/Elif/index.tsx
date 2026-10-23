import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ElifBust, ElifFull } from "./Elif";
import { Cam, Foreground, Landscape } from "./Landscape";

const FONT = "Inter, 'DejaVu Sans', sans-serif";
const ease = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export const SCENES = [180, 150, 165, 165, 135, 195];
const T = 15;
export const ELIF_LEN = SCENES.reduce((a, b) => a + b, 0) - T * (SCENES.length - 1);

const Caption: React.FC<{ text: string; from?: number; to?: number }> = ({ text, from = 12, to }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const end = to ?? durationInFrames - 10;
  const o = interpolate(f, [from, from + 8, end - 8, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 46,
        fontWeight: 700,
        color: "#fff",
        opacity: o,
        textShadow: "0 3px 18px rgba(40,15,5,0.75), 0 0 2px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  );
};

// Havada süzülen ışık tozları (sinematik his)
const Dust: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(40).fill(0).map((_, i) => {
        const x = (random(`dx${i}`) * 1920 + f * (0.3 + random(`dv${i}`))) % 1920;
        const y = random(`dy${i}`) * 1080 + Math.sin(f / 30 + i) * 20;
        const s = 2 + random(`ds${i}`) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: "rgba(255,230,180,0.8)",
              filter: `blur(${s > 6 ? 2 : 0.5}px)`,
              opacity: 0.3 + random(`do${i}`) * 0.5,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at 70% 45%, rgba(255,200,140,0.12), transparent 55%), radial-gradient(ellipse at center, transparent 55%, rgba(40,15,30,0.45) 100%)",
    }}
  />
);

const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  zoom: a.zoom + (b.zoom - a.zoom) * t,
  blur: a.blur + (b.blur - a.blur) * t,
});

// 1) Açılış: geniş plan, başlık
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lerpCam({ x: -120, y: 60, zoom: 1.0, blur: 0 }, { x: 60, y: 0, zoom: 1.12, blur: 0 }, ease(f / 180));
  const title = spring({ frame: f - 25, fps: 30, config: { damping: 200 } });
  const out = interpolate(f, [140, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Landscape cam={cam} sunRise={ease(f / 180)} />
      <Foreground cam={cam} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.zoom})`, transformOrigin: "50% 75%" }}>
        <ElifFull pose="front" x={560} ground={965} h={330} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          color: "#fff",
          opacity: title * out,
          transform: `translateY(${(1 - title) * 30}px)`,
          textShadow: "0 6px 30px rgba(60,20,40,0.55)",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: 2 }}>Elif ve Uçan Balon</div>
        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: 10, marginTop: 10, opacity: 0.9 }}>KAPADOKYA · BİR SABAH</div>
      </div>
    </AbsoluteFill>
  );
};

// 2) Yakın çekim: uyanma
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lerpCam({ x: 200, y: -60, zoom: 1.5, blur: 14 }, { x: 240, y: -80, zoom: 1.6, blur: 14 }, ease(f / 150));
  return (
    <AbsoluteFill>
      <Landscape cam={cam} sunRise={1} />
      <ElifBust x={760} h={820} seq={[{ at: 0, pose: "sleepy" }, { at: 70, pose: "curious" }]} />
      <Caption text="Güneş peri bacalarının ardından yükselirken..." to={68} />
      <Caption text="Bu ses de ne?" from={80} />
    </AbsoluteFill>
  );
};

// 3) Balonları görür: orta plan + heyecanlı yakın çekim
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lerpCam({ x: 120, y: 30, zoom: 1.25, blur: 3 }, { x: 160, y: -40, zoom: 1.32, blur: 3 }, ease(f / 165));
  const close = f >= 85;
  const ccam: Cam = { x: 260, y: -120, zoom: 1.6, blur: 16 };
  return (
    <AbsoluteFill>
      {!close ? (
        <>
          <Landscape cam={cam} sunRise={1} />
          <Foreground cam={cam} />
          <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.zoom})`, transformOrigin: "50% 75%" }}>
            <ElifFull pose="q34" x={700} ground={965} h={360} />
          </div>
          <Caption text="Gökyüzü rengârenk balonlarla dolmuştu." from={10} to={82} />
        </>
      ) : (
        <>
          <Landscape cam={ccam} sunRise={1} />
          <ElifBust x={880} h={860} seq={[{ at: 85, pose: "excited" }]} />
          <Caption text="“Dede! Balonlar kalkıyor!”" from={92} />
        </>
      )}
    </AbsoluteFill>
  );
};

// 4) Balonun peşinden koşar; balon çok yaklaşır
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const cam = lerpCam({ x: -60, y: 20, zoom: 1.15, blur: 2 }, { x: 260, y: 20, zoom: 1.15, blur: 2 }, ease(f / 110));
  const x = 380 + ease(f / 110) * 640;
  const close = f >= 112;
  const bx = 1500 - f * 3.2;
  const by = 520 + Math.sin(f / 15) * 12;
  return (
    <AbsoluteFill>
      {!close ? (
        <>
          <Landscape cam={cam} sunRise={1} />
          <Foreground cam={cam} />
          <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.zoom})`, transformOrigin: "50% 75%" }}>
            <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <g transform={`translate(${bx + 600} ${by}) scale(1.6)`}>
                <BigBalloon f={f} />
              </g>
            </svg>
            <ElifFull pose="side" x={x} ground={965} h={350} walk={1 - ease((f - 95) / 15)} />
          </div>
          <Caption text="Bir balon alçaldı... ve tam üstünden geçti!" from={10} to={108} />
        </>
      ) : (
        <>
          <Landscape cam={{ x: 300, y: -100, zoom: 1.6, blur: 16 }} sunRise={1} />
          <ElifBust x={900} h={860} seq={[{ at: 112, pose: "scared" }]} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 75% 0%, rgba(255,170,60,${0.45 * Math.max(0, Math.sin((f - 112) / 4))}), transparent 50%)`,
            }}
          />
          <Caption text="FUUUŞŞ!" from={114} />
        </>
      )}
    </AbsoluteFill>
  );
};

const BigBalloon: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <clipPath id="bigenv">
        <path d="M 0 -150 C 95 -150, 110 -50, 60 20 L 25 70 L -25 70 L -60 20 C -110 -50, -95 -150, 0 -150 Z" />
      </clipPath>
      <radialGradient id="bigsh" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#2a0a20" stopOpacity="0.5" />
      </radialGradient>
    </defs>
    <g clipPath="url(#bigenv)">
      {["#e63946", "#ffd166", "#2a9d8f", "#f4f1de", "#ff7b00", "#7b2cbf", "#ef476f", "#118ab2"].map((c, k) => (
        <rect key={k} x={-110 + k * 27.5} y={-160} width={27.5} height={240} fill={c} />
      ))}
      {/* Yamalar: dedenin eski balonu */}
      <rect x={-40} y={-90} width={26} height={20} fill="#c9a26b" stroke="#6b4a2a" strokeDasharray="3 3" />
      <rect x={30} y={-40} width={22} height={18} fill="#9ac1a5" stroke="#4a6b52" strokeDasharray="3 3" />
      <rect x={-110} y={-160} width={220} height={240} fill="url(#bigsh)" />
    </g>
    <path d="M -25 70 L -14 108 M 25 70 L 14 108" stroke="#4a3020" strokeWidth={2} />
    <ellipse cx={0} cy={88} rx={9} ry={16 * (0.6 + 0.4 * Math.sin(f / 2))} fill="#ffb347" />
    <rect x={-16} y={106} width={32} height={24} rx={4} fill="#8a5a36" />
  </g>
);

// 5) Kararlılık
const S5: React.FC = () => (
  <AbsoluteFill>
    <Landscape cam={{ x: 180, y: -140, zoom: 1.65, blur: 18 }} sunRise={1} />
    <ElifBust x={960} h={880} seq={[{ at: 0, pose: "determined" }]} />
    <Caption text="“Bir gün... ben de o balonla uçacağım!”" from={15} />
  </AbsoluteFill>
);

// 6) Final: kahkaha + geniş plan + "Yakında"
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const wide = f >= 75;
  const cam = lerpCam({ x: 0, y: 0, zoom: 1.2, blur: 0 }, { x: 0, y: 40, zoom: 1.0, blur: 0 }, ease((f - 75) / 120));
  const end = spring({ frame: f - 110, fps: 30, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      {!wide ? (
        <>
          <Landscape cam={{ x: 220, y: -120, zoom: 1.6, blur: 16 }} sunRise={1} />
          <ElifBust x={940} h={860} seq={[{ at: 0, pose: "laughing" }]} />
          <Caption text="Dedesi gülümsedi: “O balonun bir hikâyesi var...”" from={8} to={72} />
        </>
      ) : (
        <>
          <Landscape cam={cam} sunRise={1.2} />
          <Foreground cam={cam} />
          <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.zoom})`, transformOrigin: "50% 75%" }}>
            <ElifFull pose="back" x={900} ground={965} h={320} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 170,
              width: "100%",
              textAlign: "center",
              fontFamily: FONT,
              color: "#fff",
              opacity: end,
              transform: `scale(${0.94 + end * 0.06})`,
              textShadow: "0 6px 30px rgba(60,20,40,0.55)",
            }}
          >
            <div style={{ fontSize: 110, fontWeight: 900 }}>Elif ve Uçan Balon</div>
            <div style={{ fontSize: 40, letterSpacing: 14, marginTop: 14, fontWeight: 600 }}>YAKINDA</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const ElifTrailer: React.FC = () => {
  const timing = linearTiming({ durationInFrames: T });
  const scenes = [S1, S2, S3, S4, S5, S6];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("elif.wav")} />
      <TransitionSeries>
        {scenes.flatMap((S, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={SCENES[i]}>
              <S />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1)
            items.push(<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={timing} />);
          return items;
        })}
      </TransitionSeries>
      <Dust />
      <Grade />
    </AbsoluteFill>
  );
};
