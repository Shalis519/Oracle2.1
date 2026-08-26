// Chinese double-hour ("двухчасовка") time calculator.
//
// Reproduces the three time variants shown on tvoibazi.ru/hours:
//   - "Солнечное" (solar): fixed solar 2h blocks shifted to clock time by the
//     longitude correction used by the reference calculator.
//   - "Резиновое" (rubber): the 12 branches stretched over the real day/night
//     lengths via the original site's clock geometry (ported from its Vetvi()).
//   - "Совмещённое" (combined): the per-branch intersection of the solar and
//     rubber intervals (absent when there is no overlap).
//
// The astronomical sunrise/sunset is the standard Sun algorithm by B. Giesen
// (as used by the reference site), ported verbatim below.

export interface HourInterval {
  animal: string;
  start: string | null;
  end: string | null;
}

export interface BaziHoursInput {
  lat: number;
  lng: number;
  utcOffset: number;
  date: string; // YYYY-MM-DD
  /** Разделять ветвь Крысы на раннюю и позднюю. */
  doubledRat: boolean;
}

export interface BaziHoursResult {
  sunrise: string;
  sunset: string;
  shiftMinutes: number;
  equationOfTimeMinutes: number;
  solar: HourInterval[];
  rubber: HourInterval[];
  combined: HourInterval[];
}

const ANIMALS = [
  "Крыса",
  "Бык",
  "Тигр",
  "Кролик",
  "Дракон",
  "Змея",
  "Лошадь",
  "Коза",
  "Обезьяна",
  "Петух",
  "Собака",
  "Свинья",
];

function fmt(min: number): string {
  let m = Math.round(min);
  m = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}

