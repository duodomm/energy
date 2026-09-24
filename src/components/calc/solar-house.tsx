"use client"

// Концепт №4 «Живой конфигуратор» (волна 2 С10 «Энергосистема»).
// SVG-схема усадьбы, которая реагирует на каждый шаг визарда:
//   - панели «вырастают» с пружинкой от мощности (слайдер/кВт/м²);
//   - тип конструкции: скат / плоская кровля / наземный каркас / фасад;
//   - ориентация — компас со стрелкой; затенение — дерево и тень на панелях;
//   - АКБ (технология и ёмкость), генератор, сеть (pylon) — от режима;
//   - энергопоток: пунктир бежит панели → инвертор → дом/АКБ;
//   - живая смета «под ключ, от» — из того же ядра computeCalc, что и результат.
// Дисциплина №4: схема управляется тем же state, что форма, и не рисует
// ничего, чего нет в расчёте.

import { useId, useMemo, useRef } from "react"
import { Sun } from "lucide-react"
import { computeCalc } from "@/lib/calc/engine"
import { formatRub } from "@/lib/calc/ref-bundle"
import { PANEL_W_PER_M2 } from "@/lib/calc/constants"
import { ORIENT_AZIMUTH, ORIENT_SHORT } from "@/lib/calc/solar"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import type { CalcInput, InstallType, RefBundle } from "@/lib/calc/types"

// ===== Геометрия схем (viewBox 560×300) =====

interface Slot {
  x: number
  y: number
  w: number
  h: number
  rot?: number
}

function buildSlots(install: InstallType): Slot[] {
  const slots: Slot[] = []
  const pushRow = (y: number, n: number, w: number, h: number, rot?: number, step = w + 5.5, cx = 290) => {
    const x0 = cx - (n * w + (n - 1) * (step - w)) / 2
    for (let i = 0; i < n; i++) slots.push({ x: x0 + i * step, y, w, h, rot })
  }
  if (install === "roof_slope") {
    pushRow(155, 8, 27, 19)
    pushRow(129, 6, 27, 19)
    pushRow(103, 3, 27, 19)
  } else if (install === "roof_flat") {
    pushRow(150, 8, 25, 10, -12, 30, 286)
    pushRow(131, 8, 25, 10, -12, 30, 286)
  } else if (install === "ground") {
    pushRow(214, 7, 27, 10, -20, 36, 190)
    pushRow(188, 7, 27, 10, -20, 36, 190)
  } else {
    pushRow(146, 4, 26, 28, undefined, 31, 245)
    pushRow(180, 4, 26, 28, undefined, 31, 245)
  }
  return slots
}

const STRUCTURES: Record<
  InstallType,
  { caption: string; capPos: [number, number]; badgePos: [number, number]; extraNote: (n: number) => string }
> = {
  roof_slope: { caption: "ЮЖНЫЙ СКАТ · 35–40°", capPos: [148, 95], badgePos: [290, 92], extraNote: (n) => `+${n} → КАРКАС НА УЧАСТКЕ` },
  roof_flat: { caption: "ПЛОСКАЯ КРОВЛЯ · БАЛЛАСТ 10°", capPos: [172, 118], badgePos: [286, 112], extraNote: (n) => `+${n} → ДОП. РЯД` },
  ground: { caption: "НАЗЕМНЫЙ КАРКАС · 40°", capPos: [64, 168], badgePos: [190, 172], extraNote: (n) => `+${n} → ВТОРОЙ РЯД` },
  facade: { caption: "ФАСАД · 90° / НАВЕС", capPos: [172, 116], badgePos: [245, 124], extraNote: (n) => `+${n} → КРОВЛЯ / КАРКАС` },
}

// Тени от дерева при затенении (закрывают часть поля панелей)
const SHADOWS: Record<InstallType, { partial: string; heavy: string }> = {
  roof_slope: { partial: "M128 180 L142 98 L232 94 L222 168 Z", heavy: "M128 182 L138 90 L304 86 L284 174 Z" },
  roof_flat: { partial: "M128 178 L140 122 L228 118 L218 172 Z", heavy: "M128 178 L138 112 L298 108 L282 174 Z" },
  ground: { partial: "M62 212 L76 148 L170 142 L158 210 Z", heavy: "M62 212 L72 136 L236 130 L214 212 Z" },
  facade: { partial: "M128 182 L140 112 L226 108 L216 178 Z", heavy: "M128 182 L138 104 L296 100 L278 180 Z" },
}

