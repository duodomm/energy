#!/usr/bin/env python3
"""PDF-отчёт «Совет экспертов R12» — перезапуск 10 итераций совещаний.
DejaVu (кириллица + ₽), палитра сайта «Янтарный полдень».
Структура: обложка → содержание → мандат → диагноз → протокол И1–И10 →
сводная таблица 14 предложений → дорожная карта (3 волны) → анти-дорожная
карта + метрики + верификация. Разрывы страниц: только после обложки и
содержания; далее контент течёт непрерывно."""

import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, KeepTogether)

FDIR = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", FDIR + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", FDIR + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DVS", FDIR + "DejaVuSerif.ttf"))
pdfmetrics.registerFont(TTFont("DVSB", FDIR + "DejaVuSerif-Bold.ttf"))
pdfmetrics.registerFontFamily("DV", normal="DV", bold="DVB", italic="DV", boldItalic="DVB")

CREAM = HexColor("#faf8f3")
AMBER = HexColor("#e8940a")
PETROL = HexColor("#14657b")
INK = HexColor("#22272e")
MUT = HexColor("#6c7077")
BORD = HexColor("#e8e2d4")

PAGE_W, PAGE_H = A4
M = 18 * mm

styles = {
    "h1": ParagraphStyle("h1", fontName="DVSB", fontSize=20, leading=25, textColor=INK, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="DVB", fontSize=13.5, leading=17, textColor=PETROL, spaceBefore=10, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName="DVB", fontSize=10.5, leading=13, textColor=INK, spaceBefore=7, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="DV", fontSize=8.6, leading=12.2, textColor=INK, alignment=4, spaceAfter=3),
    "small": ParagraphStyle("small", fontName="DV", fontSize=7.6, leading=10.4, textColor=MUT, spaceAfter=2),
    "li": ParagraphStyle("li", fontName="DV", fontSize=8.6, leading=12.2, textColor=INK, leftIndent=10, spaceAfter=2.5),
    "cell": ParagraphStyle("cell", fontName="DV", fontSize=8.2, leading=11, textColor=INK),
    "cellB": ParagraphStyle("cellB", fontName="DVB", fontSize=8.2, leading=11, textColor=INK),
    "coverT": ParagraphStyle("coverT", fontName="DVSB", fontSize=27, leading=33, textColor=INK),
    "coverS": ParagraphStyle("coverS", fontName="DV", fontSize=11.5, leading=16, textColor=MUT),
}

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ── Парсинг стенограмм ──
def parse_iteration(n):
    p = f"scripts/council-r12/out-{n}.md"
    if not os.path.exists(p):
        return {"topic": "—", "experts": []}
    raw = open(p, encoding="utf-8").read()
    m = re.search(r"# И\d+: (.+)", raw)
    topic = m.group(1).strip() if m else "—"
    experts = []
    for name in ["ИНЖЕНЕР", "ЭКОНОМИСТ", "UX/UI", "ДИЗАЙНЕР"]:
        sec = re.search(rf"## {re.escape(name)}:(.*?)(?=## |\Z)", raw, re.S)
        if not sec:
            continue
        body = sec.group(1)
        finds = re.findall(r"^\d+\.\s*(.+)$", re.search(r"\*\*НАХОДКИ:\*\*(.*?)(?=\*\*ПРЕДЛОЖЕНИЯ|\Z)", body, re.S).group(1), re.M) if "**НАХОДКИ:**" in body else []
        props = re.findall(r"^\d+\.\s*(.+)$", re.search(r"\*\*ПРЕДЛОЖЕНИЯ:\*\*(.*?)$", body, re.S).group(1), re.M) if "**ПРЕДЛОЖЕНИЯ:**" in body else []
        experts.append({"name": name, "finds": finds[:2], "props": props[:3]})
    return {"topic": topic, "experts": experts}

