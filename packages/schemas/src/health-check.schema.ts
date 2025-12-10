/**
 * Health Check Schema
 * Generic health check schema for use across all services
 */

import { Schema } from '@effect/schema';

export const HealthCheckSchema = Schema.Struct({
  status: Schema.Literal('ok', 'degraded', 'error'),
  timestamp: Schema.DateTimeUtc,
  version: Schema.String,
  uptime: Schema.Number,
  services: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      status: Schema.Literal('ok', 'error'),
      message: Schema.optional(Schema.String),
    }),
  }),
});
export type HealthCheck = typeof HealthCheckSchema.Type;
