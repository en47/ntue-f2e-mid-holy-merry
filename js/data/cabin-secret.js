// The little room behind the bookcase: who the substitutes are and what they left there. All made up. The initials match
// the ones on the desk's letters, the music box and the snow globe; the night of 12/24 matches the note in the barn.
export const NAMES = { N: '尼爾斯', K: '克莉絲', H: '荷莉', E: '艾洛', O: '歐拉' };
// The shift log since the snow got to it (who flew is in cabin-story.js `NIGHTS`): each cell, first and second half of
// each night in turn, is a blot still in its writer's colour, washed out altogether, washed out but for the little work
// mark its writer draws by their initial, or still clear. Three ways to put it right (docs/SANTA-PUZZLE-DESIGN.md §5):
// looked at (a colour, a mark, the clear cell), matched with notes found elsewhere (the care log, the barn note, the route
// note), and the one left by the duty rules and the join years in the register (12/22, second half). The colours are the
// name tags' (cabin-art.js SUBSTITUTES), and their names are said too, for anyone who cannot tell them apart.
export const INK = ['blot', 'washed', 'clear', 'washed', 'blot', 'mark', 'washed', 'washed'];
export const COLOUR_NAMES = { N: '深紅', K: '藍', H: '綠', E: '紫', O: '金' };
// Each substitute's work mark, drawn on their name tag and by their initial in the log: a spanner (mends the sleigh), the
// sleigh (drives it), a star (the route), a snowflake (the village's snow), an envelope (the letters).
export const MARKS = { N: ['spanner', '扳手'], K: ['sleigh', '雪橇'], H: ['star', '星星'], E: ['snowflake', '雪花'], O: ['envelope', '信封'] };
// The booklet on the desk: its first page, the duty rules, can be read from the start; the pages after are stuck together
// with snowmelt until Santa opens them for you (the rules for substitutes, below). Neither page says who they are for.
export const DUTY = { title: '值班須知', lines: ['一、每一晚分前半夜、後半夜兩段，兩個人接力；交接時在交接表上簽名。', '二、同一個人不能連著值兩段（跨過午夜也一樣），要讓下一位接手。', '三、新夥伴的前五年是見習期：一季只負責一段，其他時間跟著前輩學。'], margin: '（登記簿上的加入年份，就是見習期從哪一年算起。）', stuck: '後面幾頁被雪水黏在一起，翻不開。' };
export const LOG = {
  title: '夜班交接表', halves: ['前半夜', '後半夜'],
  how: '點一格，再點下面的名牌，把縮寫補回去。',
  // A note it needs, clipped on beside it (LOG_FILES), not found yet.
  missing: '還沒找到的紀錄',
  wrong: count => `墨水乾了一點……有 ${count} 格的筆跡好像對不上。`,
  solved: '最後一格補上，墨水乾了，字一行一行回來：每一晚，都是兩個人接力飛完的。',
  erase: '擦掉',
  // Santa's slip, stuck at the top: asking for a hand (and, while he is out, saying when he will be back); then thanks.
  pin: { away: '弄濕了……誰來幫我補好？補好我就回來。', home: '弄濕了……誰來幫我補好？', thanks: '謝謝你幫我補好！', sign: '—— S.' },
};
// The note left on Santa's chair, hidden while he sat on it: one line in English in his hand (the clue book adds it in
// Chinese). With what the room shows, it points the bookcase's way. On its back, where he has gone (and nothing more).
export const CHAIR = { title: '搖椅上的紙條', lines: ["There's always room for more."], sign: '—— S.', back: ['麋鹿那邊要忙一陣子。'] };
// Out of the window, before he goes: the reindeer's bells; and what he says going out (back in the middle of the room).
export const BELLS = '窗外傳來一陣叮叮噹噹的麋鹿鈴鐺聲。';
export const GOING = '聖誕老人站起來，往窗外看了看：「哎呀，麋鹿好像又把飼料弄翻了！我出去看看。」';
// The sorting rack, once signed up: the rule on its sign, and what is said as the letters go in (cabin-story.js decides).
export const RACK = {
  title: '分揀架', sign: '分信守則：信交給郵戳上那個時間正在飛的人。過了午夜，還算前一晚。',
  how: '點一封信，再點要放的格子。放好的信可以再點一下，換到別的格子，或點信堆放回去。',
  wrong: count => `有 ${count} 封放錯了，被退了回來。對照交接表，再分一次。`,
  done: '分好了！交給你的兩封信，送到書桌上了。',
  gift: '最舊的那個信封裡，夾著一個金色的紙愛心吊飾，綁著一張小卡片——是歐拉留給新替身的見面禮。',
  sorted: '信都分好了，每一格都整整齊齊。',
  places: { m1: '台北', m2: '東京', m3: '冰島', m4: '多倫多', m5: '奧斯陸', m6: '開普敦', tomas: '北極', aya: '北極' },
  fresh: '新替身收',
};
// The early shift on Christmas morning: nobody has signed yet (unless the snowman has been dressed as Santa).
export const MORNING = { date: '12/25', shift: '早班', empty: '（還沒有人簽名）', snowman: '雪人？（實習）' };
export const RULES = { title: '聖誕老人替身守則', lines: ['一、自願加入，隨時都可以離開。', '二、每替別人傳遞一個願望，就在登記簿上蓋一個章。', '三、集到三個章，就能許一個願望，帶著它回家。'], margin: '（最下面有人用鉛筆加了一行小字，太淡了，看不清楚。）' };
export const NOTES = {
  tags: '名牌板上掛著五個名牌，每個人的字是自己的顏色，旁邊畫著一個小記號。最右邊還有一個空掛勾。',
  stamps: '桌上排著四顆郵戳章，印面各刻著一個字母：N、K、H、E。歐拉的那顆，好像被誰帶出門了。',
  pin: '章盤邊上別著一根細細的黃銅撥針，尖端可以伸進很小的孔裡。', pinTake: '拿起黃銅撥針',
  hats: '帽架上六個掛鉤，五個各掛著一頂聖誕帽，第六個空著。荷莉那一鉤掛的是最小的一頂，只有小孩子戴得下。',
  hatsMine: '帽架上六個掛鉤都掛著聖誕帽了。荷莉那一鉤是最小的一頂；第六個掛鉤上，是你的帽子。',
  // Turned over, the smallest hat has something stitched inside, too small to read without the magnifier; read, it is the
  // year Holly's wish came true. (Kept as `hatsKnown` for the clue book's wording once read.)
  hatInside: '帽子內側用紅線繡著一行小字，太小了，看不清楚。', hatsKnown: '最小的那頂聖誕帽內側，用紅線繡著「H. 2003」。',
  rack: '分揀架上塞滿了信，每一格的郵戳都不一樣。',
  polaroid: '帽架上夾著一張舊拍立得：一個打扮好的雪人。翻到背面，有人寫著：「照這樣打扮，它會想起來。」',
  hatLook: '把最小的那頂帽子翻過來看看', hatGift: '帽子裡藏著一個綠色的紙鈴鐺吊飾，綁著一張小卡片。',
  known: '最後一格補上，墨水一行一行乾回來……每一晚，都是兩個人接力飛完的。原來，聖誕老人不只一位。',
  // Heard in the little room once the log is put right: Santa on his way home (what he says then: data/cabin-talk.js).
  coming: '門外好像傳來麋鹿的鈴鐺聲……聖誕老人回來了嗎？回房間看看吧。',
};
// The register's newest page, once the secret is known: how many stamps each substitute has this season (four fill a row;
// Holly's is full, and she is still on the shift log), then a blank row the visitor may sign.
// The register's newest page: the season at the top, then each one's initial, the year they joined and their stamps this
// season (four fill a row; Holly's is full, and she joined long before anyone else), then a blank row.
export const REGISTER = {
  title: '登記簿　最新的一頁', season: '2026 年聖誕季', year: 2026, full: 4, joined: '加入',
  // Stamped by the year of anyone still in the first five years (the duty rules' learners).
  learner: '見習',
  rows: [['N', 3, 2015], ['K', 2, 2016], ['H', 4, 2003], ['E', 1, 2022], ['O', 2, 2023]],
  blank: '（空白）',
  invite: '最下面還空著一格。想一起幫忙，把願望送到大家手上嗎？選一個字母當你的縮寫，蓋上章就加入了。不加入也沒關係。',
  taken: '已經有人用了', sign: '蓋章加入',
  jobs: '今天可以幫忙的事', you: '（你）',
  welcome: mark => `蓋好了。從今天起，你也是一位替身：${mark}.。登記簿上寫著今天可以幫忙的事。`,
  leave: '離開替身工作', sure: '確定要離開嗎？蓋過的章會留著，想回來隨時可以。', left: '你把縮寫輕輕劃掉了。蓋過的章，還留在登記簿上。',
  hint: '登記簿最新的一頁，最下面好像還空著一格。',
};
// The four jobs, each with where to go. Done while signed up, each earns a stamp (a wish point) once (cabin-story.js).
export const JOBS = {
  lichen: ['照顧麋鹿', '穀倉門上貼著今天的餵食表：照上面的時間，一樣一樣餵麋鹿。'],
  hay: ['裝載雪橇', '麋鹿旁的雪橇：照書桌上的平安夜路線，把四袋禮物裝上去。'],
  letters: ['處理信件', '小房間的分揀架：先把信分給對的人；交給你的信，挑一封拿到書桌回信、寄出去。'],
  wheel: ['修摩天輪', '遊樂場的摩天輪停了，去看看哪裡壞了。'],
};
export const DONE = (job, count, of) => `替身工作完成：${job}。登記簿上多了一個章（願望點數 ${count}／${of}）。`;
// The notes the shift log's washed-out cells need, clipped on beside it once found (clue ids, data/cabin-clues.js): each as
// it looks, line by line, in the hand that wrote it, so the ink says whose it is (an initial: that substitute's colour,
// named too; none: plain ink).
export const LOG_FILES = [
  ['care-log', '照顧紀錄', [['麋鹿的照顧紀錄，往前翻的一行：', ''], ['12/21 後半夜，地衣餵過了。—— O.', 'O']]],
  ['barn-note', '穀倉紙條', [['12/24 夜班：禮物已分類。壁爐記得添柴。下一位辛苦了！', 'K'], ['收到 ✓', 'H']]],
  ['route-note', '路線筆記', [['平安夜路線的背面：', ''], ['收到，後半段換我飛。—— H.', 'H']]],
  ['duty', '值班須知', DUTY.lines.map(line => [line, ''])],
  ['register-years', '登記簿', [[REGISTER.season, ''], ...REGISTER.rows.map(([mark, , year]) => [`${mark}.　${REGISTER.joined} ${year}${REGISTER.year - year < 5 ? `（${REGISTER.learner}）` : ''}`, mark])]],
];
