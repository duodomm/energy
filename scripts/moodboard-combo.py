#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Мудборд v2 — «Свет вместо мрака».
10 сочетаний концептов №1–№10 (учёт функционала страниц) + 10 светлых палитр.
Статический офлайн-HTML, без внешних зависимостей и JS-библиотек."""

from pathlib import Path
from html import escape

OUT = Path("/home/z/my-project/download/design-moodboard-combo.html")
BARS = [34, 45, 58, 72, 86, 96, 100, 90, 76, 57, 38, 28]  # выработка по месяцам, %

# ---------------------------------------------------------------- данные ----

SPRINTS = [
    dict(
        title="Спринт 1 · Матрица совместимости", it="Итерации 1–5",
        items=[
            "Матрица 10×10: конфликты — №9 ⇄ №1 (неоморфные тени против чертёжных линий), №7 ⇄ №8 (3D-вес против плакатной лёгкости); синергии — №3+№4, №5+№8, №1+№5.",
            "Концепты поделены на роли: каркас (задаёт «мир»), якорь (несёт функцию), специи (точечно ≤10%). Два каркасных на одной странице = визуальный шум.",
            "Правило доминанты: 1 каркас + 1–2 якоря + ≤1 специя на страницу, не больше.",
            "Страницы сгруппированы в 5 типов: витрина · инструмент · библиотека · лонгрид · транзакция — у каждого свой визуальный «метаболизм» (эмоция / точность / сканируемость / чтение / доверие).",
            "Калькулятор — заповедник: движение только в зоне результата; зона ввода всегда спокойна (ошибка чтения = потеря лида).",
        ],
    ),
    dict(
        title="Спринт 2 · Сборка сочетаний", it="Итерации 6–10",
        items=[
            "Формула 60/30/10: 60% — нейтральный светлый каркас, 30% — якорный концепт, 10% — специи.",
            "Токен-архитектура: концепт = набор CSS-переменных (цвет, радиус, тень, сетка) поверх одной вёрстки. Смена концепта — не переделка.",
            "Роли JS-визуализаций закреплены: №4 — интерактивный ввод, №3 — живой результат, №6 — SEO-диаграммы, №2 — движение в hero после LCP; всё лениво (IntersectionObserver) и уважает prefers-reduced-motion.",
            "Фото-слой обязателен на витрине и в кейсах: эмоцию платим реальными фотографиями установок, а не градиентами.",
            "Итог спринта: 10 рецептов С1–С10 с раскладкой по типам страниц (раздел ниже).",
        ],
    ),
    dict(
        title="Спринт 3 · Свет вместо мрака", it="Итерации 11–15",
        items=[
            "Диагноз тёмного: графит #12161D давит на длинных страницах, фото на нём слепнет, РСЯ-блоки бьют белыми пятнами, оранжевый на чёрном читается «тревожно».",
            "Решение: светлая база (светлота 92–97%), тёмное — «сцены» 8–12% площади: панель результата, графики выработки, футер. Контраст работает как прожектор сцены.",
            "Двух-акцентная система: «солнечный» (янтарь/шафран — CTA, энергия) + «инженерный» (петроль/сталь/синь — данные, ссылки, графики). Один акцент — либо скучно, либо кислотно.",
            "WCAG AA зашит в токены: текст ≥4,5:1, на янтарных кнопках — тёмный текст, РСЯ-контейнеры — нейтральный светлый фон.",
            "Финал: канон = светлая база + чертёжный ритм + солнечный акцент + тёмные сцены данных. Палитры П1–П10 ниже.",
        ],
    ),
]

ROLES = [
    ("Каркас — задаёт «мир»", [("№1", "ГОСТ-чертёж"), ("№8", "Швейцарский плакат"), ("№10", "Двухрежимная тема")]),
    ("Якорь — несёт функцию", [("№3", "Пульт телеметрии"), ("№4", "Живой конфигуратор"), ("№5", "Фото-редакшн"), ("№6", "Солнечная траектория")]),
    ("Специи — точечно, ≤10%", [("№2", "Энергопоток"), ("№7", "3D-усадьба"), ("№9", "Приборная шкала")]),
]

COMBOS = [
    dict(id="С1", name="Светлый инженерный каркас",
         formula="№10 светлая база + №1 чертёжные штампы + №3 пульт итога + №5 фото в кейсах",
         pages=[("Витрина · главная", "светлый hero с фото объекта, count-up цифры (№8), полоса фактов"),
                ("Инструмент · калькулятор", "светлые шаги-«бланки», тёмная панель результата-пульт (№3)"),
                ("Библиотека · справочник", "карточки-«спецификации» со штампами ГОСТ (№1)"),
                ("Истории · кейсы", "фото-редакшн (№5): один сильный кадр + смета"),
                ("Лонгрид · блог", "чистая типографика, статичные SVG-диаграммы")],
         appeal="8,5", cx=1, cwv="низкий",
         verdict="Самый быстрый выход из мрака: 60% работы — токены цвета, остальная вёрстка уже есть."),
    dict(id="С2", name="Живой инструмент",
         formula="№4 конфигуратор — ядро + №3 пульт + №6 sun-path в шаге ориентации",
         pages=[("Витрина · главная", "мини-конфигуратор прямо в hero: два слайдера → живая цифра сметы"),
                ("Инструмент · калькулятор", "SVG-дом (№4) меняется на каждом шаге; sun-path (№6) при выборе стороны/угла; результат — пульт (№3)"),
                ("Библиотека · справочник", "спокойные таблицы без движения"),
                ("Истории · кейсы", "пресет «воспроизвести кейс в калькуляторе»"),
                ("Лонгрид · блог", "текст + одна интерактивная диаграмма на статью")],
         appeal="9", cx=4, cwv="INP: rAF-бюджет + мемоизация",
         verdict="Максимум живости там, где принимают решение. Ядро калькулятора в итоговой системе."),
    dict(id="С3", name="Фотореалистичное доверие",
         formula="№5 фото-доминанта + №8 плакатные цифры + №3 пульт итога",
         pages=[("Витрина · главная", "полноэкранный фото-hero, плакатная типографика, count-up окупаемости"),
                ("Истории · кейсы", "журнальные развороты: фото «до/после», смета, отзывы"),
                ("Инструмент · калькулятор", "спокойный светлый — контраст к эмоциональной витрине"),
                ("Библиотека · справочник", "строгая типографика, фото оборудования"),
                ("Лонгрид · блог", "фото-иллюстрации внутри текста")],
         appeal="9", cx=3, cwv="LCP: hero AVIF + fetchpriority",
         verdict="Лучший для лида: реальные установки продают убедительнее графики."),
    dict(id="С4", name="Солнечная наука",
         formula="№6 sun-path + годовая heatmap — стержень + №2 потоки в схемах + №10",
         pages=[("Витрина · главная", "интерактивная heatmap выработки по регионам РФ"),
                ("Инструмент · калькулятор", "шаг региона — мини-карта; шаг ориентации — sun-path (№6)"),
                ("Лонгрид · блог", "SEO-визуализации: «почему 30°», месячная heatmap"),
                ("Библиотека · справочник", "данные с мини-спарклайнами"),
                ("Истории · кейсы", "годовая heatmap объекта в шапке кейса")],
         appeal="8", cx=3, cwv="низкий: SVG легковесны",
         verdict="Лучший для поискового трафика: интерактивные диаграммы собирают внешние ссылки."),
    dict(id="С5", name="Плакат и цифра",
         formula="№8 швейцарский плакат — доминанта + №3 + №5 точечно",
         pages=[("Витрина · главная", "гигантские цифры, модульная сетка, воздух"),
                ("Инструмент · калькулятор", "«бланк» в сетке; результат — плакат из 4 цифр"),
                ("Библиотека · справочник", "таблицы в плакатной сетке"),
                ("Истории · кейсы", "плакатная обложка + фото-галерея внутри")],
         appeal="8,5", cx=2, cwv="минимальный: текст лёгкий",
         verdict="Премиальность без веса — самый CWV-дешёвый способ выглядеть дорого."),
    dict(id="С6", name="Приборная панель",
         formula="№9 неоморфные приборы + №3 телеметрия + №4 ввод слайдерами",
         pages=[("Витрина · главная", "«щитовая» стенда: шкалы автономии и мощности"),
                ("Инструмент · калькулятор", "тумблеры-выборы, шкалы вместо слайдеров, журнал изменений (№3)"),
                ("Библиотека · справочник", "моноширинные таблицы данных"),
                ("Истории · кейсы", "приборное сравнение «было/стало»")],
         appeal="7,5", cx=3, cwv="низкий",
         verdict="Нишевый вкус: техническая ЦА в восторге, массовая настораживается. Неоморфные тени — только крупными элементами."),
    dict(id="С7", name="Документ и производство",
         formula="№1 ГОСТ — доминанта + №5 фото объектов + №3 пульт",
         pages=[("Все страницы", "листы с рамками-штампами, выноски, спецификации"),
                ("Инструмент · калькулятор", "итог = спецификация оборудования на бланке → идеально в PDF"),
                ("Истории · кейсы", "фото с чертёжными выносками и размерами"),
                ("Витрина · главная", "«проектная папка»: обложки листов")],
         appeal="8", cx=2, cwv="низкий",
         verdict="Сильная идентичность для инженеров-заказчиков; на рынке конкурентов с таким языком нет."),
    dict(id="С8", name="Энергия в движении",
         formula="№2 частицы/потоки + №4 конфигуратор + №3 пульт",
         pages=[("Витрина · главная", "canvas-поток энергии в hero (запуск после LCP, пауза вне viewport)"),
                ("Инструмент · калькулятор", "поток-схема результата: панель → инвертор → дом → сеть/АКБ"),
                ("Лонгрид · блог", "анимированные схемы в гайдах"),
                ("Библиотека · справочник", "только статичные схемы")],
         appeal="8,5", cx=3, cwv="CPU/INP: lazy + prefers-reduced-motion",
         verdict="Живость под контролем бюджета: движение — награда, а не фон."),
    dict(id="С9", name="Иммерсивная усадьба",
         formula="№7 3D-дом + №4 конфигуратор + №5 фото",
         pages=[("Витрина · главная", "3D-усадьба как вход: клик по крыше → солнце, по гаражу → АКБ"),
                ("Инструмент · калькулятор", "3D-превью конфигурации: панели «ложатся» на крышу"),
                ("Истории · кейсы", "3D-облёт объекта + фото-галерея")],
         appeal="9", cx=5, cwv="высокий → волна 2, lazy, деградация в SVG",
         verdict="Wow-эффект для презентаций; в прод — только после волн 1–2."),
    dict(id="С10", name="Энергосистема — синтез комиссии", star=True,
         formula="база №10 · каркас №1+№8 · ядро №4+№3 · доверие №5 · наука №6 · движение №2 · 3D №7 (v2)",
         pages=[("Витрина · главная", "фото-hero (№5) + плакатные цифры (№8) + региональная heatmap (№6)"),
                ("Инструмент · калькулятор", "живой конфигуратор (№4) + sun-path (№6) в ориентации + пульт-результат (№3) на тёмной «сцене»"),
                ("Библиотека · справочник", "карточки-спецификации (№1), спокойствие"),
                ("Истории · кейсы", "фото-редакшн (№5) + сметы-бланки (№1)"),
                ("Лонгрид · блог", "интерактивные SVG (№6/№2), фото-вставки"),
                ("Тёмные «сцены»", "только результат, графики выработки, футер — 8–12% площади")],
         appeal="9,5", cx=5, cwv="управляемый: тяжёлое — lazy, поэтапно",
         verdict="Рекомендация комиссии: целевая система. Волна 1 = С1 (каркас) → волна 2 = №4+№6 → волна 3 = №2/№7."),
]

PALETTES = [
    dict(id="П1", name="Янтарный полдень", tag="тёплый белый + янтарь + петроль", fav=True,
         bg="#FAF8F3", sf="#FFFFFF", b="#E8E2D5", tx="#22272E", mu="#6C7077",
         ac="#E8940A", on="#22272E", a2="#14657B", sc="#1F252D", sct="#F2EFE7", ser="#FFB020",
         character="Тёплый, солнечный, «инженерная премиальность» без мрака. Брендовый #FFB020 живёт в тёмных сценах и сериях графиков.",
         cta="CTA: янтарная кнопка, тёмный текст — контраст AA.",
         verdict="фаворит комиссии, базовый кандидат."),
    dict(id="П2", name="Северное солнце", tag="снег + шафран + петроль-циан",
         bg="#F4F8FB", sf="#FFFFFF", b="#DCE6EE", tx="#17334A", mu="#5F7588",
         ac="#F2A007", on="#1B2B38", a2="#0E7490", sc="#0C2E40", sct="#E9F2F7", ser="#FFC65C",
         character="«Солнце над снегом»: свежесть и чистота. Уместен акцент на ветер и северные регионы.",
         cta="CTA: шафран на снежном фоне, тёмный текст.",
         verdict="сильна на региональных страницах Севера."),
    dict(id="П3", name="Медная усадьба", tag="сливочный + медь + туманная зелень",
         bg="#FAF6EF", sf="#FFFFFF", b="#E7DECD", tx="#2C2822", mu="#7A7261",
         ac="#C25E1E", on="#FFFFFF", a2="#4C6B57", sc="#33302A", sct="#F1EBDF", ser="#E08B4F",
         character="Загородный премиум: медь, дерево, лён. Говорит на языке дач и коттеджей.",
         cta="CTA: медная кнопка, белый текст крупным кеглем.",
         verdict="идеальна для дачного калькулятора и кейсов."),
    dict(id="П4", name="Хвойный вольт", tag="светло-шалфейный + хвоя + вольт-лайм",
         bg="#F5F7F3", sf="#FFFFFF", b="#DFE5DA", tx="#1F2A23", mu="#68745F",
         ac="#3F7C4F", on="#FFFFFF", a2="#2E5E8C", sc="#1C2B22", sct="#EAF0E7", ser="#A3C93A",
         character="Эко-инженерия без клише: лес и техника. Вольт-лайм — только на тёмных сценах.",
         cta="CTA: хвойная кнопка, белый текст.",
         verdict="для разделов автономности и накопителей."),
    dict(id="П5", name="Северное сияние", tag="белый + индиго + янтарь",
         bg="#F7F8FA", sf="#FFFFFF", b="#E2E5EC", tx="#2B3245", mu="#6F7488",
         ac="#E7A008", on="#2B3245", a2="#6D5BD0", sc="#232A45", sct="#ECEEF7", ser="#9C8CFF",
         character="Научный премиум: полярная ночь и сияние. Данные на индиго-сценах выглядят дорого.",
         cta="CTA: янтарь, тёмный текст; индиго — только графики и ссылки.",
         verdict="для прогнозов, LCOE и раздела Storage."),
    dict(id="П6", name="Стальной сигнал", tag="светло-стальной + сигнальный жёлтый",
         bg="#EEF2F6", sf="#FFFFFF", b="#D8DFE7", tx="#29323C", mu="#66717D",
         ac="#F5B301", on="#29323C", a2="#4A6274", sc="#26313B", sct="#EDF1F5", ser="#FFD34D",
         character="Индустриальная строгость: «высоковольтный жёлтый» — знаковый цвет отрасли.",
         cta="CTA: сигнальный жёлтый + тёмный текст (язык дорожных знаков).",
         verdict="самая «энергетическая»; жёлтый не заливать — дозировать."),
    dict(id="П7", name="Медовый графит", tag="тёплый белый + мёд + серо-стальной",
         bg="#F6F1E8", sf="#FFFFFF", b="#E6DFCF", tx="#34302A", mu="#7C7566",
         ac="#D98E1B", on="#34302A", a2="#6B7A8C", sc="#2E2B25", sct="#F1EDE3", ser="#EAB54B",
         character="Мягкий скандинавский сервис: снижает «страх заявки», дружелюбен к лид-формам.",
         cta="CTA: медовая кнопка, тёмный текст.",
         verdict="для страниц транзакции и форм заявки."),
    dict(id="П8", name="Лагуна", tag="аква-белый + коралл + тил",
         bg="#F2F7F5", sf="#FFFFFF", b="#DCE8E4", tx="#173F3A", mu="#5A7A74",
         ac="#E76F51", on="#FFFFFF", a2="#13808C", sc="#0F3B36", sct="#E8F3F0", ser="#F2A48C",
         character="Свежесть и энергия прилива. Смелее консервативного бренда — проверить на фокус-группе.",
         cta="CTA: коралловая кнопка, белый текст.",
         verdict="кандидат на A/B-тест против П1."),
    dict(id="П9", name="Чертёжная синь", tag="бумага + синь + янтарь",
         bg="#F7FAFD", sf="#FFFFFF", b="#DBE6F0", tx="#1C3D5A", mu="#5F7489",
         ac="#F59E0B", on="#1C3D5A", a2="#2E6FB7", sc="#123049", sct="#EAF2FA", ser="#FFC24D",
         character="«Лист чертежа»: техническая доверительность, идеальная пара концепту №1 (ГОСТ).",
         cta="CTA: янтарь с тёмным текстом; синь — линии, ссылки, данные.",
         verdict="лучшая пара для сочетаний С1 / С7 / С10."),
    dict(id="П10", name="Рассвет", tag="тёплый белый + закатный градиент",
         bg="#FAF7F5", sf="#FFFFFF", b="#E9E2DC", tx="#2D2A26", mu="#756D66",
         ac="linear-gradient(90deg,#F5B93C,#E76F51)", on="#2D2A26", a2="#35586E", sc="#2B2E38", sct="#F0EEEB", ser="#F5B93C",
         character="Нарратив «от рассвета к полдню»: градиент янтарь→коралл — только в hero и на сценах, дозированно.",
         cta="CTA: градиентная кнопка, тёмный текст; в тексте градиентов нет.",
         verdict="для редакционных разделов и сторителлинга."),
]

WAVES = [
    ("Волна 1 · недели 1–3", "Светлая тема №10 на палитре П1 + фото №5 на витрине и в кейсах + пульт №3 результата + штампы №1 в справочнике. Эквивалент сочетания С1 — быстрый видимый результат."),
    ("Волна 2 · недели 4–7", "Конфигуратор №4 в калькуляторе + sun-path №6 в шаге ориентации + heatmap регионов. Элементы С2/С4 — ядро «живости»."),
    ("Волна 3 · квартал 2", "Частицы №2 в hero (lazy) + 3D №7 опцией + приборы №9 в LCOE-мини. Специи — после стабилизации волн 1–2."),
]

# ------------------------------------------------------------------- CSS ----

CSS = """
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,'Inter','Helvetica Neue',Arial,sans-serif;
     background:#F5F6F8;color:#22272E;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:28px 20px 90px}
