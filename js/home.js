import { dialogues } from './data/dialogues.js';
import { mountFlipCounter } from './components/flip-counter.js';

// 固定以台灣時間的 12/25 00:00 為目標；聖誕節當天顯示祝福。
export function getChristmasCountdown(now = new Date()) {
  const taipei = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  let year = taipei.getUTCFullYear();
  const month = taipei.getUTCMonth();
  const day = taipei.getUTCDate();
  const isChristmas = month === 11 && day === 25;
  if (month === 11 && day > 25) year += 1;
  const target = Date.parse(`${year}-12-25T00:00:00+08:00`);
  let total = isChristmas ? 0 : Math.max(0, Math.floor((target - now.getTime()) / 1000));
  const days = Math.floor(total / 86400);
  total %= 86400;
  const hours = Math.floor(total / 3600);
  total %= 3600;
  return { days, hours, minutes: Math.floor(total / 60), seconds: total % 60, isChristmas, year };
}
const counters = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map(unit => [unit, mountFlipCounter(document.querySelector(`[data-unit="${unit}"]`))]));
function updateCountdown() {
  const result = getChristmasCountdown();
  for (const [unit, counter] of Object.entries(counters)) counter.set(String(result[unit]).padStart(2, '0'));
  // The cards are hidden from screen readers; this reads as one sentence and changes once a minute.
  document.querySelector('.countdown-units').setAttribute('aria-label', `${result.days} 天 ${result.hours} 時 ${result.minutes} 分`);
  document.querySelector('#countdown-label').textContent = result.isChristmas ? '聖誕快樂！今天就是聖誕節。' : `距離 ${result.year} 聖誕節，還有`;
}
updateCountdown();
let countdownTimer = setInterval(updateCountdown, 1000);
window.addEventListener('pagehide', () => clearInterval(countdownTimer));
window.addEventListener('pageshow', event => {
  if (event.persisted) { updateCountdown(); countdownTimer = setInterval(updateCountdown, 1000); }
});
// 所有對話共用一個狀態，快速連點也不會產生重疊泡泡。
export function mountStorybook(root) {
  if (!root) return { destroy() {} };
  const cleanups = [], timers = new Set();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendingFrame = null, active = null, activeId = null, lastLine = {};
  const slot = id => root.querySelector(`[data-model-slot="${id}"]`);
  const later = (callback, delay) => {
    const id = setTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id); return id;
  };
  const listen = (target, type, callback) => {
    target.addEventListener(type, callback); cleanups.push(() => target.removeEventListener(type, callback));
  };
  const clear = () => {
    timers.forEach(clearTimeout); timers.clear();
    if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
    for (const id of ['santa','reindeer']) {
      const letter = root.querySelector(`#${id}-letter`);
      letter.classList.remove('is-visible'); letter.hidden = true;
      slot(id).setAttribute('aria-expanded', 'false');
    }
    active = null; activeId = null;
  };
  function dismiss() {
    timers.forEach(clearTimeout); timers.clear();
    if (!active) return;
    const letter = active, id = activeId; active = null; activeId = null;
    slot(id).setAttribute('aria-expanded', 'false');
    if (document.activeElement === letter) slot(id).focus({ preventScroll: true });
    letter.classList.remove('is-visible');
    later(() => { letter.hidden = true; }, motion.matches ? 0 : 500);
  }
  function speak(id) {
    clear();
    const pool = dialogues[id].filter(line => line !== lastLine[id]);
    const line = pool[Math.floor(Math.random() * pool.length)] ?? dialogues[id][0];
    lastLine[id] = line;
    root.querySelector(`#${id}-dialogue`).textContent = line;
    root.querySelector('#dialogue-announcer').textContent = `${id === 'santa' ? '聖誕老人' : '麋鹿'}說：${line}`;
    const letter = root.querySelector(`#${id}-letter`); active = letter; activeId = id; letter.hidden = false;
    slot(id).setAttribute('aria-expanded', 'true');
    // 先提交離屏狀態，再滑入；減少動態設定不產生過場。
    void letter.offsetWidth;
    pendingFrame = requestAnimationFrame(() => { pendingFrame = null; if (active === letter) letter.classList.add('is-visible'); });
    later(dismiss, Math.max(5000, line.length * 200)); // 長句多留一點閱讀時間。
  }
  for (const id of ['santa','reindeer']) {
    listen(root.querySelector(`#${id}-letter`), 'click', dismiss);
  }
  listen(root, 'character:speak', event => {
    if (['santa', 'reindeer'].includes(event.detail?.character)) speak(event.detail.character);
  });
  listen(document, 'keydown', event => { if (event.key === 'Escape' && active) { event.preventDefault(); dismiss(); } });
  const replay = () => { clear(); root.classList.remove('is-opening'); void root.offsetWidth; root.classList.add('is-opening'); };
  listen(root.querySelector('#replay-story'), 'click', replay);
  // 鍵盤提示只給鍵盤使用者；滑鼠點角色後焦點留在按鈕上，不該跳出提示。
  listen(document, 'keydown', event => { if (event.key === 'Tab') root.classList.add('uses-keyboard'); });
  listen(document, 'pointerdown', () => root.classList.remove('uses-keyboard'));
  listen(document, 'visibilitychange', () => { if (document.hidden) clear(); });
  replay();
  return { destroy() { clear(); cleanups.forEach(cleanup => cleanup()); root.classList.remove('is-opening'); } };
}
let storybook = document.querySelector('.storybook');
let storyController = storybook ? mountStorybook(storybook) : null;
window.addEventListener('pagehide', () => { storyController?.destroy(); storyController = null; });
window.addEventListener('pageshow', event => { if (event.persisted && storybook) storyController = mountStorybook(storybook); });
