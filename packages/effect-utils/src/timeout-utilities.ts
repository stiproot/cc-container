/**
 * Timeout Utilities
 * Helper functions for managing timeouts in Effect programs
 */

import { Effect, Duration } from 'effect';

/**
 * Add a default timeout to an effect
 * @param effect The effect to add timeout to
 * @param timeoutMs Timeout in milliseconds (default: 30000)
 */
export const withDefaultTimeout = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  timeoutMs: number = 30000
): Effect.Effect<A, E, R> => Effect.timeout(effect, Duration.millis(timeoutMs));

/**
 * Add a timeout with a custom error handler
 * @param effect The effect to add timeout to
 * @param timeoutMs Timeout in milliseconds
 * @param onTimeout Effect to run on timeout
 */
export const withTimeoutOrElse = <A, E, R, A2, E2, R2>(
  effect: Effect.Effect<A, E, R>,
  timeoutMs: number,
  onTimeout: Effect.Effect<A2, E2, R2>
): Effect.Effect<A | A2, E | E2, R | R2> =>
  Effect.timeoutTo(effect, {
    duration: Duration.millis(timeoutMs),
    onTimeout: () => onTimeout,
  });

/**
 * Race multiple effects with a timeout
 * Returns the first effect to complete, or fails if all fail or timeout
 */
export const raceWithTimeout = <A, E, R>(
  effects: readonly Effect.Effect<A, E, R>[],
  timeoutMs: number
): Effect.Effect<A, E, R> =>
  Effect.timeout(Effect.race(...effects), Duration.millis(timeoutMs));
