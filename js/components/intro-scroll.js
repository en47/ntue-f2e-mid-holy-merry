// The map stays rolled up until asked for; the sheet is inert while it is hidden.
export function mountIntroScroll(root, { sleigh } = {}) {
  const stage = root.querySelector('[data-scroll="stage"]'), sheet = root.querySelector('[data-scroll="sheet"]'), letter = root.querySelector('[data-scroll="letter"]');
  const toggles = [...root.querySelectorAll('[data-scroll="toggle"]')], fold = root.querySelector('[data-scroll="fold"]');
  const shortcuts = root.querySelector('#intro-country-shortcuts');
  let open = false, onScreen = true, settle;
  const run = () => { if (open && onScreen) sleigh?.unpauseAnimations?.(); else sleigh?.pauseAnimations?.(); };
  // One smooth scroll that frames the map and its buttons, like opening the book; scrolling stays free.
  function frameMap() {
    const top = sheet.getBoundingClientRect().top, bottom = root.querySelector('.intro-map-actions').getBoundingClientRect().bottom;
    const span = bottom - top, offset = span < innerHeight ? top - (innerHeight - span) / 2 : top - 12;
    scrollTo({ top: Math.max(0, scrollY + offset), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function set(next) {
    open = next;
    stage.dataset.state = next ? 'open' : 'rolled';
    sheet.inert = !next; letter.inert = next; shortcuts.hidden = !next; fold.hidden = !next;
    for (const button of toggles) button.setAttribute('aria-expanded', String(next));
    // The sleigh waits until the sheet has landed, so the map is not repainted while it slides.
    clearTimeout(settle); sleigh?.pauseAnimations?.();
    settle = setTimeout(run, 1150);
    if (next) frameMap();
  }
  const handlers = [[root.querySelector('[data-scroll="open"]'), () => set(true)], [fold, () => set(false)], ...toggles.map(button => [button, () => set(!open)])];
  handlers.forEach(([element, handler]) => element.addEventListener('click', handler));
  const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; run(); });
  observer.observe(stage);
  set(false);
  return { destroy() { clearTimeout(settle); observer.disconnect(); handlers.forEach(([element, handler]) => element.removeEventListener('click', handler)); } };
}
