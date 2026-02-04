import 'dotenv/config';
import axios from 'axios';

const DIALOG_API_KEY = process.env.DIALOG_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function setupWebhook() {
  console.log('🔧 Setting up 360dialog sandbox webhook...\n');

  // Validate required env vars
  if (!DIALOG_API_KEY) {
    console.error('❌ Error: DIALOG_API_KEY not set in .env');
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error('❌ Error: WEBHOOK_URL not set in .env');
    console.error('   Add WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook to .env');
    process.exit(1);
  }

  console.log(`   Webhook URL: ${WEBHOOK_URL}`);
  console.log(`   API Key: ${DIALOG_API_KEY.slice(0, 8)}...`);
  console.log('');

  try {
    const response = await axios.post(
      'https://waba-sandbox.360dialog.io/v1/configs/webhook',
      { url: WEBHOOK_URL },
      {
        headers: {
          'Content-Type': 'application/json',
          'D360-API-KEY': DIALOG_API_KEY,
        },
      }
    );

    console.log('✅ Webhook configured successfully!');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Failed to set webhook (HTTP ${error.response?.status})`);
      console.error(`   Response: ${JSON.stringify(error.response?.data)}`);
    } else {
      console.error('❌ Failed to set webhook:', error);
    }
    process.exit(1);
  }
}

setupWebhook();
