export const sneeze = {
  id: 'sneeze', name: 'Sneeze', requiredStates: ['sniff', 'achoo', 'miss'], requiredProps: [], minSpanEm: 0,
  buildSteps({ random }) {
    const achoo = [
      { type: 'pose', pose: 'sniff', ms: 500 + random() * 400 },        // ah…
      { type: 'pose', pose: 'achoo', body: 'recoil', ms: 380 },         // choo! knocks itself backwards
    ];
    return [...achoo, ...(random() < 0.5 ? achoo : []), { type: 'pose', pose: 'miss', ms: 900 }, { type: 'pose', pose: null, ms: 100 }];
  },
};
