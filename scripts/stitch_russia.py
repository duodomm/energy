#!/usr/bin/env python3
# Сшивка Чукотки через антимеридиан + финальный экспорт силуэта России.
# NE 50m режет Россию на 180°: у основного кольца резаное ребро 3713→3714
# [(180,68.983)→(180,65.067)], у восточного куска — 17 точек по -180 (65.067→68.983).
# Берег восточного куска: индексы 337..319 (по кольцу), их и вшиваем.
import json

d = json.load(open("/tmp/ne50.geojson"))
rus = next(f for f in d["features"] if f["properties"].get("ADMIN") == "Russia")
geom = rus["geometry"]
polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]

def clean(ring):
    pts = [tuple(p[:2]) for p in ring]
    if pts and pts[0] == pts[-1]:
        pts = pts[:-1]
    return pts

def area(ring):
    s = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]; x2, y2 = ring[(i + 1) % len(ring)]
        s += x1 * y2 - x2 * y1
    return abs(s / 2)

rings = [(area(clean(p[0])), clean(p[0])) for p in polys]
rings.sort(key=lambda x: -x[0])
main = rings[0][1]
east = next(r for a, r in rings[1:] if min(p[0] for p in r) < -170 and a > 5)

# Резаное ребро основного кольца
cut_i = next(i for i in range(len(main))
             if main[i][0] == 180.0 and main[(i + 1) % len(main)][0] == 180.0)
mA, mB = main[cut_i], main[cut_i + 1]
assert mA[1] > mB[1], "ожидалось 68.9 -> 65.0"

# Датлайн-ребро восточного куска: индексы e0..e1 (65.067 -> 68.983)
e0 = next(i for i, p in enumerate(east) if p[0] <= -179.999)
e1 = e0
while e1 + 1 < len(east) and east[e1 + 1][0] <= -179.999:
    e1 += 1
assert abs(east[e0][1] - mB[1]) < 0.01 and abs(east[e1][1] - mA[1]) < 0.01

# Берег восточного куска: от e1+1 (у 68.983) по кольцу до e0-1 (у 65.067)
coast = east[e1 + 1:] + east[:e0]
coast360 = [(lon + 360 if lon < 0 else lon, lat) for lon, lat in coast]
assert coast360[0][0] > 170 and coast360[-1][0] > 170

stitched = main[:cut_i + 1] + coast360 + main[cut_i + 1:]
lons = [p[0] for p in stitched]
print(f"stitched: {len(stitched)} pts, lon {min(lons):.2f}..{max(lons):.2f}")

# Douglas-Peucker
def dp(pts, eps):
    def d2(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        if L == 0:
            return (px - ax) ** 2 + (py - ay) ** 2
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
        return (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2
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

eps = 0.22
outline = dp(stitched, eps)
while len(outline) > 420 and eps < 1.0:
    eps += 0.03
    outline = dp(stitched, eps)
print(f"outline: {len(outline)} pts (eps {eps:.2f})")

targets = {
    "kaliningrad": (19.0, 23.2, 54.0, 55.3),
    "crimea": (31.5, 37.2, 44.2, 46.3),
    "sakhalin": (141.0, 144.9, 45.5, 54.6),
    "novazemlya": (51.0, 69.5, 70.0, 77.2),
}
islands = {}
for name, (lo0, lo1, la0, la1) in targets.items():
    for a, r in rings[1:]:
        if all(lo0 <= p[0] <= lo1 and la0 <= p[1] <= la1 for p in r):
            e = 0.05
            s = dp(r, e)
            while len(s) > 36 and e < 0.5:
                e += 0.03
                s = dp(r, e)
            islands[name] = s
            print(f"{name}: {len(s)} pts")
            break

json.dump({"outline": outline, "islands": islands},
          open("/home/z/my-project/scripts/russia-outline.json", "w"))

def fmt(pts, per_line=6):
    return "\n".join("  " + " ".join(f"[{p[0]:.2f},{p[1]:.2f}]," for p in pts[i:i + per_line])
                     for i in range(0, len(pts), per_line))

with open("/home/z/my-project/scripts/russia-outline.ts.txt", "w") as f:
    f.write("// Силуэт РФ: Natural Earth 50m (публичный домен) + сшивка Чукотки по 180°,\n")
    f.write("// упрощение Дугласа-Пекера. lon > 180 — за антимеридианом (непрерывная развёртка)\n")
    f.write("const OUTLINE: [number, number][] = [\n" + fmt(outline) + "\n]\n\n")
    f.write("const ISLANDS: [number, number][][] = [\n")
    for name in ["kaliningrad", "crimea", "sakhalin", "novazemlya"]:
        f.write("  // " + name + "\n  [\n" + fmt(islands[name], 5) + "\n  ],\n")
    f.write("]\n")
print("done")
