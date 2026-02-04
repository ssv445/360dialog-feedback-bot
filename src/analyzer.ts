import OpenAI from 'openai';
import { OPENROUTER_API_KEY, OPENROUTER_BASE_URL, LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE } from './env';

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
});

export interface FeedbackAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Mixed';
  sentimentScore: number;
  positivePoints: string[];
  negativePoints: string[];
  actionItems: string[];
}

const SYSTEM_PROMPT = `You are a customer feedback analyst. Analyze the feedback and return a JSON object with this exact structure:

{
  "sentiment": "Positive" | "Negative" | "Mixed",
  "sentimentScore": <number 0-100 representing positive percentage>,
  "positivePoints": ["point1", "point2", ...],
  "negativePoints": ["point1", "point2", ...],
  "actionItems": ["action1", "action2", ...]
}

Rules:
- sentiment: "Positive" if mostly good, "Negative" if mostly bad, "Mixed" if both
- sentimentScore: 0-100 where 100 is fully positive
- positivePoints: max 3 items, empty array if none
- negativePoints: max 3 items, empty array if none
- actionItems: 2-3 actionable recommendations

Return ONLY valid JSON, no other text.`;

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
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return 'Unable to analyze feedback.';
    }

    const analysis: FeedbackAnalysis = JSON.parse(content);
    return formatAnalysis(analysis);
  } catch (error) {
    console.error('LLM API error:', error);
    throw new Error('Failed to analyze feedback. Please try again.');
  }
}

export function formatAnalysis(analysis: FeedbackAnalysis): string {
  const lines: string[] = [
    '📊 Feedback Analysis',
    '',
    `Sentiment: ${analysis.sentiment} (${analysis.sentimentScore}% positive)`,
  ];

  if (analysis.positivePoints.length > 0) {
    lines.push('', '✅ Positive:');
    analysis.positivePoints.forEach((point) => lines.push(`• ${point}`));
  }

  if (analysis.negativePoints.length > 0) {
    lines.push('', '⚠️ Negative:');
    analysis.negativePoints.forEach((point) => lines.push(`• ${point}`));
  }

  if (analysis.actionItems.length > 0) {
    lines.push('', '🎯 Action Items:');
    analysis.actionItems.forEach((item) => lines.push(`• ${item}`));
  }

  return lines.join('\n');
}
