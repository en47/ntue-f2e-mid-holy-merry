import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountWishInteraction } from '../js/components/wish-interaction.js';
import { createElfBehavior } from '../js/components/elf-behavior.js';
import { elfTestModules } from './helpers/elf-model.mjs';

class Surface {
  constructor() { this.listeners = new Map(); this.style = {}; this.capture = null; }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  removeEventListener(type) { this.listeners.delete(type); }
  setPointerCapture(id) { this.capture = id; }
  hasPointerCapture(id) { return this.capture === id; }
  releasePointerCapture() { this.capture = null; this.fire('lostpointercapture'); }
  fire(type, extra = {}) {
    const event = { button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: 100, clientY: 100, detail: 1,
      target: { closest: () => null }, stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; }, ...extra };
    this.ownerDocument?.listeners.get(type)?.(event);
    if (!event.stopped) this.listeners.get(type)?.(event); return event;
  }
}
test('one mesh per gesture: direct autonomous elf drag, cross-object movement, background, scrolling, delivery priority and cleanup', () => {
  const root = new Surface(), tree = { rotation: { y: .4 } }, elf = createElfBehavior({ durations: { walk: 2.333, look_around: 15.583, dance_05: 2.875 } });
  elf.setRoute({ left: 1, right: 4, height: 1 });elf.tick(1);
  let hit = { kind: 'elf' }, picks = 0, reads = 0;
  const binding = mountWishInteraction(root, { pick: () => { picks++;return hit; }, behavior: () => elf, tree, wake() {} });
  const x = elf.snapshot().x, initialYaw = elf.snapshot().yaw;
  root.fire('pointerdown');hit = { kind: 'tree' };
  root.fire('pointermove', { clientX: 160 });assert.equal(picks, 1);assert.equal(elf.snapshot().interactive, true);
  assert.equal(elf.snapshot().state, 'dragging');assert.equal(elf.snapshot().x, x);assert.equal(tree.rotation.y, .4);
  assert.ok(Math.abs(elf.snapshot().yaw - initialYaw - 60 * .018) < 1e-10);
  const before = elf.snapshot();elf.wishDelivered('while-dragging');assert.deepEqual(elf.snapshot(), before);
  root.fire('pointerup');assert.equal(elf.snapshot().interactive, true);assert.equal(root.fire('click').stopped, true);
  for (let i = 0; i < 200; i++) elf.tick(.025);
  assert.equal(elf.snapshot().yaw, 0);assert.equal(elf.snapshot().interactive, true);
  root.fire('pointerdown');hit = { kind: 'elf' };root.fire('pointermove', { clientX: 180 });root.fire('pointerup');
  assert.ok(tree.rotation.y > .4);assert.equal(elf.snapshot().yaw, 0, 'Tree drag stays owned by the tree after crossing the elf');
  hit = { kind: 'envelope', activate: () => reads++ };
  root.fire('pointerdown');root.fire('pointerup');assert.equal(reads, 1);
  root.fire('pointerdown');root.fire('pointermove', { clientX: 190 });root.fire('pointerup');root.fire('click');assert.equal(reads, 1);
  const angle = tree.rotation.y;hit = null;root.fire('pointerdown');root.fire('pointermove', { clientX: 220 });root.fire('pointerup');assert.equal(tree.rotation.y, angle);
  hit = { kind: 'elf' };root.fire('pointerdown');assert.equal(root.fire('pointermove', { clientY: 180 }).prevented, undefined);
  root.fire('pointercancel');assert.equal(elf.snapshot().held, false);assert.equal(elf.snapshot().interactive, true);
  const oldPicks = picks;root.fire('pointerdown', { target: { closest: () => ({ tagName: 'FORM' }) } });assert.equal(picks, oldPicks);
  assert.equal(root.fire('click', { detail: 0 }).stopped, undefined, 'Assistive/keyboard activation remains native');
  root.fire('pointerdown');binding.cancel();assert.equal(elf.snapshot().held, false);
  binding.destroy();assert.equal(root.listeners.size, 0);
});

