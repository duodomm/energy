// Расчётное ядро — выполняется в браузере (ТЗ 4.2: «ядро, выполняется в браузере»)
// Реализует формулы 1–6 ТЗ: генерация, покрытие, АКБ, инвертор, генератор, экономика.

import {
  BATTERY_PARAMS, BATTERY_DEGRADATION, BUSINESS_TARIFF_K, DAYS, DISCOUNT_RATE,
  ETA_INV, FUEL_CONSUMPTION, GEN_WEAR_PER_KWH, INSTALL_K_ADDON, INVERTER_REPLACE_YEAR,
  LOAD_PRESETS, MICROGEN_BUYBACK, MONTH_LABELS, ORIENT_K, OPEX_RATE, PANEL_DEGRADATION,
  PANEL_W_PER_M2, PRICE_TABLE, PR, SHADE_K, SYSTEM_YEARS, TARIFF_GROWTH, isNightHour,
} from "./constants"
import type {
  BatteryTech, CalcInput, CalcResult, EconomyResult, MonthPoint, RefBundle, RefRegion,
  SmetаRow, SystemComposition, Warning,
} from "./types"

const findRegion = (bundle: RefBundle, code: string): RefRegion =>
  bundle.regions.find((r) => r.code === code) ?? bundle.regions[0]

const norm = (code: string, bundle: RefBundle, qty: number): number => {
  const n = bundle.workNorms.find((w) => w.code === code)
  if (!n) return qty
  return n.normHours * n.complexityK * qty
}

const eqPrice = (bundle: RefBundle, category: string, tech: string | null): [number, number] => {
  const found = bundle.equipment.find(
    (e) => e.category === category && (tech === null || e.tech === tech),
  )
  if (found) return [found.priceFrom, found.priceTo]
  return [0, 0]
}

