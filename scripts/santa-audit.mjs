// Santa 驗收腳本共用的遮擋與觸控檢查（第 7 階段）。只有設定 AUDIT=檔名 時才會跑：每到一個截圖時機，就檢查畫面上
// 看得到的按鈕與卡片文字——
// - small：手機上手指點得到的範圍小於 44×44 的按鈕（從中間往外探，看不見的放大範圍也算；停用的不算）。
// - covered／text：卡片裡的按鈕或文字，被卡片以外的東西（口袋、線索本、返回鍵、字幕……）蓋住。
//   卡片打開時，後面的場景先不檢查（口袋、線索本、返回鍵照樣檢查），場景上的點擊區被卡片蓋住也不算。
// - outside：按鈕跑出畫面左右。
// 整個舞台本身（`.cabin-gesture`，拖曳環顧用）不算按鈕。
// 結果依「問題＋元素＋蓋住它的東西」合併，記下在哪些時機出現，結束時寫成 JSON。
import fs from 'node:fs';

export function auditor(page, { mobile, width, script }) {
  const file = process.env.AUDIT;
  if (!file) return async () => {};
  const found = new Map();
  process.on('exit', () => {
    let all = {}; try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first script */ }
    all[`${script}@${width}`] = [...found.values()];
    fs.writeFileSync(file, JSON.stringify(all, null, 1));
  });
  return async label => {
    const issues = await page.evaluate(inspect, { mobile }).catch(() => []);
    for (const issue of issues) {
      const key = `${issue.kind}|${issue.what}|${issue.by ?? ''}`;
      if (found.has(key)) found.get(key).at.push(label); else found.set(key, { ...issue, at: [label] });
    }
  };
}

// Runs in the page.
function inspect({ mobile }) {
  const FRONT = '.cabin-letter, .notebook-card, .inspect-card, .inspect-veil, .ending-theatre, .gearbox, .wardrobe, .wish-card';
  // While a card is open, what is behind it waits: only the card itself, and the pocket, the clue book and the way back
  // (which stay in use beside it), are checked.
  const KEPT = '.cabin-bag, .notebook-button, .cabin-back';
  const describe = node => {
    if (!node || node === document.body || node === document.documentElement) return 'page';
    const words = (node.getAttribute('aria-label') || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18);
    return `${node.tagName.toLowerCase()}${[...node.classList].slice(0, 2).map(name => `.${name}`).join('')}${words ? `「${words}」` : ''}`;
  };
  const shown = node => node.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true;
  // What is left of a box once every clipping or scrolling ancestor, and the window, have cut it.
  function seen(node) {
    let { left, top, right, bottom } = node.getBoundingClientRect();
    for (let up = node.parentElement; up && up !== document.body; up = up.parentElement) {
      const style = getComputedStyle(up);
      if (style.overflowX === 'visible' && style.overflowY === 'visible' && style.clipPath === 'none') continue;
      const box = up.getBoundingClientRect();
      left = Math.max(left, box.left); top = Math.max(top, box.top); right = Math.min(right, box.right); bottom = Math.min(bottom, box.bottom);
    }
    left = Math.max(left, 0); top = Math.max(top, 0); right = Math.min(right, innerWidth); bottom = Math.min(bottom, innerHeight);
    return right - left > 2 && bottom - top > 2 ? { left, top, right, bottom } : null;
  }
  // Points on what is seen of it: the middle, and four points a quarter in.
  const points = ({ left, top, right, bottom }) => [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]].map(([fx, fy]) => [left + (right - left) * fx, top + (bottom - top) * fy]);
  const stage = document.querySelector('#cabin-stage'), theatre = document.querySelector('.ending-theatre');
  const roots = [stage, theatre].filter(Boolean), issues = [];
  const inGame = node => roots.some(root => root.contains(node)) && !node.closest('.cabin-explore, .sr-only');
  // Whoever covers `node` at a point, unless that is the node itself, something inside it, or what holds it.
  const coverAt = (node, [x, y]) => { const top = document.elementFromPoint(x, y); return !top || node.contains(top) || top.contains(node) ? null : top; };
  // Something covering a card's own button or words counts unless it is part of the same card or another card above it.
  const wrong = (node, by) => { const card = node.closest(FRONT); if (!card) return !by.closest(FRONT); return !card.contains(by) && !by.closest(FRONT); };
  const open = [...document.querySelectorAll('.cabin-letter, .notebook-card, .inspect-card, .gearbox, .wish-card')].some(card => roots.some(root => root.contains(card)) && shown(card)) || Boolean(theatre?.open);
  const controls = [...document.querySelectorAll('button, a[href], [role="button"], input, select, textarea, summary')].filter(node => inGame(node) && !node.matches('.cabin-gesture') && !node.disabled && shown(node) && getComputedStyle(node).pointerEvents !== 'none' && (!open || node.closest(FRONT) || node.closest(KEPT)));
  // How far from its middle a finger still lands on it, out to 30px past its edge (a larger invisible area counts).
  const reach = (node, rect) => {
    const [cx, cy] = [rect.left + rect.width / 2, rect.top + rect.height / 2], hits = (x, y) => { const top = document.elementFromPoint(x, y); return Boolean(top && node.contains(top)); };
    const out = (dx, dy, limit) => { let d = 0; while (d < limit && hits(cx + dx * (d + 1), cy + dy * (d + 1))) d++; return d; };
    return [out(-1, 0, rect.width / 2 + 30) + out(1, 0, rect.width / 2 + 30) + 1, out(0, -1, rect.height / 2 + 30) + out(0, 1, rect.height / 2 + 30) + 1];
  };
  for (const node of controls) {
    const rect = node.getBoundingClientRect(), view = seen(node);
    if (mobile && view && (rect.width < 43.5 || rect.height < 43.5)) {
      const [width, height] = reach(node, rect);
      if (width < 43.5 || height < 43.5) issues.push({ kind: 'small', what: describe(node), size: `${Math.round(width)}×${Math.round(height)}` });
    }
    if (rect.left < -1 || rect.right > innerWidth + 1) issues.push({ kind: 'outside', what: describe(node), box: [rect.left, rect.right].map(Math.round).join('–') });
    if (!view) continue;
    const covers = points(view).map(point => coverAt(node, point)).filter(by => by && wrong(node, by));
    if (covers.length) issues.push({ kind: 'covered', what: describe(node), by: describe(covers[0].closest('button, a, .cabin-bag, .notebook-button, .cabin-back, .cabin-caption, .cabin-chat, .music-toggle, ' + FRONT) ?? covers[0]), part: `${covers.length}/5` });
  }
  // The words on an open card, and the caption.
  const words = [...document.querySelectorAll(`:is(${FRONT}) :is(p, li, h2, h3, h4, label, strong), .cabin-caption`)].filter(node => inGame(node) && shown(node) && node.textContent.trim() && !node.closest('.sr-only'));
  for (const node of words) {
    const view = seen(node); if (!view) continue;
    const covers = points(view).map(point => coverAt(node, point)).filter(by => by && wrong(node, by) && !by.closest('button, a'));
    if (covers.length >= 2) issues.push({ kind: 'text', what: describe(node), by: describe(covers[0].closest('button, a, .cabin-bag, .notebook-button, .cabin-back, .cabin-caption, .cabin-chat, .music-toggle, ' + FRONT) ?? covers[0]), part: `${covers.length}/5` });
  }
  return issues;
}
