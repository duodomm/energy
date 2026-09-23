/** Общие константы и типы для разделов ВИЭ */

export const ENERGY_TYPE_META = {
  wind: { label: "Ветровая", color: "#14b8a6" },
  solar: { label: "Солнечная", color: "#f59e0b" },
  hydro: { label: "Малые ГЭС", color: "#06b6d4" },
  biomass: { label: "Биомасса", color: "#65a30d" },
  geothermal: { label: "Геотермия", color: "#ea580c" },
} as const;

export type EnergyTypeId = keyof typeof ENERGY_TYPE_META;
export type EnergyTypeIds = EnergyTypeId[];

export const ENERGY_TYPE_IDS = Object.keys(ENERGY_TYPE_META) as EnergyTypeIds;

export const STATUS_META = {
  operating: { label: "Действующий", color: "#059669" },
  construction: { label: "Строится", color: "#d97706" },
  planned: { label: "Планируется", color: "#9333ea" },
} as const;

export type ProjectStatus = keyof typeof STATUS_META;

export const FEDERAL_DISTRICTS = [
  "Центральный",
  "Северо-Западный",
  "Южный",
  "Северо-Кавказский",
  "Приволжский",
  "Сибирский",
  "Дальневосточный",
] as const;

/** Справочные значения, не хранящиеся в БД (официальная статистика) */
export const REFERENCE = {
  totalGenerationTWh: 1150, // общая выработка электроэнергии в РФ, млрд кВт·ч
  objectsEstimate: 350, // оценка числа объектов ВИЭ в РФ (без крупных ГЭС)
  jobsEstimate: 25000, // рабочие места в отрасли ВИЭ
  investedSince2013: 520, // млрд ₽, накопленные инвестиции по ДПМ ВИЭ
  hydroLargeGW: 58, // крупные ГЭС, ГВт
  hydroSharePercent: 18, // доля всех ГЭС в выработке, %
};

/** Мировой контекст (IRENA, 2024) */
export const WORLD_CONTEXT = [
  { region: "Китай", renewableGW: 1456, note: "лидер по солнцу и ветру" },
  { region: "ЕС", renewableGW: 570, note: " ветровые офшор-лидеры" },
  { region: "США", renewableGW: 470, note: "технологический драйвер" },
  { region: "Индия", renewableGW: 210, note: "быстрорастущий рынок" },
  { region: "Россия", renewableGW: 5.6, note: "крупные ГЭС + молодой ВИЭ-сегмент" },
  { region: "Мир, всего", renewableGW: 4448, note: "без крупных ГЭС" },
];

/** Форматирование чисел в ru-RU */
export const fmt = {
  int: (v: number) => new Intl.NumberFormat("ru-RU").format(Math.round(v)),
  num: (v: number, digits = 1) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v),
};
