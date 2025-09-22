import mongoose from 'mongoose';
import { logger } from '../shared/logger';

/**
 * Database query optimization utilities
 * This file contains optimized query patterns and monitoring tools
 */

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  documentsExamined: number;
  documentsReturned: number;
  indexUsed: boolean;
  timestamp: Date;
}

class QueryOptimizer {
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold = 100; // 100ms threshold for slow queries

  /**
   * Wrap queries with performance monitoring
   */
  async monitorQuery<T>(
    operation: string,
    queryFunc: () => Promise<T>,
    query?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFunc();
      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        logger.warn(`🐌 Slow query detected: ${operation} took ${executionTime}ms`, {
          operation,
          executionTime,
          query: JSON.stringify(query),
        });
      }

      // Store metrics
      this.queryMetrics.push({
        query: operation,
        executionTime,
        documentsExamined: 0, // Would need to be populated from explain output
        documentsReturned: Array.isArray(result) ? result.length : 1,
        indexUsed: true, // Would need to be determined from explain output
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`❌ Query failed: ${operation} after ${executionTime}ms`, error);
      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats() {
    const recentMetrics = this.queryMetrics.slice(-100); // Last 100 queries
    
    const avgExecutionTime = recentMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / recentMetrics.length;
    const slowQueries = recentMetrics.filter(metric => metric.executionTime > this.slowQueryThreshold);
    
    return {
      totalQueries: recentMetrics.length,
      averageExecutionTime: Math.round(avgExecutionTime),
      slowQueries: slowQueries.length,
      slowQueryPercentage: Math.round((slowQueries.length / recentMetrics.length) * 100),
      recentSlowQueries: slowQueries.slice(-5).map(q => ({
        query: q.query,
        executionTime: q.executionTime,
        timestamp: q.timestamp,
      })),
    };
  }

  /**
   * Clear metrics (useful for testing)
   */
  clearMetrics() {
    this.queryMetrics = [];
  }
}

export const queryOptimizer = new QueryOptimizer();

/**
 * Optimized query patterns for common operations
 */
export class OptimizedQueries {
  /**
   * Optimized user lookup with profile data
   */
  static async findUserWithProfile(userId: string) {
    return queryOptimizer.monitorQuery(
      'findUserWithProfile',
      async () => {
        // Use aggregation pipeline for efficient joins
        const pipeline = [
          { $match: { _id: new mongoose.Types.ObjectId(userId), status: 'active' } },
          {
            $lookup: {
              from: 'profiles',
              localField: '_id',
              foreignField: 'userId',
              as: 'profile',
              pipeline: [
                { $project: { userId: 0 } }, // Exclude redundant userId field
              ],
            },
          },
          {
            $addFields: {
              profile: { $arrayElemAt: ['$profile', 0] },
            },
          },
          {
            $project: {
              'authentication.oneTimeCode': 0, // Exclude sensitive data
              __v: 0,
            },
          },
        ];

        const result = await mongoose.connection.db
          ?.collection('users')
          .aggregate(pipeline)
          .toArray();

        return result?.[0] || null;
      },
      { userId }
    );
  }

