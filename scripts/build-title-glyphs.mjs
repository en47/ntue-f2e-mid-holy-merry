// 把 Merry Christmas 轉成逐字 SVG 路徑，產生 js/data/title-glyphs.js；執行：node scripts/build-title-glyphs.mjs
import fs from 'node:fs/promises';
import opentype from 'opentype.js';

const font = opentype.parse((await fs.readFile('assets/fonts/mountains-of-christmas-700.woff')).buffer);
const WIDTH = 760, SIZE = 168, LINES = [['Merry', 158], ['Christmas', 316]];
const glyphs = [];
for (const [text, baseline] of LINES) {
  const left = (WIDTH - font.getAdvanceWidth(text, SIZE)) / 2;
  let x = left;
  for (const char of text) {
    const box = font.getPath(char, x, baseline, SIZE).getBoundingBox();
    glyphs.push({ char, d: font.getPath(char, x, baseline, SIZE).toPathData(1), pivot: [Math.round((box.x1 + box.x2) / 2), baseline] });
    x += font.getAdvanceWidth(char, SIZE);
  }
}
await fs.writeFile('js/data/title-glyphs.js', `// 由 scripts/build-title-glyphs.mjs 產生，請勿手改。\nexport const TITLE_BOX = '0 0 ${WIDTH} 380';\nexport const titleGlyphs = ${JSON.stringify(glyphs)};\n`);
console.log(glyphs.length, 'glyphs');
