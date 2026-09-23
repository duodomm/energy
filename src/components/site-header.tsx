"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Wind, Moon, Sun, Menu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type TabId = "overview" | "types" | "regions" | "projects" | "forecast" | "about";

export const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "types", label: "Виды ВИЭ" },
  { id: "regions", label: "Регионы" },
  { id: "projects", label: "Проекты" },
  { id: "forecast", label: "Прогноз" },
  { id: "about", label: "О платформе" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      className="shrink-0"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function SiteHeader({
  tab,
  onTabChange,
}: {
  tab: TabId;
  onTabChange: (t: TabId) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navButton = (id: TabId, label: string, onClick?: () => void) => (
    <button
      key={id}
      onClick={() => {
        onTabChange(id);
        onClick?.();
      }}
      className={cn(
        "relative px-3 py-2 text-sm font-medium transition-colors rounded-md",
        "focus-visible:outline-2 focus-visible:outline-ring",
        tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
      aria-current={tab === id ? "page" : undefined}
    >
      {label}
      {tab === id && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
          onClick={(e) => {
            e.preventDefault();
            onTabChange("overview");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-primary-foreground shadow-sm">
            <Wind className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight">ВИЭ·РФ</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              Альтернативная энергетика России
            </span>
          </span>
        </Link>

        <nav className="mx-2 hidden flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ id, label }) => navButton(id, label))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground md:inline-flex">
            <Leaf className="h-3 w-3 text-primary" />
            Данные: 2025
          </span>
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Открыть меню">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4">
              <SheetTitle className="text-left">Навигация</SheetTitle>
              <nav className="mt-4 grid gap-1" aria-label="Мобильная навигация">
                {NAV_ITEMS.map(({ id, label }) =>
                  navButton(id, label, () => setMobileOpen(false))
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
