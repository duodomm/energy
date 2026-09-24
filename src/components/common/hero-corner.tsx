"use client"

// Уголковая иллюстрация раздела (правый верх PageHero): «выносной элемент
// чертежа» в стиле С10 — линейный рисунок петролем + янтарные акценты,
// миллиметровка и подпись «РИС. N · НАЗВАНИЕ» по мотивам ГОСТ 2.109.
// Атрибут aria-hidden: декоративный элемент, смысл несёт подпись раздела.

import { cn } from "@/lib/utils"

const PETROL = "#14657B"
const AMBER = "#E8940A"
const MUTED = "#8A8F96"
const GRID = "rgba(20,101,123,0.08)"

type Common = { stroke?: string; className?: string }

const SunMark = ({ cx, cy, r, ray = 26 }: { cx: number; cy: number; r: number; ray?: number }) => (
  <>
    <circle cx={cx} cy={cy} r={r} stroke={AMBER} strokeWidth={1.6} fill="none" />
    <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={AMBER} strokeWidth={0.8} opacity={0.5} />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.35
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * (r + 3)}
          y1={cy + Math.sin(a) * (r + 3)}
          x2={cx + Math.cos(a) * (r + 7)}
          y2={cy + Math.sin(a) * (r + 7)}
          stroke={AMBER}
          strokeWidth={1.4}
        />
      )
    })}
    <line x1={cx} y1={cy} x2={cx + Math.cos(ray) * r * 0.8} y2={cy + Math.sin(ray) * r * 0.8} stroke={AMBER} strokeWidth={0.7} opacity={0.6} />
  </>
)

function SunPanel(_: Common) {
  return (
    <g>
      <SunMark cx={48} cy={34} r={13} ray={-0.6} />
      <line x1={62} y1={45} x2={96} y2={63} stroke={AMBER} strokeWidth={1.3} strokeDasharray="4 4" />
      <path d="M96,63 l-7,-1 M96,63 l-2,7" stroke={AMBER} strokeWidth={1.3} fill="none" />
      {/* панель в изометрии */}
      <path d="M104,58 L192,58 L206,96 L118,96 Z" stroke={PETROL} strokeWidth={1.6} fill="rgba(20,101,123,0.06)" />
      <path d="M133,58 L147,96 M167,58 L181,96 M104,70 L192,70 M109,82 L197,82" stroke={PETROL} strokeWidth={0.7} opacity={0.55} />
      {/* опоры и земля */}
      <line x1={122} y1={96} x2={116} y2={126} stroke={PETROL} strokeWidth={1.4} />
      <line x1={190} y1={96} x2={196} y2={126} stroke={PETROL} strokeWidth={1.4} />
      <line x1={100} y1={126} x2={210} y2={126} stroke={MUTED} strokeWidth={1.2} />
      {/* угол монтажа */}
      <path d="M118,126 A30,30 0 0 0 130,104" stroke={MUTED} strokeWidth={0.9} fill="none" strokeDasharray="2 2" />
      <text x={136} y={118} className="svg-mono" fontSize={9} fill={MUTED}>35°</text>
      <text x={128} y={52} className="svg-mono" fontSize={9} fill={PETROL}>ФЭМ 450 Вт</text>
    </g>
  )
}

