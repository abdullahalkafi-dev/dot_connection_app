import colors from 'colors';
import mongoose from 'mongoose';
import http from 'http';
import { errorLogger, logger } from './shared/logger';
import redisClient from './redis/redisClient';
import cacheMonitor from './redis/cacheMonitor';
import cacheWarmer from './redis/cacheWarmer';
import app from './app';
import config from './config';
import seedSuperAdmin from './DB';

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandledException Detected', error, error);
  process.exit(1);
});
export const server = http.createServer(app);
async function main() {
  try {
    await  mongoose.connect(config.database_url as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    await seedSuperAdmin();

    logger.info(colors.green('🚀 Database connected successfully'));

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);
      console.log(port, 'port');
      
      // Initialize Redis connection
      await redisClient.connect();
      logger.info(colors.cyan('📡 Redis connected successfully'));
      
      // Start cache monitoring
      cacheMonitor.startHealthMonitoring(30000); // Check every 30 seconds
      logger.info(colors.yellow('📊 Cache monitoring started'));
      

      // Schedule cache warming
      cacheWarmer.scheduleWarmup();
      logger.info(colors.magenta('🔥 Cache warming scheduled'));
    server.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening ${config.ip_address} on port:${config.port}`)
      );
    });
    
    //socket
  } catch (error) {
    console.log(error);
    errorLogger.error(colors.red('🤢 Failed to connect Database'));
  }

  
  //handle unhandledRejection
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error('UnhandledRejection Detected', error, error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on('SIGTERM',async () => {
  logger.info('SIGTERM IS RECEIVE');
  if (server) {
    server.close(()=>{
      logger.info('HTTP server closed.');
      //     // Close DB or Redis here if needed
          process.exit(0);
    });
  }
});
