// src/types/email.types.ts

export interface EmailRecipient {
  email: string;
  name?: string;
  mergeInfo?: Record<string, any>;
}

export interface EmailAttachment {
  content: string; // Base64 encoded file content
  mimeType: string;
  name: string;
}

export interface EmailSendRequest {
  headers: {};
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  trackClicks?: boolean;
  trackOpens?: boolean;
}

export interface TemplateEmailSendRequest {
  to: EmailRecipient | EmailRecipient[];
  templateKey?: string;
  templateAlias?: string;
  mergeInfo?: Record<string, any>;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
}

export interface EmailSendResponse {
  request_id?: string;
  message?: string;
  [key: string]: any;
}
