// 把 Santa 頁每一片紙板（小屋、聖誕村、吊乾草的零件、雪人配件，以及招牌星星、郵筒與暗格打開後的樣子）事先畫成 WebP，
// 網頁開啟時只要下載圖片，不必在瀏覽器裡逐張跑紙張濾鏡。畫稿與網頁共用 js/components/cabin-paint.js，在 Node 組成 SVG
// 標記後交給 Chromium 點陣化（與網頁同一套繪製），再由 sharp 壓成 WebP。
// 產出：images/cabin/{large,small}/*.webp、js/data/cabin-cuts.js、docs/CABIN-BOARDS.json。
// 執行：node scripts/build-cabin-boards.mjs（只重畫畫稿有變的紙板；加 --all 全部重畫）
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withSvgDom } from './svg-dom.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'images/cabin', MANIFEST = 'docs/CABIN-BOARDS.json', DATA = 'js/data/cabin-cuts.js';
// 大套給桌機與平板，小套給手機（cabin-paint.js 的 cutSet 依螢幕挑選）。
const SETS = { large: .75, small: .5 }, WEBP = { quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true };
const sha = value => createHash('sha256').update(value).digest('hex');

// 每張圖的畫稿標記與指紋：指紋一致就表示圖片仍對應目前的畫法（tests/smoke.mjs 也用同一個函式檢查）。
export async function cabinCuts() {
  return withSvgDom(async () => {
    const { everyCut, boardMarkup } = await import(pathToFileURL(path.join(project, 'js/components/cabin-paint.js')).href);
    return Object.entries(SETS).flatMap(([set, quality]) => everyCut().map(([name, board, state]) => {
      const markup = boardMarkup(board, quality, state);
      return { set, name, file: `${set}/${name}.webp`, markup, fingerprint: sha(markup) };
    }));
  });
}
export { SETS, WEBP };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // 瀏覽器與壓縮只在真正建置時載入；tests/smoke.mjs 只需要上面的 cabinCuts。
  const [{ chromium }, { default: sharp }] = await Promise.all([import('playwright'), import('sharp')]);
  const all = process.argv.includes('--all'), started = Date.now();
  const before = JSON.parse(await fs.readFile(path.join(project, MANIFEST), 'utf8').catch(() => '{"files":{}}')).files;
  const cuts = await cabinCuts(), files = {};
  const fresh = async cut => {
    const old = before[cut.file]; if (all || !old || old.fingerprint !== cut.fingerprint) return false;
    const bytes = await fs.readFile(path.join(project, OUT, cut.file)).catch(() => null);
    return bytes && sha(bytes) === old.sha256;
  };
  const todo = [];
  for (const cut of cuts) { if (await fresh(cut)) files[cut.file] = before[cut.file]; else todo.push(cut); }
  for (const set of Object.keys(SETS)) await fs.mkdir(path.join(project, OUT, set), { recursive: true });
  const browser = await chromium.launch();
  try {
    // 四個分頁輪流畫，每張都用與網頁相同的方式：SVG 圖片原尺寸畫進 canvas。
    const queue = [...todo];
    await Promise.all(Array.from({ length: 4 }, async () => {
      const page = await browser.newPage();
      for (let cut = queue.shift(); cut; cut = queue.shift()) {
        const png = await page.evaluate(async markup => {
          const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          canvas.getContext('2d').drawImage(image, 0, 0);
          return canvas.toDataURL('image/png').slice('data:image/png;base64,'.length);
        }, cut.markup);
        const { data, info } = await sharp(Buffer.from(png, 'base64')).webp(WEBP).toBuffer({ resolveWithObject: true });
        await fs.writeFile(path.join(project, OUT, cut.file), data);
        files[cut.file] = { fingerprint: cut.fingerprint, sha256: sha(data), width: info.width, height: info.height, bytes: data.length };
      }
      await page.close();
    }));
  } finally { await browser.close(); }
  // 畫法已拿掉的紙板，圖片也一併移除。
  for (const set of Object.keys(SETS)) for (const name of await fs.readdir(path.join(project, OUT, set))) if (!files[`${set}/${name}`]) await fs.rm(path.join(project, OUT, set, name));
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(path.join(project, MANIFEST), `${JSON.stringify({ generator: 'scripts/build-cabin-boards.mjs', sets: SETS, webp: WEBP, files: sorted }, null, 2)}\n`);
  // 網址版本：兩套圖片的內容都算進去，任何一張重畫就換網址。
  const names = [...new Set(cuts.map(cut => cut.name))].sort();
  const sheets = Object.fromEntries(names.map(name => [name, sha(Object.keys(SETS).map(set => files[`${set}/${name}.webp`].sha256).join()).slice(0, 10)]));
  await fs.writeFile(path.join(project, DATA), `// 由 scripts/build-cabin-boards.mjs 產生，請勿手改。\nexport const CUTS = ${JSON.stringify({ sets: SETS, sheets })};\n`);
  const total = set => Object.entries(sorted).filter(([file]) => file.startsWith(`${set}/`)).reduce((sum, [, entry]) => sum + entry.bytes, 0);
  console.log(`重畫 ${todo.length} 張、沿用 ${cuts.length - todo.length} 張，${((Date.now() - started) / 1000).toFixed(1)} 秒；`, Object.keys(SETS).map(set => `${set} ${(total(set) / 1e6).toFixed(2)} MB`).join('、'));
}
