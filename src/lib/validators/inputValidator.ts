import { z } from 'zod';
import { ReportlyError } from '@/types/errors';

/**
 * Standard input validation helper.
 * @throws ReportlyError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ReportlyError(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Validation failed',
      'Invalid input provided.',
      400
    );
  }
  return result.data;
}

// ---- API Input Schemas ----

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Agency name must be at least 2 characters').max(100),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  logo_url: z.string().url().startsWith('https://').optional().nullable(),
}).strict();

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  report_emails: z.array(z.string().email('Invalid email address'))
    .max(5, 'Maximum 5 recipient emails allowed')
    .default([]),
  schedule_day: z.number().int().min(1).max(28, 'Schedule day must be between 1 and 28'),
  timezone: z.string().min(1, 'Timezone is required'),
});

export const updateClientSchema = createClientSchema.partial().strict();

export const triggerReportSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const reportApprovalSchema = z.object({
  editedNarrative: z.string().max(10_000, 'Narrative too long').optional(),
});

export const updateAgencySettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  logo_url: z.string().url().max(1000).optional().or(z.literal('')),
});

// ---- Utility validators ----

export const uuidSchema = z.string().uuid('Invalid ID format');

// Helper to validate and extract body
export async function validateBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch {
    return null;
  }
}
