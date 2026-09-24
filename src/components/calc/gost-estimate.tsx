"use client"

// Концепт №1 «ГОСТ-чертёж» (волна 3+, С10 «Энергосистема»): PDF-смета как
// лист конструкторского документа — рамка по ГОСТ 2.301 (поля 20/5/5/5 мм),
// основная надпись по мотивам формы 1 ГОСТ 2.104, спецификация «от–до»,
// примечания. PDF формируется печатью браузера (ТЗ: клиентски, без сервера):
// при открытии оверлея в <head> инжектится @page A4 margin:0 и на body —
// класс .gost-printing (globals.css прячет всё, кроме портала).
//
// Числа в листе — из того же CalcResult, что смета на экране («документ не врёт»).

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { FileDown, Printer, X, Info } from "lucide-react"
import type { CalcResult, RefBundle, SmetаRow } from "@/lib/calc/types"
import { trackGoal } from "@/lib/analytics"

const nbsp = (v: number) => Math.round(v).toLocaleString("ru-RU")

// Подписи режимов/типов (короткие, для графы листа)
const OBJ_LABEL: Record<string, string> = {
  house: "частный дом",
  dacha: "дача",
  cottage: "дача",
  business: "коммерческий объект",
  farm: "ферма / КФХ",
  industrial: "промышленный объект",
  utility: "объект ЖКХ",
}
const MODE_LABEL: Record<string, string> = {
  grid: "сетевой (без АКБ)",
  hybrid: "гибридный (сеть + АКБ)",
  autonomous: "автономный (без сети)",
  autonomous_gen: "автономный + генератор",
}
const INSTALL_LABEL: Record<string, string> = {
  roof_slope: "наклонная кровля",
  roof_flat: "плоская кровля (балласт)",
  ground: "наземный каркас",
  facade: "фасад",
}
const TECH_LABEL: Record<string, string> = {
  lifepo4: "LiFePO4",
  nmc: "NMC",
  agm: "AGM",
  vrfb: "ванадиевые VRFB",
  none: "—",
}

const GROUP_TITLES: Record<SmetаRow["group"], string> = {
  equipment: "Оборудование и материалы",
  mount: "Монтаж (по нормо-часам)",
  works: "Проект и пусконаладка",
}

// Ширина листа А4 при 96 dpi: 794 px; высота 1123 px.
const SHEET_W = 794
const SHEET_H = 1123

export function GostEstimate({
  result,
  bundle,
  label = "Смета PDF (ГОСТ)",
  compact = false,
}: {
  result: CalcResult
  bundle: RefBundle
  label?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => {
          setOpen(true)
          trackGoal("gost_pdf_open")
        }}
      >
        <FileDown className="mr-1.5 h-4 w-4" /> {label}
      </Button>
      {open && <GostOverlay result={result} bundle={bundle} onClose={() => setOpen(false)} />}
    </>
  )
}

