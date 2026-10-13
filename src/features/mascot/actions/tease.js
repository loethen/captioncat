const HIT_CHANCE = 0.33;

export const tease = {
  id: 'tease', name: '逗猫草', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'catch', 'miss'], requiredProps: ['blade'], minSpanEm: 0,
  buildSteps({ random }) {
    const hit = random() < HIT_CHANCE;
    return [
      { type: 'walk', to: 0.2 + random() * 0.4 },
      { type: 'pose', pose: 'watch', prop: 'blade', fx: 'enter', ms: 700 },           // 草尖探进来
      { type: 'pose', pose: 'watch', fx: 'wave', ms: 900 },                            // 盯着
      { type: 'pose', pose: 'crouch', fx: 'wave', ms: 1400 },                          // 蓄力，屁股扭扭
      { type: 'pose', pose: 'pounce', fx: hit ? null : 'yank', body: 'lunge', ms: 450 }, // 扑！没中的话草被抽走
      hit ? { type: 'pose', pose: 'catch', prop: null, ms: 2200 }                      // 叼住，得意
          : { type: 'pose', pose: 'miss', prop: null, ms: 2000 },                      // 扑空，愣住
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
