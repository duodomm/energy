#!/usr/bin/env bash
# Экспорт проекта для GitHub: чистые bundle + zip из актуального HEAD.
# В экспорт входит только код проекта; платформенный шум (.zscripts, .env,
# VLM-логи, мудборды) и «полка» download/ исключены.
set -euo pipefail

ROOT="/home/z/my-project"
OUT="$ROOT/download"
TMP="$ROOT/.export-tmp"

# Скрипты, остающиеся в экспорте (сборка и пайплайн данных)
KEEP_SCRIPTS=(
  build-api-json.ts
  build-static.sh
  dump-cases.ts
  extract_russia.py
  stitch_russia.py
  russia-outline.json
  process-photos.py
  test-calc.ts
)

COMMIT_MSG="Альтернативная энергетика РФ: калькулятор, 3D-усадьба, ГОСТ-смета, карта регионов

Волны 1-5: витрина с энергопотоком и 3D-усадьбой, калькулятор 6 шагов
со сметой-«чертежом» (PDF по мотивам ГОСТ 2.104), интерактивная карта
32 регионов (проекция Альберса, Natural Earth), хабы-статьи с дата-визами,
тёплые дуотон-уголки страниц, Cloudflare-контур (static export + Worker)."

rm -rf "$TMP"
mkdir -p "$TMP/work"

# 1. Только файлы из git (HEAD): без node_modules, .next, download
git -C "$ROOT" archive --format=tar HEAD | tar -x -C "$TMP/work"

# 2. Чистим платформенный и сессионный шум
cd "$TMP/work"
rm -f .env Caddyfile worklog.md
rm -rf .zscripts examples mini-services tests

# scripts/: оставляем только сборку и пайплайн данных
mkdir -p "$TMP/keep-scripts"
for f in "${KEEP_SCRIPTS[@]}"; do
  [ -f "scripts/$f" ] && cp "scripts/$f" "$TMP/keep-scripts/$f"
done
rm -rf scripts
mkdir scripts
cp -a "$TMP/keep-scripts/." scripts/
rm -rf "$TMP/keep-scripts"

# 3. Чистый репозиторий с одним осмысленным коммитом
git init -q -b main
git add -A
git -c user.name="AltEnergo RF" \
      -c user.email="altenergo-rf@users.noreply.github.com" \
      commit -q -m "$COMMIT_MSG"

# 4. Bundle (полный git-репозиторий) и zip (исходники без .git)
git bundle create -q "$OUT/altenergo-rf.git.bundle" main
cd "$TMP"
rm -rf altenergo-rf
cp -a work altenergo-rf
rm -rf altenergo-rf/.git
rm -f "$OUT/altenergo-rf-src.zip"
zip -qr "$OUT/altenergo-rf-src.zip" altenergo-rf

# 5. Верификация: клон из bundle идентичен рабочему дереву
git clone -q "$OUT/altenergo-rf.git.bundle" "$TMP/verify"
diff <(cd "$TMP/verify" && git ls-files | sort) \
     <(cd "$TMP/work"   && git ls-files | sort) \
  && echo "VERIFY OK: состав bundle == экспортируемому дереву"
cd "$TMP/verify"
for f in README.md db/custom.db prisma/schema.prisma \
         public/photos/hub/sun.jpg public/photos/corner/blog.jpg \
         src/components/common/rf-map.tsx worker/index.ts; do
  [ -f "$f" ] || { echo "MISSING: $f"; exit 1; }
done
grep -q 'file:../db/custom.db' prisma/schema.prisma \
  && echo "VERIFY OK: относительный путь SQLite в экспорте"

echo "---- Экспорт готов ----"
ls -lh "$OUT/altenergo-rf.git.bundle" "$OUT/altenergo-rf-src.zip" | awk '{print $9, $5}'
rm -rf "$TMP"
