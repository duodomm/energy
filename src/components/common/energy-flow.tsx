"use client"

// Концепт №2 «Энергопоток» (волна 3 С10 «Энергосистема», специя ≤10% площади).
// Тёмная сцена-полоса витрины: солнце → панели → инвертор → АКБ/дом.
// Частицы идут по траекториям: янтарные — дневная генерация, бирюзовые —
// разряд АКБ вечером. Демонстрация физики станции, не расчёт.
//
// Дисциплина CWV: canvas с фикс. высотой (нет CLS), ≤120 частиц, rAF с паузой
// вне вьюпорта (useInView), prefers-reduced-motion → статичный кадр «полдень»,
// DPR ≤ 2. Ноль ассетов. Данные KPI — условные (пометка в подписи).

import { useEffect, useRef } from "react"
import { useInView, useReducedMotion } from "@/hooks/use-in-view"

const RAD = Math.PI * 2

interface Seg {
  a: { x: number; y: number }
  b: { x: number; y: number }
  cp: { x: number; y: number }
  col: string
  next: number[]
}

interface P {
  seg: number
  t: number
  sp: number
  r: number
  drift: number
}

export function EnergyFlowStrip({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(wrapRef)
  const reduced = useReducedMotion()

  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const capRef = useRef<HTMLSpanElement | null>(null)
  const battRef = useRef<HTMLSpanElement | null>(null)
  const modeRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const cv = cvRef.current
    const wrap = wrapRef.current
    if (!cv || !wrap) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    let redrawStatic: (() => void) | null = null

    const resize = () => {
      const r = wrap.getBoundingClientRect()
      W = Math.max(280, r.width)
      H = Math.max(180, r.height)
      cv.width = Math.round(W * DPR)
      cv.height = Math.round(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      redrawStatic?.()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    // Узлы схемы в относительных координатах
    const nodes = () => ({
      s: { x: 0.14 * W, y: 0.18 * H },
      p: { x: 0.17 * W, y: 0.68 * H },
      i: { x: 0.47 * W, y: 0.5 * H },
      b: { x: 0.43 * W, y: 0.86 * H },
      h: { x: 0.85 * W, y: 0.4 * H },
    })

    // Траектории: солнце→панели, панели→инвертор, инвертор→дом, инвертор→АКБ, АКБ→дом (вечер)
    const segs = (): Seg[] => {
      const n = nodes()
      return [
        { a: n.s, b: n.p, cp: { x: 0.32 * W, y: 0.42 * H }, col: "255,176,32", next: [1] },
        { a: n.p, b: n.i, cp: { x: 0.31 * W, y: 0.76 * H }, col: "255,140,40", next: [2, 3] },
        { a: n.i, b: n.h, cp: { x: 0.67 * W, y: 0.34 * H }, col: "255,120,20", next: [-1] },
        { a: n.i, b: n.b, cp: { x: 0.49 * W, y: 0.74 * H }, col: "255,176,32", next: [-2] },
        { a: n.b, b: n.h, cp: { x: 0.65 * W, y: 0.8 * H }, col: "45,212,168", next: [-1] },
      ]
    }

    const qp = (s: Seg, t: number) => {
      const u = 1 - t
      return {
        x: u * u * s.a.x + 2 * u * t * s.cp.x + t * t * s.b.x,
        y: u * u * s.a.y + 2 * u * t * s.cp.y + t * t * s.b.y,
      }
    }

    const parts: P[] = []
    let charge = 61
    let day = true
    const t0 = performance.now()

    const spawn = () => {
      parts.push({
        seg: 0,
        t: Math.random() * 0.05,
        sp: 0.004 + Math.random() * 0.004,
        r: 1.8 + Math.random() * 1.4,
        drift: Math.random() * RAD,
      })
    }

    const drawScene = (S: Seg[], daylight: boolean) => {
      const n = nodes()
      ctx.lineWidth = 1.2
      // Солнце (или луна ночью)
      if (daylight) {
        const g = ctx.createRadialGradient(n.s.x, n.s.y, 2, n.s.x, n.s.y, 30)
        g.addColorStop(0, "rgba(255,200,80,0.95)")
        g.addColorStop(0.4, "rgba(255,176,32,0.55)")
        g.addColorStop(1, "rgba(255,176,32,0)")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(n.s.x, n.s.y, 30, 0, RAD)
        ctx.fill()
        ctx.strokeStyle = "rgba(255,176,32,0.8)"
        ctx.beginPath()
        ctx.arc(n.s.x, n.s.y, 13, 0, RAD)
        ctx.stroke()
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * RAD + 0.3
          ctx.beginPath()
          ctx.moveTo(n.s.x + Math.cos(a) * 17, n.s.y + Math.sin(a) * 17)
          ctx.lineTo(n.s.x + Math.cos(a) * 22, n.s.y + Math.sin(a) * 22)
          ctx.stroke()
        }
      } else {
        ctx.strokeStyle = "rgba(168,173,181,0.7)"
        ctx.beginPath()
        ctx.arc(n.s.x, n.s.y, 11, 0.3, RAD - 0.3)
        ctx.stroke()
      }

      // Панели
      ctx.save()
      ctx.translate(n.p.x, n.p.y)
      ctx.rotate(-0.35)
      for (let q = 0; q < 3; q++) {
        ctx.fillStyle = q % 2 ? "#1E2E38" : "#26363F"
        ctx.strokeStyle = "#4FB3C9"
        ctx.beginPath()
        ctx.rect(-34 + q * 24, -16, 20, 30)
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()

      // Инвертор
      ctx.fillStyle = "#262E38"
      ctx.strokeStyle = "#4FB3C9"
      ctx.beginPath()
      ctx.rect(n.i.x - 13, n.i.y - 15, 26, 30)
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = "rgba(79,179,201,0.6)"
      ctx.beginPath()
      ctx.moveTo(n.i.x - 7, n.i.y + 4)
      ctx.lineTo(n.i.x - 2, n.i.y - 6)
      ctx.lineTo(n.i.x + 3, n.i.y + 4)
      ctx.stroke()

      // АКБ
      ctx.fillStyle = "#22282F"
      ctx.strokeStyle = "rgba(45,212,168,0.67)"
      ctx.beginPath()
      ctx.rect(n.b.x - 16, n.b.y - 13, 32, 26)
      ctx.fill()
      ctx.stroke()
      const bh = 20 * Math.max(0.06, charge / 100)
      ctx.fillStyle = "rgba(45,212,168,0.75)"
      ctx.fillRect(n.b.x - 12, n.b.y + 10 - bh, 24, bh)

      // Дом
      ctx.strokeStyle = "#A8ADB5"
      ctx.fillStyle = "#262E38"
      ctx.beginPath()
      ctx.moveTo(n.h.x - 20, n.h.y + 14)
      ctx.lineTo(n.h.x - 20, n.h.y - 2)
      ctx.lineTo(n.h.x, n.h.y - 16)
      ctx.lineTo(n.h.x + 20, n.h.y - 2)
      ctx.lineTo(n.h.x + 20, n.h.y + 14)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = daylight ? "#FFD27A" : "#5B8DEF"
      ctx.fillRect(n.h.x - 6, n.h.y + 1, 9, 9)

      // Подписи узлов
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace"
      ctx.fillStyle = "#A8ADB5"
      ctx.fillText(daylight ? "СОЛНЦЕ" : "НОЧЬ", n.s.x - 22, n.s.y + 44)
      ctx.fillText("ПАНЕЛИ 10 кВт", n.p.x - 40, n.p.y + 30)
      ctx.fillText("ИНВЕРТОР", n.i.x - 33, n.i.y - 21)
      ctx.fillText("АКБ " + Math.round(charge) + "%", n.b.x - 24, n.b.y + 30)
      ctx.fillText("ДОМ", n.h.x - 14, n.h.y + 30)

      // Траектории — пунктир
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = "rgba(255,176,32,0.16)"
      ctx.lineWidth = 1
      S.forEach((s) => {
        ctx.beginPath()
        ctx.moveTo(s.a.x, s.a.y)
        ctx.quadraticCurveTo(s.cp.x, s.cp.y, s.b.x, s.b.y)
        ctx.stroke()
      })
      ctx.setLineDash([])
    }

    const drawParticles = (S: Seg[], now: number, daylight: boolean) => {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.t += p.sp
        const s = S[p.seg]
        if (p.t >= 1) {
          let nx = s.next[0]
          if (nx === -1) {
            parts.splice(i, 1)
            continue
          }
          if (nx === -2) {
            charge = Math.min(100, charge + 1.4)
            parts.splice(i, 1)
            continue
          }
          if (s.next.length > 1) nx = s.next[Math.random() < 0.6 ? 0 : 1]
          p.seg = nx
          p.t = 0
          continue
        }
        const pos = qp(s, p.t)
        const d2 = p.drift + now * 0.002
        ctx.save()
        ctx.shadowColor = "rgba(" + s.col + ",0.9)"
        ctx.shadowBlur = 9
        ctx.fillStyle = "rgba(" + s.col + "," + (daylight || p.seg === 4 ? 0.95 : 0.8) + ")"
        ctx.beginPath()
        ctx.arc(pos.x + Math.cos(d2) * 1.5, pos.y + Math.sin(d2) * 1.5, p.r, 0, RAD)
        ctx.fill()
        ctx.restore()
      }
    }

    const updateKpi = (now: number, daylight: boolean) => {
      const pw = (3.1 + 0.7 * Math.sin(now / 1800)) * (daylight ? 1 : 0.15)
      if (capRef.current) capRef.current.textContent = pw.toFixed(1).replace(".", ",") + " кВт"
      if (battRef.current) battRef.current.textContent = Math.round(charge) + "%"
      if (modeRef.current) {
        modeRef.current.textContent = daylight ? "день · заряд АКБ" : "вечер · разряд АКБ"
        modeRef.current.style.color = daylight ? "" : "#8AB6FF"
      }
    }

    let raf = 0
    // Кадр: цикл дня/ночи 9 с (68% — день); частицы, KPI, сцена
    const frame = (now: number) => {
      ctx.clearRect(0, 0, W, H)
      const S = segs()
      const cyc = ((now - t0) / 9000) % 1
      const daylight = cyc < 0.68
      if (daylight !== day) day = daylight
      if (daylight && parts.length < 120 && Math.random() < 0.68) spawn()
      if (daylight && Math.random() < 0.3) charge = Math.min(100, charge + 0.08)
      if (!daylight) {
        charge = Math.max(8, charge - 0.15)
        if (parts.length < 120 && Math.random() < 0.5) {
          parts.push({ seg: 4, t: Math.random() * 0.1, sp: 0.005 + Math.random() * 0.004, r: 2, drift: Math.random() * RAD })
        }
      }
      drawScene(S, daylight)
      drawParticles(S, now, daylight)
      updateKpi(now, daylight)
      if (inView) raf = requestAnimationFrame(frame)
      else raf = 0
    }

    if (reduced) {
      // Один статичный кадр «полдень» — движение отключено; перерисовка при resize
      redrawStatic = () => {
        ctx.clearRect(0, 0, W, H)
        const S = segs()
        drawScene(S, true)
        drawParticles(S, performance.now(), true)
        updateKpi(performance.now(), true)
      }
      redrawStatic()
    } else if (inView) {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [inView, reduced])

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative" }}>
      <canvas ref={cvRef} className="block h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute left-4 top-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-scene-muted">
        <span className="svg-mono tracking-[0.14em] uppercase">Поток энергии · демо</span>
        <span className="svg-mono">
          <b ref={capRef} className="font-semibold text-scene-amber">3,1 кВт</b> · АКБ{" "}
          <b ref={battRef} className="font-semibold text-scene-amber">61%</b>
        </span>
      </div>
      <span
        ref={modeRef}
        className="svg-mono pointer-events-none absolute right-4 top-3.5 text-[11px] text-scene-amber/90"
      >
        день · заряд АКБ
      </span>
    </div>
  )
}
