// cacheService.ts
import redisClient from "./redisClient";



class CacheService {
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
        console.log(
          `Large cache object detected: ${key} (${stringifiedValue.length} bytes)`
        );
      }

      // Check size limits
      if (stringifiedValue.length > this.MAX_CACHE_SIZE) {
        console.warn(
          `Cache object too large, skipping: ${key} (${stringifiedValue.length} bytes)`
        );
        return;
      }

      await redisClient.set(key, stringifiedValue, expiryInSec);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const data = await redisClient.get(key);
      const duration = Date.now() - startTime;

      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow cache get operation: ${key} took ${duration}ms`);
      }

      if (data) {
        return JSON.parse(data) as T;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  // Batch get method for multiple keys
  async getMultipleCache<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    if (keys.length === 0) return result;

    try {
      const startTime = Date.now();
      const pipeline = redisClient.client.multi();

      // Add all get operations to pipeline
      keys.forEach((key) => pipeline.get(key));

      const results = await pipeline.exec();
      const duration = Date.now() - startTime;

      if (duration > 100) {
        console.warn(
          `Slow batch cache get: ${keys.length} keys took ${duration}ms`
        );
      }

      keys.forEach((key, index) => {
        const data = results?.[index];
        if (data && typeof data === "string") {
          try {
            result.set(key, JSON.parse(data) as T);
          } catch {
            result.set(key, null);
          }
        } else {
          result.set(key, null);
        }
      });
    } catch (error) {
      console.error("Batch cache get error:", error);
      keys.forEach((key) => result.set(key, null));
    }

    return result;
  }

  async deleteCache(key: string): Promise<void> {
    try {
      await redisClient.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      throw error;
    }
  }

  // New method for deleting keys by pattern (non-blocking)
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // Use SCAN instead of KEYS for production safety (non-blocking)
      const keys: string[] = [];
      let cursor = 0;

      do {
        const reply = await redisClient.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = reply.cursor;
        keys.push(...reply.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        // Delete in batches using pipeline to avoid blocking
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          const pipeline = redisClient.client.multi();

          batch.forEach((key) => pipeline.del(key));
          await pipeline.exec();
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
}

export default new CacheService();
