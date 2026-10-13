export function wordAtOffset(text, offset) {
  if (!Number.isInteger(offset) || offset < 0 || offset > text.length) return null;
  const pattern = /[a-zA-Z]+(?:['’\-][a-zA-Z]+)*/g;
  for (const match of text.matchAll(pattern)) {
    if (offset >= match.index && offset <= match.index + match[0].length) {
      const word = match[0].toLowerCase().replaceAll('’', "'");
      return word.length >= 2 ? word : null;
    }
  }
  return null;
}

export function isMostlyChinese(text) {
  const visible = text.replace(/\s/g, '');
  return visible.length > 0 && (visible.match(/[\u3400-\u9fff]/g) || []).length / visible.length > 0.3;
}

export function videoContext(href, title = '') {
  const url = new URL(href);
  if (url.hostname !== 'www.youtube.com') return null;
  const id = url.searchParams.get('v') || (/^\/(?:shorts|live)\/([^/?]+)/.exec(url.pathname)?.[1]);
  if (!id || !/^[\w-]{1,64}$/.test(id)) return null;
  return { id, url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, title: title.replace(/\s*-\s*YouTube$/, '').trim().slice(0, 200) };
}

export function reviewPrompt(words, url) {
  return `把所有单词加入我的复习计划，并生成单词的含义和例句。\n\n${words.map((word, i) => `${i + 1}. ${typeof word === 'string' ? word : word.word}`).join('\n')}\n\n${url}`;
}
