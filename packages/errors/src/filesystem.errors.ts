/**
 * File System Errors
 * Generic file system errors for use across all services
 */

import { Data } from 'effect';

export class FileNotFoundError extends Data.TaggedError('FileNotFoundError')<{
  readonly path: string;
}> {}

export class FileReadError extends Data.TaggedError('FileReadError')<{
  readonly path: string;
  readonly cause: unknown;
}> {}

export class FileWriteError extends Data.TaggedError('FileWriteError')<{
  readonly path: string;
  readonly cause: unknown;
}> {}
