/**
 * Schema Definitions using @effect/schema
 * Following Effect-TS best practices for runtime validation
 */

import { Schema } from '@effect/schema';

/**
 * Task Status
 */
export const TaskStatus = Schema.Literal('queued', 'running', 'completed', 'failed', 'cancelled');
export type TaskStatus = typeof TaskStatus.Type;

/**
 * Task Priority
 */
export const TaskPriority = Schema.Literal('low', 'normal', 'high', 'urgent');
export type TaskPriority = typeof TaskPriority.Type;

/**
 * Task Request Schema
 */
export const TaskRequestSchema = Schema.Struct({
  prompt: Schema.String.pipe(Schema.minLength(1)),
  userId: Schema.String.pipe(Schema.minLength(1)),
  sessionId: Schema.optional(Schema.String),
  priority: Schema.optional(TaskPriority),
  timeout: Schema.optional(Schema.Number.pipe(Schema.positive())),
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type TaskRequest = typeof TaskRequestSchema.Type;

/**
 * Task Response Schema
 */
export const TaskResponseSchema = Schema.Struct({
  taskId: Schema.String,
  sessionId: Schema.String,
  status: TaskStatus,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  completedAt: Schema.optional(Schema.DateTimeUtc),
  result: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
});
export type TaskResponse = typeof TaskResponseSchema.Type;

/**
 * Task State Schema (internal)
 */
export const TaskStateSchema = Schema.Struct({
  taskId: Schema.String,
  sessionId: Schema.String,
  userId: Schema.String,
  prompt: Schema.String,
  status: TaskStatus,
  priority: TaskPriority,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  result: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.Number),
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type TaskState = typeof TaskStateSchema.Type;

/**
 * Session Schema
 */
export const SessionSchema = Schema.Struct({
  sessionId: Schema.String,
  userId: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  expiresAt: Schema.DateTimeUtc,
  claudeSessionId: Schema.optional(Schema.String),
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type Session = typeof SessionSchema.Type;

/**
 * Session State Schema (internal)
 */
export const SessionStateSchema = Schema.Struct({
  sessionId: Schema.String,
  userId: Schema.String,
  createdAt: Schema.DateTimeUtc,
  lastAccessedAt: Schema.DateTimeUtc,
  expiresAt: Schema.DateTimeUtc,
  claudeSessionId: Schema.optional(Schema.String),
  taskCount: Schema.Number,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type SessionState = typeof SessionStateSchema.Type;

/**
 * Claude CLI Output Schema
 */
export const ClaudeOutputEventSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('start'),
    taskId: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('output'),
    content: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('tool_use'),
    toolName: Schema.String,
    toolInput: Schema.Unknown,
  }),
  Schema.Struct({
    type: Schema.Literal('tool_result'),
    toolName: Schema.String,
    toolOutput: Schema.Unknown,
  }),
  Schema.Struct({
    type: Schema.Literal('error'),
    message: Schema.String,
    code: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal('complete'),
    taskId: Schema.String,
    status: Schema.Literal('success', 'failure'),
  })
);
export type ClaudeOutputEvent = typeof ClaudeOutputEventSchema.Type;

/**
 * MCP Server Configuration Schema
 */
export const MCPServerTransport = Schema.Literal('http', 'stdio');
export type MCPServerTransport = typeof MCPServerTransport.Type;

export const MCPServerConfigSchema = Schema.Struct({
  name: Schema.String,
  transport: MCPServerTransport,
  url: Schema.optional(Schema.String),
  command: Schema.optional(Schema.String),
  args: Schema.optional(Schema.Array(Schema.String)),
  env: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean),
});
export type MCPServerConfig = typeof MCPServerConfigSchema.Type;

export const MCPConfigSchema = Schema.Struct({
  mcpServers: Schema.Record({ key: Schema.String, value: MCPServerConfigSchema }),
});
export type MCPConfig = typeof MCPConfigSchema.Type;

/**
 * Health Check Schema
 */
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

/**
 * API Error Response Schema
 */
export const ApiErrorResponseSchema = Schema.Struct({
  error: Schema.String,
  message: Schema.String,
  code: Schema.optional(Schema.String),
  details: Schema.optional(Schema.Unknown),
  timestamp: Schema.DateTimeUtc,
});
export type ApiErrorResponse = typeof ApiErrorResponseSchema.Type;

/**
 * Stream Event Schema (for SSE)
 */
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
