import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Verify connection to database
    await prisma.$connect();
    logger.info('📦 Database connection has been established successfully.');

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
      logger.info(`📄 API Documentation available at http://localhost:${env.PORT}/api/docs`);
    });

    const shutdown = async () => {
      logger.info('SIGTERM/SIGINT received. Shutting down server gracefully...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Prisma database client disconnected.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    logger.error(`❌ Failed to start server: ${err.message || err}`);
    process.exit(1);
  }
};

startServer();
