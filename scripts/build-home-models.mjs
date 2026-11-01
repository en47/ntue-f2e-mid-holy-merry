// 由原始 GLB 產生首頁用的壓縮模型；原檔不變。執行：node scripts/build-home-models.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
// 重量都在貼圖；骨架、動畫與頂點不動，角色與首頁的動作邏輯才能照舊運作。
const SIZE = 1536, QUALITY = 84;
for (const name of ['santa-dance', 'reindeer']) {
  const source = `assets/models/${name}.glb`, output = `assets/models/${name}-web.glb`;
  const document = await io.read(source);
  await document.transform(dedup(), prune({ keepAttributes: true, keepExtras: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: QUALITY, resize: [SIZE, SIZE] }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(output, document);
  const bytes = await fs.readFile(output);
  await fs.writeFile(output.replace('.glb', '.json'), `${JSON.stringify({ source, model: output.split('/').pop(), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }, null, 2)}\n`);
  console.log(output, (bytes.length / 1e6).toFixed(2), 'MB');
}
