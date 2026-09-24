// VLM-выбор лучшего кандидата по каждому контакт-листу.
// Запуск: bun scripts/corner-pick.mjs
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"
const execFileP = promisify(execFile)

const SRC = "scripts/corner-src"
const THEME = {
  sun: "макро-крупный план солнечной панели в тёплом золотом свете",
  battery: "домашний накопитель энергии / АКБ на стене в светлом интерьере",
  generator: "портативная электростанция/резерв питания на столе в тёплом свете (автономность)",
  economics: "монтажник/инженер с планшетом на крыше в золотой час (тема денег/расчётов)",
  regions: "аэрофото солнечной электростанции рядами панелей на рассвете",
  reference: "открытая техническая книга/справочник с тёплой лампой",
  cases: "современный уютный дом с панелями на крыше, вечерние тёплые окна",
  blog: "открытый блокнот и ручка на деревянном столе, тёплое закатное боке (заметки редакции)",
  about: "команда за работой: ноутбук, чертежи, инструменты, тёплый свет (рабочий стол проекта)",
  contacts: "гарнитура на столе рядом с ноутбуком, тёплый свет (поддержка на связи)",
  farm: "большая солнечная электростанция рядами панелей под закатным небом",
}

const PROMPT = (theme) => `Это контакт-лист из 8 пронумерованных фото (оранжевые плашки с номерами 1-8, слева направо, сверху вниз). Нужное фото по теме: ${theme}.
Критерии отбора:
1) один ясный фотогеничный сюжет, хорошая композиция;
2) тёплый/золотой свет или уютная сцена (сайт в «янтарной» палитре);
3) категорически НЕТ вотермарков, логотипов, подписей, рамок стоков;
4) нет крупного узнаваемого лица крупным планом (мелкие фигуры людей — ок);
5) кадр нормально обрежется по горизонтали ~7:5.
Ответь СТРОГО в формате одной строки:
BEST=<номер 1-8>; WHY=<до 10 слов>
Если все кандидаты непригодны: BEST=0; WHY=<причина>`

const sheets = readdirSync(SRC).filter((f) => /^sheet-/.test(f)).sort()
const picks = {}
for (const f of sheets) {
  const key = f.slice(6, -4)
  const outJson = `${SRC}/pick-${key}.json`
  try {
    await execFileP("z-ai", ["vision", "-p", PROMPT(THEME[key] || ""), "-i", `${SRC}/${f}`, "-o", outJson],
      { timeout: 180000 })
    const j = JSON.parse(readFileSync(outJson, "utf8"))
    const txt = (j.choices?.[0]?.message?.content || "").trim()
    const m = txt.match(/BEST\s*=\s*([0-9]+)\s*;?\s*WHY\s*=\s*(.+)/i)
    if (!m) throw new Error("нет BEST=: " + txt.slice(0, 80))
    picks[key] = { best: Number(m[1]), why: m[2].trim().slice(0, 120), raw: txt.slice(0, 200) }
    console.log(`[ok] ${key}: #${picks[key].best} — ${picks[key].why}`)
  } catch (e) {
    picks[key] = { best: 0, why: "ошибка: " + String(e.message).slice(0, 100) }
    console.log(`[fail] ${key}: ${picks[key].why}`)
  }
}
writeFileSync(`${SRC}/picks.json`, JSON.stringify(picks, null, 2))
console.log("Итог -> scripts/corner-src/picks.json")
