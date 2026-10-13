const asset = name => `assets/characters/onigiri/${name}.svg`;
const states = Object.fromEntries(['normal', 'happy', 'love', 'nervous', 'sleepy', 'walk', 'cook', 'carry', 'ask', 'wow'].map(name => [name, {
  src: asset(name), mirror: !['ask', 'wow', 'sleepy'].includes(name),
}]));

export const onigiri = {
  id: 'onigiri', name: '饭团', description: '会散步、煮饭，还会提着袋子倒垃圾。',
  sizeEm: 2.8, states,
  props: {
    pot: { src: asset('pot'), box: { left: '86%', bottom: '0', width: '64%', height: '64%' } },
    bag: { src: asset('bag'), box: { left: '74%', bottom: '0', width: '50%', height: '54%' } },
  },
};
