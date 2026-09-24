"use client"

import { Sun, Phone, Mail, MapPin, ShieldCheck, FileText } from "lucide-react"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-solar">
              <Sun className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Альтернативная энергетика РФ</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Информационно-расчётный ресурс: солнечная генерация, накопители и резерв.
            Расчётное ядро считает в браузере — смета «от–до» по актуальным диапазонам цен.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            © 2026. Результаты калькулятора предварительные — точная смета после аудита объекта.
          </p>
        </div>

        <nav aria-label="Калькуляторы в подвале">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Калькуляторы</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a className="text-foreground/85 hover:text-primary" href="#/kalkulyator">Профессиональный (6 шагов)</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/kalkulyator/dacha">Дачный быстрый (3 шага)</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/kalkulyator-lcoe">LCOE мини-калькулятор</a></li>
          </ul>
        </nav>

        <nav aria-label="Разделы в подвале">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Разделы</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
            <li><a className="text-foreground/85 hover:text-primary" href="#/solnce">Солнце</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/nakopiteli">Накопители</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/generatory">Генераторы</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/teo">Экономика</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/regiony">Регионы</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/kejsy">Кейсы</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/spravochnik">Справочник</a></li>
            <li><a className="text-foreground/85 hover:text-primary" href="#/blog">Блог</a></li>
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Контакты</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href="tel:+74951234567"
                className="flex items-center gap-2.5 text-foreground/85 hover:text-primary"
                onClick={() => trackGoal("phone_click")}
              >
                <Phone className="h-4 w-4 text-stable" /> +7 (495) 123-45-67
              </a>
            </li>
            <li>
              <a href="mailto:info@alt-energo.ru" className="flex items-center gap-2.5 text-foreground/85 hover:text-primary">
                <Mail className="h-4 w-4 text-stable" /> info@alt-energo.ru
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-foreground/85">
              <MapPin className="h-4 w-4 text-stable" /> Москва, работаем по всей РФ
            </li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="#/politika-konfidencialnosti"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Политика конфиденциальности (152-ФЗ)
            </a>
            <a href="#/o-proekte" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <FileText className="h-3.5 w-3.5" /> О проекте и методологии
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-4">
        <p className="mx-auto max-w-7xl text-[11px] leading-relaxed text-muted-foreground/70">
          Персональные данные из форм передаются в CRM на территории РФ и хранятся только там (152-ФЗ/242-ФЗ);
          в инфраструктуре сайта остаются лишь технические записи без ПДн. Расчёты справочные:
          выкупные цены микрогенерации и тарифы уточняйте у гарантирующего поставщика.
        </p>
      </div>
    </footer>
  )
}
