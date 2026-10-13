export const cook = {
  id: 'cook', name: '煮饭', requiredStates: ['walk', 'cook', 'happy'], requiredProps: ['pot'], minSpanEm: 0,
  buildSteps({ random }) {
    return [
      { type: 'walk', to: 0.35 + random() * 0.3 },
      { type: 'pose', pose: 'cook', prop: 'pot', ms: 2600 },
      { type: 'pose', pose: null, mood: 'happy', prop: null, ms: 900 },
    ];
  },
};
