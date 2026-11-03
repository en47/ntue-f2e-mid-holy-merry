// 頁尾說明彈窗：紙雕信紙、紅色標題吊牌與冬青；內容一律 textContent。
import { holly, paperFilter, paperLayer, rasterize, shape } from './paper-art.js';
import { star, tagArt } from './paper-props.js';

// 信紙會依彈窗尺寸拉伸，所以只畫毛邊與縫線；冬青、星星另成不拉伸的圖層。
function sheet() {
  const svg = shape('svg', { viewBox: '0 0 520 640', preserveAspectRatio: 'none' });
  const page = shape('g', { filter: paperFilter(svg, 'info-sheet', { grain: .35, shadow: .22 }) }, svg);
  shape('path', { d: 'M16 18C140 12 380 14 504 16 508 160 506 480 506 622 380 628 140 626 14 624 10 480 12 160 16 18Z', fill: '#fdf6e6' }, page);
  shape('rect', { x: 32, y: 34, width: 456, height: 572, rx: 16, fill: 'none', stroke: '#a84a42', 'stroke-opacity': .4, 'stroke-width': 2, 'stroke-dasharray': '10 8' }, svg);
  return rasterize(svg).src;
}

function decorate(dialog) {
  dialog.style.setProperty('--info-sheet', `url("${sheet()}")`);
  const title = dialog.querySelector('#info-title');
  const text = document.createElement('span');
  text.className = 'info-title-text';
  title.replaceChildren(text);
  paperLayer(title, '0 0 240 90', 'info-title-tag', tagArt('#ad3c3b', '#87302f'), { paper: { scale: .7, grain: .4, shadow: .24 }, eager: true, preserveAspectRatio: 'none' });
  paperLayer(title, '0 0 100 80', 'info-title-holly', group => { holly(group, 46, 44, .85); star(group, 84, 20, 9); }, { paper: { scale: .5, grain: .4, shadow: .3 }, eager: true });
  const list = document.createElement('dl');
  list.className = 'info-list';
  dialog.querySelector('#info-content').after(list);
  return { text, list };
}

const parts = new WeakMap();
// `content` 是一段文字，或 [標題, 說明] 的陣列（FAQ、無障礙說明）。
export function showInfo(dialog, title, content) {
  if (!parts.has(dialog)) parts.set(dialog, decorate(dialog));
  const { text, list } = parts.get(dialog), paragraph = dialog.querySelector('#info-content');
  const isList = Array.isArray(content);
  text.textContent = title;
  paragraph.hidden = isList; list.hidden = !isList;
  if (isList) {
    list.replaceChildren(...content.flatMap(([term, detail]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = term; dd.textContent = detail;
      return [dt, dd];
    }));
  } else paragraph.textContent = content;
  dialog.scrollTop = 0;
  dialog.showModal();
}
