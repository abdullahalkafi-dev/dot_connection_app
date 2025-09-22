import colors from 'colors';
import mongoose from 'mongoose';
import http from 'http';
import { errorLogger, logger } from './shared/logger';
import redisClient from './redis/redisClient';

import app from './app';
import config from './config';
import seedSuperAdmin from './DB';
import { setupSocket } from './socket/socket';
import { createDatabaseIndexes } from './DB/indexes';

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

    // Create database indexes for optimal performance
    await createDatabaseIndexes();

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);
      console.log(port, 'port');
      
      // Initialize Redis connection
      await redisClient.connect();
      logger.info(colors.cyan('📡 Redis connected successfully'));
      


      // Initialize Socket.IO
      setupSocket(server);
      logger.info(colors.blue('🔌 Socket.IO initialized successfully'));
      
    // For Docker: bind to 0.0.0.0 to allow nginx to reach the containers
    // For local development: can bind to specific IP
    server.listen(port, '0.0.0.0' as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on '0.0.0.0' port:'${port}'`)
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
          process.exit(0);
    });
  }
});
