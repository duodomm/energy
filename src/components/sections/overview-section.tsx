"use client";

import { useApi } from "@/hooks/use-api";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeading } from "@/components/section-heading";
import { TypeBadge, StatusBadge } from "@/components/badges";
import { TypeIcon } from "@/components/type-icon";
import { LoadingChart, ErrorState, LoadingGrid } from "@/components/data-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Zap,
  Activity,
  PieChart as PieIcon,
  Layers,
  Banknote,
  HardHat,
  ArrowRight,
  LineChart as LineIcon,
} from "lucide-react";
import { ENERGY_TYPE_META, fmt, type EnergyTypeId } from "@/lib/energy";
import type { TabId } from "@/components/site-header";

type OverviewData = {
  latestYear: number;
  kpis: {
    totalCapacityMW: number;
    capacityGrowthPercent: number;
    generationTWh: number;
    sharePercent: number;
    shareWithHydroPercent: number;
    objectsEstimate: number;
    catalogProjects: number;
    investedBlnRub: number;
    jobsEstimate: number;
    pipelineMW: number;
    pipelineCount: number;
  };
  dynamics: Array<{
    year: number;
    wind: number;
    solar: number;
    hydro: number;
    biomass: number;
    geothermal: number;
    total: number;
    generationTWh: number;
  }>;
  structure: Array<{ id: string; name: string; color: string; capacityMW: number; generationTWh: number; sharePercent: number }>;
  topRegions: Array<{ region: string; district: string; total: number; operating: number; pipeline: number; count: number; rank: number }>;
  flagship: Array<{ id: number; name: string; type: string; region: string; capacityMW: number; status: string; year: number | null; description: string }>;
};

const mwFormatter = (v: number) => `${fmt.int(v)} МВт`;
const twhFormatter = (v: number) => `${fmt.num(v)} млрд кВт·ч`;

