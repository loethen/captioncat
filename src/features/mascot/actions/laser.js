// The red dot hangs in front of the character: always one step ahead while chased, and it flips sides when the character turns.
export const laser = {
  id: 'laser', name: 'Chase the red dot', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'miss'], requiredProps: ['dot'], minSpanEm: 4, kind: 'play',
  buildSteps({ random, position }) {
    const far = position < 0.5 ? 1 : 0;
    const chase = to => [
      { type: 'pose', pose: 'watch', prop: 'dot', fx: 'enter', ms: 500 },     // the dot appears; locks on
      { type: 'walk', to, speed: 2 },                                         // chase
      { type: 'pose', pose: 'crouch', fx: 'jitter', ms: 800 },                // the dot jitters in place; winding up
      { type: 'pose', pose: 'pounce', fx: 'yank', body: 'lunge', ms: 450 },     // pounce! the dot slips away
      { type: 'pose', pose: 'miss', prop: null, ms: 700 + random() * 500 },   // nothing under the paw
    ];
    return [...chase(far), ...chase(1 - far + (far ? 0.15 : -0.15) * random()), { type: 'pose', pose: null, ms: 100 }];
  },
};
