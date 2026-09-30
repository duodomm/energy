"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Phone, Clock, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigate } from "@/lib/router"

export function ThanksPage() {
  useEffect(() => {
    sessionStorage.setItem("exit-intent-shown", "1")
  }, [])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-stable/15">
          <CheckCircle2 className="h-11 w-11 text-stable" />
        </span>
      </motion.div>
      <h1 className="mt-7 text-2xl font-bold tracking-tight md:text-3xl">Заявка принята</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        Инженер уже получил ваши контакты в CRM и проверит расчёт. Смета с актуальными ценами
        поставщиков вашего региона — <b className="text-foreground">в течение 24 часов</b>.
        Если параметры менялись — дождитесь звонка, уточним.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="tel:+74951234567">
          <Button variant="outline"><Phone className="mr-2 h-4 w-4 text-stable" /> Позвонить самому</Button>
        </a>
        <Button variant="outline" onClick={() => navigate("#/kejsy")}>
          <FileDown className="mr-2 h-4 w-4" /> Посмотреть кейсы со сметами
        </Button>
        <Button className="bg-gradient-solar text-primary-foreground" onClick={() => navigate("#/blog")}>
          Читать разделы
        </Button>
      </div>
      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Одна заявка — один звонок инженера. Спама не будет.
      </p>
    </div>
  )
}
