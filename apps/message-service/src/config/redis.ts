import { createClient, RedisClientType } from 'redis'
import { env } from './env'
import { logger } from '../utils/logger'

class RedisClient {
  private client: RedisClientType
  private subscriber: RedisClientType
  private publisher: RedisClientType

  constructor() {
    this.client = createClient({
      url: env.REDIS_URL,
    })
    this.subscriber = createClient({
      url: env.REDIS_URL,
    })
    this.publisher = createClient({
      url: env.REDIS_URL,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connected')
    })

    this.client.on('error', (error: Error) => {
      logger.error('Redis client error:', error)
    })

    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected')
    })

    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected')
    })
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.client.connect(),
      this.subscriber.connect(),
      this.publisher.connect(),
    ])
  }

  getClient(): RedisClientType {
    return this.client
  }

  getSubscriber(): RedisClientType {
    return this.subscriber
  }

  getPublisher(): RedisClientType {
    return this.publisher
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect(),
    ])
  }
}

export const redisClient = new RedisClient()

// Export individual clients for socket.io adapter
export const pubClient = createClient({
  url: env.REDIS_URL,
})

export const subClient = createClient({
  url: env.REDIS_URL,
})