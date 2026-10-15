// Strolls to one end of the caption, turns back towards it and lies down for a while; more often than not
// it nods off, then wakes with a yawn. Never picked on its own: a stroll ends this way now and then (see walk.js).
export const nap = {
  id: 'nap', name: 'Rest at the edge', requiredStates: ['walk', 'rest', 'sleepy', 'yawn'], requiredProps: [], minSpanEm: 0, incidental: true,
  buildSteps({ random, edge = random() < 0.5 ? 0 : 1 }) {
    const steps = [{ type: 'walk', to: edge }];
    if (random() < 0.6) steps.push(
      { type: 'pose', pose: 'rest', turn: true, ms: 3000 + random() * 3000 },   // lies down facing the caption, dozing
      { type: 'pose', pose: 'sleepy', ms: 8000 + random() * 10000 },            // falls asleep
      { type: 'pose', pose: 'rest', ms: 900 },                                 // stirs
      { type: 'pose', pose: 'yawn', ms: 1300 },                                // gets up with a big yawn
    );
    else steps.push({ type: 'pose', pose: 'rest', turn: true, ms: 6000 + random() * 8000 });   // just a rest
    steps.push({ type: 'pose', pose: null, ms: 300 });
    return steps;
  },
};
