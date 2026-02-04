import axios from 'axios';
import { DIALOG_API_KEY, DIALOG_API_URL } from './env';

interface SendMessageParams {
  to: string;
  text: string;
}

export async function sendWhatsAppMessage({ to, text }: SendMessageParams): Promise<void> {
  if (!DIALOG_API_KEY) {
    throw new Error('DIALOG_API_KEY is not configured');
  }

  try {
    await axios.post(
      DIALOG_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          'D360-API-KEY': DIALOG_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Message sent to ${to}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('360dialog API error:', error.response?.data || error.message);
    } else {
      console.error('Failed to send message:', error);
    }
    throw new Error('Failed to send WhatsApp message');
  }
}