// Позиции узлов для энергопотока: панели → инвертор → АКБ
const FLOWS: Record<InstallType, { pToInv: string; invToBatt: string; inv: [number, number, number, number] }> = {
  roof_slope: { pToInv: "M290 132 Q316 200 350 219", invToBatt: "M364 221 Q420 252 446 236", inv: [338, 206, 26, 30] },
  roof_flat: { pToInv: "M286 146 Q330 202 364 210", invToBatt: "M378 211 Q420 250 446 236", inv: [352, 196, 26, 30] },
  ground: { pToInv: "M190 204 Q262 262 328 243", invToBatt: "M344 243 Q400 262 446 236", inv: [318, 228, 26, 30] },
  facade: { pToInv: "M290 164 Q314 224 336 230", invToBatt: "M348 231 Q400 256 446 236", inv: [322, 216, 26, 30] },
}

const PYLON_WIRE: Record<InstallType, string> = {
  roof_slope: "M104 188 Q130 186 150 192",
  roof_flat: "M104 188 Q140 190 175 198",
  ground: "M104 188 Q250 240 392 232",
  facade: "M104 188 Q140 168 175 158",
}

const GEN_BOX: Record<InstallType, [number, number]> = {
  roof_slope: [36, 228],
  roof_flat: [36, 228],
  ground: [326, 230],
  facade: [36, 228],
}

const C = {
  wall: "#F3F0E8",
  wallLine: "#C9C2AE",
  roof: "#E4DECE",
  door: "#D6CFBD",
  win: "#EAF2F5",
  winLine: "#B9C6CE",
  ground: "#C9C2AE",
  ink: "#8A94A3",
  muted: "#6C7077",
  amber: "#E8940A",
  amberDeep: "#C2700A",
  amberSoft: "rgba(232,148,10,0.16)",
  petrol: "#14657B",
  stable: "#0E7F63",
  tree: "#7E9377",
}

