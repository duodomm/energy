"use client"

// Концепт №6 «Изоинтерфейс» (волна 2 С10): солнечный путь региона.
// Три опорные дуги (21 июн / равноденствие / 21 дек) + дуга «сегодня»,
// по которой бежит точка солнца. Янтарные сегменты дуги «сегодня» — часы,
// когда лучи попадают на панель при выбранной ориентации и наклоне:
// выбрали «Восток» — подсветится утро, «Запад» — вечер.
// Астрономия честная (сферическая тригонометрия, solar.ts), облака
// уже сидят в PSH региона — здесь только геометрия неба.

import { useEffect, useMemo, useRef } from "react"
import { Compass } from "lucide-react"
import {
  INSTALL_TILT,
  ORIENT_AZIMUTH,
  ORIENT_SHORT,
  SEASON_DAYS,
  cosIncidence,
  dayCurve,
  dayOfYear,
  dayWindow,
  fmtTime,
  pointAtT,
  regionLat,
  sunDeclination,
  type SunPoint,
} from "@/lib/calc/solar"
import { ORIENT_K } from "@/lib/calc/constants"
import { useInView, useReducedMotion } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import type { InstallType, Orientation, RefRegion } from "@/lib/calc/types"

const CX = 300
const HORIZON = 205
const ALT_K = 170
const AZ_K = 1.93

const rad = (d: number) => (d * Math.PI) / 180
const px = (az: number) => CX + (az - 180) * AZ_K
const py = (alt: number) => HORIZON - Math.sin(rad(alt)) * ALT_K

const pathOf = (curve: SunPoint[]) =>
  curve.map((p, i) => `${i ? "L" : "M"}${px(p.az).toFixed(1)} ${py(p.alt).toFixed(1)}`).join(" ")

