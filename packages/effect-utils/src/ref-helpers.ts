/**
 * Ref Pattern Helpers
 * Helper functions for working with Effect Ref (shared mutable state)
 */

import { Effect, Ref } from 'effect';

/**
 * Update a Ref with a function and return the new value
 */
export const updateAndGet = <A>(
  ref: Ref.Ref<A>,
  f: (a: A) => A
): Effect.Effect<A> =>
  Effect.gen(function* () {
    yield* Ref.update(ref, f);
    return yield* Ref.get(ref);
  });

/**
 * Get the current value and then update the Ref
 */
export const getAndUpdate = <A>(
  ref: Ref.Ref<A>,
  f: (a: A) => A
): Effect.Effect<A> =>
  Effect.gen(function* () {
    const current = yield* Ref.get(ref);
    yield* Ref.update(ref, f);
    return current;
  });

/**
 * Modify a Ref and return a computed value
 */
export const modifyAndReturn = <A, B>(
  ref: Ref.Ref<A>,
  f: (a: A) => readonly [B, A]
): Effect.Effect<B> =>
  Effect.gen(function* () {
    return yield* Ref.modify(ref, f);
  });
