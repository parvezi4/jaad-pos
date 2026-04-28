import { z } from 'zod';

const xenditEnvSchema = z.object({
  XENDIT_SECRET_KEY: z.string().min(1, 'XENDIT_SECRET_KEY is required'),
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: z.string().min(1, 'XENDIT_WEBHOOK_VERIFICATION_TOKEN is required'),
  XENDIT_API_BASE_URL: z.string().url().optional(),
});

export type XenditEnv = z.infer<typeof xenditEnvSchema>;

export function getXenditEnv(): XenditEnv {
  const parsed = xenditEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    throw new Error(`Invalid Xendit environment: ${message}`);
  }

  return parsed.data;
}
