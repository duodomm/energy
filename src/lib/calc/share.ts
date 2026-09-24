// Stateless-шаринг расчёта (ТЗ 4.3, 7.1): параметры кодируются в URL-хэш #calc=...
// Нулевые записи в хранилища, неограниченный срок жизни ссылки. KV не используется.

import type { CalcInput, SharePayload } from "./types"
import { LOAD_PRESETS } from "./constants"

const KEY = "calc-input-v1"

export function encodeShare(input: CalcInput): string {
  const payload: SharePayload = { v: 1, i: input }
  const json = JSON.stringify(payload)
  // base64url-алфавит: безопасен в URL-хэше без процентного кодирования
  const b64 = typeof window === "undefined"
    ? Buffer.from(json, "utf-8").toString("base64url")
    : btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return b64
}

export function decodeShare(b64: string): CalcInput | null {
  try {
    // Совместимость: base64url (- _) и стандартный base64 (+ /), плюс паддинг
    const normalized = b64.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const json = typeof window === "undefined"
      ? Buffer.from(b64, "base64url").toString("utf-8")
      : decodeURIComponent(escape(atob(padded)))
    const payload = JSON.parse(json) as SharePayload
    if (!payload?.i || typeof payload.i !== "object") return null
    return normalizeInput(payload.i)
  } catch {
    return null
  }
}

export function buildShareUrl(input: CalcInput): string {
  const b64 = encodeShare(input)
  const base = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
  return `${base}#calc=${b64}`
}

// Приведение частичного/старого ввода к валидному CalcInput
export function normalizeInput(raw: Partial<CalcInput>): CalcInput {
  const objectType = (raw.objectType && raw.objectType in LOAD_PRESETS ? raw.objectType : "house") as CalcInput["objectType"]
  const profile = Array.isArray(raw.loadProfile) && raw.loadProfile.length === 24
    ? raw.loadProfile.map((v) => clampNum(v, 0, 10))
    : LOAD_PRESETS[objectType]
  return {
    objectType,
    mode: (["grid", "hybrid", "autonomous", "autonomous_gen"] as const).includes(raw.mode as never) ? (raw.mode as CalcInput["mode"]) : "hybrid",
    regionCode: typeof raw.regionCode === "string" && raw.regionCode ? raw.regionCode : "moskva",
    voltage: raw.voltage === "380" ? "380" : "220",
    dailyKwh: clampNum(raw.dailyKwh, 0.5, 50000),
    loadProfile: profile,
    tariffPlan: raw.tariffPlan === "two" ? "two" : "flat",
    consumerType: raw.consumerType === "business" ? "business" : "household",
    peakKw: clampNum(raw.peakKw, 0.5, 2000),
    startK: clampNum(raw.startK ?? 3, 1, 7),
    appliances: Array.isArray(raw.appliances) ? raw.appliances : undefined,
    powerMode: raw.powerMode === "area" ? "area" : "kw",
    areaM2: raw.areaM2 != null ? clampNum(raw.areaM2, 1, 100000) : undefined,
    panelKw: raw.panelKw != null ? clampNum(raw.panelKw, 0.5, 2000) : raw.panelKw === 0 ? 0 : 5,
    panelClass: (["std", "premium", "bifacial"] as const).includes(raw.panelClass as never) ? (raw.panelClass as CalcInput["panelClass"]) : "std",
    installType: (["roof_slope", "roof_flat", "ground", "facade"] as const).includes(raw.installType as never) ? (raw.installType as CalcInput["installType"]) : "roof_slope",
    orientation: (["south", "se", "sw", "east", "west"] as const).includes(raw.orientation as never) ? (raw.orientation as CalcInput["orientation"]) : "south",
    shading: (["none", "partial", "heavy"] as const).includes(raw.shading as never) ? (raw.shading as CalcInput["shading"]) : "none",
    autonomyHours: [0, 4, 8, 12, 24, 48, 72].includes(raw.autonomyHours ?? 8) ? (raw.autonomyHours ?? 8) : 8,
    batteryTech: (["none", "lifepo4", "nmc", "agm", "vrfb"] as const).includes(raw.batteryTech as never) ? (raw.batteryTech as CalcInput["batteryTech"]) : "lifepo4",
    winterBalance: Boolean(raw.winterBalance),
    generator: (["none", "diesel", "gas"] as const).includes(raw.generator as never) ? (raw.generator as CalcInput["generator"]) : "none",
    genFuelPrice: raw.genFuelPrice != null ? clampNum(raw.genFuelPrice, 1, 500) : undefined,
    genHours: raw.genHours != null ? clampNum(raw.genHours, 0, 8760) : undefined,
    cableM: clampNum(raw.cableM ?? 20, 5, 2000),
    switchboard: raw.switchboard !== false,
  }
}

function clampNum(v: unknown, a: number, b: number): number {
  const n = typeof v === "number" && isFinite(v) ? v : a
  return Math.min(b, Math.max(a, n))
}

// localStorage — результат и последний ввод (ТЗ 4.3: «Результат сохраняется в localStorage»)
export function saveInput(input: CalcInput) {
  try {
    localStorage.setItem(KEY, JSON.stringify(input))
  } catch { /* приватный режим */ }
}

export function loadInput(): CalcInput | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return normalizeInput(JSON.parse(raw) as Partial<CalcInput>)
  } catch {
    return null
  }
}

// Чтение #calc= из адресной строки при загрузке страницы
export function readShareFromLocation(): CalcInput | null {
  if (typeof window === "undefined") return null
  const h = window.location.hash
  if (!h.startsWith("#calc=")) return null
  return decodeShare(h.slice("#calc=".length))
}
