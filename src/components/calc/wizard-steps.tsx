"use client"

// Шаги 1–5 профессионального калькулятора (ТЗ 4.1) с tooltip-ами
// «почему это влияет на цену» (ТЗ 8.2)

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import {
  Home, Warehouse, Tractor, Factory, Building2, Trees, Store,
  Sun, Share2, BatteryCharging, Power, MapPin, Info, Zap, Fuel,
  MountainSnow, Wind, Cable, PanelTopOpen, PanelBottom, LayoutGrid,
  Snowflake, Flame, BatteryWarning, CalendarClock, Users, Wrench,
} from "lucide-react"
import type { CalcInput, ObjectType, RefBundle, RefRegion, SystemMode, InstallType, Orientation, Shading, BatteryTech, GeneratorType, PanelClass, Voltage, TariffPlan, ConsumerType } from "@/lib/calc/types"
import { objectLabel, summarize, LoadBuilder } from "./load-builder"
import { SunPathCard } from "./sun-path"
import { BatteryGauge } from "@/components/common/battery-gauge"
import { cn } from "@/lib/utils"

// ===== Общие элементы =====

export function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Шаг {n} из 6</p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      {hint && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Почему это влияет на цену" className="text-muted-foreground/70 transition-colors hover:text-primary">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72 border-border bg-popover text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

const inputCls = "h-11"

// ===== ШАГ 1: Объект и режим =====

const OBJECTS: { key: ObjectType; label: string; icon: typeof Home }[] = [
  { key: "dacha", label: "Дача", icon: Home },
  { key: "house", label: "Частный дом", icon: Trees },
  { key: "snt", label: "СНТ-быт", icon: Store },
  { key: "warehouse", label: "Склад", icon: Warehouse },
  { key: "farm", label: "Сельхоз", icon: Tractor },
  { key: "industry", label: "Производство", icon: Factory },
  { key: "commercial", label: "Коммерч. здание", icon: Building2 },
]

const MODES: { key: SystemMode; label: string; desc: string; icon: typeof Sun }[] = [
  { key: "grid", label: "Сетевая", desc: "микрогенерация ≤15 кВт / подмена сети", icon: Share2 },
  { key: "hybrid", label: "Гибридная", desc: "сеть + АКБ, резерв отключений", icon: BatteryCharging },
  { key: "autonomous", label: "Автономная", desc: "без сети, только солнце", icon: Sun },
  { key: "autonomous_gen", label: "Автономная с генератором", desc: "солнце + АКБ + дизель/газ", icon: Power },
]

export function StepObject({
  input, set, bundle,
}: {
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
  bundle: RefBundle
}) {
  const region = bundle.regions.find((r) => r.code === input.regionCode) ?? bundle.regions[0]
  const pshAvg = (region.psh.reduce((a, b) => a + b, 0) / 12).toFixed(2)

  return (
    <TooltipProvider>
      <StepHeader
        n={1}
        title="Объект и режим работы"
        hint="Тип объекта задаёт пресет нагрузки, регион подставляет PSH (пик-солнце-часы), тариф, снеговой/ветровой район и коэффициент монтажа."
      />

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Тип объекта
        <FieldTooltip text="Пресет нагрузки подставляется в шаге 2 (конструктор приборов). Склад и цех — тариф юрлица по умолчанию." />
      </Label>
      <div className="mb-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {OBJECTS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => set({ objectType: o.key, consumerType: o.key === "warehouse" || o.key === "industry" || o.key === "farm" || o.key === "commercial" ? "business" : "household" })}
            className={cn(
              "chip flex-col items-start gap-2 p-4 text-left",
              input.objectType === o.key && "chip-active",
            )}
            aria-pressed={input.objectType === o.key}
          >
            <o.icon className={cn("h-6 w-6", input.objectType === o.key ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium leading-tight">{o.label}</span>
          </button>
        ))}
      </div>

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Режим работы системы
        <FieldTooltip text="Сетевой режим до 15 кВт — можно оформить микрогенерацию и продавать излишки. Гибридный дороже за счёт АКБ, но переживает отключения. Автономный считается по худшему месяцу." />
      </Label>
      <div className="mb-7 grid gap-2.5 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => set({
              mode: m.key,
              generator: m.key === "autonomous_gen" ? "diesel" : input.generator,
            })}
            className={cn("chip justify-start gap-3", input.mode === m.key && "chip-active")}
            aria-pressed={input.mode === m.key}
          >
            <m.icon className={cn("h-5 w-5 shrink-0", input.mode === m.key ? "text-primary" : "text-muted-foreground")} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Регион
            <FieldTooltip text="Регион задаёт: PSH (генерация), тарифы (окупаемость), снеговой/ветровой район СП 20.13330 (крепления), ставку монтажа и цены топлива." />
          </Label>
          <Select value={input.regionCode} onValueChange={(v) => set({ regionCode: v })}>
            <SelectTrigger className={cn(inputCls, "w-full")}>
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Выберите регион" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {bundle.regions.map((r) => (
                <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <RegionInfoCard region={region} pshAvg={pshAvg} />
      </div>
    </TooltipProvider>
  )
}

