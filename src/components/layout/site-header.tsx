"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList,
  NavigationMenuLink, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sun, BatteryCharging, Fuel, TrendingUp, Calculator, MapPin, BookOpen,
  FolderKanban, Newspaper, Phone, Menu, Zap, FileText, Home, Lightbulb,
} from "lucide-react"
import { navigate, useHashRoute } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const NAV = [
  {
    label: "Калькуляторы",
    items: [
      { href: "#/kalkulyator", title: "Профессиональный", desc: "6 шагов, смета и экономика", icon: Calculator },
      { href: "#/kalkulyator/dacha", title: "Дачный быстрый", desc: "3 шага за минуту", icon: Home },
      { href: "#/kalkulyator-lcoe", title: "LCOE мини", desc: "стоимость кВт·ч на пальцах", icon: Zap },
    ],
  },
  {
    label: "Справочники",
    items: [
      { href: "#/solnce", title: "Солнечная энергетика", desc: "панели, инверторы, монтаж", icon: Sun },
      { href: "#/nakopiteli", title: "Накопители", desc: "LiFePO4, AGM, VRFB", icon: BatteryCharging },
      { href: "#/generatory", title: "Генерация", desc: "дизель, газ, АВР, топливо", icon: Fuel },
      { href: "#/teo", title: "Экономика", desc: "LCOE, окупаемость, тарифы", icon: TrendingUp },
      { href: "#/regiony", title: "Регионы РФ", desc: "PSH, тарифы, СП 20.13330", icon: MapPin },
      { href: "#/spravochnik", title: "Термины и нормативка", desc: "глоссарий, ПУЭ, FAQ", icon: BookOpen },
    ],
  },
]

const LINKS = [
  { href: "#/kejsy", label: "Кейсы" },
  { href: "#/blog", label: "Блог" },
  { href: "#/o-proekte", label: "О проекте" },
  { href: "#/kontakty", label: "Контакты" },
]

export function SiteHeader() {
  const route = useHashRoute()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = "/" + route.path.join("/")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="#/"
          className="flex items-center gap-2.5"
          onClick={() => navigate("#/")}
          aria-label="Главная — Альтернативная энергетика РФ"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-solar shadow-[0_4px_16px_-4px_rgba(232,148,10,0.5)]">
            <Sun className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[15px] font-semibold tracking-tight">Альтернативная энергетика</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">РФ · 2026</span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="Основная навигация">
          {NAV.map((group) => (
            <NavigationMenu key={group.label} viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 bg-transparent text-sm font-medium data-[state=open]:bg-secondary">
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[440px] p-2">
                    <ul className="grid gap-1.5">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <a
                              href={item.href}
                              className={cn(
                                "flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60",
                                current === item.href.replace("#", "") && "bg-secondary",
                              )}
                            >
                              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                              <span className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium leading-none">{item.title}</span>
                                <span className="text-xs text-muted-foreground">{item.desc}</span>
                              </span>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ))}
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                current === l.href.replace("#", "") && "bg-secondary text-foreground",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <a
            href="tel:+74951234567"
            className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
            onClick={() => trackGoal("phone_click")}
            aria-label="Позвонить +7 495 123-45-67"
          >
            <Phone className="h-4 w-4 text-stable" />
            <span className="tracking-tight">+7 (495) 123-45-67</span>
          </a>
          <Button
            className="hidden bg-gradient-solar shadow-[0_6px_18px_-6px_rgba(232,148,10,0.55)] hover:opacity-95 sm:inline-flex"
            onClick={() => {
              trackGoal("lead_form_open", { form: "header" })
              navigate("#/kontakty?form=1")
            }}
          >
            <Lightbulb className="mr-1.5 h-4 w-4" />
            Получить расчёт
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Открыть меню">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto p-0">
              <SheetTitle className="sr-only">Меню сайта</SheetTitle>
              <nav className="flex flex-col gap-1 p-4 pt-8" aria-label="Мобильная навигация">
                <a href="#/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/60">
                  <Home className="h-5 w-5 text-primary" /> Главная
                </a>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Калькуляторы</p>
                {NAV[0].items.map((i) => (
                  <a key={i.href} href={i.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/60">
                    <i.icon className="h-5 w-5 text-primary" /> {i.title}
                  </a>
                ))}
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Справочники</p>
                {NAV[1].items.map((i) => (
                  <a key={i.href} href={i.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/60">
                    <i.icon className="h-5 w-5 text-primary" /> {i.title}
                  </a>
                ))}
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Разделы</p>
                {LINKS.map((i) => (
                  <a key={i.href} href={i.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/60">
                    {i.label === "Кейсы" ? <FolderKanban className="h-5 w-5 text-primary" /> :
                     i.label === "Блог" ? <Newspaper className="h-5 w-5 text-primary" /> :
                     i.label === "О проекте" ? <FileText className="h-5 w-5 text-primary" /> :
                     <Phone className="h-5 w-5 text-primary" />}
                    {i.label}
                  </a>
                ))}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <a href="tel:+74951234567" className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium">
                    <Phone className="h-4 w-4 text-stable" /> +7 (495) 123-45-67
                  </a>
                  <Button
                    className="w-full bg-gradient-solar"
                    onClick={() => {
                      trackGoal("lead_form_open", { form: "mobile_menu" })
                      setMobileOpen(false)
                      navigate("#/kontakty?form=1")
                    }}
                  >
                    Получить расчёт за 24 часа
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
