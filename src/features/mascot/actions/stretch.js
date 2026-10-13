export const stretch = {
  id: 'stretch', name: '伸懒腰', requiredStates: ['stretch', 'yawn'], requiredProps: [], minSpanEm: 0,
  buildSteps() {
    return [
      { type: 'pose', pose: 'stretch', ms: 1800 },    // 前爪前伸，屁股撅高
      { type: 'pose', pose: 'yawn', ms: 1400 },       // 打个大哈欠
      { type: 'pose', pose: null, ms: 200 },
    ];
  },
};
