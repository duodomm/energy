#!/usr/bin/env bash
# Статическая сборка для Cloudflare Workers Static Assets.
# 1) Дамп контента БД -> public/api-data/*.json
# 2) Временное исключение src/app/api (POST-роуты несовместимы с output:export)
# 3) BUILD_MODE=static next build -> out/
# 4) Возврат api на место (в т.ч. при ошибке — trap)
#
# Запуск: bash scripts/build-static.sh
# Затем:   npx wrangler deploy (см. DEPLOY-CLOUDFLARE.md)
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR="src/app/api"
API_HIDDEN="src/app/_api_disabled_by_build"

restore_api() {
  if [ -d "$API_HIDDEN" ]; then
    mv "$API_HIDDEN" "$API_DIR"
    echo "[restore] src/app/api возвращён на место"
  fi
}
trap restore_api EXIT

echo "[1/3] Дамп контента в public/api-data…"
bun scripts/build-api-json.ts

echo "[2/3] Скрываю API-роуты (несовместимы с output:export)…"
rm -rf "$API_HIDDEN"
mv "$API_DIR" "$API_HIDDEN"

echo "[3/3] next build (BUILD_MODE=static)…"
BUILD_MODE=static bunx next build

restore_api
trap - EXIT

echo ""
echo "Готово: статика в ./out/"
echo "Деплой: npx wrangler deploy   (worker + assets из wrangler.json)"
ls out/ | head -12
