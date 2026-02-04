import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { analyzeFeedback } from './analyzer';

describe('analyzeFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns LLM response content', async () => {
    const expectedAnalysis = '📊 Feedback Analysis\n\nSentiment: Positive (85%)';
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: expectedAnalysis } }],
    });

    const result = await analyzeFeedback('Great product!');

    expect(result).toBe(expectedAnalysis);
  });

  it('returns fallback on empty response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await analyzeFeedback('Some feedback');

    expect(result).toBe('Unable to analyze feedback.');
  });

  it('throws on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit'));

    await expect(analyzeFeedback('Test feedback')).rejects.toThrow(
      'Failed to analyze feedback. Please try again.'
    );
  });
});
