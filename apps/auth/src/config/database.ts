import mongoose from 'mongoose';
import { createClient } from 'redis';
import { env } from './env';
import { createLogger } from '../utils/common';

const logger = createLogger('auth-service');

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const redisClient = createClient({
  url: env.REDIS_URL,
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
};

redisClient.on('error', (error) => {
  logger.error('Redis error:', error);
});

redisClient.on('disconnect', () => {
  logger.warn('Redis disconnected');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});