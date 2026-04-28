import { z } from 'zod';

const SUPPORTED_CURRENCIES = ['IDR', 'PHP', 'THB', 'VND', 'MYR', 'USD'] as const;
type XenditCurrency = typeof SUPPORTED_CURRENCIES[number];

const xenditEnvSchema = z.object({
  XENDIT_SECRET_KEY: z.string().min(1, 'XENDIT_SECRET_KEY is required'),
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: z.string().min(1, 'XENDIT_WEBHOOK_VERIFICATION_TOKEN is required'),
  XENDIT_API_BASE_URL: z.string().url().optional(),
  XENDIT_INVOICE_CURRENCY: z
    .enum(SUPPORTED_CURRENCIES)
    .optional()
    .default('IDR'),
});

export type { XenditCurrency };

export type XenditEnv = z.infer<typeof xenditEnvSchema>;

export function getXenditEnv(): XenditEnv {
  const parsed = xenditEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    throw new Error(`Invalid Xendit environment: ${message}`);
  }

  return parsed.data;
}
