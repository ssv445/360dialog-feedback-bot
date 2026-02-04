export interface WebhookEvent {
  type: 'text' | 'status' | 'image' | 'audio' | 'document' | 'unknown';
  messageId: string;
  timestamp: number;
  from?: string;
  text?: string;
  mediaUrl?: string;
  mimeType?: string;
  caption?: string;
  recipientId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  raw: any;
}
