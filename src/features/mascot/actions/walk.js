export const walk = {
  id: 'walk', name: '散步', requiredStates: ['walk'], requiredProps: [], minSpanEm: 4,
  buildSteps({ random }) {
    return Array.from({ length: 2 + Math.floor(random() * 2) }, () => [
      { type: 'walk', to: random() },
      { type: 'wait', ms: 300 + random() * 400 },
    ]).flat();
  },
};
