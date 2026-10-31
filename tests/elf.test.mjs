import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createElfBehavior, safeElfRoute, ELF_RETURN_DELAY, ELF_RETURN_DURATION , ELF_DANCE_SECONDS, ELF_DOUBLE_TAP } from '../js/components/elf-behavior.js';
import { mountElfInteraction } from '../js/components/elf-interaction.js';
import { elfGroundSource, elfGroundProfiles } from '../js/data/elf-ground.js';
import { elfTestModules } from './helpers/elf-model.mjs';

const durations = Object.fromEntries(Object.entries(elfGroundProfiles).map(([name, profile]) => [name, profile.duration]));
function seeded(seed = 7) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function behavior(options = {}) {
  const value = createElfBehavior({ random: seeded(), durations, ...options });
  value.setRoute({ left: 1, right: 4, height: 1 }); return value;
}
class Target {
  constructor() { this.listeners = new Map(); this.capture = null; }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  removeEventListener(type) { this.listeners.delete(type); }
  setPointerCapture(id) { this.capture = id; }
  hasPointerCapture(id) { return this.capture === id; }
  releasePointerCapture() { this.capture = null; this.fire('lostpointercapture'); }
  fire(type, event = {}) {
    const e = { button: 0, isPrimary: true, pointerId: 1, clientX: 100, clientY: 100, detail: 1,
      stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; }, ...event };
    this.listeners.get(type)?.(e); return e;
  }
}
const advance = (value, seconds) => { while (seconds > 0) { const dt = Math.min(seconds, .025); value.tick(dt); seconds -= dt; } };

test('autonomous life: keeps walking, dances occasionally for a few seconds, then walks on', () => {
  const elf = behavior(), seen = new Set(), sequence = []; let previous = elf.snapshot(), walks = 0, dances = 0, lastDance = -100, lastDanceClip = null;
  assert.equal(previous.state, 'walking', 'Start strolling as soon as a safe route is available');
  const stroll = behavior({ random: () => 0 });
  advance(stroll, stroll.snapshot().duration + .025);
  assert.equal(stroll.snapshot().state, 'walking', 'Walking may continue without forcing a rest after every waypoint');
  for (let i = 0; i < 48000; i++) {
    const next = elf.tick(.025);
    assert.ok(next.x >= 1 && next.x <= 4); assert.equal(next.lift, undefined, 'No fabricated whole-body hops or sways');
    assert.ok(Math.abs(next.x - previous.x) < .04, 'No teleport between activities');
    if (next.version !== previous.version) {
      assert.ok(previous.elapsed + .025 >= previous.duration - .00001, 'Finish a full clip before choosing another activity');
      seen.add(next.routine); sequence.push(next.routine);
      if (next.clip.startsWith('dance_')) {
        assert.equal(next.duration, ELF_DANCE_SECONDS);
        assert.ok(i * .025 >= 25, 'No dance immediately after loading');
        assert.ok(i * .025 - lastDance >= 25, 'Dances must remain occasional'); lastDance = i * .025; dances++;
        assert.notEqual(next.clip, lastDanceClip, 'Use a different native dance when alternatives exist');lastDanceClip = next.clip;
      }
      if (next.routine === 'walk') { assert.ok(Math.abs(next.duration / durations.walk - Math.round(next.duration / durations.walk)) < .00001); walks++; }
      if (sequence.length > 1 && next.routine !== 'walk') assert.notEqual(sequence.at(-1), sequence.at(-2));
    }
    previous = next;
  }
  for (const routine of ['walk', 'dance_03', 'dance_04', 'dance_05']) assert.ok(seen.has(routine), routine);
  assert.ok(!seen.has('look') && !seen.has('rest'), 'It never stops to idle on its own');
  assert.ok(walks > dances * 3 && dances > 10); assert.ok(sequence.every((id, i) => i === 0 || id === 'walk' || sequence[i - 1] === 'walk'), 'Every dance leads back to walking');
});