function BatteryRack(_: Common) {
  const modules = [30, 60, 90]
  return (
    <g>
      <line x1={66} y1={16} x2={154} y2={16} stroke={PETROL} strokeWidth={1.6} />
      <line x1={72} y1={16} x2={72} y2={124} stroke={PETROL} strokeWidth={1.6} />
      <line x1={148} y1={16} x2={148} y2={124} stroke={PETROL} strokeWidth={1.6} />
      {modules.map((y, i) => (
        <g key={y}>
          <rect x={82} y={y} width={56} height={22} rx={3} stroke={PETROL} strokeWidth={1.4} fill="rgba(20,101,123,0.05)" />
          <rect x={86} y={y + 4} height={6} rx={1} fill={AMBER} width={[42, 30, 16][i]} opacity={0.85} />
          <rect x={90} y={y - 4} width={8} height={4} stroke={PETROL} strokeWidth={1} fill="#fff" />
          <rect x={122} y={y - 4} width={8} height={4} stroke={PETROL} strokeWidth={1} fill="#fff" />
          <text x={92} y={y - 5.5} className="svg-mono" fontSize={8} fill={MUTED}>+</text>
          <text x={125} y={y - 5.5} className="svg-mono" fontSize={8} fill={MUTED}>−</text>
        </g>
      ))}
      {/* BMS */}
      <rect x={160} y={54} width={34} height={26} rx={3} stroke={PETROL} strokeWidth={1.3} fill="#fff" />
      <text x={163} y={70} className="svg-mono" fontSize={8} fill={PETROL}>BMS</text>
      <path d="M138,66 L160,66 M160,72 L138,72" stroke={PETROL} strokeWidth={0.9} strokeDasharray="3 2" />
      <circle cx={138} cy={66} r={2} fill={AMBER} />
      <circle cx={138} cy={72} r={2} fill={AMBER} />
      <line x1={72} y1={124} x2={148} y2={124} stroke={PETROL} strokeWidth={1.6} />
      <text x={76} y={138} className="svg-mono" fontSize={9} fill={MUTED}>48 В · 280 А·ч</text>
    </g>
  )
}

function Genset(_: Common) {
  return (
    <g>
      {/* корпус */}
      <rect x={86} y={58} width={84} height={48} rx={6} stroke={PETROL} strokeWidth={1.6} fill="rgba(20,101,123,0.05)" />
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i} x1={134 + i * 7} y1={62} x2={134 + i * 7} y2={102} stroke={PETROL} strokeWidth={0.8} opacity={0.5} />
      ))}
      {/* глушитель */}
      <rect x={140} y={26} width={10} height={32} rx={3} stroke={PETROL} strokeWidth={1.3} fill="#fff" />
      <circle cx={145} cy={20} r={4} stroke={MUTED} strokeWidth={1} fill="none" opacity={0.7} />
      <circle cx={155} cy={14} r={5} stroke={MUTED} strokeWidth={1} fill="none" opacity={0.55} />
      <circle cx={167} cy={8} r={6} stroke={MUTED} strokeWidth={1} fill="none" opacity={0.4} />
      {/* датчик уровня топлива */}
      <circle cx={104} cy={80} r={11} stroke={PETROL} strokeWidth={1.3} fill="#fff" />
      <line x1={104} y1={80} x2={110} y2={73} stroke={AMBER} strokeWidth={1.4} />
      {/* бак */}
      <rect x={92} y={106} width={54} height={16} rx={2} stroke={PETROL} strokeWidth={1.3} fill="#fff" />
      <rect x={95} y={109} height={10} rx={1} fill={AMBER} width={34} opacity={0.8} />
      {/* молния */}
      <path d="M120,66 l-7,12 h5 l-8,13 l13,-14 h-5 l6,-11 z" fill={AMBER} stroke="none" opacity={0.9} />
      {/* АВР */}
      <rect x={60} y={62} width={20} height={16} rx={2} stroke={PETROL} strokeWidth={1.2} fill="#fff" />
      <text x={62} y={73} className="svg-mono" fontSize={8} fill={PETROL}>АВР</text>
      <path d="M80,70 H86" stroke={PETROL} strokeWidth={1.2} />
      <line x1={70} y1={126} x2={186} y2={126} stroke={MUTED} strokeWidth={1.2} />
    </g>
  )
}

function LcoeChart(_: Common) {
  return (
    <g>
      {/* оси */}
      <path d="M54,22 V122 H196" stroke={PETROL} strokeWidth={1.5} fill="none" />
      <path d="M54,22 l-4,7 M54,22 l4,7 M196,122 l-7,-4 M196,122 l-7,4" stroke={PETROL} strokeWidth={1.2} fill="none" />
      <text x={44} y={34} className="svg-mono" fontSize={8} fill={MUTED}>₽</text>
      <text x={178} y={134} className="svg-mono" fontSize={8} fill={MUTED}>годы</text>
      {/* LCOE */}
      <path d="M62,52 L98,64 L134,80 L188,96" stroke={MUTED} strokeWidth={1.4} fill="none" strokeDasharray="5 4" />
      {/* накопленная экономия */}
      <path d="M62,112 C100,104 130,86 188,38" stroke={PETROL} strokeWidth={1.7} fill="none" />
      {/* точка окупаемости */}
      <line x1={130} y1={84} x2={130} y2={122} stroke={AMBER} strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={130} cy={84} r={5} fill={AMBER} stroke="#fff" strokeWidth={1.5} />
      <text x={100} y={118} className="svg-mono" fontSize={8.5} fill={AMBER}>окуп.</text>
      <text x={148} y={44} className="svg-mono" fontSize={8} fill={PETROL}>ΔΣ, ₽</text>
    </g>
  )
}

