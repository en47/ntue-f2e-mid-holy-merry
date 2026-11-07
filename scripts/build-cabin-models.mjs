// 由原始 GLB 產生 Santa 小屋用的壓縮模型；原檔不變。執行：node scripts/build-cabin-models.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
// 和首頁同一套：只壓貼圖與頂點資料，骨架不動，頭部與身體的程式動作才能照舊。
const SIZE = 1536, QUALITY = 84;
for (const name of ['santa-seated']) {
  const source = `assets/models/${name}.glb`, output = `assets/models/${name}-web.glb`;
  const document = await io.read(source);
  // Tripo 附帶的體積材質沒有搭配透光，畫面上不起作用，只是多餘的資料。
  document.getRoot().listExtensionsUsed().filter(extension => extension.extensionName === 'KHR_materials_volume').forEach(extension => extension.dispose());
  await document.transform(dedup(), prune({ keepAttributes: true, keepExtras: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: QUALITY, resize: [SIZE, SIZE] }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(output, document);
  const bytes = await fs.readFile(output);
  await fs.writeFile(output.replace('.glb', '.json'), `${JSON.stringify({ source, model: output.split('/').pop(), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }, null, 2)}\n`);
  console.log(output, (bytes.length / 1e6).toFixed(2), 'MB');
}
