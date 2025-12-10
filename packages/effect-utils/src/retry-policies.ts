/**
 * Retry Policies
 * Standard retry policies for common scenarios
 */

import { Schedule, Duration } from 'effect';

/**
 * Standard retry policy with exponential backoff
 * - Initial delay: 100ms
 * - Exponential backoff
 * - Maximum 3 retries
 */
export const standardRetry = Schedule.exponential(Duration.millis(100)).pipe(
  Schedule.intersect(Schedule.recurs(3))
);

/**
 * Aggressive retry policy for critical operations
 * - Initial delay: 50ms
 * - Exponential backoff
 * - Maximum 5 retries
 */
export const aggressiveRetry = Schedule.exponential(Duration.millis(50)).pipe(
  Schedule.intersect(Schedule.recurs(5))
);

/**
 * Conservative retry policy for non-critical operations
 * - Initial delay: 500ms
 * - Exponential backoff
 * - Maximum 2 retries
 */
export const conservativeRetry = Schedule.exponential(Duration.millis(500)).pipe(
  Schedule.intersect(Schedule.recurs(2))
);

/**
 * Add jitter to a retry policy to prevent thundering herd
 */
export const withJitter = <A, Out>(
  policy: Schedule.Schedule<Out, A>
): Schedule.Schedule<Out, A> => Schedule.jittered(policy);
