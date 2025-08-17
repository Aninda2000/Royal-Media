import mongoose from 'mongoose'
import { env } from './env'
import { logger } from '../utils/logger'

export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI)
    logger.info(`Connected to MongoDB: ${connection.connection.host}`)
  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
  } catch (error) {
    logger.error('Database disconnection failed:', error)
  }
}