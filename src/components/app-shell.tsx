"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader, type TabId } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OverviewSection } from "@/components/sections/overview-section";
import { TypesSection } from "@/components/sections/types-section";
import { RegionsSection } from "@/components/sections/regions-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { ForecastSection } from "@/components/sections/forecast-section";
import { AboutSection } from "@/components/sections/about-section";

export function AppShell() {
  const [tab, setTab] = useState<TabId>("overview");

  const handleTabChange = useCallback((t: TabId) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Синхронизация таба с hash для удобного шаринга ссылок
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as TabId;
    const valid = ["overview", "types", "regions", "projects", "forecast", "about"];
    if (valid.includes(fromHash) && fromHash !== "overview") {
      const id = requestAnimationFrame(() => setTab(fromHash));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader tab={tab} onTabChange={handleTabChange} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tab === "overview" && <OverviewSection onNavigate={handleTabChange} />}
            {tab === "types" && <TypesSection />}
            {tab === "regions" && <RegionsSection />}
            {tab === "projects" && <ProjectsSection />}
            {tab === "forecast" && <ForecastSection />}
            {tab === "about" && <AboutSection />}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  );
}