test('one tap rests at once, two quick taps dance a few seconds and walk on, slow taps never dance',()=>{
  const elf=behavior();
  assert.equal(elf.tap(1000),'rest');assert.equal(elf.snapshot().interactive,true);
  assert.equal(elf.tap(1200),'dance');let state=elf.snapshot();assert.equal(state.interactive,false);assert.ok(state.clip.startsWith('dance_'));assert.equal(state.duration,ELF_DANCE_SECONDS);assert.equal(state.loop,true);
  const first=state.clip;advance(elf,ELF_DANCE_SECONDS+.05);assert.equal(elf.snapshot().routine,'walk','Back to walking without another tap');
  assert.equal(elf.tap(5000),'rest');assert.equal(elf.tap(5000+ELF_DOUBLE_TAP),'resume','A slow second tap only resumes');assert.equal(elf.snapshot().interactive,false);
  const third=elf.tap(9000);assert.equal(third,'rest');elf.tap(9100);assert.notEqual(elf.snapshot().clip,first,'Consecutive dances differ');
  const calm=behavior({reduced:true});assert.equal(calm.tap(0),'rest');assert.notEqual(calm.tap(100),'dance');
});

test('interaction freezes location, permits yaw only, holds after release, eases to exact front and resumes in place', () => {
  const elf = behavior(); advance(elf, 3);
  const x = elf.snapshot().x; elf.toggle(); advance(elf, .6);
  assert.equal(elf.snapshot().x, x); assert.equal(elf.snapshot().interactive, true);
  elf.beginPointer(); elf.dragTo(1.8); advance(elf, 5);
  assert.equal(elf.snapshot().yaw, 1.8, 'Do not restart/advance a return timer while dragging');
  elf.endPointer(true); advance(elf, ELF_RETURN_DELAY - .05); assert.equal(elf.snapshot().yaw, 1.8);
  advance(elf, .55); assert.ok(elf.snapshot().yaw > 0 && elf.snapshot().yaw < 1.8);
  elf.beginPointer(); const halfway = elf.snapshot().yaw; advance(elf, 3); assert.equal(elf.snapshot().yaw, halfway);
  elf.dragTo(-2); elf.endPointer(true); advance(elf, ELF_RETURN_DELAY + ELF_RETURN_DURATION + .1);
  assert.equal(elf.snapshot().yaw, 0); assert.equal(elf.snapshot().state, 'idleInteractive'); assert.equal(elf.snapshot().x, x);
  elf.toggle(); assert.equal(elf.snapshot().interactive, false); assert.equal(elf.snapshot().x, x);
  advance(elf, 1); assert.ok(Math.abs(elf.snapshot().x - x) < 1, 'Resume from current location');
});

test('pointer and touch arbitration: 6px threshold, no drag-tap double toggle, vertical scrolling, cancellation, keyboard and cleanup', () => {
  const elf = behavior(), target = new Target(); let wakes = 0;
  const binding = mountElfInteraction(target, elf, () => wakes++);
  target.fire('pointerdown'); const x = elf.snapshot().x; advance(elf, 2); assert.equal(elf.snapshot().x, x);
  target.fire('pointerup'); target.fire('click'); assert.equal(elf.snapshot().interactive, true);
  target.fire('pointerdown'); assert.equal(target.capture, 1, 'Capture immediately so a fast drag cannot escape the small elf target');
  target.fire('pointermove', { clientX: 280 }); assert.equal(elf.snapshot().state, 'dragging');
  target.fire('pointerup'); target.fire('click'); assert.equal(elf.snapshot().interactive, true);
  for (let i = 0; i < 8; i++) {
    target.fire('pointerdown', { pointerType: 'touch' });
    assert.equal(target.fire('pointermove', { clientX: 105, pointerType: 'touch' }).prevented, undefined);
    const moved = target.fire('pointermove', { clientX: 145, pointerType: 'touch' });
    assert.equal(moved.prevented, true); assert.equal(moved.stopped, true);
    assert.equal(elf.snapshot().state, 'dragging');
    target.fire('pointerup'); target.fire('click'); assert.equal(elf.snapshot().interactive, true);
  }
  target.fire('pointerdown', { pointerType: 'touch' });
  assert.equal(target.fire('pointermove', { clientY: 140, pointerType: 'touch' }).prevented, undefined);
  target.fire('pointercancel'); target.fire('click'); assert.equal(elf.snapshot().interactive, true);
  target.fire('keydown', { key: 'ArrowRight' }); advance(elf, 4); assert.equal(elf.snapshot().yaw, 0);
  target.fire('click', { detail: 0 }); assert.equal(elf.snapshot().interactive, false);
  target.fire('pointerdown', { isPrimary: false }); assert.equal(elf.snapshot().held, false);
  binding.destroy(); assert.equal(target.listeners.size, 0); assert.ok(wakes > 10);
});

