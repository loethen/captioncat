// 红点挂在角色面前：角色追的时候它始终领先一步，角色掉头时它跟着闪到另一边。
export const laser = {
  id: 'laser', name: '追红点', requiredStates: ['walk', 'watch', 'crouch', 'pounce', 'miss'], requiredProps: ['dot'], minSpanEm: 4,
  buildSteps({ random, position }) {
    const far = position < 0.5 ? 1 : 0;
    const chase = to => [
      { type: 'pose', pose: 'watch', prop: 'dot', fx: 'enter', ms: 500 },     // 红点出现，盯住
      { type: 'walk', to, speed: 2 },                                         // 追
      { type: 'pose', pose: 'crouch', fx: 'jitter', ms: 800 },                // 红点原地乱晃，蓄力
      { type: 'pose', pose: 'pounce', fx: 'yank', lunge: true, ms: 450 },     // 扑！红点溜了
      { type: 'pose', pose: 'miss', prop: null, ms: 700 + random() * 500 },   // 爪子底下什么都没有
    ];
    return [...chase(far), ...chase(1 - far + (far ? 0.15 : -0.15) * random()), { type: 'pose', pose: null, ms: 100 }];
  },
};