function SunArcs(_: Common) {
  return (
    <g>
      <line x1={36} y1={118} x2={176} y2={118} stroke={PETROL} strokeWidth={1.4} />
      <path d="M58,118 Q106,22 154,118" stroke={AMBER} strokeWidth={1.5} fill="none" />
      <path d="M68,118 Q106,62 144,118" stroke={PETROL} strokeWidth={1.2} fill="none" strokeDasharray="4 3" />
      <path d="M84,118 Q106,92 128,118" stroke={MUTED} strokeWidth={1.2} fill="none" strokeDasharray="4 3" />
      <SunMark cx={106} cy={46} r={9} />
      <path d="M106,118 A54,54 0 0 0 118,66" stroke={MUTED} strokeWidth={0.9} fill="none" strokeDasharray="2 2" />
      <text x={124} y={104} className="svg-mono" fontSize={8.5} fill={MUTED}>68°</text>
      <text x={40} y={112} className="svg-mono" fontSize={8.5} fill={MUTED}>φ=55°</text>
      {/* компас */}
      <circle cx={182} cy={98} r={13} stroke={PETROL} strokeWidth={1.2} fill="#fff" />
      <line x1={182} y1={98} x2={190} y2={90} stroke={AMBER} strokeWidth={1.6} />
      <circle cx={182} cy={98} r={2} fill={PETROL} />
      <text x={186} y={88} className="svg-mono" fontSize={7} fill={PETROL}>С</text>
      <text x={148} y={40} className="svg-mono" fontSize={8} fill={AMBER}>21.06</text>
    </g>
  )
}

function GlossaryBook(_: Common) {
  return (
    <g>
      <path d="M78,44 L112,36 V110 L78,118 Z" stroke={PETROL} strokeWidth={1.5} fill="rgba(20,101,123,0.04)" />
      <path d="M112,36 L146,44 V118 L112,110 Z" stroke={PETROL} strokeWidth={1.5} fill="rgba(20,101,123,0.04)" />
      <path d="M86,52 L104,48 M86,62 L104,58 M86,72 L104,68 M86,82 L104,78 M86,98 L104,94" stroke={PETROL} strokeWidth={0.9} opacity={0.55} />
      <path d="M120,48 L138,52 M120,58 L138,62 M120,68 L138,72 M120,84 L138,88" stroke={PETROL} strokeWidth={0.9} opacity={0.55} />
      <text x={92} y={66} className="svg-mono" fontSize={11} fill={AMBER}>Σ</text>
      <text x={122} y={62} className="svg-mono" fontSize={9} fill={PETROL}>LCOE</text>
      {/* лупа */}
      <circle cx={162} cy={96} r={14} stroke={PETROL} strokeWidth={1.8} fill="rgba(255,255,255,0.7)" />
      <line x1={172} y1={106} x2={190} y2={124} stroke={PETROL} strokeWidth={2.4} />
      <path d="M155,90 L162,90 M158,86 v4" stroke={PETROL} strokeWidth={0.9} opacity={0.5} />
    </g>
  )
}

