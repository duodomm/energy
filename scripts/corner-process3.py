# -*- coding: utf-8 -*-
"""Раунд 3: (1) замена 3 уголков (blog/about/contacts) по VLM-выбору picks3.json;
(2) широкие дуотон-баннеры 4 хабов (1200x400, 3:1) из ранее выбранных исходников.
Дуотон — тот же бренд-сплит П1: тени петроль, полутона песок, света янтарный крем."""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = "scripts/corner-src"
DST = "public/photos/corner"
HUB = "public/photos/hub"
os.makedirs(DST, exist_ok=True)
os.makedirs(HUB, exist_ok=True)

BLACK = (22, 52, 64)      # #163440 петроль (тени)
MID = (198, 164, 120)     # #C6A478 тёплый песок (полутона)
WHITE = (252, 243, 216)   # #FCF3D8 янтарный крем (света)

def center_crop(im, ratio):
    w, h = im.size
    cur = w / h
    if cur > ratio:
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

# ── 1. Три замены уголков: 584x420 (7:5) ──
NEW_CORNERS = {"blog": 1, "about": 2, "contacts": 1}  # 1-индексация из picks3
for key, n in NEW_CORNERS.items():
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

# ── 2. Широкие баннеры хабов: 1200x400 (3:1) из исходников прошлых выборов ──
BANNERS = {
    "sun": ("sun-2.jpg", (600, 200)),       # портретный макро ФЭМ — центральная полоса
    "storage": ("battery-6.jpg", None),
    "generator": ("generator-0.jpg", None),
    "economics": ("economics-0.jpg", None),
}
for key, (fname, crop_box) in BANNERS.items():
    src = f"{SRC}/{fname}"
    if not os.path.exists(src):
        print(f"[miss] {key}: нет {src}")
        continue
    im = Image.open(src).convert("RGB")
    if crop_box:  # у портретного кадра берём осмысленную полосу, а не центр
        w, h = im.size
        im = im.crop((0, int(h * 0.18), w, int(h * 0.62)))
    im = center_crop(im, 3).resize((1200, 400), Image.LANCZOS)
    im = duotone(im)
    out = f"{HUB}/{key}.jpg"
    im.save(out, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"[ok] {out} {os.path.getsize(out)//1024} КБ")
