# -*- coding: utf-8 -*-
"""Дуотон-обработка выбранных фото для уголков HeroCorner v2 «Тёплый кадр».

Дуотон: тени — глубокий петроль, света — тёплый янтарно-кремовый (палитра П1).
Это унифицирует разнородные фото в один бренд-look и убирает «стоковость».
Плюс: farm-2 -> полнор_colourная замена farm-sunset.jpg (там вотермарки Unsplash+).
"""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = "scripts/corner-src"
DST = "public/photos/corner"
os.makedirs(DST, exist_ok=True)

# Выбранные VLM номера (1-индексация из контакт-листов)
PICKS = {
    "sun": 3, "battery": 7, "generator": 1, "economics": 1,
    "regions": 6, "reference": 1, "cases": 1, "blog": 1,
    "about": 2, "contacts": 1,
}

# Дуотон-палитра (П1 «Янтарный полдень») — v3: сплит-тон бренда.
# Тени — петроль, полутона — тёплый песок (доминируют в кадре → фото читается
# тёплым), света — янтарный крем. В сумме «золотой час через петрольное стекло».
BLACK = (22, 52, 64)      # #163440 петроль (тени)
MID = (198, 164, 120)     # #C6A478 тёплый песок (полутона)
WHITE = (252, 243, 216)   # #FCF3D8 янтарный крем (света)

def center_crop(im, ratio):
    w, h = im.size
    cur = w / h
    if cur > ratio:  # шире, чем нужно — режем бока
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
    col = ImageOps.colorize(g, black=BLACK, white=WHITE, mid=MID, blackpoint=0, whitepoint=255, midpoint=116)
    return col

# ── 10 уголков: 584x420 (7:5, 2x от 292x210 на экране) ──
for key, n in PICKS.items():
    src = f"{SRC}/{key}-{n-1}.jpg"
    if not os.path.exists(src):
        print(f"[miss] {key}: нет {src}")
        continue
    im = Image.open(src).convert("RGB")
    im = center_crop(im, 7 / 5).resize((584, 420), Image.LANCZOS)
    im = duotone(im)
    out = f"{DST}/{key}.jpg"
    im.save(out, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"[ok] {out} {os.path.getsize(out)//1024} КБ")

# ── Замена farm-sunset.jpg на главной (3:2, полноцвет, 1600x1066) ──
farm_src = f"{SRC}/farm-1.jpg"  # #2 по листу
im = Image.open(farm_src).convert("RGB")
im = center_crop(im, 1.5).resize((1600, 1066), Image.LANCZOS)
im = ImageOps.autocontrast(im, cutoff=1)
im = ImageEnhance.Color(im).enhance(1.03)
im.save("public/photos/farm-sunset.jpg", "JPEG", quality=82, optimize=True, progressive=True)
print(f"[ok] public/photos/farm-sunset.jpg {os.path.getsize('public/photos/farm-sunset.jpg')//1024} КБ (замена)")
