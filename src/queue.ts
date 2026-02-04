import { redis, redisBlocking } from './redis';
import { WebhookEvent } from './types';

const DEDUP_TTL_SECONDS = 300; // 5 minutes
const QUEUE_KEY = 'webhook:queue';
const FAILED_KEY = 'webhook:failed';

export async function enqueue(event: WebhookEvent): Promise<boolean> {
  // Skip dedup for events without messageId
  if (!event.messageId) {
    await redis.lPush(QUEUE_KEY, JSON.stringify(event));
    console.log(`📥 Queued: ${event.type} (no messageId)`);
    return true;
  }

  // Deduplication check
  const dedupKey = `msg:${event.messageId}`;
  const isNew = await redis.set(dedupKey, '1', { EX: DEDUP_TTL_SECONDS, NX: true });

  if (!isNew) {
    console.log(`⏭️  Duplicate: ${event.messageId}`);
    return false;
  }

  // Add to queue
  await redis.lPush(QUEUE_KEY, JSON.stringify(event));
  console.log(`📥 Queued: ${event.type} - ${event.messageId}`);
  return true;
}

export async function dequeue(): Promise<WebhookEvent | null> {
  const result = await redisBlocking.brPop(QUEUE_KEY, 0);
  if (!result) return null;
  return JSON.parse(result.element);
}

export async function markFailed(event: WebhookEvent, error: string): Promise<void> {
  const failedEvent = { ...event, error, failedAt: Date.now() };
  await redis.lPush(FAILED_KEY, JSON.stringify(failedEvent));
}
