"use client"

import { useEffect } from "react"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { StickyCta } from "@/components/layout/sticky-cta"
import { ExitIntent } from "@/components/layout/exit-intent"
import { BackToTop } from "@/components/common/back-to-top"
import { ReadingProgress } from "@/components/common/reading-progress"
import { useHashRoute, routeToPath } from "@/lib/router"
import { trackPageview } from "@/lib/analytics"

import { HomePage } from "@/components/pages/home-page"
import { CalculatorPage } from "@/components/pages/calculator-page"
import { DachaCalcPage } from "@/components/pages/dacha-calc-page"
import { LcoePage } from "@/components/pages/lcoe-page"
import { HubPage } from "@/components/pages/hub-page"
import { RegionsPage } from "@/components/pages/regions-page"
import { CasesPage } from "@/components/pages/cases-page"
import { ReferencePage } from "@/components/pages/reference-page"
import { BlogPage } from "@/components/pages/blog-page"
import { ArticlePage } from "@/components/pages/article-page"
import { AboutPage } from "@/components/pages/about-page"
import { ContactsPage } from "@/components/pages/contacts-page"
import { PrivacyPage } from "@/components/pages/privacy-page"
import { ThanksPage } from "@/components/pages/thanks-page"
import { AdminPage } from "@/components/pages/admin-page"
import { NotFound } from "@/components/pages/not-found"

// Карта страниц ТЗ 3.1 в hash-маршрутах:
// #/ — главная; #/kalkulyator(/dacha); #/kalkulyator-lcoe; #/solnce; #/nakopiteli;
// #/generatory; #/teo; #/regiony; #/kejsy; #/spravochnik; #/blog(/slug);
// #/o-proekte; #/kontakty; #/politika-konfidencialnosti; #/spasibo; #/admin
// + любой одно-сегментный маршрут, совпадающий со slug статьи из БД.

const HUBS = new Set(["solnce", "nakopiteli", "generatory", "teo"])

function renderPage(path: string[], hash: string, slugHint: string | null) {
  const [a, b] = path
  switch (a) {
    case undefined:
      return <HomePage />
    case "kalkulyator":
      return b === "dacha" ? <DachaCalcPage /> : <CalculatorPage sharedHash={hash.startsWith("calc=") ? hash : null} />
    case "kalkulyator-lcoe":
      return <LcoePage />
    case "regiony":
      return <RegionsPage />
    case "kejsy":
      return <CasesPage />
    case "spravochnik":
      return <ReferencePage />
    case "blog":
      return b ? <ArticlePage slug={b} /> : <BlogPage />
    case "o-proekte":
      return <AboutPage />
    case "kontakty":
      return <ContactsPage openForm={hash.includes("form=1")} />
    case "politika-konfidencialnosti":
      return <PrivacyPage />
    case "spasibo":
      return <ThanksPage />
    case "admin":
      return <AdminPage />
    default:
      if (HUBS.has(a ?? "")) return <HubPage hub={a ?? "sun"} slug={b ?? null} />
      if (slugHint) return <ArticlePage slug={slugHint} />
      return <NotFound path={path} />
  }
}

export function AppShell() {
  const route = useHashRoute()
  const pathStr = routeToPath(route)

  // Прогрев: одно-сегментный маршрут может быть slug статьи (перелинковка из статей)
  useEffect(() => {
    trackPageview(pathStr)
  }, [pathStr])

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ReadingProgress routeKey={pathStr} />
      <main className="flex-1 pb-20 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathStr}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {renderPage(route.path, route.hash, route.path.length === 1 ? route.path[0] : null)}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <StickyCta />
      <ExitIntent />
      <BackToTop />
    </div>
    </MotionConfig>
  )
}
