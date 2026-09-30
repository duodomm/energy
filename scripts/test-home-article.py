#!/usr/bin/env python3
"""R10-восстановление: проверка мягкого авто-ката главной статьи."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000/"

def cont_height(pg):
    return pg.evaluate("() => { const c = document.querySelector('#glavnaya-statya .overflow-hidden'); return c ? c.getBoundingClientRect().height : -1 }")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.goto(BASE, wait_until="networkidle")

    # 1. Начальное состояние: свёрнуто, кнопок/баннеров нет
    h0 = cont_height(pg)
    btns = pg.locator("text=Читать дальше").count() + pg.locator("text=Свернуть").count()
    print(f"1. свёрнуто: высота продолжения = {h0:.0f}px (ожидаем ~0), кнопок = {btns}")

    # 2. Скролл к линии среза → авто-раскрытие
    pg.evaluate("() => { const c = document.querySelector('#glavnaya-statya .overflow-hidden'); window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 300) }")
    pg.wait_for_timeout(1400)
    h1 = cont_height(pg)
    h3n = pg.locator("#glavnaya-statya h3:visible").count()
    print(f"2. после докручивания: высота = {h1:.0f}px (ожидаем > 2000), видимых H3 = {h3n}")

    # 3. Уход вверх за статью → авто-свёртывание
    pg.evaluate("() => window.scrollTo(0, 0)")
    pg.wait_for_timeout(1400)
    h2 = cont_height(pg)
    print(f"3. после возврата наверх: высота = {h2:.0f}px (ожидаем ~0)")

    # 4. Клик «в продолжении статьи» в hero → раскрытие + скролл к статье
    pg.locator("button:has-text('в продолжении статьи')").click()
    pg.wait_for_timeout(1800)
    h3 = cont_height(pg)
    y = pg.evaluate("() => window.scrollY")
    print(f"4. после клика по hero-ссылке: высота = {h3:.0f}px, scrollY = {y:.0f} (ожидаем > 500)")

    # 5. Повторный скролл вниз → снова раскрыто
    pg.evaluate("() => window.scrollTo(0, document.body.scrollHeight * 0.4)")
    pg.wait_for_timeout(1200)
    print(f"5. в середине статьи: высота = {cont_height(pg):.0f}px (ожидаем > 2000)")

    # 6. Полоса прочтения на месте при раскрытии
    bar = pg.evaluate("() => { const el = document.querySelector('.reading-track'); return el ? getComputedStyle(el).display : 'none' }")
    print(f"6. reading-track при раскрытии: {bar}")

    pg.screenshot(path="tool-results/r12-article-expanded.png", full_page=False)
    b.close()
    print("done")