const round10 = (v: number) => Math.round(v / 10) * 10
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function computeCalc(input: CalcInput, bundle: RefBundle): CalcResult {
  const region = findRegion(bundle, input.regionCode)
  const mountRate = bundle.mountRates.find((m) => m.federalOkrug === region.federalOkrug) ??
    { federalOkrug: region.federalOkrug, baseRateRubHour: 1800, minCalloutRub: 15000 }
  const warnings: Warning[] = []

  // ================= 1. Мощность панелей =================
  let pnom: number
  if (input.powerMode === "area") {
    pnom = (input.areaM2 ?? 30) * PANEL_W_PER_M2[input.panelClass].w
  } else {
    pnom = input.panelKw ?? 5
  }
  const panelW = input.panelClass === "premium" ? 600 : input.panelClass === "bifacial" ? 580 : 550
  const panelCount = Math.max(1, Math.ceil((pnom * 1000) / panelW))
  pnom = (panelCount * panelW) / 1000

  // ================= 2. Генерация по месяцам (формула 1 ТЗ) =================
  const kOrient = ORIENT_K[input.orientation] * INSTALL_K_ADDON[input.installType]
  const kShade = SHADE_K[input.shading]
  const psh = region.psh
  const dailyKwh = Math.max(0.5, input.dailyKwh)

  const months: MonthPoint[] = psh.map((p, i) => {
    const generation = pnom * p * kOrient * kShade * PR * DAYS[i]
    const load = dailyKwh * DAYS[i]
    const selfSufficiency = load > 0 ? Math.min(1, generation / load) : 0
    return {
      month: i + 1,
      label: MONTH_LABELS[i],
      psh: p,
      generation: Math.round(generation),
      load: Math.round(load),
      selfSufficiency,
      deficit: Math.max(0, Math.round(load - generation)),
    }
  })
  const annualGeneration = months.reduce((s, m) => s + m.generation, 0)
  const annualLoad = months.reduce((s, m) => s + m.load, 0)

  // Сезонная логика для автономии: худший месяц
  const worstMonthIdx = months.reduce((w, m, i) => (m.generation < months[w].generation ? i : w), 0)
  const bestMonthIdx = months.reduce((b, m, i) => (m.generation > months[b].generation ? i : b), 0)

  // ================= 3. Тарифы (двухтарифный учёт ТЗ) =================
  const tariffBase = input.tariffPlan === "two" ? { day: region.tariffDay, night: region.tariffNight } : null
  const consumerK = input.consumerType === "business" ? BUSINESS_TARIFF_K : 1
  const profile = input.loadProfile.length === 24 && Math.abs(input.loadProfile.reduce((a, b) => a + b, 0)) > 0
    ? input.loadProfile
    : LOAD_PRESETS[input.objectType]
  const profileSum = profile.reduce((a, b) => a + b, 0) || 1
  const nightShare = profile.reduce((s, v, h) => s + (isNightHour(h) ? v : 0), 0) / profileSum
  const tariffEff = tariffBase
    ? (nightShare * tariffBase.night + (1 - nightShare) * tariffBase.day) * consumerK
    : region.tariffFlat * consumerK

  // ================= 4. Ёмкость АКБ (формула 3 ТЗ) =================
  const wantBattery = input.batteryTech !== "none" && (input.autonomyHours > 0 || input.mode !== "grid")
  let batteryKwh = 0
  if (wantBattery && input.batteryTech !== "none") {
    const bp = BATTERY_PARAMS[input.batteryTech]
    const eAuto = dailyKwh * (input.autonomyHours / 24)
    batteryKwh = eAuto / (bp.dod * ETA_INV * bp.eta)
    batteryKwh = Math.max(batteryKwh, bp.minKwh)
    if (input.batteryTech === "vrfb" && batteryKwh < 30) {
      warnings.push({
        level: "info",
        text: "VRFB поставляется ёмкостями от ~30 кВт·ч — ёмкость округлена вверх с пометкой «под заказ», сроки 8–16 недель.",
      })
      batteryKwh = 30
    }
    batteryKwh = Math.ceil(batteryKwh * 10) / 10
  }

  // ================= 5. Инвертор (формула 4 ТЗ) =================
  // P_inv ≥ P_peak × K_start (для режимов, где инвертор несёт нагрузку);
  // сетевой режим: инвертор согласован с массивом (DC/AC ≈ 0.85)
  const kStart = input.mode === "autonomous" || input.mode === "autonomous_gen" ? 1.3 : 1.25
  const invByLoad = input.mode === "grid" ? 0 : input.peakKw * kStart
  const invByArray = input.mode === "grid" ? pnom * 0.85 : pnom * 0.8
  const inverterKw = Math.ceil(Math.max(invByLoad, invByArray, 0.5) * 2) / 2 // округление до 0,5 кВт
  const needsBigInverter = inverterKw > 10 || input.voltage === "380"

  // ================= 6. Генератор (формула 5 ТЗ) =================
  const hasGenerator = input.generator !== "none" && (input.mode === "autonomous_gen" || input.mode === "autonomous" || input.generator !== "none")
  let generatorKw: number | null = null
  if (input.generator !== "none") {
    const pAvgCritical = (input.peakKw * 0.4) // критическая нагрузка ≈ 40% пика
    const pCharge = wantBattery ? batteryKwh / 4 : 0 // заряд АКБ за ~4 часа
    const pBase = dailyKwh / 24
    const pGen = Math.max(pAvgCritical * 1.2, pCharge + pBase)
    generatorKw = Math.ceil(pGen / 5) * 5 // кратно 5 кВт
  }

  // ================= 7. Смета =================
  const smeta: SmetаRow[] = []
  const G = "equipment" as const

  // Панели
  const panelRange = eqPrice(bundle, "panel", input.panelClass === "premium" ? "mono" : input.panelClass === "bifacial" ? "bifacial" : "mono")
  const [pFrom, pTo] = panelRange.length === 2 ? panelRange : PRICE_TABLE.panel[input.panelClass as "std"]
  smeta.push({
    name: `Солнечная панель ${panelW} Вт ${input.panelClass === "bifacial" ? "бифациальная" : "моно"}`,
    spec: `${pnom.toFixed(1)} кВт массив`,
    qty: panelCount, unit: "шт",
    priceFrom: (pFrom * panelW) / 1, priceTo: (pTo * panelW) / 1,
    sumFrom: Math.round(pnom * 1000 * pFrom), sumTo: Math.round(pnom * 1000 * pTo),
    group: G, note: `${pFrom}–${pTo} ₽/Вт, Tier-1`,
  })

  // Инвертор — диапазон каталога по классу и мощности (синхронизирован с БД)
  const invClass =
    input.mode === "grid" ? "string" :
    input.mode === "hybrid" ? (needsBigInverter ? "hybrid_big" : "hybrid_small") : "offgrid"
  const invRange: [number, number] =
    invClass === "string" ? [30, 55]
      : invClass === "offgrid" ? [50, 95]
        : inverterKw <= 10 ? [45, 80] : [55, 110]
  smeta.push({
    name: invClass === "string" ? "Струнный сетевой инвертор" : invClass === "offgrid" ? "Автономный инвертор-зарядник" : "Гибридный инвертор",
    spec: `${inverterKw} кВт${input.voltage === "380" ? ", 3ф" : ", 1ф"}${invClass === "hybrid_big" ? ", параллелинг" : ""}`,
    qty: 1, unit: "шт",
    priceFrom: Math.round(invRange[0] * inverterKw * 1000), priceTo: Math.round(invRange[1] * inverterKw * 1000),
    sumFrom: Math.round(invRange[0] * inverterKw * 1000), sumTo: Math.round(invRange[1] * inverterKw * 1000),
    group: G, note: `${invRange[0]}–${invRange[1]} ₽/Вт`,
  })

  // АКБ
  if (batteryKwh > 0 && input.batteryTech !== "none") {
    let batRange = eqPrice(bundle, `battery_${input.batteryTech}`, input.batteryTech === "lifepo4" ? "lifepo4" : input.batteryTech)
    if (batRange[0] === 0) batRange = PRICE_TABLE.battery[input.batteryTech as "lifepo4"]
    smeta.push({
      name: `АКБ ${BATTERY_PARAMS[input.batteryTech].label}${input.batteryTech === "vrfb" ? " (под заказ)" : ""}`,
      spec: `${batteryKwh} кВт·ч, DoD ${Math.round(BATTERY_PARAMS[input.batteryTech].dod * 100)}%`,
      qty: 1, unit: "комплект",
      priceFrom: Math.round(batRange[0] * batteryKwh * 1000), priceTo: Math.round(batRange[1] * batteryKwh * 1000),
      sumFrom: Math.round(batRange[0] * batteryKwh * 1000), sumTo: Math.round(batRange[1] * batteryKwh * 1000),
      group: G, note: `${batRange[0]}–${batRange[1]} ₽/Вт·ч`,
    })
  }

  // MPPT-контроллер для off-grid малых систем (12/24/48 В DC)
  const needsMppt = input.mode === "autonomous" && inverterKw <= 6
  if (needsMppt) {
    const [cFrom, cTo] = PRICE_TABLE.controller
    smeta.push({
      name: "MPPT-контроллер заряда 60–80 А",
      spec: "DC-шина 48 В, 2 трекера",
      qty: 1, unit: "шт",
      priceFrom: Math.round(cFrom * pnom * 1000), priceTo: Math.round(cTo * pnom * 1000),
      sumFrom: Math.round(cFrom * pnom * 1000), sumTo: Math.round(cTo * pnom * 1000),
      group: G,
    })
  }

  // Крепления
  const mountRangeKey = input.installType
  let mountRange = eqPrice(bundle, "mount", input.installType === "roof_slope" ? "roof_slope" : input.installType === "roof_flat" ? "roof_flat" : input.installType === "ground" ? "ground" : "roof_slope")
  if (mountRange[0] === 0) {
    mountRange = PRICE_TABLE.mount[mountRangeKey as "roof_slope"]
  }
  smeta.push({
    name: input.installType === "ground" ? "Наземный каркас (оцинк., сваи)" : input.installType === "roof_flat" ? "Крепление плоской кровли (балласт)" : input.installType === "facade" ? "Фасадное крепление/навес" : "Крепление наклонной кровли",
    spec: `${panelCount} посадочных мест`,
    qty: 1, unit: "комплект",
    priceFrom: Math.round(pnom * 1000 * mountRange[0]), priceTo: Math.round(pnom * 1000 * mountRange[1]),
    sumFrom: Math.round(pnom * 1000 * mountRange[0]), sumTo: Math.round(pnom * 1000 * mountRange[1]),
    group: G, note: `${mountRange[0]}–${mountRange[1]} ₽/Вт`,
  })

  // Кабель DC + AC
  const cableM = Math.max(10, input.cableM)
  const [dcFrom, dcTo] = eqPrice(bundle, "cable", "dc").every((v) => v > 0) ? eqPrice(bundle, "cable", "dc") : PRICE_TABLE.cableDc
  const [acFrom, acTo] = PRICE_TABLE.cableAc
  smeta.push({
    name: "Кабель DC (солнечный, UV-стойкий)",
    spec: `${cableM} м, 4–6 мм²`,
    qty: Math.round(cableM), unit: "м",
    priceFrom: dcFrom, priceTo: dcTo,
    sumFrom: Math.round(cableM * dcFrom), sumTo: Math.round(cableM * dcTo),
    group: G,
  })
  smeta.push({
    name: "Кабель AC (инвертор → щитовая)",
    spec: `${cableM} м, ВВГнг`,
    qty: Math.round(cableM), unit: "м",
    priceFrom: acFrom, priceTo: acTo,
    sumFrom: Math.round(cableM * acFrom), sumTo: Math.round(cableM * acTo),
    group: G,
  })

  // Щитовая
  if (input.switchboard) {
    const sbScale = inverterKw <= 10 ? [40000, 90000] : inverterKw <= 50 ? [90000, 200000] : [150000, 350000]
    smeta.push({
      name: "Щитовая: DC/AC щиты, защита, мониторинг",
      spec: inverterKw <= 10 ? "1ф, базовая" : "3ф, с реле и построчным контролем",
      qty: 1, unit: "комплект",
      priceFrom: sbScale[0], priceTo: sbScale[1],
      sumFrom: sbScale[0], sumTo: sbScale[1],
      group: G,
    })
  }

  // Заземление
  const [gFrom, gTo] = eqPrice(bundle, "grounding", "grounding").every((v) => v > 0) ? eqPrice(bundle, "grounding", "grounding") : PRICE_TABLE.grounding
  smeta.push({
    name: "Заземление и молниезащита (контур + УЗИП)",
    spec: "по ПУЭ для массива 10+ кВт — обязательно",
    qty: 1, unit: "комплект",
    priceFrom: gFrom, priceTo: gTo,
    sumFrom: gFrom, sumTo: gTo,
    group: G,
  })

  // АВР при генераторе
  const hasAvr = input.generator !== "none"
  if (hasAvr) {
    const avrScale = inverterKw <= 10 ? [35000, 90000] : [90000, 180000]
    smeta.push({
      name: "Щит АВР с генератором",
      spec: `блокировки по ПУЭ, таймер прогрева${generatorKw ? `, под ${generatorKw} кВт` : ""}`,
      qty: 1, unit: "комплект",
      priceFrom: avrScale[0], priceTo: avrScale[1],
      sumFrom: avrScale[0], sumTo: avrScale[1],
      group: G,
    })
  }

  // Генератор
  if (generatorKw && input.generator !== "none") {
    const genRange = input.generator === "diesel"
      ? eqPrice(bundle, "generator_diesel", "diesel").every((v) => v > 0) ? eqPrice(bundle, "generator_diesel", "diesel") : [60, 120]
      : eqPrice(bundle, "generator_gas", "gas").every((v) => v > 0) ? eqPrice(bundle, "generator_gas", "gas") : [30, 60]
    smeta.push({
      name: input.generator === "diesel" ? `Дизель-генератор ${generatorKw} кВт (жидк. охлаждение, автозапуск)` : `Газопоршневая установка ${generatorKw} кВт`,
      spec: "с электростартером и dry contact для инвертора",
      qty: 1, unit: "шт",
      priceFrom: Math.round(genRange[0] * generatorKw * 1000), priceTo: Math.round(genRange[1] * generatorKw * 1000),
      sumFrom: Math.round(genRange[0] * generatorKw * 1000), sumTo: Math.round(genRange[1] * generatorKw * 1000),
      group: G, note: `${genRange[0]}–${genRange[1]} ₽/Вт`,
    })
  }

  // ================= 8. Монтаж: нормо-часы (ТЗ: смета по нормо-часам) =================
  const panelNormCode =
    input.installType === "ground" ? "mount_panel_ground" :
    input.installType === "roof_flat" ? "mount_panel_flat" :
    input.installType === "facade" ? "mount_panel_facade" : "mount_panel_slope"
  let mountHours = norm(panelNormCode, bundle, panelCount)
  mountHours += norm("mount_inverter", bundle, 1)
  if (batteryKwh > 0) mountHours += Math.max(2, 0.2 * batteryKwh)
  if (needsMppt) mountHours += norm("mount_controller", bundle, 1)
  if (input.switchboard) mountHours += norm("mount_switchboard", bundle, 1)
  mountHours += norm("mount_grounding", bundle, 1)
  if (hasAvr) mountHours += norm("mount_avr", bundle, 1)
  mountHours += norm("cable_run", bundle, cableM * 2)
  mountHours += norm("commissioning", bundle, 1)
  mountHours += norm("design", bundle, 1)

  // Усиление под снеговой/ветровой район IV+ (ТЗ: СП 20.13330)
  const reinforced = region.snowRegion >= 4 || region.windRegion >= 4
  if (reinforced) {
    const extra = norm("snow_reinforce", bundle, panelCount)
    mountHours += extra
    warnings.push({
      level: "info",
      text: `Регион — снеговой район ${region.snowRegion}, ветровой ${region.windRegion} по СП 20.13330: в смету добавлено усиление креплений (${Math.round(extra)} нормо-часов).`,
    })
  }
  // Документы для сетевой организации при микрогенерации
  if (input.mode === "grid" && pnom <= 15) mountHours += norm("docs_grid", bundle, 1)

  const mountRateRub = mountRate.baseRateRubHour * region.installK
  const mountLaborFrom = mountHours * mountRateRub * 0.95
  const mountLaborTo = mountHours * mountRateRub * 1.15
  // Минимальная стоимость выезда бригады (ТЗ: обязательная нижняя граница)
  const minCalloutApplied = Math.max(mountLaborFrom, mountLaborTo) < mountRate.minCalloutRub
  const mountFrom = Math.max(mountLaborFrom, minCalloutApplied ? mountRate.minCalloutRub : 0)
  const mountTo = Math.max(mountLaborTo, minCalloutApplied ? mountRate.minCalloutRub : 0)
  if (minCalloutApplied) {
    warnings.push({
      level: "info",
      text: `На малом объекте монтаж по нормо-часам ниже минимальной стоимости выезда бригады в округе (${mountRate.federalOkrug}: ${mountRate.minCalloutRub.toLocaleString("ru-RU")} ₽) — в смете применён минимум.`,
    })
  }
  smeta.push({
    name: "Монтажные работы: механика + электрика",
    spec: `${Math.round(mountHours)} нормо-часов × ${Math.round(mountRateRub).toLocaleString("ru-RU")} ₽/ч × коэф. ${region.installK} (регион)`,
    qty: Math.round(mountHours), unit: "н·ч",
    sumFrom: Math.round(mountFrom), sumTo: Math.round(mountTo),
    group: "mount",
    note: minCalloutApplied ? "применён минимум выезда бригады" : "вилка ±10% сложности объекта",
  })
  smeta.push({
    name: "Проект, однолинейная схема, ПНР",
    spec: "включая настройку мониторинга и протоколы",
    qty: 1, unit: "комплекс",
    sumFrom: Math.round(norm("design", bundle, 1) * mountRateRub + norm("commissioning", bundle, 1) * mountRateRub),
    sumTo: Math.round((norm("design", bundle, 1) + norm("commissioning", bundle, 1)) * mountRateRub * 1.2),
    group: "works",
  })

  const equipRows = smeta.filter((r) => r.group === "equipment")
  const equipFrom = equipRows.reduce((s, r) => s + r.sumFrom, 0)
  const equipTo = equipRows.reduce((s, r) => s + r.sumTo, 0)
  const worksFrom = smeta.filter((r) => r.group === "works").reduce((s, r) => s + r.sumFrom, 0)
  const worksTo = smeta.filter((r) => r.group === "works").reduce((s, r) => s + r.sumTo, 0)
  const capexFrom = equipFrom + mountFrom + worksFrom
  const capexTo = equipTo + mountTo + worksTo

  // ================= 9. Энергетический баланс =================
  const isAutonomous = input.mode === "autonomous" || input.mode === "autonomous_gen"
  // Полезная генерация: для сетевых/гибридов — самопотребление, излишки отдельно
  const selfSufficiency = annualLoad > 0 ? Math.min(1, annualGeneration / annualLoad) : 0
  const usefulGeneration = isAutonomous
    ? Math.min(annualGeneration, annualLoad)
    : Math.min(annualGeneration, annualLoad)
  const surplus = Math.max(0, annualGeneration - annualLoad)

  // ================= 10. Экономика (формула 6 ТЗ) =================
  const opexYear = (capexFrom + capexTo) / 2 * OPEX_RATE
  // Замены: инвертор на 13-й год, АКБ по технологии
  const invMid = (invRange[0] + invRange[1]) / 2 * inverterKw * 1000
  const batteryMid = batteryKwh > 0 && input.batteryTech !== "none"
    ? (PRICE_TABLE.battery[input.batteryTech as "lifepo4"].reduce((a, b) => a + b, 0) / 2) * batteryKwh * 1000
    : 0
  const batteryReplaceYears: Record<string, number> = { lifepo4: 15, nmc: 10, agm: 4, vrfb: 20 }
  const batReplaceYear = input.batteryTech !== "none" ? batteryReplaceYears[input.batteryTech] : 0

  // LCOE: 25 лет, дисконт 10%
  let pvCosts = (capexFrom + capexTo) / 2
  let pvEnergy = 0
  const annualGenFirst = annualGeneration
  for (let y = 1; y <= SYSTEM_YEARS; y++) {
    const d = Math.pow(1 + DISCOUNT_RATE, y)
    pvCosts += (opexYear / d)
    if (y === INVERTER_REPLACE_YEAR) pvCosts += invMid / d
    if (batReplaceYear > 0 && y % batReplaceYear === 0 && y < SYSTEM_YEARS) pvCosts += batteryMid / d
    const genY = annualGenFirst * Math.pow(1 - PANEL_DEGRADATION, y - 1)
    pvEnergy += genY / d
  }
  // Доход от излишков (микрогенерация ≤15 кВт) вычитаем из затрат (справочно)
  let microgenSurplus: number | null = null
  let microgenRevenue: number | null = null
  if (input.mode === "grid" && pnom <= 15 && input.consumerType === "household") {
    microgenSurplus = Math.round(surplus)
    microgenRevenue = Math.round(surplus * MICROGEN_BUYBACK)
    // 25 лет с выкупом (без роста — консервативно)
    for (let y = 1; y <= SYSTEM_YEARS; y++) {
      const d = Math.pow(1 + DISCOUNT_RATE, y)
      const genY = annualGenFirst * Math.pow(1 - PANEL_DEGRADATION, y - 1)
      const surplusY = Math.max(0, genY - annualLoad)
      pvCosts -= (surplusY * MICROGEN_BUYBACK) / d
    }
  }
  const usefulPV = usefulGeneration > 0 ? usefulGeneration : annualGeneration
  const lcoe = pvCosts / (pvEnergy * (usefulPV / annualGeneration))
  // Номинальный LCOE (без дисконтирования) — для сравнения с «простыми» оценками
  let nominalCosts = (capexFrom + capexTo) / 2 + opexYear * SYSTEM_YEARS
  if (batReplaceYear > 0) {
    const reps = Math.floor(SYSTEM_YEARS / batReplaceYear)
    nominalCosts += Math.max(0, reps - (input.batteryTech === "vrfb" ? 0 : 1)) * batteryMid
  }
  let nominalGen = 0
  for (let y = 1; y <= SYSTEM_YEARS; y++) nominalGen += annualGenFirst * Math.pow(1 - PANEL_DEGRADATION, y - 1)
  const lcoeNominal = nominalCosts / (nominalGen * (usefulPV / annualGeneration))

  // Стоимость кВт·ч альтернатив
  const dieselKwh = region.dieselPrice * FUEL_CONSUMPTION.diesel + GEN_WEAR_PER_KWH.diesel
  const gasKwh = region.gasPrice * FUEL_CONSUMPTION.gas + GEN_WEAR_PER_KWH.gas
  const compareKwh = [
    { source: "Сеть (ваш тариф)", price: Math.round(tariffEff * 100) / 100, note: input.tariffPlan === "two" ? `двухтарифный: день ${region.tariffDay}, ночь ${region.tariffNight}` : "одноставочный" },
    { source: "Солнце + АКБ (LCOE 25 лет)", price: Math.round(lcoe * 100) / 100, note: `дисконт 10%, ${input.panelClass === "bifacial" ? "бифациальные" : "моно"} панели` },
    { source: "Газопоршневая", price: Math.round(gasKwh * 100) / 100, note: `${region.gasPrice} ₽/м³ + ресурс` },
    { source: "Дизель-генерация", price: Math.round(dieselKwh * 100) / 100, note: `${region.dieselPrice} ₽/л + ресурс` },
  ]

  // Окупаемость vs сеть (ТЗ: PP = CAPEX / (E_год × (тариф − LCOE)))
  // Реализовано: статическая (по формуле ТЗ с переменной частью) и динамическая (рост тарифа 8%)
  const annualSavings = input.mode === "autonomous" || input.mode === "autonomous_gen"
    ? 0 // автономные сравниваются с дизелем
    : Math.max(0, usefulGeneration * tariffEff - opexYear - (microgenRevenue ?? 0) * 0)

  let paybackVsGrid: number | null = null
  let paybackVsGridStatic: number | null = null
  const paybackDynamicYears: { year: number; cumCash: number }[] = []
  if (annualSavings > 0) {
    paybackVsGridStatic = capexTo > 0 ? (capexFrom + capexTo) / 2 / annualSavings : null
    // Динамическая: тариф растёт, издержки стабильны
    const capexMid = (capexFrom + capexTo) / 2
    let cum = -capexMid
    for (let y = 1; y <= SYSTEM_YEARS; y++) {
      const tariffY = tariffEff * Math.pow(1 + TARIFF_GROWTH, y - 1)
      const savingsY = usefulGeneration * tariffY - opexYear
      cum += savingsY
      paybackDynamicYears.push({ year: y, cumCash: Math.round(cum) })
      if (paybackVsGrid === null && cum >= 0) paybackVsGrid = y
    }
  }

  // Окупаемость vs дизель (для автономных): с учётом топлива генератора на дефицит
  let paybackVsDiesel: number | null = null
  if (isAutonomous) {
    // Генератор дозакрывает дефицит автономной системы — его топливо вычитаем из экономии
    const deficitKwh = months.reduce((s, m) => s + m.deficit, 0)
    const genFuelPerKwh = input.generator === "gas"
      ? FUEL_CONSUMPTION.gas * (input.genFuelPrice ?? region.gasPrice) + GEN_WEAR_PER_KWH.gas
      : FUEL_CONSUMPTION.diesel * (input.genFuelPrice ?? region.dieselPrice) + GEN_WEAR_PER_KWH.diesel
    const genFuelCost = input.generator === "none" ? 0 : deficitKwh * genFuelPerKwh
    const dieselCost = annualLoad * dieselKwh
    const savings = dieselCost - opexYear - genFuelCost
    if (savings > 0) {
      const capexMid = (capexFrom + capexTo) / 2
      let cum = -capexMid
      for (let y = 1; y <= SYSTEM_YEARS; y++) {
        // дизтопливо дорожает вместе с тарифом
        cum += annualLoad * dieselKwh * Math.pow(1 + TARIFF_GROWTH, y - 1) - opexYear - genFuelCost
        paybackDynamicYears.push({ year: y, cumCash: Math.round(cum) })
        if (paybackVsDiesel === null && cum >= 0) paybackVsDiesel = y
      }
      if (paybackVsDiesel === null) {
        paybackVsDiesel = Math.round(capexMid / savings)
      }
    }
  }

  // Ночной тариф vs разряд АКБ (ТЗ 4.2: двухтарифный учёт)
  let nightVsBattery: EconomyResult["nightVsBattery"] = null
  if (input.tariffPlan === "two" && batteryKwh > 0) {
    const etaRound = BATTERY_PARAMS[input.batteryTech !== "none" ? input.batteryTech : "lifepo4"].eta * ETA_INV
    const nightCost = region.tariffNight / etaRound
    const batteryCost = nightCost + 0 // цикл износа уже внутри LCOE, здесь сравнение цен источников
    nightVsBattery = {
      chargeFromGridBeneficial: nightCost < tariffEff,
      nightCost: Math.round(nightCost * 100) / 100,
      batteryCost: Math.round(batteryCost * 100) / 100,
    }
  }

  // ================= 11. Предупреждения по ТЗ =================
  const priceStaleDays = Math.floor((Date.now() - new Date(bundle.priceUpdatedAt).getTime()) / 86400000)
  if (priceStaleDays > 14) {
    warnings.push({
      level: "warning",
      text: "Справочник цен обновлялся более 14 дней назад — цены могли измениться. Запросите точную смету инженером.",
    })
  }
  if (input.mode === "grid" && pnom > 15) {
    warnings.push({
      level: "alert",
      text: "Режим микрогенерации (продажа излишков по упрощённому порядку) применим до 15 кВт. Для вашей мощности требуется иной порядок взаимодействия с сетевой организацией — рассмотрите гибридную схему с накопителем или проектирование под собственное потребление.",
      link: { label: "Подробнее в разделе «Экономика»", href: "#/teo" },
    })
  }
  if (input.mode === "grid" && pnom <= 15 && input.consumerType === "household") {
    warnings.push({
      level: "info",
      text: `Мощность до 15 кВт: доступен режим микрогенерации — излишки (~${Math.round(surplus).toLocaleString("ru-RU")} кВт·ч/год) могут выкупаться по ~${MICROGEN_BUYBACK} ₽/кВт·ч. Выкупная цена — справочная, уточняйте у гарантирующего поставщика.`,
      link: { label: "Как оформить", href: "#/mikrogeneraciya-15kvt-prodazha-izlishkov" },
    })
  }
  if (input.mode === "hybrid" && batteryKwh === 0) {
    warnings.push({ level: "warning", text: "Гибридный режим без АКБ не обеспечит резерв при отключениях — укажите требуемую автономию в шаге 4." })
  }

  // ================= 12. Баланс автономии по худшему месяцу (ТЗ 4.2 п.2) =================
  let winterAdvice: CalcResult["winterAdvice"] = null
  const worst = months[worstMonthIdx]
  const winterGap = worst ? worst.deficit : 0
  if (isAutonomous && winterGap > 0) {
    // (а) добавить панели: сколько кВт, чтобы закрыть дефицит худшего месяца
    const worstPsh = psh[worstMonthIdx]
    const addKw = worstPsh > 0 ? winterGap / (worstPsh * kOrient * kShade * PR * DAYS[worstMonthIdx]) : 0
    const genRangeArr = [pFrom, pTo]
    winterAdvice = {
      addPanelsKw: Math.ceil(addKw * 10) / 10,
      addPanelsCostFrom: Math.round(addKw * 1000 * genRangeArr[0]),
      addPanelsCostTo: Math.round(addKw * 1000 * genRangeArr[1]),
      needGenKw: generatorKw ?? Math.ceil(Math.max(dailyKwh / 24 + (wantBattery ? batteryKwh / 4 : 0), input.peakKw * 0.48) / 5) * 5,
    }
    warnings.push({
      level: "warning",
      text: `Худший месяц (${worst.label}): дефицит ${winterGap.toLocaleString("ru-RU")} кВт·ч. Калькулятор предлагает три пути: (а) +${winterAdvice.addPanelsKw} кВт панелей, (б) генератор ${winterAdvice.needGenKw} кВт, (в) снизить нагрузку — все три показаны в блоке «Баланс автономии».`,
    })
  }

  // Дизель: расход топлива
  if (input.generator === "diesel" || input.generator === "gas") {
    const fuelPrice = input.genFuelPrice ?? (input.generator === "diesel" ? region.dieselPrice : region.gasPrice)
    const consumption = FUEL_CONSUMPTION[input.generator]
    const costKwh = Math.round((consumption * fuelPrice + GEN_WEAR_PER_KWH[input.generator]) * 100) / 100
    warnings.push({
      level: "info",
      text: `Генератор ${input.generator === "diesel" ? "дизельный" : "газовый"}: расход ~${consumption} ${input.generator === "diesel" ? "л" : "м³"}/кВт·ч, стоимость кВт·ч ≈ ${costKwh} ₽ (топливо ${fuelPrice} ₽ + ресурс/ТО).`,
    })
  }

  const composition: SystemComposition = {
    panelCount,
    panelW,
    pnom,
    inverterKw,
    batteryKwh,
    batteryTech: input.batteryTech,
    hasMppt: needsMppt,
    hasAvr,
    generatorKw,
    generatorType: input.generator,
    snowRegion: region.snowRegion,
    windRegion: region.windRegion,
    reinforced,
  }

  const economy: EconomyResult = {
    capexFrom: Math.round(capexFrom),
    capexTo: Math.round(capexTo),
    opexYear: Math.round(opexYear),
    lcoe: Math.round(lcoe * 100) / 100,
    lcoeNominal: Math.round(lcoeNominal * 100) / 100,
    tariffEff: Math.round(tariffEff * 100) / 100,
    tariffGridYear: Math.round(tariffEff * 100) / 100,
    compareKwh,
    paybackVsGrid,
    paybackVsGridStatic,
    paybackVsDiesel,
    paybackDynamicYears,
    microgenSurplus,
    microgenRevenue,
    nightVsBattery,
    annualSavings: Math.round(annualSavings),
  }

  // Автономия АКБ в часах (реальная)
  const autonomy = batteryKwh > 0 && input.batteryTech !== "none"
    ? {
        hours: Math.round(batteryKwh * BATTERY_PARAMS[input.batteryTech].dod * ETA_INV * BATTERY_PARAMS[input.batteryTech].eta / (dailyKwh / 24) * 10) / 10,
        daysWinter: Math.round((batteryKwh * BATTERY_PARAMS[input.batteryTech].dod * ETA_INV * BATTERY_PARAMS[input.batteryTech].eta / Math.max(1, dailyKwh)) * 10) / 10,
      }
    : null

  // Полезное сгенерировано vs потреблено по месяцам уже в months
  void bestMonthIdx
  void hasGenerator

  return {
    input,
    region,
    composition,
    months,
    annualGeneration: Math.round(annualGeneration),
    annualLoad: Math.round(annualLoad),
    selfSufficiency,
    autonomy,
    smeta,
    smetaTotals: {
      equipFrom: Math.round(equipFrom),
      equipTo: Math.round(equipTo),
      mountFrom: Math.round(mountFrom + worksFrom),
      mountTo: Math.round(mountTo + worksTo),
      totalFrom: Math.round(capexFrom),
      totalTo: Math.round(capexTo),
      mountHours: Math.round(mountHours),
      minCalloutApplied,
    },
    economy,
    warnings,
    priceStaleDays,
    winterAdvice,
  }
}

export { clamp, round10 }
