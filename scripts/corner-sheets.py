# -*- coding: utf-8 -*-
"""Контакт-листы для выбора уголковых фото: 8 кандидатов на ключ, сетка 4x2 с номерами."""
import os, glob
from PIL import Image, ImageDraw, ImageFont

SRC = "scripts/corner-src"
TH_W = 340
TH_H = 244  # ~7:5
COLS, ROWS = 4, 2
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)

keys = sorted({os.path.basename(p).split("-")[0] for p in glob.glob(f"{SRC}/*-[0-9].jpg")})
for key in keys:
    files = sorted(glob.glob(f"{SRC}/{key}-[0-9].jpg"), key=lambda p: int(p.rsplit("-", 1)[1][:-4]))
    if len(files) < 3:
        print(f"[skip] {key}: всего {len(files)} кандидатов")
        continue
    sheet = Image.new("RGB", (COLS * TH_W, ROWS * (TH_H + 40)), "#DDDDDD")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        try:
            im = Image.open(f).convert("RGB")
        except Exception:
            continue
        im.thumbnail((TH_W, TH_H))
        col, row = i % COLS, i // COLS
        x, y = col * TH_W + (TH_W - im.width) // 2, row * (TH_H + 40) + 36 + (TH_H - im.height) // 2
        sheet.paste(im, (x, y))
        d.rectangle([col * TH_W + 8, row * (TH_H + 40) + 4, col * TH_W + 62, row * (TH_H + 40) + 38], fill="#E8940A")
        d.text((col * TH_W + 18, row * (TH_H + 40) + 7), str(i + 1), font=FONT, fill="#22272E")
    out = f"{SRC}/sheet-{key}.png"
    sheet.save(out, optimize=True)
    print(f"[ok] {out} ({len(files)} кадров)")
