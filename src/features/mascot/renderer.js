import './styles.css';
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
  let moveAnimation, fadeAnimation, propAnimation, bodyAnimation;
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
  // Whole-body moves an action step can request with `body`. Effects with fill: 'forwards'
  // keep the character off its spot (in a box, hanging off the edge) until the pose is cleared.
  const hold = { fill: 'forwards' };
  const bodyEffects = {
    poke: [[{ transform: 'none' }, { transform: 'translateX(11%)', offset: 0.45 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' }],
    dive: [[{ transform: 'none' }, { transform: 'translate(40%,-38%)', offset: 0.5 }, { transform: 'translate(75%,0)' }], { duration: 350, ...hold }],
    bail: [[{ transform: 'translate(75%,0)' }, { transform: 'translate(35%,-60%)', offset: 0.5 }, { transform: 'none' }], { duration: 500 }],
    overstep: [[{ transform: 'none' }, { transform: 'translateX(122%)' }], { duration: 1560, ...hold }],
    gasp: [[{ transform: 'translateX(122%)' }, { transform: 'translate(122%,-10%)', offset: 0.35 }, { transform: 'translateX(122%)' }], { duration: 300, easing: 'ease-out', ...hold }],
    drop: [[{ transform: 'translateX(122%)' }, { transform: 'translate(110%,48%)' }], { duration: 260, easing: 'ease-in', ...hold }],
    cling: [[{ transform: 'translate(-110%,48%)' }, { transform: 'translate(-110%,48%)' }], { duration: 1, ...hold }],
    climb: [[{ transform: 'translate(-110%,48%)' }, { transform: 'translate(-70%,-22%)', offset: 0.55 }, { transform: 'none' }], { duration: 600, easing: 'ease-out' }],
    lunge: [[{ transform: 'none' }, { transform: 'translate(18%,-28%)', offset: 0.4 }, { transform: 'translate(10%,0)', offset: 0.75 }, { transform: 'none' }], { duration: 450, easing: 'ease-out' }],
    jump: [[{ transform: 'none', easing: 'cubic-bezier(.2,.7,.4,1)' }, { transform: 'translateY(-45%)', offset: 0.45, easing: 'cubic-bezier(.6,0,.8,.4)' }, { transform: 'none' }], { duration: 700 }],
    recoil: [[{ transform: 'none' }, { transform: 'translate(-20%,-8%)', offset: 0.25 }, { transform: 'none' }], { duration: 340, easing: 'ease-out' }],
  };
  function play(node, frames, options) { if (canAnimate()) node.animate(frames, options); }
  paint();
  return {
    mount(player) { if (outer.parentElement !== player) player.append(outer); },
    size(px) { if (size !== px) { size = px; outer.style.width = outer.style.height = `${px}px`; } },
    place(point) { outer.style.transform = translate(point); },
    show() { cancel(fadeAnimation); outer.style.display = 'block'; outer.style.opacity = ''; paint(); },
    hide() { cancel(moveAnimation); cancel(fadeAnimation); cancel(propAnimation); cancel(bodyAnimation); outer.style.display = 'none'; },
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
    bodyFx(name) {
      if (!bodyEffects[name] || !canAnimate()) return;
      cancel(bodyAnimation); bodyAnimation = inner.animate(...bodyEffects[name]);
    },
    setMood(value) { if (mood !== value) { mood = value; paint(); } },
    override(value) { if (override !== value) { override = value; paint(); } },
    pose(value) {
      if (!value) cancel(bodyAnimation);
      if (pose !== value) { pose = value; paint(); }
    },
    sleep(value) { if (asleep !== value) { asleep = value; paint(); } },
    face(value) { if (direction !== value) { direction = value; paint(); } },
    prop(name) {
      cancel(propAnimation);
      const asset = character.props?.[name];
      prop.style.cssText = '';
      if (!asset) { prop.style.display = 'none'; prop.removeAttribute('src'); return; }
      Object.assign(prop.style, { display: 'block', ...asset.box }); prop.src = assetURL(asset.src);
    },
    propFx(name) {
      if (!canAnimate()) return;
      cancel(propAnimation);
      if (name === 'enter') propAnimation = prop.animate([{ transform: 'translateX(120%)' }, { transform: 'none' }], { duration: 600, easing: 'ease-out', fill: 'forwards' });
      else if (name === 'appear') propAnimation = prop.animate([{ transform: 'translateY(-60%) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'ease-out' });
      else if (name === 'nudge1') propAnimation = prop.animate([{ transform: 'none' }, { transform: 'translateX(40%)' }], { duration: 260, delay: 120, easing: 'ease-out', fill: 'forwards' });
      else if (name === 'nudge2') propAnimation = prop.animate([{ transform: 'translateX(40%)' }, { transform: 'translateX(85%)' }], { duration: 260, delay: 120, easing: 'ease-out', fill: 'both' });
      else if (name === 'tip') propAnimation = prop.animate([{ transform: 'translateX(85%)', opacity: 1 }, { transform: 'translate(170%,50%) rotate(70deg)', opacity: 1, offset: 0.35 }, { transform: 'translate(230%,520%) rotate(220deg)', opacity: 0 }], { duration: 700, delay: 120, easing: 'ease-in', fill: 'both' });
      else if (name === 'vanish') propAnimation = prop.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
      else if (name === 'wave') propAnimation = prop.animate([{ transform: 'translateY(-45%) rotate(-3deg)' }, { transform: 'translateY(35%) rotate(3deg)' }], { duration: 520, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      else if (name === 'jitter') propAnimation = prop.animate([{ transform: 'none' }, { transform: 'translate(130%,-40%)' }, { transform: 'translate(-70%,0)' }, { transform: 'translate(60%,-90%)' }, { transform: 'none' }], { duration: 640, iterations: Infinity, easing: 'ease-in-out' });
      else if (name === 'yank') propAnimation = prop.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(130%,-130%)', opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    },
    dispose() { this.hide(); outer.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); outer.remove(); },
  };
}
