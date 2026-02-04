import express, { Request, Response } from 'express';
import { parseWebhook } from './webhook-parser';
import { enqueue } from './queue';
import { connectRedis } from './redis';
import { startWorker } from './worker';
import { PORT, WEBHOOK_VERIFY_TOKEN } from './env';

const app = express();
app.use(express.json());

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: '360dialog Feedback Bot is running' });
});

// Webhook verification (GET)
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.warn('Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook handler - immediate response, async processing
app.post('/webhook', (req: Request, res: Response) => {
  res.sendStatus(200); // Immediate response to prevent retries

  const event = parseWebhook(req.body);
  if (event) {
    enqueue(event).catch((err) => console.error('Failed to enqueue:', err));
  }
});

// Start server and worker
async function main() {
  await connectRedis();
  startWorker().catch(console.error);

  app.listen(PORT, () => {
    console.log(`🚀 Feedback Bot running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  });
}

main().catch(console.error);
