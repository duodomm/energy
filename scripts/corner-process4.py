# -*- coding: utf-8 -*-
"""Финал раунда 5: замена уголков blog/about/contacts/generator + баннер generator
(из вычищенного кадра), баннер storage умным кропом без зоны логотипа."""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = "scripts/corner-src"
DST = "public/photos/corner"
HUB = "public/photos/hub"

BLACK = (22, 52, 64)
MID = (198, 164, 120)
WHITE = (252, 243, 216)

def center_crop(im, ratio):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio)
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))

def duotone(im):
    g = im.convert("L")
    g = ImageOps.autocontrast(g, cutoff=1)
    g = ImageEnhance.Contrast(g).enhance(0.97)
    return ImageOps.colorize(g, black=BLACK, white=WHITE, mid=MID, blackpoint=0, whitepoint=255, midpoint=116)

def save(im, out):
    im.save(out, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"[ok] {out} {os.path.getsize(out)//1024} КБ")

# ── Уголки (584x420) ──
CORNER_SRC = {
    "blog": "blog-3.jpg",        # рука пишет ручкой (чисто, без WM)
    "about": "about-9.jpg",      # техники у электрощитка (со спины, живо)
    "contacts": "contacts-7.jpg",# тёплый кабинет с мониторами
    "generator": "genfuel2-7-clean2.png",  # мастер и красный генератор (бренды вычищены)
}
for key, fname in CORNER_SRC.items():
    im = Image.open(f"{SRC}/{fname}").convert("RGB")
    im = center_crop(im, 7 / 5).resize((584, 420), Image.LANCZOS)
    save(duotone(im), f"{DST}/{key}.jpg")

# ── Баннер генерации (1200x400) из того же вычищенного кадра ──
im = Image.open(f"{SRC}/genfuel2-7-clean2.png").convert("RGB")
im = center_crop(im, 3).resize((1200, 400), Image.LANCZOS)
save(duotone(im), f"{HUB}/generator.jpg")

# ── Баннер накопителей: кроп ниже зоны логотипа (лого в верхней части блока) ──
im = Image.open(f"{SRC}/battery-6.jpg").convert("RGB")
w, h = im.size  # 1280x720; блок 13-93% высоты, логотип в его верхней части (~13-25%)
im = im.crop((0, int(h * 0.30), w, int(h * 0.30) + int(w / 3)))  # полоса 30%…30%+427px
im = im.resize((1200, 400), Image.LANCZOS)
save(duotone(im), f"{HUB}/storage.jpg")
