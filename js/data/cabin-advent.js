// The advent house's twenty-four windows (cabin-advent.js), one for each December day up to Christmas Eve: a small fact
// about Christmas somewhere (those about the Intro page's three countries link to it), or a word from someone in the
// village. Each has its picture (cabin-clue-art.js: `ADVENT_ART`, or a clue's or a goal's), one line, and for some a
// little move once it is open (`move`: 'bob', 'spin', 'swing', 'twinkle').
export const ADVENT = {
  title: '降臨小屋',
  hint: '一天開一扇窗，從 12/1 數到平安夜。',
  before: days => `12/1 開放：再等 ${days} 天，就能打開第一扇窗。`,
  today: day => `今天是 12 月 ${day} 日：第 ${day} 扇窗可以打開了。`,
  after: '聖誕快樂！每一扇窗都可以打開了。',
  locked: '還沒到喔，偷看會被聖誕老人發現！',
  count: n => `打開了 ${n}／24 扇`,
  intro: country => `到 Intro 看看${country} →`,
  close: '收好 ✓',
};
export const WINDOWS = [
  { art: 'room', text: '降臨曆是從德國流行起來的：從 12/1 起每天開一扇窗，一路數到平安夜。', intro: '德國' },
  { art: 'sleigh', text: '聖誕老人：「從今天起，雪橇每天都要檢查一次。」', move: 'bob' },
  { art: 'fell', text: '芬蘭的故事說，聖誕老人住在「耳朵山」，所以聽得見每一個願望。', intro: '芬蘭' },
  { art: 'reindeer', text: '小麋鹿今天練習起飛，一頭撞進了一朵雲。', move: 'bob' },
  { art: 'musicbox', text: '尼爾斯（N.）：「音樂盒的發條，我又上緊了一圈。」' },
  { art: 'boot', text: '12/6 是聖尼古拉節：德國的孩子前一晚會把靴子擦亮，放在門口。' },
  { art: 'cake', text: '在日本，很多人會在聖誕節吃一個草莓鮮奶油蛋糕。', intro: '日本' },
  { art: 'gear', text: '克莉絲（K.）：「摩天輪的齒輪，今天全都上好油了。」', move: 'spin' },
  { art: 'poinsettia', text: '聖誕紅原產墨西哥，紅紅的部分其實是葉子，不是花。' },
  { art: 'rack', text: '聖誕老人：「分揀架快滿了，今年的願望特別多。」' },
  { art: 'gift-K', text: '冰島有 13 位聖誕小子，明天起每晚來一位，在窗台的鞋子裡放小禮物。', move: 'spin' },
  { art: 'photo', text: '艾洛（E.）：「雪人今天換了新圍巾，比昨天更神氣。」' },
  { art: 'candles', text: '12/13 是瑞典的聖露西亞節：女孩戴著燭光頭冠，一邊走一邊唱歌。', move: 'twinkle' },
  { art: 'letter', text: '歐拉（O.）：「郵戳章洗乾淨了，平安夜要蓋好多封信。」' },
  { art: 'card', text: '第一張拿來賣的聖誕卡，1843 年在英國印出來。' },
  { art: 'hearth', text: '聖誕老人：「壁爐的柴劈好了，今晚可以烤棉花糖。」' },
  { art: 'gift-E', text: '掛在聖誕樹上的玻璃彩球，最早出自德國的玻璃工匠。', move: 'swing' },
  { art: 'gift-N', text: '聖誕老人：「今天是重要的日子，你一定會很棒的！呵呵呵。」', move: 'twinkle' },
  { art: 'gingerhouse', text: '薑餅屋在德國流行起來，和《糖果屋》的童話有關。' },
  { art: 'gift-H', text: '荷莉（H.）：「暖暖包準備好了，平安夜的天空很冷喔。」', move: 'swing' },
  { art: 'moon', text: '冬至前後，是北半球一年裡夜晚最長的時候。' },
  { art: 'feed', text: '小麋鹿：「燕麥餅、胡蘿蔔、地衣……我全都準備好了！」' },
  { art: 'sleigh', text: '聖誕老人：「雪橇裝好了，只差最後一晚。」', move: 'bob' },
  { art: 'flight', text: '平安夜：聖誕老人出發了！今晚記得抬頭看看天空。', move: 'bob' },
];
