/**
 * API Error Response Schema
 * Generic API error response schema for use across all services
 */

import { Schema } from '@effect/schema';

export const ApiErrorResponseSchema = Schema.Struct({
  error: Schema.String,
  message: Schema.String,
  code: Schema.optional(Schema.String),
  details: Schema.optional(Schema.Unknown),
  timestamp: Schema.DateTimeUtc,
});
export type ApiErrorResponse = typeof ApiErrorResponseSchema.Type;
