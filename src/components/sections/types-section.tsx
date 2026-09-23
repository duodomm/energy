"use client";

import { useApi } from "@/hooks/use-api";
import { SectionHeading } from "@/components/section-heading";
import { TypeIcon } from "@/components/type-icon";
import { StatusBadge } from "@/components/badges";
import { ErrorState, LoadingChart, LoadingGrid } from "@/components/data-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Gauge, CalendarDays, Factory, Zap } from "lucide-react";
import { ENERGY_TYPE_META, fmt, type EnergyTypeId } from "@/lib/energy";

type TypesData = {
  latestYear: number;
  items: Array<{
    id: string;
    name: string;
    shortName: string;
    description: string;
    color: string;
    cim: number;
    capacityMW: number;
    generationTWh: number;
    growthPercent: number;
    firstYear: number | null;
    series: Array<{ year: number; capacityMW: number; generationTWh: number }>;
    projectsCount: number;
    operatingMW: number;
    topProjects: Array<{ id: number; name: string; region: string; capacityMW: number; status: string; year: number | null }>;
  }>;
};

export function TypesSection() {
  const { data, loading, error, reload } = useApi<TypesData>("/api/types");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Виды ВИЭ России"
        subtitle={`Пять направлений альтернативной энергетики: мощность, выработка и ключевые проекты · ${data?.latestYear ?? ""} год`}
      />

      <div className="mt-6">
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <LoadingGrid count={2} className="sm:grid-cols-1 lg:grid-cols-2" />}
      </div>

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.items.map((t, idx) => {
            const meta = ENERGY_TYPE_META[t.id as EnergyTypeId];
            const chartConfig = {
              capacity: { label: `${t.shortName}, МВт`, color: t.color },
            } satisfies ChartConfig;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
              >
                <Card className="h-full gap-0 py-0 transition-shadow hover:shadow-md">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${t.color}18`, color: t.color }}
                      >
                        <TypeIcon type={t.id} className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-lg font-bold">{t.name}</h3>
                          {t.growthPercent > 0 && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              +{fmt.num(t.growthPercent)}% за год
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Zap className="h-3 w-3" /> Мощность
                        </div>
                        <div className="mt-0.5 text-base font-bold tabular-nums">{fmt.int(t.capacityMW)} МВт</div>
                      </div>
                      <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Gauge className="h-3 w-3" /> КИУМ
                        </div>
                        <div className="mt-0.5 text-base font-bold tabular-nums">≈{fmt.int(t.cim)}%</div>
                      </div>
                      <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" /> Первый год
                        </div>
                        <div className="mt-0.5 text-base font-bold tabular-nums">{t.firstYear ?? "—"}</div>
                      </div>
                      <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Factory className="h-3 w-3" /> Объектов
                        </div>
                        <div className="mt-0.5 text-base font-bold tabular-nums">{t.projectsCount}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
                      <div>
                        <div className="mb-2 text-xs font-medium text-muted-foreground">Мощность по годам, МВт</div>
                        <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                          <AreaChart data={t.series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <XAxis dataKey="year" hide />
                            <YAxis hide domain={[0, "dataMax"]} />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                  formatter={(value) => [`${fmt.int(Number(value))} МВт`, "Мощность"]}
                                />
                              }
                            />
                            <Area
                              dataKey="capacityMW"
                              name="Мощность"
                              type="monotone"
                              stroke={t.color}
                              fill={t.color}
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ChartContainer>
                        <div className="mt-1 text-[10px] text-muted-foreground">2013 → {data.latestYear}</div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-medium text-muted-foreground">Ключевые проекты</div>
                        <ul className="space-y-2">
                          {t.topProjects.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium">{p.name}</div>
                                <div className="truncate text-xs text-muted-foreground">{p.region}</div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="font-bold tabular-nums">{fmt.int(p.capacityMW)}</span>
                                <StatusBadge status={p.status} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
