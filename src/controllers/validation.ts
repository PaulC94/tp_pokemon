import { AppError } from '../AppError';

export function objectBody(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError('A JSON object is required', 400);
  }
  return value as Record<string, unknown>;
}

export function requiredName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError('name must be a non-empty string', 400);
  }
  return value.trim();
}

export function positiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(`${name} must be a positive integer`, 400);
  }
  return value;
}

export function pathId(value: string): number {
  const id = Number(value);
  return positiveInteger(id, 'id');
}