function CaseSheet(_: Common) {
  return (
    <g>
      {/* смета */}
      <path d="M84,28 h46 l14,14 v84 h-60 Z" stroke={PETROL} strokeWidth={1.4} fill="#fff" />
      <path d="M130,28 v14 h14" stroke={PETROL} strokeWidth={1.4} fill="none" />
      <line x1={92} y1={52} x2={132} y2={52} stroke={PETROL} strokeWidth={1.6} />
      <line x1={92} y1={62} x2={128} y2={62} stroke={MUTED} strokeWidth={0.9} />
      <line x1={92} y1={72} x2={132} y2={72} stroke={MUTED} strokeWidth={0.9} />
      <line x1={92} y1={82} x2={120} y2={82} stroke={MUTED} strokeWidth={0.9} />
      <rect x={92} y={98} width={44} height={12} rx={2} fill={AMBER} opacity={0.16} />
      <text x={95} y={107} className="svg-mono" fontSize={7.5} fill={AMBER}>Σ 2,79 М₽</text>
      {/* дом с панелью */}
      <path d="M150,86 L176,62 L202,86" stroke={PETROL} strokeWidth={1.6} fill="none" />
      <path d="M156,86 V116 H196 V86" stroke={PETROL} strokeWidth={1.4} fill="rgba(20,101,123,0.04)" />
      <path d="M158,82 L176,64 L182,70 L164,88 Z" fill="rgba(20,101,123,0.5)" stroke={PETROL} strokeWidth={1} />
      <rect x={172} y={96} width={10} height={20} stroke={PETROL} strokeWidth={1.2} fill="#fff" />
      <line x1={140} y1={126} x2={208} y2={126} stroke={MUTED} strokeWidth={1.2} />
      <line x1={92} y1={126} x2={130} y2={126} stroke={MUTED} strokeWidth={1.2} />
    </g>
  )
}

function BlogNote(_: Common) {
  return (
    <g>
      <rect x={70} y={34} width={82} height={92} rx={4} stroke={PETROL} strokeWidth={1.5} fill="#fff" />
      <line x1={80} y1={50} x2={142} y2={50} stroke={PETROL} strokeWidth={2.2} />
      <line x1={80} y1={62} x2={138} y2={62} stroke={MUTED} strokeWidth={0.9} />
      <line x1={80} y1={72} x2={142} y2={72} stroke={MUTED} strokeWidth={0.9} />
      <line x1={80} y1={82} x2={130} y2={82} stroke={MUTED} strokeWidth={0.9} />
      <line x1={80} y1={94} x2={142} y2={94} stroke={MUTED} strokeWidth={0.9} />
      <line x1={80} y1={104} x2={134} y2={104} stroke={MUTED} strokeWidth={0.9} />
      {/* перо */}
      <line x1={162} y1={96} x2={196} y2={54} stroke={PETROL} strokeWidth={2.2} />
      <path d="M158,100 l10,-8 -4,10 z" fill={AMBER} stroke="none" />
      {/* молния */}
      <path d="M188,96 l-9,14 h6 l-9,14 l15,-16 h-6 l7,-12 z" fill={AMBER} stroke="none" opacity={0.85} />
    </g>
  )
}

function CompassDraft(_: Common) {
  return (
    <g>
      {/* циркуль */}
      <line x1={128} y1={40} x2={128} y2={30} stroke={PETROL} strokeWidth={1.6} />
      <circle cx={128} cy={38} r={5} stroke={PETROL} strokeWidth={1.5} fill="#fff" />
      <line x1={128} y1={40} x2={102} y2={106} stroke={PETROL} strokeWidth={1.7} />
      <line x1={128} y1={40} x2={154} y2={106} stroke={PETROL} strokeWidth={1.7} />
      <path d="M102,106 l-5,4 M154,106 l5,4" stroke={PETROL} strokeWidth={1.7} />
      {/* начерченная окружность */}
      <circle cx={128} cy={106} r={34} stroke={AMBER} strokeWidth={1.4} fill="none" strokeDasharray="6 4" />
      <circle cx={128} cy={106} r={2} fill={AMBER} />
      {/* перекрестие */}
      <line x1={80} y1={106} x2={176} y2={106} stroke={MUTED} strokeWidth={0.7} strokeDasharray="2 3" />
      <line x1={128} y1={62} x2={128} y2={138} stroke={MUTED} strokeWidth={0.7} strokeDasharray="2 3" />
      {/* солнце-лого */}
      <SunMark cx={72} cy={44} r={9} />
    </g>
  )
}

