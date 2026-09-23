"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { SectionHeading } from "@/components/section-heading";
import { ErrorState, LoadingChart } from "@/components/data-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { Zap, PieChart as PieIcon, Banknote, Globe2, TrendingUp, Info } from "lucide-react";
import { fmt } from "@/lib/energy";

type ForecastData = {
  latestYear: number;
  actualTotalMW: number;
  series: Array<{
    scenario: "conservative" | "base" | "optimistic";
    points: Array<{ year: number; capacityMW: number; sharePercent: number; investmentBlnRub: number }>;
  }>;
  assumptions: Record<
    string,
    { title: string; capacity2035: string; color: string; text: string }
  >;
  world: Array<{ region: string; renewableGW: number; note: string }>;
  reference: { hydroLargeGW: number; hydroSharePercent: number };
};

const SCENARIO_META: Record<string, { label: string; color: string }> = {
  conservative: { label: "Консервативный", color: "#64748b" },
  base: { label: "Базовый", color: "#059669" },
  optimistic: { label: "Оптимистичный", color: "#f59e0b" },
};

export function ForecastSection() {
  const { data, loading, error, reload } = useApi<ForecastData>("/api/forecast");
  const [scenario, setScenario] = useState<string>("base");

  const chartData = data
    ? data.series[0].points.map((_, i) => {
        const row: Record<string, number> = {
          year: data.series[0].points[i].year,
          actual: data.series[0].points[i].year === data.latestYear + 1 ? data.actualTotalMW : NaN,
        };
        for (const s of data.series) {
          row[s.scenario] = s.points[i].capacityMW;
        }
        return row;
      })
    : [];

  const activePoints = data?.series.find((s) => s.scenario === scenario)?.points ?? [];
  const lastPoint = activePoints[activePoints.length - 1];
  const firstPoint = activePoints[0];

  const chartConfig = {
    actual: { label: `Факт ${data?.latestYear ?? ""}`, color: "#0f172a" },
    conservative: { label: SCENARIO_META.conservative.label, color: SCENARIO_META.conservative.color },
    base: { label: SCENARIO_META.base.label, color: SCENARIO_META.base.color },
    optimistic: { label: SCENARIO_META.optimistic.label, color: SCENARIO_META.optimistic.color },
  } satisfies ChartConfig;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Прогноз развития отрасли до 2035 года"
        subtitle={`Три сценария роста мощностей ВИЭ (без крупных ГЭС) от фактического уровня ${data?.latestYear ?? 2025} года`}
      />

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {loading && !data && (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-72 rounded-xl" />
          <LoadingChart className="h-96" />
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={scenario}
              onValueChange={(v) => v && setScenario(v)}
              variant="outline"
              aria-label="Выбор сценария прогноза"
            >
              {Object.entries(SCENARIO_META).map(([id, meta]) => (
                <ToggleGroupItem key={id} value={id} className="gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Нажмите на сценарий, чтобы увидеть его детализацию
            </span>
          </div>

          {/* KPI выбранного сценария */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Zap}
              value={fmt.int(lastPoint?.capacityMW ?? 0)}
              unit="МВт"
              label={`Мощность ВИЭ в 2035 году`}
              sub={data.assumptions[scenario]?.title}
            />
            <KpiCard
              icon={TrendingUp}
              value={`×${fmt.num((lastPoint?.capacityMW ?? 0) / data.actualTotalMW, 1)}`}
              label="Рост к текущему уровню"
              sub={`Факт ${data.latestYear}: ${fmt.int(data.actualTotalMW)} МВт`}
            />
            <KpiCard
              icon={PieIcon}
              value={`${fmt.num(lastPoint?.sharePercent ?? 0)}%`}
              label="Доля в энергобалансе"
              sub={`С учётом крупных ГЭС (сейчас ~${data.reference.hydroSharePercent}%) — выше`}
            />
            <KpiCard
              icon={Banknote}
              value={fmt.int(lastPoint?.investmentBlnRub ?? 0)}
              unit="млрд ₽"
              label="Новые инвестиции, 2026–2035"
              sub={`Накопленным итогом с ${firstPoint?.year ?? 2026} года`}
            />
          </div>

          {/* График сценариев */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Сценарии установленной мощности ВИЭ, 2026–2035</CardTitle>
              <CardDescription>
                Фактический уровень {data.latestYear} года — {fmt.int(data.actualTotalMW)} МВт (точка отсчёта)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[360px] w-full">
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={6} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    domain={[4000, 20000]}
                    tickFormatter={(v: number) => `${fmt.num(v / 1000, 1)} ГВт`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(value, name) => [`${fmt.int(Number(value))} МВт`, String(name)]} />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ReferenceLine
                    y={data.actualTotalMW}
                    stroke="var(--color-actual)"
                    strokeDasharray="6 4"
                    label={{ value: `Факт ${data.latestYear}`, position: "insideTopLeft", fontSize: 11 }}
                  />
                  <Line dataKey="conservative" type="monotone" stroke="var(--color-conservative)" strokeWidth={scenario === "conservative" ? 3 : 1.5} dot={false} />
                  <Line dataKey="base" type="monotone" stroke="var(--color-base)" strokeWidth={scenario === "base" ? 3 : 1.5} dot={false} />
                  <Line dataKey="optimistic" type="monotone" stroke="var(--color-optimistic)" strokeWidth={scenario === "optimistic" ? 3 : 1.5} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Допущения сценария */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{data.assumptions[scenario]?.title}</CardTitle>
                <CardDescription>Целевой ориентир к 2035 году: {data.assumptions[scenario]?.capacity2035}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{data.assumptions[scenario]?.text}</p>
                <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  Крупные ГЭС ({data.reference.hydroLargeGW} ГВт) в прогноз не включены и учитываются
                  отдельно: вместе с ними доля всей возобновимой генерации в балансе России уже сейчас
                  составляет около {data.reference.hydroSharePercent}%.
                </div>
              </CardContent>
            </Card>

            {/* Детализация по годам */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Детализация сценария по годам</CardTitle>
                <CardDescription>{SCENARIO_META[scenario]?.label} сценарий</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="custom-scrollbar max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead>Год</TableHead>
                        <TableHead className="text-right">Мощность, МВт</TableHead>
                        <TableHead className="text-right">Доля в балансе</TableHead>
                        <TableHead className="text-right">Инвестиции нарастающим итогом</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePoints.map((p) => (
                        <TableRow key={p.year}>
                          <TableCell className="font-medium tabular-nums">{p.year}</TableCell>
                          <TableCell className="text-right font-bold tabular-nums">{fmt.int(p.capacityMW)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt.num(p.sharePercent)}%</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt.int(p.investmentBlnRub)} млрд ₽</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Мировой контекст */}
          <div className="mt-10">
            <SectionHeading
              title="Россия в мировом контексте"
              subtitle="Установленные мощности ВИЭ без крупных ГЭС, данные IRENA"
            />
            <Card className="mt-5">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.world.map((w) => {
                  const isRu = w.region === "Россия";
                  const max = Math.max(...data.world.map((x) => x.renewableGW));
                  return (
                    <div
                      key={w.region}
                      className={`rounded-xl border p-4 ${isRu ? "border-primary bg-accent" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-bold">
                          <Globe2 className={`h-4 w-4 ${isRu ? "text-primary" : "text-muted-foreground"}`} />
                          {w.region}
                        </span>
                        <span className="text-lg font-extrabold tabular-nums">
                          {fmt.num(w.renewableGW, 1)} <span className="text-xs font-semibold text-muted-foreground">ГВт</span>
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${isRu ? "bg-primary" : "bg-muted-foreground/40"}`}
                          style={{ width: `${Math.max((w.renewableGW / max) * 100, 2)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{w.note}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
