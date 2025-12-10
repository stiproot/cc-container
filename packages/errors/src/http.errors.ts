/**
 * HTTP/API Errors
 * Generic HTTP errors for use across all services
 */

import { Data } from 'effect';

export class HttpError extends Data.TaggedError('HttpError')<{
  readonly statusCode: number;
  readonly message: string;
  readonly url?: string;
}> {}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  readonly message: string;
}> {}

export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{
  readonly message: string;
  readonly resource?: string;
}> {}
