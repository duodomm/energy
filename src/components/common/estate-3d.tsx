"use client"

// Концепт №7 «3D-усадьба» (волна 3 С10 «Энергосистема», специя).
// Самописный canvas-рендер с painter's algorithm — ноль зависимостей (~7 КБ
// вместо 600 КБ Three.js): дом 4×5 м, южный скат 35° с панелями, второй ряд
// на земле при переполнении ската, вращение мышью/пальцем, сезон «лето/зима»
// меняет высоту солнца и длину тени.
//
// Дисциплина CWV: рендер только в вьюпорте (useInView), авто-вращение
// отключается при prefers-reduced-motion (рисуем по изменению состояния),
// canvas фикс. высоты — нет CLS. Числа честные: панели 450 Вт, выработка
// ~1050 кВт·ч/кВт·год для средней полосы — точный расчёт в калькуляторе.

import { useEffect, useRef, useState } from "react"
import { Sun, Snowflake, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInView, useReducedMotion } from "@/hooks/use-in-view"
import { trackGoal } from "@/lib/analytics"
import { navigate } from "@/lib/router"

type Season = "summer" | "winter"
interface P3 {
  x: number
  y: number
  z: number
}
const P = (x: number, y: number, z: number): P3 => ({ x, y, z })

interface Quad {
  pts: P3[]
  base: string
  n: P3
  stroke?: string
  kind?: "house" | "panel"
}

const norm = (v: P3): P3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}
const cross = (a: P3, b: P3): P3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

// Солнце по сезонам: летом высоко, зимой низко над южным горизонтом
const SUN: Record<Season, P3> = {
  summer: norm(P(0.28, 0.85, 0.45)),
  winter: norm(P(0.38, 0.38, 0.6)),
}

// Геометрия дома: 4×5 м, конёк вдоль X, южный скат 35°
const EAVE = 2.6
const RIDGE = 4.0

function houseQuads(): Quad[] {
  const q: Quad[] = []
  const wallS = "#EFEADC"
  const wallN = "#D9D3C1"
  const roofS = "#E2DBCA"
  const roofN = "#CCC5B2"
  const gable = "#E7E1D0"
  q.push({ pts: [P(-2, 0, 2.5), P(2, 0, 2.5), P(2, EAVE, 2.5), P(-2, EAVE, 2.5)], base: wallS, n: P(0, 0, 1) })
  q.push({ pts: [P(-2, 0, -2.5), P(-2, EAVE, -2.5), P(2, EAVE, -2.5), P(2, 0, -2.5)], base: wallN, n: P(0, 0, -1) })
  q.push({ pts: [P(2, 0, 2.5), P(2, 0, -2.5), P(2, EAVE, -2.5), P(2, EAVE, 2.5)], base: "#E4DECE", n: P(1, 0, 0) })
  q.push({ pts: [P(-2, 0, -2.5), P(-2, 0, 2.5), P(-2, EAVE, 2.5), P(-2, EAVE, -2.5)], base: wallN, n: P(-1, 0, 0) })
  q.push({ pts: [P(-2, EAVE, 2.5), P(2, EAVE, 2.5), P(2, RIDGE, 0), P(-2, RIDGE, 0)], base: roofS, n: P(0, 0.87, 0.49) })
  q.push({ pts: [P(-2, EAVE, -2.5), P(-2, RIDGE, 0), P(2, RIDGE, 0), P(2, EAVE, -2.5)], base: roofN, n: P(0, 0.87, -0.49) })
  q.push({ pts: [P(2, EAVE, 2.5), P(2, RIDGE, 0), P(2, EAVE, -2.5)], base: gable, n: P(1, 0, 0) })
  q.push({ pts: [P(-2, EAVE, -2.5), P(-2, RIDGE, 0), P(-2, EAVE, 2.5)], base: gable, n: P(-1, 0, 0) })
  q.push({ pts: [P(0.7, 0, 2.53), P(1.5, 0, 2.53), P(1.5, 2.05, 2.53), P(0.7, 2.05, 2.53)], base: "#C9C2AE", n: P(0, 0, 1), kind: "house" })
  q.push({ pts: [P(-1.55, 0.9, 2.53), P(-0.55, 0.9, 2.53), P(-0.55, 1.9, 2.53), P(-1.55, 1.9, 2.53)], base: "#EAF2F5", n: P(0, 0, 1), kind: "house", stroke: "#B9C6CE" })
  return q
}

