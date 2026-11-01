// Pointer-led depth for the pop-up book. It writes `translate`, so the opening's `transform` keeps running.
// `translate` opens a stacking context, so only elements with their own z-index may be listed: moving `.characters` would bury the models under the paper.
const REACH = 14, RISE = .35, EASE = .09, REST = .04;
const DEPTHS = [['.home-sun', .12], ['.home-far', .16], ['.home-cloud', .2], ['.home-village-left, .home-village-right, .home-snowfield', .3], ['.home-ground', .42], ['.home-pond, .home-mid', .5], ['.characters-canvas, .character-stage', .6], ['.home-near-left, .home-near-right', .85], ['.home-bank', .92], ['.home-front', 1]];

// Layers lean away from the pointer; every sheet overhangs the stage by more than REACH.
export function panFor(x, y, width, height) {
  const across = Math.max(-1, Math.min(1, x / width * 2 - 1)), down = Math.max(-1, Math.min(1, y / height * 2 - 1));
  return { x: -across * REACH, y: -down * REACH * RISE };
}
export function easePan(current, target) {
  const x = current.x + (target.x - current.x) * EASE, y = current.y + (target.y - current.y) * EASE;
  const settled = Math.abs(target.x - x) < REST && Math.abs(target.y - y) < REST;
  return settled ? { ...target, settled } : { x, y, settled };
}

export function mountParallax(root) {
  const mouse = matchMedia('(hover: hover) and (pointer: fine)'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  // The model canvas appears only after its GLB loads, so layers are collected at each wake.
  const collect = () => DEPTHS.flatMap(([selector, depth]) => [...root.querySelectorAll(selector)].map(element => ({ element, depth })));
  const allowed = () => mouse.matches && !motion.matches;
  let layers = [], target = { x: 0, y: 0 }, current = { x: 0, y: 0 }, frame = null;
  const paint = () => layers.forEach(({ element, depth }) => { element.style.translate = `${(current.x * depth).toFixed(2)}px ${(current.y * depth).toFixed(2)}px`; });
  const clear = () => layers.forEach(({ element }) => { element.style.translate = ''; });
  function tick() {
    current = easePan(current, target); paint();
    frame = current.settled ? null : requestAnimationFrame(tick);
  }
  const wake = () => { if (frame === null) { layers = collect(); frame = requestAnimationFrame(tick); } };
  const onMove = event => { if (event.pointerType !== 'mouse' || !allowed()) return; target = panFor(event.clientX, event.clientY, innerWidth, innerHeight); wake(); };
  const onLeave = () => { target = { x: 0, y: 0 }; if (allowed()) wake(); };
  const stop = () => { cancelAnimationFrame(frame); frame = null; target = { x: 0, y: 0 }; current = { x: 0, y: 0 }; clear(); };
  const onChange = () => { if (!allowed()) stop(); };
  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  motion.addEventListener('change', onChange); mouse.addEventListener('change', onChange);
  return { destroy() { stop(); removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('mouseleave', onLeave); motion.removeEventListener('change', onChange); mouse.removeEventListener('change', onChange); } };
}
