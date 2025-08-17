import mongoose from 'mongoose';
import { createClient } from 'redis';
import { env } from './env';
import { createLogger } from '../utils/common';

const logger = createLogger('posts-service');

// MongoDB connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB', { database: env.MONGODB_URI.split('/').pop() });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// MongoDB event listeners
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error during MongoDB shutdown:', error);
    process.exit(1);
  }
});

// Redis client
export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('disconnect', () => {
  logger.warn('Redis disconnected');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis client connected');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't exit process for Redis connection failure
  }
};

// Graceful Redis shutdown
process.on('SIGINT', async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed through app termination');
  } catch (error) {
    logger.error('Error during Redis shutdown:', error);
  }
});