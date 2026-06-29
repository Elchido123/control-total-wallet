interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, Bucket> = new Map();
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(maxTokens: number = 2, refillIntervalMs: number = 24 * 60 * 60 * 1000) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
  }

  private refill(key: string): void {
    const bucket = this.buckets.get(key);
    if (!bucket) return;

    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs) * this.maxTokens;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  tryConsume(key: string): { allowed: boolean; remaining: number } {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: Date.now() };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: bucket.tokens };
    }

    this.refill(key);

    if (bucket.tokens <= 0) {
      return { allowed: false, remaining: 0 };
    }

    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens };
  }

  getRemaining(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.maxTokens;
    this.refill(key);
    return bucket.tokens;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  getMaxTokens(): number {
    return this.maxTokens;
  }
}

export const dailyRateLimiter = new TokenBucketRateLimiter(2, 24 * 60 * 60 * 1000);