def prop_reformat(p):
    s = esc(p)
    s = s.replace("ЧТО:", "<b>").replace(" / ЗАЧЕМ:", "</b> — зачем:")
    s = s.replace(" / КАК:", " · как:")
    s = re.sub(r"УСИЛИЯ \[(\w)\]", r"· усилия <b>[\1]</b>", s)
    s = s.replace(" / ", " · ")
    return s

ITER_TOPICS = [
    (1, "Первый экран и ключевое сообщение"),
    (2, "Экономическая модель и доверие к цифрам"),
    (3, "Воронка калькулятора: вход и удержание"),
    (4, "Прозрачность методологии"),
    (5, "Информационная архитектура и перелинковка"),
    (6, "Контент: покрытие семантики и форматы"),
    (7, "Визуальный язык и фото-канон"),
    (8, "Мобильный опыт и производительность"),
    (9, "Монетизация без потери доверия"),
    (10, "СИНТЕЗ: консолидация и дорожная карта"),
]

iters = [parse_iteration(n) for n, _ in ITER_TOPICS]

# ── Тело документа ──
story = []
story.append(Paragraph("Совет экспертов — мандат и метод", styles["h1"]))
story.append(Paragraph("Для проекта «Альтернативная энергетика РФ» проведено 10 итераций экспертных совещаний. В совете — четыре роли: инженер-проектировщик СЭС (15 лет практики в РФ), инвестиционный экономист, UX/UI-эксперт по конверсии инфо-ресурсов и дизайнер визуальных систем. Каждая итерация — одна фокусная тема; эксперты работали с брифом из реальных констант проекта (движок калькулятора, структура визарда, дизайн-токены «Янтарного полдня», текущее состояние главной статьи). Формат ответа фиксированный: находки, затем предложения «что / зачем / как / усилия».", styles["body"]))
story.append(Paragraph("Итерации: первый экран · экономическая модель · воронка калькулятора · прозрачность методологии · информационная архитектура · контент и семантика · визуальный язык · мобильный опыт и CWV · монетизация · синтез. Десятая итерация консолидирует материал предыдущих девяти и формирует дорожную карту. Полные стенограммы всех итераций — в репозитории проекта, scripts/council-r12/out-1…out-10.md.", styles["body"]))
story.append(Paragraph("Что это за документ", styles["h2"]))
story.append(Paragraph("Это управленческая выжимка для решения владельца: приоритизированные предложения, три волны реализации, анти-дорожная карта («что не делать») и метрики успеха. Протокол ниже сохраняет позицию каждого эксперта по каждой теме, чтобы решения принимались с пониманием trade-off, а не по усреднённому мнению.", styles["body"]))

story.append(Paragraph("Диагноз: состояние проекта на момент совета", styles["h2"]))
story.append(Paragraph("Движок: PR=0.78, дисконт 10%, рост тарифа 8%/год, дизель 0.27 л/кВт·ч; LCOE движка 4–10 ₽/кВт·ч; PSH — от 2.58 (Мурманск) до 3.99 (Краснодар). Калькулятор: визард из 6 шагов, результат без контактов, шаринг ссылки, автосейв. Контент: 14 статей, 5 кейсов с полными сметами, справочник 32 регионов, глоссарий. Главная: hero «Независимость» и статья с мягким авто-раскрытием. Дизайн «Янтарный полдень»: крем + янтарь + петроль, сцены ≤10% площади. Монетизация: лиды «смета за 24 часа»; реклама закрыта.", styles["body"]))

story.append(Paragraph("Протокол совещаний", styles["h2"]))
for (n, t), it in zip(ITER_TOPICS, iters):
    block = [Paragraph(f"И{n}: {esc(it['topic'])}", styles["h3"])]
    for e in it["experts"]:
        block.append(Paragraph(f"<font color='#14657b'><b>{esc(e['name'])}</b></font>", styles["small"]))
        for f_ in e["finds"]:
            block.append(Paragraph(f"• {esc(f_)}", styles["li"]))
        for pr in e["props"]:
            block.append(Paragraph(prop_reformat(pr), styles["li"]))
    story.append(KeepTogether(block))