// Панели на южном скате: 8 колонок × 2 ряда (16 шт), далее — ряд на земле
function onSlope(u: number, v: number, off: number): P3 {
  return P(u, EAVE + 0.4885 * v + 0.8725 * off, 2.5 - 0.8725 * v + 0.4885 * off)
}
function roofPanelQuad(cx: number, v: number): Quad {
  const hw = 0.19
  const hv = 0.55
  return {
    pts: [onSlope(cx - hw, v, 0.09), onSlope(cx + hw, v, 0.09), onSlope(cx + hw, v + hv, 0.09), onSlope(cx - hw, v + hv, 0.09)],
    base: "#1E2E38",
    n: P(0, 0.8725, 0.4885),
    stroke: "#14657B",
    kind: "panel",
  }
}
function groundPanelQuad(cx: number): Quad {
  const hw = 0.19
  // Панель смотрит НА ЮГ (+z): нижний (южный) край ниже, верхний (северный) выше
  const pts = [P(cx - hw, 0.12, 4.75), P(cx + hw, 0.12, 4.75), P(cx + hw, 1.0, 3.85), P(cx - hw, 1.0, 3.85)]
  return { pts, base: "#1E2E38", n: norm(P(0, 0.716, 0.699)), stroke: "#14657B", kind: "panel" }
}

const ROOF_CAPACITY = 16
const GROUND_CAPACITY = 8

// Режимы встраивания:
//  • витрина (по умолчанию): внутренний слайдер 2–10 кВт + CTA в калькулятор
//  • дачный калькулятор: powerKw (контроль от приборов, слайдер скрыт, каркас вперёд)
//  • кейс-статья: initialKw из параметров кейса, слайдер-«поиграть мощностью»
interface Estate3DProps {
  className?: string
  /** Контролируемая мощность (кВт) — сцена следует за внешним состоянием */
  powerKw?: number
  onPowerKwChange?: (kw: number) => void
  /** Стартовое значение слайдера в свободном режиме */
  initialKw?: number
  minKw?: number
  maxKw?: number
  /** Сначала заполнять наземный каркас (дачи/кейсы с ground-монтажом) */
  groundFirst?: boolean
  showSlider?: boolean
  showCta?: boolean
  hudTitle?: string
  noteText?: string
}

