import { WebhookEvent } from './types';

export function parseWebhook(body: any): WebhookEvent | null {
  const value = body.entry?.[0]?.changes?.[0]?.value;
  if (!value) return null;

  const msg = value.messages?.[0];

  // Text message
  if (msg?.type === 'text') {
    return {
      type: 'text',
      messageId: msg.id,
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      text: msg.text?.body,
      raw: msg,
    };
  }

  // Image message
  if (msg?.type === 'image') {
    return {
      type: 'image',
      messageId: msg.id,
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      mediaUrl: msg.image?.id,
      mimeType: msg.image?.mime_type,
      caption: msg.image?.caption,
      raw: msg,
    };
  }

  // Audio message
  if (msg?.type === 'audio') {
    return {
      type: 'audio',
      messageId: msg.id,
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      mediaUrl: msg.audio?.id,
      mimeType: msg.audio?.mime_type,
      raw: msg,
    };
  }

  // Document message
  if (msg?.type === 'document') {
    return {
      type: 'document',
      messageId: msg.id,
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      mediaUrl: msg.document?.id,
      mimeType: msg.document?.mime_type,
      caption: msg.document?.caption,
      raw: msg,
    };
  }

  // Video message
  if (msg?.type === 'video') {
    return {
      type: 'video',
      messageId: msg.id,
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      mediaUrl: msg.video?.id,
      mimeType: msg.video?.mime_type,
      caption: msg.video?.caption,
      raw: msg,
    };
  }

  // Status update
  const status = value.statuses?.[0];
  if (status) {
    return {
      type: 'status',
      messageId: status.id,
      timestamp: parseInt(status.timestamp) || Date.now(),
      recipientId: status.recipient_id,
      status: status.status,
      raw: status,
    };
  }

  // Unknown message type (but has a message)
  if (msg) {
    return {
      type: 'unknown',
      messageId: msg.id || '',
      timestamp: parseInt(msg.timestamp) || Date.now(),
      from: msg.from,
      raw: msg,
    };
  }

  return null;
}
