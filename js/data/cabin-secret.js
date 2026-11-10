// The little room behind the bookcase: who the substitutes are and what they left there. All made up. The initials match
// the ones on the desk's letters, the music box and the snow globe; the night of 12/24 matches the note in the barn.
export const NAMES = { N: '尼爾斯', K: '克莉絲', H: '荷莉', E: '艾洛', O: '歐拉' };
// The shift log since the snow got to it (who flew is in cabin-story.js `NIGHTS`): each cell, first and second half of
// each night in turn, is a blot still in its writer's colour, washed out altogether, or still clear. The colours are the
// name tags' (cabin-art.js SUBSTITUTES), and their names are said too, for anyone who cannot tell them apart.
export const INK = ['blot', 'washed', 'clear', 'blot', 'blot', 'blot', 'washed', 'washed'];
export const COLOUR_NAMES = { N: '深紅', K: '藍', H: '綠', E: '紫', O: '金' };
export const LOG = {
  title: '夜班交接表', halves: ['前半夜', '後半夜'],
  wet: '班表被雪水弄濕了。暈開的地方還看得出是什麼顏色的墨水；有幾格整個洗掉了。',
  how: '點一格，再點下面的名牌，把縮寫補回去。',
  wrong: count => `墨水乾了一點……有 ${count} 格的筆跡好像對不上。`,
  solved: '最後一格補上，墨水乾了，字一行一行回來：每一晚，都是兩個人接力飛完的。',
  erase: '擦掉',
};
// The early shift on Christmas morning: nobody has signed yet (unless the snowman has been dressed as Santa).
export const MORNING = { date: '12/25', shift: '早班', empty: '（還沒有人簽名）', snowman: '雪人？（實習）' };
export const RULES = { title: '聖誕老人替身守則', lines: ['一、自願加入，隨時都可以離開。', '二、每替別人傳遞一個願望，就在登記簿上蓋一個章。', '三、集到三個章，就能許一個願望，帶著它回家。', '四、每一晚分前半夜、後半夜兩段，兩個人接力；交接時在班表上簽名。'], margin: '（最下面有人用鉛筆加了一行小字，太淡了，看不清楚。）' };
export const NOTES = {
  tags: '名牌板上掛著五個名牌：尼爾斯、克莉絲、荷莉、艾洛、歐拉。最右邊還有一個空掛勾。',
  register: '登記簿翻開在最新的一頁，上面蓋滿了郵戳。前面的頁用紅繩綁著，暫時打不開。',
  stamps: '桌上排著四顆郵戳章，印面各刻著一個字母：N、K、H、E。歐拉的那顆，好像被誰帶出門了。',
  hats: '牆上掛著四頂聖誕帽，一頂比一頂小。最小的那頂，只有小孩子戴得下。',
  // Once the old page has been read (cabin-finale.js): the smallest hat was Holly's, the year her wish came true.
  hatsKnown: '最小的那頂聖誕帽內側，用紅線繡著「H. 2003」。原來荷莉許願的那年，她還是個孩子。',
  rack: '分揀架上塞滿了信，每一格的郵戳都不一樣。',
  known: '名牌、班表、守則……原來，聖誕老人不只一位。',
  back: '門開了，聖誕老人拍掉身上的雪走進來：「我回來了——咦，書櫃怎麼開著？……看來你都看見了。呵呵，這是我們村子的小秘密。」',
};
// The register's newest page, once the secret is known: how many stamps each substitute has this season (four fill a row;
// Holly's is full, and she is still on the shift log), then a blank row the visitor may sign.
export const REGISTER = {
  title: '登記簿　最新的一頁', full: 4,
  rows: [['N', 3], ['K', 2], ['H', 4], ['E', 1], ['O', 2]],
  invite: '最下面還空著一格。想一起幫忙，把願望送到大家手上嗎？選一個字母當你的縮寫，蓋上章就加入了。不加入也沒關係。',
  taken: '已經有人用了', sign: '蓋章加入',
  jobs: '今天可以幫忙的事', you: '（你）',
  joined: mark => `蓋好了。從今天起，你也是一位替身：${mark}.。登記簿上寫著今天可以幫忙的事。`,
  leave: '離開替身工作', sure: '確定要離開嗎？蓋過的章會留著，想回來隨時可以。', left: '你把縮寫輕輕劃掉了。蓋過的章，還留在登記簿上。',
  hint: '登記簿最新的一頁，最下面好像還空著一格。',
};
// The four jobs, each with where to go. Done while signed up, each earns a stamp (a wish point) once (cabin-story.js).
export const JOBS = {
  lichen: ['照顧麋鹿', '院子裡的麋鹿：餵牠最愛吃的地衣。'],
  hay: ['收好乾草', '馴鹿小屋：用滑輪把乾草拉上去掛好。'],
  letters: ['處理信件', '屋裡的書桌：新來了兩封信，替聖誕老人回信、寄出去。'],
  wheel: ['修摩天輪', '遊樂場的摩天輪停了，去看看哪裡壞了。'],
};
export const DONE = (job, count, of) => `替身工作完成：${job}。登記簿上多了一個章（願望點數 ${count}／${of}）。`;