test('delivery respects manual idle/dragging; successful autonomous reaction is local, deduplicated, and does not move the elf', () => {
  const initiallyReduced = behavior({ reduced: true });
  assert.equal(initiallyReduced.snapshot().clip, 'look_around', 'Reduced motion on first load must use a real clip');
  advance(initiallyReduced, 30); assert.equal(initiallyReduced.snapshot().needsFrame, false);
  assert.equal(initiallyReduced.snapshot().x, 1);
  const elf = behavior(); advance(elf, 3); const x = elf.snapshot().x;
  assert.equal(elf.wishDelivered('sent-1'), true); assert.equal(elf.snapshot().state, 'wishReaction'); assert.equal(elf.snapshot().x, x);
  const version = elf.snapshot().version; assert.equal(elf.wishDelivered('sent-1'), false); assert.equal(elf.snapshot().version, version);
  elf.toggle(); elf.beginPointer(); elf.dragTo(1);
  const before = elf.snapshot(); assert.equal(elf.wishDelivered('sent-2'), false);
  assert.deepEqual(elf.snapshot(), before); elf.endPointer(true); advance(elf, 4); assert.equal(elf.snapshot().interactive, true);
  elf.toggle(); advance(elf, .1); assert.notEqual(elf.snapshot().state, 'wishReaction');
  elf.setReduced(true); const frozen = elf.snapshot(); advance(elf, 20); assert.equal(elf.snapshot().x, frozen.x); assert.equal(elf.snapshot().needsFrame, false);
  assert.equal(elf.wishDelivered('sent-3'), false);
});

test('safe waypoints exclude low form/rack bounds and the tree trunk across desktop/tablet/mobile layouts', () => {
  for (const width of [1440, 1024, 768, 390]) {
    const mobile = width < 700, ground = mobile ? 1300 : 700, height = mobile ? 95 : 110;
    const rack = { left: width * .05, width: mobile ? 230 : width * .28, top: mobile ? 640 : 510, bottom: mobile ? 810 : ground };
    const letter = { left: 20, width: width * .34, top: 70, bottom: 490 };
    const tree = { x: width * (mobile ? .5 : .7), radius: mobile ? 29 : 42 };
    const route = safeElfRoute({ lane: { left: width * (mobile ? .04 : .35), width: width * (mobile ? .93 : .61) }, groundY: ground, height, obstacles: [letter, rack], tree });
    assert.ok(route); assert.ok(route.right >= route.left);
    for (const x of [route.left, (route.left + route.right) / 2, route.right]) {
      assert.ok(Math.abs(x - tree.x) >= tree.radius + height * .45);
      if (rack.bottom > ground - height) assert.ok(x - height * .45 >= rack.left + rack.width || x + height * .45 <= rack.left);
    }
    const foreground = safeElfRoute({ lane: { left: width * (mobile ? .04 : .35), width: width * (mobile ? .93 : .61), z: tree.radius + height },
      groundY: ground, height, obstacles: [letter, rack], tree });
    assert.ok(foreground.left < tree.x - tree.radius && foreground.right > tree.x + tree.radius,
      `${width}px: the foreground route reaches both sides without crossing the trunk in 3D`);
    const roaming = createElfBehavior({ random: seeded(), durations });
    roaming.setRoute({ ...foreground, height });
    let rightmost = foreground.left;
    for (let i = 0; i < 12000; i++) rightmost = Math.max(rightmost, roaming.tick(.025).x);
    assert.ok(rightmost > tree.x + tree.radius, `${width}px: autonomous walking actually reaches the right side`);
  }
  assert.equal(safeElfRoute({ lane: { left: 0, width: 100 }, height: 100, groundY: 100, obstacles: [{ left: 0, width: 100, top: 0, bottom: 100 }], tree: null }), null);
});

