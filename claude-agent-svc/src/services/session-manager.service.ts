/**
 * Session Manager Service
 * Manages Claude session state using Ref for atomic updates
 * Following Effect-TS best practices with Ref for shared state
 */

import { Effect, Layer, Ref } from 'effect';
import { v4 as uuidv4 } from 'uuid';
import type { SessionState } from '../schemas.js';
import {
  SessionNotFoundError,
  SessionExpiredError,
  SessionCreationError,
} from '../errors.js';
import { ConfigService } from './config.service.js';

/**
 * SessionManagerService provides session lifecycle management
 */
export class SessionManagerService extends Effect.Service<SessionManagerService>()(
  'SessionManagerService',
  {
    effect: Effect.gen(function* () {
      const config = yield* ConfigService;
      const sessionTimeout = yield* config.getSessionTimeout;

      // Session map using Ref for atomic state updates
      const sessions = yield* Ref.make(new Map<string, SessionState>());

      return {
        /**
         * Create a new session for a user
         */
        createSession: (userId: string, metadata?: Record<string, unknown>) =>
          Effect.gen(function* () {
            const sessionId = uuidv4();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + sessionTimeout);

            const newSession: SessionState = {
              sessionId,
              userId,
              createdAt: now,
              lastAccessedAt: now,
              expiresAt,
              taskCount: 0,
              metadata,
            };

            // Atomically update sessions map
            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              newMap.set(sessionId, newSession);
              return newMap;
            });

            yield* Effect.logInfo(`Session created: ${sessionId} for user: ${userId}`);

            return {
              sessionId: newSession.sessionId,
              userId: newSession.userId,
              createdAt: newSession.createdAt,
              updatedAt: newSession.lastAccessedAt,
              expiresAt: newSession.expiresAt,
              metadata: newSession.metadata,
            };
          }).pipe(
            Effect.catchAll(error =>
              Effect.fail(
                new SessionCreationError({
                  message: `Failed to create session: ${error}`,
                  userId,
                })
              )
            )
          ),

        /**
         * Get session by ID
         */
        getSession: (sessionId: string) =>
          Effect.gen(function* () {
            const sessionMap = yield* Ref.get(sessions);
            const session = sessionMap.get(sessionId);

            if (!session) {
              return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
            }

            // Check if session is expired
            const now = new Date();
            if (now > session.expiresAt) {
              // Remove expired session
              yield* Ref.update(sessions, map => {
                const newMap = new Map(map);
                newMap.delete(sessionId);
                return newMap;
              });

              return yield* Effect.fail(
                new SessionExpiredError({
                  sessionId,
                  expiredAt: session.expiresAt,
                })
              );
            }

            // Update last accessed time
            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              const updatedSession = { ...session, lastAccessedAt: now };
              newMap.set(sessionId, updatedSession);
              return newMap;
            });

            return {
              sessionId: session.sessionId,
              userId: session.userId,
              createdAt: session.createdAt,
              updatedAt: now,
              expiresAt: session.expiresAt,
              claudeSessionId: session.claudeSessionId,
              metadata: session.metadata,
            };
          }),

        /**
         * Update session state
         */
        updateSession: (sessionId: string, updates: Partial<SessionState>) =>
          Effect.gen(function* () {
            const sessionMap = yield* Ref.get(sessions);
            const session = sessionMap.get(sessionId);

            if (!session) {
              return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
            }

            // Merge updates
            const updatedSession: SessionState = {
              ...session,
              ...updates,
              sessionId: session.sessionId, // Preserve immutable fields
              userId: session.userId,
              createdAt: session.createdAt,
              lastAccessedAt: new Date(),
            };

            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              newMap.set(sessionId, updatedSession);
              return newMap;
            });

            yield* Effect.logDebug(`Session updated: ${sessionId}`);
          }),

        /**
         * Delete session
         */
        deleteSession: (sessionId: string) =>
          Effect.gen(function* () {
            const sessionMap = yield* Ref.get(sessions);
            const session = sessionMap.get(sessionId);

            if (!session) {
              return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
            }

            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              newMap.delete(sessionId);
              return newMap;
            });

            yield* Effect.logInfo(`Session deleted: ${sessionId}`);
          }),

        /**
         * Increment task count for session
         */
        incrementTaskCount: (sessionId: string) =>
          Effect.gen(function* () {
            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              const session = newMap.get(sessionId);
              if (session) {
                newMap.set(sessionId, {
                  ...session,
                  taskCount: session.taskCount + 1,
                  lastAccessedAt: new Date(),
                });
              }
              return newMap;
            });
          }),

        /**
         * Clean up expired sessions
         */
        cleanupExpiredSessions: Effect.gen(function* () {
          const now = new Date();
          let expiredCount = 0;

          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            for (const [sessionId, session] of newMap.entries()) {
              if (now > session.expiresAt) {
                newMap.delete(sessionId);
                expiredCount++;
              }
            }
            return newMap;
          });

          if (expiredCount > 0) {
            yield* Effect.logInfo(`Cleaned up ${expiredCount} expired sessions`);
          }

          return expiredCount;
        }),

        /**
         * Get all sessions for a user
         */
        getUserSessions: (userId: string) =>
          Effect.gen(function* () {
            const sessionMap = yield* Ref.get(sessions);
            const userSessions = Array.from(sessionMap.values())
              .filter(session => session.userId === userId)
              .map(session => ({
                sessionId: session.sessionId,
                userId: session.userId,
                createdAt: session.createdAt,
                updatedAt: session.lastAccessedAt,
                expiresAt: session.expiresAt,
                claudeSessionId: session.claudeSessionId,
                metadata: session.metadata,
              }));

            return userSessions;
          }),

        /**
         * Get session count
         */
        getSessionCount: Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          return sessionMap.size;
        }),

        /**
         * Check if session exists and is valid
         */
        isSessionValid: (sessionId: string) =>
          Effect.gen(function* () {
            const sessionMap = yield* Ref.get(sessions);
            const session = sessionMap.get(sessionId);

            if (!session) {
              return false;
            }

            const now = new Date();
            return now <= session.expiresAt;
          }),
      };
    }),
    dependencies: [ConfigService.Default],
  }
) {}

