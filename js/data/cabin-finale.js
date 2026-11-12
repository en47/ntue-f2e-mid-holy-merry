// The end of the cabin's story: what is written in the old record book, the wishes a volunteer may make, and the endings.
// All made up. When each appears is decided by cabin-story.js, never by the chat.

// The old record book on the little room's desk, tied with red cord and held by a four-dial lock: it opens to the year
// Holly's wish came true (the snow globe's base, H. · 2003), whenever that is found; no jobs are needed. A volunteer finds a
// blank slip tucked in their own row of the register (to the pocket): it smells of lemon, and laid on the hearthstone the
// fire has warmed (not in the fire) it shows Holly's hand.
export const CORD = {
  title: '舊紀錄簿', locked: '一本舊紀錄簿，用紅繩綁著，被一個小小的四位數密碼鎖扣著。', again: '翻開舊紀錄簿', close: '闔上舊紀錄簿',
  dial: (place, digit) => `第 ${place} 個轉輪：${digit}（按一下加一）`, opened: '喀！小鎖彈開了，紅繩滑了下來。',
  slip: '你那一列夾著一張空白的紙條，聞起來有一點檸檬的味道。', take: '拿起紙條', took: '你把空白紙條收進口袋了。檸檬的味道……好像在哪裡聽過，這種紙要烘熱了才看得見字？',
  pocket: '（空白紙條還在你口袋裡。）',
  cold: '壁爐前的石板還是冷冰冰的。', fire: '放進火裡，紙條就燒掉了。壁爐前那塊被火烘熱的石板，應該剛剛好。', stone: '壁爐前被火烘熱的石板',
  lemon: ['我的願望實現的那一年，', '雪花球一直記得。'], sign: '—— H.', read: '紙條上浮出淡褐色的字：「我的願望實現的那一年，雪花球一直記得。」—— H.',
  known: '雪花球記得的那一年……你已經知道了。',
};
// Inside: Holly's record, her wish in 2003 stamped fulfilled, and every year since on the night shift under her initial
// (trainee for her first five years). It never says what the night shift is: read before the shift log is put right it
// is only a child's wish and a row of nights (`surface`); read after, it is the second twist.
export const RECORD = {
  title: 'CHRISTMAS RECORD · 024',
  entry: ['2003/12/24', 'H.', '荷莉', '願望：讓住院的媽媽，回家過聖誕節。'],
  stamp: 'WISH FULFILLED',
  since: ['2003/12/25　幫忙包禮物（見習）', '2004　夜班（見習）', '2008　第一次自己值夜班 ✓', '2011　夜班 ✓', '2018　夜班 ✓', '2025　夜班 ✓'],
  pencil: '我的願望已經實現了。不過，我想再多幫一個人。—— H.',
  card: ['Someone once made Christmas special for me. I wanted to do the same.', '曾經有人讓我的聖誕節變得特別，所以我也想這樣做。'],
  surface: '2003 年，一個孩子的願望實現了。後面一整排夜班，都簽著 H.……夜班是什麼？',
};
export const TWIST = '荷莉的願望，二十多年前就實現了，她卻每年都還在交接表上……原來，有人的願望早就實現了，卻還是留了下來。';
// The rules booklet's pencil line, readable once the old page has been seen.
export const PENCIL = '（最下面的鉛筆字，現在看得清楚了：「我的願望已經實現了。不過，我想再多幫一個人。—— H.」）';

// Three stamps buy a wish; another substitute grants it and leaves a note in their own hand.
export const WISH = { title: '用三個章，許一個願望', invite: '守則上寫著：集到三個章，就能許一個願望，帶著它回家。你已經有三個章了，要許一個願望嗎？', sign: '蓋章許願', made: wish => `你許了願：${wish}。`, sure: wish => `許了願，就會帶著它回家。確定要用三個章，許「${wish}」嗎？`, yes: '確定許願', no: '再想想' };
export const WISHES = [
  { id: 'sleigh', name: '坐一次聖誕老人的雪橇', by: 'K.', hand: 'k', note: '你的願望，交給我了。抓緊扶手，我們繞村子一圈！' },
  { id: 'snow', name: '看一場好大的雪', by: 'E.', hand: 'e', note: '你的願望，交給我了。今天下的雪，都是給你的。' },
  { id: 'gift', name: '一份只屬於我的禮物', by: 'O.', hand: 'o', note: '你的願望，交給我了。打開看看吧！' },
  { id: 'blessing', name: '把祝福送給重要的人', by: 'N.', hand: 'n', note: '你的願望，交給我了。熱氣球會把它送到。', blessings: ['祝你今年冬天，每天都暖暖的。', '謝謝你，一直陪在我身邊。', '希望你的願望，也都會實現。'] },
];

