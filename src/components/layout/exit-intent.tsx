"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Timer } from "lucide-react"
import { LeadForm } from "@/components/lead/lead-form"
import { useHashRoute } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"

// Exit-intent попап: 1 раз за сессию, не на странице результата (ТЗ 6.1)
export function ExitIntent() {
  const [open, setOpen] = useState(false)
  const route = useHashRoute()
  const current = `/${route.path.join("/")}`
  const onResult = current === "/kalkulyator" && route.hash.startsWith("calc=")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem("exit-intent-shown")) return

    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 8 && !sessionStorage.getItem("exit-intent-shown")) {
        if (onResult) return
        sessionStorage.setItem("exit-intent-shown", "1")
        setOpen(true)
        trackGoal("exit_popup_shown")
      }
    }
    const t = setTimeout(() => {
      document.addEventListener("mouseout", onLeave)
    }, 8000)
    return () => {
      clearTimeout(t)
      document.removeEventListener("mouseout", onLeave)
    }
  }, [onResult])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Timer className="h-5 w-5 text-primary" />
            Уходите без расчёта?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Оставьте контакты — за 24 часа инженер соберёт точную смету под ваш объект:
            актуальные цены поставщиков, монтаж по нормо-часам вашего региона, экономика и окупаемость.
          </DialogDescription>
        </DialogHeader>
        <LeadForm formId="exit" compact submitLabel="Получить смету за 24 часа" />
      </DialogContent>
    </Dialog>
  )
}
