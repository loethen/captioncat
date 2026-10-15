export const lick = {
  id: 'lick', name: 'Lick a paw', requiredStates: ['lick'], requiredProps: [], minSpanEm: 0, weight: 2,
  buildSteps() {
    return [
      { type: 'pose', pose: 'lick', ms: 2400 },
      { type: 'pose', pose: null, ms: 200 },
    ];
  },
};
