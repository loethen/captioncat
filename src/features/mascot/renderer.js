import { element } from '../../shared/dom.js';

// Default renderer for packaged SVG / PNG / animated WebP / GIF character packs.
// A character may supply createRenderer(context) with this same interface.
export function createAssetRenderer({ character, assetURL, reduced }) {
  const outer = element('div', 'ytc-mascot');
  outer.dataset.ytcOverlay = '';
  outer.setAttribute('aria-hidden', 'true');
  const flip = element('div', 'ytc-mascot-flip');
  const inner = element('img', 'ytc-mascot-art');
  const prop = element('img', 'ytc-mascot-prop');
  inner.alt = prop.alt = ''; inner.draggable = prop.draggable = false;
  flip.append(inner, prop); outer.append(flip);
  let mood = 'normal', override = null, pose = null, asleep = false, direction = 1, size = 0;
  let moveAnimation, fadeAnimation, propAnimation;
  const canAnimate = () => !reduced() && typeof outer.animate === 'function';
  const translate = point => `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
  const cancel = animation => animation?.cancel();
  function paint() {
    const key = asleep ? 'sleepy' : override || pose || mood;
    const asset = character.states[key] || character.states.normal;
    const src = assetURL(asset.src);
    if (inner.getAttribute('src') !== src) inner.src = src;
    flip.style.transform = direction < 0 && asset.mirror !== false ? 'scaleX(-1)' : '';
  }
  function play(node, frames, options) { if (canAnimate()) node.animate(frames, options); }
  paint();
  return {
    mount(player) { if (outer.parentElement !== player) player.append(outer); },
    size(px) { if (size !== px) { size = px; outer.style.width = outer.style.height = `${px}px`; } },
    place(point) { outer.style.transform = translate(point); },
    show() { cancel(fadeAnimation); outer.style.display = 'block'; outer.style.opacity = ''; paint(); },
    hide() { cancel(moveAnimation); cancel(fadeAnimation); cancel(propAnimation); outer.style.display = 'none'; },
    fade() {
      if (!canAnimate()) { outer.style.display = 'none'; return; }
      fadeAnimation = outer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
      fadeAnimation.onfinish = () => { outer.style.display = 'none'; };
    },
    move(from, to, kind, done) {
      cancel(moveAnimation);
      if (!canAnimate()) { done(); return; }
      const distance = Math.abs(to.y - from.y);
      let frames = [{ transform: translate(from) }, { transform: translate(to) }];
      let options = { duration: Math.max(170, Math.min(380, 140 + distance * 1.1)), easing: 'cubic-bezier(.5,0,.9,.55)' };
      if (kind === 'hop') {
        const lift = Math.max(size * 0.35, Math.min(size * 0.9, distance * 0.6));
        const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
        frames = [{ transform: translate(from) }, { transform: translate(mid), offset: 0.5 }, { transform: translate(to) }];
        options = { duration: Math.max(300, Math.min(520, 280 + distance * 0.8)), easing: 'ease-in-out' };
      }
      const animation = outer.animate(frames, { ...options, fill: 'forwards' });
      moveAnimation = animation;
      animation.onfinish = () => { done(); animation.cancel(); if (moveAnimation === animation) moveAnimation = null; };
    },
    pop() { play(inner, [{ transform: 'translateY(70%) scale(.55)', opacity: 0 }, { transform: 'translateY(-8%) scale(1.06)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'ease-out' }); },
    nod() { play(inner, [{ transform: 'none' }, { transform: 'translateY(6%) scale(1.06,.9)', offset: 0.3 }, { transform: 'translateY(-14%) scale(.96,1.06)', offset: 0.6 }, { transform: 'none' }], { duration: 450 }); },
    land() { play(inner, [{ transform: 'scale(1.14,.82)' }, { transform: 'scale(.97,1.05)', offset: 0.55 }, { transform: 'none' }], { duration: 300 }); },
    setMood(value) { if (mood !== value) { mood = value; paint(); } },
    override(value) { if (override !== value) { override = value; paint(); } },
    pose(value) { if (pose !== value) { pose = value; paint(); } },
    sleep(value) { if (asleep !== value) { asleep = value; paint(); } },
    face(value) { if (direction !== value) { direction = value; paint(); } },
    prop(name) {
      cancel(propAnimation);
      const asset = character.props?.[name];
      prop.style.cssText = '';
      if (!asset) { prop.style.display = 'none'; prop.removeAttribute('src'); return; }
      Object.assign(prop.style, { display: 'block', ...asset.box }); prop.src = assetURL(asset.src);
    },
    throwProp() {
      if (canAnimate()) propAnimation = prop.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(120%,-130%) rotate(220deg)', opacity: 1, offset: 0.4 }, { transform: 'translate(250%,200%) rotate(540deg)', opacity: 0 }], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
    },
    dispose() { this.hide(); outer.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); outer.remove(); },
  };
}
