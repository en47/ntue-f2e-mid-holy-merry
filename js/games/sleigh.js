// 遊戲 A 獨立狀態；之後可在此替換原始雪橇遊戲，不影響配對遊戲。
export function initSleighGame(root) {
  const query = selector => root.querySelector(selector);
  const canvas = query('#sleigh-canvas');
  const ctx = canvas.getContext('2d');
  const stage = query('#sleigh-stage');
  const overlay = query('#sleigh-overlay');
  const start = query('#sleigh-start');
  const pause = query('#sleigh-pause');
  const restart = query('#sleigh-restart');
  const up = query('#sleigh-up');
  const down = query('#sleigh-down');
  const status = query('#sleigh-status');
  if (!ctx) { status.textContent = '此瀏覽器無法啟動 Canvas 遊戲。'; start.disabled = true; return; }
  const W = canvas.width, H = canvas.height;
  const player = { x: 95, y: H / 2 - 22, w: 110, h: 44 };
  let state = 'ready', obstacles = [], elapsed = 0, spawn = .8, frame = null, lastTime = 0;
  const heldKeys = new Set();
  const heldPointers = new Map();
  function releaseControls() { heldKeys.clear(); heldPointers.clear(); }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#c9e0e8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#afccd5'; ctx.lineWidth = 1;
    for (let y = 60; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = '#fffbed'; ctx.fillRect(0, H - 18, W, 18);
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#657f89'; ctx.textAlign = 'left'; ctx.fillText('PROTOTYPE / 圖像素材待補', 20, 28);
    ctx.fillStyle = '#ad3c3b'; ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#fffbed'; ctx.textAlign = 'center'; ctx.font = '17px sans-serif'; ctx.fillText('雪橇佔位', player.x + player.w / 2, player.y + 29);
    for (const obstacle of obstacles) {
      ctx.fillStyle = '#42675b'; ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = '#fffbed'; ctx.font = '14px sans-serif'; ctx.fillText('障礙', obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2 + 5);
    }
  }
  function setState(next) { state = next; root.dataset.state = next; }
  function showOverlay(title, help, label) {
    overlay.hidden = false;
    query('#sleigh-message').textContent = title;
    query('#sleigh-help').textContent = help;
    start.textContent = label;
  }
  function stopLoop() { cancelAnimationFrame(frame); frame = null; releaseControls(); }
  function begin(fresh) {
    stopLoop();
    if (fresh) { obstacles = []; elapsed = 0; spawn = .8; player.y = H / 2 - 22; query('#sleigh-score').textContent = '0'; }
    setState('playing'); overlay.hidden = true; lastTime = performance.now();
    pause.disabled = false; restart.disabled = false; up.disabled = false; down.disabled = false;
    pause.textContent = '暫停'; status.textContent = '飛行中';
    stage.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  }
  function pauseGame() {
    if (state !== 'playing') return;
    setState('paused'); stopLoop(); pause.textContent = '繼續'; status.textContent = '已暫停';
    up.disabled = true; down.disabled = true;
    showOverlay('Take a little break.', '準備好後，再繼續這趟旅程。', '繼續飛行 →');
  }
  function finish() {
    setState('over'); stopLoop(); pause.disabled = true; up.disabled = true; down.disabled = true;
    const score = Math.floor(elapsed * 10);
    status.textContent = `碰到障礙物，獲得 ${score} 分。`;
    showOverlay('A little bump!', `這次獲得 ${score} 分。調整高度，再試一次吧！`, '再玩一次 ↻');
    start.focus({ preventScroll: true });
  }
  function tick(time) {
    if (state !== 'playing') return;
    const dt = Math.min((time - lastTime) / 1000, .035); lastTime = time;
    elapsed += dt;
    const pointerDirections = [...heldPointers.values()];
    const upward = heldKeys.has('ArrowUp') || pointerDirections.includes(-1);
    const downward = heldKeys.has('ArrowDown') || pointerDirections.includes(1);
    player.y += (Number(downward) - Number(upward)) * 260 * dt;
    player.y = Math.max(37, Math.min(H - 20 - player.h, player.y));
    spawn -= dt;
    if (spawn <= 0) {
      const height = 45 + Math.random() * 43;
      obstacles.push({ x: W + 10, y: 42 + Math.random() * (H - 70 - height), w: 48, h: height });
      spawn = Math.max(.9, 1.6 - elapsed / 150);
    }
    const speed = Math.min(420, 240 + elapsed * 2);
    for (const obstacle of obstacles) obstacle.x -= speed * dt;
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.w > 0);
    const hit = obstacles.some(obstacle => player.x < obstacle.x + obstacle.w && player.x + player.w > obstacle.x && player.y < obstacle.y + obstacle.h && player.y + player.h > obstacle.y);
    query('#sleigh-score').textContent = String(Math.floor(elapsed * 10));
    draw();
    if (hit) { finish(); return; }
    frame = requestAnimationFrame(tick);
  }
  start.addEventListener('click', () => begin(state !== 'paused'));
  restart.addEventListener('click', () => begin(true));
  pause.addEventListener('click', () => state === 'playing' ? pauseGame() : state === 'paused' && begin(false));
  root.addEventListener('keydown', event => {
    if (state !== 'playing') return;
    if (event.key === 'Escape') { event.preventDefault(); pauseGame(); start.focus({ preventScroll: true }); return; }
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); heldKeys.add(event.key); }
  });
  document.addEventListener('keyup', event => heldKeys.delete(event.key));
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) pauseGame();
  });
  for (const [button, direction] of [[up, -1], [down, 1]]) {
    button.addEventListener('pointerdown', event => {
      if (state !== 'playing') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); heldPointers.set(event.pointerId, direction);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => heldPointers.delete(event.pointerId));
  }
  window.addEventListener('blur', pauseGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  window.addEventListener('pagehide', pauseGame);
  setState('ready'); draw();
}