function GostOverlay({ result, bundle, onClose }: { result: CalcResult; bundle: RefBundle; onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [sheetH, setSheetH] = useState(SHEET_H)

  // Инфраструктура печати: @page A4 margin 0 + класс на body (стили в globals.css)
  useEffect(() => {
    const st = document.createElement("style")
    st.textContent = "@page { size: A4 portrait; margin: 0; }"
    document.head.appendChild(st)
    document.body.classList.add("gost-printing")
    document.body.style.overflow = "hidden"
    return () => {
      st.remove()
      document.body.classList.remove("gost-printing")
      document.body.style.overflow = ""
    }
  }, [])

  // Масштаб превью под ширину экрана (rAF — как требует линтер экосистемы)
  useEffect(() => {
    const fit = () => setScale(Math.min(1, Math.max(0.34, (window.innerWidth - 24) / SHEET_W)))
    const raf = requestAnimationFrame(() => {
      fit()
      if (sheetRef.current) setSheetH(sheetRef.current.scrollHeight)
    })
    window.addEventListener("resize", fit)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", fit)
    }
  }, [])

  // Esc закрывает
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const doPrint = () => {
    trackGoal("pdf_download", { format: "gost" })
    window.print()
  }

  return createPortal(
    <div
      className="gost-portal fixed inset-0 z-[90] overflow-y-auto bg-scene/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="PDF-смета в формате ГОСТ"
    >
      {/* UI-полоса — на печати скрывается */}
      <div className="gost-ui sticky top-0 z-10 border-b border-scene-border bg-scene/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-scene-foreground">
              Смета-чертёж · лист А4 · ГОСТ 2.104
            </p>
            <p className="truncate text-xs text-scene-muted">
              «Сохранить как PDF» в диалоге печати · рамка 20/5 мм · все числа из расчёта
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" className="bg-gradient-solar text-primary-foreground hover:opacity-95" onClick={doPrint}>
              <Printer className="mr-1.5 h-4 w-4" /> Печать / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-scene-border bg-transparent text-scene-foreground hover:bg-scene-2"
              onClick={onClose}
            >
              <X className="mr-1.5 h-4 w-4" /> Закрыть
            </Button>
          </div>
        </div>
      </div>

      <div className="gost-stage flex justify-center px-3 py-6">
        <div className="gost-scale-wrap" style={{ width: SHEET_W * scale, height: sheetH * scale }}>
          <div className="gost-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <GostSheet ref={sheetRef} result={result} bundle={bundle} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ===== Лист ГОСТ =====

const GostSheet = ({
  ref,
  result,
  bundle,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  result: CalcResult
  bundle: RefBundle
}) => {
  const { composition: c, smetaTotals: t, economy: e, months } = result
  const region = result.region
  const input = result.input

  const priceDate = new Date(bundle.priceUpdatedAt).toLocaleDateString("ru-RU")
  const today = new Date().toLocaleDateString("ru-RU")

  const worst = months.reduce((w, m, i) => (m.generation < months[w].generation ? i : w), 0)
  const worstMonth = months[worst]

  const techRows: [string, string][] = [
    ["Объект", OBJ_LABEL[input.objectType] ?? input.objectType],
    ["Режим электроснабжения", MODE_LABEL[input.mode] ?? input.mode],
    ["Панели", `${c.panelCount} × ${c.panelW} Вт = ${c.pnom} кВт (${input.panelClass === "bifacial" ? "бифациальные" : input.panelClass === "premium" ? "премиум" : "стандарт"})`],
    ["Конструкция", `${INSTALL_LABEL[input.installType] ?? input.installType}${c.reinforced ? " + усиление креплений" : ""}`],
    ["Инвертор", `${c.inverterKw} кВт, ${input.voltage === "380" ? "380 В / 3 фазы" : "220 В / 1 фаза"}${c.hasMppt ? ", MPPT" : ""}`],
    ["Накопитель", c.batteryKwh > 0 ? `${c.batteryKwh} кВт·ч, ${TECH_LABEL[c.batteryTech] ?? c.batteryTech}; автономия ${result.autonomy?.hours ?? "—"} ч` : "не предусмотрен"],
    ["Генератор", c.generatorKw ? `${c.generatorKw} кВт${c.hasAvr ? ", АВР" : ""}` : "не предусмотрен"],
    ["Генерация (год)", `${nbsp(result.annualGeneration)} кВт·ч (PSH: ${region.name})`],
    ["Потребление (год)", `${nbsp(result.annualLoad)} кВт·ч; самопокрытие ${Math.round(result.selfSufficiency * 100)}%`],
    ["Худший месяц", `${worstMonth.label}: генерация ${nbsp(worstMonth.generation)} кВт·ч, потребление ${nbsp(worstMonth.load)} кВт·ч`],
    ["LCOE (25 лет)", `${e.lcoeNominal}–${e.lcoe} ₽/кВт·ч (номинал / дисконт 10%)`],
    ["Окупаемость", e.paybackVsGrid ? `${e.paybackVsGrid} лет (vs сеть, динамич.)` : e.paybackVsDiesel ? `${e.paybackVsDiesel} лет (vs дизель)` : "не определена (нет базового источника)"],
  ]

  const groups: { key: SmetаRow["group"]; title: string; rows: SmetаRow[] }[] = [
    { key: "equipment", title: GROUP_TITLES.equipment, rows: result.smeta.filter((r) => r.group === "equipment") },
    { key: "mount", title: GROUP_TITLES.mount, rows: result.smeta.filter((r) => r.group === "mount") },
    { key: "works", title: GROUP_TITLES.works, rows: result.smeta.filter((r) => r.group === "works") },
  ]
  let pos = 0

  const docCode = `СЭС.${String(c.pnom).replace(".", ",")}КВТ.${input.regionCode.toUpperCase()}-СМ`

  return (
    <div ref={ref} className="gost-sheet" lang="ru">
      {/* Рамка листа (поля: слева 20 мм, остальные 5 мм) */}
      <div className="gost-frame" aria-hidden="true" />
      <div className="gost-corner" aria-hidden="true">А4</div>

      <div className="gost-body">
        {/* Шапка документа */}
        <div className="gost-head">
          <div className="flex items-start justify-between text-[8px] leading-snug">
            <div>
              alt-energo.ru · инженерный калькулятор СЭС
              <br />
              документ расчётный, формируется в браузере
            </div>
            <div className="text-right">
              {docCode}
              <br />
              Экз. № 1 · {today}
            </div>
          </div>
          <h1 className="mt-3 text-center text-[15px] font-bold uppercase tracking-[0.09em]">
            Смета на комплект солнечной электростанции
          </h1>
          <p className="mt-1 text-center text-[10.5px]">
            мощностью {String(c.pnom).replace(".", ",")} кВт · {region.name} · {OBJ_LABEL[input.objectType] ?? input.objectType}
          </p>
          <p className="mt-1 text-center text-[8.5px] text-[#444]">
            диапазоны цен «от–до» · цены справочника от {priceDate} · {result.smeta.length} позиций
          </p>
        </div>

        {/* Технические данные */}
        <table className="gost-tb gost-td">
          <thead>
            <tr>
              <th colSpan={2}>Технические данные расчёта</th>
            </tr>
          </thead>
          <tbody>
            {techRows.map(([k, v]) => (
              <tr key={k}>
                <td className="gost-k">{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Спецификация */}
        <table className="gost-tb gost-spec">
          <thead>
            <tr>
              <th className="w-[30px]">Поз.</th>
              <th>Наименование</th>
              <th className="w-[64px]">Кол.</th>
              <th className="w-[36px]">Ед.</th>
              <th className="w-[84px]">Сумма, ₽ (от)</th>
              <th className="w-[84px]">Сумма, ₽ (до)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GostGroup key={g.key} title={g.title} rows={g.rows} onRow={() => ++pos} />
            ))}
            <tr className="gost-total">
              <td colSpan={4}>Итого по смете «под ключ»</td>
              <td className="text-right">{nbsp(t.totalFrom)}</td>
              <td className="text-right">{nbsp(t.totalTo)}</td>
            </tr>
          </tbody>
        </table>

        {/* Примечания */}
        <div className="gost-notes">
          <p className="gost-notes-title">Примечания</p>
          <ol>
            <li>
              Цены — диапазоны каталога поставщиков; индексация два раза в месяц, справочная дата актуальности — {priceDate}.
              {result.priceStaleDays > 14 && " Цены справочника не обновлялись более 14 дней — до заключения договора запросите актуальный прайс."}
            </li>
            <li>
              Монтаж: {t.mountHours} нормо-часов × ставка {region.federalOkrug}
              {t.minCalloutApplied ? " (применён минимальный выезд бригады)" : ""}. Снеговой район {c.snowRegion}, ветровой {c.windRegion} по СП 20.13330.2016.
            </li>
            <li>Расчёт — предварительная оценка. Смета не является публичной офертой; точная стоимость — после аудита объекта инженером.</li>
            <li>Расчёт выполнен на устройстве пользователя, персональные данные не передаются (152-ФЗ).</li>
          </ol>
        </div>
      </div>

      {/* Основная надпись (штамп) — форма 1 ГОСТ 2.104, 185×55 мм */}
      <div className="gost-stamp">
        <div className="gost-stamp-left">
          <div className="gost-izm">
            <span>Изм.</span>
            <span>Лист</span>
            <span>№ докум.</span>
            <span>Подп.</span>
            <span>Дата</span>
          </div>
          <div className="gost-izm-rows">
            <div><span /><span /><span /><span /><span /></div>
            <div><span /><span /><span /><span /><span /></div>
          </div>
        </div>
        <div className="gost-stamp-right">
          <div className="gost-sign-rows">
            {[
              ["Разраб.", "Калькулятор СЭС", today],
              ["Пров.", "инженер — по заявке", "—"],
              ["Н.контр.", "—", "—"],
            ].map(([role, name, date]) => (
              <div key={role} className="gost-sign-row">
                <span className="gost-role">{role}</span>
                <span className="gost-fio">{name}</span>
                <span className="gost-sign" />
                <span className="gost-date">{date}</span>
              </div>
            ))}
          </div>
          <div className="gost-name">
            <p className="gost-name-main">Смета на комплект СЭС {String(c.pnom).replace(".", ",")} кВт</p>
            <p className="gost-name-sub">{region.name} · {MODE_LABEL[input.mode] ?? input.mode}</p>
          </div>
          <div className="gost-meta">
            <span><b>Лит.</b></span>
            <span><b>Масса</b></span>
            <span><b>Масштаб</b> б/м</span>
            <span><b>Лист</b> 1</span>
            <span><b>Листов</b> 1</span>
          </div>
          <div className="gost-org">
            alt-energo.ru · инженерный калькулятор альтернативной энергетики
          </div>
        </div>
      </div>
    </div>
  )
}

function GostGroup({ title, rows, onRow }: { title: string; rows: SmetаRow[]; onRow: () => number }) {
  if (rows.length === 0) return null
  const from = rows.reduce((s, r) => s + r.sumFrom, 0)
  const to = rows.reduce((s, r) => s + r.sumTo, 0)
  return (
    <>
      <tr className="gost-group">
        <td colSpan={4}>{title}</td>
        <td className="text-right">{nbsp(from)}</td>
        <td className="text-right">{nbsp(to)}</td>
      </tr>
      {rows.map((r) => (
        <tr key={r.name}>
          <td className="text-center">{onRow()}</td>
          <td>
            <b>{r.name}</b>
            {r.spec ? <span className="gost-note"> — {r.spec}</span> : null}
            {r.note ? <span className="gost-note"> ({r.note})</span> : null}
          </td>
          <td className="text-center">{r.qty}</td>
          <td className="text-center">{r.unit}</td>
          <td className="text-right">{nbsp(r.sumFrom)}</td>
          <td className="text-right">{nbsp(r.sumTo)}</td>
        </tr>
      ))}
    </>
  )
}
