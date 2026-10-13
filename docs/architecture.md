# 架构与数据流

```text
YouTube 页面
  content/index.js
    CaptionSource ──► 皮肤 / 角色 / 翻译 / 单词收集
    各功能创建自己的播放器内浮层
       │ runtime.sendMessage
       ▼
  background/index.js（MV3 service worker）
    Store ──► chrome.storage.local
    TranslationService ──► 固定 Google 翻译端点
       ▲
       │ runtime.sendMessage / storage.onChanged
  popup / options
```

## 页面层

一个共享 `CaptionSource` 维护播放器、字幕文本和字幕节点；功能模块通过订阅接收更新。播放器内只有一个 MutationObserver，观察节点和文本变化；扩展自身浮层的变化会跳过。每秒的单一恢复检查处理播放器替换和漏掉的导航事件。

角色开启时随浏览器的每个动画帧读取字幕位置，与原油猴脚本一致，不额外限制帧率；先等待上沿稳定，再决定是否换层。页面隐藏时跳过计算，角色关闭时取消循环。坐标转换考虑播放器的 CSS 缩放；浮层位于播放器内，以便在全屏中显示。

只保留纸皮肤与 YouTube 原版。纸皮肤 CSS 作为本地字符串打包，仅在选中纸时挂载独立样式节点，不进入常驻的 content.css。切回原版时移除样式节点和入场动画标记，并发出 resize 事件通知播放器重新布局；原版不应用插件的行高、边距、字体、字号或显示方式。

角色是纸皮肤的可选组成部分，由皮肤注册表声明；切换到原版后立即隐藏并停止动画循环。字幕学习功能关闭后，移除交互标记，恢复 YouTube 的指针行为。所有页面文本通过 `textContent` / DOM API 创建，没有使用 `innerHTML`，以适应 YouTube 的 Trusted Types。

## 后台层

跨域翻译由 service worker 发起，内容脚本只发送字幕文本；端点固定，消息不能指定任意请求 URL。这遵循 [Chrome 的跨域请求说明](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)。

设置与单词的所有写入经过后台串行队列，避免多个标签页「读取 → 修改 → 写入」互相覆盖。翻译服务去重并发相同请求，按目标语言和原句缓存，立即持久保存至多 500 条；缓存清除等待先前请求结束，避免旧响应重新填入。

后台通过 `return true` 保持异步消息响应通道，不依赖 service worker 内存做持久存储。所有注册代码及素材随扩展打包，无远程 JavaScript 或 `eval`。

## 存储

| Key | 内容 |
| --- | --- |
| `settings:v1` | 皮肤、角色、已启用的动作 / 表情、翻译和收集设置 |
| `words:v1` | 按视频 id 分组的单词、原句、加入时间和规范视频链接 |
| `translations:v1` | 最多 500 条 `[目标语言 + 原句, 译文]` |

设置读取时规范化，失效的注册 id 会过滤或回退。单词本总量上限 10,000 条，达到上限后提示导出或删除。设置和单词通过 [storage.onChanged](https://developer.chrome.com/docs/extensions/reference/api/storage) 在已打开的页面、弹窗与设置页同步。

## 权限

- `storage`：设置、单词和翻译缓存。
- `clipboardWrite`：用户点击复制时写入复习 Prompt。
- `https://www.youtube.com/*`：注入字幕功能，以及在弹窗识别当前 YouTube 视频。
- `https://translate.googleapis.com/*`：后台翻译请求。

角色图片作为 [web accessible resources](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) 仅向 YouTube 暴露。没有申请所有网站、历史记录、下载或广泛 tabs 权限。
