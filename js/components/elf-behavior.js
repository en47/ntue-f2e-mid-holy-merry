export const ELF_RETURN_DELAY = 2;
export const ELF_RETURN_DURATION = 1.05;
export const elfWrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const ease = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// All distances are in the existing scene's world units. No DOM, mixer, or timers here.
export function createElfBehavior({ random = Math.random, durations = {}, reduced = false } = {}) {
  let route = null, x = null, yaw = 0, clock = 0, interactive = false, pressed = false;
  let state = 'wandering', routine = 'rest', clip = 'look_around', elapsed = 0, duration = .6, version = 0;
  let travel = null, returning = null, lastRoutine = null, lastWish = null, lastDance = null;
  const cooldowns = new Map();
  const range = (a, b) => a + random() * (b - a);
  const routines = [
    { id: 'walk', weight: 7, cooldown: 0 },
    { id: 'look', weight: 2.4, cooldown: 8 },
    { id: 'rest', weight: 1.2, cooldown: 10 },
    ...Object.keys(durations).filter(name => /^dance_/.test(name)).map(id => ({ id, weight: 1.1, cooldown: 75 })),
  ];
  const dances = routines.filter(value => /^dance_/.test(value.id));
  let nextDanceAt = range(45, 75);
  function start(id, reaction = false) {
    const previousTravel = travel;
    routine = id; elapsed = 0; travel = null; returning = null; version++;
    clip = id === 'walk' ? 'walk' : /^dance_/.test(id) ? id : 'look_around';
    duration = durations[clip] || 1;
    state = reaction ? 'wishReaction' : id === 'walk' ? 'walking' : id === 'rest' ? 'wandering' : 'performing';
    if (id === 'rest' && random() < .25) duration *= 2; // Complete native idle cycles, not a truncated gesture.
    if (/^dance_/.test(id)) { lastDance = id; nextDanceAt = clock + duration + 75; }
    if (id === 'walk') {
      const options = route?.points.filter(point => Math.abs(point - x) >= route.height * .3) || [];
      if (!options.length) { start('rest'); return; }
      const forward = previousTravel ? options.filter(point => (point - x) * Math.sign(previousTravel.to - previousTravel.from) > 0) : [];
      // Source foot-contact speed is about .29 body heights/sec. Favor waypoints
      // close to complete strides rather than speeding the model across the snow.
      const travelOptions = (forward.length ? forward : options).map(to => {
        const distance = Math.abs(to - x), cycles = Math.max(1, Math.round(distance / (route.height * .29 * durations.walk)));
        const mismatch = Math.abs(distance / (cycles * durations.walk) / route.height - .29) / .29;
        return { to, cycles, score: mismatch + random() * .12 };
      }).sort((a, b) => a.score - b.score);
      const { to, cycles } = travelOptions[0];
      duration = cycles * durations.walk;
      travel = { from: x, to, yaw: to > x ? Math.PI / 2 : -Math.PI / 2 };
    }
    const cooldown = routines.find(value => value.id === id)?.cooldown ?? 8;
    cooldowns.set(id, clock + duration + cooldown);
  }
  function schedule() {
    const options = routines.filter(option => (option.id === 'walk' || option.id !== lastRoutine) && (cooldowns.get(option.id) || 0) <= clock
      && (option.id !== 'walk' || (route && route.right - route.left > route.height * .3 && durations.walk))
      && (!/^dance_/.test(option.id) || (clock >= nextDanceAt && (dances.length < 2 || option.id !== lastDance))));
    if (!options.length) { start('rest'); return; }
    let ticket = random() * options.reduce((sum, option) => sum + option.weight, 0);
    start((options.find(option => (ticket -= option.weight) <= 0) || options.at(-1)).id);
  }
  function returnToFront(delay, seconds = ELF_RETURN_DURATION) {
    if (reduced) { yaw = 0; returning = null; state = 'idleInteractive'; return; }
    returning = { delay, seconds, elapsed: 0, from: elfWrap(yaw) };
    state = delay ? 'idleInteractive' : 'returningToFront';
  }
  function setRoute(next) {
    if (!next || next.right < next.left) return;
    const hadRoute = !!route;
    const changed = !route || Math.abs(route.left - next.left) > .001 || Math.abs(route.right - next.right) > .001;
    route = { ...next, points: [0, .33, .7, 1].map(value => next.left + (next.right - next.left) * value) };
    if (x === null) {
      x = route.left;
      if (!interactive && !reduced && durations.walk && route.right - route.left > route.height * .3) start('walk');
    }
    else x = clamp(x, route.left, route.right);
    if (hadRoute && changed && travel) start('rest'); // Resize safety; never teleport back to spawn on a tap.
  }
  function toggle() {
    interactive = !interactive; pressed = false;
    if (interactive) { start('rest'); routine = 'idle'; clip = 'look_around'; returnToFront(0, .55); }
    else { start('rest'); duration = .55; }
    return interactive;
  }
  function beginPointer() { pressed = true; returning = null; if (interactive) state = 'idleInteractive'; }
  function beginDrag() {
    if (!interactive) { interactive = true; start('rest'); routine = 'idle'; clip = 'look_around'; }
    pressed = true; returning = null; state = 'dragging';
  }
  function dragTo(angle) { if (!interactive) return; yaw = angle; returning = null; state = 'dragging'; }
  function endPointer(moved = false) {
    pressed = false;
    if (interactive && (moved || Math.abs(elfWrap(yaw)) > .001)) returnToFront(ELF_RETURN_DELAY);
  }
  function rotateBy(angle) { if (!interactive) return; yaw += angle; returnToFront(ELF_RETURN_DELAY); }
  function setReduced(value) {
    reduced = value; returning = null; pressed = false;
    start('rest'); clip = 'look_around';
    if (interactive) { state = 'idleInteractive'; yaw = 0; }
  }
  function wishDelivered(id) {
    if (!id || id === lastWish) return false;
    lastWish = id;
    if (interactive || pressed || reduced || !route) return false;
    start(durations.dance_05 ? 'dance_05' : 'look', true);
    return true;
  }
  function snapshot() {
    return { state, interactive, held: pressed, x, yaw, clip, routine, version, elapsed, duration,
      loop: routine === 'walk' || interactive || routine === 'rest', needsFrame: !!route && (!reduced || !!returning) };
  }
  function tick(dt) {
    dt = Math.max(0, dt);
    if (!route || pressed || reduced) return snapshot();
    clock += dt;
    if (interactive) {
      if (returning) {
        if (returning.delay > 0) returning.delay = Math.max(0, returning.delay - dt);
        else {
          state = 'returningToFront'; returning.elapsed += dt;
          const progress = clamp(returning.elapsed / returning.seconds, 0, 1);
          yaw = returning.from * (1 - ease(progress));
          if (progress === 1) { yaw = 0; returning = null; state = 'idleInteractive'; }
        }
      }
      return snapshot();
    }
    elapsed += dt;
    if (travel) {
      x = travel.from + (travel.to - travel.from) * clamp(elapsed / duration, 0, 1);
      yaw += elfWrap(travel.yaw - yaw) * (1 - Math.exp(-7 * dt));
    } else yaw += elfWrap(-yaw) * (1 - Math.exp(-5 * dt));
    if (elapsed >= duration) { lastRoutine = routine; schedule(); }
    return snapshot();
  }
  return { tick, snapshot, setRoute, toggle, beginPointer, beginDrag, dragTo, endPointer, rotateBy, setReduced, wishDelivered };
}

