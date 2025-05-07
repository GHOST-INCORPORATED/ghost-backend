// src/types/zeptomail.d.ts

declare module "zeptomail" {
  export interface SendMailClientOptions {
    url: string;
    token: string;
  }

  export interface EmailAddress {
    address: string;
    name?: string;
  }

  export interface EmailRecipient {
    email_address: EmailAddress;
    merge_info?: Record<string, any>;
  }

  export interface Attachment {
    content?: string;
    mime_type?: string;
    name: string;
    file_cache_key?: string;
  }

  export interface InlineImage {
    content?: string;
    mime_type?: string;
    cid: string;
    file_cache_key?: string;
  }

  export interface SendMailOptions {
    from: EmailAddress;
    to: EmailRecipient[];
    reply_to?: EmailAddress[];
    subject: string;
    textbody?: string;
    htmlbody?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: Record<string, string>;
    attachments?: Attachment[];
    inline_images?: InlineImage[];
    [key: string]: any;
  }

  export interface SendBatchMailOptions {
    from: EmailAddress;
    to: EmailRecipient[];
    reply_to?: EmailAddress[];
    subject: string;
    textbody?: string;
    htmlbody?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: Record<string, string>;
    attachments?: Attachment[];
    inline_images?: InlineImage[];
    [key: string]: any;
  }

  export interface SendMailWithTemplateOptions {
    template_key?: string;
    template_alias?: string;
    from: EmailAddress;
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    merge_info?: Record<string, any>;
    reply_to?: EmailAddress[];
    client_reference?: string;
    mime_headers?: Record<string, string>;
    [key: string]: any;
  }

  export interface MailBatchWithTemplateOptions {
    template_key?: string;
    template_alias?: string;
    from: EmailAddress;
    to: EmailRecipient[];
    reply_to?: EmailAddress[];
    client_reference?: string;
    mime_headers?: Record<string, string>;
    [key: string]: any;
  }

  export interface SendMailResponse {
    request_id?: string;
    message?: string;
    [key: string]: any;
  }

  export class SendMailClient {
    constructor(options: SendMailClientOptions);

    sendMail(options: SendMailOptions): Promise<SendMailResponse>;
    sendBatchMail(options: SendBatchMailOptions): Promise<SendMailResponse>;
    sendMailWithTemplate(
      options: SendMailWithTemplateOptions
    ): Promise<SendMailResponse>;
    mailBatchWithTemplate(
      options: MailBatchWithTemplateOptions
    ): Promise<SendMailResponse>;
  }
}
