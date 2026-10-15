// Pure state machine. All geometry, rendering, animation and settings enter via env.
export const timing = { worry: 900, fall: 2500, sleep: 1500, hide: 8000, walkSpeed: 3, settle: 150 };

// Activity levels shape the character's routine: awake for a while (`awake`, ms), patrolling, doing small
// chores and now and then playing, in the proportions of `mix`, with only a short natural `pause` between
// actions; then tired, it rests at an end of the caption (`rest`, ms), falling asleep with chance `sleep`.
// `walk` scales walking speed; a play action does not come back for `cooldown` ms. The rest action reads
// `rest` and `sleep` from the pace it is given.
export const paces = {
  calm: { walk: 0.75, pause: [800, 2000], awake: [15000, 25000], rest: [30000, 60000], sleep: 0.85, cooldown: 240000, mix: { patrol: 3, chore: 2, play: 0.4 } },
  normal: { walk: 1, pause: [500, 1400], awake: [30000, 50000], rest: [15000, 30000], sleep: 0.6, cooldown: 120000, mix: { patrol: 3, chore: 2, play: 1 } },
  lively: { walk: 1.15, pause: [300, 900], awake: [60000, 90000], rest: [8000, 15000], sleep: 0.3, cooldown: 45000, mix: { patrol: 3, chore: 1.5, play: 2.5 } },
};
// How long an interrupted patrol or rest waits to be picked up again.
const RESUME_WITHIN = 20000;