story.append(Paragraph("Сводка предложений и дорожная карта", styles["h2"]))
story.append(Paragraph("14 предложений после приоритизации «влияние × усилия». Волна 1 — быстрые победы (недели), волна 2 — основная работа (месяцы), волна 3 — стратегические начинания.", styles["body"]))

rows = [[Paragraph("<b>№</b>", styles["cellB"]), Paragraph("<b>Предложение</b>", styles["cellB"]),
         Paragraph("<b>Влияние</b>", styles["cellB"]), Paragraph("<b>Усилия</b>", styles["cellB"]), Paragraph("<b>Волна</b>", styles["cellB"])]]
ROADMAP = [
    ("Быстрый режим калькулятора (2–3 поля) для новичков", "Высокое", "S", "1"),
    ("Сравнение LCOE с тарифом и дизелем прямо на результате", "Высокое", "S", "1"),
    ("Конкретика в hero: цена «от», срок сметы", "Высокое", "S", "1"),
    ("Видимый автосейв (индикатор сохранения)", "Среднее", "S", "1"),
    ("Оптимизация изображений (WebP/CDN, ≤100 КБ)", "Среднее", "M", "2"),
    ("Платная детализация сметы / расширенный пакет", "Среднее", "S", "2"),
    ("Чувствительность к параметрам (слайдеры цен/тарифов)", "Среднее", "M", "2"),
    ("Интерактивная карта PSH/СП по 32 регионам", "Среднее", "M", "2"),
    ("Пресет «свой сценарий» + справочник мощностей приборов", "Среднее", "M", "2"),
    ("Партнёрская программа поставщиков", "Среднее", "M", "2"),
    ("Раздел «Как мы считаем» с формулами и погрешностями", "Среднее", "L", "3"),
    ("Гайдлайны фото-контента (чек-лист кадров)", "Низкое", "M", "3"),
    ("Ленивая загрузка 3D-конфигуратора", "Низкое", "M", "3"),
    ("Интеграция справочника/глоссария в статьи", "Низкое", "S", "3"),
]
for i, (t, imp, eff, wave) in enumerate(ROADMAP, 1):
    rows.append([Paragraph(str(i), styles["cell"]), Paragraph(esc(t), styles["cell"]),
                 Paragraph(imp, styles["cell"]), Paragraph(eff, styles["cell"]),
                 Paragraph(wave, styles["cell"])])
tbl = Table(rows, colWidths=[8*mm, 92*mm, 22*mm, 16*mm, 12*mm], repeatRows=1)
tbl.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.5, BORD),
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#f0ede3")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [None, HexColor("#faf8f3")]),
]))
story.append(tbl)

story.append(Paragraph("Анти-дорожная карта: что НЕ делать", styles["h2"]))
for t in ["Тёмная тема — не пик аудитории, усилия не оправдывают.",
          "Усложнение калькулятора новыми шагами — порог входа и так высок.",
          "Рекламные блоки до наведения CWV — доверие расчётного ресурса дороже.",
          "Обязательные контакты для результата — сломает ключевое обещание."]:
    story.append(Paragraph(f"• {esc(t)}", styles["li"]))

story.append(Paragraph("Метрики успеха (горизонт 3 месяца)", styles["h2"]))
for t in ["Конверсия в калькулятор: +25% (быстрый режим, конкретика hero).",
          "Медиана времени расчёта: ≤2 минут (упрощение шагов).",
          "Время на сайте: +40% (карта регионов, related-материалы).",
          "Конверсия в лиды: +15% (качество CTA на результате)."]:
    story.append(Paragraph(f"• {esc(t)}", styles["li"]))