export function RegionInfoCard({ region, pshAvg }: { region: RefRegion; pshAvg: string }) {
  return (
    <div className="card-premium flex flex-col justify-center gap-1.5 p-4 text-sm">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sun className="h-3.5 w-3.5 text-primary" />
        {region.federalOkrug} · PSH в среднем {pshAvg} ч/сут
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>сеть {region.tariffFlat} ₽/кВт·ч</span>
        <span>день {region.tariffDay} / ночь {region.tariffNight}</span>
        <span className="flex items-center gap-1"><MountainSnow className="h-3 w-3" /> район {region.snowRegion}</span>
        <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> район {region.windRegion}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground/80">{region.climateNote}</p>
    </div>
  )
}

// ===== ШАГ 2: Электроснабжение =====

export function StepPower({
  input, set, appliances, setAppliances,
}: {
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
  appliances: CalcInput["appliances"]
  setAppliances: (a: CalcInput["appliances"]) => void
}) {
  const [useBuilder, setUseBuilder] = useState(Boolean(appliances?.length))
  const summary = appliances ? summarize(appliances, input.startK) : null

  return (
    <TooltipProvider>
      <StepHeader
        n={2}
        title="Электроснабжение"
        hint="Суточное потребление и пиковая мощность определяют тип и характеристики АКБ и инвертора. Тарифный план влияет на экономику гибрида: ночной тариф конкурирует с разрядом АКБ."
      />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-secondary/40 p-1">
        <button
          type="button"
          onClick={() => setUseBuilder(false)}
          className={cn("rounded-lg px-3.5 py-2 text-sm transition-colors", !useBuilder ? "bg-card text-foreground shadow" : "text-muted-foreground")}
        >
          Ввод вручную
        </button>
        <button
          type="button"
          onClick={() => setUseBuilder(true)}
          className={cn("rounded-lg px-3.5 py-2 text-sm transition-colors", useBuilder ? "bg-card text-foreground shadow" : "text-muted-foreground")}
        >
          Конструктор нагрузок
        </button>
      </div>

      {useBuilder && appliances ? (
        <div className="space-y-4">
          <LoadBuilderSlot appliances={appliances} setAppliances={setAppliances} input={input} set={set} />
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Суточное потребление, кВт·ч/сут
              <FieldTooltip text="Главный драйвер ёмкости АКБ: C = E_ночь / (DoD × КПД). Больше потребление — дороже батареи, панели пропорционально." />
            </Label>
            <Input
              type="number" min={0.5} max={50000} step={0.5}
              value={input.dailyKwh}
              onChange={(e) => set({ dailyKwh: Math.max(0.5, Number(e.target.value) || 0.5) })}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Пиковая мощность, кВт
              <FieldTooltip text="Определяет инвертор: P ≥ пик × 1,25 (гибрид) / × 1,3 (автономия). Пусковые токи насосов — 3–7×." />
            </Label>
            <Input
              type="number" min={0.5} max={2000} step={0.5}
              value={input.peakKw}
              onChange={(e) => set({ peakKw: Math.max(0.5, Number(e.target.value) || 0.5) })}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Напряжение
            <FieldTooltip text="380 В нужно при пиках > 10–12 кВт и трёхфазных нагрузках (станки). Инвертор 3ф дороже." />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(["220", "380"] as Voltage[]).map((v) => (
              <button key={v} type="button" onClick={() => set({ voltage: v })} className={cn("chip justify-center", input.voltage === v && "chip-active")}>
                {v} В{v === "380" ? " · 3ф" : " · 1ф"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Тарифный план объекта
            <FieldTooltip text="Двухтарифный: ночная зона 23:00–07:00 дешевле в 2–2,5 раза. Гибрид может заряжать АКБ ночью — калькулятор сравнит ночной тариф со «стоимостью разряда» АКБ." />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {([{ key: "flat", label: "Одноставочный" }, { key: "two", label: "День / ночь" }] as { key: TariffPlan; label: string }[]).map((t) => (
              <button key={t.key} type="button" onClick={() => set({ tariffPlan: t.key })} className={cn("chip justify-center", input.tariffPlan === t.key && "chip-active")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            Тип потребителя
            <FieldTooltip text="Тариф юрлица с передачей в 1,5–1,8 раза выше населения — солнце окупается быстрее. Микрогенерация доступна только физлицам." />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {([{ key: "household", label: "Физлицо" }, { key: "business", label: "Юрлицо/ИП" }] as { key: ConsumerType; label: string }[]).map((t) => (
              <button key={t.key} type="button" onClick={() => set({ consumerType: t.key })} className={cn("chip justify-center", input.consumerType === t.key && "chip-active")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Коэффициент пусковых токов
            <FieldTooltip text="Насосы/компрессоры 3–7×: инвертор должен держать бросок. Влияет на мощность и цену инвертора." />
          </Label>
          <div className="card-premium flex items-center gap-4 px-4 py-3">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            <Slider
              min={1} max={7} step={0.5}
              value={[input.startK]}
              onValueChange={([v]) => set({ startK: v })}
              className="flex-1"
              aria-label="Коэффициент пусковых токов"
            />
            <span className="w-10 text-right text-sm font-semibold">{input.startK}×</span>
          </div>
        </div>
      </div>

      {summary && (
        <p className="text-xs text-muted-foreground">
          Из конструктора: <b>{summary.dailyKwh} кВт·ч/сут</b>, пик <b>{summary.peakKw} кВт</b> —
          эти значения подставлены в расчёт автоматически.
        </p>
      )}
    </TooltipProvider>
  )
}

function LoadBuilderSlot({
  appliances, setAppliances, input, set,
}: {
  appliances: NonNullable<CalcInput["appliances"]>
  setAppliances: (a: CalcInput["appliances"]) => void
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
}) {
  // Синхронизация конструктора с полями расчётного ядра
  useEffect(() => {
    const s = summarize(appliances, input.startK)
    if (Math.abs(s.dailyKwh - input.dailyKwh) > 0.05 || Math.abs(s.peakKw - input.peakKw) > 0.05) {
      set({ dailyKwh: s.dailyKwh, peakKw: s.peakKw })
    }
  }, [appliances, input.startK])

  return (
    <div className="mb-6">
      <LoadBuilder objectType={input.objectType} appliances={appliances} onChange={setAppliances} startK={input.startK} />
    </div>
  )
}

// ===== ШАГ 3: Генерация =====

const INSTALLS: { key: InstallType; label: string; icon: typeof PanelTopOpen; k: string }[] = [
  { key: "roof_slope", label: "Наклонная кровля", icon: PanelTopOpen, k: "35–40°" },
  { key: "roof_flat", label: "Плоская кровля", icon: LayoutGrid, k: "балласт 10°" },
  { key: "ground", label: "Наземный каркас", icon: PanelBottom, k: "сваи 30–60°" },
  { key: "facade", label: "Фасад / навес", icon: PanelTopOpen, k: "90°/навес" },
]

const ORIENTS: { key: Orientation; label: string; k: number }[] = [
  { key: "south", label: "Юг", k: 1.0 },
  { key: "se", label: "ЮВ", k: 0.96 },
  { key: "sw", label: "ЮЗ", k: 0.96 },
  { key: "east", label: "Восток", k: 0.88 },
  { key: "west", label: "Запад", k: 0.88 },
]

const SHADES: { key: Shading; label: string; k: number }[] = [
  { key: "none", label: "Без затенения", k: 1.0 },
  { key: "partial", label: "Частичное", k: 0.9 },
  { key: "heavy", label: "Сильное", k: 0.82 },
]

const PANELS: { key: PanelClass; label: string; w: string }[] = [
  { key: "std", label: "Моно 550 Вт", w: "0,215 кВт/м²" },
  { key: "premium", label: "Моно 600 Вт", w: "0,23 кВт/м²" },
  { key: "bifacial", label: "Бифациальная", w: "0,22 кВт/м²" },
]

export function StepGeneration({
  input, set, bundle,
}: {
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
  bundle: RefBundle
}) {
  const region = bundle.regions.find((r) => r.code === input.regionCode) ?? bundle.regions[0]
  const approxPnom = input.powerMode === "area"
    ? (input.areaM2 ?? 30) * 0.22
    : (input.panelKw ?? 5)
  const overMicro = input.mode === "grid" && approxPnom > 15

  return (
    <TooltipProvider>
      <StepHeader
        n={3}
        title="Генерация: панели"
        hint="Мощность задаётся напрямую или через доступную площадь. Тип установки влияет на угол, выработку и стоимость креплений."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Задать мощность
            <FieldTooltip text="Из площади: Pnom = S × 0,21–0,23 кВт/м² по классу панелей. Округляем до целых панелей." />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set({ powerMode: "kw" })} className={cn("chip justify-center", input.powerMode === "kw" && "chip-active")}>кВт станции</button>
            <button type="button" onClick={() => set({ powerMode: "area" })} className={cn("chip justify-center", input.powerMode === "area" && "chip-active")}>м² площади</button>
          </div>
        </div>
        <div className="space-y-1.5">
          {input.powerMode === "area" ? (
            <>
              <Label className="flex items-center gap-1.5">Площадь под панели, м²</Label>
              <Input
                type="number" min={5} max={100000} step={5}
                value={input.areaM2 ?? 30}
                onChange={(e) => set({ areaM2: Math.max(5, Number(e.target.value) || 5) })}
                className={inputCls}
              />
            </>
          ) : (
            <>
              <Label className="flex items-center gap-1.5">Мощность станции, кВт</Label>
              <Input
                type="number" min={0.5} max={2000} step={0.5}
                value={input.panelKw ?? 5}
                onChange={(e) => set({ panelKw: Math.max(0.5, Number(e.target.value) || 0.5) })}
                className={inputCls}
              />
            </>
          )}
        </div>
      </div>

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Класс панелей
        <FieldTooltip text="Бифациальные +5–15% выработки на светлых поверхностях и снегу. Премиум плотнее на м² — меньше места под ту же мощность." />
      </Label>
      <div className="mb-7 grid gap-2.5 sm:grid-cols-3">
        {PANELS.map((p) => (
          <button key={p.key} type="button" onClick={() => set({ panelClass: p.key })} className={cn("chip flex-col items-start gap-1 p-4", input.panelClass === p.key && "chip-active")}>
            <span className="text-sm font-medium">{p.label}</span>
            <span className="text-xs text-muted-foreground">{p.w}</span>
          </button>
        ))}
      </div>

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Тип установки
        <FieldTooltip text="Наземный каркас — дешевле обслуживание и снег скатывается; плоская кровля — балласт по ветровому району; фасад — дороже и меньше выработка." />
      </Label>
      <div className="mb-7 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {INSTALLS.map((t) => (
          <button key={t.key} type="button" onClick={() => set({ installType: t.key })} className={cn("chip flex-col items-start gap-2 p-4", input.installType === t.key && "chip-active")}>
            <t.icon className={cn("h-6 w-6", input.installType === t.key ? "text-primary" : "text-muted-foreground")} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.k}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Ориентация
            <FieldTooltip text="Юг — максимум годовой выработки. Восток/запад смещают пик на утро/вечер: иногда выгоднее совпадение с нагрузкой. Ниже — дуга солнца региона: янтарная часть показывает, какие часы вы «ловите» панелями." />
          </Label>
          <div className="flex flex-wrap gap-2">
            {ORIENTS.map((o) => (
              <button key={o.key} type="button" onClick={() => set({ orientation: o.key })} className={cn("chip px-3", input.orientation === o.key && "chip-active")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Затенение
            <FieldTooltip text="Трубы, деревья, соседние дома. Частичное — минус 10% генерации, сильное — 18%: оптимизаторы на затенённые стринги частично спасают." />
          </Label>
          <div className="flex flex-wrap gap-2">
            {SHADES.map((s) => (
              <button key={s.key} type="button" onClick={() => set({ shading: s.key })} className={cn("chip px-3", input.shading === s.key && "chip-active")}>
                {s.label} <span className="text-xs text-muted-foreground">×{s.k}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* №6: солнечный путь региона — реагирует на ориентацию и тип монтажа */}
      <div className="mb-7">
        <SunPathCard region={region} orientation={input.orientation} installType={input.installType} />
      </div>

      {overMicro && (
        <div className="card-premium border-primary/40 bg-primary/5 p-4">
          <p className="flex items-start gap-3 text-sm leading-relaxed">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              <b>Внимание: режим микрогенерации неприменим.</b> Упрощённая продажа излишков действует
              до 15 кВт (ФЗ-471). Для {approxPnom.toFixed(1)} кВт потребуется иной порядок взаимодействия
              с сетевой организацией.{" "}
              <a href="#/teo" className="text-primary underline underline-offset-2">Подробнее в разделе «Экономика»</a> или
              рассмотрите гибридную схему с накопителем.
            </span>
          </p>
        </div>
      )}
    </TooltipProvider>
  )
}

// ===== ШАГ 4: Накопление =====

const AUTONOMY = [0, 4, 8, 12, 24, 48, 72]
const BATTERIES: { key: BatteryTech; label: string; dod: string; cycles: string }[] = [
  { key: "lifepo4", label: "LiFePO4", dod: "DoD 90%", cycles: "6000+ циклов" },
  { key: "nmc", label: "Li-ion NMC", dod: "DoD 80%", cycles: "3000 циклов" },
  { key: "agm", label: "AGM", dod: "DoD 50%", cycles: "600 циклов" },
  { key: "vrfb", label: "VRFB", dod: "DoD 100%", cycles: "15000+ циклов" },
]
const GENERATORS: { key: GeneratorType; label: string; icon: typeof Fuel }[] = [
  { key: "none", label: "Без генератора", icon: BatteryWarning },
  { key: "diesel", label: "Дизельный", icon: Fuel },
  { key: "gas", label: "Газовый", icon: Flame },
]

export function StepStorage({
  input, set, bundle,
}: {
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
  bundle: RefBundle
}) {
  const region = bundle.regions.find((r) => r.code === input.regionCode) ?? bundle.regions[0]

  return (
    <TooltipProvider>
      <StepHeader
        n={4}
        title="Накопление и резерв"
        hint="Ёмкость АКБ считается по автономии: C = E / (DoD × КПД). Технология задаёт глубину разряда, КПД и срок жизни."
      />

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Требуемая автономия
        <FieldTooltip text="Часы без солнца/сети, которые должна закрыть батарея. Для автономных систем дополнительно проверяется баланс худшего месяца." />
      </Label>
      <div className="mb-2.5 flex flex-wrap gap-2">
        {AUTONOMY.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => set({ autonomyHours: h, batteryTech: h === 0 ? "none" : input.batteryTech === "none" ? "lifepo4" : input.batteryTech })}
            className={cn("chip px-3.5", input.autonomyHours === h && "chip-active")}
          >
            {h === 0 ? "Без АКБ" : `${h} ч`}
          </button>
        ))}
      </div>
      <label className="mb-4 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={input.winterBalance}
          onChange={(e) => set({ winterBalance: e.target.checked })}
          className="h-4 w-4 accent-[#e8940a]"
        />
        <span className="flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Проверить баланс по минимальному зимнему месяцу
        </span>
      </label>

      {/* №9 «Приборная панель»: неоморфный прибор АКБ — живая ёмкость из ядра */}
      <BatteryGauge
        input={input}
        bundle={bundle}
        onChangeHours={(h) => set({ autonomyHours: h, batteryTech: h === 0 ? "none" : input.batteryTech === "none" ? "lifepo4" : input.batteryTech })}
      />

      {input.autonomyHours > 0 && (
        <div className="mt-7">
          <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
            Технология АКБ
            <FieldTooltip text="LiFePO4 — выбор по умолчанию: не горит, 6000+ циклов. AGM дешевле на малых ёмкостях, но DoD 50%. VRFB — промышленные 30+ кВт·ч под заказ." />
          </Label>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {BATTERIES.map((b) => (
              <button key={b.key} type="button" onClick={() => set({ batteryTech: b.key })} className={cn("chip flex-col items-start gap-1.5 p-4", input.batteryTech === b.key && "chip-active")}>
                <BatteryCharging className={cn("h-6 w-6", input.batteryTech === b.key ? "text-primary" : "text-muted-foreground")} />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="text-[11px] text-muted-foreground">{b.dod}</span>
                  <span className="text-[11px] text-muted-foreground">{b.cycles}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Label className="mb-2.5 flex items-center gap-1.5 text-sm">
        Резервный генератор
        <FieldTooltip text="P_ген ≥ max(критическая нагрузка × 1,2; заряд АКБ + база). Дизель 0,27 л/кВт·ч, газ 0,32 м³/кВт·ч — расход пойдёт в экономику." />
      </Label>
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        {GENERATORS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => set({
              generator: g.key,
              mode: g.key !== "none" && input.mode === "autonomous" ? "autonomous_gen" : input.mode,
            })}
            className={cn("chip flex-col items-start gap-2 p-4", input.generator === g.key && "chip-active")}
          >
            <g.icon className={cn("h-6 w-6", input.generator === g.key ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium leading-tight">{g.label}</span>
          </button>
        ))}
      </div>

      {input.generator !== "none" && (
        <div className="card-premium max-w-md space-y-3 p-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Цена топлива, ₽/{input.generator === "diesel" ? "л" : "м³"}
              <FieldTooltip text="По умолчанию — региональная цена. Для СПГ/доставки дизеля на Севере — своя." />
            </Label>
            <Input
              type="number" min={1} max={500} step={0.5}
              value={input.genFuelPrice ?? (input.generator === "diesel" ? region.dieselPrice : region.gasPrice)}
              onChange={(e) => set({ genFuelPrice: Math.max(1, Number(e.target.value) || 1) })}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Регион: {input.generator === "diesel" ? `${region.dieselPrice} ₽/л дизтопливо` : `${region.gasPrice} ₽/м³ газ`}
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5 text-stable" />
            {input.generator === "diesel"
              ? "Расход ~0,27 л/кВт·ч + масло/фильтры каждые 250 м·ч, зимний прогрев."
              : "Расход ~0,32 м³/кВт·ч, ресурс 40–60 тыс. м·ч до капремонта."}
          </p>
        </div>
      )}
    </TooltipProvider>
  )
}

// ===== ШАГ 5: Условия монтажа =====

export function StepMount({
  input, set, bundle,
}: {
  input: CalcInput
  set: (patch: Partial<CalcInput>) => void
  bundle: RefBundle
}) {
  const region = bundle.regions.find((r) => r.code === input.regionCode) ?? bundle.regions[0]
  const mountRate = bundle.mountRates.find((m) => m.federalOkrug === region.federalOkrug)
  const reinforced = region.snowRegion >= 4 || region.windRegion >= 4

  return (
    <TooltipProvider>
      <StepHeader
        n={5}
        title="Условия монтажа"
        hint="Снеговой и ветровой районы подставлены по СП 20.13330 автоматически из региона. Кабельный трек и щитовая влияют на смету."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Длина кабельного трека, м
            <FieldTooltip text="DC от массива до инвертора + AC до щитовой. Каждый метр — кабель + 0,15 нормо-часа прокладки." />
          </Label>
          <div className="card-premium flex items-center gap-4 px-4 py-3.5">
            <Cable className="h-4 w-4 shrink-0 text-primary" />
            <Slider
              min={5} max={500} step={5}
              value={[input.cableM]}
              onValueChange={([v]) => set({ cableM: v })}
              className="flex-1"
              aria-label="Длина кабельного трека"
            />
            <span className="w-14 text-right text-sm font-semibold">{input.cableM} м</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Щитовая (DC/AC щиты, защита, мониторинг)
            <FieldTooltip text="Обязательна по ПУЭ для массивов 10+ кВт. Состав и цена масштабируются от мощности инвертора." />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set({ switchboard: true })} className={cn("chip justify-center", input.switchboard && "chip-active")}>Нужна</button>
            <button type="button" onClick={() => set({ switchboard: false })} className={cn("chip justify-center", !input.switchboard && "chip-active")}>Упрощенная</button>
          </div>
        </div>
      </div>

      <div className="card-premium space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MountainSnow className="h-4 w-4 text-primary" />
          Нагрузки по СП 20.13330.2016 — {region.name}
        </p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
            <Snowflake className="h-5 w-5 text-chart-5" />
            <div>
              <p className="font-medium">Снеговой район {region.snowRegion}</p>
              <p className="text-xs text-muted-foreground">
                {region.snowRegion <= 3 ? "стандартные крепления" : "требуется усиление: сокращённые пролёты"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
            <Wind className="h-5 w-5 text-chart-4" />
            <div>
              <p className="font-medium">Ветровой район {region.windRegion}</p>
              <p className="text-xs text-muted-foreground">
                {region.windRegion <= 3 ? "штатный крепёж" : "пересчёт балласта/прижимов на подъёмную силу"}
              </p>
            </div>
          </div>
        </div>
        {reinforced && (
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
            Район IV и выше: в смету автоматически добавлено усиление креплений (0,15 н·ч на панель) —
            это требование СП 20.13330, экономия на нём ломает кровлю.
          </p>
        )}
        {mountRate && (
          <p className="text-xs text-muted-foreground">
            Ставка монтажа в {mountRate.federalOkrug}: {mountRate.baseRateRubHour.toLocaleString("ru-RU")} ₽/нормо-час
            (региональный коэффициент ×{region.installK}), минимальный выезд бригады — {mountRate.minCalloutRub.toLocaleString("ru-RU")} ₽.
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}
