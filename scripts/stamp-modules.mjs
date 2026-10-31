// 依檔案內容替每頁的 CSS、入口與所有內部 ES 模組加上快取版本：入口寫在 ?v=，內部模組寫進 importmap。
// 改完 CSS / JS 後執行：node scripts/stamp-modules.mjs；npm test 會檢查是否忘了執行。
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PAGES = ['index.html', 'intro.html', 'game.html', 'wish.html'];
const THREE = './vendor/three/build/three.module.js';
const version = async file => createHash('sha256').update(await fs.readFile(path.join(project, file))).digest('hex').slice(0, 10);

// 靜態與動態 import 都要走到，首頁 3D 場景就是動態載入的。
async function walk(file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = await fs.readFile(path.join(project, file), 'utf8');
  for (const [, specifier] of source.matchAll(/(?:from\s+|import\s*\(\s*|^import\s+)['"](\.[^'"]+)['"]/gm)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    if (target.startsWith('js/')) await walk(target, seen);
  }
}

export async function stamp(html) {
  const entries = [...html.matchAll(/<script type="module" src="(js\/[^"?]+)/g)].map(match => match[1]);
  const modules = new Set();
  for (const entry of entries) await walk(entry, modules);
  const imports = { three: THREE };
  for (const file of [...modules].filter(file => !entries.includes(file)).sort()) imports[`./${file}`] = `./${file}?v=${await version(file)}`;
  const map = `<script type="importmap">${JSON.stringify({ imports })}</script>`;
  let next = /<script type="importmap">.*<\/script>/.test(html)
    ? html.replace(/<script type="importmap">.*<\/script>/, () => map)
    : html.replace(/( *)<script type="module"/, (match, indent) => `${indent}${map}\n${match}`);
  for (const [, , file] of [...next.matchAll(/(src|href)="((?:js|css)\/[^"?]+)(?:\?v=[^"]*)?"/g)]) {
    const stamped = await version(file);
    next = next.replace(new RegExp(`((?:src|href)=")${file.replaceAll('.', '\\.')}(?:\\?v=[^"]*)?"`, 'g'), `$1${file}?v=${stamped}"`);
  }
  return next;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const page of PAGES) {
    const file = path.join(project, page), html = await fs.readFile(file, 'utf8');
    await fs.writeFile(file, await stamp(html));
  }
  console.log('stamped', PAGES.join(', '));
}
