import 'dotenv/config';

// Server
export const PORT = process.env.PORT || 3000;
export const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'feedback-bot-token';

// 360dialog
export const DIALOG_API_KEY = process.env.DIALOG_API_KEY || '';
export const DIALOG_API_URL = process.env.DIALOG_API_URL || 'https://waba-sandbox.360dialog.io/v1/messages';

// OpenRouter
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
export const LLM_MODEL = process.env.LLM_MODEL || 'openai/gpt-5-mini';
export const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '500', 10);
export const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.3');
