// Каталог оборудования: стартовые ценовые диапазоны 2026 (ТЗ, раздел 5).
// Хранение «от–до», дата актуальности обновляется ЭС; > 14 дней — предупреждение на смете.

export type EquipmentSeed = {
  category: string
  tech?: string
  name: string
  unit: string
  spec?: string
  priceFrom: number
  priceTo: number
  sourceNote?: string
}

export const EQUIPMENT: EquipmentSeed[] = [
  // Панели
  { category: "panel", tech: "mono", name: "Солнечная панель моно 550–600 Вт (Tier-1)", unit: "₽/Вт", spec: "550–600 Вт", priceFrom: 22, priceTo: 38, sourceNote: "Диапазон: китайские Tier-1 — премиум-бренды" },
  { category: "panel", tech: "mono", name: "Солнечная панель моно 400–450 Вт", unit: "₽/Вт", spec: "400–450 Вт", priceFrom: 24, priceTo: 40, sourceNote: "Меньше Вт/м², дороже за ватт" },
  { category: "panel", tech: "bifacial", name: "Бифациальная панель 580–700 Вт", unit: "₽/Вт", spec: "580–700 Вт", priceFrom: 26, priceTo: 44, sourceNote: "+5–15% выработки на светлых покрытиях" },

  // Инверторы
  { category: "inverter", tech: "hybrid", name: "Гибридный инвертор 3–10 кВт (1ф)", unit: "₽/Вт", spec: "3–10 кВт", priceFrom: 45, priceTo: 80, sourceNote: "Солнце+АКБ+сеть, передача в сеть" },
  { category: "inverter", tech: "hybrid", name: "Гибридный инвертор 8–20 кВт (3ф)", unit: "₽/Вт", spec: "8–20 кВт", priceFrom: 55, priceTo: 110, sourceNote: "Трёхфазные, параллелинг до 60+ кВт" },
  { category: "inverter", tech: "string", name: "Струнный сетевой инвертор 10–100 кВт", unit: "₽/Вт", spec: "10–100 кВт", priceFrom: 30, priceTo: 55, sourceNote: "Без АКБ, только сеть" },
  { category: "inverter", tech: "offgrid", name: "Автономный инвертор-зарядник 3–10 кВт", unit: "₽/Вт", spec: "3–10 кВт", priceFrom: 50, priceTo: 95, sourceNote: "Mastervolt/Victron-класс, без сети" },

  // АКБ
  { category: "battery_lifepo4", tech: "lifepo4", name: "АКБ LiFePO4 51–100 Вт·ч/элемент, модуль 5–15 кВт·ч", unit: "₽/Вт·ч", spec: "5–100 кВт·ч", priceFrom: 13, priceTo: 24, sourceNote: "6000+ циклов, DoD 90%" },
  { category: "battery_nmc", tech: "nmc", name: "АКБ Li-ion NMC 5–15 кВт·ч", unit: "₽/Вт·ч", spec: "5–50 кВт·ч", priceFrom: 16, priceTo: 28, sourceNote: "Компактнее, DoD 80%, дешевле на малых ёмкостях" },
  { category: "battery_agm", tech: "agm", name: "АКБ AGM 12 В 100–200 А·ч", unit: "₽/Вт·ч", spec: "2–20 кВт·ч", priceFrom: 10, priceTo: 18, sourceNote: "500–900 циклов при DoD 50%" },
  { category: "vrfb", tech: "vrfb", name: "Ванадиевая проточная батарея VRFB (под заказ)", unit: "₽/Вт·ч", spec: "от 30 кВт·ч", priceFrom: 45, priceTo: 90, sourceNote: "100% DoD, 15000+ циклов, поставка 8–16 недель" },

  // Контроллеры и АВР
  { category: "controller", tech: "mppt", name: "MPPT-контроллер заряда 60–100 А", unit: "₽/Вт", spec: "1–6 кВт массива", priceFrom: 6, priceTo: 15, sourceNote: "Для DC-систем 12/24/48 В" },
  { category: "avr", tech: "avr", name: "Щит АВР (автоматический ввод резерва) с генератором", unit: "шт", spec: "до 100 А", priceFrom: 35000, priceTo: 180000, sourceNote: "Реле/контакторные, с таймером прогрева генератора" },

  // Монтаж и конструктив
  { category: "mount", tech: "roof_slope", name: "Крепление на наклонную кровлю (крюки/направляющие)", unit: "₽/Вт", priceFrom: 4, priceTo: 8, sourceNote: "Черепица/металл — разный крепёж" },
  { category: "mount", tech: "roof_flat", name: "Крепление на плоскую кровлю (балласт/укосины)", unit: "₽/Вт", priceFrom: 6, priceTo: 12, sourceNote: "Балласт нужен при ветровом районе IV+" },
  { category: "mount", tech: "ground", name: "Наземный каркас (оцинк./горяч. цинк)", unit: "₽/Вт", priceFrom: 7, priceTo: 14, sourceNote: "С бетонированием или винтовых сваях" },
  { category: "mount", tech: "mount_k", name: "Монтажные работы (электрика + механика)", unit: "₽/Вт", priceFrom: 12, priceTo: 25, sourceNote: "Без учёта нормо-часов, нижняя граница массовых объектов" },

  // Кабель и электрика
  { category: "cable", tech: "dc", name: "Кабель DC 4–6 мм² (солнечный, UV-стойкий)", unit: "м", priceFrom: 180, priceTo: 350, sourceNote: "Позже уточняется по треку" },
  { category: "cable", tech: "ac", name: "Кабель AC ВВГнг 3×4 – 5×16", unit: "м", priceFrom: 150, priceTo: 400, sourceNote: "От инвертора до щитовой" },
  { category: "switchboard", tech: "switchboard", name: "Щитовая: щит постоянного/переменного тока, защита, мониторинг", unit: "комплект", priceFrom: 40000, priceTo: 350000, sourceNote: "Зависит от мощности и числа инверторов" },
  { category: "grounding", tech: "grounding", name: "Заземление и молниезащита (контур + УЗИП)", unit: "комплект", priceFrom: 12000, priceTo: 45000, sourceNote: "Обязательно по ПУЭ для массивов 10+ кВт" },

  // Генераторы
  { category: "generator_diesel", tech: "diesel", name: "Дизель-генератор 10–100 кВт (с АВР)", unit: "₽/Вт", spec: "10–100 кВт", priceFrom: 60, priceTo: 120, sourceNote: "Жидкостное охлаждение, автозапуск" },
  { category: "generator_gas", tech: "gas", name: "Газопоршневая установка 30–500 кВт", unit: "₽/Вт", spec: "30–500 кВт", priceFrom: 30, priceTo: 60, sourceNote: "Ресурс капремонта 40–60 тыс. моточасов" },
]

