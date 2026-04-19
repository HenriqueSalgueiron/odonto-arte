import { Redis } from "@upstash/redis";

export type TokenStore = {
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
};

export function createRedisTokenStore(opts: { url: string; token: string }): TokenStore {
  const redis = new Redis({ url: opts.url, token: opts.token });

  return {
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async get(key) {
      const value = await redis.get<string>(key);
      return value ?? null;
    },
    async del(key) {
      await redis.del(key);
    },
    async delByPrefix(prefix) {
      let cursor = "0";
      do {
        const result: [string, string[]] = await redis.scan(cursor, {
          match: `${prefix}*`,
          count: 100,
        });
        const [next, keys] = result;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        cursor = String(next);
      } while (cursor !== "0");
    },
  };
}

export function createInMemoryTokenStore(): TokenStore {
  const entries = new Map<string, { value: string; expiresAt: number }>();

  function purge(key: string): boolean {
    const entry = entries.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return false;
    }
    return true;
  }

  return {
    async set(key, value, ttlSeconds) {
      entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async get(key) {
      if (!purge(key)) return null;
      return entries.get(key)?.value ?? null;
    },
    async del(key) {
      entries.delete(key);
    },
    async delByPrefix(prefix) {
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) entries.delete(key);
      }
    },
  };
}
