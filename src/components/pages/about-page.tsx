"use client"

import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/common/page-hero"
import { Sun, TrendingUp, ShieldCheck, Users, Database, Gauge, FileDown, BookOpen } from "lucide-react"
import { navigate } from "@/lib/router"

const PRINCIPLES = [
  { icon: Gauge, title: "Расчёт в браузере", text: "Расчётное ядро выполняется на клиенте: смета не ждёт сервера, а API не тратит квоту на каждый ввод. 95% трафика — статика и клиентский JS." },
  { icon: Database, title: "Справочники с датой", text: "PSH, тарифы, ценовые диапазоны и нормы хранятся с датой актуальности. Старше 14 дней — предупреждение на сметах и алерт владельцу справочника." },
  { icon: ShieldCheck, title: "ПДн только в РФ", text: "Персональные данные из форм передаются в CRM на территории РФ и хранятся только там. В инфраструктуре сайта — технические записи без ПДн (152-ФЗ/242-ФЗ)." },
  { icon: Users, title: "Методология — консилиум", text: "Логику калькулятора согласовали инженер-техэксперт, экономист-снабженец, сметчик, монтажник и UX-эксперт: 23 итерации согласования + внешняя экспертиза." },
]

export function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="О проекте"
        title="Инженерный подход к альтернативной энергетике"
        description="«Альтернативная энергетика РФ» — информационно-расчётный ресурс: профессиональный калькулятор, справочники и хабы по солнечной генерации, накопителям и резерву. Мы считаем честно и объясняем каждый параметр, влияющий на цену."
      />
      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="card-premium p-5">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3.5 text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Методология расчёта</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>• <b className="text-foreground">Генерация:</b> E = P × PSH × K_ориент × K_затенения × PR × дни. PSH — среднемесячные значения региона (NASA POWER + атласы, пересмотр квартально), PR = 0,78.</li>
            <li>• <b className="text-foreground">АКБ:</b> C = E_автономии / (DoD × η_инвертора × η_АКБ). Технологии: LiFePO4 90%, NMC 80%, AGM 50%, VRFB 100%.</li>
            <li>• <b className="text-foreground">Инвертор:</b> P ≥ пик × 1,25 (гибрид) / 1,3 (автономия); сетевой — согласование с массивом DC/AC.</li>
            <li>• <b className="text-foreground">Монтаж:</b> нормо-часы по позициям × ставка округа × региональный коэффициент, не ниже минимального выезда бригады.</li>
            <li>• <b className="text-foreground">Экономика:</b> LCOE с дисконтом 10% и номинальный; окупаемость статическая и динамическая (рост тарифа 8%/год); сравнение с сетью, газом и дизелем.</li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Точность энергетики — ±5% на контрольных примерах; смета сходится с контрольными сметами
            в пределах 7%. Результат всегда предварительный: точная цена — после аудита объекта.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Команда и экспертиза (E-E-A-T)</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Авторы материалов — практики: главный инженер (монтаж и проектирование СЭС 2014+),
            экономист-снабженец (закупки и сметы), сметчик нормо-часов. Внешняя экспертиза v1.1 —
            совет с юристом по ПДн и SEO-специалистом.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="justify-start" onClick={() => navigate("#/kalkulyator")}>
            <Sun className="mr-2 h-4 w-4 text-primary" /> Калькулятор
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate("#/regiony")}>
            <FileDown className="mr-2 h-4 w-4 text-primary" /> Регионы
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate("#/spravochnik")}>
            <BookOpen className="mr-2 h-4 w-4 text-primary" /> Справочник
          </Button>
        </div>
      </div>
    </div>
  )
}
