// Константы расчётного ядра (ТЗ 4.2) + пресеты нагрузки

import type { Appliance, InstallType, ObjectType, Orientation, Shading, BatteryTech } from "./types"

// Performance ratio: потери инвертора, температуры, кабеля, загрязнения
export const PR = 0.78
export const ETA_INV = 0.94

// Параметры АКБ по технологиям
export const BATTERY_PARAMS: Record<Exclude<BatteryTech, "none">, { dod: number; eta: number; lifepanYears: number; minKwh: number; label: string }> = {
  lifepo4: { dod: 0.9, eta: 0.95, lifepanYears: 15, minKwh: 2.5, label: "LiFePO4" },
  nmc: { dod: 0.8, eta: 0.9, lifepanYears: 10, minKwh: 3, label: "Li-ion NMC" },
  agm: { dod: 0.5, eta: 0.8, lifepanYears: 4, minKwh: 1, label: "AGM" },
  vrfb: { dod: 1.0, eta: 0.75, lifepanYears: 20, minKwh: 30, label: "VRFB" },
}

// Ватт на м² по классу панелей (ТЗ: Pnom = S × 0.21–0.23 кВт/м²)
export const PANEL_W_PER_M2: Record<string, { w: number; label: string }> = {
  std: { w: 0.215, label: "Моно 550 Вт, стандарт" },
  premium: { w: 0.23, label: "Моно 600 Вт, премиум" },
  bifacial: { w: 0.22, label: "Бифациальная 580 Вт" },
}

// Коэффициенты ориентации (ТЗ: 0.85–1.05)
export const ORIENT_K: Record<Orientation, number> = {
  south: 1.0,
  se: 0.96,
  sw: 0.96,
  east: 0.88,
  west: 0.88,
}

// Затенение (ТЗ: 0.8–0.95... частичное 0.8–0.95)
export const SHADE_K: Record<Shading, number> = {
  none: 1.0,
  partial: 0.9,
  heavy: 0.82,
}

// Плоская кровля 10° и фасад теряют к оптимуму
export const INSTALL_K_ADDON: Record<InstallType, number> = {
  roof_slope: 1.0,
  roof_flat: 0.96,
  ground: 1.02,
  facade: 0.8,
}

// Дни в месяце
export const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const MONTH_LABELS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

// Ночная зона двухтарифного счётчика: 23:00–07:00
export const isNightHour = (h: number) => h >= 23 || h < 7

// === Пресеты суточного профиля нагрузки (24 значения, сумма = 1) ===

function normalize(arr: number[]): number[] {
  const s = arr.reduce((a, b) => a + b, 0)
  return arr.map((v) => v / s)
}

export const LOAD_PRESETS: Record<ObjectType, number[]> = {
  dacha: normalize([
    0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.9, 1.2, 1.3, 1.1, 0.8, 0.6,
    0.8, 0.9, 0.8, 0.7, 0.9, 1.3, 1.6, 1.8, 1.7, 1.2, 0.6, 0.3,
  ]),
  house: normalize([
    0.5, 0.4, 0.4, 0.4, 0.5, 0.7, 1.1, 1.4, 1.2, 0.9, 0.8, 0.8,
    0.9, 0.9, 0.9, 1.0, 1.3, 1.6, 1.9, 2.0, 1.6, 1.1, 0.8, 0.6,
  ]),
  snt: normalize([
    0.4, 0.4, 0.4, 0.4, 0.5, 0.7, 1.0, 1.2, 1.1, 0.9, 0.9, 1.0,
    1.1, 1.0, 0.9, 1.0, 1.2, 1.5, 1.8, 1.9, 1.5, 1.0, 0.7, 0.5,
  ]),
  warehouse: normalize([
    1.2, 1.2, 1.2, 1.2, 1.2, 1.3, 1.5, 1.8, 2.0, 2.0, 2.0, 2.0,
    1.8, 1.6, 1.6, 1.6, 1.6, 1.8, 2.0, 1.9, 1.7, 1.5, 1.3, 1.2,
  ]),
  farm: normalize([
    0.9, 0.9, 1.0, 1.2, 1.6, 2.0, 1.9, 1.6, 1.2, 1.0, 0.9, 0.9,
    1.0, 1.0, 1.0, 1.1, 1.4, 1.9, 2.0, 1.8, 1.4, 1.1, 1.0, 0.9,
  ]),
  industry: normalize([
    1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.7, 1.8, 1.9, 1.9, 1.9, 1.8,
    1.6, 1.6, 1.6, 1.7, 1.8, 1.9, 1.9, 1.8, 1.7, 1.6, 1.6, 1.6,
  ]),
  commercial: normalize([
    0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 0.8, 1.2, 1.6, 1.8, 1.9, 1.9,
    1.8, 1.7, 1.8, 1.8, 1.9, 2.0, 1.9, 1.5, 1.0, 0.7, 0.5, 0.4,
  ]),
}

