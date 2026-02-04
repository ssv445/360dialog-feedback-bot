import { describe, it, expect } from 'vitest';
import { parseWebhook } from './webhook-parser';

describe('parseWebhook', () => {
  describe('text messages', () => {
    it('parses a text message correctly', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_123',
                from: '1234567890',
                timestamp: '1700000000',
                type: 'text',
                text: { body: 'Hello world' },
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'text',
        messageId: 'msg_123',
        timestamp: 1700000000,
        from: '1234567890',
        text: 'Hello world',
        raw: body.entry[0].changes[0].value.messages[0],
      });
    });
  });

  describe('image messages', () => {
    it('parses an image message correctly', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_456',
                from: '1234567890',
                timestamp: '1700000000',
                type: 'image',
                image: {
                  id: 'media_789',
                  mime_type: 'image/jpeg',
                  caption: 'My photo',
                },
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'image',
        messageId: 'msg_456',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_789',
        mimeType: 'image/jpeg',
        caption: 'My photo',
        raw: body.entry[0].changes[0].value.messages[0],
      });
    });
  });

  describe('audio messages', () => {
    it('parses an audio message correctly', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_audio',
                from: '1234567890',
                timestamp: '1700000000',
                type: 'audio',
                audio: {
                  id: 'media_audio_123',
                  mime_type: 'audio/ogg',
                },
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'audio',
        messageId: 'msg_audio',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_audio_123',
        mimeType: 'audio/ogg',
        raw: body.entry[0].changes[0].value.messages[0],
      });
    });
  });

  describe('document messages', () => {
    it('parses a document message correctly', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_doc',
                from: '1234567890',
                timestamp: '1700000000',
                type: 'document',
                document: {
                  id: 'media_doc_123',
                  mime_type: 'application/pdf',
                  caption: 'Invoice.pdf',
                },
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'document',
        messageId: 'msg_doc',
        timestamp: 1700000000,
        from: '1234567890',
        mediaUrl: 'media_doc_123',
        mimeType: 'application/pdf',
        caption: 'Invoice.pdf',
        raw: body.entry[0].changes[0].value.messages[0],
      });
    });
  });

  describe('status updates', () => {
    it('parses a status update correctly', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'status_123',
                recipient_id: '1234567890',
                timestamp: '1700000000',
                status: 'delivered',
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'status',
        messageId: 'status_123',
        timestamp: 1700000000,
        recipientId: '1234567890',
        status: 'delivered',
        raw: body.entry[0].changes[0].value.statuses[0],
      });
    });
  });

  describe('edge cases', () => {
    it('returns null for empty body', () => {
      expect(parseWebhook({})).toBeNull();
    });

    it('returns null for body without entry', () => {
      expect(parseWebhook({ other: 'data' })).toBeNull();
    });

    it('returns null for empty changes', () => {
      const body = { entry: [{ changes: [] }] };
      expect(parseWebhook(body)).toBeNull();
    });

    it('returns null when value has no messages or statuses', () => {
      const body = {
        entry: [{
          changes: [{
            value: { other: 'data' },
          }],
        }],
      };
      expect(parseWebhook(body)).toBeNull();
    });

    it('handles unknown message type', () => {
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_unknown',
                from: '1234567890',
                timestamp: '1700000000',
                type: 'sticker',
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);

      expect(result).toEqual({
        type: 'unknown',
        messageId: 'msg_unknown',
        timestamp: 1700000000,
        from: '1234567890',
        raw: body.entry[0].changes[0].value.messages[0],
      });
    });

    it('uses Date.now() when timestamp is missing', () => {
      const before = Date.now();
      const body = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'msg_123',
                from: '1234567890',
                type: 'text',
                text: { body: 'Hello' },
              }],
            },
          }],
        }],
      };

      const result = parseWebhook(body);
      const after = Date.now();

      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
