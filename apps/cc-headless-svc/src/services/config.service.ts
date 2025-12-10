/**
 * Configuration Service
 * Manages application configuration from environment variables
 * Following Effect-TS best practices with Effect.Service
 */

import { Effect, Layer } from 'effect';
import { MissingEnvironmentVariableError, ConfigurationError } from '../errors.js';

/**
 * ConfigService provides access to application configuration
 */
export class ConfigService extends Effect.Service<ConfigService>()('ConfigService', {
  sync: () => ({
    /**
     * Get server port (default: 3002)
     */
    getServerPort: Effect.sync(() => {
      const port = process.env.PORT || '3002';
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return 3002;
      }
      return portNum;
    }),

    /**
     * Get server host (default: 0.0.0.0)
     */
    getServerHost: Effect.sync(() => process.env.HOST || '0.0.0.0'),

    /**
     * Get Anthropic API key (required)
     */
    getAnthropicApiKey: Effect.gen(function* () {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return yield* Effect.fail(
          new MissingEnvironmentVariableError({ variableName: 'ANTHROPIC_API_KEY' })
        );
      }
      return apiKey;
    }),

    /**
     * Get Claude config directory (default: /app/.claude)
     */
    getClaudeConfigDir: Effect.sync(() => process.env.CLAUDE_CONFIG_DIR || '/app/.claude'),

    /**
     * Get maximum MCP output tokens (default: 50000)
     */
    getMaxMcpTokens: Effect.sync(() => {
      const tokens = process.env.MAX_MCP_OUTPUT_TOKENS || '50000';
      const tokensNum = parseInt(tokens, 10);
      if (isNaN(tokensNum) || tokensNum < 1) {
        return 50000;
      }
      return tokensNum;
    }),

    /**
     * Get workspace directory (default: /workspace)
     */
    getWorkspaceDir: Effect.sync(() => process.env.WORKSPACE_DIR || '/workspace'),

    /**
     * Get node environment (default: development)
     */
    getNodeEnv: Effect.sync(() => process.env.NODE_ENV || 'development'),

    /**
     * Check if running in production
     */
    isProduction: Effect.sync(() => process.env.NODE_ENV === 'production'),

    /**
     * Get session timeout in milliseconds (default: 1 hour)
     */
    getSessionTimeout: Effect.sync(() => {
      const timeout = process.env.SESSION_TIMEOUT_MS || '3600000';
      const timeoutNum = parseInt(timeout, 10);
      if (isNaN(timeoutNum) || timeoutNum < 1) {
        return 3600000; // 1 hour
      }
      return timeoutNum;
    }),

    /**
     * Get task timeout in milliseconds (default: 5 minutes)
     */
    getTaskTimeout: Effect.sync(() => {
      const timeout = process.env.TASK_TIMEOUT_MS || '300000';
      const timeoutNum = parseInt(timeout, 10);
      if (isNaN(timeoutNum) || timeoutNum < 1) {
        return 300000; // 5 minutes
      }
      return timeoutNum;
    }),

    /**
     * Get maximum queue size (default: 100)
     */
    getMaxQueueSize: Effect.sync(() => {
      const size = process.env.MAX_QUEUE_SIZE || '100';
      const sizeNum = parseInt(size, 10);
      if (isNaN(sizeNum) || sizeNum < 1) {
        return 100;
      }
      return sizeNum;
    }),

    /**
     * Get concurrent task limit (default: 5)
     */
    getConcurrentTaskLimit: Effect.sync(() => {
      const limit = process.env.CONCURRENT_TASK_LIMIT || '5';
      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return 5;
      }
      return limitNum;
    }),

    /**
     * Get log level (default: info)
     */
    getLogLevel: Effect.sync(() => process.env.LOG_LEVEL || 'info'),

    /**
     * Validate all required configuration
     */
    validate: Effect.gen(function* () {
      // Validate required environment variables
      const apiKey = yield* Effect.sync(() => process.env.ANTHROPIC_API_KEY);
      if (!apiKey) {
        return yield* Effect.fail(
          new ConfigurationError({
            message: 'ANTHROPIC_API_KEY environment variable is required',
            field: 'ANTHROPIC_API_KEY',
          })
        );
      }

      // Validate port
      const port = yield* Effect.sync(() => process.env.PORT);
      if (port) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return yield* Effect.fail(
            new ConfigurationError({
              message: `Invalid PORT value: ${port}. Must be between 1 and 65535`,
              field: 'PORT',
            })
          );
        }
      }

      yield* Effect.logInfo('Configuration validation passed');
    }),
  }),
}) {}

