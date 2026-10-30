const GIFTS = [
  { id: 'star', symbol: '✧', label: '星星' },
  { id: 'bell', symbol: '♧', label: '鈴鐺' },
  { id: 'heart', symbol: '♡', label: '愛心' },
  { id: 'snow', symbol: '❄', label: '雪花' },
  { id: 'cookie', symbol: '○', label: '餅乾' },
  { id: 'ribbon', symbol: '⋈', label: '緞帶' },
];
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function initMatchingGame(root) {
  const query = selector => root.querySelector(selector);
  const board = query('#matching-board');
  const start = query('#match-start');
  const restart = query('#match-restart');
  const status = query('#match-status');
  let active = false, locked = false, first = null, pairs = 0, flips = 0;
  let startedAt = 0, timer = null, concealTimer = null;
  function updateTime() {
    const seconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    query('#match-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function reset(play) {
    clearInterval(timer);
    clearTimeout(concealTimer);
    active = play; locked = false; first = null; pairs = 0; flips = 0; startedAt = 0;
    query('#match-count').textContent = '0';
    query('#flip-count').textContent = '0';
    updateTime();
    board.replaceChildren();
    root.dataset.state = play ? 'playing' : 'ready';
    for (const [index, gift] of shuffle([...GIFTS, ...GIFTS]).entries()) {
      const card = document.createElement('button');
      card.className = 'match-card';
      card.dataset.gift = gift.id;
      card.dataset.index = String(index + 1);
      card.disabled = !play;
      card.setAttribute('aria-label', `第 ${index + 1} 張，未翻開的禮物`);
      card.setAttribute('aria-pressed', 'false');
      const back = document.createElement('span'); back.className = 'card-back'; back.textContent = 'm!'; back.setAttribute('aria-hidden', 'true');
      const face = document.createElement('span'); face.className = 'card-face'; face.setAttribute('aria-hidden', 'true');
      const symbol = document.createElement('span'); symbol.className = 'gift-symbol'; symbol.textContent = gift.symbol;
      const label = document.createElement('span'); label.className = 'gift-name'; label.textContent = gift.label;
      face.append(symbol, label); card.append(back, face);
      card.addEventListener('click', () => flip(card, gift));
      board.append(card);
    }
    start.disabled = play;
    restart.disabled = !play;
    status.textContent = play ? '翻開第一份禮物吧！' : '按 Start 開始，翻開第一張卡片後開始計時。';
  }
  function flip(card, gift) {
    if (!active || locked || card === first || card.classList.contains('is-matched')) return;
    if (!startedAt) { startedAt = Date.now(); timer = setInterval(updateTime, 500); }
    card.classList.add('is-flipped');
    card.setAttribute('aria-pressed', 'true');
    card.setAttribute('aria-label', `第 ${card.dataset.index} 張，${gift.label}`);
    flips++;
    query('#flip-count').textContent = String(flips);
    if (!first) { first = card; return; }
    const previous = first;
    if (previous.dataset.gift === card.dataset.gift) {
      for (const matched of [previous, card]) {
        matched.classList.add('is-matched');
        matched.disabled = true;
        matched.setAttribute('aria-label', `${matched.getAttribute('aria-label')}，已配對`);
      }
      first = null; pairs++;
      query('#match-count').textContent = String(pairs);
      status.textContent = `配對成功！已找到 ${pairs} / 6 組。`;
      if (pairs === 6) {
        active = false; clearInterval(timer); updateTime(); root.dataset.state = 'complete';
        status.textContent = `Merry well done！全部配對成功，翻牌 ${flips} 次，用時 ${query('#match-time').textContent}。`;
        restart.focus({ preventScroll: true });
      } else {
        const next = board.querySelector('.match-card:not(.is-matched):not(.is-flipped)');
        next?.focus({ preventScroll: true });
      }
      return;
    }
    locked = true;
    status.textContent = '這兩份禮物不一樣，再記一下它們的位置。';
    concealTimer = setTimeout(() => {
      for (const hidden of [previous, card]) {
        hidden.classList.remove('is-flipped');
        hidden.setAttribute('aria-pressed', 'false');
        hidden.setAttribute('aria-label', `第 ${hidden.dataset.index} 張，未翻開的禮物`);
      }
      first = null; locked = false;
    }, 900);
  }
  start.addEventListener('click', () => { reset(true); board.querySelector('button').focus({ preventScroll: true }); });
  restart.addEventListener('click', () => { reset(true); board.querySelector('button').focus({ preventScroll: true }); });
  reset(false);
  window.addEventListener('pagehide', () => { clearInterval(timer); clearTimeout(concealTimer); active = false; });
  window.addEventListener('pageshow', event => { if (event.persisted) reset(false); });
}
