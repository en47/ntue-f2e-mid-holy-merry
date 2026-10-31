export function mountElfInteraction(target, behavior, wake, { pointerEvents = true } = {}) {
  let pointer = null, suppressClick = false;
  const cleanups = [];
  const listen = (type, fn, options) => {
    if (!pointerEvents && /^(pointer|lostpointercapture)/.test(type)) return;
    target.addEventListener(type, fn, options); cleanups.push(() => target.removeEventListener(type, fn, options));
  };
  function release(event, cancelled = false) {
    if (!pointer || (event?.pointerId !== undefined && event.pointerId !== pointer.id)) return;
    const old = pointer; pointer = null;
    suppressClick = cancelled || old.intent !== 'pending';
    behavior.endPointer(suppressClick);
    if (target.hasPointerCapture?.(old.id)) target.releasePointerCapture(old.id);
    wake();
  }
  listen('pointerdown', event => {
    event.stopPropagation();
    if (pointer || event.button !== 0 || event.isPrimary === false) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: behavior.snapshot().yaw, intent: 'pending' };
    // Keep fast mouse drags connected even when their first move leaves this small target.
    // Capture does not prevent native vertical scrolling; touch-action: pan-y still applies.
    target.setPointerCapture?.(event.pointerId);
    suppressClick = false; behavior.beginPointer(); wake();
  });
  listen('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    event.stopPropagation();
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (pointer.intent === 'pending' && Math.hypot(dx, dy) >= 6) {
      pointer.intent = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'rotate' : 'scroll';
      if (pointer.intent === 'rotate') behavior.beginDrag();
    }
    if (pointer.intent !== 'rotate') return;
    target.setPointerCapture(event.pointerId); event.preventDefault();
    behavior.dragTo(pointer.yaw + dx * .018); wake();
  }, { passive: false });
  listen('pointerup', event => { event.stopPropagation(); release(event); });
  listen('pointercancel', event => release(event, true));
  listen('lostpointercapture', event => release(event, true));
  listen('pointerleave', event => { if (pointer?.intent === 'pending') release(event, true); });
  listen('click', event => {
    event.stopPropagation();
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    suppressClick = false; behavior.tap(performance.now()); wake();
  });
  listen('keydown', event => {
    if (!behavior.snapshot().interactive || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    behavior.rotateBy(event.key === 'Home' ? -behavior.snapshot().yaw : event.key === 'ArrowLeft' ? -.25 : .25); wake();
  });
  return { cancel() { release(null, true); }, destroy() { release(null, true); cleanups.forEach(fn => fn()); } };
}
