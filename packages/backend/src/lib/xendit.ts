import { getXenditEnv } from './env';

interface CreateInvoiceInput {
  externalId: string;
  amount: number;
  description: string;
  customer?: {
    given_names?: string;
  };
  availablePaymentMethods?: string[];
  currency?: 'IDR';
  invoiceDuration?: number;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  invoice_url: string;
  expiry_date: string;
}

function buildAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export async function createXenditInvoice(input: CreateInvoiceInput): Promise<XenditInvoiceResponse> {
  const { XENDIT_SECRET_KEY, XENDIT_API_BASE_URL } = getXenditEnv();
  const baseUrl = XENDIT_API_BASE_URL || 'https://api.xendit.co';

  const response = await fetch(`${baseUrl}/v2/invoices`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(XENDIT_SECRET_KEY),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      description: input.description,
      customer: input.customer,
      currency: input.currency || 'IDR',
      invoice_duration: input.invoiceDuration || 1800,
      available_payment_methods: input.availablePaymentMethods,
    }),
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    const errorPayload = payload as { message?: string; error_code?: string };
    const message = errorPayload.message || errorPayload.error_code || 'Failed to create Xendit invoice';
    throw new Error(message);
  }

  return payload as XenditInvoiceResponse;
}
