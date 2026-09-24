#!/usr/bin/env python3
# Извлечение и упрощение силуэта России из Natural Earth 50m для RfMap.
# Выход: JSON с outline (основной полигон), islands (прочие полигоны > порога),
# координаты в [lon, lat], lon может быть > 180 (Chukotka) — проекция Альберса
# обрабатывает непрерывно.
import json, sys

d = json.load(open("/tmp/ne50.geojson"))

rus = None
for f in d["features"]:
    if f["properties"].get("ADMIN") == "Russia" or f["properties"].get("NAME") == "Russia":
        rus = f
        break
if not rus:
    print("Russia not found")
    sys.exit(1)

geom = rus["geometry"]
polys = []
if geom["type"] == "Polygon":
    polys = [geom["coordinates"]]
elif geom["type"] == "MultiPolygon":
    polys = geom["coordinates"]

print(f"polygons: {len(polys)}")

def ring_area_signed(ring):
    # площадь в градусах² (грубая), для сортировки
    s = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i][:2]
        x2, y2 = ring[i + 1][:2]
        s += x1 * y2 - x2 * y1
    return s / 2

def clean_ring(ring):
    # убрать замыкающую точку, нормализовать lon в непрерывный ряд (для Алб. не критично)
    pts = [tuple(p[:2]) for p in ring]
    if pts and pts[0] == pts[-1]:
        pts = pts[:-1]
    return pts

def perimeter(pts):
    import math
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += math.hypot(x2 - x1, y2 - y1)
    return s

# Douglas-Peucker по градусной сетке
def dp(pts, eps):
    import math
    def d2(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        if L == 0:
            return (px - ax) ** 2 + (py - ay) ** 2
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
        x = ax + t * dx; y = ay + t * dy
        return (px - x) ** 2 + (py - y) ** 2
    n = len(pts)
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        best, bi = -1.0, -1
        for k in range(i + 1, j):
            dd = d2(pts[k], pts[i], pts[j])
            if dd > best:
                best, bi = dd, k
        if best > eps * eps:
            keep[bi] = True
            stack.append((i, bi)); stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]

rings = []
for poly in polys:
    r = clean_ring(poly[0])  # внешний контур
    a = abs(ring_area_signed(r))
    if a < 0.02:  # мелкие острова в шум — держим только Сахалин/Новую Землю и крупные
        continue
    rings.append((a, r))

rings.sort(key=lambda x: -x[0])
main = rings[0][1]
islands = [r for a, r in rings[1:] if a > 0.05]

# Основной контур: упрощаем до ~200 точек (eps подобрать)
eps = 0.28
outline = dp(main, eps)
while len(outline) > 240 and eps < 1.2:
    eps += 0.06
    outline = dp(main, eps)
print(f"outline pts: {len(outline)} (eps={eps}), perimeter={perimeter(outline):.1f}°")

iso_out = []
for r in islands:
    e2 = 0.08
    s = dp(r, e2)
    while len(s) > 60 and e2 < 0.6:
        e2 += 0.04
        s = dp(r, e2)
    iso_out.append(s)
    print(f"island pts: {len(s)}, area≈{abs(ring_area_signed(r)):.2f}°², bbox lon {min(p[0] for p in s):.1f}..{max(p[0] for p in s):.1f}")

json.dump({"outline": outline, "islands": iso_out}, open("/home/z/my-project/scripts/russia-outline.json", "w"))

# Печать как TS-массив для вставки
def fmt_pts(pts, per_line=6):
    lines = []
    for i in range(0, len(pts), per_line):
        chunk = pts[i:i + per_line]
        lines.append("  " + " ".join(f"[{p[0]:.2f},{p[1]:.2f}]," for p in chunk))
    return "\n".join(lines)

with open("/home/z/my-project/scripts/russia-outline.ts.txt", "w") as f:
    f.write("const OUTLINE: [number, number][] = [\n" + fmt_pts(outline) + "\n]\n\n")
    f.write("const ISLANDS: [number, number][][] = [\n")
    for isl in iso_out:
        f.write("  [\n" + fmt_pts(isl, 5) + "\n  ],\n")
    f.write("]\n")
print("saved russia-outline.json / .ts.txt")