// === Конструктор нагрузок: типовые приборы по объектам ===

export const APPLIANCE_PRESETS: Record<ObjectType, Appliance[]> = {
  dacha: [
    { id: "fridge", name: "Холодильник", powerW: 120, hoursPerDay: 8, startCurrent: false, qty: 1 },
    { id: "pump", name: "Насос скважины", powerW: 750, hoursPerDay: 1.5, startCurrent: true, qty: 1 },
    { id: "light", name: "Освещение", powerW: 60, hoursPerDay: 5, startCurrent: false, qty: 6 },
    { id: "tv", name: "ТВ + роутер", powerW: 90, hoursPerDay: 5, startCurrent: false, qty: 1 },
    { id: "kettle", name: "Чайник", powerW: 2000, hoursPerDay: 0.4, startCurrent: false, qty: 1 },
    { id: "tools", name: "Инструмент/техника", powerW: 800, hoursPerDay: 1, startCurrent: true, qty: 1 },
  ],
  house: [
    { id: "fridge", name: "Холодильники", powerW: 150, hoursPerDay: 10, startCurrent: false, qty: 2 },
    { id: "boiler", name: "Бойлер 100 л", powerW: 2000, hoursPerDay: 2, startCurrent: false, qty: 1 },
    { id: "pump", name: "Насосная станция", powerW: 1100, hoursPerDay: 1.5, startCurrent: true, qty: 1 },
    { id: "light", name: "Освещение (дом)", powerW: 12, hoursPerDay: 6, startCurrent: false, qty: 25 },
    { id: "washer", name: "Стиральная машина", powerW: 2000, hoursPerDay: 1, startCurrent: true, qty: 1 },
    { id: "dish", name: "Посудомойка", powerW: 2100, hoursPerDay: 1, startCurrent: false, qty: 1 },
    { id: "kettle", name: "Чайник/кофемашина", powerW: 2200, hoursPerDay: 0.5, startCurrent: false, qty: 1 },
    { id: "oven", name: "Духовка/плита (эл.)", powerW: 3500, hoursPerDay: 1.2, startCurrent: false, qty: 1 },
    { id: "pc", name: "Компьютеры/ТВ", powerW: 150, hoursPerDay: 6, startCurrent: false, qty: 3 },
    { id: "hvac", name: "Кондиционеры", powerW: 900, hoursPerDay: 4, startCurrent: true, qty: 2 },
  ],
  snt: [
    { id: "fridge", name: "Холодильник (быт СНТ)", powerW: 120, hoursPerDay: 9, startCurrent: false, qty: 2 },
    { id: "pump", name: "Насос watering", powerW: 900, hoursPerDay: 2, startCurrent: true, qty: 2 },
    { id: "light", name: "Освещение улицы/дома", powerW: 40, hoursPerDay: 6, startCurrent: false, qty: 12 },
    { id: "gate", name: "Привод ворот", powerW: 400, hoursPerDay: 0.3, startCurrent: true, qty: 1 },
    { id: "kettle", name: "Кухня (чайник, СВЧ)", powerW: 2000, hoursPerDay: 0.8, startCurrent: false, qty: 1 },
    { id: "tv", name: "ТВ/роутер/видеонаблюдение", powerW: 100, hoursPerDay: 8, startCurrent: false, qty: 2 },
  ],
  warehouse: [
    { id: "lights", name: "Светодиодное освещение", powerW: 50, hoursPerDay: 12, startCurrent: false, qty: 60 },
    { id: "fridge", name: "Холодильные камеры", powerW: 3500, hoursPerDay: 16, startCurrent: true, qty: 4 },
    { id: "loader", name: "Зарядка погрузчиков", powerW: 4000, hoursPerDay: 5, startCurrent: false, qty: 2 },
    { id: "gates", name: "Ворота/доклевеллеры", powerW: 1500, hoursPerDay: 2, startCurrent: true, qty: 3 },
    { id: "office", name: "Офис/серверная", powerW: 800, hoursPerDay: 10, startCurrent: false, qty: 5 },
    { id: "vent", name: "Вентиляция/конвейер", powerW: 2200, hoursPerDay: 8, startCurrent: true, qty: 2 },
  ],
  farm: [
    { id: "milking", name: "Доильная установка", powerW: 7500, hoursPerDay: 4, startCurrent: true, qty: 1 },
    { id: "cooling", name: "Танк-охладитель молока", powerW: 4000, hoursPerDay: 12, startCurrent: true, qty: 2 },
    { id: "pump", name: "Водоснабжение", powerW: 1500, hoursPerDay: 6, startCurrent: true, qty: 2 },
    { id: "vent", name: "Вентиляция коровника", powerW: 1100, hoursPerDay: 12, startCurrent: false, qty: 6 },
    { id: "light", name: "Освещение", powerW: 40, hoursPerDay: 8, startCurrent: false, qty: 30 },
    { id: " calves", name: "Телятник (обогрев)", powerW: 500, hoursPerDay: 10, startCurrent: false, qty: 8 },
  ],
  industry: [
    { id: "cnc", name: "Станки с ЧПУ", powerW: 15000, hoursPerDay: 16, startCurrent: true, qty: 4 },
    { id: "comp", name: "Компрессорная", powerW: 22000, hoursPerDay: 20, startCurrent: true, qty: 1 },
    { id: "crane", name: "Кран-балка/тельфер", powerW: 8000, hoursPerDay: 3, startCurrent: true, qty: 2 },
    { id: "light", name: "Освещение цеха", powerW: 150, hoursPerDay: 14, startCurrent: false, qty: 40 },
    { id: "vent", name: "Вентиляция/аспирация", powerW: 7500, hoursPerDay: 20, startCurrent: false, qty: 3 },
    { id: "galvano", name: "Гальваника/нагрев", powerW: 30000, hoursPerDay: 8, startCurrent: false, qty: 1 },
  ],
  commercial: [
    { id: "hvac", name: "Кондиционирование", powerW: 2500, hoursPerDay: 12, startCurrent: true, qty: 4 },
    { id: "light", name: "Освещение", powerW: 40, hoursPerDay: 12, startCurrent: false, qty: 80 },
    { id: "vent", name: "Приточная вентиляция", powerW: 3000, hoursPerDay: 12, startCurrent: false, qty: 2 },
    { id: "fridge", name: "Холодильники/витрины", powerW: 700, hoursPerDay: 14, startCurrent: true, qty: 6 },
    { id: "office", name: "Офис/касса/сервер", powerW: 600, hoursPerDay: 10, startCurrent: false, qty: 6 },
    { id: "escalator", name: "Лифты/эскалаторы", powerW: 9000, hoursPerDay: 6, startCurrent: true, qty: 1 },
  ],
}

