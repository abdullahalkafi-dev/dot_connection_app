import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../../shared/logger';
import { queryOptimizer } from '../../DB/queryOptimizer';

/**
 * Performance monitoring middleware and utilities
 */

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip: string;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private slowRequestThreshold = 1000; // 1 second threshold
  private maxMetricsSize = 1000; // Keep last 1000 requests

  /**
   * Express middleware for request performance monitoring
   */
  requestMonitor() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();

      // Override res.end to capture response time
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endCpuUsage = process.cpuUsage(startCpuUsage);

        // Collect metrics
        const metrics: PerformanceMetrics = {
          endpoint: req.route?.path || req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          timestamp: new Date(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: endCpuUsage,
        };

        performanceMonitor.addMetric(metrics);

        // Log slow requests
        if (responseTime > performanceMonitor.slowRequestThreshold) {
          logger.warn(`🐌 Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`, {
            responseTime,
            statusCode: res.statusCode,
            endpoint: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          });
        }

        // Log high memory usage
        const memoryMB = Math.round(metrics.memoryUsage!.heapUsed / 1024 / 1024);
        if (memoryMB > 200) { // 200MB threshold
          logger.warn(`🧠 High memory usage detected: ${memoryMB}MB`, {
            memoryUsage: metrics.memoryUsage,
            endpoint: req.path,
          });
        }

        // Handle different overloads of res.end
        if (typeof encoding === 'function') {
          return originalEnd(chunk, encoding);
        } else if (encoding && cb) {
          return originalEnd(chunk, encoding, cb);
        } else if (chunk) {
          return originalEnd(chunk);
        } else {
          return originalEnd();
        }
      };

      next();
    };
  }

  /**
   * Add a metric to the collection
   */
  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow: number = 3600000) { // Default: last hour
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      metric => now - metric.timestamp.getTime() < timeWindow
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = Math.round(
      recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / totalRequests
    );
    const slowRequests = recentMetrics.filter(
      metric => metric.responseTime > this.slowRequestThreshold
    ).length;
    const errorRequests = recentMetrics.filter(
      metric => metric.statusCode >= 400
    ).length;

    // Group by endpoint
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          slowRequests: 0,
        };
      }
      acc[key].count++;
      acc[key].totalTime += metric.responseTime;
      if (metric.statusCode >= 400) acc[key].errors++;
      if (metric.responseTime > this.slowRequestThreshold) acc[key].slowRequests++;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for endpoints
    Object.keys(endpointStats).forEach(key => {
      endpointStats[key].averageTime = Math.round(
        endpointStats[key].totalTime / endpointStats[key].count
      );
      endpointStats[key].errorRate = Math.round(
        (endpointStats[key].errors / endpointStats[key].count) * 100
      );
    });

    return {
      totalRequests,
      averageResponseTime,
      slowRequests,
      slowRequestPercentage: Math.round((slowRequests / totalRequests) * 100),
      errorRate: Math.round((errorRequests / totalRequests) * 100),
      endpointStats,
      queryStats: queryOptimizer.getPerformanceStats(),
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
        system: Math.round(cpuUsage.system / 1000), // Convert to milliseconds
      },
      uptime: Math.round(uptime),
      processId: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Clear metrics (useful for testing)
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Set slow request threshold
   */
  setSlowRequestThreshold(threshold: number) {
    this.slowRequestThreshold = threshold;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Health check endpoint handler
 */
export const healthCheck = (req: Request, res: Response) => {
  const stats = performanceMonitor.getStats(300000); // Last 5 minutes
  const systemHealth = performanceMonitor.getSystemHealth();

  // Determine health status
  let status = 'healthy';
  if (stats.errorRate > 10 || (stats.slowRequestPercentage && stats.slowRequestPercentage > 20)) {
    status = 'degraded';
  }
  if (stats.errorRate > 25 || systemHealth.memory.heapUsed > 500) {
    status = 'unhealthy';
  }

  res.status(status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: systemHealth.uptime,
    performance: {
      requestStats: stats,
      systemHealth,
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
    },
    // Add Redis health if connected
    redis: {
      // This would need to be implemented based on your Redis setup
      connected: true, // Placeholder
    },
  });
};

/**
 * Performance dashboard endpoint
 */
export const performanceDashboard = (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000; // Default 1 hour
  const stats = performanceMonitor.getStats(timeWindow);
  const systemHealth = performanceMonitor.getSystemHealth();

  res.json({
    timeWindow: timeWindow / 1000 / 60, // Convert to minutes
    performance: stats,
    system: systemHealth,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware to track API usage patterns
 */
export const apiUsageTracker = (req: Request, res: Response, next: NextFunction) => {
  // Track API usage patterns
  const userAgent = req.get('User-Agent') || 'unknown';
  const isBot = /bot|crawl|spider|scraper/i.test(userAgent);
  
  if (isBot) {
    logger.info(`🤖 Bot detected: ${userAgent} accessing ${req.path}`);
  }

  // Add request metadata
  (req as any).startTime = Date.now();
  (req as any).isBot = isBot;

  next();
};