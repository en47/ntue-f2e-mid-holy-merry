// The end of the cabin's story: what is written on the register's old pages, the wishes a volunteer may make, and the
// endings. All made up. When each appears is decided by cabin-story.js, never by the chat.

// Tied with red cord until the visitor has done two jobs: Holly's wish, granted in 2003, and her on the night shift
// every year since. Her initial is the one on the snow globe's base (H. · 2003).
// Once two jobs are done the cord can be got at, but it is held by a little four-dial lock; a blank slip tucked under it
// smells of lemon, and held to the fire it shows Holly's hand: the year the snow globe remembers is the code.
export const CORD = {
  tied: '前面的舊頁用紅繩綁著。', soon: '（再多做一件替身工作，紅繩好像就解得開了。）', untie: '解開紅繩，翻到舊的一頁', again: '再翻開舊的一頁', back: '翻回最新的一頁',
  locked: '紅繩鬆了，卻被一個小小的四位數密碼鎖扣著。', dial: (place, digit) => `第 ${place} 個轉輪：${digit}（按一下加一）`, opened: '喀！小鎖彈開了，紅繩滑了下來。',
  slip: '繩上夾著一張空白的紙條，聞起來有一點檸檬的味道。', take: '拿起紙條', took: '你把空白紙條收進口袋了。檸檬的味道……好像在哪裡聽過，這種紙要用火烤一烤？',
  pocket: '（空白紙條還在你口袋裡。）',
  warm: '火不夠旺，紙條只是溫溫的。再添一點柴，用風箱把火吹旺。', toFire: '把空白紙條靠近火烤一烤',
  lemon: ['我的願望實現的那一年，', '雪花球一直記得。'], sign: '—— H.', read: '紙條上浮出淡褐色的字：「我的願望實現的那一年，雪花球一直記得。」—— H.',
};
export const OLD_PAGE = {
  title: '登記簿　舊的一頁',
  entry: ['2003', 'H.', '荷莉', '願望：讓住院的媽媽，回家過聖誕節。'],
  stamp: 'WISH FULFILLED',
  since: ['2004　夜班　H. ✓', '2011　夜班　H. ✓', '2018　夜班　H. ✓', '2025　夜班　H. ✓'],
  pencil: '我的願望已經實現了。不過，我想再多幫一個人。—— H.',
};
export const TWIST = '荷莉的願望，二十多年前就實現了，她卻每年都還在交接表上……原來，有人的願望早就實現了，卻還是留了下來。';
// The rules booklet's pencil line, readable once the old page has been seen.
export const PENCIL = '（最下面的鉛筆字，現在看得清楚了：「我的願望已經實現了。不過，我想再多幫一個人。—— H.」）';

// Three stamps buy a wish; another substitute grants it and leaves a note in their own hand.
export const WISH = { title: '用三個章，許一個願望', invite: '守則上寫著：集到三個章，就能許一個願望，帶著它回家。你已經有三個章了，要許一個願望嗎？', sign: '蓋章許願', made: wish => `你許了願：${wish}。` };
export const WISHES = [
  { id: 'sleigh', name: '坐一次聖誕老人的雪橇', by: 'K.', hand: 'k', note: '你的願望，交給我了。抓緊扶手，我們繞村子一圈！' },
  { id: 'snow', name: '看一場好大的雪', by: 'E.', hand: 'e', note: '你的願望，交給我了。今天下的雪，都是給你的。' },
  { id: 'gift', name: '一份只屬於我的禮物', by: 'O.', hand: 'o', note: '你的願望，交給我了。打開看看吧！' },
  { id: 'blessing', name: '把祝福送給重要的人', by: 'N.', hand: 'n', note: '你的願望，交給我了。熱氣球會把它送到。', blessings: ['祝你今年冬天，每天都暖暖的。', '謝謝你，一直陪在我身邊。', '希望你的願望，也都會實現。'] },
];

// Once all four jobs are done: the early shift on Christmas morning, still unsigned.
export const STAY = { invite: '12/25 早班還沒有人簽名。四件工作你都做過了，要簽上你的縮寫，留下來幫忙嗎？', sign: '簽上早班', tag: '最右邊的掛勾上，掛著你的名牌。' };

// The endings. A: you knew, and went home; B: a wish granted; C: staying on; D: knowing why Holly stayed, and doing as
// she did (with B or C; the most when you wished and stayed both). Each is told once, in a little paper theatre of its
// own (cabin-ending.js), under its title in paper letters (`en`, from scripts/build-title-glyphs.mjs).
export const ENDINGS = {
  A: { title: '結局 A　普通訪客', en: 'Going Home', lines: ['聖誕老人送你到門口，塞給你一張明信片：', '「謝謝你來小屋作客。村子的小秘密，就放在你心裡吧。」', '「哪天想回來幫忙，登記簿最下面那一格，永遠留給你。」'], sign: '—— S.' },
  B: { title: '結局 B　願望旅人', en: 'Wish Granted', lines: ['你用三個章，換了一個願望。', '替身們把它送到了。你帶著實現的願望，和一段北極的回憶回家。'] },
  C: { title: '結局 C　自願留下', en: 'Staying On', lines: ['你在 12/25 早班簽上了自己的縮寫。', '名牌板最右邊的空掛勾，現在掛著你的名牌。明天早上，換你出發。'] },
  D: { title: '結局 D　真正的聖誕奇蹟', en: 'Christmas Miracle', lines: ['登記簿裡夾著一封信，信封上寫著你的縮寫。'] },
};
// The theatre's buttons, and the line D ends on.
export const THEATRE = { skip: '跳過', again: '再看一次', close: '回到村子', next: '繼續', last: '原來，聖誕老人從來不只是一個人。' };
export const HOLLY = {
  greeting: mark => `親愛的 ${mark}.：`,
  body: '你也看到那一頁了吧。我的願望，在 2003 年就實現了。那年平安夜，替身們把媽媽送回了家。\n從那天起我就想：換我來，把這份溫暖，再傳給下一個人。',
  both: '你和我一樣：願望實現了，還是留了下來。歡迎你，聖誕老人。',
  one: '願望實現以後還願意幫忙的人，就是真正的聖誕老人。',
  sign: '—— H.',
};
export const SEEN = '看過的結局';
// After a stamp, where the story goes next (by how many stamps there are), and what Santa says once the old page is known.
export const NEXT = { 2: '登記簿上綁著舊頁的紅繩，好像鬆開了一點。', 3: '三個章了！回登記簿看看，可以許一個願望。', 4: '四件工作都做完了。小房間的班表上，12/25 早班還空著。' };
export const SANTA_ON_HOLLY = '聖誕老人看著你，笑了笑：「你看到荷莉的那一頁了吧。她呀，是我們這裡最可靠的人。」';
export const GLOBE = '雪慢慢落定了。底座刻著「H. · 2003」——荷莉的願望實現的那一年。';