test('selection lock starts only on rotation and restores on release, cancellation, capture loss, blur and teardown; fields remain native', () => {
  const root = new Surface(), doc = new Surface(), view = new Surface(), classes = new Set();
  doc.documentElement = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  doc.defaultView = view; root.ownerDocument = doc;
  const text = { parentElement: { closest: () => null } };
  let cleared = 0;
  const selection = { anchorNode: text, focusNode: text, anchorOffset: 0, focusOffset: 4, isCollapsed: false,
    removeAllRanges() { cleared++; this.isCollapsed = true; } };
  doc.getSelection = () => selection;
  const tree = { rotation: { y: 0 } }, elf = createElfBehavior({ durations: { walk: 2, look_around: 15 } });
  elf.setRoute({ left: 1, right: 3, height: 1 });
  let picks = 0;
  const binding = mountWishInteraction(root, { pick: () => { picks++; return { kind: 'tree' }; }, behavior: () => elf, tree, wake() {} });
  const locked = () => classes.has('wish-drag-active');
  assert.equal(root.fire('pointerdown').prevented, true, 'Cancel the native mouse default before compatibility mousedown can start selection'); assert.equal(locked(), false);
  root.fire('pointermove', { clientX: 103 }); assert.equal(locked(), false);
  assert.equal(doc.fire('selectstart').prevented, undefined);
  root.fire('pointermove', { clientX: 130 }); assert.equal(locked(), true);
  assert.equal(cleared, 0, 'An unchanged pre-existing text selection survives');
  assert.equal(doc.fire('selectstart').prevented, true);
  const input = { nodeType: 1, closest: () => ({ tagName: 'INPUT' }) };
  assert.equal(doc.fire('selectstart', { target: input }).prevented, true, 'Crossing a field during a 3D drag must not start a new selection');
  root.fire('pointerup'); assert.equal(locked(), false);
  assert.equal(doc.fire('selectstart').prevented, undefined);
  root.fire('pointerdown'); selection.focusOffset = 12;
  root.fire('pointermove', { clientX: 130 }); assert.equal(cleared, 1, 'Clear only the selection accidentally started during this gesture');
  root.fire('pointercancel'); assert.equal(locked(), false);
  root.fire('pointerdown'); root.fire('pointermove', { clientY: 140 }); assert.equal(locked(), false);
  root.fire('pointercancel');
  for (const finish of [() => doc.fire('pointerup'), () => doc.fire('pointercancel'), () => root.fire('lostpointercapture'), () => view.fire('blur'), () => view.fire('keydown', { key: 'Escape' }), () => { doc.hidden = true; doc.fire('visibilitychange'); doc.hidden = false; }, () => binding.cancel()]) {
    root.fire('pointerdown'); root.fire('pointermove', { clientX: 130 }); assert.equal(locked(), true);
    finish(); assert.equal(locked(), false);
    const yaw = tree.rotation.y; root.fire('pointermove', { clientX: 180 }); assert.equal(tree.rotation.y, yaw);
  }
  for (const field of ['INPUT', 'TEXTAREA']) {
    const before = picks;
    const down = root.fire('pointerdown', { target: { closest: () => ({ tagName: field }) } });
    assert.equal(picks, before); assert.equal(down.prevented, undefined); assert.equal(locked(), false);
  }
  selection.anchorNode = selection.focusNode = input; selection.isCollapsed = false;
  root.fire('pointerdown'); selection.focusOffset++;
  root.fire('pointermove', { clientX: 130 }); assert.equal(cleared, 1, 'Never clear an editable field selection');
  binding.destroy(); assert.equal(locked(), false);
  assert.equal(root.listeners.size, 0); assert.equal(doc.listeners.size, 0); assert.equal(view.listeners.size, 0);
});

test('document fallback keeps one target outside the room, restores native editing, and releases touch scrolling', () => {
  const root = new Surface(), doc = new Surface(), view = new Surface(), classes = new Set();
  root.ownerDocument = doc; doc.defaultView = view;
  doc.documentElement = { classList: { add: n => classes.add(n), remove: n => classes.delete(n) } };
  root.setPointerCapture = () => { throw new Error('Capture unavailable'); };
  let target = { kind: 'tree' }, reads = 0, picks = 0;
  const tree = { rotation: { y: 0 } }, elf = createElfBehavior({ durations: { walk: 2 } });
  const binding = mountWishInteraction(root, { pick: () => { picks++; return target; }, behavior: () => elf, tree, wake() {} });
  assert.equal(root.fire('pointerdown').prevented, true);
  target = { kind: 'elf' };
  doc.fire('pointermove', { clientX: 150, target: { closest: () => ({ tagName: 'TEXTAREA' }) } });
  assert.equal(picks, 1);assert.equal(tree.rotation.y, .6);assert.equal(elf.snapshot().yaw, 0);
  assert.equal(classes.has('wish-drag-active'), true);
  doc.fire('pointerup');assert.equal(classes.size, 0);
  const angle = tree.rotation.y;doc.fire('pointermove', { clientX: 250 });assert.equal(tree.rotation.y, angle);
  assert.equal(doc.fire('selectstart', { target: { closest: () => ({ tagName: 'TEXTAREA' }) } }).prevented, undefined);
  assert.equal(root.fire('dragstart', { target: { closest: () => ({ tagName: 'IMG' }) } }).prevented, true);
  assert.equal(root.fire('dragstart').prevented, undefined, 'Native text dragging remains available after the model gesture');
  target = { kind: 'envelope', activate: () => reads++ };
  root.fire('pointerdown');doc.fire('pointermove', { pointerId: 2, clientX: 250 });doc.fire('pointerup', { pointerId: 2 });
  assert.equal(classes.size, 0);doc.fire('pointerup');assert.equal(reads, 1, 'Another pointer cannot steal or finish the pending click');
  root.fire('pointerdown', { pointerType: 'touch' });assert.equal(classes.size, 0);
  assert.equal(doc.fire('pointermove', { pointerType: 'touch', clientY: 200 }).prevented, undefined);
  doc.fire('pointerup', { pointerType: 'touch' });assert.equal(reads, 1, 'Scrolling a letter area never opens the wish');
  assert.equal(root.fire('pointerdown', { pointerType: 'touch' }).prevented, undefined);
  assert.equal(doc.fire('pointermove', { pointerType: 'touch', clientX: 160 }).prevented, true);
  assert.equal(classes.has('wish-drag-active'), true);doc.fire('pointercancel');assert.equal(classes.size, 0);
  target = null;assert.equal(root.fire('pointerdown').prevented, undefined);
  binding.destroy();assert.equal(root.listeners.size, 0);assert.equal(doc.listeners.size, 0);assert.equal(view.listeners.size, 0);
});

