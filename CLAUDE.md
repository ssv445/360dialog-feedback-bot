# 360dialog Feedback Bot

## Project Overview

WhatsApp bot that analyzes customer feedback using AI. Send any feedback message and receive instant sentiment analysis, key themes, and actionable recommendations.

**Stack:** Node.js, TypeScript, Express, OpenRouter (LLM gateway), Docker

## Sample Interaction

**User:**
> The product quality was great but shipping took forever. Customer service was unhelpful. Would buy again though.

**Bot Response:**
```
📊 Feedback Analysis

Sentiment: Mixed (65% positive)

✅ Positive:
• Product quality praised
• Intent to repurchase

⚠️ Negative:
• Shipping delays
• Poor customer service

🎯 Action Items:
• Review shipping logistics
• Train support team
```

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   WhatsApp      │      │   Express       │      │   OpenRouter    │
│   (360dialog)   │─────▶│   Server        │─────▶│   LLM           │
│                 │◀─────│                 │◀─────│                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Project Structure

```
├── src/
│   ├── index.ts        # Express server + webhook handler
│   ├── analyzer.ts     # OpenRouter/LLM integration, prompt engineering
│   └── 360dialog.ts    # WhatsApp message sender
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Commands

```bash
npm run dev      # Start dev server (ts-node)
npm run build    # Compile TypeScript
npm start        # Run compiled JS

docker build -t feedback-bot .
docker-compose up
```

## Environment Variables

Copy `.env.example` to `.env`:
- `DIALOG_API_KEY` - From 360dialog sandbox
- `OPENROUTER_API_KEY` - OpenRouter API key (https://openrouter.ai/keys)
- `LLM_MODEL` - Any OpenRouter model (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`)
- `WEBHOOK_VERIFY_TOKEN` - Any secret for webhook verification

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/webhook` | GET | Webhook verification |
| `/webhook` | POST | Receive WhatsApp messages |

## Testing Locally

1. Get 360dialog sandbox API key from [360dialog Sandbox](https://www.360dialog.com/whatsapp-sandbox)
2. Copy `.env.example` to `.env` and fill in keys
3. Start server: `npm run dev`
4. Expose with ngrok: `ngrok http 3000`
5. Configure webhook in 360dialog console: `https://your-ngrok-url/webhook`
6. Send message to sandbox WhatsApp number

## Key Decisions

- **Sync processing**: MVP simplicity. Production would use message queue.
- **OpenRouter**: LLM gateway allowing model flexibility (GPT-4o-mini, Claude, etc.).
- **No database**: Stateless. Each message analyzed independently.
- **Error handling**: Always acknowledge webhook (200), send user-friendly errors.

## Production Improvements (Not Implemented)

- Async processing with Redis/SQS queue
- Semantic caching for similar feedback
- Rate limiting
- Webhook signature verification
- Multi-tenant support
- Analytics dashboard

## Links

- [360dialog Sandbox](https://www.360dialog.com/whatsapp-sandbox)
- [360dialog API Docs](https://docs.360dialog.com/)
- [OpenRouter API](https://openrouter.ai/docs)
