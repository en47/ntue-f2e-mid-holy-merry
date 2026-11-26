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
// 頁面大標題：寬度跟著字串長度，四周留白給紙邊與晃動。
const heading = (lines, height) => {
  const width = Math.ceil(Math.max(...lines.map(([text]) => font.getAdvanceWidth(text, 150))) + 60);
  return { box: `0 0 ${width} ${height}`, ratio: +(width / height).toFixed(4), glyphs: layout(lines, width, 150) };
};
const headings = {
  'christmas-games': heading([['Christmas', 150], ['Games', 290]], 360),
  'the-wish-room': heading([['The Wish Room', 150]], 220),
  'santas-cabin': heading([["Santa's Cabin", 150]], 220),
  'christmas-vending': heading([['Christmas', 150], ['Vending', 290]], 360),
  'christmas-market': heading([['Christmas', 150], ['Market', 290]], 360),
  // Santa 頁四個結局劇場的標題。
  'ending-a': heading([['Going Home', 150]], 220),
  'ending-b': heading([['Wish Granted', 150]], 220),
  'ending-c': heading([['Staying On', 150]], 220),
  'ending-d': heading([['Christmas', 150], ['Miracle', 290]], 360),
  // Santa 頁第一次來的歡迎緞帶：小字一行、大字一行。
  'welcome-to': heading([['Welcome to', 150]], 220),
  'christmas-village': heading([['Christmas Village', 150]], 220),
};
const tagline = layout([["Holy Moly! It's Christmas!", 76]], 720, 50).map(glyph => glyph.d).join('');
await fs.writeFile('js/data/tagline-glyphs.js', `${header}\nexport const TAGLINE_TEXT = "Holy Moly! It's Christmas!";\nexport const taglinePath = ${JSON.stringify(tagline)};\n`);
await fs.writeFile('js/data/title-glyphs.js', `${header}\nexport const TITLE_BOX = '0 0 760 380';\nexport const titleGlyphs = ${JSON.stringify(title)};\n`);
await fs.writeFile('js/data/story-glyphs.js', `${header}\nexport const STORY_BOX = '0 0 660 360';\nexport const storyGlyphs = ${JSON.stringify(story)};\n`);
await fs.writeFile('js/data/heading-glyphs.js', `${header}\nexport const headingGlyphs = ${JSON.stringify(headings)};\n`);
// 只給 Santa 頁小屋用：書脊與繪本封面上的單一字母，字級 100、基線在 y = 0（其他頁的字形檔不受影響）。
const letters = Object.fromEntries([...'HOLYMERSANTK'].map(char => {
  const path = font.getPath(char, 0, 0, 100), box = path.getBoundingBox();
  return [char, { d: path.toPathData(1), box: [box.x1, box.y1, box.x2, box.y2].map(value => +value.toFixed(1)) }];
}));
await fs.writeFile('js/data/cabin-glyphs.js', `${header}\nexport const cabinGlyphs = ${JSON.stringify(letters)};\n`);
// 販賣機招牌的立體字（vending-papercraft.js 照輪廓擠出）：每個字母在原點、字級 100、基線在 y = 0，另記前進寬度，好加字距。
const marquee = ['CHRISTMAS', 'VENDING'].map(text => [...text].map(char => ({ char, d: font.getPath(char, 0, 0, 100).toPathData(1), advance: +font.getAdvanceWidth(char, 100).toFixed(1) })));
await fs.writeFile('js/data/marquee-glyphs.js', `${header}\nexport const marqueeGlyphs = ${JSON.stringify(marquee)};\n`);
console.log(title.length, story.length, 'glyphs');
// 聖誕市集降臨曆小屋（vending-advent-art.js）：招牌一行字與抽屜上的數字，字級 100、基線在 y = 0；招牌記下寬度與上下緣，數字記前進寬度。
// 這兩樣自己寫路徑：toPathData 遇到四捨五入成 -0 的值會黏在前一個數字後面（例如 181.50Q），透視時要逐點讀回來。
const num = value => { const text = String(Math.round(value * 10) / 10); return text === '-0' ? '0' : text; };
const pathData = path => path.commands.map(({ type, x, y, x1, y1, x2, y2 }) => type === 'Z' ? 'Z' : type + (type === 'C' ? [x1, y1, x2, y2, x, y] : type === 'Q' ? [x1, y1, x, y] : [x, y]).map(num).join(' ')).join('');
const signPath = font.getPath('Advent Calendar', 0, 0, 100), signBox = signPath.getBoundingBox();
const advent = {
  sign: { d: pathData(signPath), box: [signBox.x1, signBox.y1, signBox.x2, signBox.y2].map(value => +value.toFixed(1)) },
  digits: Object.fromEntries([...'0123456789'].map(char => [char, { d: pathData(font.getPath(char, 0, 0, 100)), advance: +font.getAdvanceWidth(char, 100).toFixed(1) }])),
};
await fs.writeFile('js/data/advent-glyphs.js', `${header}\nexport const adventGlyphs = ${JSON.stringify(advent)};\n`);
