# @cc/config

Configuration utilities and helpers for all services in the cc-container workspace.

## Overview

This package provides utilities for managing configuration from environment variables following Effect-TS best practices.

## Installation

This package is part of the cc-container workspace and should be referenced as a workspace dependency:

```json
{
  "dependencies": {
    "@cc/config": "workspace:*"
  }
}
```

## Environment Variable Validators

### parsePort

Parse and validate a port number:

```typescript
import { parsePort } from '@cc/config';
import { Effect } from 'effect';

const getPort = Effect.gen(function* () {
  const port = yield* parsePort('PORT', 3000);
  console.log(`Server will run on port ${port}`);
  return port;
});
```

### parsePositiveInt

Parse and validate a positive integer:

```typescript
import { parsePositiveInt } from '@cc/config';

const getMaxConnections = Effect.gen(function* () {
  const max = yield* parsePositiveInt('MAX_CONNECTIONS', 100);
  return max;
});
```

### requireEnvVar

Require an environment variable to be present:

```typescript
import { requireEnvVar } from '@cc/config';

const getApiKey = Effect.gen(function* () {
  const apiKey = yield* requireEnvVar('API_KEY');
  return apiKey;
});
```

### getEnvVar

Get an environment variable with a default:

```typescript
import { getEnvVar } from '@cc/config';

const getHost = Effect.gen(function* () {
  const host = yield* getEnvVar('HOST', '0.0.0.0');
  return host;
});
```

### parseBoolean

Parse a boolean from environment variable:

```typescript
import { parseBoolean } from '@cc/config';

const isDebugEnabled = Effect.gen(function* () {
  const debug = yield* parseBoolean('DEBUG', false);
  return debug;
});
```

## Base Configuration

### Common Configuration Functions

```typescript
import { getNodeEnv, isProduction, isDevelopment, getLogLevel } from '@cc/config';

const checkEnvironment = Effect.gen(function* () {
  const env = yield* getNodeEnv();
  const prod = yield* isProduction();
  const dev = yield* isDevelopment();
  const logLevel = yield* getLogLevel();

  console.log(`Environment: ${env}`);
  console.log(`Production: ${prod}`);
  console.log(`Development: ${dev}`);
  console.log(`Log level: ${logLevel}`);
});
```

## Configuration Types

```typescript
import type { LogLevel, Environment, BaseConfig } from '@cc/config';

const config: BaseConfig = {
  nodeEnv: 'production',
  logLevel: 'info',
  isProduction: true
};
```

## Complete Example

```typescript
import { Effect, Layer } from 'effect';
import { parsePort, requireEnvVar, getLogLevel } from '@cc/config';
import { ValidationError } from '@cc/errors';

class MyConfigService extends Effect.Service<MyConfigService>()('MyConfigService', {
  effect: Effect.gen(function* () {
    // Validate required variables
    const apiKey = yield* requireEnvVar('API_KEY');
    const dbUrl = yield* requireEnvVar('DATABASE_URL');

    // Parse optional variables with defaults
    const port = yield* parsePort('PORT', 8080);
    const logLevel = yield* getLogLevel();

    return {
      apiKey,
      dbUrl,
      port,
      logLevel,

      validate: () => Effect.gen(function* () {
        if (port < 1024 && !isProduction()) {
          return yield* Effect.fail(
            new ValidationError({
              message: 'Privileged ports require production mode',
              field: 'PORT',
              value: port
            })
          );
        }
      })
    };
  })
}) {}

// Use in your application
const program = Effect.gen(function* () {
  const config = yield* MyConfigService;
  yield* config.validate();
  console.log(`Starting server on port ${config.port}`);
});
```

## Design Principles

- **Type-safe**: All functions return typed Effects
- **Validating**: Invalid values result in descriptive errors
- **Effect-native**: Designed for Effect-TS ecosystem
- **Composable**: Functions can be combined easily
- **Fail-fast**: Required variables fail early with clear messages
