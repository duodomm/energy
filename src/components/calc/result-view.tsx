"use client"

// Результат расчёта (ТЗ 4.3): компоновка, смета «от–до» с индикатором актуальности,
// энергетика (графики), экономика (LCOE, окупаемость, сравнение), CTA.

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  LineChart, Line, ReferenceLine, CartesianGrid, Area, AreaChart,
} from "recharts"
import {
  Sun, BatteryCharging, Zap, Fuel, MountainSnow, FileDown, Mail, Phone,
  AlertTriangle, Info, CheckCircle2, TrendingUp, ShieldAlert, Wrench,
  LayoutGrid, Share2, CalendarClock, Gauge,
} from "lucide-react"
import type { CalcResult, RefBundle, SmetаRow } from "@/lib/calc/types"
import { formatRub, formatKwh } from "@/lib/calc/ref-bundle"
import { MONTH_LABELS } from "@/lib/calc/constants"
import { LeadForm } from "@/components/lead/lead-form"
import { AdSlot } from "@/components/common/ad-slot"
import { trackGoal } from "@/lib/analytics"
import { MONTH_RU } from "@/lib/calc/months"

const nbsp = (v: number) => Math.round(v).toLocaleString("ru-RU")

export function ResultView({ result, bundle }: { result: CalcResult; bundle: RefBundle }) {
  const { composition: c, smetaTotals: t, economy: e, months } = result
  const region = result.region

  const chartData = useMemo(
    () => months.map((m) => ({
      m: MONTH_LABELS[m.month - 1],
      Генерация: m.generation,
      Потребление: m.load,
    })),
    [months],
  )
  const cumData = e.paybackDynamicYears.map((p) => ({ year: p.year, cum: p.cumCash / 1000 }))

  const smetaGroups: { key: SmetаRow["group"]; title: string; rows: SmetаRow[] }[] = [
    { key: "equipment", title: "Оборудование и материалы", rows: result.smeta.filter((r) => r.group === "equipment") },
    { key: "mount", title: "Монтаж (нормо-часы)", rows: result.smeta.filter((r) => r.group === "mount") },
    { key: "works", title: "Проект и ПНР", rows: result.smeta.filter((r) => r.group === "works") },
  ]

  const priceDate = new Date(bundle.priceUpdatedAt).toLocaleDateString("ru-RU")

  const printPdf = () => {
    trackGoal("pdf_download")
    window.print()
  }

  const mailSummary = () => {
    const subject = encodeURIComponent(`Смета: ${c.pnom} кВт, ${region.name}`)
    const body = encodeURIComponent(
      `Смета (предварительная):\nМощность: ${c.pnom} кВт (${c.panelCount}×${c.panelW} Вт)\nИнвертор: ${c.inverterKw} кВт\nАКБ: ${c.batteryKwh ? `${c.batteryKwh} кВт·ч ${c.batteryTech}` : "нет"}\nCAPEX: ${formatRub(e.capexFrom)} — ${formatRub(e.capexTo)}\nГенерация: ${formatKwh(result.annualGeneration)}/год\nLCOE: ${e.lcoe} ₽/кВт·ч (номинальный ${e.lcoeNominal})\nОкупаемость: ${e.paybackVsGrid ?? e.paybackVsDiesel ?? "—"} лет\n\nАктуальность цен: ${priceDate}`,
    )
    window.location.href = `mailto:info@alt-energo.ru?subject=${subject}&body=${body}`
  }

  return (
    <div className="space-y-8">
      {/* ===== Шапка результата: тёмная «сцена»-пульт (канон С10) ===== */}
      <div className="scene rounded-2xl border border-scene-border p-5 shadow-[0_24px_60px_-30px_rgba(31,37,45,0.45)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-scene-amber">Предварительная смета</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-scene-foreground md:text-3xl">
              СЭС {c.pnom} кВт · {region.name}
            </h1>
            <p className="mt-2 text-sm text-scene-muted">
              {c.panelCount} панелей × {c.panelW} Вт · инвертор {c.inverterKw} кВт ·{" "}
              {c.batteryKwh ? `АКБ ${c.batteryKwh} кВт·ч (${c.batteryTech})` : "без АКБ"}
              {c.generatorKw ? ` · генератор ${c.generatorKw} кВт` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-scene-muted">Инвестиции «от–до»</p>
            <p className="text-2xl font-bold md:text-3xl">
              <span className="text-gradient-solar">{formatRub(e.capexFrom)}</span>
              <span className="mx-1.5 text-scene-muted">—</span>
              <span>{formatRub(e.capexTo)}</span>
            </p>
            <p className="mt-1 text-xs text-scene-muted">
              цены справочника от {priceDate}
              {result.priceStaleDays > 14 && (
                <Badge variant="destructive" className="ml-2 h-5 gap-1 text-[10px]">
                  <ShieldAlert className="h-3 w-3" /> цены могли измениться
                </Badge>
              )}
            </p>
          </div>
        </div>

        <Separator className="my-5 bg-scene-border" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat onScene icon={<Sun className="h-4 w-4" />} label="Генерация/год" value={formatKwh(result.annualGeneration)} />
          <MiniStat onScene icon={<Gauge className="h-4 w-4" />} label="Самопокрытие" value={`${Math.round(result.selfSufficiency * 100)}%`} />
          <MiniStat onScene icon={<Zap className="h-4 w-4" />} label="LCOE (25 лет)" value={`${e.lcoeNominal}–${e.lcoe} ₽`} sub="номинал–дисконт" />
          <MiniStat
            onScene
            icon={<TrendingUp className="h-4 w-4" />}
            label="Окупаемость"
            value={e.paybackVsGrid ? `${e.paybackVsGrid} лет` : e.paybackVsDiesel ? `${e.paybackVsDiesel} лет` : "—"}
            sub={e.paybackVsGrid ? "vs сеть" : e.paybackVsDiesel ? "vs дизель" : undefined}
          />
        </div>
      </div>

      {/* ===== Предупреждения ===== */}
      {result.warnings.length > 0 && (
        <div className="space-y-2.5">
          {result.warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${
                w.level === "alert"
                  ? "border-destructive/40 bg-destructive/10"
                  : w.level === "warning"
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-secondary/40"
              }`}
              role="status"
            >
              {w.level === "alert" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> :
               w.level === "warning" ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> :
               <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
              <span>
                {w.text}{" "}
                {w.link && <a href={w.link.href} className="text-primary underline underline-offset-2">{w.link.label}</a>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ===== Компоновка системы ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutGrid className="h-5 w-5 text-primary" /> Компоновка системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CompRow icon={<Sun className="h-4 w-4" />} label="Панели" value={`${c.panelCount} × ${c.panelW} Вт = ${c.pnom} кВт`} note={`${result.input.panelClass === "bifacial" ? "бифациальные" : "моно"}; ${result.input.installType === "ground" ? "наземный каркас" : result.input.installType === "roof_flat" ? "плоская кровля (балласт)" : result.input.installType === "facade" ? "фасад" : "наклонная кровля"}`} />
            <CompRow icon={<Zap className="h-4 w-4" />} label="Инвертор" value={`${c.inverterKw} кВт${result.input.voltage === "380" ? " · 3ф" : " · 1ф"}`} note={result.input.mode === "grid" ? "сетевой (струнный)" : result.input.mode === "hybrid" ? "гибридный" : "автономный"} />
            {c.batteryKwh > 0 && (
              <CompRow icon={<BatteryCharging className="h-4 w-4" />} label="АКБ" value={`${c.batteryKwh} кВт·ч`} note={`${c.batteryTech}; автономия ${result.autonomy ? result.autonomy.hours : "—"} ч`} />
            )}
            {c.generatorKw && (
              <CompRow icon={<Fuel className="h-4 w-4" />} label="Генератор" value={`${c.generatorKw} кВт`} note={`${c.generatorType}; ${c.hasAvr ? "с АВР" : ""}`} />
            )}
            <CompRow icon={<Wrench className="h-4 w-4" />} label="Крепления" value={`${result.input.installType === "ground" ? "наземный каркас" : "кровельные"}${c.reinforced ? " + усиление" : ""}`} note={`снеговой р-н ${c.snowRegion}, ветровой ${c.windRegion} (СП 20.13330)`} />
            <CompRow icon={<MountainSnow className="h-4 w-4" />} label="Электрика" value={`${result.input.switchboard ? "щитовая + " : ""}заземление, УЗИП`} note={`кабель ${result.input.cableM} м × 2`} />
          </div>
        </CardContent>
      </Card>

      {/* ===== Энергетика ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sun className="h-5 w-5 text-primary" /> Энергетика по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* График выработки — тёмная «сцена» (С10): данные живут на тёмном */}
          <div className="scene rounded-2xl border border-scene-border p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="m" stroke="#a8adb5" fontSize={11} tickLine={false} axisLine={{ stroke: "#39424e" }} />
                <YAxis stroke="#a8adb5" fontSize={11} tickLine={false} axisLine={{ stroke: "#39424e" }} width={60} tickFormatter={(v: number) => `${v >= 1000 ? `${Math.round(v / 1000)}к` : v}`} />
                <RTooltip
                  cursor={{ fill: "rgba(255,176,32,0.08)" }}
                  contentStyle={{ background: "#262e38", border: "1px solid #39424e", borderRadius: 12, fontSize: 12, color: "#f2efe7" }}
                  formatter={(v: number, name: string) => [`${nbsp(v)} кВт·ч`, name]}
                />
                <Bar dataKey="Потребление" fill="#4a5563" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Генерация" fill="url(#gradSolar)" radius={[3, 3, 0, 0]} />
                <defs>
                  <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb020" />
                    <stop offset="100%" stopColor="#e8760a" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <MiniStat label="Нагрузка/год" value={formatKwh(result.annualLoad)} />
            <MiniStat label="Худший месяц" value={`${MONTH_RU[months.reduce((w, m, i) => (m.generation < months[w].generation ? i : w), 0)]} · ${nbsp(months.reduce((w, m) => Math.min(w, m.generation), Infinity))} кВт·ч`} />
            {result.autonomy && <MiniStat icon={<BatteryCharging className="h-4 w-4" />} label="Автономия АКБ" value={`${result.autonomy.hours} ч`} sub={`≈${result.autonomy.daysWinter} сут нагрузки`} />}
            {e.microgenSurplus != null && <MiniStat icon={<Share2 className="h-4 w-4" />} label="Излишки/год" value={formatKwh(e.microgenSurplus)} sub="можно продать (≤15 кВт)" />}
          </div>

          {/* Баланс автономии: три варианта (ТЗ 4.2 п.2) */}
          {result.winterAdvice && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="h-4 w-4 text-primary" /> Баланс автономии по худшему месяцу
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Дефицит в худший месяц. Три пути:
              </p>
              <ul className="mt-2.5 grid gap-2.5 text-sm md:grid-cols-3">
                <li className="rounded-lg bg-card p-3">
                  <b className="text-primary">а)</b> +{result.winterAdvice.addPanelsKw} кВт панелей
                  <span className="block text-xs text-muted-foreground">+{formatRub(result.winterAdvice.addPanelsCostFrom)} — {formatRub(result.winterAdvice.addPanelsCostTo)}</span>
                </li>
                <li className="rounded-lg bg-card p-3">
                  <b className="text-primary">б)</b> генератор {result.winterAdvice.needGenKw} кВт
                  <span className="block text-xs text-muted-foreground">резерв на ненастье + дозаряд АКБ</span>
                </li>
                <li className="rounded-lg bg-card p-3">
                  <b className="text-primary">в)</b> снизить нагрузку
                  <span className="block text-xs text-muted-foreground">LED, насос с частотником, режим экономии зимой</span>
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Смета ===== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileDown className="h-5 w-5 text-primary" /> Смета «от–до»
            </CardTitle>
            {result.priceStaleDays > 14 ? (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Цены могли измениться — запросите актуальную смету
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-stable" /> Цены актуальны ({priceDate})
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Спецификация</th>
                  <th>Кол-во</th>
                  <th className="text-right">От, ₽</th>
                  <th className="text-right">До, ₽</th>
                </tr>
              </thead>
              <tbody>
                {smetaGroups.map((g) => (
                  <SmetaGroup key={g.key} title={g.title} rows={g.rows} />
                ))}
                <tr className="border-t-2 border-border bg-secondary/30 font-semibold">
                  <td data-label="Позиция"><span className="text-gradient-solar">Итого под ключ</span></td>
                  <td data-label="Спецификация" />
                  <td data-label="Кол-во" />
                  <td data-label="От" className="text-right tabular-nums">{nbsp(t.totalFrom)}</td>
                  <td data-label="До" className="text-right tabular-nums">{nbsp(t.totalTo)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Монтаж: {t.mountHours} нормо-часов × ставка округа{t.minCalloutApplied ? " (применён минимальный выезд бригады)" : ""}.
            Диапазоны каталога обновляются раз в 2 недели; при устаревании более 14 дней — предупреждение.
            Результат предварительный: точная смета — после аудита объекта инженером.
          </p>
        </CardContent>
      </Card>

      {/* ===== Экономика ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" /> Экономика
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Сравнение источников */}
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr>
                  <th>Источник</th>
                  <th className="text-right">₽/кВт·ч</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {e.compareKwh.map((row) => (
                  <tr key={row.source}>
                    <td data-label="Источник">{row.source}</td>
                    <td data-label="Цена" className="text-right font-semibold tabular-nums">{row.price}</td>
                    <td data-label="Комментарий" className="text-xs text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {e.nightVsBattery && (
            <p className="rounded-xl border border-stable/30 bg-stable-soft p-4 text-sm leading-relaxed">
              <b className="text-stable">Двухтарифный арбитраж:</b> зарядка АКБ от сети ночью обходится
              в {e.nightVsBattery.nightCost} ₽/кВт·ч с учётом потерь — {e.nightVsBattery.chargeFromGridBeneficial ? "дешевле дневного тарифа, гибриду выгодно дозаряжаться ночью в облачные недели" : "дороже дневного — ориентируйтесь на солнце"}.
            </p>
          )}

          {/* KPI */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="CAPEX (средняя)" value={formatRub((e.capexFrom + e.capexTo) / 2)} />
            <MiniStat label="OPEX/год" value={formatRub(e.opexYear)} sub="0,75% CAPEX" />
            <MiniStat label="Экономия/год (vs сеть)" value={e.annualSavings ? formatRub(e.annualSavings) : "—"} sub={e.paybackVsGrid ? `статически ${e.paybackVsGridStatic} лет` : undefined} />
            {e.microgenRevenue != null && <MiniStat icon={<Share2 className="h-4 w-4" />} label="Выкуп излишков" value={`~${formatRub(e.microgenRevenue)}/год`} sub="микрогенерация ≤15 кВт" />}
          </div>

          {/* Накопленная экономия */}
          {cumData.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Накопленная экономия за {cumData.length} лет (динамика, рост тарифа 8%/год)</p>
              <div className="scene rounded-2xl border border-scene-border p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumData}>
                    <defs>
                      <linearGradient id="gradCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4a8" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2dd4a8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#39424e" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#a8adb5" fontSize={11} tickLine={false} axisLine={{ stroke: "#39424e" }} tickFormatter={(v: number) => `${v}г`} />
                    <YAxis stroke="#a8adb5" fontSize={11} tickLine={false} axisLine={{ stroke: "#39424e" }} width={64} tickFormatter={(v: number) => `${v}кк`} />
                    <RTooltip
                      contentStyle={{ background: "#262e38", border: "1px solid #39424e", borderRadius: 12, fontSize: 12, color: "#f2efe7" }}
                      formatter={(v: number) => [`${v.toFixed(0)} тыс. ₽ (накопленно)`, "Кэшфлоу"]}
                    />
                    <ReferenceLine y={0} stroke="#ff6b6b" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="cum" stroke="#2dd4a8" strokeWidth={2} fill="url(#gradCum)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Точка пересечения нуля — динамическая окупаемость ({e.paybackVsGrid ? `vs сеть: ${e.paybackVsGrid} лет` : ""}{e.paybackVsDiesel ? ` vs дизель: ${e.paybackVsDiesel} лет` : ""}).
                Синяя зона — чистый плюс; после окупаемости станция «зарабатывает» разницу тарифов.
              </p>
            </div>
          )}

          {e.paybackVsGrid && e.paybackVsGrid > 20 && (
            <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
              Окупаемость больше 20 лет — честно: при вашем тарифе экономика паритетная.
              Покупку обычно двигают независимость от отключений, рост тарифов впереди и резерв.
              Сильная экономика — у юрлиц, дизельных зон и объектов без сети:{" "}
              <a href="#/kejsy" className="text-primary underline underline-offset-2">смотрите кейсы</a>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== CTA блок ===== */}
      <div className="card-premium border-gradient-solar p-5 md:p-7">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Получить точную смету инженером</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Инженер проверит расчёт под ваш объект, уточнит цены у поставщиков вашего региона
              и пришлёт PDF-смету с позициями «от–до» и графиком работ. 24 часа, без спама.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 no-print">
              <Button onClick={printPdf} variant="outline">
                <FileDown className="mr-1.5 h-4 w-4" /> Скачать смету PDF
              </Button>
              <Button onClick={mailSummary} variant="outline">
                <Mail className="mr-1.5 h-4 w-4" /> Отправить на e-mail
              </Button>
              <a href="tel:+74951234567">
                <Button variant="outline">
                  <Phone className="mr-1.5 h-4 w-4" /> +7 (495) 123-45-67
                </Button>
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              PDF генерируется в браузере (печать страницы) — кириллица в штатных шрифтах,
              содержит дату актуальности цен{result.priceStaleDays > 14 ? " и предупреждение о возможном изменении" : ""}.
            </p>
          </div>
          <div>
            <LeadForm
              formId="calc_result"
              compact
              submitLabel="Проверить расчёт и получить PDF"
              objectType={result.input.objectType}
              region={result.input.regionCode}
              scenario={result.input.mode}
              capexFrom={e.capexFrom}
              capexTo={e.capexTo}
              notePrefix={`Результат: ${c.pnom} кВт, ${region.name}, CAPEX ${nbsp(e.capexFrom)}–${nbsp(e.capexTo)}`}
            />
          </div>
        </div>
      </div>

      {/* РСЯ-контейнер фиксированной высоты (CLS-защита) */}
      <AdSlot variant="banner" />
    </div>
  )
}

// ===== Вспомогательные =====

function MiniStat({ icon, label, value, sub, onScene }: { icon?: React.ReactNode; label: string; value: string; sub?: string; onScene?: boolean }) {
  return (
    <div
      className={
        onScene
          ? "rounded-xl border border-scene-border bg-scene-2/70 p-3.5"
          : "rounded-xl bg-secondary/40 p-3.5"
      }
    >
      <p
        className={
          onScene
            ? "flex items-center gap-1.5 text-xs text-scene-muted"
            : "flex items-center gap-1.5 text-xs text-muted-foreground"
        }
      >
        {icon}
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
      {sub && <p className={onScene ? "text-[11px] text-scene-muted" : "text-[11px] text-muted-foreground"}>{sub}</p>}
    </div>
  )
}

function CompRow({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {note && <p className="text-[11px] leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  )
}

function SmetaGroup({ title, rows }: { title: string; rows: SmetаRow[] }) {
  if (rows.length === 0) return null
  const from = rows.reduce((s, r) => s + r.sumFrom, 0)
  const to = rows.reduce((s, r) => s + r.sumTo, 0)
  return (
    <>
      <tr className="bg-secondary/20">
        <td data-label="Группа" colSpan={3} className="font-semibold text-muted-foreground">{title}</td>
        <td data-label="От" className="text-right text-sm font-semibold tabular-nums">{nbsp(from)}</td>
        <td data-label="До" className="text-right text-sm font-semibold tabular-nums">{nbsp(to)}</td>
      </tr>
      {rows.map((r) => (
        <tr key={r.name}>
          <td data-label="Позиция">
            <span className="font-medium">{r.name}</span>
            {r.note && <span className="block text-[11px] text-muted-foreground">{r.note}</span>}
          </td>
          <td data-label="Спец" className="text-xs text-muted-foreground">{r.spec}</td>
          <td data-label="Кол-во" className="text-xs tabular-nums">{r.qty} {r.unit}</td>
          <td data-label="От" className="text-right tabular-nums">{nbsp(r.sumFrom)}</td>
          <td data-label="До" className="text-right tabular-nums">{nbsp(r.sumTo)}</td>
        </tr>
      ))}
    </>
  )
}