test('real GLB picking: foreground elf, envelope depth, actual foliage, trunk and empty background', async () => {
  const env = await elfTestModules(), { THREE: T } = env;
  const { createWishPicker } = await env.evaluate('../../js/components/wish-picking.js');
  const gltf = await env.model('wish-tree.glb'), tree = gltf.scene;
  const elf = new T.Mesh(new T.BoxGeometry(.08, .16, .06), new T.MeshBasicMaterial());elf.position.set(.1, .5, .7);
  const board = new T.Mesh(new T.PlaneGeometry(.12, .1), new T.MeshBasicMaterial({ side: T.DoubleSide }));board.position.set(.1, .5, .4);board.updateMatrixWorld();
  const camera = new T.OrthographicCamera(-.4, .4, .95, -.05, .1, 50);camera.position.z = 5;
  const root = { clientWidth: 800, clientHeight: 1000, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  let foreground = elf;
  const pick = createWishPicker({ root, camera, treeModel: () => tree, elfModel: () => foreground,
    envelopes: { pick(ray) { board.updateMatrixWorld();const hit = ray.intersectObject(board)[0];return hit ? { kind: 'envelope', distance: hit.distance, activate() {} } : null; } } });
  const at = (x, y) => pick({ clientX: (x + .4) * 1000, clientY: (.95 - y) * 1000 });
  assert.equal(at(.1, .5).kind, 'elf');foreground = null;
  assert.equal(at(.1, .5).kind, 'envelope');board.position.z = -.5;
  assert.equal(at(.1, .5).kind, 'tree', 'A letter behind real foliage must not receive the pointer');
  assert.equal(at(-.15, .35).kind, 'tree', 'Foliage is a valid target, not just the trunk');
  assert.equal(at(0, .04).kind, 'tree');assert.equal(at(.38, .5), null, 'Empty space does not inherit the tree rectangle');
  assert.equal(at(1, .5), null);
  const actualElf = await env.model('wish-elf-original.glb');foreground = new T.Group();foreground.add(actualElf.scene);
  foreground.scale.setScalar(.25);foreground.position.set(.1, .3, .7);
  const { createElfAnimation } = await env.evaluate('../../js/components/elf-animation.js');
  // Native idle skinning changes the hit mesh; raycasts must follow the actual pose.
  const { default: fs } = await import('node:fs/promises');
  const saved = JSON.parse(await fs.readFile(new URL('../assets/animations/elf-actions.json', import.meta.url)));
  const animation = createElfAnimation(actualElf.scene, [...actualElf.animations, ...saved.clips.map(c => T.AnimationClip.parse(c))]);animation.update(3);
  let elfHits = 0;
  for (const x of [.07, .1, .13]) for (const y of [.36, .4, .44, .48]) if (at(x, y)?.kind === 'elf') elfHits++;
  assert.ok(elfHits > 0, 'The supplied skinned GLB remains clickable while native idle plays');
  assert.notEqual(at(-.15, .35)?.kind, 'elf', 'Adjacent foliage is not stolen by a rectangular elf target');
  animation.destroy();
  elf.geometry.dispose();elf.material.dispose();board.geometry.dispose();board.material.dispose();
});
