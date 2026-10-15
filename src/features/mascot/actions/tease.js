const HIT_CHANCE = 0.33;

export const tease = {
  id: 'tease', name: 'Cat grass', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'catch', 'miss'], requiredProps: ['blade'], minSpanEm: 4, kind: 'play',
  buildSteps({ random }) {
    const hit = random() < HIT_CHANCE;
    return [
      { type: 'walk', to: 0.35 + random() * 0.3 },                                    // the middle, so the grass has room ahead
      { type: 'pose', pose: 'watch', prop: 'blade', fx: 'enter', ms: 700 },           // a blade of grass pokes in
      { type: 'pose', pose: 'watch', fx: 'wave', ms: 900 },                            // stares
      { type: 'pose', pose: 'crouch', fx: 'wave', ms: 1400 },                          // winds up, wiggling
      { type: 'pose', pose: 'pounce', fx: hit ? null : 'yank', body: 'lunge', ms: 450 }, // pounce! on a miss the grass is yanked away
      hit ? { type: 'pose', pose: 'catch', prop: null, ms: 2200 }                      // caught it, smug
          : { type: 'pose', pose: 'miss', prop: null, ms: 2000 },                      // missed, stunned
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
