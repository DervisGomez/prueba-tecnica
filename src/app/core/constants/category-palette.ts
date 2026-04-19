/** Color por defecto y paleta sugerida (hex 6). */
export const DEFAULT_CATEGORY_COLOR = '#2563eb';

export const CATEGORY_COLOR_PALETTE: readonly string[] = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0d9488',
  '#0891b2',
  '#4f46e5',
] as const;

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}
