import * as THREE from 'three';
import { inPlaceClip } from './wish-layout.js';
import { elfGroundProfiles } from '../data/elf-ground.js';

export function createElfAnimation(model, originals) {
  const mixer = new THREE.AnimationMixer(model), actions = {}, durations = {};
  for (const original of originals) {
    const profile = elfGroundProfiles[original.name];
    if (!profile || Math.abs(profile.duration - original.duration) > .01) continue;
    const clip = inPlaceClip(original);
    // Root carriage correction only; original bone proportions and upward motion are preserved.
    clip.tracks.push(new THREE.NumberKeyframeTrack('.position[y]', profile.times, profile.offsets));
    actions[original.name] = mixer.clipAction(clip); durations[original.name] = clip.duration;
  }
  if (!actions.walk || !actions.dance_05 || !actions.look_around) throw new Error('精靈缺少預期的 look_around / walk / dance_05 動畫');
  let current = null, currentName = null, blendRemaining = 0, uncorrectedY = null;
  const box = new THREE.Box3(), parentPosition = new THREE.Vector3(), parentScale = new THREE.Vector3();
  function play(name, loop = false, immediate = false) {
    if (!actions[name]) throw new Error(`未知精靈動畫：${name}`);
    if (currentName === name && !current.paused && !immediate) {
      current.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      return; // Keep the native idle phase when the visitor clicks or starts dragging.
    }
    const next = actions[name];
    if (immediate) { mixer.stopAllAction(); blendRemaining = 0; uncorrectedY = null; }
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = true; next.play();
    if (current && current !== next && !immediate) { next.crossFadeFrom(current, .32, false); blendRemaining = .32; }
    current = next; currentName = name;
  }
  play('look_around', true); mixer.update(0);
  function update(dt) {
    if (uncorrectedY !== null) { model.position.y = uncorrectedY; uncorrectedY = null; }
    mixer.update(dt);
    if (blendRemaining <= 0) return;
    blendRemaining = Math.max(0, blendRemaining - dt);
    // Quaternion crossfades are nonlinear: two grounded poses can briefly blend below the floor.
    // Check only during the 320ms transition; no continuous mesh scan or bone adjustment.
    model.updateWorldMatrix(true, true);
    model.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); } });
    box.setFromObject(model);
    const floor = model.parent ? model.parent.getWorldPosition(parentPosition).y : 0;
    const scale = model.parent ? model.parent.getWorldScale(parentScale).y : 1;
    if (box.min.y < floor) { uncorrectedY = model.position.y; model.position.y += (floor - box.min.y) / scale + .0005; }
  }
  return { durations, play, update, destroy() { mixer.stopAllAction(); mixer.uncacheRoot(model); } };
}
