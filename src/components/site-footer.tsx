import { Wind, Database, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-primary-foreground">
              <Wind className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">ВИЭ·РФ</span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Аналитическая платформа по альтернативной энергетике России: мощности, виды ВИЭ,
            регионы, проекты и прогнозы развития отрасли до 2035 года.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Database className="mr-1.5 inline h-3.5 w-3.5" />
            Источники данных
          </h3>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <li>Минэнерго России — отраслевая статистика</li>
            <li>АО «Системный оператор» — данные о выработке</li>
            <li>АПВЭ / АСОГ — ассоциации ветро- и солнечной энергетики</li>
            <li>IRENA — мировой контекст (Global Renewables Outlook)</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" />
            Об источнике
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Данные агрегированы из открытых источников и носят справочно-аналитический характер.
            Каталог проектов — выборка ключевых объектов отрасли, а не полный реестр.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">© 2026 · Демонстрационная платформа</p>
        </div>
      </div>
    </footer>
  );
}