// --- Sun rise/set (ported from the reference site's jsc.js, DOM-free) ---
function computeSunRiseSet(
  latitude: number,
  longitude: number,
  utcOffset: number,
  day: number,
  month: number,
  year: number,
): { rise: number; set: number } {
  const lat = latitude;
  const longit = longitude;
  let UTRISE = 0;
  let UTSET = 0;
  let RISE = false;
  let SETT = false;
  let Y0 = 0;
  let YE = 0;
  let zero1 = 0;
  let zero2 = 0;
  let NZ = 0;

  const frac = (X: number): number => {
    X = X - Math.floor(X);
    if (X < 0) X += 1;
    return X;
  };
  const sunDec = (jd: number): number => {
    const PI2 = 2 * Math.PI;
    const cos_eps = 0.917482;
    const sin_eps = 0.397778;
    const T = (jd - 2451545.0) / 36525.0;
    const M = PI2 * frac(0.993133 + 99.997361 * T);
    const DL = 6893.0 * Math.sin(M) + 72.0 * Math.sin(2 * M);
    const L = PI2 * frac(0.7859453 + M / PI2 + (6191.2 * T + DL) / 1296000);
    const SL = Math.sin(L);
    const Z = sin_eps * SL;
    const R = Math.sqrt(1 - Z * Z);
    return (360 / PI2) * Math.atan(Z / R);
  };
  const JulDay = (date: number, mo: number, yr: number, UT: number): number => {
    if (yr < 1900) yr += 1900;
    if (mo <= 2) {
      mo += 12;
      yr -= 1;
    }
    const B =
      Math.floor(yr / 400) - Math.floor(yr / 100) + Math.floor(yr / 4);
    const A = 365 * yr - 679004;
    const jd = A + B + Math.floor(30.6001 * (mo + 1)) + date + UT / 24;
    return jd + 2400000.5;
  };
  const computeGHA = (T: number, M: number, J: number, STD: number): number => {
    const K = Math.PI / 180;
    let N = 365 * J + T + 31 * M - 46;
    if (M < 3) N += Math.floor((J - 1) / 4);
    else N = N - Math.floor(0.4 * M + 2.3) + Math.floor(J / 4);
    const P = STD / 24;
    let X = (P + N - 7.22449e5) * 0.98564734 + 279.306;
    X *= K;
    let XX =
      -104.55 * Math.sin(X) -
      429.266 * Math.cos(X) +
      595.63 * Math.sin(2 * X) -
      2.283 * Math.cos(2 * X);
    XX += 4.6 * Math.sin(3 * X) + 18.7333 * Math.cos(3 * X);
    XX =
      XX -
      13.2 * Math.sin(4 * X) -
      Math.cos(5 * X) -
      Math.sin(5 * X) / 3 +
      0.5 * Math.sin(6 * X) +
      0.231;
    XX = XX / 240 + 360 * (P + 0.5);
    if (XX > 360) XX -= 360;
    return XX;
  };
  const computeHeight = (
    dec: number,
    lt: number,
    lon: number,
    gha: number,
  ): number => {
    const K = Math.PI / 180;
    const x = Number(gha) + Number(lon);
    const sinH =
      Math.sin(dec * K) * Math.sin(lt * K) +
      Math.cos(dec * K) * Math.cos(lt * K) * Math.cos(K * x);
    return Math.asin(sinH) / K;
  };
  const QUAD = (yM: number, yP: number): void => {
    NZ = 0;
    const A = 0.5 * (yM + yP) - Y0;
    const B = 0.5 * (yP - yM);
    const C = Y0;
    const XE = -B / (2 * A);
    YE = (A * XE + B) * XE + C;
    const DIS = B * B - 4 * A * C;
    if (DIS >= 0) {
      const DX = 0.5 * Math.sqrt(DIS) / Math.abs(A);
      zero1 = XE - DX;
      zero2 = XE + DX;
      if (Math.abs(zero1) <= 1) NZ++;
      if (Math.abs(zero2) <= 1) NZ++;
      if (zero1 < -1) zero1 = zero2;
    }
  };
  const riseset = (
    DATE: number,
    MON: number,
    YR: number,
    HOUR: number,
  ): void => {
    const K = Math.PI / 180;
    const sh = Math.sin(-K * 0.8333);
    let dec = sunDec(JulDay(DATE, MON, YR, HOUR));
    let gha = computeGHA(DATE, MON, YR, HOUR);
    Y0 = Math.sin(K * computeHeight(dec, lat, longit, gha)) - sh;
    dec = sunDec(JulDay(DATE, MON, YR, HOUR + 1));
    gha = computeGHA(DATE, MON, YR, HOUR + 1);
    const yPlus = Math.sin(K * computeHeight(dec, lat, longit, gha)) - sh;
    dec = sunDec(JulDay(DATE, MON, YR, HOUR - 1));
    gha = computeGHA(DATE, MON, YR, HOUR - 1);
    const yMinus = Math.sin(K * computeHeight(dec, lat, longit, gha)) - sh;
    QUAD(yMinus, yPlus);
    switch (NZ) {
      case 0:
        break;
      case 1:
        if (yMinus < 0) {
          UTRISE = HOUR + zero1;
          RISE = true;
        } else {
          UTSET = HOUR + zero1;
          SETT = true;
        }
        break;
      case 2:
        if (YE < 0) {
          UTRISE = HOUR + zero2;
          UTSET = HOUR + zero1;
        } else {
          UTRISE = HOUR + zero1;
          UTSET = HOUR + zero2;
        }
        RISE = true;
        SETT = true;
        break;
    }
  };

  const locOffset = utcOffset;
  for (let i = -locOffset; i < -locOffset + 24; i++) {
    riseset(day, month, year, i);
    if (RISE && SETT) break;
  }
  let r = UTRISE + locOffset;
  let s = UTSET + locOffset;
  if (r > 24) r -= 24;
  if (r < 0) r += 24;
  if (s > 24) s -= 24;
  if (s < 0) s += 24;
  return { rise: r * 60, set: s * 60 };
}

