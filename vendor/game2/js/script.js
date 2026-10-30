// 關卡配置（15s, 30s, 45s, 60s, 75s；4 ~ 12 組物品）
const levelConfig = [
  { level: 1, pairs: 4,  time: 25, gridClass: 'grid-lvl-1' },
  { level: 2, pairs: 6,  time: 40, gridClass: 'grid-lvl-2' },
  { level: 3, pairs: 8,  time: 55, gridClass: 'grid-lvl-3' },
  { level: 4, pairs: 10, time: 70, gridClass: 'grid-lvl-4' },
  { level: 5, pairs: 12, time: 85, gridClass: 'grid-lvl-5' }
];

let currentLevelIndex = 0;
let remainingTime = 0;
let timer = null;
let flippedCards = [];
let matchedPairs = 0;
let flipCount = 0;
let isLocked = false;
let isPlaying = false;

// DOM 元素
const currentLevelEl = document.getElementById('current-level');
const timerTextEl = document.getElementById('timer-text');
const matchCountEl = document.getElementById('match-count');
const totalPairsEl = document.getElementById('total-pairs');
const flipCountEl = document.getElementById('flip-count');
const cardGridEl = document.getElementById('card-grid');
const introViewEl = document.getElementById('intro-view');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const modalOverlay = document.getElementById('modal-overlay');
const modalBanner = document.getElementById('modal-banner');
const modalBtn = document.getElementById('modal-btn');
const modalBtnImg = document.getElementById('modal-btn-img');

// 開始按鍵
startBtn.addEventListener('click', () => {
  introViewEl.classList.add('hidden');
  cardGridEl.classList.remove('hidden');
  currentLevelIndex = 0;
  startLevel();
});

// 重來按鍵
restartBtn.addEventListener('click', () => {
  clearInterval(timer);
  currentLevelIndex = 0;
  startLevel();
});

// 開始特定關卡
function startLevel() {
  const currentConfig = levelConfig[currentLevelIndex];
  
  // 更新狀態資訊
  currentLevelEl.textContent = currentConfig.level;
  totalPairsEl.textContent = currentConfig.pairs;
  matchCountEl.textContent = '0';
  flipCountEl.textContent = '0';
  
  matchedPairs = 0;
  flipCount = 0;
  flippedCards = [];
  isLocked = false;
  isPlaying = true;

  startBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');

  // 生成並洗牌
  generateCards(currentConfig.pairs, currentConfig.gridClass);

  // 啟動倒數
  remainingTime = currentConfig.time;
  updateTimerUI();
  clearInterval(timer);
  timer = setInterval(countdown, 1000);
}

// 生成卡片
function generateCards(pairsCount, gridClass) {
  cardGridEl.innerHTML = '';
  cardGridEl.className = `card-grid ${gridClass}`;

  let cardIds = [];
  for (let i = 1; i <= pairsCount; i++) {
    cardIds.push(i, i);
  }
  
  // 洗牌
  for (let i = cardIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardIds[i], cardIds[j]] = [cardIds[j], cardIds[i]];
  }

  // 放入卡牌 (正面：盒子.png + ${id}.png；背面：蓋子.png)
  cardIds.forEach(id => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.id = id;

    card.innerHTML = `
      <div class="card-face card-back"></div>
      <div class="card-face card-front">
        <img src="images/${id}.png" alt="禮物" class="card-item-img">
      </div>
    `;

    card.addEventListener('click', () => handleCardClick(card));
    cardGridEl.appendChild(card);
  });
}

// 翻牌邏輯
function handleCardClick(card) {
  if (!isPlaying || isLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
    return;
  }

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    flipCount++;
    flipCountEl.textContent = flipCount;
    isLocked = true;
    checkMatch();
  }
}

// 配對判定
function checkMatch() {
  const [card1, card2] = flippedCards;
  const isMatch = card1.dataset.id === card2.dataset.id;

  if (isMatch) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    matchedPairs++;
    matchCountEl.textContent = matchedPairs;
    flippedCards = [];
    isLocked = false;

    // 是否通過目前關卡
    if (matchedPairs === levelConfig[currentLevelIndex].pairs) {
      clearInterval(timer);
      setTimeout(handleLevelWin, 500);
    }
  } else {
    // 失敗 0.7 秒後蓋回
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      flippedCards = [];
      isLocked = false;
    }, 700);
  }
}

// 倒數計時
function countdown() {
  remainingTime--;
  updateTimerUI();

  if (remainingTime <= 0) {
    clearInterval(timer);
    isPlaying = false;
    showTimeout();
  }
}

function updateTimerUI() {
  timerTextEl.textContent = remainingTime < 10 ? `0${remainingTime}` : remainingTime;
}

// 關卡成功處理
function handleLevelWin() {
  isPlaying = false;
  
  if (currentLevelIndex + 1 < levelConfig.length) {
    // 還有下一關：跳出「下一關.png」，按鈕為「開始.png」
    showModal('images/next.PNG', 'images/開始.png', () => {
      currentLevelIndex++;
      startLevel();
    });
  } else {
    // 全部 5 關破關：跳出「恭喜通關.png」，按鈕為「重來.png」
    showModal('images/win.PNG', 'images/重來.png', () => {
      currentLevelIndex = 0;
      startLevel();
    });
  }
}

// 時間到了處理
function showTimeout() {
  // 時間到了：跳出「時間到了.png」，按鈕為「重來.png」
  showModal('images/timeout.PNG', 'images/重來.png', () => {
    startLevel(); // 原關卡重玩
  });
}

// 彈窗模組
function showModal(bannerSrc, btnSrc, callback) {
  modalBanner.src = bannerSrc;
  modalBtnImg.src = btnSrc;
  modalOverlay.classList.remove('hidden');

  const handleConfirm = () => {
    modalOverlay.classList.add('hidden');
    modalBtn.removeEventListener('click', handleConfirm);
    callback();
  };
  modalBtn.addEventListener('click', handleConfirm);
}