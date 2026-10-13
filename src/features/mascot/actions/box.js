// 面前出现一个明显太小的纸箱，硬挤进去。
export const box = {
  id: 'box', name: '钻纸箱', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'inbox', 'wow', 'miss'], requiredProps: ['box'], minSpanEm: 8,
  buildSteps({ random }) {
    return [
      { type: 'walk', to: 0.4 + random() * 0.2 },                              // 走到中间，前面才放得下箱子
      { type: 'pose', pose: 'watch', prop: 'box', fx: 'appear', ms: 900 },
      { type: 'pose', pose: 'crouch', ms: 900 },                               // 瞄准
      { type: 'pose', pose: 'pounce', body: 'dive', ms: 350 },                 // 跳进去
      { type: 'pose', pose: 'inbox', prop: null, ms: 3000 + random() * 1000 }, // 肉都溢出来了，但很满意
      { type: 'pose', pose: 'wow', prop: 'box', body: 'bail', ms: 520 },       // 卡得难受，蹦出来
      { type: 'pose', pose: 'miss', fx: 'vanish', ms: 1000 },
      { type: 'pose', pose: null, prop: null, ms: 100 },
    ];
  },
};
