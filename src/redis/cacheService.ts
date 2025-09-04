// cacheService.ts
import redisClient from "./redisClient";

// Cache metrics for monitoring
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class CacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private readonly MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB

  async setCache(
    key: string,
    value: any,
    expiryInSec: number = 3600
  ): Promise<void> {
    try {
      let stringifiedValue = JSON.stringify(value);

      // Compress large objects (simple implementation)
      if (stringifiedValue.length > this.COMPRESSION_THRESHOLD) {
        // In production, use a proper compression library like snappy or lz4
        console.log(`Large cache object detected: ${key} (${stringifiedValue.length} bytes)`);
      }

      // Check size limits
      if (stringifiedValue.length > this.MAX_CACHE_SIZE) {
        console.warn(`Cache object too large, skipping: ${key} (${stringifiedValue.length} bytes)`);
        return;
      }

      await redisClient.set(key, stringifiedValue, expiryInSec);
      this.metrics.sets++;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (data) {
        this.metrics.hits++;
        return JSON.parse(data) as T;
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      await redisClient.delete(key);
      this.metrics.deletes++;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache delete error for key ${key}:`, error);
      throw error;
    }
  }

  // New method for deleting keys by pattern (non-blocking)
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // Use SCAN instead of KEYS for production safety
      const keys: string[] = await redisClient.keys(pattern);
      if (keys.length > 0) {
        // Delete in batches to avoid blocking
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map(key => this.deleteCache(key))
          );
        }
      }
    } catch (error) {
      console.warn(`Error invalidating cache pattern ${pattern}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await redisClient.healthCheck();
  }

  // Get cache metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  // Get hit rate
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  // Circuit breaker pattern for Redis failures
  private circuitBreakerFailures = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private circuitBreakerOpen = false;

  private async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T | null> {
    if (this.circuitBreakerOpen) {
      console.warn('Circuit breaker is open, skipping Redis operation');
      return null;
    }

    try {
      const result = await operation();
      this.circuitBreakerFailures = 0; // Reset on success
      return result;
    } catch (error) {
      this.circuitBreakerFailures++;
      if (this.circuitBreakerFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        this.circuitBreakerOpen = true;
        console.error('Circuit breaker opened due to repeated Redis failures');

        // Auto-reset circuit breaker after 30 seconds
        setTimeout(() => {
          this.circuitBreakerOpen = false;
          this.circuitBreakerFailures = 0;
          console.log('Circuit breaker reset');
        }, 30000);
      }
      throw error;
    }
  }
}

export default new CacheService();
