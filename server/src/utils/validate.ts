export interface FieldError {
  field: string;
  message: string;
}

// Check all required fields are present and non-empty
export function requireFields(body: Record<string, any>, fields: string[]): FieldError[] {
  return fields
    .filter(f => body[f] === undefined || body[f] === null || String(body[f]).trim() === '')
    .map(f => ({ field: f, message: `${f} is required` }));
}

// Check value is one of the allowed options (skips check if value is absent)
export function requireEnum(field: string, value: any, allowed: readonly string[]): FieldError | null {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(String(value))) {
    return { field, message: `${field} must be one of: ${allowed.join(', ')}` };
  }
  return null;
}

// Check numeric value is within an inclusive range (skips check if value is absent)
export function requireRange(field: string, value: any, min: number, max: number): FieldError | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return { field, message: `${field} must be a number between ${min} and ${max}` };
  }
  return null;
}

// Check value is a valid parseable date string (skips check if value is absent)
export function requireDate(field: string, value: any): FieldError | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return { field, message: `${field} must be a valid date (e.g. 2025-12-31)` };
  }
  return null;
}

// Check email format (skips check if value is absent)
export function requireEmail(field: string, value: any): FieldError | null {
  if (!value) return null;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(String(value))) {
    return { field, message: `${field} must be a valid email address` };
  }
  return null;
}

// Check email belongs to a specific domain (skips check if value is absent)
export function requireEmailDomain(field: string, value: any, domain: string): FieldError | null {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  if (!normalized.endsWith(`@${domain.toLowerCase()}`)) {
    return { field, message: `${field} must be a valid @${domain} email address` };
  }
  return null;
}

// Check string length is within bounds (skips check if value is absent)
export function requireLength(field: string, value: any, min: number, max: number): FieldError | null {
  if (!value) return null;
  const len = String(value).trim().length;
  if (len < min || len > max) {
    return { field, message: `${field} must be between ${min} and ${max} characters` };
  }
  return null;
}

// Merge all error sources into one flat array
export function collectErrors(...sources: (FieldError | FieldError[] | null | undefined)[]): FieldError[] {
  return sources
    .flat()
    .filter((e): e is FieldError => e !== null && e !== undefined);
}
