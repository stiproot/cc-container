/**
 * Environment Variable Validation Utilities
 * Following Effect-TS best practices
 */

import { Effect } from 'effect';
import { ValidationError } from '@cc/errors/validation';

/**
 * Parse and validate a port number from environment variable
 */
export const parsePort = (
  envVar: string,
  defaultPort: number
): Effect.Effect<number, ValidationError> =>
  Effect.gen(function* () {
    const port = process.env[envVar] || String(defaultPort);
    const portNum = parseInt(port, 10);

    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      if (process.env[envVar]) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid port value for ${envVar}: ${port}. Must be between 1 and 65535`,
            field: envVar,
            value: port,
          })
        );
      }
      return defaultPort;
    }

    return portNum;
  });

/**
 * Parse and validate a positive integer from environment variable
 */
export const parsePositiveInt = (
  envVar: string,
  defaultValue: number
): Effect.Effect<number, ValidationError> =>
  Effect.gen(function* () {
    const value = process.env[envVar] || String(defaultValue);
    const num = parseInt(value, 10);

    if (isNaN(num) || num < 1) {
      if (process.env[envVar]) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid positive integer for ${envVar}: ${value}. Must be greater than 0`,
            field: envVar,
            value: value,
          })
        );
      }
      return defaultValue;
    }

    return num;
  });

/**
 * Require an environment variable to be present
 */
export const requireEnvVar = (name: string): Effect.Effect<string, ValidationError> =>
  Effect.gen(function* () {
    const value = process.env[name];
    if (!value) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Missing required environment variable: ${name}`,
          field: name,
        })
      );
    }
    return value;
  });

/**
 * Get an environment variable with a default value
 */
export const getEnvVar = (name: string, defaultValue: string): Effect.Effect<string> =>
  Effect.sync(() => process.env[name] || defaultValue);

/**
 * Parse a boolean from environment variable
 */
export const parseBoolean = (
  envVar: string,
  defaultValue: boolean
): Effect.Effect<boolean> =>
  Effect.sync(() => {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  });