export function SunPathCard({
  region,
  orientation,
  installType,
  className,
}: {
  region: RefRegion
  orientation: Orientation
  installType: InstallType
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(wrapRef)
  const reduced = useReducedMotion()

  const dotRef = useRef<SVGCircleElement | null>(null)
  const haloRef = useRef<SVGCircleElement | null>(null)
  const rayRef = useRef<SVGLineElement | null>(null)
  const timeRef = useRef<SVGTextElement | null>(null)

  const lat = regionLat(region)
  const tilt = INSTALL_TILT[installType]
  const panelAz = ORIENT_AZIMUTH[orientation]

  const today = useMemo(() => {
    const n = dayOfYear(new Date())
    return { n, dec: sunDeclination(n) }
  }, [])

  const arcs = useMemo(
    () => ({
      jun: dayCurve(lat, sunDeclination(SEASON_DAYS.jun)),
      equinox: dayCurve(lat, sunDeclination(SEASON_DAYS.equinox)),
      dec: dayCurve(lat, sunDeclination(SEASON_DAYS.dec)),
    }),
    [lat],
  )

  const todayCurve = useMemo(() => dayCurve(lat, today.dec), [lat, today])
  const todayWin = useMemo(() => dayWindow(lat, today.dec), [lat, today])

  // Полдень — статичная стартовая позиция точки (SSR-безопасно, детерминировано)
  const noon = todayCurve.length ? pointAtT(todayCurve, 12) : null
  const noonX = noon ? px(noon.az) : CX
  const noonY = noon ? py(noon.az) : HORIZON - 60

  // «Захваченные» панелью сегменты дуги «сегодня»
  const segs = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; k: number }[] = []
    for (let i = 0; i + 1 < todayCurve.length; i += 2) {
      const a = todayCurve[i]
      const b = todayCurve[Math.min(i + 2, todayCurve.length - 1)]
      const mid = pointAtT(todayCurve, (a.t + b.t) / 2)
      const k = Math.max(0, cosIncidence(mid.alt, mid.az, tilt, panelAz))
      if (k > 0.04) out.push({ x1: px(a.az), y1: py(a.alt), x2: px(b.az), y2: py(b.alt), k })
    }
    return out
  }, [todayCurve, tilt, panelAz])

  // Живая точка солнца: бежит по дуге «сегодня»; вне вьюпорта и при
  // prefers-reduced-motion — замирает в полдень
  useEffect(() => {
    if (!inView || todayCurve.length < 2) return
    const setSun = (t: number) => {
      const p = pointAtT(todayCurve, t)
      const x = px(p.az)
      const y = py(p.alt)
      dotRef.current?.setAttribute("cx", x.toFixed(1))
      dotRef.current?.setAttribute("cy", y.toFixed(1))
      if (haloRef.current) {
        haloRef.current.setAttribute("cx", x.toFixed(1))
        haloRef.current.setAttribute("cy", y.toFixed(1))
      }
      if (rayRef.current) {
        rayRef.current.setAttribute("x1", x.toFixed(1))
        rayRef.current.setAttribute("y1", y.toFixed(1))
        const ci = cosIncidence(p.alt, p.az, tilt, panelAz)
        rayRef.current.setAttribute("stroke", ci > 0 ? "rgba(232,148,10,0.55)" : "rgba(138,148,163,0.28)")
      }
      if (timeRef.current) {
        timeRef.current.textContent = `${fmtTime(t)} · высота ${Math.round(p.alt)}°`
      }
    }
    if (reduced) {
      setSun(12)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const DUR = 12000
    const rise = todayCurve[0].t
    const span = todayCurve[todayCurve.length - 1].t - rise || 1
    const loop = (now: number) => {
      const f = ((now - t0) % DUR) / DUR
      setSun(rise + f * span)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, todayCurve, tilt, panelAz])

  // Метки часов на горизонте — по равноденственной дуге
  const hourTicks = useMemo(() => {
    const eq = arcs.equinox
    return [6, 9, 12, 15, 18].map((h) => {
      const p = pointAtT(eq, h)
      return { h, x: px(p.az) }
    })
  }, [arcs])

  const endLabel = (curve: SunPoint[]) => {
    const vis = curve.filter((p) => px(p.az) >= 55 && px(p.az) <= 540)
    if (!vis.length) return null
    const p = vis[vis.length - 1]
    return { x: px(p.az) + 7, y: py(p.alt) - 4 }
  }
  const junEnd = endLabel(arcs.jun)
  const eqEnd = endLabel(arcs.equinox)
  const decEnd = endLabel(arcs.dec)

  const pct = Math.round(ORIENT_K[orientation] * 100)
  const winText =
    todayWin.kind === "polar-day"
      ? "Полярный день — солнце не заходит"
      : todayWin.kind === "polar-night"
        ? "Полярная ночь — генерация этого дня ≈ 0"
        : `Восход ${fmtTime(todayWin.rise)} · закат ${fmtTime(todayWin.set)} · солнечное время`

  const tiltVisual = tilt * 0.45

  return (
    <div ref={wrapRef} className={cn("card-premium p-4 md:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="stamp-label flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-primary" />
          Солнечный путь региона
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {region.name} · {lat.toFixed(1).replace(".", ",")}° с.ш.
        </span>
      </div>

      <svg viewBox="0 0 600 240" className="h-auto w-full" role="img" aria-label={`Дуги солнечного пути для ${region.name}: лето, равноденствие, зима и сегодня`}>
        {/* Горизонт */}
        <line x1="28" y1={HORIZON} x2="572" y2={HORIZON} stroke="#C9C2AE" strokeWidth="1.3" />
        {hourTicks.map((t) => (
          <g key={t.h}>
            <line x1={t.x} y1={HORIZON} x2={t.x} y2={HORIZON - 4} stroke="#C9C2AE" strokeWidth="1" />
            {(t.h === 6 || t.h === 18) && (
              <text x={t.x} y={HORIZON + 14} textAnchor="middle" className="svg-mono" fontSize="8.5" fill="#8A94A3">
                {t.h === 6 ? "В" : "З"}
              </text>
            )}
            {(t.h === 9 || t.h === 12 || t.h === 15) && (
              <text x={t.x} y={HORIZON + 14} textAnchor="middle" className="svg-mono" fontSize="8.5" fill="#8A94A3">
                {String(t.h).padStart(2, "0")}:00
              </text>
            )}
          </g>
        ))}

        {/* Опорные дуги сезонов */}
        <path d={pathOf(arcs.jun)} fill="none" stroke="rgba(232,148,10,0.4)" strokeWidth="1.4" />
        <path d={pathOf(arcs.equinox)} fill="none" stroke="#98A2AE" strokeWidth="1.2" />
        {arcs.dec.length > 0 && (
          <path d={pathOf(arcs.dec)} fill="none" stroke="#C9C2AE" strokeWidth="1.2" strokeDasharray="4 3" />
        )}

        {/* Подписи дуг */}
        {junEnd && (
          <text x={junEnd.x} y={junEnd.y} className="svg-mono" fontSize="8.5" fill="rgba(180,110,10,0.85)">21 июн</text>
        )}
        {eqEnd && (
          <text x={eqEnd.x} y={eqEnd.y} className="svg-mono" fontSize="8.5" fill="#8A94A3">21 мар</text>
        )}
        {decEnd && (
          <text x={decEnd.x} y={decEnd.y} className="svg-mono" fontSize="8.5" fill="#A8ADB5">21 дек</text>
        )}

        {/* Дуга «сегодня»: базовая + янтарный «захват» панелью */}
        {todayCurve.length > 0 && (
          <>
            <path d={pathOf(todayCurve)} fill="none" stroke="#B9B2A2" strokeWidth="1.4" />
            {segs.map((s, i) => (
              <line
                key={i}
                x1={s.x1.toFixed(1)}
                y1={s.y1.toFixed(1)}
                x2={s.x2.toFixed(1)}
                y2={s.y2.toFixed(1)}
                stroke="#E8940A"
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity={Math.min(1, 0.3 + s.k * 0.75).toFixed(2)}
              />
            ))}
          </>
        )}

        {/* Панель в центре (наклон и сторона — от шага 3) */}
        <g>
          <rect
            x="272"
            y="186"
            width="56"
            height="8"
            rx="2"
            transform={`rotate(${-tiltVisual} 300 190)`}
            fill="#1E2E38"
            stroke="#14657B"
            strokeWidth="1"
          />
        </g>

        {/* Луч солнце → панель */}
        {todayCurve.length > 0 && (
          <line
            ref={rayRef}
            x1={noonX}
            y1={noonY}
            x2="300"
            y2="190"
            stroke="rgba(138,148,163,0.28)"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
        )}

        {/* Точка солнца */}
        {todayCurve.length > 0 && (
          <g>
            <circle ref={haloRef} cx={noonX} cy={noonY} r="11" fill="rgba(232,148,10,0.22)" className="sun-dot-halo" />
            <circle ref={dotRef} cx={noonX} cy={noonY} r="5" fill="#E8940A" />
          </g>
        )}

        {/* Текущее время и высота */}
        <text ref={timeRef} x="34" y="30" className="svg-mono" fontSize="10" fill="#C2700A">
          {noon ? `12:00 · высота ${Math.round(noon.alt)}°` : "—"}
        </text>

        {/* Мини-компас ориентации панелей */}
        <g>
          <circle cx="536" cy="34" r="15" fill="#FFFFFF" stroke="#C9C2AE" strokeWidth="1.1" />
          <text x="536" y="23" textAnchor="middle" className="svg-mono" fontSize="6.5" fill="#8A94A3">С</text>
          <text x="536" y="52" textAnchor="middle" className="svg-mono" fontSize="6.5" fill="#8A94A3">Ю</text>
          <text x="547" y="37" textAnchor="middle" className="svg-mono" fontSize="6.5" fill="#8A94A3">В</text>
          <text x="525" y="37" textAnchor="middle" className="svg-mono" fontSize="6.5" fill="#8A94A3">З</text>
          <g transform={`rotate(${panelAz - 180} 536 34)`}>
            <line x1="536" y1="34" x2="536" y2="43" stroke="#E8940A" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="536" cy="43" r="1.8" fill="#E8940A" />
          </g>
          <text x="536" y="68" textAnchor="middle" className="svg-mono" fontSize="8" fill="#6C7077">
            → {ORIENT_SHORT[orientation]}
          </text>
        </g>
      </svg>

      {/* Легенда и сводка */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-5 rounded-full" style={{ background: "#E8940A" }} />
          сегодня — янтарное = лучи на панелях
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-5 rounded-full" style={{ background: "rgba(232,148,10,0.4)" }} />
          21 июн
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-5 rounded-full" style={{ background: "#98A2AE" }} />
          21 мар / 23 сен
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="inline-block h-[3px] w-5 rounded-full"
            style={{ background: "repeating-linear-gradient(90deg, #C9C2AE 0 4px, transparent 4px 7px)" }}
          />
          21 дек
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{winText}</span>
        <span className="rounded-full border border-solar/40 bg-solar/10 px-2.5 py-1 font-semibold tabular-nums text-[#9a5207]">
          {ORIENT_SHORT[orientation]} · {pct}%{orientation === "south" ? " — максимум" : " от южной"}
        </span>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Наклон панелей в этой схеме — {tilt}° ({installType === "roof_slope" ? "скат" : installType === "roof_flat" ? "балласт" : installType === "ground" ? "каркас" : "фасад"}).
        Дуги — астрономия без облаков; облачность региона уже учтена в PSH расчёта.
      </p>
    </div>
  )
}
