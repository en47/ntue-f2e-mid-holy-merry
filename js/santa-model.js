// 首頁角色入口；延遲載入 GLB，兩個角色共用一個 Three.js Renderer。
export function mountCharacterScene(root, { loadScene = () => import('./components/characters-scene.js') } = {}) {
  if (!root) return { destroy() {} };
  let controller = null, pending = false, version = 0, observer = null, disposed = false;
  const retries = () => root.querySelectorAll('[data-model-action="retry"]');
  function showLoading() {
    root.querySelectorAll('[data-model-slot]').forEach(slot => {
      slot.dataset.state = 'loading'; slot.setAttribute('aria-busy', 'true');
    });
    root.querySelectorAll('.model-fallback').forEach(fallback => { fallback.hidden = false; });
    root.querySelectorAll('.model-status').forEach(status => { status.textContent = '正在準備聖誕夥伴…'; });
    retries().forEach(button => { button.hidden = true; button.disabled = true; });
  }
  function showError() {
    root.querySelectorAll('[data-model-slot]').forEach(slot => {
      slot.dataset.state = 'error'; slot.setAttribute('aria-busy', 'false');
    });
    root.querySelectorAll('.model-fallback').forEach(fallback => { fallback.hidden = true; });
    root.querySelectorAll('.model-status').forEach(status => {
      status.textContent = '3D 載入失敗，請確認瀏覽器支援 WebGL 2 並使用 Live Server，再按重試載入。';
    });
    retries().forEach(button => { button.hidden = false; });
  }
  async function start() {
    if (disposed || controller || pending) return;
    pending = true;
    const run = ++version;
    showLoading();
    try {
      const { mountCharacters } = await loadScene();
      if (!disposed && run === version) controller = mountCharacters(root);
    } catch {
      if (!disposed && run === version) showError();
    } finally {
      if (run === version) { pending = false; retries().forEach(button => { button.disabled = false; }); }
    }
  }
  function observe() {
    if (disposed) return;
    if (typeof IntersectionObserver === 'undefined') { start(); return; }
    const current = new IntersectionObserver(entries => {
      if (observer !== current) return;
      if (entries.some(entry => entry.isIntersecting)) { current.disconnect(); observer = null; start(); }
    }, { rootMargin: '500px' });
    observer = current; current.observe(root);
  }
  function leave() {
    version++; pending = false; observer?.disconnect(); observer = null;
    controller?.destroy(); controller = null;
  }
  const retry = event => {
    // 場景成功建立後，每個模型由自己的控制器處理重試。
    if (!controller && event.target?.closest?.('[data-model-action="retry"]')) start();
  };
  const restore = event => { if (event.persisted) observe(); };
  root.addEventListener('click', retry);
  window.addEventListener('pagehide', leave);
  window.addEventListener('pageshow', restore);
  observe();
  return {
    destroy() {
      if (disposed) return;
      disposed = true; leave();
      root.removeEventListener('click', retry);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', restore);
    },
  };
}
const root = document.querySelector('#characters');
if (root) mountCharacterScene(root);
