"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  value,
  unit,
  label,
  sub,
  deltaPercent,
  delay = 0,
}: {
  icon: LucideIcon;
  value: string;
  unit?: string;
  label: string;
  sub?: string;
  deltaPercent?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="h-full gap-0 py-0 transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-1.5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-4 w-4" />
            </span>
            {typeof deltaPercent === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  deltaPercent >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                )}
              >
                <TrendingUp className={cn("h-3 w-3", deltaPercent < 0 && "rotate-180")} />
                {deltaPercent >= 0 ? "+" : ""}
                {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(deltaPercent)}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{value}</span>
            {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
          </div>
          <div className="text-sm font-medium text-foreground/90">{label}</div>
          {sub && <div className="text-xs leading-snug text-muted-foreground">{sub}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
