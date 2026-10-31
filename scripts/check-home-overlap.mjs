// 量首頁緞帶是否壓到角色（需先啟動本機伺服器）：只留 3D 畫布、舞台填洋紅，連拍取跳舞時的最高點。
import { chromium } from 'playwright';

const sizes = [[1440, 684], [1440, 900], [1366, 768], [1280, 720], [1920, 1080], [1024, 768], [900, 700], [820, 700], [768, 1024], [768, 700], [700, 800], [616, 700], [616, 900], [601, 700], [430, 932], [390, 664], [375, 812]];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const reader = await browser.newPage();
// 第一個非洋紅像素的 y；只掃舞台範圍內。
const firstInk = (png, box) => reader.evaluate(async ([data, box]) => {
  const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
  const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
  const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
  const pixels = context.getImageData(box.left, box.top, box.width, box.height).data;
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    const i = (y * box.width + x) * 4;
    if (!(pixels[i] > 200 && pixels[i + 1] < 70 && pixels[i + 2] > 200)) return box.top + y;
  }
  return Infinity;
}, [png.toString('base64'), box]);
let bad = 0;
for (const [width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${process.env.BASE ?? 'http://127.0.0.1:5500'}/index.html`);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-model-slot]')].every(slot => slot.dataset.state === 'ready'), null, { timeout: 150000 });
  await page.waitForTimeout(4500);
  const { ribbon, box } = await page.evaluate(() => {
    const stage = document.querySelector('.storybook').getBoundingClientRect();
    return { ribbon: Math.round(document.querySelector('.story-tagline').getBoundingClientRect().bottom), box: { left: Math.ceil(stage.left) + 10, top: Math.ceil(stage.top) + 10, width: Math.floor(stage.width) - 20, height: Math.min(Math.floor(stage.height) - 20, innerHeight - Math.ceil(stage.top) - 12) } };
  });
  await page.addStyleTag({ content: `.storybook{background:#f0f!important}.storybook *{visibility:hidden!important}.characters-canvas{visibility:visible!important}` });
  await page.waitForTimeout(300);
  let top = Infinity;
  for (let shot = 0; shot < 8; shot++) { top = Math.min(top, await firstInk(await page.screenshot(), box)); await page.waitForTimeout(320); }
  if (top - ribbon < 8) bad++;
  console.log(`${width}x${height} ribbon ${ribbon} character ${top} gap ${top - ribbon}`);
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} overlaps` : 'no overlaps');