// --- Rubber-time branch boundaries (ported from the reference site's Vetvi) ---
function rubberBoundaries(
  riseClockMin: number,
  setClockMin: number,
  shift: number,
): number[] {
  let tmp = riseClockMin - shift;
  const riseSolarH = Math.floor(Math.round(tmp) / 60);
  const riseSolarM = Math.round(tmp) % 60;
  tmp = setClockMin - shift;
  const setSolarH = Math.floor(Math.round(tmp) / 60);
  const setSolarM = Math.round(tmp) % 60;
  const ratFlag = riseSolarM !== 0;

  let paramTempHours = 23 - setSolarH;
  let t14 = 60 - setSolarM;
  if (setSolarM === 0) {
    t14 = 0;
    paramTempHours++;
  }
  const x1a = paramTempHours * 60 + t14;
  const x1b = riseSolarH * 60 + riseSolarM;
  const x1c = (x1b - x1a) / 2;

  let x1d: number;
  if (x1c < 60) {
    x1d = 0;
    if (x1c < 0) x1d = -Math.floor(Math.abs(x1c) / 60);
  } else {
    x1d = Math.floor(x1c / 60);
  }
  let x1e = Math.abs(x1c) % 60;
  if (x1e < 0) x1e = 0;

  let x18 = 0;
  let x19 = 0;
  let x21 = 0;
  let x22 = 0;
  if (x1c < 0) {
    const x1f = x1a + x1c;
    const x20 = setSolarH * 60 + setSolarM - x1c;
    x21 = Math.floor(Math.round(x1f) / 60);
    x22 = Math.round(x1f) % 60;
    x18 = Math.floor(Math.round(x20) / 60);
    x19 = Math.round(x20) % 60;
  }
  if (x1c >= 0) {
    x21 = x1d + paramTempHours;
    x22 = x1e + t14;
    if (x22 >= 60) {
      x22 -= 60;
      x21++;
    }
    if (ratFlag) {
      x18 = 23 - x21;
      x19 = 60 - x22;
    } else {
      x18 = 24 - riseSolarH;
      x19 = 0;
    }
  }

  const paramPoints =
    riseSolarH > 11
      ? [
          { h: x18, m: x19 },
          { h: x21, m: x22 },
        ]
      : [
          { h: x21, m: x22 },
          { h: x18, m: x19 },
        ];
  const firstRad =
    ((paramPoints[0]!.h * 60 + paramPoints[0]!.m) / 1440) * 2 * Math.PI;
  const centerX = Math.cos(firstRad);
  const rotation = (360 / 24 / 60) * x1c;

  const baseDeg = [15, 45, 75, 105, 135, 165, 15, 45, 75, 105, 135, 165];
  const lines = baseDeg.map((deg, k) => {
    const d = k < 6 ? deg + rotation : deg - rotation;
    return { deg: d, k: Math.tan((d * Math.PI) / 180), r0: 0, r1: 0 };
  });

  const x28 = -1;
  for (const L of lines) {
    const k = L.k;
    const yc = -centerX * k;
    const denom = k * k + x28 * x28;
    const x0 = (-k * yc) / denom;
    const mult = Math.sqrt((1 - (yc * yc) / denom) / denom);
    const aX = x0 + x28 * mult;
    const bX = x0 - x28 * mult;
    L.r0 =
      ((L.deg <= 90 ? Math.acos(bX) : Math.acos(aX)) / (2 * Math.PI)) * 1440;
  }
  for (const L of lines) {
    L.r1 = 1440 - L.r0;
    if (L.deg <= 0) L.r0 = L.r1;
    if (L.deg > 180) L.r0 = 1440 - L.r0;
  }
  for (const L of lines) {
    L.r0 += shift;
    L.r1 += shift;
    if (L.r0 > 1440) L.r0 -= 1440;
    if (L.r1 > 1440) L.r1 -= 1440;
  }

  const b: number[] = [];
  b[1] = lines[0]!.r0;
  b[2] = lines[1]!.r0;
  b[3] = lines[2]!.r0;
  b[4] = lines[3]!.r0;
  b[5] = lines[4]!.r0;
  b[6] = lines[5]!.r0;
  b[7] = lines[11]!.r1;
  b[8] = lines[10]!.r1;
  b[9] = lines[9]!.r1;
  b[10] = lines[8]!.r1;
  b[11] = lines[7]!.r1;
  b[12] = lines[6]!.r1;
  b[0] = b[12]!;
  return b;
}

interface NumInterval {
  animal: string;
  s: number | null;
  e: number | null;
}

// Intersection of two arcs on a 24h circle. Returns null when disjoint.
function arcIntersect(
  aS: number,
  aE: number,
  bS: number,
  bE: number,
): { s: number; e: number } | null {
  const aLen = ((aE - aS + 1440) % 1440) || 1440;
  const bLen = ((bE - bS + 1440) % 1440) || 1440;
  let best: { s: number; e: number; len: number } | null = null;
  for (const off of [-1440, 0, 1440]) {
    const s = Math.max(aS, bS + off);
    const e = Math.min(aS + aLen, bS + off + bLen);
    if (e > s) {
      const len = e - s;
      if (!best || len > best.len) {
        best = {
          s: ((s % 1440) + 1440) % 1440,
          e: ((e % 1440) + 1440) % 1440,
          len,
        };
      }
    }
  }
  return best ? { s: best.s, e: best.e } : null;
}

