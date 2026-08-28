import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';

// In-Memory Cache Fallback Structure
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 2000;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (this.store.size >= this.maxEntries) {
      const firstKey = Array.from(this.store.keys())[0];
      if (firstKey) this.store.delete(firstKey);
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const allKeys = Array.from(this.store.keys());
    for (const key of allKeys) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }
}

const memoryCache = new InMemoryCache();

// Initialize Upstash or ioredis if env variables exist
let upstashClient: UpstashRedis | null = null;
let ioRedisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    upstashClient = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn('[Redis] Failed to init Upstash client, using memory fallback:', err);
  }
} else if (process.env.REDIS_URL || process.env.REDIS_TLS_URL) {
  try {
    const url = process.env.REDIS_TLS_URL || process.env.REDIS_URL || '';
    ioRedisClient = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  } catch (err) {
    console.warn('[Redis] Failed to init ioredis client, using memory fallback:', err);
  }
}

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (upstashClient) {
        const val = await upstashClient.get<T>(key);
        return val !== null ? val : memoryCache.get<T>(key);
      }
      if (ioRedisClient) {
        const val = await ioRedisClient.get(key);
        if (val) return JSON.parse(val) as T;
        return memoryCache.get<T>(key);
      }
    } catch {
      // Fallback seamlessly to in-memory cache
    }
    return memoryCache.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    memoryCache.set(key, value, ttlSeconds);
    try {
      if (upstashClient) {
        await upstashClient.set(key, value, { ex: ttlSeconds });
        return;
      }
      if (ioRedisClient) {
        await ioRedisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      }
    } catch {
      // Memory cache already updated
    }
  },

  async del(key: string): Promise<void> {
    memoryCache.del(key);
    try {
      if (upstashClient) {
        await upstashClient.del(key);
        return;
      }
      if (ioRedisClient) {
        await ioRedisClient.del(key);
        return;
      }
    } catch {
      // Memory cache already deleted
    }
  },

  async delPattern(pattern: string): Promise<void> {
    memoryCache.delPattern(pattern);
    try {
      if (upstashClient) {
        const keys = await upstashClient.keys(pattern);
        if (keys.length > 0) {
          await upstashClient.del(...keys);
        }
        return;
      }
      if (ioRedisClient) {
        const keys = await ioRedisClient.keys(pattern);
        if (keys.length > 0) {
          await ioRedisClient.del(...keys);
        }
        return;
      }
    } catch {
      // Memory cache already cleared
    }
  },
};
