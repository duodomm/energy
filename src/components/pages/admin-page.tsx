"use client"

// Админ-зона (ТЗ 3.2: /admin/* — обновление справочников, статусы лидов без ПДн).
// В продакшене доступ через Cloudflare Access; здесь — демо-страница сводки.

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldCheck, Database, FileSpreadsheet, RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/common/page-hero"

interface AdminData {
  leads: {
    id: number; createdAt: string; objectType: string; region: string
    scenario: string; capexFrom: number | null; capexTo: number | null
    formId: string | null; deliveryStatus: string
  }[]
  priceHealth: { total: number; stale: number; oldestDays: number }
  counts: { articles: number; regions: number }
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  delivered: { label: "доставлен в CRM", cls: "bg-stable/15 text-stable" },
  pending_retry: { label: "ретрай техзаписи", cls: "bg-primary/15 text-primary" },
  failed: { label: "ошибка", cls: "bg-destructive/15 text-destructive" },
}

export function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => setData(d as AdminData))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => load())
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div>
      <PageHero
        eyebrow="Админ-зона · демо"
        title="Статусы лидов и здоровье справочников"
        description="Технические записи заявок без ПДн (ПДн живут только в РФ-CRM) и мониторинг актуальности цен. В продакшене доступ защищён Cloudflare Access (до 50 пользователей на Free)."
      />
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5 bg-primary/12 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Cloudflare Access (в проде)
            </Badge>
            {data && (
              <Badge variant="secondary" className="gap-1.5">
                <Database className="h-3.5 w-3.5" /> {data.counts.articles} статей · {data.counts.regions} регионов
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Обновить
          </Button>
        </div>

        {/* Здоровье цен */}
        {data && (
          <div className="card-premium mb-6 flex flex-wrap items-center gap-4 p-5">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Справочник цен</p>
              <p className="text-xs text-muted-foreground">
                {data.priceHealth.total} позиций каталога · старейшая запись {data.priceHealth.oldestDays} дн.
              </p>
            </div>
            {data.priceHealth.stale > 0 || data.priceHealth.oldestDays > 14 ? (
              <Badge variant="destructive" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                {data.priceHealth.stale > 0 ? `${data.priceHealth.stale} позиций устарели` : "старше 14 дней"} — алерт владельцу в Telegram
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 bg-stable/15 text-stable">
                актуально, обновление по регламенту (раз в 2 недели)
              </Badge>
            )}
          </div>
        )}

        {/* Лиды (техзаписи без ПДн) */}
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Журнал заявок (технические записи)</h2>
        {!data ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : data.leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Заявок пока нет.</p>
        ) : (
          <div className="card-premium overflow-hidden">
            <table className="w-full responsive-table">
              <thead>
                <tr><th>Дата</th><th>Форма</th><th>Объект</th><th>Регион</th><th>CAPEX</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {data.leads.map((l) => (
                  <tr key={l.id}>
                    <td data-label="Дата" className="whitespace-nowrap text-xs">{new Date(l.createdAt).toLocaleString("ru-RU")}</td>
                    <td data-label="Форма"><Badge variant="secondary" className="text-[10px]">{l.formId ?? "—"}</Badge></td>
                    <td data-label="Объект" className="text-xs">{l.objectType}</td>
                    <td data-label="Регион" className="text-xs">{l.region}</td>
                    <td data-label="CAPEX" className="whitespace-nowrap text-xs tabular-nums">
                      {l.capexFrom ? `${Math.round(l.capexFrom / 1000)}–${Math.round((l.capexTo ?? 0) / 1000)} тыс. ₽` : "—"}
                    </td>
                    <td data-label="Статус">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_BADGE[l.deliveryStatus]?.cls ?? "bg-secondary text-muted-foreground"}`}>
                        {STATUS_BADGE[l.deliveryStatus]?.label ?? l.deliveryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          ПДн (имя, телефон, e-mail) в этой таблице отсутствуют по построению — они передаются
          в РФ-CRM в момент заявки. Ретраи недоставленных техзаписей выполняет Cron Worker.
          Ежесуточный бэкап D1 → R2 (ротация 90 дней) — без ПДн по построению.
        </p>
      </div>
    </div>
  )
}
