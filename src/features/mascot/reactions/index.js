export const reactions = [
  { id: 'happy', name: '开心', test: text => /\[(music|applause|laughter|laughs|cheering)\]|[♪♫]|\b(haha+|lol|thank you|thanks)\b/.test(text) },
  { id: 'love', name: '喜欢', test: text => /\b(love|loved|adorable|cute|beautiful|favorite)\b/.test(text) },
  { id: 'nervous', name: '紧张', test: text => /\b(eat|eating|ate|hungry|delicious|yummy|snack|lunch|dinner|breakfast|food|rice)\b/.test(text) },
  { id: 'food', name: '馋嘴', test: text => /\b(eat|eating|ate|hungry|delicious|yummy|snack|lunch|dinner|breakfast|food|fish|tuna|milk|chicken|meat|treat|treats)\b/.test(text) },
  { id: 'sleepy', name: '困倦', test: text => /\b(sleep|sleepy|tired|bed|yawn|boring|exhausted)\b/.test(text) },
  { id: 'ask', name: '疑问', test: text => /\?\s*$|^(what|why|how|who|where|really)\b/.test(text) },
  { id: 'wow', name: '惊讶', test: text => /!\s*$|\b(wow|whoa|omg|oh my god|no way|amazing|incredible)\b/.test(text) },
];

// A character may narrow the rules it reacts to with an optional `reactions` id list.
export function supportsReaction(character, reaction) {
  return !!character.states[reaction.id] && (!character.reactions || character.reactions.includes(reaction.id));
}

export function moodOf(text, enabledIds = reactions.map(reaction => reaction.id), character) {
  const normalized = text.toLowerCase();
  return reactions.find(reaction => enabledIds.includes(reaction.id) && (!character || supportsReaction(character, reaction)) && reaction.test(normalized))?.id || 'normal';
}
