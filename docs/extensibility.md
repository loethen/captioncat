# 角色与动作插拔接口

插拔在源码注册表层完成：添加 / 移除本地模块后重新构建扩展。皮肤只保留 YouTube 原版和「纸」；角色（饭团、二黑）与皮肤相互独立，可搭配任一皮肤，也可选「无」。设置页可选择角色、启停动作和表情。运行时不会从网络下载或执行插件代码。

## 新增或替换角色

1. 把素材放到 `extension/assets/characters/<角色 id>/`。
2. 在 `src/features/mascot/characters/<角色 id>/index.js` 导出角色对象。
3. 在 `src/features/mascot/characters/index.js` 导入并加入 `characters` 数组。
4. 对修改的 JavaScript 执行 `node --check`，再运行 `npm run build` 后重新加载扩展。新增角色会出现在设置页的角色选择里。

```js
export const cat = {
  id: 'cat',
  name: '小猫',
  description: '一只喜欢散步的小猫。',
  sizeEm: 2.8, // 尺寸相对 YouTube 字幕字号
  states: {
    normal: { src: 'assets/characters/cat/normal.svg', mirror: true },
    walk:   { src: 'assets/characters/cat/walk.webp', mirror: true },
    happy:  { src: 'assets/characters/cat/happy.svg', mirror: true },
  },
  props: {},
};
```

`normal` 必须存在，其余姿势按需提供。默认渲染器使用 `<img>`，支持 SVG、PNG、WebP、GIF；素材建议使用透明背景和统一画布。每个姿势可使用独立素材，不必修改状态机。包含问号、感叹号、文字的素材可设置 `mirror: false`，避免向左走时文字反转。

道具使用角色自己的素材和相对位置：

```js
props: {
  pot: {
    src: 'assets/characters/cat/pot.svg',
    box: { left: '86%', bottom: '0', width: '64%', height: '64%' },
  },
}
```

道具放在角色的朝向容器内，随角色自动镜像。`sizeEm`、姿势和道具都属于角色包，动作与状态机不写角色形状和素材地址。

移除角色时，从注册表移除它并删除对应素材 / 模块。已保存的无效角色 id 会回退到注册表的第一个角色，因此饭团也可以移除或替换；注册表须至少保留一个角色。

## 新增或删除日常动作

每个动作一个模块，例如 `src/features/mascot/actions/greet.js`：

```js
export const greet = {
  id: 'greet',
  name: '打招呼',
  requiredStates: ['happy'],
  requiredProps: [],
  minSpanEm: 0,
  buildSteps({ random, position, info }) {
    return [
      { type: 'pose', pose: 'happy', ms: 1200 },
      { type: 'wait', ms: 400 },
    ];
  },
};
```

在 `actions/index.js` 导入并加入 `actions` 数组。删除动作时从数组移除即可，相关设置会自动过滤。新增动作会出现在设置页并默认启用：设置只保存用户关掉的动作和表情（`disabledActions` / `disabledReactions`）。弹窗和设置页的预览区用同一套控制器和渲染器，选中表情或动作即在示例字幕上播放，不影响页面字幕。

带 `incidental: true` 的动作不会被单独随机选中，只能由别的动作在自己的步骤里引用（例如散步走到尽头时有概率接上「差点滑下去」），但仍可在设置页开关、在预览里单独播放。

动作匹配会同时检查：用户是否启用、角色是否有 `requiredStates` 和 `requiredProps`、字幕可走区域是否达到 `minSpanEm`。替换后的角色缺少所需姿势或道具时，对应动作会自动停用。

通用步骤：

| `type` | 字段 | 行为 |
| --- | --- | --- |
| `walk` | `to`（0–1）、可选 `pose` / `speed` / `prop` | 在字幕上沿移动；默认使用 `walk` 姿势，`speed` 是速度倍数 |
| `pose` | `ms`、可选 `pose` / `mood` / `prop` / `fx` / `body` / `turn` | 持续指定姿势、表情和道具；`turn: true` 让角色原地掉头；`fx`（`enter` / `appear` / `wave` / `jitter` / `nudge1` / `nudge2` / `tip` / `vanish` / `yank`）播放道具动效，`body`（`lunge` / `jump` / `recoil` / `poke` / `dive`·`bail` / `overstep`·`gasp`·`drop`·`cling`·`climb`）播放角色的全身动效；其中 `dive`、`overstep`、`gasp`、`drop`、`cling` 会让角色停在偏离原位的地方，直到姿势被清除或播放成对的返回动效 |
| `wait` | `ms`、可选 `pose` | 停留，默认回到普通姿势 |
| `throw` | 可选 `ms`（默认 800） | 播放道具抛出效果，结束后移除道具 |

`pose: null` / `prop: null` 可显式清除姿势或道具。没有 `prop` 字段时保留当前道具。所有非普通字幕表情会中断日常动作，清除道具；字幕短暂消失时暂停动作，较久消失后取消。

`buildSteps()` 接收可注入的随机函数、当前上沿位置、朝向（`facing`，1 为右）、字幕几何信息和当前可用的动作列表（`available`），返回步骤数组。用已有步骤组合新动作不需要修改 `controller.js`。新增全新的步骤类型时，需要在执行器中增加对应处理。默认只检查语法，功能由用户手动验证。

## 字幕表情规则

在 `reactions/index.js` 的 `reactions` 数组中添加 `{ id, name, test }`。按数组顺序匹配，首先命中的规则生效；`test()` 收到小写字幕文本，`id` 对应角色 `states` 中的姿势名。

未启用的规则和角色没有素材的规则会跳过，最后回到 `normal`。角色可用可选的 `reactions: [id, …]` 进一步限定自己响应的规则（例如二黑有 `nervous` 素材，但遇到食物只流口水）。设置页会自动列出注册的规则。饭团「遇到食物就紧张」的规则可在这里更改或移除。

## 自定义渲染器

角色可选提供 `createRenderer({ character, assetURL, reduced })`，替换默认 `createAssetRenderer`。控制器只通过下面的接口操作渲染器：

```text
mount(player), size(px), place({x, y}), show(), hide(), fade()
move(from, to, kind, done), pop(), nod(), land()
setMood(name), override(nameOrNull), pose(nameOrNull), sleep(boolean)
face(direction), prop(nameOrNull), propFx(name), bodyFx(name), throwProp(), dispose()
```

`move()` 完成时调用 `done()`；替换角色或销毁时，`dispose()` 必须取消动画并移除节点。`reduced()` 为真时跳过动态效果。自定义渲染器返回的方法需要可独立调用，避免依赖调用时的 `this`，因为控制器通过环境适配器调用它们。

未来接入本地视频或 Lottie 时，可在该接口内处理播放、状态切换与销毁，控制器与日常动作无需知道具体渲染技术。所需资源应随扩展打包，并检查 `web_accessible_resources` 范围；默认素材包校验目前按图片格式校验。