a{color:#14657B}
.hero{position:relative;background:#FFFFFF;border:1px solid #E3E6EA;border-radius:18px;padding:34px 34px 30px;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;
  background-image:linear-gradient(#E9EDF2 1px,transparent 1px),linear-gradient(90deg,#E9EDF2 1px,transparent 1px);
  background-size:26px 26px;opacity:.55;pointer-events:none}
.hero>*{position:relative}
.stamp{display:flex;flex-wrap:wrap;border:2px solid #22272E;margin-bottom:22px;font-size:11px;font-weight:700;letter-spacing:.1em}
.stamp span{padding:6px 14px;border-right:2px solid #22272E}
.stamp span:last-child{border-right:0}
.stamp span:nth-child(2){flex:1;text-align:center;min-width:180px}
.kicker{color:#14657B;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px}
h1{margin:0 0 10px;font-size:clamp(28px,4.4vw,42px);line-height:1.08;letter-spacing:-.01em}
.lead{max-width:70ch;margin:0;color:#4A5058;font-size:15.5px}
.sec{margin-top:54px}
.sec-h{display:flex;align-items:baseline;gap:12px;border-bottom:2px solid #22272E;padding-bottom:9px;margin-bottom:18px}
.sec-h h2{margin:0;font-size:22px}
.sec-h small{color:#7A8087;font-weight:600}
.sprints{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:16px}
.sprint{background:#FFF;border:1px solid #E3E6EA;border-radius:14px;padding:18px 20px}
.sprint h3{margin:0 0 2px;font-size:16px}
.sprint .it{color:#14657B;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.sprint ol{margin:10px 0 0;padding-left:20px}
.sprint li{margin:7px 0;font-size:13.5px;color:#3A4148}
.roles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px;margin-top:16px}
.role{background:#FFF;border:1px solid #E3E6EA;border-radius:14px;padding:16px 18px}
.role h3{margin:0 0 10px;font-size:14.5px}
.rchip{display:flex;gap:10px;align-items:baseline;margin:6px 0;font-size:13.5px}
.rchip b{color:#14657B;min-width:30px}
.rule{background:#FFF8E8;border:1px solid #F0DFB2;border-radius:14px;padding:14px 18px;margin-top:16px;font-size:14px}
.combos{display:grid;gap:16px}
.combo{background:#FFF;border:1px solid #E3E6EA;border-radius:16px;padding:20px 22px;min-width:0}
.combo.star{border:2px solid #E8940A;position:relative}
.badge{position:absolute;top:-11px;right:18px;background:#E8940A;color:#22272E;font-size:11px;font-weight:800;
       letter-spacing:.1em;padding:4px 12px;border-radius:999px}
.cid{color:#14657B;font-weight:800;letter-spacing:.08em;font-size:12.5px}
.combo h3{margin:3px 0 4px;font-size:19px}
.formula{margin:0 0 12px;color:#4A5058;font-size:13.5px}
.formula b{color:#22272E}
.pages{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:7px 20px;margin:0;padding:0;list-style:none}
.pages .pg{font-size:13.5px;color:#3A4148}
.pg-l{font-weight:700;color:#14657B}
.scores{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.pill{background:#F0F4F7;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700;color:#3A4148}
.pill.hot{background:#FFF0CE;color:#8A5A00}
.cverdict{margin:11px 0 0;font-size:13.5px;color:#4A5058}
.cverdict b{color:#22272E}
.pals{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(430px,100%),1fr));gap:18px}
.pal{background:#FFF;border:1px solid #E3E6EA;border-radius:18px;padding:20px;display:grid;gap:13px;min-width:0}
.pal.fav{border:2px solid #E8940A}
.pal-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.pid{color:#14657B;font-weight:800;letter-spacing:.08em;font-size:12.5px}
.pal h3{margin:2px 0 3px;font-size:19px}
.ptag{margin:0;color:#4A5058;font-size:13px}
.favtag{background:#E8940A;color:#22272E;font-size:11px;font-weight:800;letter-spacing:.08em;padding:4px 11px;border-radius:999px;white-space:nowrap}
.demo{border-radius:13px;border:1px solid var(--b);background:var(--bg);color:var(--tx);padding:16px 17px;display:grid;gap:12px}
.d-kick{font-size:10px;letter-spacing:.18em;font-weight:800;color:var(--a2);text-transform:uppercase}
.d-row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.d-ttl{font-weight:800;font-size:19px;line-height:1.15}
.d-sub{font-size:12px;color:var(--mu);margin-top:3px}
.d-btn{background:var(--ac);color:var(--on);font-weight:800;border-radius:10px;padding:10px 16px;font-size:13px}
.d-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.d-stat{background:var(--sf);border:1px solid var(--b);border-radius:10px;padding:8px 11px}
.d-stat b{display:block;font-size:17.5px;line-height:1.1}
.d-stat span{font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em}
.d-chart{background:var(--sc);border-radius:12px;padding:11px 14px 13px;color:var(--sct)}
.d-cht{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.75}
.d-bars{display:flex;align-items:flex-end;gap:5px;height:62px;margin-top:9px}
.d-bars i{flex:1;border-radius:3px 3px 0 0;background:var(--ser)}
.d-ad{border:1.5px dashed var(--b);border-radius:10px;padding:9px 12px;font-size:10.5px;color:var(--mu);
      letter-spacing:.06em;text-transform:uppercase;text-align:center}
.swatches{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sw-t{min-width:0}
.sw-t code{word-break:break-all}
.sw{display:flex;gap:9px;align-items:center;border:1px solid #EEF1F4;border-radius:10px;padding:6px 9px;background:#FAFBFC}
.sw-c{width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,0,0,.1);flex:none}
.sw-t small{display:block;font-size:10px;color:#7A8087;text-transform:uppercase;letter-spacing:.05em}
.sw-t code{font-size:11.5px;color:#22272E;font-weight:700}
.pchar,.pcta{margin:0;font-size:13.5px;color:#3A4148}
.pcta b{color:#22272E}
.pverdict{margin:0;font-size:13px;color:#4A5058;background:#F5F7F9;border-radius:10px;padding:9px 12px}
.pverdict b{color:#22272E}
.waves{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px}
.wave{background:#FFF;border:1px solid #E3E6EA;border-radius:14px;padding:16px 18px}
.wave h3{margin:0 0 8px;font-size:15px;color:#14657B}
.wave p{margin:0;font-size:13.5px;color:#3A4148}
.verdict-box{background:#22272E;color:#F2EFE7;border-radius:16px;padding:22px 26px;margin-top:16px}
.verdict-box h3{margin:0 0 10px;font-size:17px;color:#FFB020}
.verdict-box ul{margin:0;padding-left:20px}
.verdict-box li{margin:7px 0;font-size:14px}
.foot{margin-top:40px;color:#7A8087;font-size:12px;text-align:center}
@media(max-width:640px){.hero{padding:24px 18px}.pals{grid-template-columns:1fr}
.swatches{grid-template-columns:repeat(2,minmax(0,1fr))}
.d-stat b{font-size:15px}.d-stat span{letter-spacing:.04em}
.d-ttl{font-size:16px}.d-btn{padding:9px 13px;font-size:12px}
.stamp span{padding:5px 10px}.stamp span:nth-child(2){min-width:0}}
"""

# --------------------------------------------------------------- сборка ----


def combo_card(c):
    star = " star" if c.get("star") else ""
    badge = '<span class="badge">ВЫБОР КОМИССИИ</span>' if c.get("star") else ""
    pages = "".join(
        f'<div class="pg"><span class="pg-l">{escape(l)}</span> — {escape(t)}</div>'
        for l, t in c["pages"]
    )
    return f"""<article class="combo{star}">{badge}
  <span class="cid">{c['id']}</span>
  <h3>{escape(c['name'])}</h3>
  <p class="formula"><b>Формула:</b> {escape(c['formula'])}</p>
  <div class="pages">{pages}</div>
  <div class="scores">
    <span class="pill hot">Привлекательность {c['appeal']}/10</span>
    <span class="pill">Сложность {c['cx']}/5</span>
    <span class="pill">Риск CWV: {escape(c['cwv'])}</span>
  </div>
  <p class="cverdict"><b>Вердикт:</b> {escape(c['verdict'])}</p>
</article>"""


def pal_card(p):
    fav = " fav" if p.get("fav") else ""
    favtag = '<span class="favtag">★ ФАВОРИТ</span>' if p.get("fav") else ""
    btn = p["ac"]
    vars_ = (f"--bg:{p['bg']};--sf:{p['sf']};--b:{p['b']};--tx:{p['tx']};--mu:{p['mu']};"
             f"--ac:{btn};--on:{p['on']};--a2:{p['a2']};--sc:{p['sc']};--sct:{p['sct']};--ser:{p['ser']};")
    bars = "".join(f'<i style="height:{h}%;opacity:{0.45 + 0.55 * h / 100:.2f}"></i>' for h in BARS)
    sw = "".join(
        f'<div class="sw"><span class="sw-c" style="background:{col}"></span>'
        f'<span class="sw-t"><small>{lab}</small><code>{col}</code></span></div>'
        for lab, col in [("Фон", p["bg"]), ("Поверхность", p["sf"]), ("Текст", p["tx"]),
                         ("CTA · энергия", p["ac"]), ("Данные", p["a2"]), ("Сцена данных", p["sc"])]
    )
    return f"""<article class="pal{fav}">
  <div class="pal-head">
    <div><span class="pid">{p['id']}</span><h3>{escape(p['name'])}</h3><p class="ptag">{escape(p['tag'])}</p></div>
    {favtag}
  </div>
  <div class="demo" style="{vars_}">
    <div class="d-kick">Дом · Автономная станция</div>
    <div class="d-row">
      <div>
        <div class="d-ttl">Солнечная станция 10 кВт</div>
        <div class="d-sub">Краснодарский край · юг крыши, 30° · 24 панели</div>
      </div>
      <span class="d-btn">Рассчитать смету</span>
    </div>
    <div class="d-stats">
      <div class="d-stat"><b>1 150</b><span>кВт·ч/мес</span></div>
      <div class="d-stat"><b>6,5</b><span>лет окупаемость</span></div>
      <div class="d-stat"><b>92 %</b><span>автономия</span></div>
    </div>
    <div class="d-chart"><div class="d-cht">Выработка по месяцам</div><div class="d-bars">{bars}</div></div>
    <div class="d-ad">РСЯ · 300×250 · фикс. высота (CLS-safe)</div>
  </div>
  <div class="swatches">{sw}</div>
  <p class="pchar">{escape(p['character'])}</p>
  <p class="pcta"><b>Контраст CTA:</b> {escape(p['cta'])}</p>
  <p class="pverdict"><b>Вердикт комиссии:</b> {escape(p['verdict'])}</p>
</article>"""


sprints_html = "".join(
    f"""<div class="sprint"><h3>{escape(s['title'])}</h3><div class="it">{escape(s['it'])}</div>
    <ol>{''.join(f'<li>{escape(i)}</li>' for i in s['items'])}</ol></div>"""
    for s in SPRINTS
)

roles_html = "".join(
    f"""<div class="role"><h3>{escape(t)}</h3>{''.join(f'<div class="rchip"><b>{n}</b>{escape(nm)}</div>' for n, nm in items)}</div>"""
    for t, items in ROLES
)

combos_html = "".join(combo_card(c) for c in COMBOS)
pals_html = "".join(pal_card(p) for p in PALETTES)
waves_html = "".join(
    f"""<div class="wave"><h3>{escape(t)}</h3><p>{escape(d)}</p></div>""" for t, d in WAVES
)

html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>АЭ·РФ — Мудборд v2: 10 сочетаний · 10 палитр</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">

<header class="hero">
  <div class="stamp"><span>АЭ·РФ</span><span>ДИЗАЙН-ПРОТОКОЛ v2</span><span>КОМИССИЯ · 15 ИТЕРАЦИЙ</span><span>ЛИСТ 1/1</span></div>
  <p class="kicker">Сочетание концептов №1–№10 · светлые палитры</p>
  <h1>Свет вместо мрака</h1>
  <p class="lead">Комиссия (ведущий UX/UI-эксперт и профессиональный дизайнер, 15 итераций совещаний) собрала
  10 комбинированных решений с учётом функционала страниц и 10 цветовых систем на светлой базе.
  Основа — концепты №1–№10 из первого борда (design-concepts-10.html).</p>
</header>

<section class="sec">
  <div class="sec-h"><h2>1 · Протокол комиссии</h2><small>15 итераций · 3 спринта</small></div>
  <div class="sprints">{sprints_html}</div>
  <div class="roles">{roles_html}</div>
  <div class="rule"><b>Правило сборки 60/30/10:</b> на каждой странице — один каркасный концепт (60% впечатления),
  один-два якорных (30%) и не более одной «специи» (10%). Калькулятор: в зоне ввода — покой, в зоне результата — жизнь.</div>
</section>

<section class="sec">
  <div class="sec-h"><h2>2 · Десять сочетаний концептов</h2><small>с раскладкой по типам страниц</small></div>
  <div class="combos">{combos_html}</div>
</section>

<section class="sec">
  <div class="sec-h"><h2>3 · Десять светлых палитр</h2><small>уход от чёрного · двух-акцентная система</small></div>
  <div class="pals">{pals_html}</div>
</section>

<section class="sec">
  <div class="sec-h"><h2>4 · Дорожная карта</h2><small>3 волны · CWV-бюджет на каждый приём</small></div>
  <div class="waves">{waves_html}</div>
  <div class="verdict-box">
    <h3>Вердикт комиссии</h3>
    <ul>
      <li><b>Целевая система — С10 «Энергосистема»</b>: светлая база №10, каркас №1+№8, ядро калькулятора №4+№3, доверие №5, наука №6. Внедрение волнами, старт — с С1.</li>
      <li><b>Палитра — П1 «Янтарный полдень»</b>; шорт-лист: П9 «Чертёжная синь», П6 «Стальной сигнал»; П3 — дачный лендинг; П8 — на A/B-тест.</li>
      <li><b>Тёмные «сцены» сохраняются</b> только как приём: панель результата, графики выработки, футер — 8–12% площади страницы.</li>
      <li><b>Бюджеты производительности не нарушаются:</b> LCP ≤ 2,5 с · INP ≤ 200 мс · CLS ≤ 0,1; тяжёлые приёмы — ленивые и после волны 1.</li>
    </ul>
  </div>
</section>

<p class="foot">Альтернативная энергетика РФ · дизайн-протокол v2 · статический офлайн-документ · цветовые значения округлены к токен-системе</p>
</div>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"OK: {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
