import { slip } from './slip.js';

const SLIP_CHANCE = 0.25;

export const walk = {
  id: 'walk', name: 'Stroll', requiredStates: ['walk'], requiredProps: [], minSpanEm: 4,
  buildSteps({ random, facing, available = [] }) {
    const steps = Array.from({ length: 2 + Math.floor(random() * 2) }, () => [
      { type: 'walk', to: random() },
      { type: 'wait', ms: 300 + random() * 400 },
    ]).flat();
    // Now and then it walks all the way to the end and steps off (only when the character has the poses and the user left it on).
    if (available.includes(slip) && random() < SLIP_CHANCE) steps.push(...slip.buildSteps({ random, facing, edge: random() < 0.5 ? 0 : 1 }));
    return steps;
  },
};
