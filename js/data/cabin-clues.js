// The visitor's clue book: what has been noticed around the village that may matter later, in the order the story meets
// it, and hints for whatever the story is waiting on now (`goal` in cabin-story.js decides which). Each goal's hints get
// plainer one at a time; the last one says what to do. Each clue has a short name for its sticker in the book, where it
// was seen, and what it said. All made up; nothing is read from the chat.
export const NOTEBOOK = {
  'care-note': { name: '照顧便條', place: '郵筒裡的小包裹', text: '照顧便條：「別忘了餵麋鹿。上次輪到你時，牠可是等了好久！」' },
  'repair-tag': { name: '維修標籤', place: '穀倉的絞盤', text: '絞盤上的維修標籤：「下次使用前，記得把把手裝回去。」' },
  'barn-note': { name: '交接紙條', place: '穀倉的抽屜', text: '紙條上藍色的字：「12/24 夜班：禮物已分類。壁爐記得添柴。下一位辛苦了！」底下是另一個人用綠色寫的「收到 ✓」。' },
  'letter-backs': { name: '信背面的簽名', place: '書桌上的信', text: '每封信的背面，處理過的人都簽了縮寫：N. 是深紅色的字，K. 是藍色的字。' },
  route: { name: '平安夜路線', place: '書桌的工作筆記', text: '平安夜路線：台北 → 東京 → 雷克雅維克 → 多倫多。' },
  'route-note': { name: '路線背面', place: '書桌的工作筆記', text: '平安夜路線的背面，綠色的字：「收到，扣環修好了。12/23 前半夜換我飛，12/22 晚上我先睡飽。」—— H.' },
  'feed-table': { name: '餵食表', place: '穀倉門上的餵食表', text: '12/25 麋鹿餵食表：07:30 胡蘿蔔一根；06:00 北極燕麥餅一塊；09:00 地衣一小撮（留到最後）。薑餅不給。' },
  'care-log': { name: '照顧紀錄', place: '餵食槽乾草上的紙條', text: '照顧紀錄往前翻，有一行金色的字：「12/21 後半夜，地衣餵過了。—— O.」' },
  'music-lid': { name: '盒蓋的愛心', place: '音樂盒', text: '盒蓋內側刻著一顆小愛心，兩邊是 N 和 K。' },
  'letter-hearth': { name: '石板的刻痕', place: '壁爐', text: '用火柴把火點旺以後，壁爐前的石板上，淺淺的刻痕亮了起來：一個字母 R。書櫃上有幾本書的書脊，在火光裡閃著金光。' },
  'desk-lock': { name: '冬青鑰匙孔', place: '書桌抽屜', text: '抽屜鎖著，鑰匙孔兩邊各刻著一小枝冬青葉。' },
  blotter: { name: '吸墨紙', place: '書桌抽屜裡的吸墨器', text: '翻過來，吸墨紙上印著一行反過來的字：「.eman ruo nihtiw kooL」' },
  'music-bookmarks': { name: '金色書籤', place: '音樂盒', text: '音樂響起、小紙雕轉起來時，盒子兩側升起四枚金色的書籤，一個字也沒有。' },
  'music-catch': { name: '黃銅卡榫', place: '音樂盒底下', text: '有個小抽屜被一根黃銅卡榫卡住了，卡榫旁邊有一個很小的孔。' },
  'globe-village': { name: '球裡的村子', place: '雪花球（放大鏡）', text: '球裡是從前的聖誕村：舊小屋的左後方，多了一個有窗的小房間，窗裡亮著燈。' },
  'globe-base': { name: '底座的刻字', place: '雪花球（放大鏡）', text: '底座刻著「H. · 2003」。' },
  'chair-note': { name: '搖椅紙條', place: '搖椅上的紙條', text: '「There\'s always room for more.」—— S.（這裡永遠還有位置，留給更多。）' },
  'wish-board': { name: '留言板', place: '許願角的留言板', text: '「謝謝昨晚幫忙修好摩天輪的人。」沒有署名。' },
  'blank-slip': { name: '空白紙條', place: '登記簿你那一列', text: '你那一列夾著一張空白的紙條，聞起來有一點檸檬的味道。' },
  'lemon-note': { name: '檸檬紙條', place: '壁爐前的石板', text: '空白紙條在烘熱的石板上，浮出淡褐色的字：「我的願望實現的那一年，雪花球一直記得。」—— H.' },
  'rack-rule': { name: '分信守則', place: '小房間的分揀架', text: '分信守則：信交給郵戳上那個時間正在飛的人。過了午夜，還算前一晚。' },
  'snowman-photo': { name: '雪人拍立得', place: '小房間的帽架', text: '帽架上夾著一張舊拍立得：一個打扮好的雪人。背面寫著：「照這樣打扮，它會想起來。」' },
  'music-drawer': { name: '音樂盒抽屜', place: '音樂盒底的抽屜', text: '照交接表上大家第一次飛的順序彈音梳，抽屜彈開了：裡面是尼爾斯留的吊飾。' },
  'gift-N': { name: '尼爾斯的星星', place: '音樂盒底的抽屜', text: '尼爾斯的紅色星星吊飾：「歡迎你！這個音樂盒，是我做給 K 的。」' },
  'gift-O': { name: '歐拉的愛心', place: '分揀架', text: '信分好以後，最舊的信封裡是歐拉的金色愛心吊飾：「分信辛苦了！郵戳章我帶出門了，別找啦。」' },
  'gift-E': { name: '艾洛的圓球', place: '雪人的圍巾', text: '照拍立得打扮好雪人，圍巾裡掉出艾洛的紫色圓球吊飾：「你也喜歡替雪人打扮嗎？我也是。」' },
  'gift-K': { name: '克莉絲的雪花', place: '摩天輪的動力箱', text: '修好摩天輪以後，動力箱的門內側夾著克莉絲的藍色雪花吊飾：「摩天輪交給你了。下次，換你帶新人來修。」' },
  'gift-H': { name: '荷莉的鈴鐺', place: '最小的那頂聖誕帽', text: '帽子裡藏著荷莉的綠色鈴鐺吊飾：「這頂帽子，是我第一次來的那年戴的。歡迎你。」' },
  tags: { name: '名牌板', place: '小房間的名牌板', text: '五個名牌，每個人的字都是自己的顏色，旁邊畫著工作記號：尼爾斯 N 深紅、扳手；克莉絲 K 藍、雪橇；荷莉 H 綠、星星；艾洛 E 紫、雪花；歐拉 O 金、信封。' },
  duty: { name: '值班須知', place: '小冊的值班須知', text: '每一晚分前半夜、後半夜兩段，兩個人接力；同一個人不能連著值兩段，後半夜接下一晚的前半夜也算連著；新夥伴的前五年是見習期，一季只負責一段。' },
  'register-years': { name: '加入年份', place: '小房間的登記簿', text: '頁首寫著「2026 年聖誕季」。加入年份：N. 2015、K. 2016、H. 2003、E. 2022、O. 2023。' },
  rules: { name: '替身守則', place: '替身守則', text: '自願加入，隨時都可以離開；每替別人傳遞一個願望，就在登記簿上蓋一個章；集到三個章，就能許一個願望。' },
  'old-record': { name: '舊紀錄簿', place: '舊紀錄簿', text: 'CHRISTMAS RECORD · 024：荷莉（H.）2003/12/24 的願望「讓住院的媽媽，回家過聖誕節。」蓋著 WISH FULFILLED；之後每一年都有 H. 的夜班。' },
  'hat-2003': { name: '帽子裡的繡字', place: '最小的那頂聖誕帽（放大鏡）', text: '帽子內側用紅線繡著「H. 2003」。' },
};
// The welcome gifts not yet found, a hint each, asked for one at a time, in the order they can first be reached.
export const GIFT_ORDER = ['N', 'E', 'O', 'K', 'H'];
// The clue book's pages after "now": the clues found in each place (in the order they were found; the gifts' cards go
// with the gifts), and beside each goal, the clues it turns on.
export const CLUE_PLACES = [
  ['yard', '院子', ['care-note', 'repair-tag', 'barn-note', 'care-log', 'feed-table', 'wish-board']],
  ['house', '小屋', ['letter-hearth', 'desk-lock', 'blotter', 'music-lid', 'music-bookmarks', 'music-catch', 'globe-village', 'globe-base', 'chair-note', 'letter-backs', 'route', 'route-note', 'lemon-note', 'music-drawer']],
  ['room', '小房間', ['tags', 'duty', 'register-years', 'rules', 'rack-rule', 'snowman-photo', 'hat-2003', 'blank-slip', 'old-record']],
];
export const GOAL_CLUES = {
  yard: ['care-note', 'care-log', 'repair-tag', 'barn-note'],
  room: ['letter-hearth', 'desk-lock', 'music-lid', 'music-catch', 'globe-village', 'globe-base'],
  bookcase: ['chair-note', 'blotter', 'letter-hearth', 'music-bookmarks'],
  log: ['tags', 'care-log', 'barn-note', 'route-note', 'duty', 'register-years'],
  secret: [],
  join: ['rules'],
  jobs: ['feed-table', 'route', 'rack-rule'],
  cord: ['blank-slip', 'lemon-note', 'globe-base', 'hat-2003', 'register-years'],
  reread: ['old-record'],
  wish: ['rules'],
  endings: [],
  done: [],
};
// Starting over, from the bottom of the clue book: asked once more, since it cannot be undone.
export const RESTART = { ask: '從頭再玩一次', sure: '這會清掉這個瀏覽器裡聖誕村的所有進度：線索、口袋裡的東西、章、結局和見面禮都會不見，從第一章重新開始。確定嗎？', yes: '確定重新開始', no: '再想想' };
export const GIFT_HINTS = {
  N: '尼爾斯最得意的作品，是做給克莉絲的那個音樂盒——看看它的底下。卡住抽屜的卡榫，用小房間郵戳章盤上的黃銅撥針就撥得開。',
  E: '艾洛最愛替雪人打扮。小房間的帽架上，好像夾著什麼。',
  O: '歐拉管信。加入以後，把分揀架上的信分好，也許會有驚喜。',
  K: '克莉絲常顧著摩天輪。修好它以後，看看動力箱裡面。',
  H: '荷莉的見面禮，跟帽架上那頂最小的帽子有關——把它翻過來看看。',
};
// The bookcase's hints, the same in the clue book and at the shelf: only about letters, never "the gold ones" or one R.
export const BOOKCASE_HINTS = ['有幾本書的書脊，在火光下特別亮。', '這些金色書脊上的字母，是 HOLY MERRY 裡的哪幾個？', '那四個字母可以組成一個英文單字，放在 SANTA 前面。', '將 M、O、R、E 排在 SANTA 左側。'];
// Each goal: what to do now in plain words (`task`: never how; shown when it begins and in the clue book), its title in the
// clue book, and hints that get plainer one at a time.
export const GOALS = {
  yard: { task: '在院子裡找找：郵筒、麋鹿身後的餵食槽、雪人腳邊和穀倉，各藏著什麼？', title: '院子裡的小秘密', hints: ['院子裡有幾樣東西少了什麼：郵筒的旗子豎著、麋鹿身後有個餵食槽、穀倉牆上的絞盤轉不動。雪人腳邊的雪堆也看看。', '郵筒裡的小包裹是給麋鹿的點心，放進牠身後的餵食槽；絞盤少了把手，雪人腳邊的雪堆露出一截木頭。', '麋鹿吃完挪開後，撥開餵食槽乾草裡發亮的地方；把手裝上絞盤，繞著轉到頂、扣上卡榫，拉開乾草後面的抽屜。'] },
  room: { task: '進屋看看：壁爐、書桌、音樂盒、雪花球都可以碰；玩過兩樣以後，回到房間中間。', title: '在小屋裡待一會兒', hints: ['屋裡的東西都可以碰碰看：壁爐、書桌、音樂盒、雪花球。', '壁爐的火快熄了，書桌抽屜上了鎖：院子裡找到的東西派得上用場。', '玩過兩樣東西以後回到房間中間，聖誕老人好像會想出門。'] },
  bookcase: { task: '聖誕老人出門照顧麋鹿了。趁現在研究書櫃：四個空位，要放進對的書。', title: '書櫃的空位', hints: BOOKCASE_HINTS },
  log: { task: '補好小房間牆上被雪水弄濕的交接表（補好以後，聖誕老人就會回來）。', title: '弄濕的交接表', hints: ['交接表被雪水弄濕了。先看看牆上的名牌：每個人的字是自己的顏色，旁邊還畫著工作記號。暈開的格子看墨水顏色，洗掉的格子找找有沒有留下記號。', '整個洗掉的格子，要靠別處的紀錄：12/21 後半夜看麋鹿的照顧紀錄；12/24 那晚找穀倉抽屜裡的紙條（藍色先寫、綠色接著寫）。', '12/22 後半夜沒有任何紀錄：照小冊的值班須知，同一個人不能連值兩段（後半夜接下一晚的前半夜也算）；登記簿上加入不到五年的人，一季只值一段；書桌路線筆記背面，荷莉說 12/22 晚上她在睡覺。', '12/21 E.→O.、12/22 N.→K.、12/23 H.→N.、12/24 K.→H.'] },
  secret: { task: '聖誕老人回來了！回到房間中間，聽聽他要說什麼。', title: '聖誕老人回來了嗎', hints: ['交接表補好了。回到房間中間看看。', '聖誕老人好像有話要跟你說。'] },
  join: { task: '要加入替身嗎？到小房間的登記簿，在最下面那格簽上縮寫；不想加入，院子的世界路標是回家的路。', title: '登記簿的空格', hints: ['小房間桌上的登記簿，最新的一頁最下面還空著一格。', '選一個沒人用過的字母當縮寫，蓋章就能加入；不想加入，院子的世界路標就是回家的路。', '加入以後，登記簿上會寫著今天可以幫忙的四件事。'] },
  jobs: { task: '完成登記簿上的四件替身工作，先做哪一件都可以。', title: '替身工作', hints: ['登記簿上列著四件工作，第一次做完就蓋一個章；先做哪一件都可以。', '照顧麋鹿看穀倉門上的餵食表；裝雪橇看書桌上的平安夜路線；處理信件先到小房間的分揀架；摩天輪在遊樂場（屋外往左轉）。', '餵食表上的時間沒有照順序寫；雪橇每到一站只拿得到最上面那一袋；分信看郵戳的時間對照交接表，過了午夜還算前一晚；摩天輪的特大齒輪掉在動力箱旁的雪地裡。', '餵食順序：北極燕麥餅 → 胡蘿蔔 → 地衣。雪橇由下往上裝：多倫多、雷克雅維克、東京、台北。分信：台北 E.、東京 O.、冰島 N.、多倫多 K.、奧斯陸 H.、開普敦 N.，北極寄來的兩封放進你的格子。摩天輪修不好時，動力箱裡有「需要提示嗎？」。'] },
  cord: { task: '小房間書桌的另一頭，有一本紅繩綁著的舊紀錄簿，想辦法打開它。', title: '紅繩綁著的舊紀錄簿', hints: ['小房間書桌的另一頭，有一本紅繩綁著的舊紀錄簿，被四位數的小鎖扣著。', '登記簿的加入年份、雪花球的底座、最小那頂帽子的裡面，都有同一個年份；登記簿你那一列的空白紙條，放在壁爐前烘熱的石板上也會告訴你。', '密碼是 2003。'] },
  reread: { task: '交接表補好了，再讀一次舊紀錄簿。', title: '再讀一次舊紀錄簿', hints: ['舊紀錄簿已經打開過了；交接表補好以後，它的書角翹了起來。', '再翻開舊紀錄簿讀一次，不用再轉密碼：想想你現在知道的「每晚兩個人接力」。', '荷莉的願望在 2003 年就實現了，之後她卻每年都還在交接表上。再讀一次，就會明白。'] },
  wish: { task: '集到三個章了：可以到登記簿許願，或繼續做替身工作。', title: '三個章', hints: ['守則上說，集到三個章就能許一個願望。', '登記簿上有四個願望可以選，選一個再蓋章許願。', '也可以先不許願：四件工作都做完，班表上 12/25 早班還空著。'] },
  endings: { task: '換個選擇，看看其他結局（登記簿下方記著你看過的）。', title: '還有別的結局', hints: ['登記簿下方蓋著你看過的結局；還沒蓋章的，換個選擇試試。', 'A：知道秘密、沒有加入（或在登記簿劃掉縮寫），到院子的世界路標選「踏上回家的路」；B：用三個章許願；C：四件工作都做完，簽 12/25 早班。', '金色的「真相」星：補好交接表、也讀懂舊紀錄簿以後，再走到 B 或 C。'] },
  done: { task: '三個結局和真相都看過了！想重玩，線索本最下面可以從頭開始。', title: '三個結局和真相都看過了', hints: ['謝謝你陪聖誕村過了這個聖誕節。登記簿上看過的結局和真相星，點一下就能再看一次；想從頭再玩一次，線索本最下面有「從頭再玩一次」。'] },
};
