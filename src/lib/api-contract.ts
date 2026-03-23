import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReportlyError } from '@/types/errors';

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: ApiErrorBody;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function apiOk<T>(data: T, status = 200, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessEnvelope<T>>(
    { ok: true, data },
    {
      status,
      ...init,
    }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: Record<string, unknown>,
  init?: ResponseInit
) {
  return NextResponse.json<ApiErrorEnvelope>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      ...init,
    }
  );
}

export function fromUnknownError(error: unknown, fallbackMessage: string, init?: ResponseInit) {
  if (error instanceof ReportlyError) {
    return apiError(error.code, error.userMessage, error.statusCode, error.details, init);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return apiError('INTERNAL_ERROR', message || fallbackMessage, 500, undefined, init);
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ReportlyError('VALIDATION_ERROR', 'Invalid JSON body', 'Invalid request body', 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0]?.message ?? 'Invalid request body';
    throw new ReportlyError('VALIDATION_ERROR', firstIssue, 'Invalid request body', 400, {
      issues: result.error.issues,
    });
  }

  return result.data;
}
