/**
 * Stream Event Schema (for SSE)
 * Generic stream event schema for use across all services
 */

import { Schema } from '@effect/schema';

export const StreamEventSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('connected'),
    taskId: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('progress'),
    taskId: Schema.String,
    message: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('output'),
    taskId: Schema.String,
    content: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('completed'),
    taskId: Schema.String,
    result: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('error'),
    taskId: Schema.String,
    error: Schema.String,
  })
);
export type StreamEvent = typeof StreamEventSchema.Type;
