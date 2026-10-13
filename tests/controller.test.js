import test from 'node:test';
import assert from 'node:assert/strict';
import { createMascot } from '../src/features/mascot/controller.js';

function fixture() {
  const calls = []; let info = { fs: 20, size: 56, x0: 50, span: 200, perchY: 200, groundY: 250 }, active = true, calm = false, actions = [], completion;
  const env = { active: () => active, calm: () => calm, info: () => info, actions: () => actions };
  for (const method of ['pose', 'prop', 'override', 'sleep', 'hide', 'fade', 'size', 'place', 'show', 'pop', 'land', 'nod', 'face', 'setMood', 'throwProp', 'propFx', 'bodyFx']) env[method] = (...args) => calls.push([method, ...args]);
  env.move = (from, to, kind, done) => { calls.push(['move', from, to, kind]); completion = done; };
  const mascot = createMascot(env, () => 0.5);
  return { mascot, calls, setInfo: value => { info = value; }, setActive: value => { active = value; }, setCalm: value => { calm = value; }, setActions: value => { actions = value; }, complete: () => completion?.() };
}
test('brief caption gaps stay perched; prolonged gaps fall, sleep and fade', () => {
  const f = fixture(); f.mascot.tick(0); assert.equal(f.mascot.snapshot().state, 'perched');
  f.setInfo(null); f.mascot.tick(100); f.mascot.tick(800); assert.equal(f.calls.some(call => call[0] === 'move'), false);
  f.mascot.tick(1100); assert.ok(f.calls.some(call => call[0] === 'override' && call[1] === 'nervous'));
  f.mascot.tick(2700); assert.equal(f.mascot.snapshot().state, 'resting'); f.complete();
  f.mascot.tick(4300); assert.equal(f.mascot.snapshot().sleeping, true);
  f.mascot.tick(10800); assert.equal(f.mascot.snapshot().state, 'hidden'); assert.ok(f.calls.some(call => call[0] === 'fade'));
});
test('caption scrolling waits for stable geometry before changing levels', () => {
  const f = fixture(); f.mascot.tick(0);
  f.setInfo({ fs: 20, size: 56, x0: 50, span: 200, perchY: 160, groundY: 210 }); f.mascot.tick(50);
  f.setInfo({ fs: 20, size: 56, x0: 50, span: 200, perchY: 120, groundY: 170 }); f.mascot.tick(100);
  assert.equal(f.calls.some(call => call[0] === 'move'), false);
  f.mascot.tick(260); assert.equal(f.calls.filter(call => call[0] === 'move').length, 1);
});
test('generic plugin steps run without adding a controller branch', () => {
  const f = fixture();
  f.setActions([{ id: 'new-plugin', buildSteps: () => [{ type: 'pose', pose: 'custom', prop: 'custom-prop', ms: 100 }] }]);
  f.mascot.tick(0); f.mascot.tick(1300); assert.equal(f.mascot.snapshot().activity, 'new-plugin');
  f.mascot.tick(1400); assert.ok(f.calls.some(call => call[0] === 'pose' && call[1] === 'custom'));
  f.mascot.tick(1600); f.mascot.tick(1700); assert.equal(f.mascot.snapshot().activity, null);
});
test('content mood cancels an activity and clears props', () => {
  const f = fixture(); f.setActions([{ id: 'custom', buildSteps: () => [{ type: 'wait', ms: 9999 }] }]);
  f.mascot.tick(0); f.mascot.tick(1300); f.mascot.setMood('wow');
  assert.equal(f.mascot.snapshot().activity, null); assert.ok(f.calls.some(call => call[0] === 'prop' && call[1] === null));
});
test('disabled/reduced-motion modes and stale animation completions are safe', () => {
  const f = fixture(); f.setCalm(true); f.setActions([{ id: 'custom', buildSteps: () => [] }]);
  f.mascot.tick(0); f.mascot.tick(5000); assert.equal(f.mascot.snapshot().activity, null);
  f.setInfo(null); f.mascot.tick(5100); f.mascot.tick(8000); f.setActive(false); f.mascot.tick(8100);
  const before = f.calls.length; f.complete(); assert.equal(f.calls.length, before); assert.equal(f.mascot.snapshot().state, 'hidden');
  f.setActive(true); f.setInfo({ fs: 20, size: 56, x0: 0, span: 0, perchY: 200, groundY: 250 }); f.mascot.tick(8200);
  assert.equal(f.mascot.snapshot().sleeping, false);
});
