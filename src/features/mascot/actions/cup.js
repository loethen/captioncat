// Walks to the end of the caption and nudges the cup off, bit by bit.
export const cup = {
  id: 'cup', name: 'Push the cup', requiredStates: ['walk', 'watch', 'paw', 'peer'], requiredProps: ['cup'], minSpanEm: 0,
  buildSteps({ facing }) {
    const nudge = (fx, ms) => [
      { type: 'pose', pose: 'paw', body: 'poke', fx, ms: 450 },                // pokes it with a paw
      { type: 'pose', pose: 'watch', ms },                                     // stares
    ];
    return [
      { type: 'walk', to: facing > 0 ? 1 : 0 },
      { type: 'pose', pose: 'watch', prop: 'cup', fx: 'appear', ms: 900 },     // a cup at the edge
      ...nudge('nudge1', 700), ...nudge('nudge2', 900),
      { type: 'pose', pose: 'paw', body: 'poke', fx: 'tip', ms: 800 },         // over it goes
      { type: 'pose', pose: 'peer', prop: null, ms: 1300 },                    // peers after it
      { type: 'pose', pose: null, ms: 700 },                                   // all innocence
    ];
  },
};
