/**
 * Layer Composition Utilities
 * Helper functions for working with Effect Layers
 */

import { Layer, Effect } from 'effect';

/**
 * Merge multiple layers into a single layer
 * All layers must provide different services (no overlapping dependencies)
 */
export const mergeLayers = <R1, E1, A1, R2, E2, A2>(
  layer1: Layer.Layer<A1, E1, R1>,
  layer2: Layer.Layer<A2, E2, R2>
): Layer.Layer<A1 | A2, E1 | E2, R1 | R2> => Layer.merge(layer1, layer2);

/**
 * Provide multiple layers to an effect sequentially
 * Useful when you have several service layers to provide
 */
export const provideMultipleLayers = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  ...layers: Layer.Layer<any, any, any>[]
): Effect.Effect<A, any, any> => {
  return layers.reduce((acc, layer) => Effect.provide(acc, layer), effect as any);
};
