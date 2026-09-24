import type { NextConfig } from "next";

// Два режима сборки:
//  - по умолчанию (dev/песочница): output "standalone" — Node-сервер с API-роутами
//  - BUILD_MODE=static (Cloudflare): output "export" — чистая статика в out/,
//    API-роуты исключаются (scripts/build-static.sh), данные читаются из
//    public/api-data/*.json, лид-форма уходит в Cloudflare Worker (worker/)
const isStatic = process.env.BUILD_MODE === "static";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  // next/image в проекте не используется (plain <img> + PIL-оптимизация),
  // но на всякий случай разрешаем экспорт без оптимизатора
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
