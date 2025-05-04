// src/types/paystack.types.ts
export interface PaystackTransferRecipient {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

export interface PaystackTransferRequest {
  source: string;
  amount: number;
  recipient: string;
  reason: string;
  reference: string;
}

export interface PaystackChargeEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
    };
  };
}

export interface PaystackTransferEvent {
  event: string;
  data: {
    amount: number;
    currency: string;
    domain: string;
    failures: null | {
      reason: string;
    };
    id: number;
    integration: number;
    recipient: {
      active: boolean;
      currency: string;
      description: string;
      domain: string;
      email: null | string;
      id: number;
      integration: number;
      metadata: null | any;
      name: string;
      recipient_code: string;
      type: string;
      is_deleted: boolean;
      details: {
        account_number: string;
        account_name: string;
        bank_code: string;
        bank_name: string;
      };
    };
    reason: string;
    reference: string;
    source: string;
    source_details: null | any;
    status: string;
    transfer_code: string;
    transferred_at: null | string;
    created_at: string;
    updated_at: string;
  };
}

export type PaystackWebhookEvent = PaystackChargeEvent | PaystackTransferEvent;

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
    };
  };
}

export interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

export interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}
