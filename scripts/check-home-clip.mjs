// 找出被 viewBox 切到的紙片（需先啟動本機伺服器）：圖片邊緣有不透明像素，且該邊落在可見範圍內，就是硬切邊。
// 執行：node scripts/check-home-clip.mjs [頁面…]，預設檢查首頁與 Game 頁。
import { chromium } from 'playwright';

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'game.html'];
const browser = await chromium.launch();
let failures = 0;
for (const name of pages) for (const [width, height] of [[375, 812], [768, 1024], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${process.env.BASE ?? 'http://127.0.0.1:5500'}/${name}`, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const clipped = await page.evaluate(async () => {
    const stage = (document.querySelector('.storybook') ?? document.querySelector('.games-hero') ?? document.body).getBoundingClientRect();
    const found = [];
    for (const image of document.querySelectorAll('.art-layer img, .foreground-scene img')) {
      // 畫面外的延遲載入圖片可能永遠不解碼，不能無限等。
      image.loading = 'eager';
      await Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
      const rect = image.getBoundingClientRect(), { naturalWidth: w, naturalHeight: h } = image;
      // 海洋底紙與封面內襯鋪滿到邊；海港的水與岩岸、Game 的雪山與帳篷下緣都埋在前景後方。
      if (!w || !rect.width || image.closest('.toy-globe-lands, .toy-globe-base, .night-stars, .night-forest, .night-snow, .night-cottage, .games-far, .games-carousel, .map-sea, .intro-cover-inside-art, .harbor-far, .harbor-wave, .harbor-boat, .harbor-floe, .harbor-glow, .harbor-land') || getComputedStyle(image.parentElement).display === 'none') continue;
      const inPage = Boolean(image.closest('.page-foreground'));
      const bound = inPage ? image.closest('.page-foreground').getBoundingClientRect() : stage;
      const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, w, h);
      const edges = { left: [0, 0, 1, h], right: [w - 1, 0, 1, h], top: [0, 0, w, 1], bottom: [0, h - 1, w, 1] };
      // 底邊埋在雪地後面的背景層看不到切口，不算裁切。
      const cover = !inPage && document.querySelector('.home-ground, .games-hero-hill')?.getBoundingClientRect();
      const buried = cover && parseInt(getComputedStyle(image.parentElement).zIndex) < parseInt(getComputedStyle(document.querySelector('.home-ground, .games-hero-hill')).zIndex) && rect.bottom > cover.top + 2;
      const visible = { left: rect.left > bound.left + 1, right: rect.right < bound.right - 1, top: rect.top > bound.top + 1, bottom: rect.bottom < bound.bottom - 1 && !buried };
      for (const [edge, box] of Object.entries(edges)) {
        if (!visible[edge] || (edge === 'top' && image.closest('.wreath-swing, .intro-hanger, .frame-charm'))) continue; // 花圈與吊飾的繩子本來就從頂端垂下。
        const data = context.getImageData(...box).data;
        let solid = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 24) solid++;
        if (solid > 2) found.push(`${image.parentElement.className.replace('art-layer', '').trim() || image.parentElement.parentElement.className} ${edge} ${solid}px`);
      }
    }
    return found;
  });
  failures += clipped.length;
  console.log(name, width, clipped.length ? clipped : 'ok');
  await page.close();
}
await browser.close();
console.log(failures ? `${failures} clipped edges` : 'no clipped edges');
