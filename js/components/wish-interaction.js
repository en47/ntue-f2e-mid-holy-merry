// One pointer owns one actual mesh from down to release. Rendering and data stay elsewhere.
export function mountWishInteraction(root, { pick, behavior, tree, wake }) {
  let pointer = null;
  const cleanups = [];
  const on = (target, type, fn, options) => {
    target?.addEventListener(type, fn, options);
    cleanups.push(() => target?.removeEventListener(type, fn, options));
  };
  const listen = (type, fn, options) => on(root, type, fn, options);
  const doc = root.ownerDocument;
  // Pointer capture normally owns the gesture; document listeners also cover capture failure.
  const lifecycle = doc || root;
  const selectionState = () => {
    const selection = doc?.getSelection?.();
    return selection ? [selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset] : null;
  };
  const editable = node => (node?.nodeType === 1 ? node : node?.parentElement)?.closest?.('input, textarea, [contenteditable]:not([contenteditable="false"])');
  function lockSelection() {
    doc?.documentElement.classList.add('wish-drag-active');
    const selection = doc?.getSelection?.(), current = selectionState();
    // Remove only a selection newly started before crossing the drag threshold.
    // Existing selections and editable-field ranges are left alone.
    if (selection && !selection.isCollapsed && !editable(selection.anchorNode) && !editable(selection.focusNode)
      && current?.some((value, index) => value !== pointer.selection?.[index])) selection.removeAllRanges();
  }
  const protectedUI = event => event.target?.closest?.('form, input, textarea, select, label, a, [contenteditable]:not([contenteditable="false"]), figure, .scene-loading, .room-heading, .delivery-feedback, button:not(.tree-gesture):not(.elf-hit):not(.tree-envelope-hit)');
  function finish(cancelled = false) {
    doc?.documentElement.classList.remove('wish-drag-active');
    if (!pointer) return;
    const old = pointer; pointer = null;
    root.style.cursor = '';
    try { if (root.hasPointerCapture?.(old.id)) root.releasePointerCapture(old.id); } catch { /* Already released by the browser. */ }
    if (old.hit.kind === 'elf') {
      const elf = behavior(); elf?.endPointer(old.intent === 'rotate');
      if (!cancelled && old.intent === 'pending') elf?.toggle();
    } else if (!cancelled && old.intent === 'pending' && old.hit.kind === 'envelope') old.hit.activate();
    wake();
  }
  listen('pointerdown', event => {
    if (protectedUI(event)) return;
    if (pointer || event.button !== 0 || event.isPrimary === false) return;
    const hit = pick(event);
    if (!hit) return; // Empty sky/snow never starts a tree gesture.
    event.stopPropagation();
    // Cancel the native mouse default BEFORE it can start selection/compatibility mousedown.
    // CSS at the 6px threshold is too late once the browser has begun a selection drag.
    // Touch keeps its native pan-y / pinch-zoom path. Form events never reach this branch.
    if (event.pointerType !== 'touch') event.preventDefault();
    pointer = { id: event.pointerId, hit, intent: 'pending', x: event.clientX, y: event.clientY,
      yaw: hit.kind === 'elf' ? behavior().snapshot().yaw : tree.rotation.y, selection: selectionState() };
    if (hit.kind === 'elf') behavior().beginPointer();
    try { root.setPointerCapture?.(event.pointerId); } catch { /* Document lifecycle remains active. */ }
    wake();
  }, { capture: true, passive: false });
  on(lifecycle, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    event.stopPropagation();
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (pointer.intent === 'pending' && Math.hypot(dx, dy) >= 6) {
      pointer.intent = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'rotate' : 'scroll';
      if (pointer.intent === 'scroll') { finish(true); return; }
      lockSelection();
      if (pointer.intent === 'rotate' && pointer.hit.kind === 'elf') behavior().beginDrag();
    }
    if (pointer.intent !== 'rotate') return;
    event.preventDefault(); root.style.cursor = 'grabbing';
    if (pointer.hit.kind === 'elf') behavior().dragTo(pointer.yaw + dx * .018);
    else tree.rotation.y = pointer.yaw + dx * .012;
    wake();
  }, { capture: true, passive: false });
  on(lifecycle, 'pointerup', event => { if (pointer?.id === event.pointerId) { event.stopPropagation(); finish(); } }, { capture: true });
  on(lifecycle, 'pointercancel', event => { if (pointer?.id === event.pointerId) finish(true); }, { capture: true });
  listen('lostpointercapture', event => { if (pointer?.id === event.pointerId) finish(true); }, { capture: true });
  listen('click', event => {
    // Pointer activation happened on release. Native keyboard/assistive clicks stay available.
    if (event.detail !== 0 && !protectedUI(event)) { event.preventDefault(); event.stopPropagation(); }
  }, { capture: true });
  listen('dragstart', event => {
    if (pointer || event.target?.closest?.('img, svg, canvas')) event.preventDefault();
  }, { capture: true });
  // During a captured model drag, even selection over a form is accidental. Outside
  // that gesture, no selection or editing event is intercepted anywhere on the page.
  on(doc, 'selectstart', event => { if (pointer?.intent === 'rotate') event.preventDefault(); }, { capture: true });
  on(doc?.defaultView, 'blur', () => finish(true));
  on(doc?.defaultView, 'keydown', event => { if (event.key === 'Escape' && pointer) finish(true); });
  on(doc, 'visibilitychange', () => { if (doc.hidden) finish(true); });
  return { cancel() { finish(true); }, destroy() { finish(true); cleanups.forEach(fn => fn()); } };
}
