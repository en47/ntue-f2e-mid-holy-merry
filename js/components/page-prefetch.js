// 首頁靜置後，在背景依序預先下載 Game、Wish 的大檔案；換頁時直接從瀏覽器快取拿，不用再等下載。
// 只在用滑鼠的電腦、沒開省流量、不是 2G 慢速網路時進行；一次一個、低優先度，離開首頁就停止。
import { PREFETCH_ASSETS } from '../data/prefetch-assets.js';

export function prefetchLater({ idle = 4000, assets = PREFETCH_ASSETS } = {}) {
  const connection = globalThis.navigator?.connection;
  const skip = typeof fetch !== 'function' || !globalThis.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');
  if (skip) return () => {};
  const controller = new AbortController();
  let timer = 0;
  async function run() {
    for (const path of assets) {
      if (controller.signal.aborted) return;
      try {
        const response = await fetch(new URL(path, document.baseURI), { signal: controller.signal, priority: 'low' });
        await response.arrayBuffer(); // Read to the end, so the whole file lands in the cache.
      } catch {
        if (controller.signal.aborted) return; // A file that fails here simply loads normally on its page.
      }
    }
  }
  // Wait until Home itself has finished loading, then a few more seconds, so it never competes with the first screen.
  // Home keeps animating, so a quiet moment may never come: the idle callback gets a 1.5-second deadline.
  const begin = () => { timer = setTimeout(() => (window.requestIdleCallback ?? (task => task()))(run, { timeout: 1500 }), idle); };
  if (document.documentElement.classList.contains('is-loading')) addEventListener('site-loader:done', begin, { once: true });
  else begin();
  return () => { clearTimeout(timer); controller.abort(); };
}