export function createMascot(env, random = Math.random, config = timing) {
  let state = 'hidden', current = null, destination = null, ground = null, position = 1;
  let busy = false, generation = 0, missingSince = null, restSince = 0, sleeping = false, worried = false;
  let activity = null, nextActionAt = 0, lastKind = '', lastNow = null, mood = 'normal', facing = 1;
  let awakeSince = 0, awakeFor = 0, posture = 'stand', interrupted = null;
  const playedAt = new Map();
  let candidate = null, candidateSince = 0, stable = null;
  const between = (lo, hi) => lo + random() * (hi - lo);
  // The user's activity level, when the environment supplies one.
  const pace = () => env.pace?.() || paces.normal;
  const kindOf = action => action.kind || 'chore';
  function wake(now) { awakeSince = now; awakeFor = between(...pace().awake); }

  // Postures: standing, sitting or lying, from the character's `postures`. Moving between them passes through
  // each base pose on the way (standing → sitting → lying and back), so the character never jumps from
  // standing to lying. Bridge poses (a stretch) connect any posture to standing directly.
  const LEVELS = ['stand', 'sit', 'lie'];
  function postureOf(pose) {
    const postures = env.postures?.();
    if (!pose || !postures) return 'stand';
    if (postures.bridges?.includes(pose)) return 'bridge';
    return LEVELS.find(level => postures[level]?.poses.includes(pose)) || 'stand';
  }
  function setPose(pose) {
    env.pose(pose);
    const next = postureOf(pose); posture = next === 'bridge' ? 'stand' : next;
  }
  function transitions(pose) {
    const postures = env.postures?.(), to = postureOf(pose);
    if (!postures || to === 'bridge') return [];
    const from = LEVELS.indexOf(posture), target = LEVELS.indexOf(to), way = Math.sign(target - from), down = way > 0, steps = [];
    for (let level = from + way; way && level !== target + way; level += way) {
      const base = postures[LEVELS[level]]?.base;
      // Going down, the target posture's base pose is shown first unless it is the pose itself; going up, only the levels in between.
      if (!base || (level === target && (!down || base === pose))) continue;
      steps.push({ type: 'pose', pose: base, ms: postures[LEVELS[level]].ms ?? 350, bridged: true });
    }
    return steps;
  }

  // `completed` is false when something cut the action short; an interrupted rest does not refresh the cat.
  function endActivity(now, completed = false) {
    if (completed && activity?.kind === 'rest') wake(now);
    activity = null;
    setPose(null); env.prop(null); env.override(null);
    nextActionAt = now + between(...pace().pause);
  }

  // A caption expression or a caption gap cuts the action short. A patrol or a rest is kept, so the character
  // carries on walking to the same end or lies back down afterwards; anything with a prop or a body effect
  // under way, and play and chores in general, simply end.
  function interrupt(now) {
    const step = activity?.steps[activity.index];
    interrupted = null;
    if (step && ['patrol', 'rest'].includes(activity.kind) && !step.body && !step.fx && !step.prop) {
      const left = step.type === 'walk' || activity.started === null ? step.ms : Math.max(1000, step.ms - (now - activity.started));
      interrupted = { ...activity, steps: [{ ...step, ms: left, bridged: false }, ...activity.steps.slice(activity.index + 1)], index: 0, started: null, at: now };
    }
    endActivity(now);
  }

  // The routine: rest once the awake stretch is used up, otherwise patrol, a chore or play in the level's proportions.
  function startActivity(info, now) {
    const available = env.actions(info);
    if (interrupted) {
      const saved = interrupted; interrupted = null;
      if (now - saved.at < RESUME_WITHIN && available.some(action => action.id === saved.id)) { activity = saved; lastKind = saved.id; return; }
    }
    const rest = available.find(action => kindOf(action) === 'rest');
    if (rest && now - awakeSince >= awakeFor) { begin(rest, info, available); return; }
    // Incidental actions only happen as part of another action, never on their own.
    // A play action that ran recently is left out until its cooldown passes.
    const cooling = action => kindOf(action) === 'play' && now - (playedAt.get(action.id) ?? -Infinity) < pace().cooldown;
    const eligible = available.filter(action => !action.incidental && kindOf(action) !== 'rest' && !cooling(action));
    const fresh = eligible.filter(action => action.id !== lastKind);
    const choices = fresh.length ? fresh : eligible;
    if (!choices.length) { nextActionAt = now + pace().pause[1]; return; }
    // Each kind gets its share of the mix, split between its actions by their own weight.
    const { mix } = pace();
    const weight = action => (mix[kindOf(action)] ?? 1) * (action.weight ?? 1)
      / choices.filter(other => kindOf(other) === kindOf(action)).reduce((sum, other) => sum + (other.weight ?? 1), 0);
    let roll = random() * choices.reduce((sum, action) => sum + weight(action), 0);
    begin(choices.find(action => (roll -= weight(action)) < 0) || choices.at(-1), info, available, now);
  }

  function begin(plugin, info, available, now) {
    lastKind = plugin.id;
    if (kindOf(plugin) === 'play') playedAt.set(plugin.id, now);
    activity = { id: plugin.id, kind: kindOf(plugin), index: 0, started: null, steps: plugin.buildSteps({ random, position, facing, info, available, pace: pace() }) };
  }

  function stepActivity(info, now, dt) {
    const step = activity.steps[activity.index];
    if (!step) { endActivity(now, true); return; }
    const next = () => { activity.index++; activity.started = null; };
    if (!step.bridged) {
      step.bridged = true;
      const way = transitions(step.type === 'walk' ? step.pose || 'walk' : step.pose || null);
      if (way.length) {
        // Turning happens as it starts to change posture, not after it has lain down.
        for (const key of ['turn', 'face']) if (key in step) { way[0][key] = step[key]; delete step[key]; }
        activity.steps.splice(activity.index, 0, ...way); return;
      }
    }
    if (step.type === 'walk') {
      if (activity.started === null) { activity.started = now; if ('prop' in step) env.prop(step.prop); }
      const distance = (Math.max(0, Math.min(1, step.to)) - position) * info.span;
      if (info.span < info.fs * 2 || Math.abs(distance) < 2) { setPose(null); next(); return; }
      const direction = distance > 0 ? 1 : -1;
      facing = direction; env.face(direction); setPose(step.pose || 'walk');
      position += direction * Math.min(Math.abs(distance), config.walkSpeed * (step.speed || 1) * pace().walk * info.fs * dt) / info.span;
    } else if (step.type === 'wait' || step.type === 'pose') {
      if (activity.started === null) {
        activity.started = now; setPose(step.pose || null); env.override(step.mood || null);
        if (step.turn) { facing = -facing; env.face(facing); }
        if (step.face) { facing = step.face; env.face(facing); }
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
    generation++; busy = false; activity = interrupted = null; worried = false; sleeping = false;
    missingSince = null; candidate = stable = null; lastNow = null;
    setPose(null); env.prop(null); env.override(null); env.sleep(false);
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
      const previous = stable;
      if (!stable || now - candidateSince >= config.settle) stable = candidate;
      const settling = stable !== candidate;
      // Lines differ in width, so a change of line keeps the cat's x instead of its fraction of the
      // line; otherwise it slides sideways while it drops or hops to the new line.
      const rebase = point => { if (info.span > 0) position = Math.max(0, Math.min(1, (point.x - info.x0) / info.span)); };
      const target = () => ({ x: info.x0 + info.span * position, y: stable.perchY });
      if (state === 'hidden') {
        generation++; busy = false; activity = interrupted = null; env.sleep(false); env.override(null);
        // Arrives part way through an awake stretch, so the first rest is not always the same distance away.
        position = 1; nextActionAt = now + between(...pace().pause); stable = candidate;
        wake(now); awakeSince -= random() * awakeFor * 0.5;
        current = destination = target(); env.place(current); env.show(); env.pop(); state = 'perched';
      } else if (state === 'resting') {
        state = 'perched'; nextActionAt = now + between(...pace().pause); stable = candidate;
        rebase(current); go(target(), 'hop', true);
      } else if (busy) {
        if (previous !== stable) rebase(destination);
        if (!settling) destination = target();
      } else {
        if (previous !== stable) rebase(current);
        // While the new line settles, hold still where the old one was.
        if (!settling) {
          if (activity) stepActivity(info, now, dt);
          else if (mood === 'normal' && !env.calm() && now >= nextActionAt) startActivity(info, now);
        }
        const to = settling ? { x: current.x, y: stable.perchY } : target();
        const smooth = dt > 0 ? 1 - Math.exp(-dt * 18) : 1;
        const next = { x: current.x + (to.x - current.x) * smooth, y: to.y };
        const dy = to.y - current.y;
        if (Math.abs(dy) > info.fs * 0.6) go(to, dy > 0 ? 'fall' : 'hop', false);
        else { current = next; env.place(current); }
      }
      ground = { x: current.x, y: stable.groundY };
    } else if (state === 'perched') {
      if (missingSince === null) missingSince = now;
      const gone = now - missingSince;
      if (gone >= config.worry && !worried) { worried = true; interrupt(now); env.override('nervous'); }
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
      interrupted = null; begin(plugin, info, env.actions(info), lastNow || 0); return true;
    },
    nod() { if (state === 'perched' && !busy && !activity) env.nod(); },
    setMood(value) {
      mood = value; env.setMood(value);
      if (value !== 'normal' && activity) interrupt(lastNow || 0);
    },
    snapshot: () => ({ state, position, activity: activity?.id || null, busy, sleeping }),
  };
}
