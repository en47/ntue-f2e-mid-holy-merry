// The map stays rolled up until asked for; the sheet is inert while it is hidden.
export function mountIntroScroll(root, { sleigh } = {}) {
  const stage = root.querySelector('[data-scroll="stage"]'), sheet = root.querySelector('[data-scroll="sheet"]'), letter = root.querySelector('[data-scroll="letter"]');
  const toggles = [...root.querySelectorAll('[data-scroll="toggle"]')], fold = root.querySelector('[data-scroll="fold"]');
  const shortcuts = root.querySelector('#intro-country-shortcuts');
  let open = false, onScreen = true;
  const run = () => { if (open && onScreen) sleigh?.unpauseAnimations?.(); else sleigh?.pauseAnimations?.(); };
  function set(next) {
    open = next;
    stage.dataset.state = next ? 'open' : 'rolled';
    sheet.inert = !next; letter.inert = next; shortcuts.hidden = !next; fold.hidden = !next;
    for (const button of toggles) button.setAttribute('aria-expanded', String(next));
    run();
  }
  const handlers = [[root.querySelector('[data-scroll="open"]'), () => set(true)], [fold, () => set(false)], ...toggles.map(button => [button, () => set(!open)])];
  handlers.forEach(([element, handler]) => element.addEventListener('click', handler));
  const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; run(); });
  observer.observe(stage);
  set(false);
  return { destroy() { observer.disconnect(); handlers.forEach(([element, handler]) => element.removeEventListener('click', handler)); } };
}
