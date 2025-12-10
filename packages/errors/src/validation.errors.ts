/**
 * Validation Errors
 * Generic validation errors for use across all services
 */

import { Data } from 'effect';

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
}> {}

export class SchemaValidationError extends Data.TaggedError('SchemaValidationError')<{
  readonly message: string;
  readonly errors: readonly unknown[];
}> {}
