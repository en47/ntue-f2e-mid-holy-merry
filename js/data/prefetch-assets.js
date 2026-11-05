// 首頁靜置後預先下載的大檔案：只有 Game、Wish 會用到，首頁沒載入過，而且網址沒有版本號。
// 清單來自 2026-11-05 在瀏覽器實測各頁的下載紀錄；依報告順序先 Game 後 Wish。小的 JS／CSS 換頁時很快，不列入。
export const PREFETCH_ASSETS = [
  'assets/models/santa-new.glb',
  'vendor/game1-frameless/assets/santa-reindeer.png',
  'vendor/game1-frameless/assets/winter-village.png',
  'vendor/game1-frameless/assets/obstacles.png',
  'vendor/game1-frameless/assets/handwriting.png',
  'vendor/game2/images/倒數.png',
  'vendor/game2/images/intro.PNG',
  'vendor/game2/images/重來.png',
  'vendor/game2/images/開始.png',
  'assets/models/wish-tree-web.glb',
  'assets/models/wish-elf-web.glb',
  'assets/animations/elf-actions.json',
  'assets/fonts/wish-handwritten.woff',
];
