// Третий раунд поиска — замена 3 уголков (blog, about, contacts) по запросу
// пользователя: новые живые сюжеты (руки за работой, люди в процессе).
// Запуск: bun scripts/corner-search3.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs"
const execFileP = promisify(execFile)

const OUT = "scripts/corner-src"
mkdirSync(OUT, { recursive: true })

const QUERIES = {
  blog: "hands writing in notebook beside laptop and coffee cup, warm window light, shallow depth of field",
  about: "two engineers discussing project at workbench with tools and laptop, candid, warm workshop light",
  contacts: "hand holding smartphone next to laptop and notebook on wooden desk, warm evening light, close up",
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
    "image-search", "-q", QUERIES[key], "-c", "10", "--gl", "us", "--no-rank",
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