export function OverviewSection({ onNavigate }: { onNavigate?: (t: TabId) => void }) {
  const { data, loading, error, reload } = useApi<OverviewData>("/api/overview");

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-emerald-50/90 via-background to-background dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-background dark:to-background">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-800/20" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl dark:bg-amber-900/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Activity className="h-3.5 w-3.5" />
            Аналитическая платформа · данные {data?.latestYear ?? 2025} года
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Альтернативная энергетика России{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              в цифрах и проектах
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Установленная мощность по видам ВИЭ, региональная структура, каталог ключевых
            электростанций и сценарии развития отрасли до 2035 года — в одном месте.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" className="gap-2" onClick={() => onNavigate?.("projects")}>
              Каталог проектов <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => onNavigate?.("forecast")}>
              <LineIcon className="h-4 w-4" /> Прогноз до 2035 года
            </Button>
          </div>
          {data && (
            <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: "Мощность ВИЭ", v: `${fmt.num(data.kpis.totalCapacityMW / 1000, 1)} ГВт` },
                { k: "Выработка", v: `${fmt.num(data.kpis.generationTWh)} млрд кВт·ч` },
                { k: "Доля в балансе", v: `≈${fmt.num(data.kpis.sharePercent)}%` },
                { k: "С учётом ГЭС", v: `≈${fmt.num(data.kpis.shareWithHydroPercent)}%` },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-border/70 bg-card/70 p-3 backdrop-blur">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.k}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums">{s.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {error && <ErrorState message={error} onRetry={reload} />}

        {/* ===== KPI ===== */}
        {loading && !data && <LoadingGrid count={6} className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />}
        {data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              icon={Zap}
              value={fmt.int(data.kpis.totalCapacityMW)}
              unit="МВт"
              label="Установленная мощность"
              sub={`Без учёта крупных ГЭС · ${data.latestYear} год`}
              deltaPercent={data.kpis.capacityGrowthPercent}
              delay={0}
            />
            <KpiCard
              icon={Activity}
              value={fmt.num(data.kpis.generationTWh)}
              unit="млрд кВт·ч"
              label="Годовая выработка"
              sub={`≈${fmt.num(data.kpis.sharePercent)}% выработки ЕЭС России`}
              delay={0.05}
            />
            <KpiCard
              icon={PieIcon}
              value={`${fmt.num(data.kpis.sharePercent)}%`}
              label="Доля ВИЭ в энергобалансе"
              sub={`С учётом крупных ГЭС — ≈${fmt.num(data.kpis.shareWithHydroPercent)}%`}
              delay={0.1}
            />
            <KpiCard
              icon={Layers}
              value={`${data.kpis.objectsEstimate}+`}
              unit="объектов"
              label="Действующих станций"
              sub={`В каталоге платформы — ${data.kpis.catalogProjects} ключевых`}
              delay={0.15}
            />
            <KpiCard
              icon={Banknote}
              value={">" + fmt.int(data.kpis.investedBlnRub)}
              unit="млрд ₽"
              label="Инвестиции с 2013 года"
              sub="По программе ДПМ ВИЭ и смежным проектам"
              delay={0.2}
            />
            <KpiCard
              icon={HardHat}
              value={fmt.int(data.kpis.pipelineMW)}
              unit="МВт"
              label="Стройка и план"
              sub={`${data.kpis.pipelineCount} проектов каталога`}
              delay={0.25}
            />
          </div>
        )}

        {/* ===== Динамика + структура ===== */}
        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {loading && !data ? (
            <div className="lg:col-span-3">
              <LoadingChart />
            </div>
          ) : data ? (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Динамика установленной мощности ВИЭ, 2013–{data.latestYear}</CardTitle>
                <CardDescription>Накопленная мощность по видам, МВт. Ветер и солнце дали 87% прироста с 2017 года.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={dynamicsChartConfig} className="aspect-auto h-[300px] w-full sm:h-[340px]">
                  <AreaChart data={data.dynamics} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={6} minTickGap={16} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tickFormatter={(v: number) => (v >= 1000 ? `${fmt.num(v / 1000)} тыс.` : fmt.int(v))}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [mwFormatter(Number(value)), String(name)]}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {(Object.keys(ENERGY_TYPE_META) as EnergyTypeId[]).map((t, i) => (
                      <Area
                        key={t}
                        dataKey={t}
                        name={ENERGY_TYPE_META[t].label}
                        type="monotone"
                        stackId="vies"
                        stroke={ENERGY_TYPE_META[t].color}
                        fill={ENERGY_TYPE_META[t].color}
                        fillOpacity={0.25 + i * 0.02}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}

          {loading && !data ? (
            <div className="lg:col-span-2">
              <LoadingChart />
            </div>
          ) : data ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Структура мощности по видам ВИЭ</CardTitle>
                <CardDescription>Доля каждого направления, {data.latestYear} год</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <ChartContainer config={structureChartConfig} className="aspect-auto mx-auto h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [mwFormatter(Number(value)), String(name)]}
                            hideLabel={false}
                          />
                        }
                      />
                      <Pie
                        data={data.structure}
                        dataKey="capacityMW"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={2}
                        strokeWidth={2}
                      >
                        {data.structure.map((s) => (
                          <Cell key={s.id} fill={s.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold tabular-nums">{fmt.num(data.kpis.totalCapacityMW / 1000, 2)} ГВт</span>
                    <span className="text-[11px] text-muted-foreground">всего ВИЭ</span>
                  </div>
                </div>
                <ul className="mt-4 grid gap-2">
                  {data.structure
                    .slice()
                    .sort((a, b) => b.capacityMW - a.capacityMW)
                    .map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                        <span className="flex-1 truncate">{s.name}</span>
                        <span className="font-semibold tabular-nums">{fmt.num(s.sharePercent)}%</span>
                        <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">
                          {fmt.int(s.capacityMW)} МВт
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ===== Регионы + выработка ===== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {loading && !data ? (
            <div className="lg:col-span-3">
              <LoadingChart />
            </div>
          ) : data ? (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Топ-10 регионов по мощности ключевых объектов</CardTitle>
                <CardDescription>Действующие мощности и pipeline (стройка + план) по каталогу платформы</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={regionsChartConfig} className="aspect-auto h-[360px] w-full">
                  <BarChart data={data.topRegions} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => fmt.int(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="region"
                      width={158}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      formatter={(v: string) => v.replace("Республика ", "Р. ").replace("область", "обл.").replace(" край", "")}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent formatter={(value, name) => [mwFormatter(Number(value)), String(name)]} />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="operating" name="Действующие" stackId="r" fill="var(--color-operating)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pipeline" name="Стройка и план" stackId="r" fill="var(--color-pipeline)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}

          {loading && !data ? (
            <div className="lg:col-span-2">
              <LoadingChart />
            </div>
          ) : data ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Выработка и рост мощности</CardTitle>
                <CardDescription>Столбцы — выработка, млрд кВт·ч; линия — мощность, МВт</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={generationChartConfig} className="aspect-auto h-[300px] w-full">
                  <ComposedChart data={data.dynamics} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={6} minTickGap={16} />
                    <YAxis yAxisId="gen" tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => fmt.num(v)} />
                    <YAxis
                      yAxisId="cap"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tickFormatter={(v: number) => (v >= 1000 ? `${fmt.num(v / 1000)} тыс.` : fmt.int(v))}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            String(name).includes("Выработка")
                              ? [twhFormatter(Number(value)), String(name)]
                              : [mwFormatter(Number(value)), String(name)]
                          }
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="gen" dataKey="generationTWh" name="Выработка, млрд кВт·ч" fill="var(--color-generation)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    <Line
                      yAxisId="cap"
                      dataKey="total"
                      name="Мощность, МВт"
                      type="monotone"
                      stroke="var(--color-capacity)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ===== Флагманские проекты ===== */}
        <div className="mt-10">
          <SectionHeading
            title="Флагманские проекты отрасли"
            subtitle="Крупнейшие и знаковые объекты альтернативной энергетики России"
            actions={
              <Button variant="outline" size="sm" className="gap-2" onClick={() => onNavigate?.("projects")}>
                Все проекты <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          />
          {loading && !data && (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          )}
          {data && (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.flagship.map((p) => (
                <Card key={p.id} className="h-full gap-0 py-0 transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${ENERGY_TYPE_META[p.type as EnergyTypeId].color}18`, color: ENERGY_TYPE_META[p.type as EnergyTypeId].color }}
                      >
                        <TypeIcon type={p.type} className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col items-end gap-1.5">
                        <TypeBadge type={p.type} />
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                    <h3 className="mt-3 text-base font-bold leading-snug">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.region}
                      {p.year ? ` · ${p.year} год` : ""}
                    </p>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                    <div className="mt-4 flex items-baseline justify-between border-t border-border/70 pt-3">
                      <span className="text-xl font-extrabold tabular-nums">
                        {fmt.int(p.capacityMW)} <span className="text-sm font-semibold text-muted-foreground">МВт</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.capacityMW >= 100 ? "крупнейший в классе" : "локальный флагман"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Конфигурации графиков */
const dynamicsChartConfig = {
  wind: { label: "Ветровая", color: ENERGY_TYPE_META.wind.color },
  solar: { label: "Солнечная", color: ENERGY_TYPE_META.solar.color },
  hydro: { label: "Малые ГЭС", color: ENERGY_TYPE_META.hydro.color },
  biomass: { label: "Биомасса", color: ENERGY_TYPE_META.biomass.color },
  geothermal: { label: "Геотермия", color: ENERGY_TYPE_META.geothermal.color },
} satisfies ChartConfig;

const structureChartConfig = {
  wind: { label: "Ветровая", color: ENERGY_TYPE_META.wind.color },
  solar: { label: "Солнечная", color: ENERGY_TYPE_META.solar.color },
  hydro: { label: "Малые ГЭС", color: ENERGY_TYPE_META.hydro.color },
  biomass: { label: "Биомасса", color: ENERGY_TYPE_META.biomass.color },
  geothermal: { label: "Геотермия", color: ENERGY_TYPE_META.geothermal.color },
} satisfies ChartConfig;

const regionsChartConfig = {
  operating: { label: "Действующие", color: "#059669" },
  pipeline: { label: "Стройка и план", color: "#f59e0b" },
} satisfies ChartConfig;

const generationChartConfig = {
  generation: { label: "Выработка, млрд кВт·ч", color: "#06b6d4" },
  capacity: { label: "Мощность, МВт", color: "#15803d" },
} satisfies ChartConfig;
