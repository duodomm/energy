#!/usr/bin/env python3
"""Пост-обработка hero-вариантов: 1344x768 PNG → 1400x800 JPEG (q82, progressive)."""
from PIL import Image
import os, shutil

SRC = "public/hero-variants"
DST_DOWNLOAD = "download/hero-variants"
os.makedirs(DST_DOWNLOAD, exist_ok=True)

total = 0
for i in range(1, 11):
    v = f"v{i:02d}"
    raw = f"{SRC}/{v}_raw.png"
    out = f"{SRC}/{v}.jpg"
    im = Image.open(raw).convert("RGB")
    # 1344x768 = 7:4 точно → апскейл до 1400x800 (LANCZOS, мягко)
    im = im.resize((1400, 800), Image.LANCZOS)
    im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    kb = os.path.getsize(out) // 1024
    total += kb
    shutil.copy2(out, f"{DST_DOWNLOAD}/{v}.jpg")
    os.remove(raw)
    print(f"{v}.jpg  {kb} КБ")
print(f"итого ~{total} КБ (было ~2 МБ PNG)")
