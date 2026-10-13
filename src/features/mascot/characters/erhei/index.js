const asset = name => `assets/characters/erhei/${name}.svg`;
export const stateIds = ['normal', 'happy', 'love', 'food', 'nervous', 'sleepy', 'ask', 'wow', 'walk', 'lick', 'watch', 'crouch', 'pounce', 'catch', 'miss'];
const states = Object.fromEntries(stateIds.map(name => [name, {
  // 带文字符号的素材，镜像会变形，所以不翻转
  src: asset(name), mirror: !['ask', 'wow', 'happy', 'love', 'sleepy'].includes(name),
}]));

export const erhei = {
  id: 'erhei', name: '二黑', description: '胖胖的像素小黑猫，会巡逻、舔爪，还爱扑逗猫草。',
  // 素材画布是 48×48，猫本身 48×30，所以猫的高度约为 2.4 倍字高。
  sizeEm: 3.84, states,
  // 二黑听到吃的会流口水而不是紧张；nervous 只在字幕消失、脚下没东西时使用。
  reactions: ['happy', 'love', 'food', 'sleepy', 'ask', 'wow'],
  props: {
    dot: { src: asset('dot'), box: { left: '106%', bottom: '2%', width: '12.5%', height: '12.5%' } },
    blade: { src: asset('blade'), box: { left: '83%', bottom: '10.4%', width: '96%', height: '20.8%' } },
  },
};