export function SolarHouseCard({
  input,
  bundle,
  compact = false,
  className,
}: {
  input: CalcInput
  bundle: RefBundle
  compact?: boolean
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(wrapRef)

  const result = useMemo(() => computeCalc(input, bundle), [input, bundle])
  const region = bundle.regions.find((r) => r.code === input.regionCode) ?? bundle.regions[0]

  const install = input.installType
  const struct = STRUCTURES[install]
  const slots = useMemo(() => buildSlots(install), [install])
  const capacity = slots.length
  const panelCount = result.composition.panelCount
  const active = Math.min(panelCount, capacity)
  const extra = panelCount - active

  const areaM2 = Math.round(result.composition.pnom / PANEL_W_PER_M2[input.panelClass].w)
  const pct = Math.round(result.selfSufficiency * 100)
  const hasBattery = result.composition.batteryKwh > 0
  const hasGen = result.composition.generatorKw !== null && result.composition.generatorKw > 0
  const showPylon = input.mode === "grid" || input.mode === "hybrid"
  const shading = input.shading

  const panelFill = input.panelClass === "bifacial" ? "#223C47" : input.panelClass === "premium" ? "#182631" : "#1E2E38"
  const panelStroke = input.panelClass === "bifacial" ? "#4FB3C9" : C.petrol
  const battW = input.batteryTech === "vrfb" ? 64 : 52
  const genBox = GEN_BOX[install]
  const battLevelH = hasBattery ? Math.max(5, Math.min(36, (result.composition.batteryKwh / 20) * 36)) : 0

  const stats: { label: string; value: string; accent?: boolean }[] = [
    { label: "Панели", value: `${panelCount}${extra > 0 ? ` (+${extra})` : ""}` },
    { label: "Площадь", value: `${areaM2} м²` },
    { label: "Выработка", value: `~${Math.round(result.annualGeneration).toLocaleString("ru-RU")} кВт·ч/год` },
    { label: "Покрытие спроса", value: `${pct}%` },
  ]
  if (hasBattery) stats.push({ label: "Резерв АКБ", value: `~${input.autonomyHours} ч` })
  if (hasGen) stats.push({ label: "Генератор", value: `${result.composition.generatorKw} кВт` })
  if (result.composition.reinforced) stats.push({ label: "Крепления", value: "усилены · снег IV+" })
  stats.push({ label: "Смета «под ключ»", value: `от ${formatRub(result.smetaTotals.totalFrom)}`, accent: true })

  return (
    <div ref={wrapRef} className={cn("card-premium", compact ? "p-3.5" : "p-4 md:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="stamp-label flex shrink-0 items-center gap-1.5">
          <Sun className="h-3.5 w-3.5 text-solar" />
          Живая схема станции
        </span>
        <span className="truncate text-xs text-muted-foreground">{region.name}</span>
      </div>

      <svg
        viewBox="0 0 560 300"
        className={cn("h-auto w-full", !inView && "flow-paused")}
        role="img"
        aria-label={`Схема станции: ${panelCount} панелей, ${struct.caption.toLowerCase()}`}
      >
        <defs>
          <pattern id={`bp${uid}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke="rgba(20,101,123,0.07)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Чертёжный фон */}
        <rect x="0" y="0" width="560" height="300" fill={`url(#bp${uid})`} />

        {/* Земля */}
        <line x1="28" y1="262" x2="532" y2="262" stroke={C.ground} strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={48 + i * 42} y1="262" x2={41 + i * 42} y2="270" stroke={C.ground} strokeWidth="1" opacity="0.45" />
        ))}

        {/* Солнце */}
        <circle cx="54" cy="52" r="26" fill="rgba(232,148,10,0.13)" />
        <circle cx="54" cy="52" r="10" fill={C.amber} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.35
          return (
            <line
              key={`r${i}`}
              x1={54 + Math.cos(a) * 15}
              y1={52 + Math.sin(a) * 15}
              x2={54 + Math.cos(a) * 21}
              y2={52 + Math.sin(a) * 21}
              stroke={C.amber}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          )
        })}

        {/* Дом / конструкция по типу установки */}
        {install === "roof_slope" && (
          <g>
            <rect x="150" y="177" width="280" height="85" fill={C.wall} stroke={C.wallLine} strokeWidth="1.2" />
            <path d="M130 177 L290 78 L450 177 Z" fill={C.roof} stroke={C.wallLine} strokeWidth="1.2" />
            <rect x="382" y="196" width="32" height="66" rx="2" fill={C.door} stroke={C.wallLine} />
            <rect x="168" y="199" width="54" height="40" rx="2" fill={C.win} stroke={C.winLine} />
            <path d="M195 199v40M168 219h54" stroke={C.winLine} fill="none" />
            <rect x="246" y="199" width="54" height="40" rx="2" fill={C.win} stroke={C.winLine} />
            <path d="M273 199v40M246 219h54" stroke={C.winLine} fill="none" />
          </g>
        )}

        {install === "roof_flat" && (
          <g>
            <rect x="175" y="185" width="215" height="77" fill={C.wall} stroke={C.wallLine} strokeWidth="1.2" />
            <rect x="165" y="171" width="235" height="16" fill={C.roof} stroke={C.wallLine} strokeWidth="1.2" />
            <line x1="165" y1="176" x2="400" y2="176" stroke={C.wallLine} opacity="0.6" />
            <rect x="352" y="203" width="28" height="59" rx="2" fill={C.door} stroke={C.wallLine} />
            <rect x="192" y="206" width="48" height="36" rx="2" fill={C.win} stroke={C.winLine} />
            <path d="M216 206v36M192 224h48" stroke={C.winLine} fill="none" />
            {/* опорные ряды-рельсы */}
            <line x1="174" y1="166" x2="398" y2="166" stroke={C.wallLine} strokeWidth="1" />
          </g>
        )}

        {install === "ground" && (
          <g>
            {/* дом на заднем плане */}
            <rect x="392" y="196" width="120" height="66" fill={C.wall} stroke={C.wallLine} strokeWidth="1.2" />
            <path d="M382 196 L452 150 L522 196 Z" fill={C.roof} stroke={C.wallLine} strokeWidth="1.2" />
            <rect x="462" y="214" width="24" height="48" rx="2" fill={C.door} stroke={C.wallLine} />
            <rect x="408" y="214" width="38" height="30" rx="2" fill={C.win} stroke={C.winLine} />
            {/* стойки каркаса */}
            {[86, 196, 286].map((x) => (
              <line key={x} x1={x} y1="262" x2={x - 4} y2="224" stroke={C.wallLine} strokeWidth="1.6" />
            ))}
            <line x1="72" y1="182" x2="300" y2="176" stroke={C.wallLine} strokeWidth="1" opacity="0.55" />
          </g>
        )}

        {install === "facade" && (
          <g>
            <rect x="175" y="142" width="240" height="120" fill={C.wall} stroke={C.wallLine} strokeWidth="1.2" />
            <rect x="165" y="130" width="260" height="14" fill={C.roof} stroke={C.wallLine} strokeWidth="1.2" />
            <rect x="352" y="198" width="32" height="64" rx="2" fill={C.door} stroke={C.wallLine} />
            <rect x="312" y="206" width="30" height="30" rx="2" fill={C.win} stroke={C.winLine} />
            <rect x="192" y="222" width="44" height="34" rx="2" fill={C.win} stroke={C.winLine} />
            <path d="M214 222v34M192 239h44" stroke={C.winLine} fill="none" />
          </g>
        )}

        {/* Поле панелей: активные «вырастают», остальные — призраки */}
        <g>
          {slots.map((s, i) => (
            <rect
              key={i}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={1.5}
              transform={s.rot ? `rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})` : undefined}
              className={cn("scene-panel", i >= active && "scene-panel--off")}
              fill={panelFill}
              stroke={panelStroke}
              strokeWidth="0.9"
            />
          ))}
        </g>

        {/* Тень затенения поверх панелей */}
        {shading !== "none" && (
          <path d={SHADOWS[install][shading === "heavy" ? "heavy" : "partial"]} fill={`rgba(34,39,46,${shading === "heavy" ? 0.22 : 0.12})`} />
        )}

        {/* Дерево — источник затенения */}
        {shading !== "none" && (
          <g opacity="0.9">
            {install === "ground" ? (
              <>
                <line x1="44" y1="262" x2="44" y2="218" stroke="#A99F8C" strokeWidth="4" />
                <circle cx="44" cy="196" r="20" fill={C.tree} />
                <circle cx="28" cy="208" r="13" fill={C.tree} opacity="0.85" />
                <circle cx="60" cy="208" r="13" fill={C.tree} opacity="0.85" />
              </>
            ) : (
              <>
                <line x1="108" y1="262" x2="108" y2="212" stroke="#A99F8C" strokeWidth="4.5" />
                <circle cx="108" cy="192" r="22" fill={C.tree} />
                <circle cx="90" cy="204" r="14" fill={C.tree} opacity="0.85" />
                <circle cx="126" cy="204" r="14" fill={C.tree} opacity="0.85" />
              </>
            )}
          </g>
        )}

        {/* Инвертор */}
        <g>
          <rect x={FLOWS[install].inv[0]} y={FLOWS[install].inv[1]} width={FLOWS[install].inv[2]} height={FLOWS[install].inv[3]} rx="3" fill="#FFFFFF" stroke={C.petrol} strokeWidth="1.3" />
          <path
            d={`M${FLOWS[install].inv[0] + 4} ${FLOWS[install].inv[1] + 16} q3 -7 6 0 q3 7 6 0 q3 -7 6 0`}
            fill="none"
            stroke={C.petrol}
            strokeWidth="1.2"
          />
          <text x={FLOWS[install].inv[0] + 13} y={FLOWS[install].inv[1] + 28} textAnchor="middle" className="svg-mono" fontSize="7" fill={C.muted}>
            ИНВ {result.composition.inverterKw}
          </text>
        </g>

        {/* АКБ */}
        {hasBattery && (
          <g>
            <rect x={478 - battW} y="216" width={battW} height="46" rx="4" fill="#F0F5F2" stroke={C.stable} strokeWidth="1.3" />
            <rect x={478 - battW + 5} y={258 - battLevelH} width={battW - 10} height={battLevelH} rx="2" fill="rgba(14,127,99,0.5)" />
            <text x={478 - battW / 2} y="209" textAnchor="middle" className="svg-mono" fontSize="8.5" fill={C.stable}>
              АКБ {Math.round(result.composition.batteryKwh)} кВт·ч
            </text>
          </g>
        )}

        {/* Генератор */}
        {hasGen && (
          <g>
            <rect x={genBox[0]} y={genBox[1]} width="48" height="34" rx="3" fill={C.wall} stroke={C.ink} strokeWidth="1.2" />
            <rect x={genBox[0] + 8} y={genBox[1] - 10} width="6" height="10" fill={C.wallLine} />
            <circle cx={genBox[0] + 24} cy={genBox[1] + 17} r="8" fill="none" stroke={C.ink} strokeWidth="1.2" />
            <line x1={genBox[0] + 24} y1={genBox[1] + 9} x2={genBox[0] + 24} y2={genBox[1] + 25} stroke={C.ink} strokeWidth="1.2" />
            <text x={genBox[0] + 24} y={genBox[1] - 16} textAnchor="middle" className="svg-mono" fontSize="8.5" fill={C.muted}>
              ГЕН {Math.round(result.composition.generatorKw ?? 0)} кВт
            </text>
          </g>
        )}

        {/* Сеть (режимы grid / hybrid) */}
        {showPylon && (
          <g>
            <line x1="100" y1="262" x2="100" y2="172" stroke={C.ink} strokeWidth="1.8" />
            <line x1="92" y1="192" x2="108" y2="192" stroke={C.ink} strokeWidth="1.2" />
            <line x1="94" y1="206" x2="106" y2="206" stroke={C.ink} strokeWidth="1.2" />
            <path d={PYLON_WIRE[install]} fill="none" stroke={C.ink} strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
            <text x="100" y="164" textAnchor="middle" className="svg-mono" fontSize="8.5" fill={C.muted}>
              СЕТЬ
            </text>
          </g>
        )}

        {/* Энергопоток: панели → инвертор (→ АКБ) */}
        <path d={FLOWS[install].pToInv} fill="none" stroke={C.amberSoft} strokeWidth="5" strokeLinecap="round" />
        <path d={FLOWS[install].pToInv} fill="none" stroke={C.amber} strokeWidth="1.5" className="energy-flow" />
        {hasBattery && (
          <>
            <path d={FLOWS[install].invToBatt} fill="none" stroke={C.amberSoft} strokeWidth="5" strokeLinecap="round" />
            <path d={FLOWS[install].invToBatt} fill="none" stroke={C.amber} strokeWidth="1.5" className="energy-flow" />
          </>
        )}

        {/* Подписи конструкции */}
        <text x={struct.capPos[0]} y={struct.capPos[1]} className="svg-mono" fontSize="9.5" letterSpacing="0.08em" fill={C.ink}>
          {struct.caption}
        </text>

        {/* Переполнение: панелей больше, чем влезает */}
        {extra > 0 && (
          <text x={struct.badgePos[0]} y={struct.badgePos[1]} textAnchor="middle" className="svg-mono" fontSize="9" fontWeight="700" fill={C.amberDeep}>
            {struct.extraNote(extra)}
          </text>
        )}

        {/* Компас ориентации панелей */}
        <g>
          <circle cx="492" cy="56" r="17" fill="#FFFFFF" stroke={C.wallLine} strokeWidth="1.2" />
          <text x="492" y="39" textAnchor="middle" className="svg-mono" fontSize="7.5" fill={C.ink}>С</text>
          <text x="492" y="79" textAnchor="middle" className="svg-mono" fontSize="7.5" fill={C.ink}>Ю</text>
          <text x="511" y="59" textAnchor="middle" className="svg-mono" fontSize="7.5" fill={C.ink}>В</text>
          <text x="473" y="59" textAnchor="middle" className="svg-mono" fontSize="7.5" fill={C.ink}>З</text>
          <g transform={`rotate(${ORIENT_AZIMUTH[input.orientation] - 180} 492 56)`}>
            <line x1="492" y1="56" x2="492" y2="68" stroke={C.amber} strokeWidth="2" strokeLinecap="round" />
            <circle cx="492" cy="68" r="2.2" fill={C.amber} />
          </g>
          <text x="492" y="96" textAnchor="middle" className="svg-mono" fontSize="8" fill={C.muted}>
            ПАНЕЛЬ → {ORIENT_SHORT[input.orientation]}
        </text>
        </g>
      </svg>

      {/* Живые показатели — те же числа, что в смете */}
      <div className={cn("mt-3.5 grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn("rounded-lg bg-secondary/40 px-2.5 py-1.5", s.accent && "border border-solar/30 bg-solar/10")}
          >
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "mt-0.5 text-[13px] font-semibold tabular-nums leading-tight",
                s.accent ? "text-[#9a5207]" : "text-foreground",
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
