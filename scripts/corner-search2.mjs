// Второй раунд поиска для 4 неудачных тем — с упрощёнными «фотогеничными» запросами.
// Запуск: bun scripts/corner-search2.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs"
const execFileP = promisify(execFile)

const OUT = "scripts/corner-src"
mkdirSync(OUT, { recursive: true })

const QUERIES = {
  generator: "portable power station on wooden table outdoors, cables and coffee, warm light",
  blog: "open notebook and pen on wooden table at sunset bokeh",
  about: "engineers team with laptop and blueprints at construction field, golden hour",
  contacts: "wireless headset lying on desk next to laptop, warm office light, close up",
}

// чистим старых кандидатов этих ключей
for (const key of Object.keys(QUERIES)) {
  for (const f of readdirSync(OUT)) {
    if (f.startsWith(key + "-")) rmSync(`${OUT}/${f}`)
  }
  rmSync(`${OUT}/sheet-${key}.png`, { force: true })
  rmSync(`${OUT}/pick-${key}.json`, { force: true })
}

async function run(key) {
  const jsonPath = `${OUT}/${key}.json`
  rmSync(jsonPath, { force: true })
  const { stdout } = await execFileP("z-ai", [
    "image-search", "-q", QUERIES[key], "-c", "8", "--gl", "us", "--no-rank",
  ], { timeout: 240000, maxBuffer: 10 * 1024 * 1024 })
  const start = stdout.indexOf("{")
  const data = JSON.parse(stdout.slice(start))
  if (!data.success) throw new Error("success=false")
  writeFileSync(jsonPath, JSON.stringify(data.results, null, 2))
  console.log(`[ok] ${key}: ${data.results.length}`)
  // скачиваем
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
