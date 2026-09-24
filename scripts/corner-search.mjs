// Поиск фото для уголков страниц (HeroCorner v2 «Тёплый кадр») + замена
// farm-sunset.jpg на главной. 10 запросов + 1 запасной для главной.
// Запуск: bun scripts/corner-search.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
const execFileP = promisify(execFile)

const OUT = "scripts/corner-src"
mkdirSync(OUT, { recursive: true })

// key -> запрос (natural language, gl=us для англоязычных стоков)
const QUERIES = {
  sun: "macro close up of solar panel cells in warm golden hour sunlight",
  battery: "modern home battery energy storage unit mounted on wall in bright interior",
  generator: "compact backup power generator in home courtyard, warm daylight",
  economics: "solar installer with tablet on rooftop at golden hour",
  regions: "aerial drone view of solar panel farm rows at sunrise, warm light",
  reference: "open engineering reference book with reading lamp on wooden desk, warm light",
  cases: "modern cozy house with rooftop solar panels at evening, warm lights",
  blog: "engineer writing notes in notebook near solar panels at sunset",
  about: "two engineers discussing project near solar installation, warm daylight",
  contacts: "friendly customer support specialist with headset in bright office",
  // запасная замена для карточки «Солнечные фермы» на главной (без вотермарков)
  farm: "large solar power plant panel rows under golden sunset sky",
}

const keys = Object.keys(QUERIES)
const CONCURRENCY = 3

async function searchOne(key) {
  const jsonPath = `${OUT}/${key}.json`
  if (existsSync(jsonPath)) {
    console.log(`[skip] ${key} уже найден`)
    return
  }
  try {
    const { stdout } = await execFileP("z-ai", [
      "image-search", "-q", QUERIES[key], "-c", "8", "--gl", "us", "--no-rank",
    ], { timeout: 240000, maxBuffer: 10 * 1024 * 1024 })
    // stdout содержит эмодзи-логи + JSON начиная с первой "{" — CLI-флаг -o не пишет файл
    const start = stdout.indexOf("{")
    if (start < 0) throw new Error("нет JSON в выводе")
    const data = JSON.parse(stdout.slice(start))
    if (!data.success || !data.results?.length) throw new Error("success=false/пусто")
    writeFileSync(jsonPath, JSON.stringify(data.results, null, 2))
    console.log(`[ok] ${key}: ${data.results.length} шт.`)
  } catch (e) {
    console.log(`[fail] ${key}: ${String(e.message).slice(0, 120)}`)
  }
}

async function pool(items, n, fn) {
  const q = [...items]
  const workers = Array.from({ length: n }, async () => {
    while (q.length) {
      const k = q.shift()
      await fn(k)
    }
  })
  await Promise.all(workers)
}

console.log("Поиск (конкурентно, ~3-5 минут)…")
await pool(keys, CONCURRENCY, searchOne)

// Повтор упавших — по одному, сервис не любит параллельность
for (const key of keys) {
  if (!existsSync(`${OUT}/${key}.json`)) {
    console.log(`[retry] ${key} последовательно…`)
    await searchOne(key)
  }
}

// Скачиваем кандидатов
async function downloadOne(key, idx, url) {
  const file = `${OUT}/${key}-${idx}.jpg`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!r.ok) throw new Error("HTTP " + r.status)
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 20000) throw new Error("too small " + buf.length)
    writeFileSync(file, buf)
  } catch (e) {
    console.log(`[dl-fail] ${key}-${idx}: ${String(e.message).slice(0, 80)}`)
  }
}

const dlJobs = []
for (const key of keys) {
  const p = `${OUT}/${key}.json`
  if (!existsSync(p)) continue
  try {
    const j = JSON.parse(readFileSync(p, "utf8"))
    j.forEach((r, i) => dlJobs.push([key, i, r.original_url]))
  } catch { /* ignore */ }
}
console.log(`Скачиваю ${dlJobs.length} кандидатов…`)
await pool(dlJobs, 5, ([k, i, u]) => downloadOne(k, i, u))
console.log("Готово. Файлы в scripts/corner-src/")
