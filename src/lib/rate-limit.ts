/**
 * Hybrid sliding-window rate limiter with Redis & In-Memory Fallback.
 * Optimized for high performance and multi-instance serverless deployments.
 */

import { redisCache } from './redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean stale entries every 60s
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((entry, key) => {
      if (entry.resetAt < now) memoryStore.delete(key);
    });
  }, 60_000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  gateOtp: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  formSubmission: { maxRequests: 10, windowMs: 60_000 } as RateLimitConfig,
  api: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,
};

export function rateLimit(
  key: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const redisKey = `ratelimit:${key}`;

  try {
    const cached = await redisCache.get<RateLimitEntry>(redisKey);
    if (!cached || cached.resetAt < now) {
      const resetAt = now + config.windowMs;
      const ttl = Math.ceil(config.windowMs / 1000);
      await redisCache.set(redisKey, { count: 1, resetAt }, ttl);
      return { success: true, remaining: config.maxRequests - 1, resetAt };
    }

    if (cached.count >= config.maxRequests) {
      return { success: false, remaining: 0, resetAt: cached.resetAt };
    }

    const ttl = Math.max(1, Math.ceil((cached.resetAt - now) / 1000));
    const updated = { count: cached.count + 1, resetAt: cached.resetAt };
    await redisCache.set(redisKey, updated, ttl);
    return { success: true, remaining: config.maxRequests - updated.count, resetAt: cached.resetAt };
  } catch {
    return rateLimit(key, config);
  }
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}
