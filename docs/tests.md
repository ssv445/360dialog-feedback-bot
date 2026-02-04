# Test Documentation

## Overview

| Test File | Tests | Module | Coverage |
|-----------|-------|--------|----------|
| `analyzer.test.ts` | 19 | LLM feedback analysis | Format output, API handling, edge cases |
| `360dialog.test.ts` | 12 | WhatsApp messaging | Send messages, error handling |
| `webhook-parser.test.ts` | 11 | Webhook parsing | All message types, edge cases |
| `queue.test.ts` | 6 | Redis queue | Enqueue, dequeue, deduplication |
| `worker.test.ts` | 6 | Background worker | Process all event types |
| **Total** | **54** | | |

## Running Tests

```bash
# Run all unit tests
npm test -- --exclude='**/*.integration.test.ts'

# Run specific test file
npm test -- src/queue.test.ts

# Run with watch mode
npm run test:watch
```

---

## 1. Analyzer Tests (`analyzer.test.ts`)

### formatAnalysis (8 tests)

Formats the LLM JSON response into a human-readable WhatsApp message.

| Test | Purpose |
|------|---------|
| formats positive sentiment with all sections | Verify positive feedback shows ✅ section, hides ⚠️ section |
| formats negative sentiment with all sections | Verify negative feedback shows ⚠️ section, hides ✅ section |
| formats mixed sentiment with both positive and negative | Both sections visible for mixed feedback |
| handles zero sentiment score | Edge case: 0% positive displays correctly |
| handles 100% sentiment score | Edge case: 100% positive displays correctly |
| omits action items section when empty | Don't show 🎯 section if no actions |
| handles all empty arrays | Gracefully handle edge case with no data |
| handles max 3 items per section | Verify bullet count matches expected format |

### analyzeFeedback (11 tests)

Calls OpenRouter LLM API and processes the response.

| Test | Purpose |
|------|---------|
| parses JSON response and formats output | Happy path: API returns valid JSON |
| handles negative feedback correctly | Verify negative sentiment formatting |
| handles mixed feedback with both sections | Verify mixed sentiment formatting |
| returns fallback on empty response | Graceful degradation when API returns null |
| returns fallback on empty choices array | Graceful degradation when API returns empty array |
| throws on API error | Proper error handling for API failures |
| throws on invalid JSON response | Handle malformed API responses |
| throws on malformed JSON structure | Handle JSON missing required fields |
| calls API with correct parameters | Verify API call has correct model, tokens, etc. |
| handles special characters in feedback points | Support quotes, ampersands, angle brackets |
| handles unicode/emoji in feedback points | Support international characters and emojis |

---

## 2. 360dialog Tests (`360dialog.test.ts`)

### sendWhatsAppMessage (12 tests)

Sends messages via 360dialog WhatsApp API.

| Test | Purpose |
|------|---------|
| sends message with correct parameters | Verify API payload structure (messaging_product, recipient_type, etc.) |
| sends message with long text content | Handle multi-line analysis results |
| sends message with unicode and emojis | Support international text and emojis |
| handles international phone numbers | Support phone numbers with + prefix |
| throws error when DIALOG_API_KEY is not configured | Fail fast if API key missing |
| throws error on axios network error | Handle network failures gracefully |
| throws error on API error response | Handle 4xx/5xx API responses |
| throws error on non-axios error | Handle unexpected errors |
| logs success message after sending | Verify logging for debugging |
| logs axios error details | Log API error response for debugging |
| logs non-axios error details | Log unexpected errors for debugging |
| uses correct API URL from env | Support custom API URL configuration |

---

## 3. Webhook Parser Tests (`webhook-parser.test.ts`)

### parseWebhook (11 tests)

Parses incoming 360dialog webhook payloads into typed events.

#### Message Types (5 tests)

| Test | Purpose |
|------|---------|
| parses a text message correctly | Extract id, from, timestamp, text body |
| parses an image message correctly | Extract media id, mime type, caption |
| parses an audio message correctly | Extract audio media id and mime type |
| parses a document message correctly | Extract document media id, mime type, caption |
| parses a status update correctly | Extract status (sent/delivered/read/failed) |

#### Edge Cases (6 tests)

| Test | Purpose |
|------|---------|
| returns null for empty body | Handle empty webhook payload |
| returns null for body without entry | Handle malformed payload missing entry |
| returns null for empty changes | Handle payload with no changes |
| returns null when value has no messages or statuses | Handle payload with no actionable data |
| handles unknown message type | Gracefully handle unsupported types (sticker, etc.) |
| uses Date.now() when timestamp is missing | Fallback timestamp for missing data |

---

## 4. Queue Tests (`queue.test.ts`)

### enqueue (3 tests)

Adds events to Redis queue with deduplication.

| Test | Purpose |
|------|---------|
| enqueues new message and sets dedup key | Verify SET NX (5 min TTL) + LPUSH to queue |
| skips duplicate messages | Return false and skip LPUSH if dedup key exists |
| enqueues events without messageId (skips dedup) | Allow events without ID (e.g., unknown types) |

### dequeue (2 tests)

Blocking pop from Redis queue.

| Test | Purpose |
|------|---------|
| returns parsed event from queue | BRPOP returns JSON, parse to WebhookEvent |
| returns null when brPop returns null | Handle empty queue gracefully |

### markFailed (1 test)

Store failed events for retry/debugging.

| Test | Purpose |
|------|---------|
| pushes failed event with error to failed queue | LPUSH to webhook:failed with error message and timestamp |

---

## 5. Worker Tests (`worker.test.ts`)

### Text Messages (2 tests)

| Test | Purpose |
|------|---------|
| analyzes feedback and sends reply | Full flow: dequeue → analyze → send response |
| marks failed and notifies user on error | Error handling: markFailed + send error message |

### Status Updates (1 test)

| Test | Purpose |
|------|---------|
| logs status without sending message | Status events logged only, no reply sent |

### Unsupported Message Types (3 tests)

| Test | Purpose |
|------|---------|
| image: sends unsupported message reply | Reply with "send text instead" message |
| audio: sends unsupported message reply | Reply with "send text instead" message |
| document: sends unsupported message reply | Reply with "send text instead" message |

---

## Integration Tests (`analyzer.integration.test.ts`)

Real API calls to OpenRouter (requires `OPENROUTER_API_KEY`).

| Test | Purpose |
|------|---------|
| should analyze purely positive feedback | Real LLM analysis of positive text |
| should analyze purely negative feedback | Real LLM analysis of negative text |
| should analyze mixed feedback | Real LLM analysis of mixed text |
| should handle short/minimal feedback | Handle brief inputs |
| should summarize detailed feedback | Handle long inputs (max 3 bullets) |
| should handle neutral/vague feedback gracefully | Handle ambiguous inputs |
| skips integration tests when OPENROUTER_API_KEY is not set | Skip if no API key |

```bash
# Run integration tests (requires API key)
npm run test:integration
```

---

## Redis Data Structures

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `msg:{messageId}` | STRING | 5 min | Deduplication |
| `webhook:queue` | LIST | - | Pending events (FIFO) |
| `webhook:failed` | LIST | - | Failed events for retry |

## Test Mocking Strategy

| Module | Mock Approach |
|--------|---------------|
| `analyzer` | Mock OpenAI SDK `chat.completions.create` |
| `360dialog` | Mock axios `post` method |
| `queue` | Mock redis `set`, `lPush`, `brPop` |
| `worker` | Mock `dequeue`, `markFailed`, `analyzeFeedback`, `sendWhatsAppMessage` |
