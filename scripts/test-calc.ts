// Юнит-тесты расчётного ядра: 10 контрольных сценариев ИТЭ (ТЗ, этап 4 + приложение А)
// Запуск: bunx tsx scripts/test-calc.ts

import { computeCalc } from "../src/lib/calc/engine"
import { normalizeInput } from "../src/lib/calc/share"
import { LOAD_PRESETS } from "../src/lib/calc/constants"
import { REGIONS } from "../prisma/data/regions"
import { EQUIPMENT, MOUNT_RATES, WORK_NORMS } from "../prisma/data/equipment"
import type { CalcInput, RefBundle } from "../src/lib/calc/types"

const bundle: RefBundle = {
  regions: REGIONS.map((r) => ({
    code: r.code, name: r.name, federalOkrug: r.federalOkrug, psh: r.psh,
    tariffFlat: r.tariffFlat, tariffDay: r.tariffDay, tariffNight: r.tariffNight,
    installK: r.installK, snowRegion: r.snowRegion, windRegion: r.windRegion,
    climateNote: r.climateNote, dieselPrice: r.dieselPrice, gasPrice: r.gasPrice,
  })),
  equipment: EQUIPMENT.map((e) => ({
    category: e.category, tech: e.tech ?? null, name: e.name, unit: e.unit,
    spec: e.spec ?? null, priceFrom: e.priceFrom, priceTo: e.priceTo,
  })),
  mountRates: MOUNT_RATES,
  workNorms: WORK_NORMS.map((w) => ({
    code: w.code, workName: w.workName, normHours: w.normHours,
    unit: w.unit, complexityK: w.complexityK,
  })),
  priceUpdatedAt: new Date().toISOString(),
}

