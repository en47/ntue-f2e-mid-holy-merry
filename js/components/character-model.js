// Google model-viewer 由本機 vendor 載入；GLB 與貼圖都不會上傳。
const DEFAULT_CAMERA = '0deg 80deg 115%';
const defaultLoadViewer = async () => {
  await import('../../vendor/model-viewer/model-viewer.min.js');
  await customElements.whenDefined('model-viewer');
};

export function mountCharacterModel(root, { loadViewer = defaultLoadViewer } = {}) {
  const viewer = root.querySelector('#santa-model');
  const stage = root.querySelector('[data-model-slot="santa"]');
  const status = root.querySelector('#santa-model-status');
  const progress = root.querySelector('#santa-model-progress');
  const progressFill = progress.querySelector('span');
  const playButton = root.querySelector('#santa-animation');
  const resetButton = root.querySelector('#santa-reset');
  const retryButton = root.querySelector('#santa-model-retry');
  const download = root.querySelector('#santa-model-download');
  const talkButton = root.querySelector('#santa-character');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const source = viewer.getAttribute('src');
  let loaded = false;
  let disposed = false;
  let retryCount = 0;
  let pointer = null;
  let observer = null;
  const cleanups = [];
  function listen(target, type, callback) {
    target.addEventListener(type, callback);
    cleanups.push(() => target.removeEventListener(type, callback));
  }
  function pauseAnimation() {
    viewer.pause?.();
    playButton.textContent = '播放待機動作';
    playButton.setAttribute('aria-pressed', 'false');
  }
  function applyMotionPreference() {
    viewer.interpolationDecay = motion.matches ? 0 : 50;
    if (motion.matches) pauseAnimation();
  }
  function fail() {
    if (disposed) return;
    loaded = false;
    stage.dataset.state = 'error';
    pauseAnimation();
    resetButton.disabled = true;
    playButton.disabled = true;
    retryButton.hidden = false;
    download.hidden = false;
    progress.hidden = true;
    status.textContent = '模型無法載入。請確認使用 Live Server、瀏覽器支援 WebGL，或按重新載入。';
    const poster = root.querySelector('.model-poster');
    poster.querySelector('strong').textContent = '聖誕老人暫時無法顯示';
  }
  async function initialize(checkExisting = true) {
    try {
      await loadViewer();
      if (disposed) return;
      applyMotionPreference();
      if (checkExisting && viewer.loaded) handleLoad();
    } catch { fail(); }
  }
  function handleLoad() {
    if (disposed) return;
    loaded = true;
    stage.dataset.state = 'ready';
    retryButton.hidden = true;
    download.hidden = true;
    resetButton.disabled = false;
    playButton.disabled = !viewer.availableAnimations?.includes('idle');
    applyMotionPreference();
    status.textContent = motion.matches ? '模型已載入，依減少動態設定保持靜止；可自行旋轉或播放待機動作。' : '模型已載入。拖曳可旋轉，點一下和聖誕老人聊聊。';
  }
  listen(viewer, 'load', handleLoad);
  listen(viewer, 'error', fail);
  listen(viewer, 'progress', event => {
    if (disposed) return;
    const value = Math.round(Math.max(0, Math.min(1, event.detail?.totalProgress ?? 0)) * 100);
    progress.setAttribute('aria-valuenow', String(value));
    progressFill.style.width = `${value}%`;
  });
  listen(playButton, 'click', () => {
    if (!loaded || playButton.disabled) return;
    if (!viewer.paused) {
      pauseAnimation();
      status.textContent = '待機動作已暫停。';
    } else {
      viewer.animationName = 'idle';
      viewer.play();
      playButton.textContent = '暫停待機動作';
      playButton.setAttribute('aria-pressed', 'true');
      status.textContent = '正在播放模型內附的 idle 待機動作。';
    }
  });
  listen(resetButton, 'click', () => {
    if (!loaded) return;
    viewer.cameraOrbit = DEFAULT_CAMERA;
    viewer.cameraTarget = 'auto auto auto';
    viewer.jumpCameraToGoal();
    status.textContent = '已回到正面視角。';
  });
  listen(retryButton, 'click', () => {
    if (disposed) return;
    stage.dataset.state = 'loading';
    retryButton.hidden = true;
    download.hidden = true;
    progress.hidden = false;
    progressFill.style.width = '0%';
    progress.setAttribute('aria-valuenow', '0');
    status.textContent = '正在重新載入聖誕老人模型……';
    root.querySelector('.model-poster strong').textContent = '聖誕老人準備登場';
    const nextSource = new URL(source, document.baseURI);
    nextSource.searchParams.set('retry', String(++retryCount));
    viewer.src = nextSource.href;
    initialize(false);
  });

  // 區分輕點與拖曳：旋轉模型不會連續觸發角色對話。
  listen(viewer, 'pointerdown', event => {
    if (event.isPrimary === false || event.button !== 0) { pointer = null; return; }
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), moved: false };
  });
  listen(viewer, 'pointermove', event => {
    if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8) pointer.moved = true;
  });
  listen(viewer, 'pointerup', event => {
    if (loaded && pointer && pointer.id === event.pointerId && !pointer.moved && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= 8 && performance.now() - pointer.time < 600) talkButton.click();
    pointer = null;
  });
  listen(viewer, 'pointercancel', () => { pointer = null; });
  listen(motion, 'change', applyMotionPreference);
  listen(document, 'visibilitychange', () => { if (document.hidden) pauseAnimation(); });
  listen(window, 'pagehide', pauseAnimation);
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => !entry.isIntersecting)) pauseAnimation();
    });
    observer.observe(viewer);
  }
  initialize();
  return {
    pause: pauseAnimation,
    destroy() {
      disposed = true;
      pauseAnimation();
      observer?.disconnect();
      cleanups.forEach(cleanup => cleanup());
    },
  };
}