function HeadsetContact(_: Common) {
  return (
    <g>
      {/* оголовье */}
      <path d="M74,78 a42,42 0 0 1 84,0" stroke={PETROL} strokeWidth={2.2} fill="none" />
      {/* чашки */}
      <rect x={62} y={74} width={16} height={28} rx={5} stroke={PETROL} strokeWidth={1.5} fill="rgba(20,101,123,0.08)" />
      <rect x={154} y={74} width={16} height={28} rx={5} stroke={PETROL} strokeWidth={1.5} fill="rgba(20,101,123,0.08)" />
      {/* микрофон */}
      <path d="M70,102 q0,18 22,18 h14" stroke={PETROL} strokeWidth={1.5} fill="none" />
      <circle cx={112} cy={120} r={4} fill={AMBER} />
      {/* облачко */}
      <rect x={128} y={30} width={54} height={28} rx={9} stroke={PETROL} strokeWidth={1.4} fill="#fff" />
      <path d="M140,58 l-4,8 10,-8" stroke={PETROL} strokeWidth={1.2} fill="none" />
      <circle cx={143} cy={44} r={2} fill={AMBER} />
      <circle cx={155} cy={44} r={2} fill={AMBER} />
      <circle cx={167} cy={44} r={2} fill={AMBER} />
      {/* пин */}
      <circle cx={96} cy={94} r={10} stroke={AMBER} strokeWidth={1.7} fill="none" />
      <path d="M89,101 L96,118 L103,101 Z" fill={AMBER} opacity={0.85} />
      <circle cx={96} cy={94} r={4} fill={AMBER} />
      <text x={178} y={126} className="svg-mono" fontSize={8} fill={MUTED}>24 ч</text>
    </g>
  )
}

export type CornerVariant =
  | "sun" | "battery" | "generator" | "economics" | "regions"
  | "reference" | "cases" | "blog" | "about" | "contacts"

const VARIANTS: Record<CornerVariant, { art: () => React.ReactNode; caption: string }> = {
  sun: { art: SunPanel, caption: "ФОТОЭЛЕКТРИЧЕСКИЙ МОДУЛЬ · 450 Вт" },
  battery: { art: BatteryRack, caption: "LiFePO4 · 6000 ЦИКЛОВ" },
  generator: { art: Genset, caption: "ГЕНЕРАТОР · АВР · ТОПЛИВО" },
  economics: { art: LcoeChart, caption: "LCOE И ТОЧКА ОКУПАЕМОСТИ" },
  regions: { art: SunArcs, caption: "ДУГИ СОЛНЦА · ШИРОТА 55°" },
  reference: { art: GlossaryBook, caption: "ГЛОССАРИЙ · 42 ТЕРМИНА" },
  cases: { art: CaseSheet, caption: "ОБЪЕКТ И СМЕТА «ОТ–ДО»" },
  blog: { art: BlogNote, caption: "ЗАМЕТКИ ИНЖЕНЕРА" },
  about: { art: CompassDraft, caption: "МЕТОД — КОНСИЛИУМ" },
  contacts: { art: HeadsetContact, caption: "ИНЖЕНЕР НА СВЯЗИ · 24 Ч" },
}

/** Порядковые номера рисунков по разделам (нумерация сквозная по сайту) */
const FIG_NO: Record<CornerVariant, number> = {
  sun: 1, battery: 2, generator: 3, economics: 4, regions: 5,
  reference: 6, cases: 7, blog: 8, about: 9, contacts: 10,
}

export function HeroCorner({ variant, className }: { variant: CornerVariant; className?: string }) {
  const v = VARIANTS[variant]
  const Art = v.art
  return (
    <div className={cn("hidden shrink-0 lg:block", className)} aria-hidden="true">
      <div className="w-[218px] rounded-xl border border-border bg-card/70 p-3 shadow-[0_10px_28px_-18px_rgba(34,39,46,0.35)]">
        <svg viewBox="0 0 220 150" className="block h-auto w-full">
          <defs>
            <pattern id="hc-grid" width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M14,0 H0 V14" fill="none" stroke={GRID} strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="220" height="150" fill="url(#hc-grid)" />
          <Art />
        </svg>
        <p className="svg-mono mt-1.5 text-center text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          Рис. {FIG_NO[variant]} · {v.caption}
        </p>
      </div>
    </div>
  )
}
