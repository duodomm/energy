// Дамп полных смет по caseSpec кейсов — для синхронизации статей с движком
import { computeCalc } from "../src/lib/calc/engine"
import { normalizeInput } from "../src/lib/calc/share"
import { LOAD_PRESETS } from "../src/lib/calc/constants"
import { REGIONS } from "../prisma/data/regions"
import { EQUIPMENT, MOUNT_RATES, WORK_NORMS } from "../prisma/data/equipment"
import { CASE_ARTICLES } from "../prisma/data/articles-cases"
import type { RefBundle } from "../src/lib/calc/types"

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

for (const art of CASE_ARTICLES) {
  const spec = JSON.parse(art.caseSpecJson!) as Record<string, unknown>
  const input = normalizeInput(spec)
  input.loadProfile = LOAD_PRESETS[input.objectType]
  const r = computeCalc(input, bundle)
  console.log(`\n======== ${art.slug} ========`)
  console.log(`Pnom=${r.composition.pnom} (${r.composition.panelCount}×${r.composition.panelW}W), inv=${r.composition.inverterKw}, АКБ=${r.composition.batteryKwh} (${r.composition.batteryTech}), gen=${r.composition.generatorKw}`)
  console.log(`Генерация=${r.annualGeneration}, нагрузка=${r.annualLoad}, самопокрытие=${(r.selfSufficiency * 100).toFixed(0)}%, autonomy=${JSON.stringify(r.autonomy)}`)
  console.log(`CAPEX: ${r.smetaTotals.totalFrom.toLocaleString("ru-RU")} – ${r.smetaTotals.totalTo.toLocaleString("ru-RU")} (оборуд. ${r.smetaTotals.equipFrom.toLocaleString("ru-RU")}–${r.smetaTotals.equipTo.toLocaleString("ru-RU")}, монтаж+работы ${r.smetaTotals.mountFrom.toLocaleString("ru-RU")}–${r.smetaTotals.mountTo.toLocaleString("ru-RU")}, ${r.smetaTotals.mountHours} н·ч)`)
  console.log(`LCOE=${r.economy.lcoe} (ном. ${r.economy.lcoeNominal}), tariff=${r.economy.tariffEff}, paybackGrid=${r.economy.paybackVsGrid}, paybackDiesel=${r.economy.paybackVsDiesel}, annualSavings=${r.economy.annualSavings}`)
  if (r.economy.microgenSurplus) console.log(`Излишки: ${r.economy.microgenSurplus} кВт·ч → ${r.economy.microgenRevenue} ₽/год`)
  if (r.winterAdvice) console.log(`Winter: +${r.winterAdvice.addPanelsKw} кВт (${r.winterAdvice.addPanelsCostFrom}–${r.winterAdvice.addPanelsCostTo} ₽) / gen ${r.winterAdvice.needGenKw} кВт`)
  console.log("Месяцы (генерация):", r.months.map((m) => m.generation).join(", "))
  console.log("Смета:")
  for (const row of r.smeta) {
    console.log(`  [${row.group}] ${row.name} | ${row.spec} | ${row.qty}${row.unit === "н·ч" ? " н·ч" : ` ${row.unit}`} | ${row.sumFrom.toLocaleString("ru-RU")}–${row.sumTo.toLocaleString("ru-RU")} ₽`)
  }
}
