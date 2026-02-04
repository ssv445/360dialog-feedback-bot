import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { analyzeFeedback } from './analyzer';
import { sendWhatsAppMessage } from './360dialog';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'feedback-bot-token';

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: '360dialog Feedback Bot is running' });
});

// Webhook verification (GET)
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.warn('Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook handler (POST)
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Handle WhatsApp Cloud API format
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Could be a status update, acknowledge it
      res.sendStatus(200);
      return;
    }

    const message = messages[0];
    const from = message.from; // Sender's phone number
    const text = message.text?.body;

    if (!text) {
      console.log('Received non-text message, ignoring');
      res.sendStatus(200);
      return;
    }

    console.log(`Received from ${from}: ${text}`);

    // Analyze the feedback
    const analysis = await analyzeFeedback(text);

    // Send the analysis back
    await sendWhatsAppMessage({ to: from, text: analysis });

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Try to send error message to user if we have their number
    try {
      const from = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
      if (from) {
        await sendWhatsAppMessage({
          to: from,
          text: '❌ Sorry, I encountered an error analyzing your feedback. Please try again.',
        });
      }
    } catch {
      // Silent fail for error message
    }

    res.sendStatus(200); // Always acknowledge to prevent retries
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Feedback Bot running on port ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
});
