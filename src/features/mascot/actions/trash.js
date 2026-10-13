export const trash = {
  id: 'trash', name: '倒垃圾', requiredStates: ['walk', 'carry', 'happy'], requiredProps: ['bag'], minSpanEm: 4,
  buildSteps({ random, position }) {
    return [
      { type: 'pose', pose: 'carry', prop: 'bag', ms: 300 },
      { type: 'walk', to: position < 0.5 ? 1 : 0, pose: 'carry' },
      { type: 'throw', ms: 800 },
      { type: 'pose', pose: null, mood: 'happy', prop: null, ms: 900 },
      { type: 'walk', to: 0.6 + random() * 0.4 },
    ];
  },
};
