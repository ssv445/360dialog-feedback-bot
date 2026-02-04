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

const SYSTEM_PROMPT = `You are a customer feedback analyst. Analyze feedback and identify sentiment, key points, and actions. Keep each point under 50 characters. Be concise.`;

const RESPONSE_SCHEMA = {
  name: 'feedback_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      sentiment: {
        type: 'string',
        enum: ['Positive', 'Negative', 'Mixed'],
        description: 'Overall sentiment of the feedback',
      },
      sentimentScore: {
        type: 'number',
        description: 'Positivity score from 0-100',
      },
      positivePoints: {
        type: 'array',
        items: { type: 'string', maxLength: 50 },
        maxItems: 3,
        description: 'Key positive points (max 3, each under 50 chars)',
      },
      negativePoints: {
        type: 'array',
        items: { type: 'string', maxLength: 50 },
        maxItems: 3,
        description: 'Key negative points (max 3, each under 50 chars)',
      },
      actionItems: {
        type: 'array',
        items: { type: 'string', maxLength: 80 },
        maxItems: 3,
        description: 'Recommended actions (max 3, each under 80 chars)',
      },
    },
    required: ['sentiment', 'sentimentScore', 'positivePoints', 'negativePoints', 'actionItems'],
    additionalProperties: false,
  },
};

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
      response_format: {
        type: 'json_schema',
        json_schema: RESPONSE_SCHEMA,
      },
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
