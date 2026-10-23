// Karakter animasyonu: tamamen kare numarasına bağlı saf fonksiyonlar

export const PIXAR_LEN = 300;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const seg = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Jump = { t0: number; air: number; h: number; x0: number; x1: number };

const PREP = 6; // hazırlık (anticipation) kare sayısı

export const JUMPS: Jump[] = [
  { t0: 8, air: 20, h: 1.6, x0: -10, x1: -6.6 },
  { t0: 36, air: 20, h: 1.5, x0: -6.6, x1: -3.3 },
  { t0: 64, air: 20, h: 1.3, x0: -3.3, x1: 0 },
  { t0: 205, air: 26, h: 2.2, x0: 0, x1: 0 },
  { t0: 262, air: 14, h: 0.6, x0: 0, x1: 0 },
];

// Zıplamaların iniş kareleri (ses efektleri için de kullanılır)
export const LANDINGS = JUMPS.map((j) => j.t0 + PREP + j.air);

export type CharState = {
  x: number;
  y: number;
  sy: number; // dikey ölçek (ezilme/uzama)
  lean: number;
  yaw: number;
  crouch: number;
};

const jumpState = (f: number) => {
  let active = JUMPS[0];
  for (const j of JUMPS) if (f >= j.t0) active = j;
  const j = active;
  const takeoff = j.t0 + PREP;
  const land = takeoff + j.air;
  const travel = j.x1 !== j.x0;
  if (f < j.t0) return { x: j.x0, y: 0, sy: 1, lean: 0, crouch: 0 };
  if (f < takeoff) {
    const c = ease((f - j.t0) / PREP);
    return { x: j.x0, y: 0, sy: 1 - 0.24 * c, lean: travel ? 0.08 * c : 0, crouch: c };
  }
  if (f < land) {
    const p = (f - takeoff) / j.air;
    return {
      x: lerp(j.x0, j.x1, p),
      y: 4 * p * (1 - p) * j.h,
      sy: 1 + 0.2 * Math.abs(1 - 2 * p) ** 1.5,
      lean: travel ? -0.22 * Math.sin(p * Math.PI) : 0,
      crouch: 0,
    };
  }
  const dt = f - land;
  return {
    x: j.x1,
    y: 0,
    sy: 1 - 0.3 * Math.exp(-dt / 3.5) * Math.cos(dt * 0.55),
    lean: travel ? 0.1 * Math.exp(-dt / 4) * Math.cos(dt * 0.5) : 0,
    crouch: 0,
  };
};

export const butterflyPos = (f: number, bulb: [number, number, number]): [number, number, number] => {
  if (f < 140) return [10, 5, 2];
  if (f < 200) {
    const t = ease(seg(f, 140, 200));
    return [
      lerp(10, 1.2, t) + Math.sin(f / 6) * 0.5,
      lerp(5, 4.3, t) + Math.sin(f / 4.3) * 0.35,
      lerp(2, 1, t) + Math.cos(f / 7) * 0.4,
    ];
  }
  if (f < 240) {
    const a = (f - 200) / 9;
    return [Math.cos(a) * 1.2, 4.3 + Math.sin(f / 4) * 0.25, Math.sin(a) * 1.0 + 0.3];
  }
  const hover: [number, number, number] = [Math.cos(40 / 9) * 1.2, 4.3, Math.sin(40 / 9) * 1.0 + 0.3];
  const t = ease(seg(f, 240, 258));
  return [
    lerp(hover[0], bulb[0], t),
    lerp(hover[1], bulb[1] + 0.12, t),
    lerp(hover[2], bulb[2], t),
  ];
};

export const charState = (f: number): CharState => {
  const j = jumpState(f);
  const breathe = 1 + 0.015 * Math.sin(f / 8);
  // Yönelim: yolculukta sağa bakar, sonra kameraya döner, etrafına bakınır
  let yaw = lerp(0.9, 0, ease(seg(f, 92, 106)));
  if (f >= 110 && f < 150) yaw = 0.5 * Math.sin(((f - 110) / 40) * Math.PI * 2);
  if (f >= 150) {
    const b = butterflyPos(f, [0, 3, 0]);
    yaw = lerp(0, Math.max(-0.6, Math.min(0.6, Math.atan2(b[0] - j.x, 4) * 0.8)), ease(seg(f, 150, 165)));
    yaw *= 1 - ease(seg(f, 250, 262));
  }
  return { x: j.x, y: j.y, sy: j.sy * breathe, lean: j.lean, yaw, crouch: j.crouch };
};

export const bulbPos = (f: number): [number, number, number] => {
  const s = charState(f);
  return [s.x, s.y + 2.3 * s.sy + 0.62, 0];
};

const BLINKS = [100, 128, 176, 222, 286];
export const blink = (f: number) => {
  let b = 0;
  for (const t of BLINKS) {
    const d = Math.abs(f - t);
    if (d < 3) b = Math.max(b, 1 - d / 3);
  }
  return b;
};

export const smile = (f: number) => lerp(0.35, 1, ease(seg(f, 252, 264)));
