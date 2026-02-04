import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type { FeedbackAnalysis } from './analyzer';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

vi.mock('./env', () => ({
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_BASE_URL: 'https://test.api',
  LLM_MODEL: 'test-model',
  LLM_MAX_TOKENS: 500,
  LLM_TEMPERATURE: 0.3,
}));

import { analyzeFeedback, formatAnalysis } from './analyzer';

// Helper to create mock API response
function mockApiResponse(analysis: FeedbackAnalysis) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(analysis) } }],
  });
}

describe('formatAnalysis', () => {
  it('formats positive sentiment with all sections', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Positive',
      sentimentScore: 90,
      positivePoints: ['Great quality', 'Fast delivery'],
      negativePoints: [],
      actionItems: ['Keep it up', 'Expand product line'],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment: Positive (90% positive)');
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('• Great quality');
    expect(result).toContain('• Fast delivery');
    expect(result).not.toContain('⚠️ Negative:');
    expect(result).toContain('🎯 Action Items:');
  });

  it('formats negative sentiment with all sections', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Negative',
      sentimentScore: 10,
      positivePoints: [],
      negativePoints: ['Poor quality', 'Slow shipping', 'Bad support'],
      actionItems: ['Improve QC', 'Speed up delivery'],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('Sentiment: Negative (10% positive)');
    expect(result).not.toContain('✅ Positive:');
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('• Poor quality');
    expect(result).toContain('• Slow shipping');
    expect(result).toContain('• Bad support');
  });

  it('formats mixed sentiment with both positive and negative', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Mixed',
      sentimentScore: 50,
      positivePoints: ['Good design'],
      negativePoints: ['High price'],
      actionItems: ['Review pricing'],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('Sentiment: Mixed (50% positive)');
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('• Good design');
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('• High price');
  });

  it('handles zero sentiment score', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Negative',
      sentimentScore: 0,
      positivePoints: [],
      negativePoints: ['Everything was terrible'],
      actionItems: ['Major overhaul needed'],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('Sentiment: Negative (0% positive)');
  });

  it('handles 100% sentiment score', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Positive',
      sentimentScore: 100,
      positivePoints: ['Perfect experience'],
      negativePoints: [],
      actionItems: ['Maintain standards'],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('Sentiment: Positive (100% positive)');
  });

  it('omits action items section when empty', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Positive',
      sentimentScore: 80,
      positivePoints: ['Good'],
      negativePoints: [],
      actionItems: [],
    };

    const result = formatAnalysis(analysis);

    expect(result).not.toContain('🎯 Action Items:');
  });

  it('handles all empty arrays', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Mixed',
      sentimentScore: 50,
      positivePoints: [],
      negativePoints: [],
      actionItems: [],
    };

    const result = formatAnalysis(analysis);

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment: Mixed (50% positive)');
    expect(result).not.toContain('✅ Positive:');
    expect(result).not.toContain('⚠️ Negative:');
    expect(result).not.toContain('🎯 Action Items:');
  });

  it('handles max 3 items per section', () => {
    const analysis: FeedbackAnalysis = {
      sentiment: 'Mixed',
      sentimentScore: 60,
      positivePoints: ['Point 1', 'Point 2', 'Point 3'],
      negativePoints: ['Issue 1', 'Issue 2', 'Issue 3'],
      actionItems: ['Action 1', 'Action 2', 'Action 3'],
    };

    const result = formatAnalysis(analysis);
    const bullets = (result.match(/•/g) || []).length;

    expect(bullets).toBe(9); // 3 + 3 + 3
  });
});

describe('analyzeFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses JSON response and formats output', async () => {
    mockApiResponse({
      sentiment: 'Positive',
      sentimentScore: 85,
      positivePoints: ['Great quality', 'Fast shipping'],
      negativePoints: [],
      actionItems: ['Keep up the good work'],
    });

    const result = await analyzeFeedback('Great product!');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment: Positive (85% positive)');
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('• Great quality');
    expect(result).not.toContain('⚠️ Negative:');
  });

  it('handles negative feedback correctly', async () => {
    mockApiResponse({
      sentiment: 'Negative',
      sentimentScore: 5,
      positivePoints: [],
      negativePoints: ['Broken on arrival', 'No refund offered'],
      actionItems: ['Improve packaging', 'Review refund policy'],
    });

    const result = await analyzeFeedback('Terrible experience');

    expect(result).toContain('Sentiment: Negative (5% positive)');
    expect(result).not.toContain('✅ Positive:');
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('• Broken on arrival');
  });

  it('handles mixed feedback with both sections', async () => {
    mockApiResponse({
      sentiment: 'Mixed',
      sentimentScore: 50,
      positivePoints: ['Good design'],
      negativePoints: ['Slow delivery', 'Poor packaging'],
      actionItems: ['Improve shipping'],
    });

    const result = await analyzeFeedback('Mixed feedback');

    expect(result).toContain('Sentiment: Mixed (50% positive)');
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('• Slow delivery');
  });

  it('throws on empty response', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: null } }] });

    await expect(analyzeFeedback('Some feedback')).rejects.toThrow('Empty response from API');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('throws on empty choices array', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });

    await expect(analyzeFeedback('Some feedback')).rejects.toThrow('Empty response from API');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('throws on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit'));

    await expect(analyzeFeedback('Test feedback')).rejects.toThrow('API rate limit');
  });

  it('throws on invalid JSON response', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'not valid json' } }] });

    await expect(analyzeFeedback('Test feedback')).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('calls API with correct parameters', async () => {
    mockApiResponse({
      sentiment: 'Positive',
      sentimentScore: 100,
      positivePoints: ['Great'],
      negativePoints: [],
      actionItems: ['Continue'],
    });

    await analyzeFeedback('Test message');

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'test-model',
      messages: [
        { role: 'system', content: expect.stringContaining('feedback analyst') },
        { role: 'user', content: 'Test message' },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: {
        type: 'json_schema',
        json_schema: expect.objectContaining({
          name: 'feedback_analysis',
          strict: true,
          schema: expect.objectContaining({
            type: 'object',
            required: ['sentiment', 'sentimentScore', 'positivePoints', 'negativePoints', 'actionItems'],
          }),
        }),
      },
    });
  });

  it('handles special characters in feedback points', async () => {
    mockApiResponse({
      sentiment: 'Mixed',
      sentimentScore: 60,
      positivePoints: ['Great "quality" & value'],
      negativePoints: ['Shipping was <slow>'],
      actionItems: ['Fix the "issues"'],
    });

    const result = await analyzeFeedback('Feedback with special chars');

    expect(result).toContain('• Great "quality" & value');
    expect(result).toContain('• Shipping was <slow>');
  });

  it('handles unicode/emoji in feedback points', async () => {
    mockApiResponse({
      sentiment: 'Positive',
      sentimentScore: 95,
      positivePoints: ['Love it! 💕', 'Très bien'],
      negativePoints: [],
      actionItems: ['Keep going 🚀'],
    });

    const result = await analyzeFeedback('Great! 🎉');

    expect(result).toContain('• Love it! 💕');
    expect(result).toContain('• Très bien');
  });
});
