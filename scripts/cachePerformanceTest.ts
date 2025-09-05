// scripts/cachePerformanceTest.ts - Test Redis performance
import redisClient from '../src/redis/redisClient';
import cacheService from '../src/redis/cacheService';
import fastCacheService from '../src/redis/fastCacheService';

async function testCachePerformance() {
  console.log('🚀 Starting Redis Performance Test...\n');
  
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Redis connected successfully\n');
    
    // Test 1: Basic Redis operations
    console.log('📊 Testing basic Redis operations...');
    const testKey = 'perf_test_key';
    const testData = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    // Set operation
    const setStart = Date.now();
    await cacheService.setCache(testKey, testData, 300);
    const setDuration = Date.now() - setStart;
    console.log(`   SET operation: ${setDuration}ms`);
    
    // Get operation
    const getStart = Date.now();
    const retrieved = await cacheService.getCache(testKey);
    const getDuration = Date.now() - getStart;
    console.log(`   GET operation: ${getDuration}ms`);
    
    // Test 2: Fast cache service
    console.log('\n📊 Testing fast cache service...');
    const fastSetStart = Date.now();
    await fastCacheService.setCache(testKey + '_fast', testData, 300);
    const fastSetDuration = Date.now() - fastSetStart;
    console.log(`   Fast SET operation: ${fastSetDuration}ms`);
    
    const fastGetStart = Date.now();
    const fastRetrieved = await fastCacheService.getCache(testKey + '_fast');
    const fastGetDuration = Date.now() - fastGetStart;
    console.log(`   Fast GET operation: ${fastGetDuration}ms`);
    
    // Test 3: Multiple operations
    console.log('\n📊 Testing batch operations...');
    const batchStart = Date.now();
    
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(cacheService.setCache(`batch_${i}`, { index: i }, 300));
    }
    await Promise.all(promises);
    
    const batchDuration = Date.now() - batchStart;
    console.log(`   10 SET operations: ${batchDuration}ms (avg: ${batchDuration / 10}ms)`);
    
    // Test 4: Retrieve batch
    const retrieveStart = Date.now();
    const retrievePromises: Promise<unknown>[] = [];
    for (let i = 0; i < 10; i++) {
      retrievePromises.push(cacheService.getCache(`batch_${i}`));
    }
    const results = await Promise.all(retrievePromises);
    const retrieveDuration = Date.now() - retrieveStart;
    console.log(`   10 GET operations: ${retrieveDuration}ms (avg: ${retrieveDuration / 10}ms)`);
    
    // Test 5: Network latency check
    console.log('\n📊 Testing Redis connection latency...');
    const pingStart = Date.now();
    const isHealthy = await redisClient.healthCheck();
    const pingDuration = Date.now() - pingStart;
    console.log(`   PING operation: ${pingDuration}ms (Healthy: ${isHealthy})`);
    
    // Performance analysis
    console.log('\n📋 Performance Analysis:');
    if (getDuration > 100) {
      console.log('⚠️  WARNING: GET operations are slow (>100ms)');
      console.log('   Possible causes:');
      console.log('   • Network latency to Redis server');
      console.log('   • Redis server overloaded');
      console.log('   • Large data serialization/deserialization');
      console.log('   • Connection pooling issues');
    } else {
      console.log('✅ GET operations are performing well');
    }
    
    if (fastGetDuration < getDuration) {
      console.log('✅ Fast cache service shows improvement');
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('• Use fast cache service for frequently accessed data');
    console.log('• Consider increasing local cache TTL if data doesn\'t change often');
    console.log('• Monitor cache hit rates and adjust strategies accordingly');
    console.log('• Use batch operations for multiple cache operations');
    
    // Cleanup
    await cacheService.deleteCache(testKey);
    await fastCacheService.deleteCache(testKey + '_fast');
    for (let i = 0; i < 10; i++) {
      await cacheService.deleteCache(`batch_${i}`);
    }
    
  } catch (error) {
    console.error('❌ Cache performance test failed:', error);
  } finally {
    process.exit(0);
  }
}

testCachePerformance();
