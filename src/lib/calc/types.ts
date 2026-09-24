// Типы расчётного ядра — ТЗ 4.1, 4.2, 4.3

export type ObjectType =
  | "dacha" | "house" | "snt" | "warehouse" | "farm" | "industry" | "commercial"

export type SystemMode = "grid" | "hybrid" | "autonomous" | "autonomous_gen"

export type Voltage = "220" | "380"
export type TariffPlan = "flat" | "two"
export type ConsumerType = "household" | "business"
export type PowerMode = "area" | "kw"
export type InstallType = "roof_slope" | "roof_flat" | "ground" | "facade"
export type Orientation = "south" | "se" | "sw" | "east" | "west"
export type Shading = "none" | "partial" | "heavy"
export type BatteryTech = "none" | "lifepo4" | "nmc" | "agm" | "vrfb"
export type GeneratorType = "none" | "diesel" | "gas"
export type PanelClass = "std" | "premium" | "bifacial"

export interface Appliance {
  id: string
  name: string
  powerW: number
  hoursPerDay: number
  startCurrent: boolean // есть пусковые токи (насос, компрессор)
  qty: number
}

export interface CalcInput {
  objectType: ObjectType
  mode: SystemMode
  regionCode: string
  // Шаг 2
  voltage: Voltage
  dailyKwh: number
  loadProfile: number[] // 24 значения, относительные веса ч/час (сумма = 1)
  tariffPlan: TariffPlan
  consumerType: ConsumerType
  peakKw: number
  startK: number // коэффициент пусковых токов 3–7
  appliances?: Appliance[] // конструктор нагрузок
  // Шаг 3
  powerMode: PowerMode
  areaM2?: number
  panelKw?: number
  panelClass: PanelClass
  installType: InstallType
  orientation: Orientation
  shading: Shading
  // Шаг 4
  autonomyHours: number // 0 = без АКБ
  batteryTech: BatteryTech
  winterBalance: boolean // проверка баланса по худшему месяцу
  generator: GeneratorType
  genFuelPrice?: number // ₽/л или ₽/м³ override
  genHours?: number // плановая наработка при автономии с генератором (справочно)
  // Шаг 5
  cableM: number
  switchboard: boolean
}

// === Справочные данные (JSON-бандл из БД, кэш 1 ч) ===

export interface RefRegion {
  code: string
  name: string
  federalOkrug: string
  psh: number[]
  tariffFlat: number
  tariffDay: number
  tariffNight: number
  installK: number
  snowRegion: number
  windRegion: number
  climateNote: string
  dieselPrice: number
  gasPrice: number
}

export interface RefEquipment {
  category: string
  tech: string | null
  name: string
  unit: string
  spec: string | null
  priceFrom: number
  priceTo: number
}

export interface RefMountRate {
  federalOkrug: string
  baseRateRubHour: number
  minCalloutRub: number
}

export interface RefWorkNorm {
  code: string
  workName: string
  normHours: number
  unit: string
  complexityK: number
}

export interface RefBundle {
  regions: RefRegion[]
  equipment: RefEquipment[]
  mountRates: RefMountRate[]
  workNorms: RefWorkNorm[]
  priceUpdatedAt: string // ISO-дата актуальности цен каталога
}

// === Выходные данные (ТЗ 4.3) ===

export interface SmetаRow {
  name: string
  spec: string
  qty: number | string
  unit: string
  priceFrom?: number // за единицу
  priceTo?: number
  sumFrom: number
  sumTo: number
  group: "equipment" | "mount" | "works"
  note?: string
}

export interface MonthPoint {
  month: number // 1..12
  label: string
  psh: number
  generation: number // кВт·ч/мес
  load: number // кВт·ч/мес
  selfSufficiency: number // 0..1
  deficit: number // кВт·ч/мес (для автономии)
}

export interface EconomyResult {
  capexFrom: number
  capexTo: number
  opexYear: number
  lcoe: number // ₽/кВт·ч на полезную генерацию, 25 лет, дисконт 10%
  lcoeNominal: number // ₽/кВт·ч без дисконтирования — простая удельная стоимость
  tariffEff: number // средневзвешенный тариф с учётом зон
  tariffGridYear: number // стоимость сетевого кВт·ч при статус-кво
  compareKwh: { source: string; price: number; note?: string }[]
  paybackVsGrid: number | null // лет, динамическая
  paybackVsGridStatic: number | null
  paybackVsDiesel: number | null
  paybackDynamicYears: { year: number; cumCash: number }[] // накопленная экономия, 25 лет
  microgenSurplus: number | null // кВт·ч/год излишков при ≤15 кВт
  microgenRevenue: number | null // ₽/год от продажи излишков (справочно)
  nightVsBattery: { chargeFromGridBeneficial: boolean; nightCost: number; batteryCost: number } | null
  annualSavings: number // ₽/год статическая экономия vs сеть
}

export interface SystemComposition {
  panelCount: number
  panelW: number // Вт одной панели
  pnom: number // кВт
  inverterKw: number
  batteryKwh: number
  batteryTech: BatteryTech
  hasMppt: boolean
  hasAvr: boolean
  generatorKw: number | null
  generatorType: GeneratorType
  snowRegion: number
  windRegion: number
  reinforced: boolean // усиление креплений IV+
}

export interface Warning {
  level: "info" | "warning" | "alert"
  text: string
  link?: { label: string; href: string }
}

export interface CalcResult {
  input: CalcInput
  region: RefRegion
  composition: SystemComposition
  months: MonthPoint[]
  annualGeneration: number
  annualLoad: number
  selfSufficiency: number // доля за год
  autonomy: { hours: number; daysWinter: number } | null
  smeta: SmetаRow[]
  smetaTotals: { equipFrom: number; equipTo: number; mountFrom: number; mountTo: number; totalFrom: number; totalTo: number; mountHours: number; minCalloutApplied: boolean }
  economy: EconomyResult
  warnings: Warning[]
  priceStaleDays: number
  // Рекомендации по балансу автономии (ТЗ 4.2 п.2: три варианта)
  winterAdvice: { addPanelsKw: number; addPanelsCostFrom: number; addPanelsCostTo: number; needGenKw: number } | null
}

// URL-хэш для stateless-шаринга (ТЗ 4.3, 7.1: #calc=..., нулевые записи в хранилище)
export interface SharePayload {
  v: 1
  i: CalcInput
}
