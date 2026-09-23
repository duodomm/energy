/** Простой in-memory кэш для API-ответов (TTL 5 минут) */
const TTL_MS = 5 * 60 * 1000;

const store = new Map<string, { data: unknown; expires: number }>();

export async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }
  const data = await loader();
  store.set(key, { data, expires: Date.now() + TTL_MS });
  return data;
}
