"use client"

// Визуальная библиотека хабов-«столпов» (волна 5): пиктограммы шагов
// (бренд-SVG: петроль + янтарь, П1 «Янтарный полдень») и дата-визы с
// НАСТОЯЩИМИ данными проекта: PSH городов справочника, циклы АКБ, цена
// резервного кВт·ч (таблица статьи «Дизель или газ»), кумулятивный поток
// статьи «Окупаемость 2026». Без анимаций — статичные SVG/бары, тултипы
// через title. Компоненты чисто презентационные, хуков нет.

// ─────────────────────────────────────────────────────────────────────
// ПИКТОГРАММЫ (48×48, stroke петроль, янтарные акценты)
// ─────────────────────────────────────────────────────────────────────
const S = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const
const PETROL = "#14657B"
const AMBER = "#E8940A"
const MUTE = "#8A94A3"

function Svg({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" role="img" aria-label={label}>
      {children}
    </svg>
  )
}

export function PictoSunPanel() {
  return (
    <Svg label="Солнце светит на панель">
      <circle cx="15" cy="12" r="5" stroke={AMBER} {...S} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180
        return <line key={a} x1={15 + Math.cos(r) * 7.5} y1={12 + Math.sin(r) * 7.5} x2={15 + Math.cos(r) * 10} y2={12 + Math.sin(r) * 10} stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      })}
      <line x1="17" y1="19" x2="21" y2="27" stroke={AMBER} strokeWidth="2" strokeDasharray="2 2.5" strokeLinecap="round" />
      <g transform="rotate(-12 25 33)">
        <rect x="10" y="26" width="30" height="15" rx="2" stroke={PETROL} {...S} />
        <line x1="20" y1="26" x2="20" y2="41" stroke={PETROL} strokeWidth="1.4" />
        <line x1="30" y1="26" x2="30" y2="41" stroke={PETROL} strokeWidth="1.4" />
        <line x1="10" y1="33.5" x2="40" y2="33.5" stroke={PETROL} strokeWidth="1.4" />
      </g>
    </Svg>
  )
}

