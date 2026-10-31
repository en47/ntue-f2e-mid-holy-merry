// 由原始 GLB 產生 Wish 頁用的壓縮模型；原檔不變。執行：node scripts/build-wish-models.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const JOBS = [
  // 樹的重量在幾何；貼圖留足夠解析度，形狀以誤差上限簡化，輪廓與信封錨點不變。
  { source: 'assets/models/wish-tree.glb', output: 'assets/models/wish-tree-web.glb', size: 2048, ratio: .22, error: .0012 },
  // 精靈在畫面上很小，重量都在貼圖；骨架與動畫不動。
  { source: 'assets/models/wish-elf-original.glb', output: 'assets/models/wish-elf-web.glb', size: 1024 },
];
for (const { source, output, size, ratio, error } of JOBS) {
  const document = await io.read(source);
  await document.transform(dedup(), ...(ratio ? [weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error })] : []), prune({ keepAttributes: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 82, resize: [size, size] }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(output, document);
  const bytes = await fs.readFile(output);
  await fs.writeFile(output.replace('.glb', '.json'), `${JSON.stringify({ source, model: output.split('/').pop(), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }, null, 2)}\n`);
  console.log(output, (bytes.length / 1e6).toFixed(2), 'MB');
}
