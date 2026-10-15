// Strolls to one end of the caption, turns back towards it and lies down for a while.
// Never picked on its own: a stroll ends this way now and then (see walk.js).
export const nap = {
  id: 'nap', name: 'Rest at the edge', requiredStates: ['walk', 'rest'], requiredProps: [], minSpanEm: 0, incidental: true,
  buildSteps({ random, edge = random() < 0.5 ? 0 : 1 }) {
    return [
      { type: 'walk', to: edge },
      { type: 'pose', pose: 'rest', turn: true, ms: 6000 + random() * 8000 },   // lies down facing the caption, dozing
      { type: 'pose', pose: null, ms: 300 },
    ];
  },
};
