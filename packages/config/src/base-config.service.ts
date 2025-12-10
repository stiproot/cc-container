/**
 * Base Configuration Service Pattern
 * Provides common configuration methods that all services can use
 */

import { Effect } from 'effect';
import { getEnvVar } from './env-validator.js';
import type { LogLevel, Environment } from './config-types.js';

/**
 * Get the Node.js environment
 */
export const getNodeEnv = (): Effect.Effect<Environment> =>
  Effect.sync(() => (process.env.NODE_ENV || 'development') as Environment);

/**
 * Check if running in production
 */
export const isProduction = (): Effect.Effect<boolean> =>
  Effect.sync(() => process.env.NODE_ENV === 'production');

/**
 * Check if running in development
 */
export const isDevelopment = (): Effect.Effect<boolean> =>
  Effect.sync(() => process.env.NODE_ENV === 'development');

/**
 * Get the log level
 */
export const getLogLevel = (): Effect.Effect<LogLevel> =>
  Effect.map(getEnvVar('LOG_LEVEL', 'info'), (level) => level as LogLevel);
