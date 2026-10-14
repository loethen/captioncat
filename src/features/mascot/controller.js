// Pure state machine. All geometry, rendering, animation and settings enter via env.
export const timing = {
  worry: 900, fall: 2500, sleep: 1500, hide: 8000, firstAction: 1200,
  actionGap: [1200, 3500], walkSpeed: 3, settle: 150,
};

export function createMascot(env, random = Math.random, config = timing) {
  let state = 'hidden', current = null, destination = null, ground = null, position = 1;
  let busy = false, generation = 0, missingSince = null, restSince = 0, sleeping = false, worried = false;
  let activity = null, nextActionAt = 0, lastKind = '', lastNow = null, mood = 'normal', facing = 1;
  let candidate = null, candidateSince = 0, stable = null;
  const between = (lo, hi) => lo + random() * (hi - lo);

  function endActivity(now) {
    activity = null;
    env.pose(null); env.prop(null); env.override(null);
    nextActionAt = now + between(...config.actionGap);
  }

  function startActivity(info, now) {
    const available = env.actions(info);
    // Incidental actions only happen as part of another action, never on their own.
    const eligible = available.filter(action => !action.incidental);
    const fresh = eligible.filter(action => action.id !== lastKind);
    const choices = fresh.length ? fresh : eligible;
    if (!choices.length) { nextActionAt = now + config.actionGap[1]; return; }
    begin(choices[Math.floor(random() * choices.length)], info, available);
  }

  function begin(plugin, info, available) {
    lastKind = plugin.id;
    activity = { id: plugin.id, index: 0, started: null, steps: plugin.buildSteps({ random, position, facing, info, available }) };
  }

  function stepActivity(info, now, dt) {
    const step = activity.steps[activity.index];
    if (!step) { endActivity(now); return; }
    const next = () => { activity.index++; activity.started = null; };
    if (step.type === 'walk') {
      if (activity.started === null) { activity.started = now; if ('prop' in step) env.prop(step.prop); }
      const distance = (Math.max(0, Math.min(1, step.to)) - position) * info.span;
      if (info.span < info.fs * 2 || Math.abs(distance) < 2) { env.pose(null); next(); return; }
      const direction = distance > 0 ? 1 : -1;
      facing = direction; env.face(direction); env.pose(step.pose || 'walk');
      position += direction * Math.min(Math.abs(distance), config.walkSpeed * (step.speed || 1) * info.fs * dt) / info.span;
    } else if (step.type === 'wait' || step.type === 'pose') {
      if (activity.started === null) {
        activity.started = now; env.pose(step.pose || null); env.override(step.mood || null);
        if (step.turn) { facing = -facing; env.face(facing); }
        if ('prop' in step) env.prop(step.prop);
        if (step.fx) env.propFx(step.fx);
        if (step.body) env.bodyFx(step.body);
      }
      if (now - activity.started >= step.ms) next();
    } else {
      // An invalid plugin cannot leave the mascot stuck forever.
      endActivity(now);
    }
  }

  function go(target, kind, react) {
    const token = ++generation;
    busy = true; destination = target;
    env.override(react ? (kind === 'fall' ? 'wow' : 'happy') : null);
    env.move(current, target, kind, () => {
      if (token !== generation) return;
      busy = false; current = destination; env.place(current); env.override(null);
      if (kind === 'fall') env.land();
    });
  }

  function reset(fade = false) {
    generation++; busy = false; activity = null; worried = false; sleeping = false;
    missingSince = null; candidate = stable = null; lastNow = null;
    env.pose(null); env.prop(null); env.override(null); env.sleep(false);
    if (fade) env.fade(); else env.hide();
    state = 'hidden';
  }

  function tick(now) {
    const dt = lastNow === null ? 0 : Math.max(0, Math.min(0.1, (now - lastNow) / 1000));
    lastNow = now;
    if (!env.active()) { if (state !== 'hidden') reset(); return; }
    const info = env.info();
    if (info) {
      missingSince = null;
      if (worried) { worried = false; env.override(null); }
      if (sleeping) { sleeping = false; env.sleep(false); }
      env.size(info.size);
      const tolerance = Math.max(2, info.fs * 0.08);
      if (!candidate || Math.abs(info.perchY - candidate.perchY) > tolerance || Math.abs(info.groundY - candidate.groundY) > tolerance) {
        candidate = { perchY: info.perchY, groundY: info.groundY }; candidateSince = now;
      }
      if (!stable || now - candidateSince >= config.settle) stable = candidate;
      const target = () => ({ x: info.x0 + info.span * position, y: stable.perchY });
      if (state === 'hidden') {
        generation++; busy = false; activity = null; env.sleep(false); env.override(null);
        position = 1; nextActionAt = now + config.firstAction; stable = candidate;
        current = destination = target(); env.place(current); env.show(); env.pop(); state = 'perched';
      } else if (state === 'resting') {
        state = 'perched'; nextActionAt = now + config.firstAction; stable = candidate;
        go(target(), 'hop', true);
      } else if (busy) {
        destination = target();
      } else {
        if (activity) stepActivity(info, now, dt);
        else if (mood === 'normal' && !env.calm() && now >= nextActionAt) startActivity(info, now);
        const to = target();
        const smooth = dt > 0 ? 1 - Math.exp(-dt * 18) : 1;
        const next = { x: current.x + (to.x - current.x) * smooth, y: to.y };
        const dy = to.y - current.y;
        if (Math.abs(dy) > info.fs * 0.6) go(next, dy > 0 ? 'fall' : 'hop', false);
        else { current = next; env.place(current); }
      }
      ground = { x: current.x, y: stable.groundY };
    } else if (state === 'perched') {
      if (missingSince === null) missingSince = now;
      const gone = now - missingSince;
      if (gone >= config.worry && !worried) { worried = true; endActivity(now); env.override('nervous'); }
      if (gone >= config.fall && ground) {
        worried = false; state = 'resting'; restSince = now; go(ground, 'fall', true);
      }
    } else if (state === 'resting') {
      if (!sleeping && now - restSince > config.sleep) { sleeping = true; env.sleep(true); }
      if (now - restSince > config.hide) reset(true);
    }
  }

  return {
    tick, reset,
    // Starts the given action immediately (settings preview); false when the mascot is not standing on a caption.
    play(plugin) {
      const info = env.info();
      if (state !== 'perched' || busy || !info) return false;
      if (activity) endActivity(lastNow || 0);
      begin(plugin, info, env.actions(info)); return true;
    },
    nod() { if (state === 'perched' && !busy && !activity) env.nod(); },
    setMood(value) {
      mood = value; env.setMood(value);
      if (value !== 'normal' && activity) endActivity(lastNow || 0);
    },
    snapshot: () => ({ state, position, activity: activity?.id || null, busy, sleeping }),
  };
}
