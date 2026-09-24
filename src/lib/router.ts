"use client"

// Hash-роутер SPA: карта страниц ТЗ 3.1 в URL-хэшах (#/kalkulyator, #/solnce, ...)
// #calc=... — stateless-ссылка на расчёт (ТЗ 4.3), обрабатывается калькулятором отдельно

import { useEffect, useState, useCallback } from "react"

export interface Route {
  path: string[] // ["kalkulyator", "dacha"] для #/kalkulyator/dacha
  hash: string
}

function parse(): Route {
  if (typeof window === "undefined") return { path: [], hash: "" }
  const h = window.location.hash.replace(/^#/, "")
  // #calc=... — шаринг расчёта: маршрут «калькулятор с восстановлением»
  if (h.startsWith("calc=")) return { path: ["kalkulyator"], hash: h }
  if (h === "/" || h === "") return { path: [], hash: "" }
  // Отделяем query (?a=b) от пути: #/kontakty?form=1
  const [pathPart, queryPart] = h.replace(/^\//, "").split("?")
  const clean = pathPart.replace(/\/$/, "")
  return { path: clean.split("/").filter(Boolean), hash: queryPart ? `?${queryPart}` : "" }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return route
}

export function navigate(to: string) {
  // «#/kalkulyator» или «#/blog/slug» — ведущий # обязателен для hash-роутинга
  const target = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`
  if (typeof window !== "undefined") {
    if (window.location.hash === target) {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    } else {
      window.location.hash = target
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), [])
}

export function routeToPath(route: Route): string {
  return route.path.length ? `/${route.path.join("/")}` : "/"
}
