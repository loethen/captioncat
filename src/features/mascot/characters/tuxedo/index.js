const asset = name => `assets/characters/tuxedo/${name}.svg`;
export const stateIds = ['normal', 'happy', 'love', 'food', 'nervous', 'sleepy', 'ask', 'wow', 'walk', 'lick', 'watch', 'crouch', 'pounce', 'catch', 'miss', 'sniff', 'achoo', 'stretch', 'yawn', 'paw', 'peer', 'inbox', 'hang', 'rest', 'sit'];
// A question mark, notes or z's would read backwards when mirrored, so these poses also come with
// artwork whose glyphs are drawn back to front for facing left. Exclamation marks and hearts are symmetric.
export const glyphStates = ['ask', 'happy', 'sleepy'];
const states = Object.fromEntries(stateIds.map(name => [name, {
  src: asset(name), ...(glyphStates.includes(name) && { leftSrc: asset(`${name}-left`) }),
}]));

export const tuxedo = {
  id: 'tuxedo', name: 'Tuxedo Cat', description: 'A pixel tuxedo cat that patrols, licks its paws and loves to pounce on cat grass.',
  // The canvas is 48×48 and the cat itself 48×30, so the cat stands about 2.4 times the text height.
  sizeEm: 3.84, states,
  // Poses other than standing, each with the base pose shown on the way in or out; stretching gets up from anything.
  postures: {
    sit: { base: 'sit', poses: ['sit', 'lick'] },
    lie: { base: 'rest', poses: ['rest', 'sleepy'] },
    bridges: ['stretch'],
  },
  props: {
    // The same cucumber in two places: behind, and ahead after turning (the facing container mirrors, so both land on one spot).
    cucumber: { src: asset('cucumber'), box: { left: '-42.3%', bottom: '0', width: '37.5%', height: '14.6%' } },
    cucumberAhead: { src: asset('cucumber'), box: { left: '104.8%', bottom: '0', width: '37.5%', height: '14.6%' } },
    cup: { src: asset('cup'), box: { left: '101%', bottom: '2%', width: '12.5%', height: '14.6%' } },
    // Aligned with the box drawn in the inbox artwork and the landing point of the dive effect.
    box: { src: asset('box'), box: { left: '102.1%', bottom: '4.17%', width: '52.1%', height: '18.75%' } },
    dot: { src: asset('dot'), box: { left: '106%', bottom: '2%', width: '12.5%', height: '12.5%' } },
    blade: { src: asset('blade'), box: { left: '83%', bottom: '10.4%', width: '96%', height: '20.8%' } },
  },
};