/**
 * Live implementation of SessionManagerService
 */
export const SessionManagerServiceLive = Layer.effect(
  SessionManagerService,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const sessionTimeout = yield* config.getSessionTimeout;

    const sessions = yield* Ref.make(new Map<string, SessionState>());

    return SessionManagerService.of({
      createSession: (userId: string, metadata?: Record<string, unknown>) =>
        Effect.gen(function* () {
          const sessionId = uuidv4();
          const now = new Date();
          const expiresAt = new Date(now.getTime() + sessionTimeout);

          const newSession: SessionState = {
            sessionId,
            userId,
            createdAt: now,
            lastAccessedAt: now,
            expiresAt,
            taskCount: 0,
            metadata,
          };

          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            newMap.set(sessionId, newSession);
            return newMap;
          });

          yield* Effect.logInfo(`Session created: ${sessionId} for user: ${userId}`);

          return {
            sessionId: newSession.sessionId,
            userId: newSession.userId,
            createdAt: newSession.createdAt,
            updatedAt: newSession.lastAccessedAt,
            expiresAt: newSession.expiresAt,
            metadata: newSession.metadata,
          };
        }).pipe(
          Effect.catchAll(error =>
            Effect.fail(
              new SessionCreationError({
                message: `Failed to create session: ${error}`,
                userId,
              })
            )
          )
        ),

      getSession: (sessionId: string) =>
        Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          const session = sessionMap.get(sessionId);

          if (!session) {
            return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
          }

          const now = new Date();
          if (now > session.expiresAt) {
            yield* Ref.update(sessions, map => {
              const newMap = new Map(map);
              newMap.delete(sessionId);
              return newMap;
            });

            return yield* Effect.fail(
              new SessionExpiredError({
                sessionId,
                expiredAt: session.expiresAt,
              })
            );
          }

          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            const updatedSession = { ...session, lastAccessedAt: now };
            newMap.set(sessionId, updatedSession);
            return newMap;
          });

          return {
            sessionId: session.sessionId,
            userId: session.userId,
            createdAt: session.createdAt,
            updatedAt: now,
            expiresAt: session.expiresAt,
            claudeSessionId: session.claudeSessionId,
            metadata: session.metadata,
          };
        }),

      updateSession: (sessionId: string, updates: Partial<SessionState>) =>
        Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          const session = sessionMap.get(sessionId);

          if (!session) {
            return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
          }

          const updatedSession: SessionState = {
            ...session,
            ...updates,
            sessionId: session.sessionId,
            userId: session.userId,
            createdAt: session.createdAt,
            lastAccessedAt: new Date(),
          };

          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            newMap.set(sessionId, updatedSession);
            return newMap;
          });

          yield* Effect.logDebug(`Session updated: ${sessionId}`);
        }),

      deleteSession: (sessionId: string) =>
        Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          const session = sessionMap.get(sessionId);

          if (!session) {
            return yield* Effect.fail(new SessionNotFoundError({ sessionId }));
          }

          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            newMap.delete(sessionId);
            return newMap;
          });

          yield* Effect.logInfo(`Session deleted: ${sessionId}`);
        }),

      incrementTaskCount: (sessionId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(sessions, map => {
            const newMap = new Map(map);
            const session = newMap.get(sessionId);
            if (session) {
              newMap.set(sessionId, {
                ...session,
                taskCount: session.taskCount + 1,
                lastAccessedAt: new Date(),
              });
            }
            return newMap;
          });
        }),

      cleanupExpiredSessions: Effect.gen(function* () {
        const now = new Date();
        let expiredCount = 0;

        yield* Ref.update(sessions, map => {
          const newMap = new Map(map);
          for (const [sessionId, session] of newMap.entries()) {
            if (now > session.expiresAt) {
              newMap.delete(sessionId);
              expiredCount++;
            }
          }
          return newMap;
        });

        if (expiredCount > 0) {
          yield* Effect.logInfo(`Cleaned up ${expiredCount} expired sessions`);
        }

        return expiredCount;
      }),

      getUserSessions: (userId: string) =>
        Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          const userSessions = Array.from(sessionMap.values())
            .filter(session => session.userId === userId)
            .map(session => ({
              sessionId: session.sessionId,
              userId: session.userId,
              createdAt: session.createdAt,
              updatedAt: session.lastAccessedAt,
              expiresAt: session.expiresAt,
              claudeSessionId: session.claudeSessionId,
              metadata: session.metadata,
            }));

          return userSessions;
        }),

      getSessionCount: Effect.gen(function* () {
        const sessionMap = yield* Ref.get(sessions);
        return sessionMap.size;
      }),

      isSessionValid: (sessionId: string) =>
        Effect.gen(function* () {
          const sessionMap = yield* Ref.get(sessions);
          const session = sessionMap.get(sessionId);

          if (!session) {
            return false;
          }

          const now = new Date();
          return now <= session.expiresAt;
        }),
    });
  })
).pipe(Layer.provide(ConfigService.Default));