// Keep one connected lane on the shared ground, clear of low UI.
// A foreground lane may pass the tree in X when its actual Z depth clears the trunk.
export function safeElfRoute({ lane, groundY, height, obstacles, tree }) {
  const half = height * .45, gap = Math.max(8, height * .1);
  let intervals = [[lane.left + half, lane.left + lane.width - half]].filter(([left, right]) => right >= left);
  const occupied = obstacles.filter(rect => rect.top < groundY + 4 && rect.bottom > groundY - height - 6)
    .map(rect => [rect.left - half - gap, rect.left + rect.width + half + gap]);
  const crossesTreeDepth = tree && (!Number.isFinite(lane.z) || Math.abs(lane.z - (tree.z || 0)) < tree.radius + half + gap);
  if (crossesTreeDepth) occupied.push([tree.x - tree.radius - half - gap, tree.x + tree.radius + half + gap]);
  for (const [left, right] of occupied) intervals = intervals.flatMap(([a, b]) => b <= left || a >= right ? [[a, b]] : [[a, Math.min(b, left)], [Math.max(a, right), b]].filter(([x, y]) => y > x));
  intervals.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const usable = intervals[0];
  if (!usable) return null; // No safe route: keep the last safe pose, never walk through an input.
  return { left: usable[0], right: usable[1], height };
}
