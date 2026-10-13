# 字幕伙伴 · YouTube 浏览器扩展

把三个油猴脚本整合成一个 Manifest V3 扩展：字幕皮肤、悬停整句翻译、点击收集英文单词。当前目标是 Chrome / Edge（Chromium 120+）。

## 安装试用

项目已经生成 `dist/`，可以直接加载，无需先安装开发依赖。

1. Chrome 打开 `chrome://extensions`；Edge 打开 `edge://extensions`。
2. 开启「开发者模式」，点击「加载已解压的扩展」，选择本项目的 **`dist` 文件夹**。
3. 停用原来的三个油猴脚本，刷新 YouTube 页面并开启视频字幕。
4. 点击工具栏中的「字幕伙伴」图标切换皮肤、角色和功能；「设置与单词本」可以配置动作、表情、翻译语言和查看单词。

`release/subtitle-companion-0.1.0.zip` 是打包产物，解压后同样可以加载。它还没有发布到扩展商店。

## 已集成的功能

- 皮肤仅保留 YouTube 原版与「纸」，先集中打磨纸皮肤。字体和字号沿用 YouTube；`Alt + Shift + S` 在两者间切换。
- 原饭团的七种表情与散步、煮饭、倒垃圾动作；保留字幕滚动稳定判断、短暂消失等待、落下、休息和重返字幕的行为。
- 像素小黑猫「二黑」可在设置中替换饭团：巡逻、舔爪、扑逗猫草，听到吃的会流口水。素材由 `scripts/generate-assets.mjs` 从像素画代码生成为逐帧 SVG。
- 皮肤和角色相互独立：角色可搭配任一皮肤，也可选「无」。角色包仍可在源码中替换。
- 纸皮肤样式按需挂载；切回原版时移除样式、清理入场动画标记并通知播放器刷新布局。原版不使用插件的行高、边距或显示方式。
- 纸皮肤每行字幕独立画框，上下紧贴，不添加行间 gap；通过紧凑的内边距、小圆角和轻内描边减少接缝，保留每行随文字长度变化的宽度。
- 带角色的皮肤可关闭角色；日常动作和每种字幕表情均可单独开关。
- 悬停翻译、可选自动暂停与恢复、目标语言及延迟设置、持久翻译缓存、过期响应丢弃。原本已暂停的视频不会因移开鼠标而播放。
- 点击英文单词收集、去重、删除、清空当前视频、复制原复习 Prompt。单词及原句按视频在本机保存；设置页支持搜索和导出 JSON。
- 单页导航与播放器替换处理；播放器内的角色、翻译和单词浮层支持全屏。

扩展使用 YouTube **已显示的字幕 DOM**，不会自动下载字幕或开启 CC。主要面向标准视频播放器；Shorts 的字幕结构不同，尚未验证。

## 目录

```text
extension/                      扩展静态文件
  manifest.json                 权限、入口、资源声明
  popup.html / options.html     弹窗与设置页
  assets/characters/            按角色组织的 SVG / 图片素材
  icons/                        扩展图标
src/
  background/                   消息路由、持久存储、翻译请求与缓存
  content/                      页面入口和共享的字幕监听层
  features/
    skins/                      皮肤注册、样式、切换与入场效果
    translation/                悬停、暂停所有权、翻译浮层
    vocabulary/                 点击取词与播放器内单词面板
    mascot/
      characters/               角色素材包与注册表
      actions/                  每个日常动作一个文件
      reactions/                字幕情绪触发规则
      controller.js             无 DOM 的状态机与通用动作执行器
      renderer.js               默认素材渲染器
      index.js                  将角色、动作、字幕源和渲染器连接起来
  shared/                       设置、消息、文本、剪贴板和 DOM 工具
  ui/                           弹窗 / 设置页逻辑与公共样式
scripts/                        构建、打包、素材生成、浏览器检查
tests/                          状态机、存储、注册表、翻译测试及页面 fixture
reference/userscripts/          用户原始脚本，保留用于对照
docs/                           插拔接口说明与验证记录
dist/                           构建产物：在浏览器中加载此目录
release/                        可分发的 ZIP
```

## 开发

```sh
npm ci
npm run dev       # 监听 src；修改后在扩展管理页点击重新加载，并刷新 YouTube
npm run check     # 单元测试 + 构建
npm run package   # 检查后生成 ZIP
```

修改 `extension/` 下的 manifest、HTML 或素材后，重新运行 `npm run build`。生成饭团 SVG 可运行 `node scripts/generate-assets.mjs`；普通开发无需重复生成。纸皮肤样式直接编辑 `src/features/skins/skins.css`，素材生成不会覆盖它。按 `AGENTS.md`，默认只做语法检查，UI 和交互由用户自行测试。

角色和动作的新增、删除、替换方式见 [插拔接口说明](docs/extensibility.md)。权限和数据流见 [架构说明](docs/architecture.md)，测试范围见 [验证记录](docs/verification.md)。

## 数据与翻译

设置、单词、翻译缓存保存在 `chrome.storage.local`，不做账号同步。油猴脚本的 `GM_*` 私有存储不会自动迁移到扩展；卸载扩展会删除扩展本机数据，单词可提前导出。

翻译保留原脚本的 `translate.googleapis.com/translate_a/single?client=gtx` 接口。这是未承诺稳定性的接口，可能受网络、频率限制或服务变动影响；失败时浮层会显示原因。接入正式服务时只需更换 `src/background/translation-service.js` 中的请求适配器，并调整 manifest 的域名权限。默认只在悬停时发送当前字幕，不上传单词本。
