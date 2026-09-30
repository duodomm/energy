#!/usr/bin/env python3
"""Скриншот витрины hero-вариантов (десктоп + мобайл) для самопроверки."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto("http://localhost:3000/hero-variants", wait_until="networkidle")
    pg.screenshot(path="tool-results/r11-variants-desktop.png", full_page=True)
    m = b.new_page(viewport={"width": 390, "height": 844})
    m.goto("http://localhost:3000/hero-variants", wait_until="networkidle")
    m.screenshot(path="tool-results/r11-variants-mobile.png", full_page=False)
    b.close()
    print("done")
