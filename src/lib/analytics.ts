"use client"

// Заглушка Яндекс.Метрики (ТЗ 7.1: Метрика обязательна — цели, воронки, РСЯ).
// В продакшене: <script src="https://mc.yandex.ru/metrika/tag.js"> с номером счётчика.
// Здесь события воронки логируются в dataLayer/консоль — структура целей та же.

type MetricaGoal =
  | "calc_start"
  | "calc_step"
  | "calc_complete"
  | "lead_form_open"
  | "lead_sent"
  | "dacha_calc_start"
  | "dacha_calc_complete"
  | "lcoe_calc_start"
  | "lcoe_calc_complete"
  | "exit_popup_shown"
  | "stickybar_click"
  | "phone_click"
  | "pdf_download"
  | "share_click"
  | "estate3d_interact"

const YM_ID = 0 // номер счётчика задаётся при деплое

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackGoal(goal: MetricaGoal, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event: goal, ...params })
    if (window.ym && YM_ID) {
      window.ym(YM_ID, "reachGoal", goal, params)
    } else {
      console.debug(`[metrika] goal: ${goal}`, params ?? "")
    }
  } catch {
    /* аналитика не должна ломать UX */
  }
}

export function trackPageview(url: string) {
  if (typeof window === "undefined") return
  try {
    if (window.ym && YM_ID) {
      window.ym(YM_ID, "hit", url)
    } else {
      console.debug(`[metrika] hit: ${url}`)
    }
  } catch { /* noop */ }
}