// Ставки монтажа по федеральным округам (ТЗ: mount_rates)
export const MOUNT_RATES: { federalOkrug: string; baseRateRubHour: number; minCalloutRub: number }[] = [
  { federalOkrug: "ЦФО", baseRateRubHour: 1800, minCalloutRub: 15000 },
  { federalOkrug: "СЗФО", baseRateRubHour: 1900, minCalloutRub: 18000 },
  { federalOkrug: "ЮФО", baseRateRubHour: 1600, minCalloutRub: 12000 },
  { federalOkrug: "СКФО", baseRateRubHour: 1600, minCalloutRub: 12000 },
  { federalOkrug: "ПФО", baseRateRubHour: 1700, minCalloutRub: 14000 },
  { federalOkrug: "УФО", baseRateRubHour: 1800, minCalloutRub: 15000 },
  { federalOkrug: "СФО", baseRateRubHour: 1800, minCalloutRub: 15000 },
  { federalOkrug: "ДФО", baseRateRubHour: 2200, minCalloutRub: 25000 },
]

// Нормы работ: нормо-часы на единицу (ТЗ: works_norms)
export const WORK_NORMS: { code: string; workName: string; normHours: number; unit: string; complexityK: number }[] = [
  { code: "mount_panel_slope", workName: "Монтаж панели на наклонную кровлю", normHours: 0.7, unit: "панель", complexityK: 1.0 },
  { code: "mount_panel_flat", workName: "Монтаж панели на плоской кровле (балласт)", normHours: 0.9, unit: "панель", complexityK: 1.15 },
  { code: "mount_panel_ground", workName: "Монтаж панели на наземный каркас", normHours: 1.0, unit: "панель", complexityK: 1.1 },
  { code: "mount_panel_facade", workName: "Монтаж панели на фасад/навес", normHours: 1.3, unit: "панель", complexityK: 1.3 },
  { code: "mount_inverter", workName: "Установка и подключение инвертора", normHours: 2.5, unit: "шт", complexityK: 1.0 },
  { code: "mount_battery", workName: "Монтаж и подключение АКБ (стеллаж, BMS)", normHours: 0.2, unit: "кВт·ч", complexityK: 1.0 },
  { code: "mount_controller", workName: "Установка MPPT-контроллера", normHours: 1.0, unit: "шт", complexityK: 1.0 },
  { code: "mount_switchboard", workName: "Сборка и подключение щитовой (DC+AC)", normHours: 6.0, unit: "комплекс", complexityK: 1.2 },
  { code: "mount_grounding", workName: "Заземление, УЗИП, молниезащита", normHours: 4.0, unit: "комплект", complexityK: 1.0 },
  { code: "mount_avr", workName: "Подключение АВР и генератора", normHours: 5.0, unit: "комплекс", complexityK: 1.2 },
  { code: "cable_run", workName: "Прокладка кабельного трека (лоток/труба)", normHours: 0.15, unit: "м", complexityK: 1.0 },
  { code: "commissioning", workName: "Пусконаладка и настройка мониторинга", normHours: 4.0, unit: "комплекс", complexityK: 1.2 },
  { code: "design", workName: "Проект и однолинейная схема", normHours: 12.0, unit: "комплекс", complexityK: 1.0 },
  { code: "docs_grid", workName: "Документы для сетевой организации (микрогенерация ≤15 кВт)", normHours: 3.0, unit: "комплекс", complexityK: 1.0 },
  { code: "snow_reinforce", workName: "Усиление креплений под снеговой/ветровой район IV+", normHours: 0.15, unit: "панель", complexityK: 1.0 },
]

