import { createClient } from 'redis';
import { REDIS_URL } from './env';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('✅ Redis connected');
}
