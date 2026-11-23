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
// Tripo 匯出的每個模型約 76 萬面、三張 4096 貼圖（顏色、法線、粗糙度）。2026-11-23 使用者嫌商品和按鈕糊、凹凸變形：
// 顏色貼圖留大一點（`color`），法線與粗糙度小一點（`other`），面數也多留一些（`ratio`、`error`）。也嫌太黃：販賣機和按鈕的
// 顏色貼圖降一點飽和度（`muted`），接近網站低飽和的紅、綠、金；商品照原本的顏色。
const SIZES = { machine: { color: 4096, other: 2048, ratio: .12, error: .003, muted: .86 }, item: { color: 2048, other: 1024, ratio: .1, error: .004, muted: 1 }, button: { color: 1024, other: 512, ratio: .05, error: .004, muted: .86 } };
const JOBS = [['vending-machine', 'machine'], ...['stocking', 'tree', 'gingerbread', 'snowman'].flatMap(name => [[`vending-${name}`, 'item'], [`vending-${name}-button`, 'button']])];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const [name, kind] of JOBS) {
  const source = `assets/models/source/${name}.glb`, output = `assets/models/${name}-web.glb`, { color, other, ratio, error, muted } = SIZES[kind];
  const original = await fs.readFile(source), document = await io.readBinary(original);
  if (muted < 1) for (const material of document.getRoot().listMaterials()) { const texture = material.getBaseColorTexture(); if (texture) texture.setImage(new Uint8Array(await sharp(Buffer.from(texture.getImage())).modulate({ saturation: muted }).png().toBuffer())).setMimeType('image/png'); }
  await document.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error }), prune({ keepAttributes: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 86, resize: [color, color], slots: /^baseColor/ }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80, resize: [other, other], slots: /^(?!baseColor)/ }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(output, document);
  const bytes = await fs.readFile(output);
  await fs.writeFile(output.replace('.glb', '.json'), `${JSON.stringify({ source, sourceBytes: original.length, sourceSha256: sha256(original), model: output.split('/').pop(), bytes: bytes.length, sha256: sha256(bytes) }, null, 2)}\n`);
  let triangles = 0; for (const mesh of document.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
  console.log(output, (bytes.length / 1e6).toFixed(2), 'MB,', Math.round(triangles), 'triangles');
}
