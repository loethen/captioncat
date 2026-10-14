export const stretch = {
  id: 'stretch', name: 'Stretch', requiredStates: ['stretch', 'yawn'], requiredProps: [], minSpanEm: 0,
  buildSteps() {
    return [
      { type: 'pose', pose: 'stretch', ms: 1800 },    // front paws out, rump up
      { type: 'pose', pose: 'yawn', ms: 1400 },       // a big yawn
      { type: 'pose', pose: null, ms: 200 },
    ];
  },
};
