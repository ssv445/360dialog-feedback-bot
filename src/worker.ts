import { dequeue, markFailed, requeue, shouldRetry } from './queue';
import { WebhookEvent } from './types';
import { analyzeFeedback } from './analyzer';
import { sendWhatsAppMessage } from './360dialog';

export async function startWorker(): Promise<void> {
  console.log('🔄 Worker started, waiting for messages...');

  while (true) {
    const event = await dequeue();
    if (!event) continue;

    try {
      await processEvent(event);
    } catch (error) {
      console.error(`❌ Failed to process ${event.messageId}:`, error);

      if (shouldRetry(event)) {
        await requeue(event);
      } else {
        await markFailed(event, String(error));

        // Notify user only after all retries exhausted
        if (event.from) {
          try {
            await sendWhatsAppMessage({
              to: event.from,
              text: '❌ Sorry, I encountered an error analyzing your feedback. Please try again.',
            });
          } catch {
            // Silent fail for error notification
          }
        }
      }
    }
  }
}

async function processEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'text':
      console.log(`📩 Processing text from ${event.from}: ${event.text}`);
      const analysis = await analyzeFeedback(event.text!);
      await sendWhatsAppMessage({ to: event.from!, text: analysis });
      console.log(`✅ Replied to ${event.from}`);
      break;

    case 'status':
      console.log(`📊 Status: ${event.status} for ${event.messageId}`);
      break;

    case 'image':
      console.log(`🖼️  Image from ${event.from}`);
      await sendWhatsAppMessage({
        to: event.from!,
        text: '📷 I can only analyze text feedback. Please send your feedback as a text message.',
      });
      break;

    case 'audio':
      console.log(`🎵 Audio from ${event.from}`);
      await sendWhatsAppMessage({
        to: event.from!,
        text: '🎵 I can only analyze text feedback. Please send your feedback as a text message.',
      });
      break;

    case 'document':
      console.log(`📄 Document from ${event.from}`);
      await sendWhatsAppMessage({
        to: event.from!,
        text: '📄 I can only analyze text feedback. Please send your feedback as a text message.',
      });
      break;

    case 'video':
      console.log(`🎬 Video from ${event.from}`);
      await sendWhatsAppMessage({
        to: event.from!,
        text: '🎬 I can only analyze text feedback. Please send your feedback as a text message.',
      });
      break;

    default:
      console.log(`❓ Unknown event type: ${event.type}`, event.raw);
  }
}
