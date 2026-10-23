import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Label } from "./Label";
import { C, FONT, MONO } from "./theme";

const CODE = `export const Video = () => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30 });

  return (
    <h1 style={{ scale }}>
      Merhaba Dünya!
    </h1>
  );
};`;

const KEYWORDS = /\b(export|const|return|fps|frame|style)\b/g;

// Basit sözdizimi renklendirme
const colorize = (line: string) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  line.replace(KEYWORDS, (m, _g, idx: number) => {
    parts.push(line.slice(last, idx));
    parts.push(
      <span key={idx} style={{ color: C.pink }}>
        {m}
      </span>,
    );
    last = idx + m.length;
    return m;
  });
  parts.push(line.slice(last));
  return parts;
};

export const CodeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.floor(interpolate(frame, [10, 95], [0, CODE.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const typed = CODE.slice(0, chars);
  const cursor = Math.floor(frame / 8) % 2 === 0;
  const win = spring({ frame, fps, config: { damping: 200 } });
  const preview = spring({ frame: frame - 100, fps, config: { damping: 8 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 330,
          width: 1000,
          height: 620,
          background: "#0f1126",
          borderRadius: 20,
          border: "1px solid #ffffff1a",
          boxShadow: `0 30px 80px #000a, 0 0 60px ${C.violet}33`,
          transform: `translateY(${(1 - win) * 80}px)`,
          opacity: win,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 10, padding: 20, borderBottom: "1px solid #ffffff12" }}>
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
          ))}
          <div style={{ color: C.muted, fontFamily: MONO, fontSize: 20, marginLeft: 20 }}>Video.tsx</div>
        </div>
        <pre style={{ margin: 0, padding: 30, fontFamily: MONO, fontSize: 30, lineHeight: 1.5, color: C.white }}>
          {typed.split("\n").map((l, i, arr) => (
            <div key={i}>
              <span style={{ color: "#4b4b70", marginRight: 26 }}>{String(i + 1).padStart(2, " ")}</span>
              {colorize(l)}
              {i === arr.length - 1 && cursor ? <span style={{ color: C.cyan }}>▋</span> : null}
            </div>
          ))}
        </pre>
      </div>

      {/* Önizleme: kodun sonucu */}
      <div
        style={{
          position: "absolute",
          left: 1160,
          top: 330,
          width: 670,
          height: 620,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(frame, [95, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <h1 style={{ fontFamily: FONT, color: "white", fontSize: 64, fontWeight: 900, transform: `scale(${preview})` }}>
          Merhaba Dünya!
        </h1>
      </div>

      <Label n="05 — KOD" title="Kod = Video" sub="Yazdığın bileşen anında videoya dönüşür" />
    </AbsoluteFill>
  );
};
