// user.cacheManage.ts
import cacheService from "../../../redis/cacheService";
import { normalizeQuery } from "../../../util/normalizeQuery";
import { TUser } from "./user.interface";

const DEFAULT_TTL = 60 * 60 * 12; // 12 hours

const UserCacheManage = {
  keys: {
    userList: "userList",
    userListWithQuery: "userListWithQuery",
    userId: (id: string) => `user:${id}`,
    userListWithQueryKey: (query: Record<string, unknown>) => {
      const normalized = normalizeQuery(query);
      return `${UserCacheManage.keys.userListWithQuery}:${JSON.stringify(
        normalized
      )}`;
    },
  },
  updateUserCache: async (userId: string) => {
    try {
      // Remove the specific user cache
      await cacheService.deleteCache(UserCacheManage.keys.userId(userId));

      // Remove the general user list cache
      await cacheService.deleteCache(UserCacheManage.keys.userList);

      // Invalidate all query-based caches using pattern deletion (non-blocking)
      await cacheService.invalidateByPattern(
        UserCacheManage.keys.userListWithQuery + ":*"
      );
    } catch (error) {
      console.warn('Error updating user cache:', error);
      // Don't throw - cache invalidation failures shouldn't break the app
    }
  },

  getCacheSingleUser: async (userId: string): Promise<TUser | null> => {
    try {
      const key = UserCacheManage.keys.userId(userId);
      const cached = await cacheService.getCache<TUser>(key);
      return cached ?? null;
    } catch (error) {
      console.warn('Error getting cached user:', error);
      return null;
    }
  },

  setCacheSingleUser: async (userId: string, data: Partial<TUser>) => {
    try {
      const key = UserCacheManage.keys.userId(userId);
      await cacheService.setCache(key, data, DEFAULT_TTL);
    } catch (error) {
      console.warn('Error setting cached user:', error);
    }
  },

  setCacheListWithQuery: async (
    query: Record<string, unknown>,
    data: { result: any; meta?: any },
    ttl: number = DEFAULT_TTL
  ) => {
    try {
      const key = UserCacheManage.keys.userListWithQueryKey(query);
      await cacheService.setCache(key, data, ttl);
    } catch (error) {
      console.warn('Error setting cached list:', error);
    }
  },

  getCacheListWithQuery: async (
    query: Record<string, unknown>
  ): Promise<{ result: any; meta?: any } | null> => {
    try {
      const key = UserCacheManage.keys.userListWithQueryKey(query);
      const cached = await cacheService.getCache<{ result: any; meta?: any }>(
        key
      );
      return cached ?? null;
    } catch (error) {
      console.warn('Error getting cached list:', error);
      return null;
    }
  },
};

export default UserCacheManage;
