# @cc/effect-utils

Effect-TS utilities and helper functions for all services in the cc-container workspace.

## Overview

This package provides reusable utilities, patterns, and helpers for working with Effect-TS.

## Installation

This package is part of the cc-container workspace and should be referenced as a workspace dependency:

```json
{
  "dependencies": {
    "@cc/effect-utils": "workspace:*"
  }
}
```

## Retry Policies

Pre-configured retry policies for common scenarios:

### standardRetry

Standard retry with exponential backoff (3 retries, 100ms initial delay):

```typescript
import { standardRetry } from '@cc/effect-utils';
import { Effect } from 'effect';

const fetchData = Effect.retry(
  Effect.tryPromise(() => fetch('/api/data')),
  standardRetry
);
```

### aggressiveRetry

Aggressive retry for critical operations (5 retries, 50ms initial delay):

```typescript
import { aggressiveRetry } from '@cc/effect-utils';

const criticalOperation = Effect.retry(
  riskyEffect,
  aggressiveRetry
);
```

### conservativeRetry

Conservative retry for non-critical operations (2 retries, 500ms initial delay):

```typescript
import { conservativeRetry } from '@cc/effect-utils';

const nonCriticalTask = Effect.retry(
  backgroundTask,
  conservativeRetry
);
```

### withJitter

Add jitter to any retry policy to prevent thundering herd:

```typescript
import { standardRetry, withJitter } from '@cc/effect-utils';

const jitteredRetry = withJitter(standardRetry);

const operation = Effect.retry(
  someEffect,
  jitteredRetry
);
```

## Timeout Utilities

### withDefaultTimeout

Add a 30-second timeout to an effect:

```typescript
import { withDefaultTimeout } from '@cc/effect-utils';

const timedOperation = withDefaultTimeout(longRunningEffect);

// Custom timeout
const customTimeout = withDefaultTimeout(longRunningEffect, 60000); // 60 seconds
```

### withTimeoutOrElse

Add a timeout with a fallback:

```typescript
import { withTimeoutOrElse } from '@cc/effect-utils';

const operation = withTimeoutOrElse(
  fetchFromPrimary,
  5000,
  fetchFromSecondary // Fallback on timeout
);
```

### raceWithTimeout

Race multiple effects with a timeout:

```typescript
import { raceWithTimeout } from '@cc/effect-utils';

const fastest = raceWithTimeout(
  [fetchFromServer1, fetchFromServer2, fetchFromServer3],
  10000 // 10 second timeout
);
```

## Layer Helpers

### mergeLayers

Merge two layers into one:

```typescript
import { mergeLayers } from '@cc/effect-utils';
import { Layer } from 'effect';

const DatabaseLive = Layer.succeed(Database, database);
const CacheLive = Layer.succeed(Cache, cache);

const AppLive = mergeLayers(DatabaseLive, CacheLive);
```

### provideMultipleLayers

Provide multiple layers to an effect sequentially:

```typescript
import { provideMultipleLayers } from '@cc/effect-utils';

const program = Effect.gen(function* () {
  // Your program logic
});

const runnable = provideMultipleLayers(
  program,
  DatabaseLive,
  CacheLive,
  ConfigLive
);
```

## Ref Helpers

Working with shared mutable state:

### updateAndGet

Update a Ref and return the new value:

```typescript
import { updateAndGet } from '@cc/effect-utils';
import { Ref, Effect } from 'effect';

const program = Effect.gen(function* () {
  const counter = yield* Ref.make(0);
  const newValue = yield* updateAndGet(counter, (n) => n + 1);
  console.log(`Counter is now: ${newValue}`);
});
```

### getAndUpdate

Get the current value, then update:

```typescript
import { getAndUpdate } from '@cc/effect-utils';

const program = Effect.gen(function* () {
  const counter = yield* Ref.make(10);
  const oldValue = yield* getAndUpdate(counter, (n) => n * 2);
  console.log(`Old value: ${oldValue}, new value: ${oldValue * 2}`);
});
```

### modifyAndReturn

Modify a Ref and return a computed value:

```typescript
import { modifyAndReturn } from '@cc/effect-utils';

const program = Effect.gen(function* () {
  const balance = yield* Ref.make(100);

  const withdraw = (amount: number) =>
    modifyAndReturn(balance, (current) => {
      if (current >= amount) {
        return [true, current - amount]; // [return value, new state]
      } else {
        return [false, current]; // Insufficient funds
      }
    });

  const success = yield* withdraw(50);
  console.log(success ? 'Withdrawal successful' : 'Insufficient funds');
});
```

## Complete Example

```typescript
import { Effect, Ref } from 'effect';
import {
  standardRetry,
  withDefaultTimeout,
  updateAndGet
} from '@cc/effect-utils';

const program = Effect.gen(function* () {
  const counter = yield* Ref.make(0);

  // Fetch data with retry and timeout
  const fetchWithResilience = withDefaultTimeout(
    Effect.retry(
      Effect.tryPromise(() => fetch('/api/data')),
      standardRetry
    ),
    10000 // 10 second timeout
  );

  const data = yield* fetchWithResilience;

  // Update counter
  const count = yield* updateAndGet(counter, (n) => n + 1);

  console.log(`Fetched data, request count: ${count}`);
  return data;
});
```

## Design Principles

- **Reusable**: Common patterns extracted for reuse
- **Composable**: Functions work well together
- **Type-safe**: Full TypeScript support
- **Effect-first**: Designed for Effect-TS ecosystem
- **Production-ready**: Sensible defaults for real applications
