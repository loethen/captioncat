const asset = name => `assets/characters/erhei/${name}.svg`;
export const stateIds = ['normal', 'happy', 'love', 'food', 'nervous', 'sleepy', 'ask', 'wow', 'walk', 'lick', 'watch', 'crouch', 'pounce', 'catch', 'miss', 'sniff', 'achoo', 'stretch', 'yawn', 'paw', 'peer', 'inbox', 'hang'];
const states = Object.fromEntries(stateIds.map(name => [name, {
  // Artwork with a question mark, notes or z's would read backwards when mirrored, so it is not flipped.
  // Exclamation marks and hearts are symmetric and flip as usual, which keeps wow facing the right way when heading left.
  src: asset(name), mirror: !['ask', 'happy', 'sleepy'].includes(name),
}]));

export const erhei = {
  id: 'erhei', name: 'Erhei', description: 'A chubby pixel black cat that patrols, licks its paws and loves to pounce on cat grass.',
  // The canvas is 48×48 and the cat itself 48×30, so the cat stands about 2.4 times the text height.
  sizeEm: 3.84, states,
  props: {
    // The same cucumber in two places: behind, and ahead after turning (the facing container mirrors, so both land on one spot).
    cucumber: { src: asset('cucumber'), box: { left: '-34%', bottom: '2%', width: '29.2%', height: '10.4%' } },
    cucumberAhead: { src: asset('cucumber'), box: { left: '104.8%', bottom: '2%', width: '29.2%', height: '10.4%' } },
    cup: { src: asset('cup'), box: { left: '101%', bottom: '2%', width: '12.5%', height: '14.6%' } },
    // Aligned with the box drawn in the inbox artwork and the landing point of the dive effect.
    box: { src: asset('box'), box: { left: '102.1%', bottom: '4.17%', width: '52.1%', height: '18.75%' } },
    dot: { src: asset('dot'), box: { left: '106%', bottom: '2%', width: '12.5%', height: '12.5%' } },
    blade: { src: asset('blade'), box: { left: '83%', bottom: '10.4%', width: '96%', height: '20.8%' } },
  },
};
