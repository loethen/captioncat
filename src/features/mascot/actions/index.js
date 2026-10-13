import { walk } from './walk.js';
import { cook } from './cook.js';
import { trash } from './trash.js';
import { tease } from './tease.js';
import { lick } from './lick.js';
import { laser } from './laser.js';

// Explicit, local registration keeps MV3 free of remotely loaded executable code.
export const actions = [walk, cook, trash, tease, lick, laser];

export function supportsAction(character, action) {
  return action.requiredStates.every(state => character.states[state]) && action.requiredProps.every(prop => character.props?.[prop]);
}

export function availableActions(character, enabledIds, info) {
  return actions.filter(action => enabledIds.includes(action.id) && supportsAction(character, action) && info.span >= info.fs * action.minSpanEm);
}
