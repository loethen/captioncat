// A box that is plainly too small appears ahead; it squeezes in anyway.
export const box = {
  id: 'box', name: 'Squeeze into a box', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'inbox', 'wow', 'miss'], requiredProps: ['box'], minSpanEm: 8, kind: 'play',
  buildSteps({ random }) {
    return [
      { type: 'walk', to: 0.4 + random() * 0.2 },                              // walk to the middle so the box fits ahead
      { type: 'pose', pose: 'watch', prop: 'box', fx: 'appear', ms: 900 },
      { type: 'pose', pose: 'crouch', ms: 900 },                               // takes aim
      { type: 'pose', pose: 'pounce', body: 'dive', ms: 350 },                 // jumps in
      { type: 'pose', pose: 'inbox', prop: null, ms: 3000 + random() * 1000 }, // spilling over the sides, but content
      { type: 'pose', pose: 'wow', prop: 'box', body: 'bail', ms: 520 },       // too tight, hops out
      { type: 'pose', pose: 'miss', fx: 'vanish', ms: 1000 },
      { type: 'pose', pose: null, prop: null, ms: 100 },
    ];
  },
};
