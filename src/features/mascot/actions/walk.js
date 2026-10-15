import { slip } from './slip.js';

const SLIP_CHANCE = 0.12, PAUSE_CHANCE = 0.3;

// A patrol: walks all the way to one end of the caption, often turns and walks to the other end too.
// Now and then it stops part way to look at something, then carries on to the same end.
export const walk = {
  id: 'walk', name: 'Stroll', requiredStates: ['walk', 'watch'], requiredProps: [], minSpanEm: 4, kind: 'patrol',
  buildSteps({ random, position, facing, available = [] }) {
    // Head for the end it faces, or away from the end it is standing at.
    let end = position < 0.15 ? 1 : position > 0.85 ? 0 : (random() < 0.7 ? facing > 0 : facing < 0) ? 1 : 0;
    const steps = [];
    for (let leg = 0, legs = random() < 0.5 ? 2 : 1, from = position; leg < legs; leg++, from = end, end = 1 - end) {
      if (random() < PAUSE_CHANCE) steps.push(
        { type: 'walk', to: from + (end - from) * (0.35 + random() * 0.3) },
        { type: 'pose', pose: 'watch', ms: 600 + random() * 700 },
      );
      steps.push({ type: 'walk', to: end });
      if (leg < legs - 1) steps.push({ type: 'wait', ms: 300 + random() * 500 });          // looks out from the end before turning back
    }
    // Now and then it does not stop at the end at all (only when the character has the poses and the user left it on).
    if (available.includes(slip) && random() < SLIP_CHANCE) steps.push(...slip.buildSteps({ random, edge: 1 - end }));
    return steps;
  },
};
