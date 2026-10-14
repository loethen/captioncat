export const reactions = [
  { id: 'happy', name: 'Happy', test: text => /\[(music|applause|laughter|laughs|cheering)\]|[♪♫]|\b(haha+|lol|thank you|thanks)\b/.test(text) },
  { id: 'love', name: 'Love', test: text => /\b(love|loved|adorable|cute|beautiful|favorite)\b/.test(text) },
  { id: 'food', name: 'Hungry', test: text => /\b(eat|eating|ate|hungry|delicious|yummy|snack|lunch|dinner|breakfast|food|fish|tuna|milk|chicken|meat|treat|treats)\b/.test(text) },
  { id: 'sleepy', name: 'Sleepy', test: text => /\b(sleep|sleepy|tired|bed|yawn|boring|exhausted)\b/.test(text) },
  { id: 'ask', name: 'Curious', test: text => /\?\s*$|^(what|why|how|who|where|really)\b/.test(text) },
  { id: 'wow', name: 'Surprised', test: text => /!\s*$|\b(wow|whoa|omg|oh my god|no way|amazing|incredible)\b/.test(text) },
];

export function supportsReaction(character, reaction) {
  return !!character.states[reaction.id];
}

export function moodOf(text, enabledIds = reactions.map(reaction => reaction.id), character) {
  const normalized = text.toLowerCase();
  return reactions.find(reaction => enabledIds.includes(reaction.id) && (!character || supportsReaction(character, reaction)) && reaction.test(normalized))?.id || 'normal';
}