// Тарифы поставщиков — выборка крупных регионов (ТЗ: tariffs)
export const TARIFFS: { region: string; provider: string; tariffFlat: number; tariffDay: number; tariffNight: number; note?: string }[] = [
  { region: "moskva", provider: "АО «Мосэнергосбыт» (город, эл. плита)", tariffFlat: 6.99, tariffDay: 7.95, tariffNight: 2.68 },
  { region: "moskva", provider: "АО «Мосэнергосбыт» (город, газ)", tariffFlat: 6.17, tariffDay: 7.02, tariffNight: 2.37, note: "при наличии газовой плиты" },
  { region: "moskva", provider: "ООО «МосОблЕИРЦ» (МО, сельский)", tariffFlat: 5.29, tariffDay: 6.02, tariffNight: 2.03 },
  { region: "spb", provider: "АО «Петербургская сбытовая компания»", tariffFlat: 6.10, tariffDay: 7.00, tariffNight: 2.33 },
  { region: "krasnodar", provider: "АО «Кубаньэнергосбыт» (Краснодар, город)", tariffFlat: 5.89, tariffDay: 6.79, tariffNight: 4.28, note: "ночная зона на юге выше: генерация ночью дорогая" },
  { region: "novosibirsk", provider: "АО «Новосибирскэнергосбыт»", tariffFlat: 5.43, tariffDay: 6.14, tariffNight: 3.09 },
  { region: "irkutsk", provider: "АО «Иркутскэнергосбыт»", tariffFlat: 4.88, tariffDay: 5.59, tariffNight: 2.26, note: "лучший тариф в РФ после гидро" },
  { region: "yakutsk", provider: "ПАО «Якутскэнерго»", tariffFlat: 5.90, tariffDay: 6.72, tariffNight: 3.38, note: "изолированные системы дороже" },
  { region: "kamchatka", provider: "ПАО «Камчатскэнерго»", tariffFlat: 7.12, tariffDay: 8.13, tariffNight: 3.42, note: "дизельные зоны до 30+ ₽/кВт·ч" },
]
