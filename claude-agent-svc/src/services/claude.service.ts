/**
 * Claude Service
 * Wraps Claude CLI process execution in headless mode
 * Following Effect-TS best practices with acquireRelease for process lifecycle
 */

import { Effect, Layer, Stream, Chunk } from 'effect';
import { spawn, type ChildProcess } from 'child_process';
import { ConfigService } from './config.service.js';
import {
  ClaudeProcessError,
  ClaudeTimeoutError,
  ClaudeProcessSpawnError,
  ClaudeOutputParseError,
} from '../errors.js';
import type { ClaudeOutputEvent } from '../schemas.js';

/**
 * Claude process result
 */
export interface ClaudeResult {
  readonly sessionId?: string;
  readonly output: string;
  readonly exitCode: number;
  readonly success: boolean;
}

/**
 * Claude process options
 */
export interface ClaudeExecuteOptions {
  readonly prompt: string;
  readonly sessionId?: string;
  readonly timeout?: number;
  readonly workingDirectory?: string;
}

/**
 * ClaudeService provides Claude CLI process management
 */
export class ClaudeService extends Effect.Service<ClaudeService>()('ClaudeService', {
  effect: Effect.gen(function* () {
    const config = yield* ConfigService;

    /**
     * Spawn Claude CLI process with proper cleanup
     */
    const spawnClaudeProcess = (args: string[], cwd?: string) =>
      Effect.acquireRelease(
        Effect.gen(function* () {
          const claudeConfigDir = yield* config.getClaudeConfigDir;
          const anthropicApiKey = yield* config.getAnthropicApiKey;

          yield* Effect.logDebug(`Spawning Claude process with args: ${args.join(' ')}`);

          // Spawn process
          const process = yield* Effect.try({
            try: () =>
              spawn('claude', args, {
                cwd: cwd || (yield* Effect.sync(() => process.env.WORKSPACE_DIR || '/workspace')),
                env: {
                  ...process.env,
                  ANTHROPIC_API_KEY: anthropicApiKey,
                  CLAUDE_CONFIG_DIR: claudeConfigDir,
                },
                stdio: ['pipe', 'pipe', 'pipe'],
              }),
            catch: (error) =>
              new ClaudeProcessSpawnError({
                message: `Failed to spawn Claude process: ${error}`,
                cause: error,
              }),
          });

          return process;
        }),
        // Cleanup: kill process on release
        (process: ChildProcess) =>
          Effect.gen(function* () {
            if (process.pid && !process.killed) {
              yield* Effect.logDebug(`Killing Claude process ${process.pid}`);
              process.kill('SIGTERM');

              // Wait a bit for graceful shutdown
              yield* Effect.sleep('1 second');

              // Force kill if still alive
              if (!process.killed) {
                yield* Effect.logWarning(`Force killing Claude process ${process.pid}`);
                process.kill('SIGKILL');
              }
            }
          })
      );

    /**
     * Parse Claude CLI JSON output stream
     */
    const parseOutputStream = (process: ChildProcess) =>
      Stream.async<ClaudeOutputEvent>((emit) => {
        let buffer = '';

        process.stdout?.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();

          // Process complete JSON lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              emit.single(parsed);
            } catch (error) {
              emit.fail(
                new ClaudeOutputParseError({
                  message: `Failed to parse Claude output: ${error}`,
                  rawOutput: trimmed,
                })
              );
            }
          }
        });

        process.stderr?.on('data', (chunk: Buffer) => {
          const stderr = chunk.toString();
          Effect.runSync(Effect.logError(`Claude stderr: ${stderr}`));
        });

        process.on('close', (code) => {
          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              emit.single(parsed);
            } catch (error) {
              // Ignore parse errors on close
            }
          }

          emit.end();
        });

        process.on('error', (error) => {
          emit.fail(
            new ClaudeProcessError({
              message: `Claude process error: ${error.message}`,
            })
          );
        });
      });

    return {
      /**
       * Execute task in headless mode with streaming
       */
      executeTask: (options: ClaudeExecuteOptions) =>
        Effect.gen(function* () {
          const { prompt, sessionId, timeout: customTimeout, workingDirectory } = options;
          const defaultTimeout = yield* config.getTaskTimeout;
          const timeout = customTimeout || defaultTimeout;

          yield* Effect.logInfo(
            `Executing Claude task${sessionId ? ` (session: ${sessionId})` : ''}`
          );

          // Build command args
          const args = [
            '-p',
            prompt,
            '--output-format',
            'stream-json',
            '--dangerously-skip-permissions',
          ];

          if (sessionId) {
            args.push('--resume', sessionId);
          }

          // Spawn process with cleanup
          const process = yield* spawnClaudeProcess(args, workingDirectory);

          // Create output stream
          const outputStream = parseOutputStream(process);

          // Collect output
          let output = '';
          let newSessionId: string | undefined = sessionId;
          let success = false;

          // Process stream with timeout
          yield* Stream.runForEach(outputStream, (event) =>
            Effect.gen(function* () {
              yield* Effect.logDebug(`Claude event: ${JSON.stringify(event)}`);

              switch (event.type) {
                case 'start':
                  if (!sessionId && 'sessionId' in event) {
                    newSessionId = (event as any).sessionId;
                  }
                  break;
                case 'output':
                  output += event.content + '\n';
                  break;
                case 'complete':
                  success = event.status === 'success';
                  break;
                case 'error':
                  output += `ERROR: ${event.message}\n`;
                  break;
              }
            })
          ).pipe(
            Effect.timeout(timeout),
            Effect.catchTag('TimeoutException', () =>
              Effect.fail(
                new ClaudeTimeoutError({
                  taskId: sessionId || 'unknown',
                  timeoutMs: timeout,
                })
              )
            )
          );

          // Wait for process to exit
          const exitCode = yield* Effect.async<number>((resume) => {
            process.on('close', (code) => {
              resume(Effect.succeed(code || 0));
            });
          });

          if (!success && exitCode !== 0) {
            return yield* Effect.fail(
              new ClaudeProcessError({
                message: 'Claude process failed',
                exitCode,
                stderr: output,
              })
            );
          }

          const result: ClaudeResult = {
            sessionId: newSessionId,
            output: output.trim(),
            exitCode,
            success,
          };

          yield* Effect.logInfo(`Claude task completed successfully`);

          return result;
        }),

      /**
       * Execute task and stream output as Effect Stream
       */
      executeTaskStream: (options: ClaudeExecuteOptions) =>
        Effect.gen(function* () {
          const { prompt, sessionId, timeout: customTimeout, workingDirectory } = options;
          const defaultTimeout = yield* config.getTaskTimeout;
          const timeout = customTimeout || defaultTimeout;

          yield* Effect.logInfo(
            `Starting Claude task stream${sessionId ? ` (session: ${sessionId})` : ''}`
          );

          // Build command args
          const args = [
            '-p',
            prompt,
            '--output-format',
            'stream-json',
            '--dangerously-skip-permissions',
          ];

          if (sessionId) {
            args.push('--resume', sessionId);
          }

          // Spawn process with cleanup
          const process = yield* spawnClaudeProcess(args, workingDirectory);

          // Return output stream
          return parseOutputStream(process).pipe(
            Stream.timeout(timeout),
            Stream.catchAll((error) =>
              Stream.fail(
                error._tag === 'TimeoutException'
                  ? new ClaudeTimeoutError({
                      taskId: sessionId || 'unknown',
                      timeoutMs: timeout,
                    })
                  : error
              )
            )
          );
        }),

      /**
       * Check if Claude CLI is available
       */
      checkAvailability: Effect.gen(function* () {
        yield* Effect.logDebug('Checking Claude CLI availability');

        const process = yield* Effect.try({
          try: () =>
            spawn('claude', ['--version'], {
              stdio: ['pipe', 'pipe', 'pipe'],
            }),
          catch: (error) =>
            new ClaudeProcessSpawnError({
              message: `Claude CLI not found: ${error}`,
              cause: error,
            }),
        });

        const output = yield* Effect.async<string>((resume) => {
          let stdout = '';
          process.stdout?.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
          });
          process.on('close', () => {
            resume(Effect.succeed(stdout.trim()));
          });
          process.on('error', (error) => {
            resume(Effect.fail(error));
          });
        });

        yield* Effect.logInfo(`Claude CLI version: ${output}`);

        return true;
      }).pipe(
        Effect.catchAll(() => Effect.succeed(false))
      ),
    };
  }),
  dependencies: [ConfigService.Default],
}) {}

