// 走到字幕尽头一脚踩空，前爪挂在边上，再爬回来假装什么都没发生。
export const slip = {
  id: 'slip', name: '差点滑下去', requiredStates: ['walk', 'wow', 'hang', 'lick'], requiredProps: [], minSpanEm: 0,
  buildSteps({ random, facing }) {
    return [
      { type: 'walk', to: facing > 0 ? 1 : 0 },
      { type: 'pose', pose: 'wow', body: 'slip', ms: 420 },                    // 踩空
      { type: 'pose', pose: 'hang', turn: true, body: 'cling', ms: 2000 + random() * 800 },   // 扒住边缘，蹬腿
      { type: 'pose', pose: 'hang', body: 'climb', ms: 650 },                  // 爬回来
      { type: 'pose', pose: 'lick', ms: 1600 },                                // 若无其事地舔爪
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
