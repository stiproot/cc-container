# @cc/schemas

Generic schema definitions for all services in the cc-container workspace.

## Overview

This package provides reusable schema definitions using `@effect/schema` for runtime validation and type inference.

## Installation

This package is part of the cc-container workspace and should be referenced as a workspace dependency:

```json
{
  "dependencies": {
    "@cc/schemas": "workspace:*"
  }
}
```

## Schemas

### Health Check Schema

```typescript
import { HealthCheckSchema, type HealthCheck } from '@cc/schemas';
import { Effect } from 'effect';
import { Schema } from '@effect/schema';

const healthCheck: HealthCheck = {
  status: 'ok',
  timestamp: new Date(),
  version: '1.0.0',
  uptime: 3600000,
  services: {
    database: { status: 'ok' },
    cache: { status: 'ok', message: 'Redis connected' }
  }
};

// Validate and decode
const validateHealthCheck = Schema.decodeUnknown(HealthCheckSchema);
```

### API Error Response Schema

```typescript
import { ApiErrorResponseSchema, type ApiErrorResponse } from '@cc/schemas';

const errorResponse: ApiErrorResponse = {
  error: 'ValidationError',
  message: 'Invalid request parameters',
  code: 'VAL_001',
  details: { field: 'email', reason: 'Invalid format' },
  timestamp: new Date()
};

// Use in API handlers
const encodeError = Schema.encode(ApiErrorResponseSchema);
```

### Stream Event Schema

For Server-Sent Events (SSE) or WebSocket communication:

```typescript
import { StreamEventSchema, type StreamEvent } from '@cc/schemas';

// Different event types
const events: StreamEvent[] = [
  { type: 'connected', taskId: 'task-123' },
  { type: 'progress', taskId: 'task-123', message: 'Processing...' },
  { type: 'output', taskId: 'task-123', content: 'Result data' },
  { type: 'completed', taskId: 'task-123', result: 'Success' },
  { type: 'error', taskId: 'task-123', error: 'Failed' }
];

// Validate event stream
const validateEvent = Schema.decodeUnknown(StreamEventSchema);
```

## Usage Patterns

### Validation

```typescript
import { Effect } from 'effect';
import { Schema } from '@effect/schema';
import { HealthCheckSchema } from '@cc/schemas';

const validateAndParse = (data: unknown) =>
  Effect.gen(function* () {
    const healthCheck = yield* Schema.decodeUnknown(HealthCheckSchema)(data);
    return healthCheck;
  });
```

### Encoding

```typescript
import { Schema } from '@effect/schema';
import { ApiErrorResponseSchema } from '@cc/schemas';

const encodeResponse = (error: ApiErrorResponse) =>
  Schema.encode(ApiErrorResponseSchema)(error);
```

### Type Inference

```typescript
import { type HealthCheck } from '@cc/schemas';

// Type is automatically inferred from schema
function logHealth(health: HealthCheck) {
  console.log(`Status: ${health.status}, Version: ${health.version}`);
}
```

## Schema Features

- **Runtime validation**: Validate data at runtime with detailed error messages
- **Type inference**: TypeScript types automatically derived from schemas
- **Encoding/Decoding**: Transform between different representations
- **Composability**: Combine schemas to create complex types
- **Documentation**: Self-documenting through schema structure

## Design Principles

- **Generic**: Schemas are domain-agnostic and reusable
- **Effect-native**: Designed for use with Effect-TS ecosystem
- **Type-safe**: Full TypeScript support with inference
- **Validating**: Runtime validation prevents invalid data
