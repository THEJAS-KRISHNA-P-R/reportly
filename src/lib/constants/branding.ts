export const LAYOUT_MAP = {
  standard: 'classic',
  compact: 'modern',
  executive: 'minimal',
} as const;

export const REVERSE_LAYOUT_MAP = {
  classic: 'standard',
  modern: 'compact',
  minimal: 'executive',
} as const;

export type FrontendLayout = keyof typeof LAYOUT_MAP;
export type DbLayout = keyof typeof REVERSE_LAYOUT_MAP;