  /**
   * Optimized nearby users query with geospatial search
   */
  static async findNearbyUsers(
    userId: string,
    longitude: number,
    latitude: number,
    maxDistance: number = 25000, // 25km default
    limit: number = 20
  ) {
    return queryOptimizer.monitorQuery(
      'findNearbyUsers',
      async () => {
        const pipeline = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              distanceField: 'distance',
              maxDistance,
              spherical: true,
              query: {
                userId: { $ne: new mongoose.Types.ObjectId(userId) },
                isProfileCompleted: true,
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                {
                  $match: {
                    status: 'active',
                    verified: true,
                  },
                },
                {
                  $project: {
                    firstName: 1,
                    lastName: 1,
                    image: 1,
                    lastLoginAt: 1,
                  },
                },
              ],
            },
          },
          {
            $match: {
              'user.0': { $exists: true }, // Only include profiles with valid users
            },
          },
          {
            $addFields: {
              user: { $arrayElemAt: ['$user', 0] },
              distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] },
            },
          },
          {
            $project: {
              userId: 0,
              'user._id': 0,
            },
          },
          { $limit: limit },
        ];

        return mongoose.connection.db
          ?.collection('profiles')
          .aggregate(pipeline)
          .toArray();
      },
      { userId, longitude, latitude, maxDistance, limit }
    );
  }

  /**
   * Optimized user search with text search and filters
   */
  static async searchUsers(
    searchTerm: string,
    filters: {
      ageMin?: number;
      ageMax?: number;
      gender?: string;
      religion?: string;
      location?: { longitude: number; latitude: number; radius: number };
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    return queryOptimizer.monitorQuery(
      'searchUsers',
      async () => {
        const pipeline: any[] = [];

        // Text search stage
        if (searchTerm) {
          pipeline.push({
            $match: {
              $text: { $search: searchTerm },
            },
          });
          pipeline.push({
            $addFields: {
              score: { $meta: 'textScore' },
            },
          });
        }

        // Location filter
        if (filters.location) {
          pipeline.push({
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [filters.location.longitude, filters.location.latitude],
              },
              distanceField: 'distance',
              maxDistance: filters.location.radius * 1000, // Convert km to meters
              spherical: true,
            },
          });
        }

        // Age and other filters
        const matchConditions: any = {
          isProfileCompleted: true,
        };

        if (filters.ageMin || filters.ageMax) {
          matchConditions.age = {};
          if (filters.ageMin) matchConditions.age.$gte = filters.ageMin;
          if (filters.ageMax) matchConditions.age.$lte = filters.ageMax;
        }

        if (filters.gender) {
          matchConditions.gender = filters.gender;
        }

        if (filters.religion) {
          matchConditions.religion = filters.religion;
        }

        pipeline.push({ $match: matchConditions });

        // Lookup user data
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              {
                $match: {
                  status: 'active',
                  verified: true,
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  image: 1,
                  lastLoginAt: 1,
                },
              },
            ],
          },
        });

        // Only include profiles with valid users
        pipeline.push({
          $match: {
            'user.0': { $exists: true },
          },
        });

        // Add user data to profile
        pipeline.push({
          $addFields: {
            user: { $arrayElemAt: ['$user', 0] },
          },
        });

        // Sort by relevance (text score if searching, otherwise by last login)
        if (searchTerm) {
          pipeline.push({ $sort: { score: { $meta: 'textScore' }, 'user.lastLoginAt': -1 } });
        } else {
          pipeline.push({ $sort: { 'user.lastLoginAt': -1 } });
        }

        // Pagination
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });

        // Clean up response
        pipeline.push({
          $project: {
            userId: 0,
            'user._id': 0,
            score: 0,
          },
        });

        return mongoose.connection.db
          ?.collection('profiles')
          .aggregate(pipeline)
          .toArray();
      },
      { searchTerm, filters, page, limit }
    );
  }

  /**
   * Optimized batch user lookup (for matching algorithms)
   */
  static async findUsersBatch(userIds: string[], excludeFields: string[] = []) {
    return queryOptimizer.monitorQuery(
      'findUsersBatch',
      async () => {
        const objectIds = userIds.map(id => new mongoose.Types.ObjectId(id));
        
        const projection: any = {
          'authentication.oneTimeCode': 0,
          __v: 0,
        };

        excludeFields.forEach(field => {
          projection[field] = 0;
        });

        return mongoose.connection.db
          ?.collection('users')
          .find(
            { 
              _id: { $in: objectIds },
              status: 'active',
              verified: true,
            },
            { projection }
          )
          .toArray();
      },
      { userIds: userIds.length, excludeFields }
    );
  }
}

/**
 * Query explanation utility for debugging
 */
export async function explainQuery(collection: string, pipeline: any[]) {
  try {
    const explanation = await mongoose.connection.db
      ?.collection(collection)
      .aggregate(pipeline)
      .explain('executionStats');

    logger.info(`📊 Query explanation for ${collection}:`, {
      executionTimeMillis: explanation?.executionStats?.executionTimeMillis,
      totalDocsExamined: explanation?.executionStats?.totalDocsExamined,
      totalDocsReturned: explanation?.executionStats?.totalDocsReturned,
      indexesUsed: explanation?.executionStats?.executionStages?.map((stage: any) => stage.indexName).filter(Boolean),
    });

    return explanation;
  } catch (error) {
    logger.error(`❌ Error explaining query for ${collection}:`, error);
    throw error;
  }
}