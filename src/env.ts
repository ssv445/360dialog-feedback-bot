import 'dotenv/config';

// Server
export const PORT = process.env.PORT || 3000;
export const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'feedback-bot-token';

// 360dialog
export const DIALOG_API_KEY = process.env.DIALOG_API_KEY || '';
export const DIALOG_API_URL = process.env.DIALOG_API_URL || 'https://waba-sandbox.360dialog.io/v1/messages';

// OpenAI
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10);
export const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');