test('supplied original elf: animated native idle, validated compatible actions, grounded crossfades and no source mutation', async () => {
  const bytes = await fs.readFile(new URL('../assets/models/wish-elf-original.glb', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), elfGroundSource.sha256);
  const oldBytes = await fs.readFile(new URL('../assets/models/wish-elf.glb', import.meta.url));
  const saved = JSON.parse(await fs.readFile(new URL('../assets/animations/elf-actions.json', import.meta.url)));
  assert.equal(saved.sourceSha256, createHash('sha256').update(oldBytes).digest('hex'));
  assert.equal(saved.modelSha256, elfGroundSource.sha256);
  const env = await elfTestModules(), { THREE } = env, gltf = await env.model('wish-elf-original.glb'), old = await env.model();
  assert.deepEqual(Array.from(gltf.animations, clip => clip.name), ['look_around']);
  assert.ok(Math.abs(gltf.animations[0].duration - 15.5833333) < .00001);
  function rig(root) { const values = {}; root.traverse(node => { if (node.isBone) values[node.name] = { p: node.position.toArray(), q: node.quaternion.toArray(), s: node.scale.toArray(), parent: node.parent?.name }; }); return values; }
  assert.deepEqual(rig(gltf.scene), rig(old.scene));
  for (const json of saved.clips) {
    const clip = THREE.AnimationClip.parse(json), original = old.animations.find(value => value.name === clip.name);
    assert.ok(original);clip.tracks.forEach((track,i) => assert.deepEqual(Array.from(track.values),Array.from(original.tracks[i].values)));
    gltf.animations.push(clip);
  }
  const { createElfAnimation } = await env.evaluate('../../js/components/elf-animation.js');
  const before = gltf.animations.map(clip => clip.tracks.map(track => Array.from(track.values)));
  const animation = createElfAnimation(gltf.scene, gltf.animations);
  assert.deepEqual(Object.keys(animation.durations).sort(), ['dance_03', 'dance_04', 'dance_05', 'look_around', 'walk']);
  function bounds() {
    gltf.scene.updateMatrixWorld(true); gltf.scene.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); } });
    return new THREE.Box3().setFromObject(gltf.scene);
  }
  for (const name of ['walk', 'dance_03', 'dance_04', 'dance_05', 'look_around']) {
    animation.play(name, !name.startsWith('dance_'), true);
    let previous = 0; const duration = animation.durations[name] || 2;
    for (let i = 0; i <= 32; i++) {
      const time = duration * i / 32; animation.update(time - previous); previous = time;
      const box = bounds(), size = box.getSize(new THREE.Vector3());
      assert.ok(box.min.y > -.006, `${name} feet below floor: ${box.min.y}`);
      assert.ok(size.y > .7 && size.y < 1.2 && size.x < .9, 'No stretched limbs or scale distortions');
    }
  }
  animation.play('look_around', true, true); animation.update(0);
  let head; gltf.scene.traverse(node=>{if(node.isBone&&/Head$/.test(node.name))head=node;});assert.ok(head);
  const idleHead=head.quaternion.clone();animation.update(3);
  assert.ok(head.quaternion.angleTo(idleHead)>.01,'Native idle must keep moving, not freeze a dance pose');
  for(const name of ['walk','dance_03','dance_04','dance_05','look_around']){
    animation.play(name,!name.startsWith('dance_'),true);animation.update(animation.durations[name]*.43);
    animation.play('look_around',true);
    for(let frame=0;frame<24;frame++){animation.update(1/60);const floor=bounds().min.y;assert.ok(floor>-.012,`Smooth crossfade ${name}, frame ${frame}, feet ${floor}`);}
  }
  gltf.animations.forEach((clip, i) => clip.tracks.forEach((track, j) => assert.deepEqual(Array.from(track.values), before[i][j])));
  animation.destroy(); animation.destroy();
});
