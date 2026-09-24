// Солнечная астрономия для визуализаций (волна 2 С10, концепт №6 «Изоинтерфейс»).
// Дуги солнечного пути по сезонам, широты регионов, косинус угла падения луча
// на панель. Чистая сферическая тригонометрия, ноль зависимостей — считается
// на клиенте, как и всё расчётное ядро (ТЗ 4.2).
//
// Соглашения:
//   - азимут отсчитывается от севера по часовой стрелке (0° = север, 90° = восток,
//     180° = юг, 270° = запад);
//   - высота солнца — градусы над горизонтом;
//   - t — солнечное время в часах (полдень = 12);
//   - наклон панели tilt — угол от горизонта (0° = горизонтально, 90° = вертикально).

import type { InstallType, Orientation, RefRegion } from "./types"

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Широты административных центров регионов РФ (справочно, для дуг солнечного пути) */
export const REGION_LAT: Record<string, number> = {
  moskva: 55.75,
  spb: 59.94,
  kaliningrad: 54.71,
  arkhangelsk: 64.54,
  vologda: 59.22,
  murmansk: 68.97,
  voronezh: 51.67,
  belgorod: 50.6,
  "nizhny-novgorod": 56.33,
  samara: 53.2,
  kazan: 55.79,
  ufa: 54.74,
  saratov: 51.53,
  perm: 58.01,
  krasnodar: 45.04,
  sochi: 43.6,
  rostov: 47.23,
  volgograd: 48.71,
  crimea: 44.95,
  stavropol: 45.04,
  grozny: 43.31,
  ekaterinburg: 56.84,
  chelyabinsk: 55.16,
  tyumen: 57.15,
  yamal: 66.53,
  novosibirsk: 55.03,
  krasnoyarsk: 56.01,
  irkutsk: 52.28,
  yakutsk: 62.03,
  vladivostok: 43.12,
  khabarovsk: 48.48,
  kamchatka: 53.02,
}

/** Азимут, которому «смотрит» панель, по ориентации из калькулятора */
export const ORIENT_AZIMUTH: Record<Orientation, number> = {
  south: 180,
  se: 135,
  sw: 225,
  east: 90,
  west: 270,
}

/** Короткие русские подписи ориентаций для схем */
export const ORIENT_SHORT: Record<Orientation, string> = {
  south: "Ю",
  se: "ЮВ",
  sw: "ЮЗ",
  east: "В",
  west: "З",
}

/** Типовой наклон панелей по типу установки (для угла падения в sun-path) */
export const INSTALL_TILT: Record<InstallType, number> = {
  roof_slope: 35,
  roof_flat: 10,
  ground: 40,
  facade: 90,
}

/** Опорные дни сезонов: летнее солнцестояние, равноденствие, зимнее солнцестояние */
export const SEASON_DAYS = { jun: 172, equinox: 80, dec: 355 } as const

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000)
}

/** Склонение солнца (δ) по дню года, формула Купера — достаточно для визуализаций */
export function sunDeclination(dayIdx: number): number {
  return 23.44 * Math.sin(rad((360 * (284 + dayIdx)) / 365))
}

export interface SunPoint {
  /** солнечное время, ч */
  t: number
  /** высота над горизонтом, ° */
  alt: number
  /** азимут от севера по часовой, ° */
  az: number
}

/** Положение солнца в момент солнечного времени t */
export function sunPosition(lat: number, dec: number, t: number): SunPoint {
  const H = rad(15 * (t - 12)) // часовой угол
  const phi = rad(lat)
  const delta = rad(dec)
  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H)
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)))
  // Азимут из сферического треугольника; после полудня солнце в западной половине
  const cosAz =
    (Math.sin(delta) - Math.sin(alt) * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) || 1e-9)
  const acosAz = Math.acos(Math.max(-1, Math.min(1, cosAz)))
  const az = t > 12 ? 360 - deg(acosAz) : deg(acosAz)
  return { t, alt: deg(alt), az }
}

export type DayKind = "normal" | "polar-day" | "polar-night"

export interface DayWindow {
  kind: DayKind
  /** восход/закат в солнечном времени (для polar-day — 0/24, polar-night — 12/12) */
  rise: number
  set: number
}

/** Световое окно дня: обычное / полярный день / полярная ночь */
export function dayWindow(lat: number, dec: number): DayWindow {
  const cosW = -Math.tan(rad(lat)) * Math.tan(rad(dec))
  if (cosW <= -1) return { kind: "polar-day", rise: 0, set: 24 }
  if (cosW >= 1) return { kind: "polar-night", rise: 12, set: 12 }
  const half = deg(Math.acos(cosW)) / 15 // часы от полудня до заката
  return { kind: "normal", rise: 12 - half, set: 12 + half }
}

/** Кривая дня: сэмплы положения солнца от восхода до заката */
export function dayCurve(lat: number, dec: number, samples = 64): SunPoint[] {
  const w = dayWindow(lat, dec)
  if (w.kind === "polar-night") return []
  const step = (w.set - w.rise) / samples
  const pts: SunPoint[] = []
  for (let i = 0; i <= samples; i++) pts.push(sunPosition(lat, dec, w.rise + i * step))
  return pts
}

/**
 * Косинус угла падения луча на панель.
 * cos i = sin β · cos(alt) · cos(az − A) + cos β · sin(alt),
 * где β — наклон панели от горизонта, A — азимут панели.
 * > 0 — луч попадает на лицевую сторону; 1 — перпендикуляр (максимум мощности).
 */
export function cosIncidence(alt: number, az: number, tilt: number, panelAz: number): number {
  return (
    Math.sin(rad(tilt)) * Math.cos(rad(alt)) * Math.cos(rad(az - panelAz)) +
    Math.cos(rad(tilt)) * Math.sin(rad(alt))
  )
}

/** Широта региона с фолбэком на широту Москвы */
export function regionLat(region: RefRegion): number {
  return REGION_LAT[region.code] ?? 55.75
}

/** Точка кривой, ближайшая к моменту t (линейная интерполяция) */
export function pointAtT(curve: SunPoint[], t: number): SunPoint {
  if (curve.length === 0) return { t, alt: 0, az: 180 }
  if (t <= curve[0].t) return curve[0]
  const last = curve[curve.length - 1]
  if (t >= last.t) return last
  const span = last.t - curve[0].t || 1
  const f = ((t - curve[0].t) / span) * (curve.length - 1)
  const i = Math.floor(f)
  const k = f - i
  const a = curve[i]
  const b = curve[Math.min(i + 1, curve.length - 1)]
  return { t, alt: a.alt + (b.alt - a.alt) * k, az: a.az + (b.az - a.az) * k }
}

/** ЧЧ:ММ из дробного часа */
export function fmtTime(t: number): string {
  const tt = Math.max(0, Math.min(24, t))
  const h = Math.floor(tt)
  const m = Math.floor((tt - h) * 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
