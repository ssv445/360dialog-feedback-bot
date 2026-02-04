import { createClient, RedisClientType } from 'redis';
import { REDIS_URL } from './env';

// Main client for general operations (set, lPush, etc.)
export const redis = createClient({ url: REDIS_URL });

// Separate client for blocking operations (brPop)
export const redisBlocking = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));
redisBlocking.on('error', (err) => console.error('Redis blocking error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  await redisBlocking.connect();
  console.log('✅ Redis connected');
}
