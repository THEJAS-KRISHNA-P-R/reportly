import DOMPurify from 'isomorphic-dompurify';
import isEmail from 'validator/lib/isEmail';

/**
 * Strip ALL HTML from text.
 * Used for narrative text before it goes to PDF or email.
 */
export function sanitizeText(input: string, maxLength = 10_000): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // strip control chars
}

/**
 * Allow limited markdown-like formatting for report narratives.
 * Allows: p, strong, em, ul, li, br only.
 */
export function sanitizeNarrative(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'li', 'br'],
    ALLOWED_ATTR: [],
  }).slice(0, 10_000);
}

/**
 * Generate a safe, system-controlled PDF filename.
 * Never allows user input to touch filenames.
 */
export function safePdfFilename(reportId: string, period: string): string {
  const safeId = reportId.replace(/[^a-z0-9-]/gi, '');
  const safePeriod = period.replace(/[^0-9-]/g, '');
  return `report_${safeId}_${safePeriod}.pdf`;
}

/**
 * Validate that a string is a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return isEmail(email);
}

/**
 * Sanitize a string for safe embedding in AI prompts.
 * Removes characters that could be used for prompt injection.
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
  return sanitizeText(input, maxLength)
    .replace(/[<>{}[\]]/g, '') // remove prompt-injection characters
    .trim();
}