/**
 * Live implementation of ConfigService
 */
export const ConfigServiceLive = Layer.succeed(
  ConfigService,
  ConfigService.of({
    getServerPort: Effect.sync(() => {
      const port = process.env.PORT || '3002';
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return 3002;
      }
      return portNum;
    }),
    getServerHost: Effect.sync(() => process.env.HOST || '0.0.0.0'),
    getAnthropicApiKey: Effect.gen(function* () {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return yield* Effect.fail(
          new MissingEnvironmentVariableError({ variableName: 'ANTHROPIC_API_KEY' })
        );
      }
      return apiKey;
    }),
    getClaudeConfigDir: Effect.sync(() => process.env.CLAUDE_CONFIG_DIR || '/app/.claude'),
    getMaxMcpTokens: Effect.sync(() => {
      const tokens = process.env.MAX_MCP_OUTPUT_TOKENS || '50000';
      const tokensNum = parseInt(tokens, 10);
      if (isNaN(tokensNum) || tokensNum < 1) {
        return 50000;
      }
      return tokensNum;
    }),
    getWorkspaceDir: Effect.sync(() => process.env.WORKSPACE_DIR || '/workspace'),
    getNodeEnv: Effect.sync(() => process.env.NODE_ENV || 'development'),
    isProduction: Effect.sync(() => process.env.NODE_ENV === 'production'),
    getSessionTimeout: Effect.sync(() => {
      const timeout = process.env.SESSION_TIMEOUT_MS || '3600000';
      const timeoutNum = parseInt(timeout, 10);
      if (isNaN(timeoutNum) || timeoutNum < 1) {
        return 3600000;
      }
      return timeoutNum;
    }),
    getTaskTimeout: Effect.sync(() => {
      const timeout = process.env.TASK_TIMEOUT_MS || '300000';
      const timeoutNum = parseInt(timeout, 10);
      if (isNaN(timeoutNum) || timeoutNum < 1) {
        return 300000;
      }
      return timeoutNum;
    }),
    getMaxQueueSize: Effect.sync(() => {
      const size = process.env.MAX_QUEUE_SIZE || '100';
      const sizeNum = parseInt(size, 10);
      if (isNaN(sizeNum) || sizeNum < 1) {
        return 100;
      }
      return sizeNum;
    }),
    getConcurrentTaskLimit: Effect.sync(() => {
      const limit = process.env.CONCURRENT_TASK_LIMIT || '5';
      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return 5;
      }
      return limitNum;
    }),
    getLogLevel: Effect.sync(() => process.env.LOG_LEVEL || 'info'),
    validate: Effect.gen(function* () {
      const apiKey = yield* Effect.sync(() => process.env.ANTHROPIC_API_KEY);
      if (!apiKey) {
        return yield* Effect.fail(
          new ConfigurationError({
            message: 'ANTHROPIC_API_KEY environment variable is required',
            field: 'ANTHROPIC_API_KEY',
          })
        );
      }

      const port = yield* Effect.sync(() => process.env.PORT);
      if (port) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return yield* Effect.fail(
            new ConfigurationError({
              message: `Invalid PORT value: ${port}. Must be between 1 and 65535`,
              field: 'PORT',
            })
          );
        }
      }

      yield* Effect.logInfo('Configuration validation passed');
    }),
  })
);
