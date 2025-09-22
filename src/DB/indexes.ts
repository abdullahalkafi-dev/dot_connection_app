import mongoose from 'mongoose';
import { logger } from '../shared/logger';

/**
 * Database indexing strategy for optimal performance
 * This file contains all database indexes to improve query performance
 */

interface IndexDefinition {
  [key: string]: 1 | -1 | 'text' | '2dsphere';
}

export const createDatabaseIndexes = async (): Promise<void> => {
  try {
    logger.info('🔧 Creating database indexes...');

    // User collection indexes
    const userIndexes: IndexDefinition[] = [
      // Single field indexes
      { status: 1 }, // For filtering active/inactive users
      { role: 1 }, // For role-based queries
      { verified: 1 }, // For filtering verified users
      { fcmToken: 1 }, // For push notifications
      { lastLoginAt: -1 }, // For recent activity queries
      { createdAt: -1 }, // For chronological sorting
    ];

    // Profile collection indexes
    const profileIndexes: IndexDefinition[] = [
      // Single field indexes
      { userId: 1 }, // Reference to user (should be unique)
      { age: 1 }, // Age-based filtering
      { gender: 1 }, // Gender filtering
      { interestedIn: 1 }, // Interest matching
      { religion: 1 }, // Religion filtering
      { studyLevel: 1 }, // Education filtering
      { smokingStatus: 1 }, // Smoking preference
      { drinkingStatus: 1 }, // Drinking preference
      { isProfileCompleted: 1 }, // Complete profiles only
    ];

    // Match collection indexes (if exists)
    const matchIndexes: IndexDefinition[] = [
      { userId: 1 }, // User's matches
      { targetUserId: 1 }, // Target user matches
      { action: 1 }, // Match actions (like, skip, etc.)
      { createdAt: -1 }, // Recent matches
    ];

    // Message collection indexes (if exists)
    const messageIndexes: IndexDefinition[] = [
      { senderId: 1 }, // Sender queries
      { receiverId: 1 }, // Receiver queries
      { chatId: 1 }, // Chat conversations
      { createdAt: -1 }, // Message chronology
      { isRead: 1 }, // Unread messages
    ];

    // Create indexes for each collection
    const collections = [
      { name: 'users', indexes: userIndexes },
      { name: 'profiles', indexes: profileIndexes },
      { name: 'matches', indexes: matchIndexes },
      { name: 'messages', indexes: messageIndexes },
    ];

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    for (const collection of collections) {
      try {
        const collectionExists = await db.listCollections({ name: collection.name }).hasNext();
        
        if (collectionExists) {
          for (const index of collection.indexes) {
            try {
              await db.collection(collection.name).createIndex(index, {
                background: true, // Create in background
                sparse: true, // Ignore null values
              });
              logger.info(`✅ Created index on ${collection.name}: ${JSON.stringify(index)}`);
            } catch (error: any) {
              if (error.code === 85) {
                // Index already exists, ignore
                logger.info(`📋 Index already exists on ${collection.name}: ${JSON.stringify(index)}`);
              } else {
                logger.error(`❌ Error creating index on ${collection.name}:`, error);
              }
            }
          }
        } else {
          logger.info(`⚠️ Collection ${collection.name} does not exist yet`);
        }
      } catch (error) {
        logger.error(`❌ Error processing collection ${collection.name}:`, error);
      }
    }

    // Create TTL indexes for cleanup
    await createTTLIndexes();

    logger.info('✅ Database indexing completed successfully');
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error);
    throw error;
  }
};

/**
 * Create Time-To-Live (TTL) indexes for automatic document cleanup
 */
const createTTLIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Auto-delete expired OTP codes (15 minutes)
    await db.collection('users').createIndex(
      { 'authentication.expireAt': 1 },
      { 
        expireAfterSeconds: 0, // Expire at the specified time
        background: true,
        sparse: true,
      }
    );
    logger.info('✅ Created TTL index for OTP cleanup');

    // Auto-delete old unverified users (24 hours)
    await db.collection('users').createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 24 * 60 * 60, // 24 hours
        partialFilterExpression: { verified: false },
        background: true,
      }
    );
    logger.info('✅ Created TTL index for unverified user cleanup');

  } catch (error) {
    logger.error('❌ Error creating TTL indexes:', error);
  }
};

/**
 * Analyze and display index usage statistics
 */
export const analyzeIndexUsage = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collections = ['users', 'profiles', 'matches', 'messages'];

    for (const collectionName of collections) {
      try {
        // Get index information instead of stats
        const indexes = await db.collection(collectionName).listIndexes().toArray();
        logger.info(`📊 Indexes for ${collectionName}:`, indexes.map(idx => ({ name: idx.name, key: idx.key })));
      } catch (error) {
        logger.warn(`⚠️ Could not get index info for ${collectionName}:`, error);
      }
    }
  } catch (error) {
    logger.error('❌ Error analyzing index usage:', error);
  }
};

/**
 * Drop unused indexes (use with caution)
 */
export const dropUnusedIndexes = async (dryRun: boolean = true): Promise<void> => {
  if (dryRun) {
    logger.info('🔍 Dry run mode: Analyzing which indexes would be dropped...');
    // Add logic to analyze unused indexes
    return;
  }
  
  // Implement actual index dropping logic here
  logger.warn('⚠️ Index dropping functionality not implemented for safety');
};