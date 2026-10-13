export const sneeze = {
  id: 'sneeze', name: '打喷嚏', requiredStates: ['sniff', 'achoo', 'miss'], requiredProps: [], minSpanEm: 0,
  buildSteps({ random }) {
    const achoo = [
      { type: 'pose', pose: 'sniff', ms: 500 + random() * 400 },        // 啊……
      { type: 'pose', pose: 'achoo', body: 'recoil', ms: 380 },         // 嚏！把自己往后崩一下
    ];
    return [...achoo, ...(random() < 0.5 ? achoo : []), { type: 'pose', pose: 'miss', ms: 900 }, { type: 'pose', pose: null, ms: 100 }];
  },
};
