// Development-only analysis of the existing retargeted GLB; does not modify it.
// Run with node --experimental-vm-modules scripts/build-elf-ground.mjs.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { elfTestModules } from '../tests/helpers/elf-model.mjs';
const env = await elfTestModules(), { THREE } = env, gltf = await env.model('wish-elf-original.glb');
const previous = await env.model();
gltf.animations.push(...previous.animations.filter(clip => ['walk','dance_03','dance_04','dance_05'].includes(clip.name)));
const { inPlaceClip } = await env.evaluate('../../js/components/wish-layout.js');
const source = await fs.readFile(new URL('../assets/models/wish-elf-original.glb', import.meta.url));
const profiles = {};
for (const original of gltf.animations) {
  const clip = inPlaceClip(original), mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
  const count = Math.ceil(clip.duration * 24), times = [], offsets = []; let base;
  for (let i = 0; i <= count; i++) {
    const time = clip.duration * i / count; mixer.setTime(time); gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); } });
    const floor = new THREE.Box3().setFromObject(gltf.scene).min.y;
    base ??= -floor;
    // Preserve authored upward travel; only compensate retargeted below-ground penetration.
    times.push(+time.toFixed(6)); offsets.push(+Math.max(base, -floor + .0005).toFixed(6));
  }
  profiles[clip.name] = { duration: clip.duration, times, offsets };
  console.log(clip.name, clip.duration.toFixed(3), 's; floor compensation', Math.min(...offsets).toFixed(4), '–', Math.max(...offsets).toFixed(4));
  mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
}
await fs.writeFile(new URL('../js/data/elf-ground.js', import.meta.url),
  '// Generated from the original GLB by scripts/build-elf-ground.mjs. Never edits source bones or artwork.\n' +
  `export const elfGroundSource = ${JSON.stringify({ file: 'assets/models/wish-elf-original.glb', sha256: createHash('sha256').update(source).digest('hex') })};\n` +
  `export const elfGroundProfiles = ${JSON.stringify(profiles)};\n`);
