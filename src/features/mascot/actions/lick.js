export const lick = {
  id: 'lick', name: '舔爪', requiredStates: ['lick'], requiredProps: [], minSpanEm: 0,
  buildSteps() {
    return [
      { type: 'pose', pose: 'lick', ms: 2400 },
      { type: 'pose', pose: null, ms: 200 },
    ];
  },
};
