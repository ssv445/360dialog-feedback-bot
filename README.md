# 360dialog Feedback Bot

A WhatsApp bot that analyzes customer feedback using AI. Send any feedback message and receive instant sentiment analysis, key themes, and actionable recommendations.

## How It Works

```
User sends feedback → Bot analyzes with GPT-4o-mini → Returns structured analysis
```

### Sample Interaction

**User:**
> The product quality was great but shipping took forever. Customer service was unhelpful. Would buy again though.

**Bot:**
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

## Quick Start

### 1. Set Up 360dialog Sandbox

1. Go to [360dialog WhatsApp Sandbox](https://www.360dialog.com/whatsapp-sandbox)
2. Send "START" to the sandbox WhatsApp number shown
3. You'll receive an API key - save it for the next step

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your keys:
```
DIALOG_API_KEY=your_360dialog_api_key
OPENAI_API_KEY=your_openai_api_key
WEBHOOK_VERIFY_TOKEN=any_secret_token
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`

### 4. Expose Webhook (for testing)

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and configure it as your webhook URL in the 360dialog console:
- Webhook URL: `https://abc123.ngrok.io/webhook`
- Verify Token: Same as your `WEBHOOK_VERIFY_TOKEN`

## Run with Docker

```bash
docker build -t feedback-bot .
docker run -p 3000:3000 --env-file .env feedback-bot
```

Or with docker-compose:

```bash
docker-compose up
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/webhook` | GET | Webhook verification |
| `/webhook` | POST | Receive WhatsApp messages |

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   WhatsApp      │      │   Express       │      │   OpenAI        │
│   (360dialog)   │─────▶│   Server        │─────▶│   GPT-4o-mini   │
│                 │◀─────│                 │◀─────│                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Project Structure

```
├── src/
│   ├── index.ts        # Express server + webhook handler
│   ├── analyzer.ts     # GPT-4o-mini feedback analysis
│   └── 360dialog.ts    # WhatsApp message sender
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Production Considerations

This is an MVP designed for demonstration. For production use, consider:

- **Async Processing**: Use a message queue (Redis/SQS) to handle high volumes without blocking
- **Semantic Caching**: Cache similar feedback analyses to reduce API costs
- **Rate Limiting**: Protect against abuse and API quota exhaustion
- **Multi-tenant Support**: Add API key management for multiple businesses
- **Analytics Dashboard**: Track sentiment trends over time
- **Webhook Signature Verification**: Validate incoming requests are from 360dialog

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **AI**: OpenAI GPT-4o-mini
- **WhatsApp**: 360dialog Cloud API
- **Container**: Docker

## License

MIT
