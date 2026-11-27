// The fifth page, Christmas Vending (vending.html): a paper slot machine out in the snow on a winter night, a lamp post
// beside it and a little roofed stand with an advent calendar hung in it. A button picks a little thing, the lever pulled
// all the way down brings it onto the machine's little stage; taken from there, it is on the coloring desk as a line
// drawing to colour in with crayons. The four things are Tripo3D's models (docs/VENDING-MODELS.md), the drawings are in
// components/vending-coloring.js. None of it is tied to the story
// on Santa's page.
export const ITEMS = [
  { id: 'gingerbread', name: '薑餅人' },
  { id: 'snowman', name: '雪人' },
  { id: 'tree', name: '聖誕樹' },
  { id: 'stocking', name: '聖誕襪' },
];
// The crayons in their tin: twelve soft Christmas colours, each with its name (read out, and on the slip under the tin)
// and its English one.
export const CRAYONS = [
  ['#b03f37', '聖誕紅', 'Christmas Red'], ['#3f6653', '松綠', 'Pine Green'], ['#f4ead3', '奶油白', 'Cream'], ['#e2b65a', '暖金', 'Warm Gold'],
  ['#fbfaf5', '雪白', 'Snow White'], ['#7a5238', '可可棕', 'Cocoa Brown'], ['#e2aaa3', '灰粉', 'Dusty Pink'], ['#9fbdd2', '冬藍', 'Winter Blue'],
  ['#9db59a', '鼠尾草綠', 'Sage'], ['#b97c4a', '焦糖', 'Caramel'], ['#4a5f80', '夜藍', 'Night Blue'], ['#4a4245', '煤灰', 'Charcoal'],
];
export const VENDING = {
  button: name => `按下${name}的按鈕`,
  // The lever, and what the machine says (to screen readers only) as it goes.
  lever: '拉桿：往下拉到底再放開',
  chosen: name => `選了${name}。拉桿鬆開了，往下拉到底再放開。`,
  locked: '拉桿還扣著，先按一顆按鈕選一樣。',
  short: '沒有拉到底，拉桿彈回去了。',
  drag: '拉桿要往下拖，一路拉到底再放開。',
  running: name => `${name}出發了。`,
  drop: name => `${name}到舞台上了，點舞台把它拿出來，或按別的按鈕換一個。`,
  tray: name => `從舞台拿出${name}`,
  desk: name => `工作桌上是${name}的線稿：選一支蠟筆，點一塊就塗上顏色。`,
  region: (name, i) => `${name}的第 ${i} 塊`,
  crayon: name => `${name}的蠟筆`,
  crayons: '蠟筆盒',
  undo: '復原', redo: '重做', reset: '重新上色', finish: '完成', save: '存成圖片', back: '回到市集', again: '再修改',
  // The workshop: the shelf of works, the swatch cards, the stickers, a gentle word, the card when it is done.
  // The shelf on the wall (two works the elves made, the newest of one's own) and the album it opens.
  albumOpen: n => `打開作品集（${n} 件作品）`,
  album: 'My Gallery', albumClose: '關上作品集', albumNew: '畫一張新的', albumBlank: name => `畫一張新的${name}`,
  albumEmpty: '還沒有作品。從販賣機拿一樣，或在上面挑一張新的來畫吧。', albumDone: '完成', albumHalf: '畫到一半',
  albumGo: '繼續畫', albumHere: '正在畫', albumDrop: '刪除', albumSure: '確定刪除？',
  presets: '配色卡', cards: [['classic', '經典'], ['snowy', '雪夜'], ['candy', '糖果']], preset: name => `套用「${name}」配色`,
  stickers: '貼紙・點一下再點畫紙', sticker: { star: '星星', flake: '雪花', holly: '冬青' }, stick: name => `拿起${name}貼紙`, holding: name => `拿著${name}貼紙：點畫紙貼上去，再按一次就放下。`,
  empty: '先替它塗上一點顏色吧。', full: '貼紙已經貼滿了。', howTo: '選一支蠟筆，點一塊就塗上顏色',
  doneTitle: '完成了！', doneLine: name => `${name}已經放上工坊的展示架了。`, finished: name => `${name}完成了，放上展示架。`,
  file: id => `holy-merry-${id}.png`,
  pick: '挑一樣來畫', failed: '3D 販賣機暫時無法顯示，可以直接挑一樣來畫。',
  // Walking up to the machine from the street, and back.
  near: '走近販賣機，選一樣來拉', away: '回到市集',
  // The paper tag at the machine saying what to do next (shown, not read out: the status says it in full).
  next: { idle: '先選一樣', chosen: '往下拉到底', ready: '點這裡去上色' },
};
// The Advent House: any drawer may be pulled out (this page keeps no story date), each with a little thing in it that
// brings up a card with its paper scene (components/cabin-advent-scenes.js) and one line; `play` is what a tap on the
// scene does, read out.
export const ADVENT = {
  title: 'Advent Calendar', door: day => `第 ${day} 個抽屜`, lift: '走近降臨曆小屋，看 24 個小抽屜', back: '回到市集', gift: day => `打開 12 月 ${day} 日的小卡`,
  // Each door's little picture inside (components/cabin-clue-art.js adventPicture).
  art: ['room', 'sleigh', 'fell', 'reindeer', 'musicbox', 'boot', 'cake', 'gear', 'poinsettia', 'rack', 'gift-K', 'photo', 'candles', 'letter', 'card', 'hearth', 'gift-E', 'gift-N', 'gingerhouse', 'gift-H', 'moon', 'feed', 'sleigh', 'flight'], opened: day => `第 ${day} 個抽屜，打開過了，再拉出來看一次`, date: day => `12 月 ${day} 日`, close: '收好 ✓',
  days: [
    { text: '降臨曆是從德國流行起來的：從 12/1 起每天開一扇窗，一路數到平安夜。', play: '打開小日曆的下一扇窗' },
    { text: '雪橇的鈴鐺擦得亮亮的，叮叮噹噹，整條街都聽得見。', play: '搖搖雪橇的鈴鐺' },
    { text: '芬蘭的故事說，聖誕老人住在「耳朵山」，所以聽得見每一個願望。', play: '對耳朵山說一個願望' },
    { text: '小麋鹿今天練習起飛，一頭撞進了一朵雲。', play: '讓小麋鹿再試一次' },
    { text: '音樂盒轉一圈，窗外的雪就跟著跳一支舞。', play: '轉音樂盒的發條' },
    { text: '12/6 是聖尼古拉節：德國的孩子前一晚會把靴子擦亮，放在門口。', play: '看看靴子裡多了什麼' },
    { text: '在日本，很多人會在聖誕節吃一個草莓鮮奶油蛋糕。', play: '放一顆草莓' },
    { text: '遊樂場的摩天輪亮起燈，坐到最高，看得見整片雪地。', play: '轉動摩天輪' },
    { text: '聖誕紅原產墨西哥，紅紅的部分其實是葉子，不是花。', play: '讓聖誕紅展開' },
    { text: '寄給聖誕老人的信越來越多，郵差先生多背了一個袋子。', play: '再放一封信' },
    { text: '冰島有 13 位聖誕小子，明天起每晚來一位，在窗台的鞋子裡放小禮物。', play: '等聖誕小子來' },
    { text: '雪人今天換了新圍巾，比昨天更神氣。', play: '吹一陣風' },
    { text: '12/13 是瑞典的聖露西亞節：女孩戴著燭光頭冠，一邊走一邊唱歌。', play: '點亮一根蠟燭' },
    { text: '芬蘭的聖誕老人村有一間郵局，從那裡寄出的信，都會蓋上特別的聖誕郵戳。', play: '蓋一個郵戳' },
    { text: '第一張拿來賣的聖誕卡，1843 年在英國印出來。', play: '打開聖誕卡' },
    { text: '壁爐的柴劈好了，今晚可以烤棉花糖。', play: '烤一顆棉花糖' },
    { text: '掛在聖誕樹上的玻璃彩球，最早出自德國的玻璃工匠。', play: '碰一下彩球' },
    { text: '聖誕老人路過，舉起手：「擊個掌吧，你今天也很棒！」', play: '跟聖誕老人擊掌' },
    { text: '薑餅屋在德國流行起來，和《糖果屋》的童話有關。', play: '敲敲薑餅屋的門' },
    { text: '冬天的夜裡很冷，出門前在口袋放一個暖暖包吧。', play: '搓一搓暖暖包' },
    { text: '冬至前後，是北半球一年裡夜晚最長的時候。', play: '讓月亮走一段' },
    { text: '小麋鹿：「燕麥餅、胡蘿蔔、地衣……我全都準備好了！」', play: '餵小麋鹿' },
    { text: '雪橇裝好了，只差最後一晚。', play: '再放一份禮物' },
    { text: '平安夜：聖誕老人出發了！今晚記得抬頭看看天空。', play: '目送雪橇飛過月亮' },
  ],
};
