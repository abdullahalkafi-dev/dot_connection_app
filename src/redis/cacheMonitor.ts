// cacheMonitor.ts
import cacheService from "./cacheService";

interface CacheHealthStatus {
  isHealthy: boolean;
  hitRate: number;
  metrics: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
  };
  lastChecked: Date;
}

interface PerformanceRecord {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
}

class CacheMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthStatus: CacheHealthStatus | null = null;
  private performanceData: PerformanceRecord[] = [];
  private readonly MAX_PERFORMANCE_RECORDS = 1000;

  // Start monitoring cache health
  startHealthMonitoring(intervalMs: number = 60000): void { // Default 1 minute
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    console.log(`Cache health monitoring started (interval: ${intervalMs}ms)`);
  }

  // Log cache operation performance
  logOperation(operation: string, duration: number, success: boolean = true): void {
    this.performanceData.push({
      operation,
      duration,
      success,
      timestamp: new Date()
    });
    
    // Keep only recent records to prevent memory issues
    if (this.performanceData.length > this.MAX_PERFORMANCE_RECORDS) {
      this.performanceData = this.performanceData.slice(-this.MAX_PERFORMANCE_RECORDS);
    }
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`🐌 Slow cache operation: ${operation} took ${duration}ms`);
    }
  }

  // Get performance metrics for the last hour
  getPerformanceMetrics(): {
    avgResponseTime: number;
    slowQueries: Array<{ key: string; duration: number; timestamp: Date }>;
    operationCount: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentData = this.performanceData.filter(d => d.timestamp > oneHourAgo);
    
    if (recentData.length === 0) {
      return {
        avgResponseTime: 0,
        slowQueries: [],
        operationCount: 0
      };
    }
    
    const successful = recentData.filter(d => d.success);
    const slowQueries = recentData
      .filter(d => d.duration > 100)
      .map(d => ({
        key: d.operation,
        duration: d.duration,
        timestamp: d.timestamp
      }))
      .slice(-10); // Last 10 slow queries
    
    return {
      avgResponseTime: successful.reduce((sum, d) => sum + d.duration, 0) / successful.length,
      slowQueries,
      operationCount: recentData.length
    };
  }

  // Stop monitoring
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Cache health monitoring stopped');
    }
  }

  // Perform health check
  private async performHealthCheck(): Promise<void> {
    try {
      const isHealthy = await cacheService.healthCheck();
      const hitRate = cacheService.getHitRate();
      const metrics = cacheService.getMetrics();

      this.lastHealthStatus = {
        isHealthy,
        hitRate,
        metrics,
        lastChecked: new Date(),
      };

      // Log warnings for poor performance
      if (!isHealthy) {
        console.error('Cache health check failed');
      }

      if (hitRate < 50) {
        console.warn(`Low cache hit rate: ${hitRate.toFixed(2)}%`);
      }

      if (metrics.errors > 10) {
        console.warn(`High cache error count: ${metrics.errors}`);
      }

    } catch (error) {
      console.error('Cache health check error:', error);
      this.lastHealthStatus = {
        isHealthy: false,
        hitRate: 0,
        metrics: { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 1 },
        lastChecked: new Date(),
      };
    }
  }

  // Get current health status
  getHealthStatus(): CacheHealthStatus | null {
    return this.lastHealthStatus;
  }

  // Get cache performance report
  getPerformanceReport(): {
    hitRate: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
  } {
    const metrics = cacheService.getMetrics();
    const totalRequests = metrics.hits + metrics.misses;
    const errorRate = totalRequests > 0 ? (metrics.errors / totalRequests) * 100 : 0;

    return {
      hitRate: cacheService.getHitRate(),
      totalRequests,
      errorRate,
      throughput: totalRequests, // Could be enhanced with time-based metrics
    };
  }

  // Reset metrics (useful for periodic reporting)
  resetMetrics(): void {
    cacheService.resetMetrics();
    console.log('Cache metrics reset');
  }

  // Alert thresholds
  private readonly ALERT_THRESHOLDS = {
    minHitRate: 60, // 60%
    maxErrorRate: 5, // 5%
    maxErrors: 50, // 50 errors
  };

  // Check if alerts should be triggered
  checkAlerts(): string[] {
    const alerts: string[] = [];
    const status = this.getHealthStatus();
    const report = this.getPerformanceReport();

    if (!status?.isHealthy) {
      alerts.push('Cache is unhealthy');
    }

    if (report.hitRate < this.ALERT_THRESHOLDS.minHitRate) {
      alerts.push(`Low hit rate: ${report.hitRate.toFixed(2)}%`);
    }

    if (report.errorRate > this.ALERT_THRESHOLDS.maxErrorRate) {
      alerts.push(`High error rate: ${report.errorRate.toFixed(2)}%`);
    }

    if (status && status.metrics.errors > this.ALERT_THRESHOLDS.maxErrors) {
      alerts.push(`High error count: ${status.metrics.errors}`);
    }

    return alerts;
  }

  // Export metrics for external monitoring systems
  exportMetrics(): {
    timestamp: Date;
    health: CacheHealthStatus | null;
    performance: ReturnType<CacheMonitor['getPerformanceReport']>;
    alerts: string[];
  } {
    return {
      timestamp: new Date(),
      health: this.getHealthStatus(),
      performance: this.getPerformanceReport(),
      alerts: this.checkAlerts(),
    };
  }
}

export default new CacheMonitor();
