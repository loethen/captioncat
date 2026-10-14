// 走过了字幕尽头，整个身子都悬空了才发现踩空，前爪挂在边上，再扑腾回来假装什么都没发生。
// 这是走路时偶尔出的意外：不会被单独随机选中，由散步在走到尽头时触发（见 walk.js）。
export const slip = {
  id: 'slip', name: '差点滑下去', requiredStates: ['walk', 'wow', 'hang', 'pounce', 'miss', 'lick'], requiredProps: [], minSpanEm: 0, incidental: true,
  buildSteps({ random, facing, edge = facing > 0 ? 1 : 0 }) {
    return [
      { type: 'walk', to: edge },
      { type: 'pose', pose: 'walk', body: 'overstep', ms: 1560 },              // 没留意，继续往前走，整个身子都走出了字幕
      { type: 'pose', pose: 'wow', body: 'gasp', ms: 520 },                    // 脚下是空的！炸毛
      { type: 'pose', pose: 'wow', body: 'drop', ms: 260 },                    // 掉下去
      { type: 'pose', pose: 'hang', turn: true, body: 'cling', ms: 1800 + random() * 800 },   // 扒住边缘，蹬腿
      { type: 'pose', pose: 'pounce', body: 'climb', ms: 600 },                // 一使劲扑回字幕上
      { type: 'pose', pose: 'miss', ms: 700 },                                 // 喘口气
      { type: 'pose', pose: 'lick', ms: 1600 },                                // 若无其事地舔爪
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
