import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeFeedback } from './analyzer';

// Sample feedback messages covering all sentiment scenarios
const samples = {
  positive:
    "Your product is amazing! The delivery was super fast, customer support was incredibly helpful, and the quality exceeded my expectations. Will definitely buy again!",

  negative:
    "Terrible experience. Product arrived damaged, took 3 weeks to ship, and customer service never responded to my emails. Complete waste of money.",

  mixed:
    "The product quality is excellent and I love the design. However, shipping took way too long and the packaging was poor. The item was slightly scratched on arrival.",

  short: "Good product, fast shipping.",

  detailed:
    "I've been using your software for 6 months now. The UI is intuitive and the features are powerful. However, the mobile app crashes frequently, sync is slow, and the pricing tiers are confusing. Support team was responsive but couldn't solve my sync issues. Documentation is outdated. Despite these issues, the core functionality is solid and has improved my workflow significantly.",

  neutral: "Received the item. It works as described.",
};

// Skip all tests if no API key
const hasApiKey = !!process.env.OPENROUTER_API_KEY;

describe.skipIf(!hasApiKey)('Feedback Analyzer Integration Tests', () => {
  beforeAll(() => {
    console.log('\n🧪 Running integration tests with real API calls...\n');
  });

  // Retry flaky external API tests up to 2 times
  const retryCount = 2;

  it('should analyze purely positive feedback', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (positive):', samples.positive);
    const result = await analyzeFeedback(samples.positive);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    expect(result).toMatch(/Positive.*\d+%/i);
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('🎯 Action Items:');
  });

  it('should analyze purely negative feedback', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (negative):', samples.negative);
    const result = await analyzeFeedback(samples.negative);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    expect(result).toMatch(/Negative.*\d+%/i);
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('🎯 Action Items:');
  });

  it('should analyze mixed feedback', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (mixed):', samples.mixed);
    const result = await analyzeFeedback(samples.mixed);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    expect(result).toMatch(/Mixed.*\d+%/i);
    expect(result).toContain('✅ Positive:');
    expect(result).toContain('⚠️ Negative:');
    expect(result).toContain('🎯 Action Items:');
  });

  it('should handle short/minimal feedback', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (short):', samples.short);
    const result = await analyzeFeedback(samples.short);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    expect(result).toContain('🎯 Action Items:');
  });

  it('should summarize detailed feedback (max 3 bullets per section)', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (detailed):', samples.detailed);
    const result = await analyzeFeedback(samples.detailed);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    expect(result).toContain('🎯 Action Items:');

    // Count bullets in each section (should be max 3)
    const positiveSection = result.match(/✅ Positive:[\s\S]*?(?=⚠️|🎯|$)/)?.[0] || '';
    const negativeSection = result.match(/⚠️ Negative:[\s\S]*?(?=🎯|$)/)?.[0] || '';

    const positiveBullets = (positiveSection.match(/•/g) || []).length;
    const negativeBullets = (negativeSection.match(/•/g) || []).length;

    expect(positiveBullets).toBeLessThanOrEqual(3);
    expect(negativeBullets).toBeLessThanOrEqual(3);
  });

  it('should handle neutral/vague feedback gracefully', { timeout: 45000, retry: retryCount }, async () => {
    console.log('📝 Input (neutral):', samples.neutral);
    const result = await analyzeFeedback(samples.neutral);
    console.log('📊 Output:\n', result, '\n');

    expect(result).toContain('📊 Feedback Analysis');
    expect(result).toContain('Sentiment:');
    // Neutral feedback should still produce a valid response
    expect(result.length).toBeGreaterThan(50);
  });
});

// Separate describe block for skipped message
describe.runIf(!hasApiKey)('Feedback Analyzer Integration Tests (skipped)', () => {
  it('skips integration tests when OPENROUTER_API_KEY is not set', () => {
    console.log(
      '⚠️  OPENROUTER_API_KEY not found. Skipping integration tests.\n' +
        '   Set the env var to run real API tests.'
    );
    expect(true).toBe(true);
  });
});
