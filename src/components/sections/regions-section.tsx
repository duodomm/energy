"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { SectionHeading } from "@/components/section-heading";
import { ErrorState } from "@/components/data-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/badges";
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, Building2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENERGY_TYPE_META, fmt } from "@/lib/energy";

type RegionsData = {
  totalRegions: number;
  totalCapacityMW: number;
  totalProjects: number;
  districts: Array<{ district: string; total: number; projectsCount: number; regionsCount: number }>;
  regions: Array<{
    id: number;
    name: string;
    district: string;
    byType: Record<string, number>;
    total: number;
    operating: number;
    construction: number;
    planned: number;
    projectsCount: number;
    topProject: string | null;
    topProjectType: string | null;
    leadingType: string | null;
  }>;
};

type SortKey = "name" | "district" | "total" | "operating" | "pipeline" | "projectsCount";

function SortHead({
  k,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  k: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1.5 rounded text-xs font-semibold uppercase tracking-wide hover:text-foreground"
        aria-label={`Сортировать по полю ${label}`}
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function RegionsSection() {
  const { data, loading, error, reload } = useApi<RegionsData>("/api/regions");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [districtFilter, setDistrictFilter] = useState<string>("all");

  const sorted = useMemo(() => {
    if (!data) return [];
    let rows = data.regions;
    if (districtFilter !== "all") rows = rows.filter((r) => r.district === districtFilter);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = sortKey === "pipeline" ? a.construction + a.planned : (a[sortKey] as number | string);
      const vb = sortKey === "pipeline" ? b.construction + b.planned : (b[sortKey] as number | string);
      if (typeof va === "string" || typeof vb === "string") return String(va).localeCompare(String(vb), "ru") * dir;
      return (va - vb) * dir;
    });
  }, [data, sortKey, sortDir, districtFilter]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "district" ? "asc" : "desc");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Регионы и федеральные округа"
        subtitle="География альтернативной энергетики по каталогу ключевых объектов платформы"
      />

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {loading && !data && (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      )}

      {data && (
        <>
          {/* Сводка по округам — интерактивные карточки-фильтры */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <button
              onClick={() => setDistrictFilter("all")}
              className={cn(
                "rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                districtFilter === "all"
                  ? "border-primary bg-accent"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Все округа
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums">{fmt.int(data.totalCapacityMW)} МВт</div>
              <div className="text-[11px] text-muted-foreground">{data.totalProjects} проектов</div>
            </button>
            {data.districts.map((d) => (
              <button
                key={d.district}
                onClick={() => setDistrictFilter(d.district === districtFilter ? "all" : d.district)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                  districtFilter === d.district ? "border-primary bg-accent" : "border-border bg-card"
                )}
              >
                <div className="truncate text-xs font-semibold text-muted-foreground" title={d.district}>
                  {d.district} ФО
                </div>
                <div className="mt-1 text-lg font-extrabold tabular-nums">{fmt.int(d.total)} МВт</div>
                <div className="text-[11px] text-muted-foreground">
                  {d.projectsCount} пр. · {d.regionsCount} рег.
                </div>
              </button>
            ))}
          </div>

          {/* Таблица регионов */}
          <Card className="mt-6 gap-0 py-0">
            <CardContent className="p-0">
              <div className="custom-scrollbar max-h-[560px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <SortHead k="name" label="Регион" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortHead k="district" label="Округ" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                      <SortHead k="total" label="Всего, МВт" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="text-right" />
                      <SortHead k="operating" label="Действует" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="text-right hidden sm:table-cell" />
                      <SortHead k="pipeline" label="Стройка/план" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="text-right hidden sm:table-cell" />
                      <SortHead k="projectsCount" label="Объектов" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="text-right hidden md:table-cell" />
                      <TableHead className="hidden lg:table-cell">Ведущее направление</TableHead>
                      <TableHead className="hidden xl:table-cell">Флагман региона</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((r) => (
                      <TableRow key={r.id} className="cursor-default">
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{r.district}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">{fmt.int(r.total)}</TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                          {r.operating ? fmt.int(r.operating) : "—"}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-amber-600 dark:text-amber-400 sm:table-cell">
                          {r.construction + r.planned ? fmt.int(r.construction + r.planned) : "—"}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums md:table-cell">{r.projectsCount}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {r.leadingType ? <TypeBadge type={r.leadingType} /> : "—"}
                        </TableCell>
                        <TableCell className="hidden max-w-52 truncate text-xs text-muted-foreground xl:table-cell" title={r.topProject ?? ""}>
                          {r.topProject ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sorted.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          Нет регионов в выбранном федеральном округе
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Показано регионов: <b className="text-foreground">{sorted.length}</b> из {data.totalRegions}
                  {districtFilter !== "all" && ` · фильтр: ${districtFilter} ФО`}
                </span>
                {districtFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setDistrictFilter("all")}>
                    Сбросить фильтр
                  </Button>
                )}
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> по каталогу ключевых объектов
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