const scenarios: { name: string; input: Partial<CalcInput>; checks: string[] }[] = [
  {
    name: "1. Дача 3 кВт, автономия, Подмосковье (кейс 1)",
    input: {
      objectType: "dacha", mode: "autonomous", regionCode: "moskva", voltage: "220",
      dailyKwh: 5, tariffPlan: "flat", peakKw: 2.5, startK: 3,
      powerMode: "kw", panelKw: 3.3, installType: "ground", orientation: "south", shading: "none",
      autonomyHours: 8, batteryTech: "lifepo4", generator: "none", cableM: 30, switchboard: true,
    },
    checks: ["pnom≈3.3", "battery 3.5-5.9", "annualGen≈2900"],
  },
  {
    name: "2. Дом 10 кВт, гибрид, двухтарифный, Воронеж (кейс 2)",
    input: {
      objectType: "house", mode: "hybrid", regionCode: "voronezh", voltage: "380",
      dailyKwh: 22, tariffPlan: "two", peakKw: 9, startK: 3.5,
      powerMode: "kw", panelKw: 10.4, installType: "roof_slope", orientation: "south", shading: "none",
      autonomyHours: 8, batteryTech: "lifepo4", generator: "none", cableM: 60, switchboard: true,
    },
    checks: ["annualGen≈10950", "tariffEff 4.8-6.5", "paybackVsGrid>0"],
  },
  {
    name: "3. Ферма 30 кВт, гибрид + АКБ 30 кВт·ч + дизель, Самара (кейс 3)",
    input: {
      objectType: "farm", mode: "hybrid", regionCode: "samara", voltage: "380",
      dailyKwh: 130, tariffPlan: "flat", peakKw: 28, startK: 4,
      powerMode: "kw", panelKw: 30.2, installType: "ground", orientation: "south", shading: "none",
      autonomyHours: 4, batteryTech: "lifepo4", generator: "diesel", cableM: 160, switchboard: true,
      consumerType: "business",
    },
    checks: ["annualGen≈33100", "generatorKw>=50", "business tariff ~9"],
  },
  {
    name: "4. Склад 100 кВт, сетевой, юрлицо, МО (кейс 4) — > 15 кВт, ветка микрогенерации",
    input: {
      objectType: "warehouse", mode: "grid", regionCode: "moskva", voltage: "380",
      dailyKwh: 480, tariffPlan: "flat", peakKw: 60, startK: 3,
      powerMode: "kw", panelKw: 100, installType: "roof_flat", orientation: "south", shading: "none",
      autonomyHours: 0, batteryTech: "none", generator: "none", cableM: 120, switchboard: true,
      consumerType: "business",
    },
    checks: ["warning microgen >15", "annualGen≈104000", "batteryKwh=0"],
  },
  {
    name: "5. Микрогенерация ≤ 15 кВт: дом 12 кВт сетевой, физлицо",
    input: {
      objectType: "house", mode: "grid", regionCode: "krasnodar", voltage: "220",
      dailyKwh: 14, tariffPlan: "flat", peakKw: 6, startK: 3,
      powerMode: "kw", panelKw: 12, installType: "roof_slope", orientation: "south", shading: "none",
      autonomyHours: 0, batteryTech: "none", generator: "none", cableM: 20, switchboard: true,
    },
    checks: ["microgenSurplus>0", "microgenRevenue>0", "no alert microgen"],
  },
  {
    name: "6. Автономия с дизелем: база 15 кВт, Якутск, зимний баланс",
    input: {
      objectType: "commercial", mode: "autonomous_gen", regionCode: "yakutsk", voltage: "380",
      dailyKwh: 60, tariffPlan: "flat", peakKw: 15, startK: 4,
      powerMode: "kw", panelKw: 15, installType: "ground", orientation: "south", shading: "none",
      autonomyHours: 12, batteryTech: "lifepo4", generator: "diesel", cableM: 80, switchboard: true,
    },
    checks: ["winterAdvice!=null (дефицит дек)", "paybackVsDiesel>0", "dieselKwh>20"],
  },
  {
    name: "7. VRFB под заказ: цех 60 кВт гибрид, VRFB 40 кВт·ч",
    input: {
      objectType: "industry", mode: "hybrid", regionCode: "ekaterinburg", voltage: "380",
      dailyKwh: 900, tariffPlan: "flat", peakKw: 70, startK: 5,
      powerMode: "kw", panelKw: 60, installType: "roof_flat", orientation: "south", shading: "partial",
      autonomyHours: 4, batteryTech: "vrfb", generator: "gas", cableM: 200, switchboard: true,
      consumerType: "business",
    },
    checks: ["batteryKwh>=30 (VRFB min)", "vrfb warning", "reinforced (снег IV+)"],
  },
  {
    name: "8. Малый объект: сторожка 0.8 кВт, AGM, минимальный выезд",
    input: {
      objectType: "snt", mode: "autonomous", regionCode: "tula-region" as string, voltage: "220",
      dailyKwh: 1.2, tariffPlan: "flat", peakKw: 0.6, startK: 3,
      powerMode: "kw", panelKw: 0.8, installType: "ground", orientation: "south", shading: "partial",
      autonomyHours: 12, batteryTech: "agm", generator: "none", cableM: 10, switchboard: false,
    },
    checks: ["minCalloutApplied=true", "batteryKwh small", "capex < 0.5M"],
  },
  {
    name: "9. Площадь вместо мощности: 80 м² кровли, Питер, премиум-панели",
    input: {
      objectType: "house", mode: "hybrid", regionCode: "spb", voltage: "220",
      dailyKwh: 10, tariffPlan: "flat", peakKw: 4, startK: 3,
      powerMode: "area", areaM2: 80, panelClass: "premium", installType: "roof_slope",
      orientation: "south", shading: "none",
      autonomyHours: 8, batteryTech: "lifepo4", generator: "none", cableM: 25, switchboard: true,
    },
    checks: ["pnom≈18 (80×0.23=18.4→панели)", "annualGen≈4700", "LCOE 6-14"],
  },
  {
    name: "10. Двухтарифный арбитраж: дом 5 кВт, ночная зарядка, Иркутск",
    input: {
      objectType: "house", mode: "hybrid", regionCode: "irkutsk", voltage: "220",
      dailyKwh: 9, tariffPlan: "two", peakKw: 4.5, startK: 3,
      powerMode: "kw", panelKw: 5, installType: "roof_slope", orientation: "south", shading: "none",
      autonomyHours: 12, batteryTech: "lifepo4", generator: "none", cableM: 20, switchboard: true,
    },
    checks: ["nightVsBattery!=null", "chargeFromGridBeneficial=true (ночь 2.26)", "annualGen≈1400"],
  },
]

