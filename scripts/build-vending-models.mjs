// 由 Tripo3D 的原始 GLB 產生販賣機頁用的壓縮模型；原檔不變。執行：node scripts/build-vending-models.mjs
// 原檔在 assets/models/source/（每個約 27MB，只留在本機、不進版本控制）；輸出的 *-web.glb 與雜湊表進版本控制，
// 雜湊表也記下原檔的 SHA-256，日後可以核對用的是哪一份原檔。
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
// Tripo 匯出的每個模型約 76 萬面、三張 4096 貼圖。販賣機是主角，留多一點；四樣商品中等；按鈕在畫面上很小。
const SIZES = { machine: { size: 2048, ratio: .07, error: .006 }, item: { size: 1024, ratio: .03, error: .01 }, button: { size: 512, ratio: .008, error: .02 } };
const JOBS = [['vending-machine', 'machine'], ...['stocking', 'tree', 'gingerbread', 'snowman'].flatMap(name => [[`vending-${name}`, 'item'], [`vending-${name}-button`, 'button']])];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const [name, kind] of JOBS) {
  const source = `assets/models/source/${name}.glb`, output = `assets/models/${name}-web.glb`, { size, ratio, error } = SIZES[kind];
  const original = await fs.readFile(source), document = await io.readBinary(original);
  await document.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error }), prune({ keepAttributes: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 82, resize: [size, size] }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(output, document);
  const bytes = await fs.readFile(output);
  await fs.writeFile(output.replace('.glb', '.json'), `${JSON.stringify({ source, sourceBytes: original.length, sourceSha256: sha256(original), model: output.split('/').pop(), bytes: bytes.length, sha256: sha256(bytes) }, null, 2)}\n`);
  let triangles = 0; for (const mesh of document.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
  console.log(output, (bytes.length / 1e6).toFixed(2), 'MB,', Math.round(triangles), 'triangles');
}
