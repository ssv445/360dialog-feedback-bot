import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock env module - will be overridden per test as needed
const mockEnv = vi.hoisted(() => ({
  DIALOG_API_KEY: 'test-api-key',
  DIALOG_API_URL: 'https://test.360dialog.io/v1/messages',
}));

vi.mock('./env', () => mockEnv);

import { sendWhatsAppMessage } from './360dialog';

describe('sendWhatsAppMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env mocks to defaults
    mockEnv.DIALOG_API_KEY = 'test-api-key';
    mockEnv.DIALOG_API_URL = 'https://test.360dialog.io/v1/messages';
  });

  it('sends message with correct parameters', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    await sendWhatsAppMessage({ to: '1234567890', text: 'Hello!' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://test.360dialog.io/v1/messages',
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
        text: { body: 'Hello!' },
      },
      {
        headers: {
          'D360-API-KEY': 'test-api-key',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('sends message with long text content', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
    const longText = '📊 Feedback Analysis\n\nSentiment: Positive (85% positive)\n\n✅ Positive:\n• Great quality\n• Fast shipping';

    await sendWhatsAppMessage({ to: '1234567890', text: longText });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        text: { body: longText },
      }),
      expect.any(Object)
    );
  });

  it('sends message with unicode and emojis', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    await sendWhatsAppMessage({ to: '1234567890', text: 'Très bien! 🎉💕' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        text: { body: 'Très bien! 🎉💕' },
      }),
      expect.any(Object)
    );
  });

  it('handles international phone numbers', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    await sendWhatsAppMessage({ to: '+491234567890', text: 'Test' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        to: '+491234567890',
      }),
      expect.any(Object)
    );
  });

  it('throws error when DIALOG_API_KEY is not configured', async () => {
    mockEnv.DIALOG_API_KEY = '';

    await expect(sendWhatsAppMessage({ to: '123', text: 'Test' })).rejects.toThrow(
      'DIALOG_API_KEY is not configured'
    );

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('throws error on axios network error', async () => {
    const networkError = new Error('Network Error') as AxiosError;
    networkError.isAxiosError = true;
    networkError.message = 'Network Error';
    mockedAxios.post.mockRejectedValueOnce(networkError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    await expect(sendWhatsAppMessage({ to: '123', text: 'Test' })).rejects.toThrow(
      'Failed to send WhatsApp message'
    );
  });

  it('throws error on API error response', async () => {
    const apiError = new Error('Request failed') as AxiosError;
    apiError.isAxiosError = true;
    apiError.response = {
      data: { error: 'Invalid phone number' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    };
    mockedAxios.post.mockRejectedValueOnce(apiError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    await expect(sendWhatsAppMessage({ to: 'invalid', text: 'Test' })).rejects.toThrow(
      'Failed to send WhatsApp message'
    );
  });

  it('throws error on non-axios error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Unknown error'));
    mockedAxios.isAxiosError.mockReturnValueOnce(false);

    await expect(sendWhatsAppMessage({ to: '123', text: 'Test' })).rejects.toThrow(
      'Failed to send WhatsApp message'
    );
  });

  it('logs success message after sending', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    await sendWhatsAppMessage({ to: '1234567890', text: 'Hello!' });

    expect(consoleSpy).toHaveBeenCalledWith('Message sent to 1234567890');
    consoleSpy.mockRestore();
  });

  it('logs axios error details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const apiError = new Error('Request failed') as AxiosError;
    apiError.isAxiosError = true;
    apiError.response = {
      data: { error: 'Rate limit exceeded' },
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: {} as any,
    };
    mockedAxios.post.mockRejectedValueOnce(apiError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    await expect(sendWhatsAppMessage({ to: '123', text: 'Test' })).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      '360dialog API error:',
      { error: 'Rate limit exceeded' }
    );
    consoleSpy.mockRestore();
  });

  it('logs non-axios error details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unknownError = new Error('Something went wrong');
    mockedAxios.post.mockRejectedValueOnce(unknownError);
    mockedAxios.isAxiosError.mockReturnValueOnce(false);

    await expect(sendWhatsAppMessage({ to: '123', text: 'Test' })).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', unknownError);
    consoleSpy.mockRestore();
  });

  it('uses correct API URL from env', async () => {
    mockEnv.DIALOG_API_URL = 'https://custom.api.url/messages';
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    await sendWhatsAppMessage({ to: '123', text: 'Test' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://custom.api.url/messages',
      expect.any(Object),
      expect.any(Object)
    );
  });
});
