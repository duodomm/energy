#!/usr/bin/env python3
# Оптимизация новых фото для витрины: hero (a1-clean) и карточка «Дом» (b4)
from PIL import Image

def process(src, dst, width, quality=80):
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"{dst}: {im.width}x{im.height}")

# Hero: новый дом вместо голубого
process("/tmp/candidates/a1-clean.png", "/home/z/my-project/public/photos/hero-house.jpg", 1600)
# Карточка «Дом»: белый двухэтажный дом (b4, Homes&Gardens, без вотермарок)
process("/tmp/candidates/b4.jpg", "/home/z/my-project/public/photos/house-modern.jpg", 1200)