let failures = 0
console.log("=== Контрольные примеры ИТЭ (10 сценариев) ===\n")

for (const sc of scenarios) {
  const input = normalizeInput(sc.input)
  // Пресет профиля по типу объекта
  input.loadProfile = LOAD_PRESETS[input.objectType]
  try {
    const r = computeCalc(input, bundle)
    const e = r.economy
    const c = r.composition
    console.log(`▶ ${sc.name}`)
    console.log(`   Регион: ${r.region.name} (снег ${r.region.snowRegion}/ветер ${r.region.windRegion}), PR=0.78`)
    console.log(`   Pnom=${c.pnom.toFixed(1)} кВт (${c.panelCount}×${c.panelW} Вт), инвертор ${c.inverterKw} кВт, АКБ ${c.batteryKwh} кВт·ч (${c.batteryTech})${c.generatorKw ? `, генератор ${c.generatorKw} кВт (${c.generatorType})` : ""}`)
    console.log(`   Генерация ${r.annualGeneration.toLocaleString("ru-RU")} кВт·ч/год (нагрузка ${r.annualLoad.toLocaleString("ru-RU")}), самопокрытие ${(r.selfSufficiency * 100).toFixed(0)}%`)
    console.log(`   CAPEX ${e.capexFrom.toLocaleString("ru-RU")} – ${e.capexTo.toLocaleString("ru-RU")} ₽ (монтаж ${r.smetaTotals.mountHours} н·ч${r.smetaTotals.minCalloutApplied ? ", применён минимум выезда" : ""})`)
    console.log(`   LCOE=${e.lcoe} ₽/кВт·ч, тариф ${e.tariffEff} ₽/кВт·ч, окупаемость vs сеть: ${e.paybackVsGrid ?? "—"} лет${e.paybackVsDiesel ? ` | vs дизель: ${e.paybackVsDiesel} лет` : ""}`)
    if (e.microgenRevenue) console.log(`   Микрогенерация: излишки ${e.microgenSurplus?.toLocaleString("ru-RU")} кВт·ч/год → ~${e.microgenRevenue.toLocaleString("ru-RU")} ₽/год`)
    if (e.nightVsBattery) console.log(`   Ночь vs АКБ: заряд от сети ${e.nightVsBattery.chargeFromGridBeneficial ? "выгоден" : "невыгоден"} (${e.nightVsBattery.nightCost} ₽ против ${e.tariffEff} ₽ днём)`)
    if (r.winterAdvice) console.log(`   Зимний баланс: +${r.winterAdvice.addPanelsKw} кВт панелей или генератор ${r.winterAdvice.needGenKw} кВт`)
    const warnSummary = r.warnings.map((w) => w.level).join(",")
    console.log(`   Предупреждения: ${warnSummary || "нет"}`)
    // Санити-проверки
    const errs: string[] = []
    if (r.annualGeneration < 100) errs.push("генерация подозрительно мала")
    if (e.capexFrom <= 0) errs.push("CAPEX = 0")
    if (c.pnom <= 0) errs.push("Pnom = 0")
    if (e.lcoe <= 0 || e.lcoe > 200) errs.push(`LCOE вне диапазона: ${e.lcoe}`)
    if (errs.length) {
      failures++
      console.log(`   ❌ ОШИБКИ: ${errs.join("; ")}`)
    } else {
      console.log("   ✅ ок\n")
    }
  } catch (err) {
    failures++
    console.log(`   ❌ ИСКЛЮЧЕНИЕ: ${err}\n`)
  }
}

console.log(failures === 0 ? "=== ВСЕ 10 СЦЕНАРИЕВ ПРОЙДЕНЫ ===" : `=== ПРОВАЛЕНО: ${failures} ===`)
process.exit(failures === 0 ? 0 : 1)
