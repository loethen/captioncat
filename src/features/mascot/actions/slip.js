// Walks past the end of the caption, notices only once fully in mid-air, hangs on by the
// front paws, then scrambles back and pretends nothing happened.
// An occasional walking mishap: never picked on its own, triggered by a stroll that reaches the end (see walk.js).
export const slip = {
  id: 'slip', name: 'Near slip', requiredStates: ['walk', 'wow', 'hang', 'pounce', 'miss', 'lick'], requiredProps: [], minSpanEm: 0, incidental: true,
  buildSteps({ random, facing, edge = facing > 0 ? 1 : 0 }) {
    return [
      { type: 'walk', to: edge },
      { type: 'pose', pose: 'walk', body: 'overstep', ms: 1560 },              // not paying attention, keeps walking right off the caption
      { type: 'pose', pose: 'wow', body: 'gasp', ms: 520 },                    // nothing underfoot! fur on end
      { type: 'pose', pose: 'wow', body: 'drop', ms: 260 },                    // drops
      { type: 'pose', pose: 'hang', turn: true, body: 'cling', ms: 1800 + random() * 800 },   // clings to the edge, legs kicking
      { type: 'pose', pose: 'pounce', body: 'climb', ms: 600 },                // heaves back onto the caption
      { type: 'pose', pose: 'miss', ms: 700 },                                 // catches its breath
      { type: 'pose', pose: 'lick', ms: 1600 },                                // licks a paw as if nothing happened
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
