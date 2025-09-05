// fastCacheService.ts - Optimized cache service for high performance
import redisClient from "./redisClient";

class FastCacheService {
  private localCache = new Map<string, { data: any; expires: number }>();
  private readonly LOCAL_CACHE_TTL = 30000; // 30 seconds local cache
  private readonly LOCAL_CACHE_MAX_SIZE = 1000;

  // Hybrid caching: Check local cache first, then Redis
  async getCache<T>(key: string): Promise<T | null> {
    // 1. Check local cache first (fastest)
    const localEntry = this.localCache.get(key);
    if (localEntry && localEntry.expires > Date.now()) {
      return localEntry.data as T;
    }

    // 2. Check Redis
    try {
      const data = await redisClient.get(key);
      if (data) {
        const parsedData = JSON.parse(data) as T;
        
        // Store in local cache for future requests
        this.setLocalCache(key, parsedData);
        
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error(`Fast cache get error for key ${key}:`, error);
      return null;
    }
  }

  async setCache(
    key: string,
    value: any,
    expiryInSec: number = 3600
  ): Promise<void> {
    try {
      // Set in Redis
      const stringifiedValue = JSON.stringify(value);
      await redisClient.set(key, stringifiedValue, expiryInSec);
      
      // Also set in local cache
      this.setLocalCache(key, value);
    } catch (error) {
      console.error(`Fast cache set error for key ${key}:`, error);
      throw error;
    }
  }

  private setLocalCache(key: string, data: any): void {
    // Prevent memory leaks by limiting cache size
    if (this.localCache.size >= this.LOCAL_CACHE_MAX_SIZE) {
      // Remove oldest entries (simple LRU)
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) {
        this.localCache.delete(firstKey);
      }
    }

    this.localCache.set(key, {
      data,
      expires: Date.now() + this.LOCAL_CACHE_TTL,
    });
  }

  async deleteCache(key: string): Promise<void> {
    try {
      // Remove from both caches
      this.localCache.delete(key);
      await redisClient.delete(key);
    } catch (error) {
      console.error(`Fast cache delete error for key ${key}:`, error);
      throw error;
    }
  }

  // Clear local cache
  clearLocalCache(): void {
    this.localCache.clear();
  }

  // Get cache stats
  getLocalCacheStats() {
    return {
      size: this.localCache.size,
      maxSize: this.LOCAL_CACHE_MAX_SIZE,
      keys: Array.from(this.localCache.keys()),
    };
  }
}

export default new FastCacheService();
