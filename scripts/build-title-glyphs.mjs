// 把 Merry Christmas 轉成逐字 SVG 路徑，產生 js/data/title-glyphs.js；執行：node scripts/build-title-glyphs.mjs
import fs from 'node:fs/promises';
import opentype from 'opentype.js';

const font = opentype.parse((await fs.readFile('assets/fonts/mountains-of-christmas-700.woff')).buffer);
function layout(lines, width, size) {
  const glyphs = [];
  for (const [text, baseline] of lines) {
    const left = (width - font.getAdvanceWidth(text, size)) / 2;
    let x = left;
    for (const char of text) {
      const box = font.getPath(char, x, baseline, size).getBoundingBox();
      glyphs.push({ char, d: font.getPath(char, x, baseline, size).toPathData(1), pivot: [Math.round((box.x1 + box.x2) / 2), baseline] });
      x += font.getAdvanceWidth(char, size);
    }
  }
  return glyphs;
}
const header = '// 由 scripts/build-title-glyphs.mjs 產生，請勿手改。';
const title = layout([['Merry', 158], ['Christmas', 316]], 760, 168);
const story = layout([['Christmas', 150], ['Story', 290]], 660, 150);
const tagline = layout([["Holy Moly! It's Christmas!", 76]], 720, 50).map(glyph => glyph.d).join('');
await fs.writeFile('js/data/tagline-glyphs.js', `${header}\nexport const TAGLINE_TEXT = "Holy Moly! It's Christmas!";\nexport const taglinePath = ${JSON.stringify(tagline)};\n`);
await fs.writeFile('js/data/title-glyphs.js', `${header}\nexport const TITLE_BOX = '0 0 760 380';\nexport const titleGlyphs = ${JSON.stringify(title)};\n`);
await fs.writeFile('js/data/story-glyphs.js', `${header}\nexport const STORY_BOX = '0 0 660 360';\nexport const storyGlyphs = ${JSON.stringify(story)};\n`);
console.log(title.length, story.length, 'glyphs');
