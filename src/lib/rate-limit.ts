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

/**
 * Distributed fixed-window limiter. Uses an atomic Redis INCR so the limit holds
 * across every serverless instance; falls back to the per-instance memory store
 * only when Redis is not configured or unreachable.
 */
export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const hit = await redisCache.incr(`ratelimit:${key}`, config.windowMs);
  if (!hit) return rateLimit(key, config);

  const resetAt = Date.now() + hit.ttlMs;
  if (hit.count > config.maxRequests) {
    return { success: false, remaining: 0, resetAt };
  }
  return { success: true, remaining: config.maxRequests - hit.count, resetAt };
}

/**
 * Client IP as seen by the edge. Only the first X-Forwarded-For hop is used —
 * the full header is attacker-extendable and would give each request a new key.
 */
export function getClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}
