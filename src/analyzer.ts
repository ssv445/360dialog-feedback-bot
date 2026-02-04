import OpenAI from 'openai';
import { OPENROUTER_API_KEY, OPENROUTER_BASE_URL, LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE } from './env';

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
});

const SYSTEM_PROMPT = `You are a customer feedback analyst. Analyze the feedback and provide:

1. Overall sentiment (Positive/Negative/Mixed) with a percentage
2. Key positive points (if any)
3. Key negative points (if any)
4. 2-3 actionable recommendations

Format your response EXACTLY like this (use these exact emojis and structure):

📊 Feedback Analysis

Sentiment: [Positive/Negative/Mixed] ([X]% positive)

✅ Positive:
• [point 1]
• [point 2]

⚠️ Negative:
• [point 1]
• [point 2]

🎯 Action Items:
• [action 1]
• [action 2]

If there are no positive or negative points, omit that section entirely.
Keep it concise - max 3 bullets per section.`;

export async function analyzeFeedback(feedback: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: feedback },
      ],
      max_tokens: LLM_MAX_TOKENS,
      temperature: LLM_TEMPERATURE,
    });

    return response.choices[0]?.message?.content || 'Unable to analyze feedback.';
  } catch (error) {
    console.error('LLM API error:', error);
    throw new Error('Failed to analyze feedback. Please try again.');
  }
}