export function PictoInverter() {
  return (
    <Svg label="Инвертор превращает DC в AC">
      <rect x="9" y="13" width="30" height="22" rx="3" stroke={PETROL} {...S} />
      <path d="M15 27c2-7 5-7 7 0s5 7 7 0" stroke={AMBER} {...S} />
      <line x1="4" y1="19" x2="9" y2="19" stroke={MUTE} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="29" x2="9" y2="29" stroke={MUTE} strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="19" x2="44" y2="19" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="29" x2="44" y2="29" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

export function PictoBoardHouse() {
  return (
    <Svg label="Щит защищает и раздаёт энергию по дому">
      <rect x="6" y="15" width="13" height="19" rx="2" stroke={PETROL} {...S} />
      <rect x="9" y="19" width="7" height="4" rx="1" stroke={PETROL} strokeWidth="1.4" />
      <rect x="9" y="26" width="7" height="4" rx="1" stroke={PETROL} strokeWidth="1.4" />
      <line x1="19" y1="24" x2="26" y2="24" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      <path d="M30 20l8-6 8 6v15H30z" stroke={PETROL} {...S} />
      <rect x="36" y="27" width="4" height="8" rx="1" stroke={PETROL} strokeWidth="1.4" />
    </Svg>
  )
}

export function PictoCharge() {
  return (
    <Svg label="Днём излишки заряжают батарею">
      <circle cx="11" cy="11" r="4.5" stroke={AMBER} {...S} />
      <line x1="16" y1="15" x2="22" y2="21" stroke={AMBER} strokeWidth="2" strokeDasharray="2 2.5" strokeLinecap="round" />
      <rect x="20" y="20" width="18" height="22" rx="3" stroke={PETROL} {...S} />
      <rect x="26" y="17" width="6" height="3" rx="1" stroke={PETROL} strokeWidth="1.4" />
      <rect x="23.5" y="31" width="11" height="8" rx="1" fill={AMBER} opacity="0.85" />
      <rect x="23.5" y="24.5" width="11" height="4.5" rx="1" fill={AMBER} opacity="0.4" />
    </Svg>
  )
}

export function PictoDischarge() {
  return (
    <Svg label="Вечером батарея питает дом">
      <path d="M31 9a7 7 0 1 0 4.5 12A8.5 8.5 0 0 1 31 9z" stroke={MUTE} {...S} />
      <rect x="8" y="17" width="16" height="20" rx="3" stroke={PETROL} {...S} />
      <rect x="13" y="14" width="6" height="3" rx="1" stroke={PETROL} strokeWidth="1.4" />
      <rect x="11" y="27" width="10" height="7" rx="1" fill={AMBER} opacity="0.85" />
      <line x1="24" y1="27" x2="31" y2="27" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      <path d="M36 24l5 4-5 4" stroke={PETROL} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function PictoTariff() {
  return (
    <Svg label="Ночью батарея заряжается по дешёвому тарифу">
      <circle cx="22" cy="24" r="15" stroke={PETROL} {...S} />
      <line x1="22" y1="24" x2="22" y2="14" stroke={AMBER} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="22" y1="24" x2="29" y2="27" stroke={PETROL} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22" cy="24" r="2" fill={AMBER} />
      <text x="40" y="12" className="svg-mono" fontSize="10" fill={PETROL}>₽</text>
    </Svg>
  )
}

export function PictoGridOff() {
  return (
    <Svg label="Сеть пропала">
      <path d="M14 5L5 40h18z" stroke={PETROL} {...S} />
      <line x1="9.5" y1="18" x2="18.5" y2="18" stroke={PETROL} strokeWidth="1.6" />
      <line x1="8" y1="28" x2="20" y2="28" stroke={PETROL} strokeWidth="1.6" />
      <path d="M32 6l-7 14h6l-3 10 11-14h-7l4-10z" stroke={AMBER} {...S} />
      <line x1="26" y1="38" x2="44" y2="20" stroke={MUTE} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

export function PictoAutoStart() {
  return (
    <Svg label="АВР запускает генератор">
      <rect x="12" y="16" width="22" height="19" rx="3" stroke={PETROL} {...S} />
      <circle cx="19" cy="25.5" r="4" stroke={AMBER} strokeWidth="1.6" fill="none" />
      <line x1="19" y1="21.5" x2="19" y2="29.5" stroke={AMBER} strokeWidth="1.6" />
      <line x1="15" y1="25.5" x2="23" y2="25.5" stroke={AMBER} strokeWidth="1.6" />
      <rect x="27" y="22" width="4" height="7" rx="1" stroke={PETROL} strokeWidth="1.4" />
      <line x1="23" y1="42" x2="23" y2="35" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <path d="M38 24l4 3-4 3" stroke={AMBER} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function PictoReturn() {
  return (
    <Svg label="Сеть вернулась — станция на солнце и батарее">
      <circle cx="12" cy="11" r="5" stroke={AMBER} {...S} />
      {[30, 90, 150, 210, 270, 330].map((a) => {
        const r = (a * Math.PI) / 180
        return <line key={a} x1={12 + Math.cos(r) * 7.5} y1={11 + Math.sin(r) * 7.5} x2={12 + Math.cos(r) * 10} y2={11 + Math.sin(r) * 10} stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      })}
      <path d="M26 22l9-7 9 7v14H26z" stroke={PETROL} {...S} />
      <path d="M33 30l4 4 6-7" stroke={AMBER} {...S} />
    </Svg>
  )
}

export function PictoLcoe() {
  return (
    <Svg label="LCOE: полная цена киловатт-часа">
      <text x="22" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill={PETROL}>₽</text>
      <line x1="8" y1="24" x2="36" y2="24" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <text x="22" y="36" textAnchor="middle" fontSize="9" fill={MUTE}>кВт·ч</text>
      <path d="M40 8l2.5 2.5L47 6" stroke={AMBER} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function PictoScale() {
  return (
    <Svg label="Сравнение с вашей альтернативой">
      <line x1="24" y1="10" x2="24" y2="38" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="17" x2="40" y2="17" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 17l-3 9a6 6 0 0 0 12 0z" stroke={AMBER} {...S} />
      <path d="M34 17l-3 9a6 6 0 0 0 12 0z" stroke={PETROL} {...S} />
      <line x1="16" y1="40" x2="32" y2="40" stroke={PETROL} strokeWidth="2" strokeLinecap="round" />
      <text x="11" y="31" textAnchor="middle" fontSize="8" fill={AMBER}>₽</text>
      <text x="38" y="31" textAnchor="middle" fontSize="7" fill={PETROL}>сеть</text>
    </Svg>
  )
}

export function PictoDecide() {
  return (
    <Svg label="Решение по точке нуля на графике">
      <line x1="8" y1="26" x2="44" y2="26" stroke={MUTE} strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M8 38c8-1 10-16 16-16s12 12 20-14" stroke={AMBER} {...S} />
      <circle cx="24" cy="22" r="3" fill={AMBER} />
      <path d="M36 34l3.5 3.5L46 31" stroke={PETROL} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ДАТА-ВИЗЫ (данные проекта/статей)
// ─────────────────────────────────────────────────────────────────────

// Трек-бар: подпись слева, полоса на всю ширину, значение справа
function BarRow({ label, sub, value, max, color, valueLabel }: {
  label: string; sub?: string; value: number; max: number
  color: string; valueLabel: string
}) {
  const w = Math.max(1.5, (value / max) * 100)
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.4rem] items-center gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)_4rem] sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium leading-tight">{label}</p>
        {sub && <p className="truncate text-[10px] leading-tight text-muted-foreground">{sub}</p>}
      </div>
      <div className="h-3.5 w-full overflow-hidden rounded-full bg-secondary" title={`${label}: ${valueLabel}`}>
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
      <p className="svg-mono text-right text-[11px] font-semibold tabular-nums text-foreground">{valueLabel}</p>
    </div>
  )
}

const Legend = ({ items }: { items: { color: string; text: string }[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
    {items.map((i) => (
      <span key={i.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
        {i.text}
      </span>
    ))}
  </div>
)

// 1. Солнце: PSH июнь vs декабрь по городам (данные справочника и гида)
const PSH_CITIES = [
  { name: "Владивосток", jun: 4.4, dec: 3.4, year: "≈1200" },
  { name: "Иркутск", jun: 5.6, dec: 2.1, year: "≈1400" },
  { name: "Краснодар", jun: 6.2, dec: 1.9, year: "≈1350" },
  { name: "Воронеж", jun: 5.5, dec: 1.3, year: "≈1180" },
  { name: "Новосибирск", jun: 5.5, dec: 1.3, year: "≈1230" },
  { name: "Москва", jun: 5.4, dec: 1.0, year: "≈1080" },
  { name: "Мурманск", jun: 5.9, dec: 0.1, year: "≈870" },
]

export function PshCompare() {
  const fmt = (v: number) => v.toFixed(1).replace(".", ",")
  return (
    <div className="flex flex-col gap-3.5">
      <Legend items={[{ color: AMBER, text: "июнь" }, { color: PETROL, text: "декабрь" }]} />
      {PSH_CITIES.map((c) => (
        <div key={c.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.4rem] items-center gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)_4rem] sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-tight">{c.name}</p>
            <p className="truncate text-[10px] leading-tight text-muted-foreground">{c.year} кВт·ч/год с 1 кВт</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary" title={`июнь: ${fmt(c.jun)} ч/сут`}>
              <div className="h-full rounded-full" style={{ width: `${(c.jun / 6.5) * 100}%`, background: AMBER }} />
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary" title={`декабрь: ${fmt(c.dec)} ч/сут`}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, (c.dec / 6.5) * 100)}%`, background: PETROL }} />
            </div>
          </div>
          <p className="svg-mono text-right text-[11px] font-semibold tabular-nums text-foreground">
            {fmt(c.jun)}<span className="text-muted-foreground"> / {fmt(c.dec)}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

// 2. Накопители: циклы жизни технологий (данные статьи хаба)
export function CyclesBars() {
  const rows = [
    { label: "VRFB", sub: "ванадий · промышленная", cycles: 15000, text: "15 000+", color: PETROL },
    { label: "LiFePO4", sub: "DoD 90% · рабочая лошадка", cycles: 6000, text: "6 000", color: AMBER },
    { label: "Li-ion NMC", sub: "DoD 80% · плотный шкаф", cycles: 3000, text: "3 000", color: "#C2700A" },
    { label: "AGM", sub: "DoD 50% · умрёт за 2–3 года", cycles: 600, text: "600", color: "#D2382F" },
  ]
  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <BarRow key={r.label} label={r.label} sub={r.sub} value={r.cycles} max={15000} color={r.color} valueLabel={`${r.text} цикл.`} />
      ))}
    </div>
  )
}

// 3. Генерация: полная цена резервного кВт·ч (таблица статьи «Дизель или газ»)
export function CostBars() {
  const rows = [
    { label: "Магистральный газ", sub: "топливо + масло + ресурс", v: 4, color: "#0E7F63" },
    { label: "Сеть (население)", sub: "то, что вы платите сейчас", v: 6, color: PETROL },
    { label: "СУГ / баллоны", sub: "газ там, где трубы нет", v: 15, color: "#C2700A" },
    { label: "Дизель", sub: "топливо + масло + капремонт", v: 24, color: "#D2382F" },
  ]
  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <BarRow key={r.label} label={r.label} sub={r.sub} value={r.v} max={24} color={r.color} valueLabel={`≈${r.v} ₽`} />
      ))}
    </div>
  )
}

// 4. Экономика: кумулятивный денежный поток (таблица статьи «Окупаемость 2026»)
const CASH: { year: number; cum: number }[] = [
  { year: 0, cum: -1600 }, { year: 1, cum: -1554 }, { year: 3, cum: -1400 },
  { year: 5, cum: -1210 }, { year: 7, cum: -960 }, { year: 10, cum: -380 },
  { year: 12, cum: 60 }, { year: 13, cum: -144 }, { year: 16, cum: 190 },
  { year: 20, cum: 1130 },
]

export function PaybackCurve() {
  const W = 640
  const H = 300
  const PADX = 46
  const PADT = 26
  const PADB = 34
  const Y_MIN = -1700
  const Y_MAX = 1300
  const x = (yr: number) => PADX + (yr / 20) * (W - PADX - 14)
  const y = (v: number) => PADT + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - PADT - PADB)
  const line = CASH.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)} ${y(p.cum).toFixed(1)}`).join(" ")
  const area = `${line} L${x(20).toFixed(1)} ${y(Y_MIN).toFixed(1)} L${x(0).toFixed(1)} ${y(Y_MIN).toFixed(1)} Z`
  const gridVals = [-1500, -1000, -500, 0, 500, 1000]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Кумулятивный денежный поток станции 10 кВт: точка нуля на 12,5-м году, плюс 1,13 млн ₽ к 20-му году">
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={PADX} y1={y(v)} x2={W - 14} y2={y(v)} stroke={v === 0 ? "#8A94A3" : "#E3DDCC"} strokeWidth={v === 0 ? 1.4 : 1} strokeDasharray={v === 0 ? "5 4" : undefined} />
          <text x={PADX - 6} y={y(v) + 3} textAnchor="end" className="svg-mono" fontSize="9" fill="#6C7077">
            {v === 0 ? "0" : v > 0 ? `+${v / 1000}` : `${v / 1000}`}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20].map((yr) => (
        <text key={yr} x={x(yr)} y={H - 12} textAnchor="middle" className="svg-mono" fontSize="9" fill="#6C7077">{yr}</text>
      ))}
      <text x={W - 14} y={H - 12} textAnchor="end" className="svg-mono" fontSize="9" fill="#6C7077">ГОД</text>
      <text x={12} y={16} className="svg-mono" fontSize="9" fill="#6C7077">МЛН ₽</text>

      <path d={area} fill="rgba(20,101,123,0.09)" />
      <path d={line} fill="none" stroke={PETROL} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={x(12.5)} cy={y(0)} r="4.5" fill={AMBER} stroke="#FAF8F3" strokeWidth="2" />
      <line x1={x(12.5)} y1={y(0)} x2={x(12.5)} y2={y(60) - 10} stroke={AMBER} strokeWidth="1.2" strokeDasharray="3 3" />
      <text x={x(12.5) - 4} y={y(60) - 16} textAnchor="end" className="svg-mono" fontSize="10" fontWeight="700" fill="#C2700A">
        точка нуля · 12,5 лет
      </text>

      <circle cx={x(13)} cy={y(-144)} r="3.5" fill="#D2382F" stroke="#FAF8F3" strokeWidth="1.6" />
      <text x={x(13) + 8} y={y(-144) + 22} className="svg-mono" fontSize="9" fill="#6C7077">
        замена инвертора −320 тыс ₽
      </text>

      <circle cx={x(20)} cy={y(1130)} r="4.5" fill={AMBER} stroke="#FAF8F3" strokeWidth="2" />
      <text x={x(20) - 8} y={y(1130) - 10} textAnchor="end" className="svg-mono" fontSize="10" fontWeight="700" fill="#C2700A">
        +1,13 млн ₽
      </text>

      <circle cx={x(0)} cy={y(-1600)} r="3.5" fill={PETROL} stroke="#FAF8F3" strokeWidth="1.6" />
      <text x={x(0) + 8} y={y(-1600) + 16} className="svg-mono" fontSize="9" fill="#6C7077">
        CAPEX 1,6 млн ₽
      </text>
    </svg>
  )
}
