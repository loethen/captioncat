// The routine's rest: walks to an end of the caption (usually the nearer one), lies down facing back along it and dozes,
// more often than not falling asleep, then gets up with a stretch. How long and how deeply follows the
// activity level (`rest` and `sleep` in the pace).
export const nap = {
  id: 'nap', name: 'Rest at the edge', requiredStates: ['walk', 'rest', 'sleepy', 'stretch', 'yawn'], requiredProps: [], minSpanEm: 0, kind: 'rest',
  buildSteps({ random, position, pace = { rest: [15000, 30000], sleep: 0.6 } }) {
    // Now and then it picks the far end, so it does not always lie at the same end facing the same way.
    const near = position < 0.5 ? 0 : 1, edge = random() < 0.7 ? near : 1 - near, inward = edge ? -1 : 1;
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
