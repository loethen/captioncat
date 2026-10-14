import { keywords, UNSPACED } from './keywords.js';

const escape = word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Keyword lists become one pattern per expression; `signs` cover what words cannot, like punctuation.
function matcher(id, signs) {
  const words = Object.entries(keywords[id] || {});
  const spaced = words.filter(([language]) => !UNSPACED.includes(language)).flatMap(([, list]) => list).map(escape);
  const unspaced = words.filter(([language]) => UNSPACED.includes(language)).flatMap(([, list]) => list).map(escape);
  const parts = [];
  if (spaced.length) parts.push(`(?<![\\p{L}\\p{N}])(?:${spaced.join('|')})(?![\\p{L}\\p{N}])`);
  if (unspaced.length) parts.push(unspaced.join('|'));
  const pattern = new RegExp(parts.join('|'), 'u');
  return text => signs?.test(text) || pattern.test(text);
}

// Tried in order; the first match wins. The id is the pose the character shows.
export const reactions = [
  { id: 'happy', test: matcher('happy', /[♪♫]|(?<!\p{L})(?:ha|ja|he){2,}h?(?!\p{L})/u) },
  { id: 'love', test: matcher('love') },
  { id: 'food', test: matcher('food') },
  { id: 'sleepy', test: matcher('sleepy') },
  { id: 'ask', test: matcher('ask', /[?？]\s*$|^(?:what|why|how|who|where|really)(?!\p{L})|[吗嗎][。]?\s*$/u) },
  { id: 'wow', test: matcher('wow', /[!！]\s*$/) },
];

export function supportsReaction(character, reaction) {
  return !!character.states[reaction.id];
}

export function moodOf(text, enabledIds = reactions.map(reaction => reaction.id), character) {
  const normalized = text.toLowerCase();
  return reactions.find(reaction => enabledIds.includes(reaction.id) && (!character || supportsReaction(character, reaction)) && reaction.test(normalized))?.id || 'normal';
}
