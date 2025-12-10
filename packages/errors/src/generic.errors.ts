/**
 * Generic Errors
 * Generic errors for use across all services
 */

import { Data } from 'effect';

export class UnknownError extends Data.TaggedError('UnknownError')<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class NotImplementedError extends Data.TaggedError('NotImplementedError')<{
  readonly feature: string;
}> {}
