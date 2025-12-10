/**
 * Domain-Specific Tagged Error Definitions
 * Following Effect-TS best practices for type-safe error handling
 *
 * Generic errors are imported from @cc/errors package
 */

import { Data } from 'effect';

// Re-export generic errors from shared package for convenience
export {
  ValidationError,
  SchemaValidationError,
  HttpError,
  UnauthorizedError,
  ForbiddenError,
  FileNotFoundError,
  FileReadError,
  FileWriteError,
  UnknownError,
  NotImplementedError,
} from '@cc/errors';

/**
 * Configuration Errors
 */
export class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  readonly message: string;
  readonly field?: string;
}> {}

export class MissingEnvironmentVariableError extends Data.TaggedError('MissingEnvironmentVariableError')<{
  readonly variableName: string;
}> {}

/**
 * Claude CLI Process Errors
 */
export class ClaudeProcessError extends Data.TaggedError('ClaudeProcessError')<{
  readonly message: string;
  readonly exitCode?: number;
  readonly stderr?: string;
}> {}

export class ClaudeTimeoutError extends Data.TaggedError('ClaudeTimeoutError')<{
  readonly taskId: string;
  readonly timeoutMs: number;
}> {}

export class ClaudeProcessSpawnError extends Data.TaggedError('ClaudeProcessSpawnError')<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class ClaudeOutputParseError extends Data.TaggedError('ClaudeOutputParseError')<{
  readonly message: string;
  readonly rawOutput: string;
}> {}

/**
 * Session Management Errors
 */
export class SessionNotFoundError extends Data.TaggedError('SessionNotFoundError')<{
  readonly sessionId: string;
}> {}

export class SessionExpiredError extends Data.TaggedError('SessionExpiredError')<{
  readonly sessionId: string;
  readonly expiredAt: Date;
}> {}

export class SessionCreationError extends Data.TaggedError('SessionCreationError')<{
  readonly message: string;
  readonly userId: string;
}> {}

/**
 * Task Management Errors
 */
export class TaskNotFoundError extends Data.TaggedError('TaskNotFoundError')<{
  readonly taskId: string;
}> {}

export class TaskQueueFullError extends Data.TaggedError('TaskQueueFullError')<{
  readonly queueSize: number;
  readonly maxSize: number;
}> {}

export class TaskCancellationError extends Data.TaggedError('TaskCancellationError')<{
  readonly taskId: string;
  readonly reason: string;
}> {}

export class TaskExecutionError extends Data.TaggedError('TaskExecutionError')<{
  readonly taskId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * MCP Configuration Errors
 */
export class MCPConfigLoadError extends Data.TaggedError('MCPConfigLoadError')<{
  readonly message: string;
  readonly configPath: string;
}> {}

export class MCPServerUnreachableError extends Data.TaggedError('MCPServerUnreachableError')<{
  readonly serverName: string;
  readonly url: string;
}> {}

export class MCPValidationError extends Data.TaggedError('MCPValidationError')<{
  readonly message: string;
  readonly serverName: string;
}> {}

