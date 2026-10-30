// 由 assets/santa claus.glb 產生網站用的 assets/models/santa-new.glb；原始檔不變。
// 舞步取自 santa-dance.glb，因兩份骨架的綁定姿勢不同，逐影格對齊骨頭方向後再烘入。
// 執行：node --experimental-vm-modules scripts/build-santa-model.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { elfTestModules } from '../tests/helpers/elf-model.mjs';

const SOURCE = 'assets/santa claus.glb', DANCE = 'assets/models/santa-dance.glb', OUTPUT = 'assets/models/santa-new.glb';
const FPS = 24, END = 4.125;

const env = await elfTestModules();
const { THREE } = env;
const { GLTFLoader } = await env.evaluate('../../vendor/three/examples/jsm/loaders/GLTFLoader.js');

async function parse(file) {
  const bytes = await fs.readFile(file), loader = new GLTFLoader();
  loader.register(() => ({ name: 'NO_TEXTURES', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

const worldPose = bones => {
  const pose = new Map();
  for (const bone of bones) {
    bone.updateWorldMatrix(true, false);
    pose.set(bone.name, { rotation: bone.getWorldQuaternion(new THREE.Quaternion()), position: bone.getWorldPosition(new THREE.Vector3()) });
  }
  return pose;
};

async function bakeDance() {
  const source = await parse(DANCE), target = await parse(SOURCE);
  const sourceBones = source.scene.getObjectByProperty('isSkinnedMesh', true).skeleton.bones;
  const targetBones = target.scene.getObjectByProperty('isSkinnedMesh', true).skeleton.bones;
  const sourceByName = new Map(sourceBones.map(bone => [bone.name, bone]));
  const shared = targetBones.filter(bone => sourceByName.has(bone.name));
  const sourceRest = worldPose(sourceBones), targetRest = worldPose(targetBones);
  // 先把新骨頭擺到舊骨頭的靜止方向，舞步的世界旋轉才會得到相同的肢體朝向。
  const align = new Map(shared.map(bone => {
    const child = bone.children.find(node => node.isBone && targetRest.has(node.name) && sourceRest.has(node.name));
    if (!child || bone.name === 'mixamorigHips') return [bone.name, new THREE.Quaternion()];
    const direction = (rest, name) => rest.get(child.name).position.clone().sub(rest.get(name).position).normalize();
    return [bone.name, new THREE.Quaternion().setFromUnitVectors(direction(targetRest, bone.name), direction(sourceRest, bone.name))];
  }));
  const hipScale = targetRest.get('mixamorigHips').position.y / sourceRest.get('mixamorigHips').position.y;
  const mixer = new THREE.AnimationMixer(source.scene), action = mixer.clipAction(source.animations[0]);
  action.play();
  const frames = Math.round(END * FPS), times = [], rotations = new Map(shared.map(bone => [bone.name, []])), hips = [];
  for (let frame = 0; frame <= frames; frame++) {
    const time = frame / FPS;
    mixer.setTime(time);
    source.scene.updateMatrixWorld(true);
    times.push(time);
    const pose = worldPose(sourceBones);
    const solved = new Map();
    for (const bone of shared) {
      const from = pose.get(bone.name).rotation.clone().multiply(sourceRest.get(bone.name).rotation.clone().invert());
      const world = from.multiply(align.get(bone.name)).multiply(targetRest.get(bone.name).rotation);
      solved.set(bone.name, world);
      const parent = solved.get(bone.parent.name) ?? bone.parent.getWorldQuaternion(new THREE.Quaternion());
      rotations.get(bone.name).push(...parent.clone().invert().multiply(world).toArray());
    }
    const rise = pose.get('mixamorigHips').position.clone().sub(sourceRest.get('mixamorigHips').position).multiplyScalar(hipScale);
    const inverse = target.scene.getObjectByName('mixamorigHips').parent.matrixWorld.clone().invert();
    hips.push(...targetRest.get('mixamorigHips').position.clone().add(rise).applyMatrix4(inverse).toArray());
  }
  return { times, rotations, hips };
}

const dance = await bakeDance();
const io = new NodeIO().registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready;
const document = await io.read(SOURCE);
const root = document.getRoot(), buffer = root.listBuffers()[0];
const input = document.createAccessor('dance-time').setType('SCALAR').setArray(new Float32Array(dance.times)).setBuffer(buffer);
const animation = document.createAnimation('dance_02');
const channel = (node, path, array, type) => {
  const output = document.createAccessor().setType(type).setArray(new Float32Array(array)).setBuffer(buffer);
  const sampler = document.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  animation.addSampler(sampler).addChannel(document.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler));
};
const nodes = new Map(root.listNodes().map(node => [node.getName().replace(/[^a-zA-Z0-9_]/g, ''), node]));
for (const [name, values] of dance.rotations) channel(nodes.get(name), 'rotation', values, 'VEC4');
channel(nodes.get('mixamorigHips'), 'translation', dance.hips, 'VEC3');

await document.transform(
  prune({ keepAttributes: true, keepLeaves: true }), dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 86, resize: [1536, 1536], slots: /baseColor/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 82, resize: [1024, 1024], slots: /^(?!baseColor).*$/ }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(OUTPUT, document);
const bytes = await fs.readFile(OUTPUT);
await fs.writeFile(OUTPUT.replace('.glb', '.json'), `${JSON.stringify({
  sourceFilename: 'santa claus.glb', model: 'santa-new.glb', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  animations: ['dance_02'], animationSource: 'santa-dance.glb（重定向）', playbackRangeSeconds: [1, 4],
}, null, 2)}\n`);
console.log(OUTPUT, (bytes.length / 1e6).toFixed(2), 'MB');
