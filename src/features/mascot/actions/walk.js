import { slip } from './slip.js';
import { nap } from './nap.js';

const SLIP_CHANCE = 0.25, NAP_CHANCE = 0.45;

export const walk = {
  id: 'walk', name: 'Stroll', requiredStates: ['walk'], requiredProps: [], minSpanEm: 4, weight: 4,
  buildSteps({ random, facing, available = [] }) {
    const steps = Array.from({ length: 2 + Math.floor(random() * 2) }, () => [
      { type: 'walk', to: random() },
      { type: 'wait', ms: 300 + random() * 400 },
    ]).flat();
    // Now and then it walks all the way to the end and steps off (only when the character has the poses and the user left it on).
    if (available.includes(slip) && random() < SLIP_CHANCE) steps.push(...slip.buildSteps({ random, facing, edge: random() < 0.5 ? 0 : 1 }));
    // Otherwise it often settles down at one end for a rest.
    else if (available.includes(nap) && random() < NAP_CHANCE) steps.push(...nap.buildSteps({ random }));
    return steps;
  },
};
