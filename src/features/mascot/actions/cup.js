// 走到字幕尽头，把面前的杯子一点一点推下去。
export const cup = {
  id: 'cup', name: '推杯子', requiredStates: ['walk', 'watch', 'paw', 'peer'], requiredProps: ['cup'], minSpanEm: 0,
  buildSteps({ facing }) {
    const nudge = (fx, ms) => [
      { type: 'pose', pose: 'paw', body: 'poke', fx, ms: 450 },                // 伸爪拨一下
      { type: 'pose', pose: 'watch', ms },                                     // 盯着看
    ];
    return [
      { type: 'walk', to: facing > 0 ? 1 : 0 },
      { type: 'pose', pose: 'watch', prop: 'cup', fx: 'appear', ms: 900 },     // 边上有个杯子
      ...nudge('nudge1', 700), ...nudge('nudge2', 900),
      { type: 'pose', pose: 'paw', body: 'poke', fx: 'tip', ms: 800 },         // 推下去了
      { type: 'pose', pose: 'peer', prop: null, ms: 1300 },                    // 探头看它掉下去
      { type: 'pose', pose: null, ms: 700 },                                   // 一脸无辜
    ];
  },
};