/**
 * Live implementation of ClaudeService
 */
export const ClaudeServiceLive = Layer.effect(
  ClaudeService,
  Effect.gen(function* () {
    const config = yield* ConfigService;

    const spawnClaudeProcess = (args: string[], cwd?: string) =>
      Effect.acquireRelease(
        Effect.gen(function* () {
          const claudeConfigDir = yield* config.getClaudeConfigDir;
          const anthropicApiKey = yield* config.getAnthropicApiKey;

          yield* Effect.logDebug(`Spawning Claude process with args: ${args.join(' ')}`);

          const proc = spawn('claude', args, {
            cwd: cwd || process.env.WORKSPACE_DIR || '/workspace',
            env: {
              ...process.env,
              ANTHROPIC_API_KEY: anthropicApiKey,
              CLAUDE_CONFIG_DIR: claudeConfigDir,
            },
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          if (!proc) {
            return yield* Effect.fail(
              new ClaudeProcessSpawnError({
                message: 'Failed to spawn Claude process',
                cause: 'Process is null',
              })
            );
          }

          return proc;
        }),
        (process: ChildProcess) =>
          Effect.gen(function* () {
            if (process.pid && !process.killed) {
              yield* Effect.logDebug(`Killing Claude process ${process.pid}`);
              process.kill('SIGTERM');
              yield* Effect.sleep('1 second');
              if (!process.killed) {
                yield* Effect.logWarning(`Force killing Claude process ${process.pid}`);
                process.kill('SIGKILL');
              }
            }
          })
      );

    const parseOutputStream = (process: ChildProcess) =>
      Stream.async<ClaudeOutputEvent>((emit) => {
        let buffer = '';

        process.stdout?.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              emit.single(parsed);
            } catch (error) {
              emit.fail(
                new ClaudeOutputParseError({
                  message: `Failed to parse Claude output: ${error}`,
                  rawOutput: trimmed,
                })
              );
            }
          }
        });

        process.stderr?.on('data', (chunk: Buffer) => {
          const stderr = chunk.toString();
          Effect.runSync(Effect.logError(`Claude stderr: ${stderr}`));
        });

        process.on('close', () => {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              emit.single(parsed);
            } catch (_) {
              // Ignore
            }
          }
          emit.end();
        });

        process.on('error', (error) => {
          emit.fail(
            new ClaudeProcessError({
              message: `Claude process error: ${error.message}`,
            })
          );
        });
      });

    return ClaudeService.of({
      executeTask: (options: ClaudeExecuteOptions) =>
        Effect.gen(function* () {
          const { prompt, sessionId, timeout: customTimeout, workingDirectory } = options;
          const defaultTimeout = yield* config.getTaskTimeout;
          const timeout = customTimeout || defaultTimeout;

          yield* Effect.logInfo(
            `Executing Claude task${sessionId ? ` (session: ${sessionId})` : ''}`
          );

          const args = [
            '-p',
            prompt,
            '--output-format',
            'stream-json',
            '--dangerously-skip-permissions',
          ];

          if (sessionId) {
            args.push('--resume', sessionId);
          }

          const process = yield* spawnClaudeProcess(args, workingDirectory);
          const outputStream = parseOutputStream(process);

          let output = '';
          let newSessionId: string | undefined = sessionId;
          let success = false;

          yield* Stream.runForEach(outputStream, (event) =>
            Effect.gen(function* () {
              yield* Effect.logDebug(`Claude event: ${JSON.stringify(event)}`);

              switch (event.type) {
                case 'start':
                  if (!sessionId && 'sessionId' in event) {
                    newSessionId = (event as any).sessionId;
                  }
                  break;
                case 'output':
                  output += event.content + '\n';
                  break;
                case 'complete':
                  success = event.status === 'success';
                  break;
                case 'error':
                  output += `ERROR: ${event.message}\n`;
                  break;
              }
            })
          ).pipe(
            Effect.timeout(timeout),
            Effect.catchTag('TimeoutException', () =>
              Effect.fail(
                new ClaudeTimeoutError({
                  taskId: sessionId || 'unknown',
                  timeoutMs: timeout,
                })
              )
            )
          );

          const exitCode = yield* Effect.async<number>((resume) => {
            process.on('close', (code) => {
              resume(Effect.succeed(code || 0));
            });
          });

          if (!success && exitCode !== 0) {
            return yield* Effect.fail(
              new ClaudeProcessError({
                message: 'Claude process failed',
                exitCode,
                stderr: output,
              })
            );
          }

          const result: ClaudeResult = {
            sessionId: newSessionId,
            output: output.trim(),
            exitCode,
            success,
          };

          yield* Effect.logInfo(`Claude task completed successfully`);

          return result;
        }),

      executeTaskStream: (options: ClaudeExecuteOptions) =>
        Effect.gen(function* () {
          const { prompt, sessionId, timeout: customTimeout, workingDirectory } = options;
          const defaultTimeout = yield* config.getTaskTimeout;
          const timeout = customTimeout || defaultTimeout;

          yield* Effect.logInfo(
            `Starting Claude task stream${sessionId ? ` (session: ${sessionId})` : ''}`
          );

          const args = [
            '-p',
            prompt,
            '--output-format',
            'stream-json',
            '--dangerously-skip-permissions',
          ];

          if (sessionId) {
            args.push('--resume', sessionId);
          }

          const process = yield* spawnClaudeProcess(args, workingDirectory);

          return parseOutputStream(process).pipe(
            Stream.timeout(timeout),
            Stream.catchAll((error) =>
              Stream.fail(
                error._tag === 'TimeoutException'
                  ? new ClaudeTimeoutError({
                      taskId: sessionId || 'unknown',
                      timeoutMs: timeout,
                    })
                  : error
              )
            )
          );
        }),

      checkAvailability: Effect.gen(function* () {
        yield* Effect.logDebug('Checking Claude CLI availability');

        const proc = spawn('claude', ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!proc) {
          return false;
        }

        const output = yield* Effect.async<string>((resume) => {
          let stdout = '';
          proc.stdout?.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
          });
          proc.on('close', () => {
            resume(Effect.succeed(stdout.trim()));
          });
          proc.on('error', (error) => {
            resume(Effect.fail(error));
          });
        });

        yield* Effect.logInfo(`Claude CLI version: ${output}`);

        return true;
      }).pipe(Effect.catchAll(() => Effect.succeed(false))),
    });
  })
).pipe(Layer.provide(ConfigService.Default));
