"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { SectionHeading } from "@/components/section-heading";
import { TypeBadge, StatusBadge } from "@/components/badges";
import { TypeIcon } from "@/components/type-icon";
import { ErrorState } from "@/components/data-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, RotateCcw, MapPin, Building2, Banknote, CalendarDays, Filter, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ENERGY_TYPE_META, STATUS_META, fmt, type EnergyTypeId } from "@/lib/energy";

type ProjectItem = {
  id: number;
  name: string;
  type: string;
  typeName: string;
  region: string;
  district: string;
  capacityMW: number;
  status: string;
  year: number | null;
  isOperatingYear: boolean;
  operator: string;
  investmentBlnRub: number | null;
  description: string;
  isFlagship: boolean;
};

type ProjectsData = {
  items: ProjectItem[];
  stats: {
    total: number;
    operating: number;
    construction: number;
    planned: number;
    operatingMW: number;
    pipelineMW: number;
    regions: number;
    investedBlnRub: number;
  };
};

const PAGE_SIZE = 12;

export function ProjectsSection() {
  const { data, loading, error, reload } = useApi<ProjectsData>("/api/projects");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [district, setDistrict] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProjectItem | null>(null);

  const districts = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.items.map((p) => p.district))].sort((a, b) => a.localeCompare(b, "ru"));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.items.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (district !== "all" && p.district !== district) return false;
      if (q) {
        const hay = `${p.name} ${p.operator} ${p.region} ${p.district} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, query, type, status, district]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const resetFilters = () => {
    setQuery("");
    setType("all");
    setStatus("all");
    setDistrict("all");
    setPage(1);
  };

  const filtersActive = query || type !== "all" || status !== "all" || district !== "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Каталог ключевых проектов"
        subtitle="Действующие, строящиеся и планируемые объекты альтернативной энергетики"
        actions={
          data && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                {data.stats.total} проектов
              </span>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                {data.stats.operatingMW ? fmt.int(data.stats.operatingMW) : 0} МВт действует
              </span>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                {fmt.int(data.stats.pipelineMW)} МВт pipeline
              </span>
            </div>
          )
        }
      />

      {/* Фильтры */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по названию, оператору или региону…"
            className="pl-9"
            aria-label="Поиск проектов"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Фильтр по виду ВИЭ">
              <SelectValue placeholder="Вид ВИЭ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все виды</SelectItem>
              {(Object.keys(ENERGY_TYPE_META) as EnergyTypeId[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ENERGY_TYPE_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Фильтр по статусу">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={district}
            onValueChange={(v) => {
              setDistrict(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[190px]" aria-label="Фильтр по округу">
              <SelectValue placeholder="Округ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все округа</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2 shrink-0">
            <RotateCcw className="h-3.5 w-3.5" /> Сброс
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {loading && !data && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Найдено: <b className="text-foreground">{filtered.length}</b> из {data.stats.total}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((p) => {
                const meta = ENERGY_TYPE_META[p.type as EnergyTypeId];
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setSelected(p)}
                      aria-label={`Открыть карточку проекта ${p.name}`}
                    >
                      <Card className="h-full gap-0 py-0 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col p-5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={{ background: `${meta?.color ?? "#888"}18`, color: meta?.color }}
                            >
                              <TypeIcon type={p.type} className="h-5 w-5" />
                            </span>
                            <div className="flex flex-col items-end gap-1.5">
                              <TypeBadge type={p.type} />
                              <StatusBadge status={p.status} />
                            </div>
                          </div>
                          <h3 className="mt-3 text-base font-bold leading-snug">{p.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {p.region} · {p.district} ФО
                            </span>
                          </p>
                          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {p.description}
                          </p>
                          <div className="mt-4 grid grid-cols-3 items-end gap-2 border-t border-border/70 pt-3 text-xs">
                            <div>
                              <div className="text-muted-foreground">Мощность</div>
                              <div className="mt-0.5 text-base font-extrabold tabular-nums">
                                {fmt.int(p.capacityMW)} <span className="text-[11px] font-semibold text-muted-foreground">МВт</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{p.isOperatingYear ? "Введён" : "План"}</div>
                              <div className="mt-0.5 font-bold tabular-nums">{p.year ?? "—"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground">Инвестиции</div>
                              <div className="mt-0.5 font-bold tabular-nums">
                                {p.investmentBlnRub ? `${fmt.num(p.investmentBlnRub)} млрд ₽` : "—"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
              <p className="font-medium">По заданным условиям проекты не найдены</p>
              <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить фильтры или сбросить их</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" /> Сбросить фильтры
              </Button>
            </div>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)}>
                Показать ещё {Math.min(PAGE_SIZE, filtered.length - visible.length)} из {filtered.length - visible.length}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Диалог с деталями проекта */}
      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: `${ENERGY_TYPE_META[selected.type as EnergyTypeId]?.color}18`,
                      color: ENERGY_TYPE_META[selected.type as EnergyTypeId]?.color,
                    }}
                  >
                    <TypeIcon type={selected.type} className="h-5 w-5" />
                  </span>
                  <DialogTitle className="text-lg leading-snug">{selected.name}</DialogTitle>
                </div>
                <DialogDescription className="mt-3 flex flex-wrap items-center gap-2">
                  <TypeBadge type={selected.type} />
                  <StatusBadge status={selected.status} />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-secondary/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" /> Мощность
                    </div>
                    <div className="mt-1 font-bold tabular-nums">{fmt.int(selected.capacityMW)} МВт</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {selected.isOperatingYear ? "Год ввода" : "Плановый год"}
                    </div>
                    <div className="mt-1 font-bold tabular-nums">{selected.year ?? "—"}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> Регион
                    </div>
                    <div className="mt-1 font-semibold">{selected.region}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> Оператор
                    </div>
                    <div className="mt-1 font-semibold">{selected.operator}</div>
                  </div>
                </div>
                {selected.investmentBlnRub && (
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Banknote className="h-4 w-4" /> Инвестиции в проект
                    </span>
                    <span className="text-lg font-extrabold tabular-nums">
                      {fmt.num(selected.investmentBlnRub)} млрд ₽
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
