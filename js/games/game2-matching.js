// Adapted from me666good/game2 @ ea7f29156a3b250580d0a04467ba0e5b739c358e.
// 原始版本保留在 vendor/game2/；沿用關卡、洗牌、配對與結果流程。
export const levelConfig = [
  { level: 1, pairs: 4, time: 25, gridClass: 'grid-lvl-1' },
  { level: 2, pairs: 6, time: 40, gridClass: 'grid-lvl-2' },
  { level: 3, pairs: 8, time: 55, gridClass: 'grid-lvl-3' },
  { level: 4, pairs: 10, time: 70, gridClass: 'grid-lvl-4' },
  { level: 5, pairs: 12, time: 85, gridClass: 'grid-lvl-5' },
];
const imageBase = new URL('../../vendor/game2/images/', import.meta.url);
const image = filename => new URL(filename, imageBase).href;
const giftNames = ['薑餅人', '聖誕襪', '水晶球', '冬青', '鈴鐺', '手套', '聖誕帽', '星星', '拐杖糖', '聖誕樹', '雪人', '聖誕球'];

export function initChristmasMatchingGame(root) {
  const query = selector => root.querySelector(selector);
  const currentLevelEl = query('#current-level');
  const timerTextEl = query('#timer-text');
  const matchCountEl = query('#match-count');
  const totalPairsEl = query('#total-pairs');
  const flipCountEl = query('#flip-count');
  const cardGridEl = query('#card-grid');
  const introViewEl = query('#intro-view');
  const startBtn = query('#start-btn');
  const restartBtn = query('#restart-btn');
  const modalOverlay = query('#modal-overlay');
  const modalBanner = query('#modal-banner');
  const modalBtn = query('#modal-btn');
  const modalBtnImg = query('#modal-btn-img');
  const announcement = root.parentElement?.querySelector('#matching-announcement');
  let currentLevelIndex = 0;
  let remainingTime = levelConfig[0].time;
  let timer = null;
  let flippedCards = [];
  let matchedPairs = 0;
  let flipCount = 0;
  let isLocked = false;
  let isPlaying = false;
  let disposed = false;
  let generation = 0;
  let modalConfirm = null;
  const pending = new Set();
  const getState = () => ({ level: currentLevelIndex + 1, pairs: matchedPairs, totalPairs: levelConfig[currentLevelIndex].pairs, flipCount, remainingTime, isPlaying, phase: root.dataset.state });
  const emit = name => root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: getState() }));
  const announce = text => { if (announcement) announcement.textContent = text; };

  function clearPending() {
    generation++;
    pending.forEach(id => clearTimeout(id));
    pending.clear();
  }
  function schedule(callback, delay) {
    const run = generation;
    const id = setTimeout(() => {
      pending.delete(id);
      if (!disposed && run === generation) callback();
    }, delay);
    pending.add(id);
  }
  function clearModal() {
    if (modalConfirm) modalBtn.removeEventListener('click', modalConfirm);
    modalConfirm = null;
    modalOverlay.classList.add('hidden');
  }

  function startGame() {
    if (disposed) return;
    introViewEl.classList.add('hidden');
    cardGridEl.classList.remove('hidden');
    currentLevelIndex = 0;
    startLevel();
  }
  function restartGame() {
    if (disposed) return;
    currentLevelIndex = 0;
    startLevel();
  }
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restartGame);

  function startLevel() {
    if (disposed) return;
    clearInterval(timer);
    clearPending();
    clearModal();
    const currentConfig = levelConfig[currentLevelIndex];
    currentLevelEl.textContent = String(currentConfig.level);
    totalPairsEl.textContent = String(currentConfig.pairs);
    matchCountEl.textContent = '0';
    flipCountEl.textContent = '0';
    matchedPairs = 0;
    flipCount = 0;
    flippedCards = [];
    isLocked = false;
    isPlaying = true;
    root.dataset.state = 'playing';
    startBtn.classList.add('hidden');
    restartBtn.classList.remove('hidden');
    generateCards(currentConfig.pairs, currentConfig.gridClass);
    remainingTime = currentConfig.time;
    updateTimerUI();
    timer = setInterval(countdown, 1000);
    announce(`第 ${currentConfig.level} / 5 關：${currentConfig.pairs} 組禮物，限時 ${currentConfig.time} 秒。`);
    emit('matching:level-start');
    cardGridEl.querySelector('.card')?.focus({ preventScroll: true });
  }

  function generateCards(pairsCount, gridClass) {
    cardGridEl.replaceChildren();
    cardGridEl.className = `card-grid ${gridClass}`;
    cardGridEl.setAttribute('aria-label', `第 ${currentLevelIndex + 1} 關，${pairsCount * 2} 張禮物配對卡片`);
    const cardIds = [];
    for (let i = 1; i <= pairsCount; i++) cardIds.push(i, i);
    for (let i = cardIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardIds[i], cardIds[j]] = [cardIds[j], cardIds[i]];
    }
    cardIds.forEach((id, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.classList.add('card');
      card.dataset.id = String(id);
      card.dataset.index = String(index + 1);
      card.setAttribute('aria-label', `第 ${index + 1} 張，未翻開的禮物`);
      card.setAttribute('aria-pressed', 'false');
      const back = document.createElement('span');
      back.className = 'card-face card-back';
      back.setAttribute('aria-hidden', 'true');
      const front = document.createElement('span');
      front.className = 'card-face card-front';
      front.setAttribute('aria-hidden', 'true');
      const item = document.createElement('img');
      item.className = 'card-item-img';
      item.src = image(`${id}.png`);
      item.alt = giftNames[id - 1];
      item.draggable = false;
      front.append(item);
      card.append(back, front);
      card.addEventListener('click', () => handleCardClick(card));
      cardGridEl.append(card);
    });
  }

  function handleCardClick(card) {
    if (disposed || !isPlaying || isLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.setAttribute('aria-pressed', 'true');
    card.setAttribute('aria-label', `第 ${card.dataset.index} 張，${giftNames[Number(card.dataset.id) - 1]}`);
    flippedCards.push(card);
    if (flippedCards.length === 2) {
      flipCount++;
      flipCountEl.textContent = String(flipCount);
      isLocked = true;
      checkMatch();
    }
  }

  function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.id === card2.dataset.id) {
      for (const card of [card1, card2]) {
        card.classList.add('matched');
        card.setAttribute('aria-disabled', 'true');
        card.setAttribute('aria-label', `${card.getAttribute('aria-label')}，已配對`);
        card.tabIndex = -1;
      }
      matchedPairs++;
      matchCountEl.textContent = String(matchedPairs);
      flippedCards = [];
      isLocked = false;
      announce(`配對成功！第 ${currentLevelIndex + 1} 關已找到 ${matchedPairs} / ${levelConfig[currentLevelIndex].pairs} 組。`);
      emit('matching:pair-match');
      if (matchedPairs === levelConfig[currentLevelIndex].pairs) {
        clearInterval(timer);
        isPlaying = false;
        root.dataset.state = 'level-completing';
        schedule(handleLevelWin, 500);
      }
    } else {
      schedule(() => {
        for (const card of [card1, card2]) {
          card.classList.remove('flipped');
          card.setAttribute('aria-pressed', 'false');
          card.setAttribute('aria-label', `第 ${card.dataset.index} 張，未翻開的禮物`);
        }
        flippedCards = [];
        isLocked = false;
      }, 700);
    }
  }

  function countdown() {
    if (!isPlaying || disposed) return;
    remainingTime--;
    updateTimerUI();
    if (remainingTime <= 0) {
      clearInterval(timer);
      clearPending();
      isPlaying = false;
      showTimeout();
    }
  }
  function updateTimerUI() {
    timerTextEl.textContent = remainingTime < 10 ? `0${remainingTime}` : String(remainingTime);
  }

  function handleLevelWin() {
    isPlaying = false;
    root.dataset.state = currentLevelIndex + 1 < levelConfig.length ? 'level-complete' : 'complete';
    emit('matching:level-complete');
    if (currentLevelIndex + 1 < levelConfig.length) {
      announce(`第 ${currentLevelIndex + 1} 關完成！按開始前往下一關。`);
      showModal('next.PNG', '開始.png', '下一關，Let’s go！', '開始下一關', () => {
        currentLevelIndex++;
        startLevel();
      });
    } else {
      announce('恭喜通關！五關聖誕配對挑戰全部完成。');
      emit('matching:complete');
      showModal('win.PNG', '重來.png', '恭喜通關！', '從第一關重新挑戰', () => {
        currentLevelIndex = 0;
        startLevel();
      });
    }
  }
  function showTimeout() {
    root.dataset.state = 'timeout';
    announce(`第 ${currentLevelIndex + 1} 關時間到了，按重來再次挑戰本關。`);
    emit('matching:timeout');
    showModal('timeout.PNG', '重來.png', '時間到了', '重玩當前關卡', startLevel);
  }
  function showModal(bannerSrc, btnSrc, description, buttonLabel, callback) {
    clearModal();
    modalBanner.src = image(bannerSrc);
    modalBanner.alt = description;
    modalBtnImg.src = image(btnSrc);
    modalBtnImg.alt = buttonLabel;
    modalBtn.setAttribute('aria-label', buttonLabel);
    modalOverlay.setAttribute('aria-label', description);
    modalOverlay.classList.remove('hidden');
    modalConfirm = () => {
      if (disposed) return;
      clearModal();
      callback();
    };
    modalBtn.addEventListener('click', modalConfirm);
    modalBtn.focus();
  }
  function modalKeydown(event) {
    if (event.key === 'Tab' && !modalOverlay.classList.contains('hidden')) {
      event.preventDefault();
      modalBtn.focus();
    }
  }
  modalOverlay.addEventListener('keydown', modalKeydown);

  // 從瀏覽器返回快取重新初始化時，也回到原作的說明畫面。
  root.dataset.state = 'ready';
  introViewEl.classList.remove('hidden');
  cardGridEl.replaceChildren();
  cardGridEl.className = 'card-grid hidden';
  startBtn.classList.remove('hidden');
  restartBtn.classList.add('hidden');
  currentLevelEl.textContent = '1';
  totalPairsEl.textContent = '4';
  matchCountEl.textContent = '0';
  flipCountEl.textContent = '0';
  updateTimerUI();
  clearModal();
  announce('按 Start 從第一關開始。每翻開兩張禮物計一次翻牌。');

  return {
    getState,
    destroy() {
      disposed = true;
      isPlaying = false;
      clearInterval(timer);
      clearPending();
      clearModal();
      startBtn.removeEventListener('click', startGame);
      restartBtn.removeEventListener('click', restartGame);
      modalOverlay.removeEventListener('keydown', modalKeydown);
      cardGridEl.replaceChildren();
      flippedCards = [];
    },
  };
}