// Once all four jobs are done: the early shift on Christmas morning, still unsigned.
export const STAY = { invite: '12/25 早班還沒有人簽名。四件工作你都做過了，要簽上你的縮寫，留下來幫忙嗎？', sign: '簽上早班', tag: '最右邊的掛勾上，掛著你的名牌；帽架的第六個掛鉤，掛著你的帽子。', sure: '簽了 12/25 早班，明天早上就換你出發。確定要留下來嗎？', yes: '確定簽名', no: '再想想' };
// The world signpost in the yard: the only way home (ending A), and only for a visitor who knows the secret and is not
// signed up; a volunteer finds a card hung on it; anyone else reads only what the signpost says.
export const SIGNPOST = { title: '世界路標', home: '踏上回家的路', sure: '要離開聖誕村、踏上回家的路了嗎？村子的小秘密，會一直放在你心裡。', yes: '確定回家', no: '再逛逛', volunteer: '路標上掛著一張小卡：「替身要先在登記簿劃掉縮寫，才能踏上回家的路。」', close: '好 ✓' };
// All four jobs done, back in the middle of the room: Santa asks, once, what comes next. Nothing ends until it is chosen
// at the register or the shift log.
export const ASK = {
  question: '聖誕老人放下茶杯：「你的工作已經完成了。想再看看這間小屋，還是準備繼續旅程呢？」',
  options: [['explore', '繼續探索', '「慢慢逛，不急。小屋的門一直開著。」'], ['wish', '帶著願望離開', '「那就到小房間的登記簿，用你的章許一個願望吧。」'], ['stay', '自願留下', '「交接表上 12/25 的早班還空著。簽上你的名字，明天早上就換你出發。」']],
  wished: '「你已經許過願了。想留下來的話，交接表上的早班還空著。」',
};

// The endings. A: you knew, and went home; B: a wish granted; C: staying on. Each is told once each time it is chosen, in
// a little paper theatre of its own (cabin-ending.js), under its title in paper letters (`en`, from
// scripts/build-title-glyphs.mjs).
export const ENDINGS = {
  A: { title: '結局 A　普通訪客', en: 'Going Home', lines: ['聖誕老人送你到門口，塞給你一張明信片：', '「謝謝你來小屋作客。村子的小秘密，就放在你心裡吧。」', '「哪天想回來幫忙，登記簿最下面那一格，永遠留給你。」'], sign: '—— S.' },
  B: { title: '結局 B　願望旅人', en: 'Wish Granted', lines: ['你用三個章，換了一個願望。', '替身們把它送到了。你帶著實現的願望，和一段北極的回憶回家。'] },
  C: { title: '結局 C　自願留下', en: 'Staying On', lines: ['你在 12/25 早班簽上了自己的縮寫。', '名牌板最右邊的空掛勾掛上了你的名牌，帽架的第六個掛鉤，也掛上了你的帽子。明天早上，換你出發。'] },
};
// The truer telling of B or C, for whoever understood what Holly knew: after it, the village at night, every name lit and
// the light passed on to every window, with Holly's letter (the old ending D, no longer told on its own).
export const TRUTH = { kicker: '＋真相', star: '真相', lines: ['登記簿裡夾著一封信，信封上寫著你的縮寫。'] };
// The postcard after an ending, to keep (saved as a picture): its words by ending, and the deeper one for a true telling.
export const POSTCARD = {
  title: '紀念明信片', save: '存成圖片', home: '回到 Home', stay: '留在村子 ✓', file: kind => `holy-merry-postcard-${kind.toLowerCase()}.png`,
  from: '北極　聖誕村', date: '2026.12.25',
  lines: {
    A: ['謝謝你來小屋作客。', '村子的小秘密，就放在你心裡吧。'],
    B: ['你的願望，替身們送到了。', '帶著它，和一段北極的回憶回家。'],
    C: ['12/25 早班，換你出發。', '你的名牌和帽子，掛在第六個掛鉤上。'],
  },
  truth: ['Dear Christmas Traveler,', 'Santa was never just one person.', '原來，聖誕老人從來不只是一個人。'],
  sign: { A: '—— S.', B: '—— S.', C: '—— S.', truth: '—— H.' },
};
// The theatre's buttons, and the line a true telling ends on.
export const THEATRE = { skip: '跳過', again: '再看一次', close: '回到村子', last: '原來，聖誕老人從來不只是一個人。' };
export const HOLLY = {
  greeting: mark => `親愛的 ${mark}.：`,
  body: '你也看到那一頁了吧。我的願望，在 2003 年就實現了。那年平安夜，替身們把媽媽送回了家。\n從那天起我就想：換我來，把這份溫暖，再傳給下一個人。',
  both: '你和我一樣：願望實現了，還是留了下來。歡迎你，聖誕老人。',
  one: '願望實現以後還願意幫忙的人，就是真正的聖誕老人。',
  sign: '—— H.',
};
export const SEEN = '看過的結局';
// After a stamp, where the story goes next (by how many stamps there are), and what Santa says once the old page is known.
export const NEXT = { 2: '兩個章了。再一個章，就能在登記簿許一個願望。', 3: '三個章了！回登記簿看看，可以許一個願望。', 4: '四件工作都做完了。小房間的班表上，12/25 早班還空著。' };
export const SANTA_ON_HOLLY = '聖誕老人看著你，笑了笑：「你讀了荷莉的紀錄了吧。她呀，是我們這裡最可靠的人。」';
export const GLOBE = '雪慢慢落定了。底座刻著「H. · 2003」——荷莉的願望實現的那一年。';
