// cacheWarmer.ts - Preload frequently accessed data
import { User } from "../app/modules/user/user.model";
import UserCacheManage from "../app/modules/user/user.cacheManage";

class CacheWarmer {
  private isWarming = false;
  
  // Warm cache with recently active users
  async warmUserCache(limit: number = 100): Promise<void> {
    if (this.isWarming) {
      console.log('Cache warming already in progress...');
      return;
    }
    
    this.isWarming = true;
    console.log('Starting cache warming for users...');
    
    try {
      // Get recently active users
      const recentUsers = await User.find({
        lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .limit(limit)
      .lean();
      
      // Pre-cache them
      const promises = recentUsers.map(async (user) => {
        if (user._id) {
          await UserCacheManage.setCacheSingleUser(user._id.toString(), user);
        }
      });
      
      await Promise.allSettled(promises);
      console.log(`Cache warming completed for ${recentUsers.length} users`);
      
    } catch (error) {
      console.error('Error during cache warming:', error);
    } finally {
      this.isWarming = false;
    }
  }
  
  // Schedule cache warming (call this on app startup)
  scheduleWarmup(): void {
    // Warm cache immediately on startup
    setTimeout(() => this.warmUserCache(), 5000); // Wait 5s after startup
    
    // Then warm cache every hour
    setInterval(() => this.warmUserCache(), 60 * 60 * 1000);
  }
}

export default new CacheWarmer();
