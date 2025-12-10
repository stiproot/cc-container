# @cc/errors

Generic error types for all services in the cc-container workspace.

## Overview

This package provides reusable, type-safe error definitions following Effect-TS best practices using `Data.TaggedError`.

## Installation

This package is part of the cc-container workspace and should be referenced as a workspace dependency:

```json
{
  "dependencies": {
    "@cc/errors": "workspace:*"
  }
}
```

## Error Types

### Validation Errors

```typescript
import { ValidationError, SchemaValidationError } from '@cc/errors';

// Simple validation error
new ValidationError({
  message: 'Invalid email format',
  field: 'email',
  value: 'invalid@'
});

// Schema validation with multiple errors
new SchemaValidationError({
  message: 'Request validation failed',
  errors: [/* validation errors */]
});
```

### HTTP/API Errors

```typescript
import { HttpError, UnauthorizedError, ForbiddenError } from '@cc/errors';

// Generic HTTP error
new HttpError({
  statusCode: 500,
  message: 'Internal server error',
  url: '/api/users'
});

// Unauthorized access
new UnauthorizedError({
  message: 'API key is invalid'
});

// Forbidden resource
new ForbiddenError({
  message: 'Insufficient permissions',
  resource: '/admin/users'
});
```

### File System Errors

```typescript
import { FileNotFoundError, FileReadError, FileWriteError } from '@cc/errors';

// File not found
new FileNotFoundError({
  path: '/config/app.json'
});

// Read error
new FileReadError({
  path: '/data/users.db',
  cause: error
});

// Write error
new FileWriteError({
  path: '/logs/app.log',
  cause: error
});
```

### Generic Errors

```typescript
import { UnknownError, NotImplementedError } from '@cc/errors';

// Unknown error wrapper
new UnknownError({
  message: 'Unexpected error occurred',
  cause: originalError
});

// Feature not implemented
new NotImplementedError({
  feature: 'OAuth authentication'
});
```

## Usage with Effect

```typescript
import { Effect } from 'effect';
import { ValidationError } from '@cc/errors';

const validateEmail = (email: string): Effect.Effect<string, ValidationError> =>
  Effect.gen(function* () {
    if (!email.includes('@')) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Invalid email format',
          field: 'email',
          value: email
        })
      );
    }
    return email;
  });
```

## Tagged Error Benefits

- **Type-safe error handling**: Discriminated unions allow precise error matching
- **Pattern matching**: Use Effect's error matching capabilities
- **Serializable**: All errors can be serialized to JSON
- **Stack traces**: Automatic stack trace capture

## Design Principles

- **Generic**: Errors are domain-agnostic and reusable across services
- **Structured**: All errors have consistent, typed properties
- **Effect-first**: Designed to work seamlessly with Effect-TS patterns
- **Composable**: Can be combined with domain-specific errors
