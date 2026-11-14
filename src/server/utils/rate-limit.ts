interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(params.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + params.windowMs;
    buckets.set(params.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      resetAt,
    };
  }

  if (existing.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function clearRateLimitBuckets(): void {
  buckets.clear();
}

