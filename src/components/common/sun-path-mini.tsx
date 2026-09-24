"use client"

// №6 (доп. волна 3): миниатюра солнечного пути в карточке региона.
// Три статичные дуги — 21 июня / равноденствие / 21 декабря — по широте
// региона. Без анимации (32 карточки на странице): чистый SVG, тултипы
// с восходом/закатом и высотой солнца в полдень. Полярные день/ночь
// обрабатываются (Мурманск, Ямал).

import { useMemo } from "react"
import {
  SEASON_DAYS,
  dayCurve,
  dayWindow,
  fmtTime,
  regionLat,
  sunDeclination,
  type SunPoint,
} from "@/lib/calc/solar"
import type { RefRegion } from "@/lib/calc/types"

const W = 340
const HORIZON = 108
const ALT_K = 88
const rad = (d: number) => (d * Math.PI) / 180

const px = (az: number) => 10 + ((az % 360) / 360) * (W - 20)
const py = (alt: number) => HORIZON - Math.sin(rad(Math.max(0, alt))) * ALT_K

const pathOf = (curve: SunPoint[]) =>
  curve.map((p, i) => `${i ? "L" : "M"}${px(p.az).toFixed(1)} ${py(p.alt).toFixed(1)}`).join(" ")

export function SunPathMini({ region }: { region: RefRegion }) {
  const lat = regionLat(region)

  const arcs = useMemo(() => {
    const mk = (dayIdx: number) => {
      const dec = sunDeclination(dayIdx)
      const curve = dayCurve(lat, dec)
      const win = dayWindow(lat, dec)
      const noonAlt = Math.max(0, 90 - lat + dec)
      return { curve, win, noonAlt }
    }
    return {
      jun: mk(SEASON_DAYS.jun),
      equinox: mk(SEASON_DAYS.equinox),
      dec: mk(SEASON_DAYS.dec),
    }
  }, [lat])

  const a = Math.round(arcs.jun.noonAlt)
  const b = Math.round(arcs.equinox.noonAlt)
  const c = Math.round(arcs.dec.noonAlt)

  const tip = (title: string, win: ReturnType<typeof dayWindow>, alt: number) =>
    `${title} · полдень ${Math.round(alt)}°${
      win.kind === "normal" ? ` · восход ${fmtTime(win.rise)} · закат ${fmtTime(win.set)}` : ""
    }`

  const noonDot = (alt: number, fill: string, r = 3) => (
    <circle cx={px(180)} cy={py(alt)} r={r} fill={fill} />
  )

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Солнце в полдень · {lat.toFixed(1).replace(".", ",")}° с.ш.
      </p>
      <svg viewBox={`0 0 ${W} 124`} className="h-auto w-full" role="img" aria-label={`Дуги солнечного пути для ${region.name}: лето, равноденствие, зима`}>
        {/* Горизонт и стороны света */}
        <line x1="8" y1={HORIZON} x2={W - 8} y2={HORIZON} stroke="#C9C2AE" strokeWidth="1.2" />
        <text x="10" y={HORIZON + 12} className="svg-mono" fontSize="8" fill="#8A94A3">С</text>
        <text x={W - 16} y={HORIZON + 12} className="svg-mono" fontSize="8" fill="#8A94A3">Ю</text>

        {/* Дуги сезонов */}
        <path d={pathOf(arcs.jun.curve)} fill="none" stroke="rgba(232,148,10,0.55)" strokeWidth="1.6">
          <title>{tip("21 июня", arcs.jun.win, arcs.jun.noonAlt)}</title>
        </path>
        <path d={pathOf(arcs.equinox.curve)} fill="none" stroke="#98A2AE" strokeWidth="1.2">
          <title>{tip("21 марта / 23 сентября", arcs.equinox.win, arcs.equinox.noonAlt)}</title>
        </path>
        {arcs.dec.curve.length > 0 ? (
          <path d={pathOf(arcs.dec.curve)} fill="none" stroke="#C9C2AE" strokeWidth="1.2" strokeDasharray="4 3">
            <title>{tip("21 декабря", arcs.dec.win, arcs.dec.noonAlt)}</title>
          </path>
        ) : (
          <text x={W / 2} y={HORIZON - 8} textAnchor="middle" className="svg-mono" fontSize="8.5" fill="#8A94A3">
            в декабре — полярная ночь
          </text>
        )}

        {/* Полуденные точки */}
        {noonDot(arcs.jun.noonAlt, "#E8940A")}
        {noonDot(arcs.equinox.noonAlt, "#98A2AE", 2.5)}
        {arcs.dec.curve.length > 0 && noonDot(arcs.dec.noonAlt, "#A8ADB5", 2.5)}

        {/* Подпись высот */}
        <text x="12" y="14" className="svg-mono" fontSize="9.5" fill="#C2700A">
          июнь {a}° · март {b}°{arcs.dec.curve.length > 0 ? ` · дек ${c}°` : ""}
        </text>
      </svg>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
        Зимой солнце ниже — рост доли отражённого света и важность правильного наклона панелей.
      </p>
    </div>
  )
}
