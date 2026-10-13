// 趴在字幕上沿，把头倒探下去看字。
export const peek = {
  id: 'peek', name: '探头看字', requiredStates: ['peek'], requiredProps: [], minSpanEm: 0,
  buildSteps({ random }) {
    return [
      { type: 'pose', pose: 'peek', body: 'lower', ms: 2000 + random() * 800 },
      { type: 'pose', pose: 'peek', body: 'raise', ms: 280 },
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