story.append(Paragraph("Примечания верификации", styles["h2"]))
story.append(Paragraph("Совет — экспертные мнения, а не аудированные факты. Перед реализацией волны 1 рекомендуется: сверить редакцию СП 20.13330 по официальным источникам; подтвердить диапазон LCOE 4–10 ₽ прогоном движка на репрезентативных пресетах; рыночные ориентиры (цены «от», партнёрские условия) проверить по актуальным прайсам. Стенограммы итераций — первоисточник; эта сводка — редакционная интерпретация.", styles["body"]))

# ── Обложка + сборка ──
def cover(flow):
    flow.append(Spacer(1, 52 * mm))
    flow.append(Table([[Paragraph("СОВЕТ ЭКСПЕРТОВ", ParagraphStyle("c1", fontName="DVSB", fontSize=11, textColor=AMBER, leading=14))]],
                      colWidths=[PAGE_W - 2 * M]))
    flow.append(Spacer(1, 4 * mm))
    flow.append(Paragraph("10 итераций совещаний<br/>по проекту<br/>«Альтернативная энергетика РФ»", styles["coverT"]))
    flow.append(Spacer(1, 8 * mm))
    flow.append(Paragraph("Инженер-солнечник · экономист · UX/UI · дизайнер", styles["coverS"]))
    flow.append(Spacer(1, 2 * mm))
    flow.append(Paragraph("Приоритизированные предложения по улучшению: дорожная карта, анти-дорожная карта, метрики", styles["coverS"]))
    flow.append(Spacer(1, 60 * mm))
    flow.append(Table([[Paragraph("Раунд R12 · перезапуск после сбоя контейнера · октябрь 2026", ParagraphStyle("c2", fontName="DV", fontSize=8.5, textColor=MUT))]],
                      colWidths=[PAGE_W - 2 * M]))
    flow.append(PageBreak())

def toc(flow):
    flow.append(Paragraph("Содержание", styles["h1"]))
    items = [
        ("Мандат и метод", "3"), ("Диагноз проекта", "3"), ("Протокол совещаний: И1–И10", "3–5"),
        ("Сводка 14 предложений и дорожная карта", "4–5"),
        ("Анти-дорожная карта", "5"), ("Метрики успеха", "5"), ("Примечания верификации", "5"),
    ]
    rows = [[Paragraph(esc(t), styles["cell"]), Paragraph(pg, styles["cell"])] for t, pg in items]
    t = Table(rows, colWidths=[150 * mm, 20 * mm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, BORD), ("TOPPADDING", (0, 0), (-1, -1), 4),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    flow.append(t)
    flow.append(PageBreak())

def on_page(canv, doc):
    canv.saveState()
    canv.setStrokeColor(BORD)
    canv.setLineWidth(0.6)
    canv.line(M, 12 * mm, PAGE_W - M, 12 * mm)
    canv.setFont("DV", 7)
    canv.setFillColor(MUT)
    canv.drawString(M, 8.2 * mm, "Совет экспертов · Альтернативная энергетика РФ · R12")
    canv.drawRightString(PAGE_W - M, 8.2 * mm, f"{canv.getPageNumber()}")
    if canv.getPageNumber() == 1:
        canv.setFillColor(CREAM)
        canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canv.setFillColor(AMBER)
        canv.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, stroke=0, fill=1)
        canv.setFillColor(PETROL)
        canv.rect(0, 0, PAGE_W, 5 * mm, stroke=0, fill=1)
    canv.restoreState()

doc = BaseDocTemplate("download/expert-council-r12.pdf", pagesize=A4,
                      leftMargin=M, rightMargin=M, topMargin=16 * mm, bottomMargin=18 * mm,
                      title="Совет экспертов R12 — Альтернативная энергетика РФ",
                      author="Совет экспертов (R12)")
frame = Frame(M, 18 * mm, PAGE_W - 2 * M, PAGE_H - 34 * mm, id="main")
doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=on_page)])

all_flow = []
cover(all_flow)
toc(all_flow)
all_flow.extend(story)
doc.build(all_flow)
print("PDF готов:", os.path.getsize("download/expert-council-r12.pdf") // 1024, "КБ")