export function Estate3D({
  className,
  powerKw,
  onPowerKwChange,
  initialKw = 6,
  minKw = 2,
  maxKw = 10,
  groundFirst = false,
  showSlider = true,
  showCta = true,
  hudTitle = "ОБЪЕКТ: ДОМ 10×6 м",
  noteText,
}: Estate3DProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const yawRef = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(wrapRef)
  const reduced = useReducedMotion()

  const [kwLocal, setKwLocal] = useState(initialKw)
  const kw = powerKw ?? kwLocal
  const [season, setSeason] = useState<Season>("summer")
  const drawRef = useRef<(() => void) | null>(null)

  const seasonRef = useRef(season)
  useEffect(() => {
    seasonRef.current = season
  }, [season])

  const panelTotal = Math.round((kw * 1000) / 450)
  const roofN = groundFirst
    ? Math.min(Math.max(0, panelTotal - GROUND_CAPACITY), ROOF_CAPACITY)
    : Math.min(panelTotal, ROOF_CAPACITY)
  const groundN = groundFirst
    ? Math.min(panelTotal, GROUND_CAPACITY)
    : Math.min(Math.max(0, panelTotal - ROOF_CAPACITY), GROUND_CAPACITY)
  const genY = Math.round(kw * 1050)

  // Распределение панелей для отрисовщика (скат/каркас зависит от режима)
  const distRef = useRef({ roof: roofN, ground: groundN })
  useEffect(() => {
    distRef.current = { roof: roofN, ground: groundN }
  }, [roofN, groundN])

  useEffect(() => {
    const cv = cvRef.current
    const wrap = wrapRef.current
    if (!cv || !wrap) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    let yaw = 3.64
    let restYaw = 3.64
    let pitch = 0.44
    let drag = false
    let lx = 0
    let ly = 0
    let idle = 0
    let raf = 0

    const resize = () => {
      const r = wrap.getBoundingClientRect()
      W = Math.max(300, r.width)
      H = Math.max(220, r.height)
      cv.width = Math.round(W * DPR)
      cv.height = Math.round(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const house = houseQuads()

    const project = (p: P3) => {
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const x = p.x * cy + p.z * sy
      const z = -p.x * sy + p.z * cy
      const y = p.y - 1.8
      const y2 = y * cp + z * sp
      const z2 = z * cp - y * sp
      const f = Math.min(W, H) * 1.5
      const dz = z2 + 9
      return { x: W / 2 + (f * x) / dz, y: H * 0.52 - (f * y2) / dz, z: z2 }
    }

    const shade = (hex: string, br: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const k = 0.72 + br * 0.5
      return `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(g * k))},${Math.min(255, Math.round(b * k))})`
    }

    // Выпуклая оболочка точек (для полигона тени)
    const hull = (pts: { x: number; y: number }[]) => {
      const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y)
      const cross2 = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
        (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
      const lower: typeof p = []
      for (const pt of p) {
        while (lower.length >= 2 && cross2(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop()
        lower.push(pt)
      }
      const upper: typeof p = []
      for (let i = p.length - 1; i >= 0; i--) {
        const pt = p[i]
        while (upper.length >= 2 && cross2(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop()
        upper.push(pt)
      }
      return lower.slice(0, -1).concat(upper.slice(0, -1))
    }

    const draw = () => {
      const winter = seasonRef.current === "winter"
      const L = SUN[winter ? "winter" : "summer"]

      // Небо
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      if (winter) {
        bg.addColorStop(0, "#fdfcf9")
        bg.addColorStop(1, "#efede4")
      } else {
        bg.addColorStop(0, "#f2efe4")
        bg.addColorStop(1, "#eae5d6")
      }
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)


      // Земля-сетка
      ctx.strokeStyle = winter ? "rgba(120,130,145,0.12)" : "rgba(20,101,123,0.11)"
      ctx.lineWidth = 1
      for (let gi = -4; gi <= 6; gi++) {
        const a = project(P(gi, 0, -4))
        const b = project(P(gi, 0, 6))
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        const c2 = project(P(-4, 0, gi))
        const d2 = project(P(4, 0, gi))
        ctx.beginPath()
        ctx.moveTo(c2.x, c2.y)
        ctx.lineTo(d2.x, d2.y)
        ctx.stroke()
      }

      // Тень дома: проекция контура вдоль L на землю
      const t = (p: P3) => {
        const s = p.y / L.y
        return project(P(p.x - L.x * s, 0.01, p.z - L.z * s))
      }
      const shadowPts = [
        P(-2, EAVE, 2.5), P(2, EAVE, 2.5), P(-2, RIDGE, 0), P(2, RIDGE, 0),
        P(-2, 0, 2.5), P(2, 0, 2.5), P(-2, 0, -2.5), P(2, 0, -2.5),
      ].map(t)
      const hullPts = hull(shadowPts)
      if (hullPts.length > 2) {
        ctx.beginPath()
        ctx.moveTo(hullPts[0].x, hullPts[0].y)
        for (let i = 1; i < hullPts.length; i++) ctx.lineTo(hullPts[i].x, hullPts[i].y)
        ctx.closePath()
        // Мягкий край тени (filter может не поддерживаться — тогда обычная заливка)
        try {
          ctx.filter = "blur(6px)"
        } catch { /* ignore */ }
        ctx.fillStyle = winter ? "rgba(34,39,46,0.2)" : "rgba(34,39,46,0.14)"
        ctx.fill()
        ctx.filter = "none"
      }

      // Панели: скат + каркас — распределение считает компонент (groundFirst)
      const roofCount = distRef.current.roof
      const groundCount = distRef.current.ground
      const quads = [...house]
      for (let c = 0; c < 8; c++) {
        const cx = -1.5 + c * 0.43
        if (c * 2 < roofCount) quads.push(roofPanelQuad(cx, 0.55))
        if (c * 2 + 1 < roofCount) quads.push(roofPanelQuad(cx, 1.75))
      }
      for (let c = 0; c < groundCount; c++) {
        quads.push(groundPanelQuad(-1.5 + c * 0.43))
      }

      const all = quads.map((q) => ({
        q,
        z: q.pts.reduce((s, p) => s + project(p).z, 0) / q.pts.length,
      }))
      all.sort((a, b) => b.z - a.z)

      // Ножки наземных панелей — под верхним (северным) краем
      const legs: [P3, P3][] = []
      for (let c = 0; c < groundCount; c++) {
        const cx = -1.5 + c * 0.43
        legs.push([P(cx - 0.19, 1.0, 3.85), P(cx - 0.19, 0, 3.85)])
        legs.push([P(cx + 0.19, 1.0, 3.85), P(cx + 0.19, 0, 3.85)])
      }

      all.forEach(({ q }) => {
        const ps = q.pts.map(project)
        const br = Math.max(0, q.n.x * L.x + q.n.y * L.y + q.n.z * L.z)
        ctx.beginPath()
        ctx.moveTo(ps[0].x, ps[0].y)
        for (let i = 1; i < ps.length; i++) ctx.lineTo(ps[i].x, ps[i].y)
        ctx.closePath()
        ctx.fillStyle = shade(q.base, br)
        ctx.fill()
        if (q.stroke) {
          ctx.strokeStyle = q.stroke
          ctx.lineWidth = 1.2
          ctx.stroke()
        } else {
          ctx.strokeStyle = "rgba(34,39,46,0.22)"
          ctx.lineWidth = 1
          ctx.stroke()
        }
        // Панель, поймавшая солнце, получает янтарный кант
        if (q.kind === "panel" && br > 0.72) {
          ctx.strokeStyle = "rgba(232,148,10,0.9)"
          ctx.lineWidth = 1.8
          ctx.stroke()
        }
      })

      // Ножки
      ctx.strokeStyle = "rgba(34,39,46,0.35)"
      ctx.lineWidth = 1.2
      legs.forEach(([a, b]) => {
        const pa = project(a)
        const pb = project(b)
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      })

      if (yawRef.current) {
        yawRef.current.textContent = Math.round((yaw * 57.3) % 360) + "°"
      }

      // Солнце — экранная метка, а не 3D-точка: при вращении сцены свет (и тени)
      // остаётся на юге, а «солнце» не прыгает по экрану. Высота метки — высота
      // солнца в сезон (лето ~58°, зима ~29°)
      {
        const winter = seasonRef.current === "winter"
        const sx = W - 96
        const sy = winter ? Math.round(H * 0.34) : Math.round(H * 0.16)
        const elev = winter ? "29°" : "58°"
        const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 46)
        g.addColorStop(0, winter ? "rgba(255,226,150,0.75)" : "rgba(255,222,140,0.95)")
        g.addColorStop(0.3, "rgba(255,176,32,0.4)")
        g.addColorStop(1, "rgba(255,176,32,0)")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sx, sy, 46, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = winter ? "rgba(200,150,60,0.55)" : "rgba(232,148,10,0.6)"
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(sx, sy, 11, 0, Math.PI * 2)
        ctx.stroke()
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(sx + Math.cos(a) * 15, sy + Math.sin(a) * 15)
          ctx.lineTo(sx + Math.cos(a) * 20, sy + Math.sin(a) * 20)
          ctx.stroke()
        }
        ctx.font = "9.5px ui-monospace, SFMono-Regular, Menlo, monospace"
        ctx.fillStyle = "#6C7077"
        ctx.textAlign = "center"
        ctx.fillText("СОЛНЦЕ · ЮГ", sx, sy + 34)
        ctx.fillText(elev + " над горизонтом", sx, sy + 46)
        ctx.textAlign = "left"
      }
    }

    const loop = (now: number) => {
      if (!inView) {
        raf = 0
        return
      }
      if (!drag) {
        idle++
        // Вместо полного вращения — мягкое покачивание ±0.09 рад вокруг точки
        // отдыха: южный скат с панелями всегда в кадре, солнце не «прыгает»
        if (idle > 240) {
          const k = Math.min(1, (idle - 240) / 180)
          yaw = restYaw + Math.sin(now * 0.0006) * 0.09 * k
        }
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    const down = (x: number, y: number) => {
      drag = true
      lx = x
      ly = y
      idle = 0
    }
    const move = (x: number, y: number) => {
      if (!drag) return
      yaw += (x - lx) * 0.008
      pitch = Math.max(0.18, Math.min(1.1, pitch - (y - ly) * 0.006))
      lx = x
      ly = y
      idle = 0
    }
    const stop = () => {
      drag = false
      restYaw = yaw
    }

    const onMDown = (e: MouseEvent) => down(e.offsetX, e.offsetY)
    const onMMove = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect()
      move(e.clientX - r.left, e.clientY - r.top)
    }
    const onTStart = (e: TouchEvent) => {
      const t0 = e.touches[0]
      const r = cv.getBoundingClientRect()
      down(t0.clientX - r.left, t0.clientY - r.top)
    }
    const onTMove = (e: TouchEvent) => {
      const t0 = e.touches[0]
      const r = cv.getBoundingClientRect()
      move(t0.clientX - r.left, t0.clientY - r.top)
    }

    cv.addEventListener("mousedown", onMDown)
    window.addEventListener("mousemove", onMMove)
    window.addEventListener("mouseup", stop)
    cv.addEventListener("touchstart", onTStart, { passive: true })
    cv.addEventListener("touchmove", onTMove, { passive: true })
    cv.addEventListener("touchend", stop)

    if (reduced) {
      // Без авто-вращения: один статичный кадр; перерисовка при смене kw/сезона
      draw()
      drawRef.current = draw
    } else if (inView) {
      raf = requestAnimationFrame(loop)
    } else {
      drawRef.current = draw
    }

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      cv.removeEventListener("mousedown", onMDown)
      window.removeEventListener("mousemove", onMMove)
      window.removeEventListener("mouseup", stop)
      cv.removeEventListener("touchstart", onTStart)
      cv.removeEventListener("touchmove", onTMove)
      cv.removeEventListener("touchend", stop)
    }
  }, [inView, reduced])

  // При reduced-motion (или вне вьюпорта): перерисовать при смене kw/сезона
  useEffect(() => {
    drawRef.current?.()
  }, [kw, season, reduced])

  return (
    <div className={className}>
      <div ref={wrapRef} className="relative h-[300px] overflow-hidden rounded-2xl border border-border bg-card sm:h-[360px] md:h-[420px]">
        <canvas ref={cvRef} className="block h-full w-full cursor-grab active:cursor-grabbing" aria-label="3D-сцена: дом с солнечными панелями, можно вращать мышью" role="img" />
        <div className="svg-mono pointer-events-none absolute left-3.5 top-3 text-[10.5px] leading-relaxed text-muted-foreground">
          {hudTitle}
          <br />
          {groundFirst ? (
            <>
              КАРКАС 35° ЮГ · <b className="font-semibold text-foreground">{groundN} ПАНЕЛЕЙ</b>
              {roofN > 0 && (
                <>
                  <br />+ <b className="font-semibold text-foreground">{roofN}</b> НА СКАТЕ
                </>
              )}
            </>
          ) : (
            <>
              СКАТ 35° ЮГ · <b className="font-semibold text-foreground">{roofN} ПАНЕЛЕЙ</b>
              {groundN > 0 && (
                <>
                  <br />+ <b className="font-semibold text-foreground">{groundN}</b> НА КАРКАСЕ
                </>
              )}
            </>
          )}
        </div>
        <span className="svg-mono pointer-events-none absolute right-3.5 top-3 rounded-full border border-border bg-card/85 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          YAW <b ref={yawRef} className="font-semibold text-foreground">209°</b> · тяните мышью
        </span>
        <span className="pointer-events-none absolute bottom-3 left-3.5 flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          <Sun className="h-3 w-3 text-solar" />
          солнце всегда на юге — вращайте сцену, свет не меняется
        </span>
      </div>

      {/* Управление сценой */}
      <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="card-premium px-4 py-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Мощность станции</span>
            <span className="font-semibold tabular-nums">
              {kw.toLocaleString("ru-RU")} кВт · {panelTotal} панелей × 450 Вт
            </span>
          </div>
          {showSlider ? (
            <>
              <input
                type="range"
                min={minKw}
                max={maxKw}
                step={0.5}
                value={kw}
                style={{ "--p": `${((kw - minKw) / (maxKw - minKw)) * 100}%` } as React.CSSProperties}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (onPowerKwChange) onPowerKwChange(v)
                  else setKwLocal(v)
                }}
                onMouseUp={() => trackGoal("estate3d_interact", { kw })}
                onTouchEnd={() => trackGoal("estate3d_interact", { kw })}
                className="estate-range mt-3"
                aria-label="Мощность станции, кВт"
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Ориентир выработки: ~{genY.toLocaleString("ru-RU")} кВт·ч/год в средней полосе.
                Точно — по PSH вашего региона в калькуляторе.
              </p>
            </>
          ) : (
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              {noteText ??
                "Панели подстраиваются под отмеченные приборы: отметьте бойлер — станция подрастёт."}
            </p>
          )}
        </div>
        <div className="card-premium flex flex-col justify-between px-4 py-3.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSeason("summer"); trackGoal("estate3d_interact", { season: "summer" }) }}
              className={`chip flex-1 justify-center gap-1.5 px-3 py-2 text-xs ${season === "summer" ? "chip-active" : ""}`}
            >
              <Sun className="h-4 w-4" /> Лето · высокое солнце
            </button>
            <button
              type="button"
              onClick={() => { setSeason("winter"); trackGoal("estate3d_interact", { season: "winter" }) }}
              className={`chip flex-1 justify-center gap-1.5 px-3 py-2 text-xs ${season === "winter" ? "chip-active" : ""}`}
            >
              <Snowflake className="h-4 w-4" /> Зима · низкое солнце
            </button>
          </div>
          {showCta && (
            <Button
              size="sm"
              className="mt-3 w-full bg-gradient-solar text-primary-foreground hover:opacity-95"
              onClick={() => navigate("#/kalkulyator")}
            >
              Считать точно в калькуляторе <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
