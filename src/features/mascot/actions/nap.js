// The routine's rest: walks to the nearer end of the caption, lies down facing back along it and dozes,
// more often than not falling asleep, then gets up with a stretch. How long and how deeply follows the
// activity level (`rest` and `sleep` in the pace).
export const nap = {
  id: 'nap', name: 'Rest at the edge', requiredStates: ['walk', 'rest', 'sleepy', 'stretch', 'yawn'], requiredProps: [], minSpanEm: 0, kind: 'rest',
  buildSteps({ random, position, pace = { rest: [15000, 30000], sleep: 0.6 } }) {
    const edge = position < 0.5 ? 0 : 1, inward = edge ? -1 : 1;
    const total = pace.rest[0] + random() * (pace.rest[1] - pace.rest[0]);
    const steps = [{ type: 'walk', to: edge }];
    if (random() < pace.sleep) {
      const doze = 3000 + random() * 2000;
      steps.push(
        { type: 'pose', pose: 'rest', face: inward, ms: doze },              // lies down, dozing
        { type: 'pose', pose: 'sleepy', ms: Math.max(4000, total - doze) },  // falls asleep
        { type: 'pose', pose: 'rest', ms: 900 },                             // stirs
      );
    } else steps.push({ type: 'pose', pose: 'rest', face: inward, ms: total });   // just a rest
    steps.push(
      { type: 'pose', pose: 'stretch', ms: 1600 },                           // gets up with a stretch
      { type: 'pose', pose: 'yawn', ms: 1100 },
      { type: 'pose', pose: null, ms: 200 },
    );
    return steps;
  },
};
