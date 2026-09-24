// Раунд 4: топливный генератор для уголка+баннера хаба «Генерация»
// (в кадрах портативных станций видны бренды EcoFlow/Growatt — заменяем).
// Запуск: bun scripts/corner-search4.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs"
const execFileP = promisify(execFile)

const OUT = "scripts/corner-src"
mkdirSync(OUT, { recursive: true })

const QUERIES = {
  genfuel: "diesel generator with fuel canister and tools in workshop, warm golden light",
}

for (const key of Object.keys(QUERIES)) {
  for (const f of readdirSync(OUT)) {
    if (f.startsWith(key + "-")) rmSync(`${OUT}/${f}`)
  }
  rmSync(`${OUT}/sheet-${key}.png`, { force: true })
}

async function run(key) {
  const jsonPath = `${OUT}/${key}.json`
  rmSync(jsonPath, { force: true })
  const { stdout } = await execFileP("z-ai", [
    "image-search", "-q", QUERIES[key], "-c", "10", "--gl", "us", "--no-rank",
  ], { timeout: 240000, maxBuffer: 10 * 1024 * 1024 })
  const start = stdout.indexOf("{")
  const data = JSON.parse(stdout.slice(start))
  if (!data.success) throw new Error("success=false")
  writeFileSync(jsonPath, JSON.stringify(data.results, null, 2))
  console.log(`[ok] ${key}: ${data.results.length}`)
  let n = 0
  for (const [i, r] of data.results.entries()) {
    try {
      const res = await fetch(r.original_url, { signal: AbortSignal.timeout(60000) })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 20000) continue
      writeFileSync(`${OUT}/${key}-${i}.jpg`, buf)
      n++
    } catch { /* skip */ }
  }
  console.log(`[dl] ${key}: ${n}/${data.results.length}`)
}

for (const key of Object.keys(QUERIES)) {
  try { await run(key) } catch (e) { console.log(`[fail] ${key}: ${String(e.message).slice(0, 100)}`) }
}