// Split the Rat branch at midnight into late (晚子时) and early (早子时) halves.
function splitRat(
  s: number | null,
  e: number | null,
): [NumInterval, NumInterval] {
  if (s === null || e === null) {
    return [
      { animal: "Крыса (поздняя)", s, e },
      { animal: "Крыса (ранняя)", s: null, e: null },
    ];
  }
  const len = ((e - s + 1440) % 1440) || 1440;
  const toMid = (1440 - s) % 1440;
  if (toMid > 0 && toMid < len) {
    return [
      { animal: "Крыса (поздняя)", s, e: 1440 },
      { animal: "Крыса (ранняя)", s: 0, e },
    ];
  }
  if (s >= 720) {
    return [
      { animal: "Крыса (поздняя)", s, e },
      { animal: "Крыса (ранняя)", s: null, e: null },
    ];
  }
  return [
    { animal: "Крыса (поздняя)", s: null, e: null },
    { animal: "Крыса (ранняя)", s, e },
  ];
}

function applyDoubled(list: NumInterval[], doubledRat: boolean): NumInterval[] {
  if (doubledRat) return list;
  const rat = list[0]!;
  const [late, early] = splitRat(rat.s, rat.e);
  // В публичной таблице день начинается с ранней Крысы после полуночи,
  // а поздняя Крыса завершает порядок после Свиньи.
  return [early, ...list.slice(1), late];
}

/**
 * Vetvi() returns the rubber intervals in public branch order, starting with
 * Rat just after local midnight and ending with Pig at the end of the day.
 */
function rubberByBranch(raw: NumInterval[]): NumInterval[] {
  return raw;
}

function toOut(iv: NumInterval): HourInterval {
  return {
    animal: iv.animal,
    start: iv.s === null ? null : fmt(iv.s),
    end: iv.e === null ? null : fmt(iv.e),
  };
}

export function computeBaziHours(input: BaziHoursInput): BaziHoursResult {
  const [y, m, d] = input.date.split("-").map((p) => parseInt(p, 10));
  const { rise, set } = computeSunRiseSet(
    input.lat,
    input.lng,
    input.utcOffset,
    d!,
    m!,
    y!,
  );
  // Convert solar-clock boundaries back to the selected civil clock. The
  // reference calculator displays the equation of time separately but does not
  // include it in the interval shift.
  const utcNoon = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  const dayOfYear = Math.floor((utcNoon.getTime() - Date.UTC(y!, 0, 1)) / 86400000) + 1;
  const angle = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const equationOfTime = 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
  const shift = input.utcOffset * 60 - input.lng * 4;
  const riseMin = Math.round(rise);
  const setMin = Math.round(set);

  // Solar: fixed solar 2h blocks (Rat centred on solar midnight) + shift.
  const sb: number[] = [];
  for (let i = 0; i <= 12; i++) sb[i] = (23 + 2 * i) * 60 + shift;
  const solar: NumInterval[] = ANIMALS.map((animal, i) => ({
    animal,
    s: sb[i]!,
    e: sb[i + 1]!,
  }));

  // Rubber: stretched branches in the reference calculator's public order.
  const rb = rubberBoundaries(riseMin, setMin, shift);
  const rubberIntervals: NumInterval[] = ANIMALS.map((animal, i) => ({
    animal,
    s: rb[i]!,
    e: rb[i + 1]!,
  }));
  const rubber = rubberByBranch(rubberIntervals).map((iv, i) => ({
    ...iv,
    animal: ANIMALS[i]!,
  }));

  // Combined: per-branch intersection of solar and rubber.
  const norm = (x: number) => ((Math.round(x) % 1440) + 1440) % 1440;
  const combined: NumInterval[] = ANIMALS.map((animal, i) => {
    const rubberBranch = rubber[i]!;
    const o = arcIntersect(norm(sb[i]!), norm(sb[i + 1]!), rubberBranch.s!, rubberBranch.e!);
    return { animal, s: o ? o.s : null, e: o ? o.e : null };
  });

  return {
    sunrise: fmt(rise),
    sunset: fmt(set),
    shiftMinutes: Math.round(shift),
    equationOfTimeMinutes: Number(equationOfTime.toFixed(2)),
    solar: applyDoubled(solar, input.doubledRat).map(toOut),
    rubber: applyDoubled(rubber, input.doubledRat).map(toOut),
    combined: applyDoubled(combined, input.doubledRat).map(toOut),
  };
}
