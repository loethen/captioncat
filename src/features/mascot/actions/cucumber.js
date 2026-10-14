// 黄瓜出现在角色身后；角色掉头时才发现它，吓得往回跑。
export const cucumber = {
  id: 'cucumber', name: '被黄瓜吓到', requiredStates: ['walk', 'lick', 'watch', 'wow', 'miss'], requiredProps: ['cucumber', 'cucumberAhead'], minSpanEm: 0,
  buildSteps({ random, position, facing }) {
    // 先走到中间留出逃跑的距离；走完后的朝向决定黄瓜在哪边、往哪边逃。
    const spot = 0.4 + random() * 0.2;
    const ahead = Math.abs(spot - position) < 0.02 ? facing : Math.sign(spot - position);
    return [
      { type: 'walk', to: spot },
      { type: 'pose', pose: 'lick', ms: 700 },                                    // 专心舔爪
      { type: 'pose', pose: 'lick', prop: 'cucumber', ms: 1200 },                // 身后忽然多了根黄瓜
      { type: 'pose', pose: null, ms: 450 },                                     // 舔完了
      { type: 'pose', pose: 'watch', turn: true, prop: 'cucumberAhead', ms: 420 },   // 掉头——眼前有根黄瓜
      { type: 'pose', pose: 'wow', body: 'jump', ms: 700 },                      // 炸毛弹起
      { type: 'walk', to: ahead > 0 ? 1 : 0, pose: 'wow', speed: 2.5, prop: null },   // 转身就跑
      { type: 'pose', pose: 'miss', ms: 1100 },                                  // 惊魂未定
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
