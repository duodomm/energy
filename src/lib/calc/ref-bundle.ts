// Загрузчик справочного JSON-бандла (ТЗ раздел 5: «ежедневный Cron пересобирает статичный
// JSON-бандл справочников; запросы к D1 из публичной части — только чтение, кэш»).
// Здесь: in-memory кэш 1 ч + fetch /api/reference.

import type { RefBundle } from "./types"
import { apiGet } from "@/lib/api-static"

let cache: { bundle: RefBundle; at: number } | null = null
const TTL = 60 * 60 * 1000 // 1 ч — как кэш KV по ТЗ

export async function loadRefBundle(force = false): Promise<RefBundle> {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.bundle
  // dev: живой /api/reference; статика (Cloudflare): JSON-бандл /api-data/reference.json
  const bundle = await apiGet<RefBundle>("/api/reference", "/api-data/reference.json")
  cache = { bundle, at: Date.now() }
  return bundle
}

export function getCachedBundle(): RefBundle | null {
  return cache ? cache.bundle : null
}

export function formatRub(v: number): string {
  if (!isFinite(v)) return "—"
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд ₽`
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)} млн ₽`
  return `${Math.round(v).toLocaleString("ru-RU")} ₽`
}

export function formatKwh(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн кВт·ч`
  return `${Math.round(v).toLocaleString("ru-RU")} кВт·ч`
}
