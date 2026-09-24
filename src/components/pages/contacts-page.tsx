"use client"

import { useEffect } from "react"
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { HeroCorner } from "@/components/common/hero-corner"
import { LeadForm } from "@/components/lead/lead-form"
import { AdSlot } from "@/components/common/ad-slot"

export function ContactsPage({ openForm }: { openForm?: boolean }) {
  useEffect(() => {
    if (openForm) {
      const t = document.getElementById("lead-form-anchor")
      t?.scrollIntoView({ behavior: "smooth" })
    }
  }, [openForm])

  return (
    <div>
      <PageHero
        eyebrow="Контакты"
        title="Обсудим ваш объект"
        description="Инженеры на связи с 9:00 до 21:00 МСК, без выходных. Аудит объекта и предварительная смета — бесплатно."
        corner={<HeroCorner variant="contacts" />}
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-12 sm:px-6 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <a href="tel:+74951234567" className="card-premium card-premium-hover flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
              <Phone className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold">+7 (495) 123-45-67</span>
              <span className="block text-xs text-muted-foreground">кликабельно — позвонить сейчас</span>
            </span>
          </a>
          <a href="mailto:info@alt-energo.ru" className="card-premium card-premium-hover flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
              <Mail className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold">info@alt-energo.ru</span>
              <span className="block text-xs text-muted-foreground">ответ в течение рабочего дня</span>
            </span>
          </a>
          <div className="card-premium flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
              <MapPin className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Москва · работаем по всей РФ</span>
              <span className="block text-xs text-muted-foreground">выезд инженера — от 150 км без доплат</span>
            </span>
          </div>
          <div className="card-premium flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
              <Clock className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Смета — за 24 часа</span>
              <span className="block text-xs text-muted-foreground">9:00–21:00 МСК, включая выходные</span>
            </span>
          </div>
          <div className="card-premium flex items-start gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
              <MessageSquare className="h-5 w-5 text-primary" />
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Персональные данные передаются в CRM на территории РФ (152-ФЗ). Технические
              записи без ПДн остаются в журнале сайта — статус доставки заявки виден в админ-зоне.
            </p>
          </div>
        </div>
        <div id="lead-form-anchor" className="card-premium border-gradient-solar p-5 md:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Заявка на расчёт или аудит</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Опишите объект — инженер соберёт смету и позвонит уточнить детали.
          </p>
          <div className="mt-5">
            <LeadForm formId="contacts" submitLabel="Отправить заявку" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="rect" />
      </div>
    </div>
  )
}
