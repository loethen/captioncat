import { slip } from './slip.js';

const SLIP_CHANCE = 0.25;

export const walk = {
  id: 'walk', name: '散步', requiredStates: ['walk'], requiredProps: [], minSpanEm: 4,
  buildSteps({ random, facing, available = [] }) {
    const steps = Array.from({ length: 2 + Math.floor(random() * 2) }, () => [
      { type: 'walk', to: random() },
      { type: 'wait', ms: 300 + random() * 400 },
    ]).flat();
    // 偶尔一路走到尽头，踩空（角色画了这个姿势、用户也没关掉时才会发生）。
    if (available.includes(slip) && random() < SLIP_CHANCE) steps.push(...slip.buildSteps({ random, facing, edge: random() < 0.5 ? 0 : 1 }));
    return steps;
  },
};