// Выкупная цена излишков микрогенерации (справочно, ТЗ 7.4: с дисклеймером)
export const MICROGEN_BUYBACK = 2.5
// Рост тарифа по умолчанию (динамика)
export const TARIFF_GROWTH = 0.08
// Ставка дисконтирования для LCOE
export const DISCOUNT_RATE = 0.1
// Деградация
export const PANEL_DEGRADATION = 0.004
export const BATTERY_DEGRADATION = 0.018
// Замена инвертора
export const INVERTER_REPLACE_YEAR = 13
// OPEX
export const OPEX_RATE = 0.0075
// Минимальный срок жизни системы
export const SYSTEM_YEARS = 25

// Расход топлива генераторов (ТЗ 4.2 п.5)
export const FUEL_CONSUMPTION = { diesel: 0.27, gas: 0.32 } // л/кВт·ч, м³/кВт·ч
// Ресурсная составляющая дизеля/газа (ТО, масло, амортизация капремонта)
export const GEN_WEAR_PER_KWH = { diesel: 6, gas: 4 }
// Бизнес-тариф: множитель к тарифу населения
export const BUSINESS_TARIFF_K = 1.6

// Диапазоны цен (фолбэк, если бандл не загружен; синхронизирован с каталогом БД)
export const PRICE_TABLE = {
  panel: { std: [22, 38], premium: [24, 40], bifacial: [26, 44] },
  inverter: { string: [30, 55], hybrid_small: [45, 80], hybrid_big: [55, 110], offgrid: [50, 95] },
  battery: { lifepo4: [13, 24], nmc: [16, 28], agm: [10, 18], vrfb: [45, 90] },
  mount: { roof_slope: [4, 8], roof_flat: [6, 12], ground: [7, 14], facade: [8, 16] },
  cableDc: [180, 350], cableAc: [150, 400],
  grounding: [12000, 45000],
  controller: [6, 15],
} as const
