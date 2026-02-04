import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookEvent } from './types';

// Mock dependencies before importing worker
vi.mock('./queue', () => ({
  dequeue: vi.fn(),
  markFailed: vi.fn(),
}));

vi.mock('./analyzer', () => ({
  analyzeFeedback: vi.fn(),
}));

vi.mock('./360dialog', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

import { dequeue, markFailed } from './queue';
import { analyzeFeedback } from './analyzer';
import { sendWhatsAppMessage } from './360dialog';

// We can't easily test startWorker (infinite loop), so we'll test the processing logic
// by extracting it or testing through controlled dequeue mocks

describe('worker processing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to simulate one iteration of the worker loop
  async function processOneEvent(event: WebhookEvent): Promise<void> {
    // Import fresh to get mocked version
    const { startWorker } = await import('./worker');

    // Setup: dequeue returns event once, then hangs forever
    let callCount = 0;
    vi.mocked(dequeue).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return event;
      // Block forever on second call (simulates waiting for next message)
      return new Promise(() => {});
    });

    // Start worker (will process one event then hang)
    const workerPromise = startWorker();

    // Give it time to process
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  describe('text messages', () => {
    it('analyzes feedback and sends reply', async () => {
      const event: WebhookEvent = {
        type: 'text',
        messageId: 'msg_123',
        timestamp: 1700000000,
        from: '1234567890',
        text: 'Great product!',
        raw: {},
      };

      vi.mocked(analyzeFeedback).mockResolvedValue('Analysis result');
      vi.mocked(sendWhatsAppMessage).mockResolvedValue();

      await processOneEvent(event);

      expect(analyzeFeedback).toHaveBeenCalledWith('Great product!');
      expect(sendWhatsAppMessage).toHaveBeenCalledWith({
        to: '1234567890',
        text: 'Analysis result',
      });
    });

    it('marks failed and notifies user on error', async () => {
      const event: WebhookEvent = {
        type: 'text',
        messageId: 'msg_456',
        timestamp: 1700000000,
        from: '1234567890',
        text: 'Test',
        raw: {},
      };

      vi.mocked(analyzeFeedback).mockRejectedValue(new Error('API error'));
      vi.mocked(sendWhatsAppMessage).mockResolvedValue();

      await processOneEvent(event);

      expect(markFailed).toHaveBeenCalledWith(event, 'Error: API error');
      expect(sendWhatsAppMessage).toHaveBeenCalledWith({
        to: '1234567890',
        text: '❌ Sorry, I encountered an error analyzing your feedback. Please try again.',
      });
    });
  });

  describe('status updates', () => {
    it('logs status without sending message', async () => {
      const event: WebhookEvent = {
        type: 'status',
        messageId: 'status_123',
        timestamp: 1700000000,
        recipientId: '1234567890',
        status: 'delivered',
        raw: {},
      };

      await processOneEvent(event);

      expect(analyzeFeedback).not.toHaveBeenCalled();
      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    });
  });

  describe('image messages', () => {
    it('sends unsupported message reply', async () => {
      const event: WebhookEvent = {
        type: 'image',
        messageId: 'img_123',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_id',
        raw: {},
      };

      vi.mocked(sendWhatsAppMessage).mockResolvedValue();

      await processOneEvent(event);

      expect(analyzeFeedback).not.toHaveBeenCalled();
      expect(sendWhatsAppMessage).toHaveBeenCalledWith({
        to: '1234567890',
        text: '📷 I can only analyze text feedback. Please send your feedback as a text message.',
      });
    });
  });

  describe('audio messages', () => {
    it('sends unsupported message reply', async () => {
      const event: WebhookEvent = {
        type: 'audio',
        messageId: 'audio_123',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_id',
        raw: {},
      };

      vi.mocked(sendWhatsAppMessage).mockResolvedValue();

      await processOneEvent(event);

      expect(sendWhatsAppMessage).toHaveBeenCalledWith({
        to: '1234567890',
        text: '🎵 I can only analyze text feedback. Please send your feedback as a text message.',
      });
    });
  });

  describe('document messages', () => {
    it('sends unsupported message reply', async () => {
      const event: WebhookEvent = {
        type: 'document',
        messageId: 'doc_123',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_id',
        raw: {},
      };

      vi.mocked(sendWhatsAppMessage).mockResolvedValue();

      await processOneEvent(event);

      expect(sendWhatsAppMessage).toHaveBeenCalledWith({
        to: '1234567890',
        text: '📄 I can only analyze text feedback. Please send your feedback as a text message.',
      });
    });
  });
});
