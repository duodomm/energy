// Клиентский загрузчик контента с деградацией на статический бандл.
// Dev/Node-режим: живой API-роут (Prisma/SQLite) — свежие данные после правок в админке.
// Статика (Cloudflare Workers Static Assets): /api/* не отвечает → читаем
// JSON-бандл public/api-data/* (собирается scripts/build-api-json.ts).
// Один контракт для обоих режимов — страницы не знают, где работают.

export async function apiGet<T>(apiPath: string, staticPath: string): Promise<T> {
  try {
    const res = await fetch(apiPath)
    if (res.ok) return (await res.json()) as T
  } catch {
    // сети/роута нет — уходим в статический бандл
  }
  const r2 = await fetch(staticPath)
  if (!r2.ok) throw new Error(`Данные недоступны: ${staticPath} (${r2.status})`)
  return (await r2.json()) as T
}
