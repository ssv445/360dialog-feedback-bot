# 360dialog Feedback Bot

WhatsApp bot that analyzes customer feedback using AI. Send any feedback message and receive instant sentiment analysis, key themes, and actionable recommendations.

## Quick Start

### 1. Get API Keys

- **360dialog**: Get sandbox API key from [360dialog Sandbox](https://www.360dialog.com/whatsapp-sandbox)
- **OpenRouter**: Get API key from [OpenRouter](https://openrouter.ai/keys)

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`

### 4. Expose Webhook (for testing)

```bash
ngrok http 3000
```

Configure in 360dialog console:
- Webhook URL: `https://your-ngrok-url/webhook`
- Verify Token: Same as `WEBHOOK_VERIFY_TOKEN` in `.env`

### 5. Test

Send a message to the sandbox WhatsApp number.

## Docker

```bash
docker-compose up
```

## License

MIT
