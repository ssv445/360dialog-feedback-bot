# 360dialog Feedback Bot

## Project Overview

WhatsApp bot that analyzes customer feedback using AI. Built for 360dialog job application.

**Stack:** Node.js, TypeScript, Express, OpenAI GPT-4o-mini, Docker

## Architecture

```
WhatsApp → 360dialog API → Express Webhook → GPT-4o-mini → Response
```

**Files:**
- `src/index.ts` - Express server, webhook endpoints
- `src/analyzer.ts` - OpenAI integration, prompt engineering
- `src/360dialog.ts` - WhatsApp message sending

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
- `OPENAI_API_KEY` - OpenAI API key
- `WEBHOOK_VERIFY_TOKEN` - Any secret for webhook verification

## Testing Locally

1. Start server: `npm run dev`
2. Expose with ngrok: `ngrok http 3000`
3. Configure webhook in 360dialog console
4. Send message to sandbox WhatsApp number

## Key Decisions

- **Sync processing**: MVP simplicity. Production would use message queue.
- **GPT-4o-mini**: Cost-effective, fast enough for real-time responses.
- **No database**: Stateless. Each message analyzed independently.
- **Error handling**: Always acknowledge webhook (200), send user-friendly errors.

## Production Improvements (Not Implemented)

- Async processing with Redis/SQS queue
- Semantic caching for similar feedback
- Rate limiting
- Webhook signature verification
- Multi-tenant support
- Analytics dashboard

## Status

**Complete** - Ready for submission

## Links

- [360dialog Sandbox](https://www.360dialog.com/whatsapp-sandbox)
- [360dialog API Docs](https://docs.360dialog.com/)
- [OpenAI API](https://platform.openai.com/docs)
