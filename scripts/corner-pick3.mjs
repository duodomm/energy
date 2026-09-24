// VLM-выбор лучших кандидатов для трёх заменяемых уголков (blog, about, contacts).
// Запуск: bun scripts/corner-pick3.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFileSync, writeFileSync } from "node:fs"
const execFileP = promisify(execFile)

const SRC = "scripts/corner-src"
const KEYS = ["blog", "about", "contacts"]
const THEME = {
  blog: "живая сцена письма/заметок: руки пишут в блокноте рядом с ноутбуком и кофе, тёплый свет (заметки инженера)",
  about: "команда за работой: инженеры обсуждают проект у верстака/стола с инструментами и ноутбуком, тёплый candid-свет (команда и метод)",
  contacts: "живая связь: рука со смартфоном рядом с ноутбуком на столе, тёплый вечерний свет (инженер на связи)",
}

const PROMPT = (theme) => `Это контакт-лист из 8 пронумерованных фото (оранжевые плашки с номерами 1-8, слева направо, сверху вниз). Нужное фото по теме: ${theme}.
Критерии отбора:
1) живой процесс в кадре (руки/люди в действии), ясная композиция;
2) тёплый/золотой свет или уютная сцена (сайт в «янтарной» палитре);
3) категорически НЕТ вотермарков, логотипов, подписей, рамок стоков;
4) нет крупного узнаваемого лица крупным планом (съёмка со спины/сбоку, руки — ок);
5) кадр нормально обрежется по ~7:5 и останется читаемым в маленьком размере.
Ответь СТРОГО в формате одной строки:
BEST=<номер 1-8>; WHY=<до 10 слов>
Если все кандидаты непригодны: BEST=0; WHY=<причина>`

const picks = {}
for (const key of KEYS) {
  const outJson = `${SRC}/pick-${key}.json`
  try {
    await execFileP("z-ai", ["vision", "-p", PROMPT(THEME[key]), "-i", `${SRC}/sheet-${key}.png`, "-o", outJson],
      { timeout: 180000 })
    const j = JSON.parse(readFileSync(outJson, "utf8"))
    const txt = (j.choices?.[0]?.message?.content || "").trim()
    const m = txt.match(/BEST\s*=\s*([0-9]+)\s*;?\s*WHY\s*=\s*(.+)/i)
    if (!m) throw new Error("нет BEST=: " + txt.slice(0, 80))
    picks[key] = { best: Number(m[1]), why: m[2].trim().slice(0, 120) }
    console.log(`[ok] ${key}: #${picks[key].best} — ${picks[key].why}`)
  } catch (e) {
    picks[key] = { best: 0, why: "ошибка: " + String(e.message).slice(0, 100) }
    console.log(`[fail] ${key}: ${picks[key].why}`)
  }
}
writeFileSync(`${SRC}/picks3.json`, JSON.stringify(picks, null, 2))
console.log("Итог -> scripts/corner-src/picks3.json")
