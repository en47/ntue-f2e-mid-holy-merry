// Extract existing compatible actions without loading a second textured model in the browser.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { elfTestModules } from '../tests/helpers/elf-model.mjs';
const env = await elfTestModules(), original = await env.model(), supplied = await env.model('wish-elf-original.glb');
const rig = root => { const result = {}; root.traverse(node => { if (node.isBone) result[node.name] = { parent: node.parent?.name, p: node.position.toArray(), q: node.quaternion.toArray(), s: node.scale.toArray() }; }); return result; };
if (JSON.stringify(rig(original.scene)) !== JSON.stringify(rig(supplied.scene))) throw new Error('Elf rigs changed; do not apply unvalidated animation tracks');
const hash = async file => createHash('sha256').update(await fs.readFile(new URL(`../assets/models/${file}`, import.meta.url))).digest('hex');
const output = { sourceSha256: await hash('wish-elf.glb'), modelSha256: await hash('wish-elf-original.glb'),
  clips: original.animations.filter(clip => ['walk', 'dance_03', 'dance_04', 'dance_05'].includes(clip.name)).map(clip => env.THREE.AnimationClip.toJSON(clip)) };
await fs.mkdir(new URL('../assets/animations/', import.meta.url), { recursive: true });
const json = JSON.stringify(output);
await fs.writeFile(new URL('../assets/animations/elf-actions.json', import.meta.url), json);
console.log('Validated 65 compatible bones; extracted native walk + dance_03 / 04 / 05:', json.length, 'bytes');
