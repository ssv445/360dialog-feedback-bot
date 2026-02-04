import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueue, dequeue, markFailed, requeue, shouldRetry } from './queue';
import { redis, redisBlocking } from './redis';
import { WebhookEvent } from './types';

vi.mock('./redis', () => ({
  redis: {
    set: vi.fn(),
    lPush: vi.fn(),
  },
  redisBlocking: {
    brPop: vi.fn(),
  },
}));

describe('queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTextEvent: WebhookEvent = {
    type: 'text',
    messageId: 'msg_123',
    timestamp: 1700000000,
    from: '1234567890',
    text: 'Hello',
    raw: { id: 'msg_123' },
  };

  describe('enqueue', () => {
    it('enqueues new message and sets dedup key', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK');
      vi.mocked(redis.lPush).mockResolvedValue(1);

      const result = await enqueue(mockTextEvent);

      expect(result).toBe(true);
      expect(redis.set).toHaveBeenCalledWith(
        'msg:msg_123',
        '1',
        { EX: 300, NX: true }
      );
      expect(redis.lPush).toHaveBeenCalledWith(
        'webhook:queue',
        JSON.stringify(mockTextEvent)
      );
    });

    it('skips duplicate messages', async () => {
      vi.mocked(redis.set).mockResolvedValue(null); // NX returns null if key exists

      const result = await enqueue(mockTextEvent);

      expect(result).toBe(false);
      expect(redis.lPush).not.toHaveBeenCalled();
    });

    it('enqueues events without messageId (skips dedup)', async () => {
      const eventNoId: WebhookEvent = {
        type: 'unknown',
        messageId: '',
        timestamp: 1700000000,
        raw: {},
      };
      vi.mocked(redis.lPush).mockResolvedValue(1);

      const result = await enqueue(eventNoId);

      expect(result).toBe(true);
      expect(redis.set).not.toHaveBeenCalled();
      expect(redis.lPush).toHaveBeenCalled();
    });
  });

  describe('dequeue', () => {
    it('returns parsed event from queue', async () => {
      vi.mocked(redisBlocking.brPop).mockResolvedValue({
        key: 'webhook:queue',
        element: JSON.stringify(mockTextEvent),
      });

      const result = await dequeue();

      expect(result).toEqual(mockTextEvent);
      expect(redisBlocking.brPop).toHaveBeenCalledWith('webhook:queue', 0);
    });

    it('returns null when brPop returns null', async () => {
      vi.mocked(redisBlocking.brPop).mockResolvedValue(null);

      const result = await dequeue();

      expect(result).toBeNull();
    });
  });

  describe('markFailed', () => {
    it('pushes failed event with error to failed queue', async () => {
      vi.mocked(redis.lPush).mockResolvedValue(1);
      const before = Date.now();

      await markFailed(mockTextEvent, 'Connection timeout');

      expect(redis.lPush).toHaveBeenCalledWith(
        'webhook:failed',
        expect.any(String)
      );

      const pushedData = JSON.parse(
        vi.mocked(redis.lPush).mock.calls[0][1] as string
      );
      expect(pushedData.messageId).toBe('msg_123');
      expect(pushedData.error).toBe('Connection timeout');
      expect(pushedData.failedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('requeue', () => {
    it('requeues event with incremented retryCount', async () => {
      vi.mocked(redis.lPush).mockResolvedValue(1);

      await requeue(mockTextEvent);

      expect(redis.lPush).toHaveBeenCalledWith(
        'webhook:queue',
        expect.any(String)
      );

      const pushedData = JSON.parse(
        vi.mocked(redis.lPush).mock.calls[0][1] as string
      );
      expect(pushedData.retryCount).toBe(1);
      expect(pushedData.messageId).toBe('msg_123');
    });

    it('increments existing retryCount', async () => {
      vi.mocked(redis.lPush).mockResolvedValue(1);
      const eventWithRetry = { ...mockTextEvent, retryCount: 2 };

      await requeue(eventWithRetry);

      const pushedData = JSON.parse(
        vi.mocked(redis.lPush).mock.calls[0][1] as string
      );
      expect(pushedData.retryCount).toBe(3);
    });
  });

  describe('shouldRetry', () => {
    it('returns true when retryCount is undefined', () => {
      expect(shouldRetry(mockTextEvent)).toBe(true);
    });

    it('returns true when retryCount is 0', () => {
      expect(shouldRetry({ ...mockTextEvent, retryCount: 0 })).toBe(true);
    });

    it('returns true when retryCount is less than MAX_RETRIES', () => {
      expect(shouldRetry({ ...mockTextEvent, retryCount: 2 })).toBe(true);
    });

    it('returns false when retryCount equals MAX_RETRIES', () => {
      expect(shouldRetry({ ...mockTextEvent, retryCount: 3 })).toBe(false);
    });

    it('returns false when retryCount exceeds MAX_RETRIES', () => {
      expect(shouldRetry({ ...mockTextEvent, retryCount: 5 })).toBe(false);
    });
  });
});
