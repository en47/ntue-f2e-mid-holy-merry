// The letters on Santa's desk. All made up: nothing here comes from the Wish page, where visitors' own letters stay private.
// Each has a front (who it is from, and the letter itself) and a back, where whoever dealt with it wrote a line and signed
// with an initial. The initials are in different hands (`hand`): a first small clue that more than one person works here.
export const DESK_LETTERS = [
  {
    id: 'mia', from: '小米（7 歲）', to: '北極　聖誕老人 收',
    body: '親愛的聖誕老人：\n奶奶的膝蓋不好，冬天出門很辛苦。可以送她一台會自己滑的雪橇嗎？我會每天幫忙掃門口的雪。',
    back: { note: '雪橇加了軟墊，已備妥。', sign: 'N.', date: '12/20', hand: 'n' },
  },
  {
    id: 'ole', from: '奧勒（北邊的麋鹿牧場）', to: '北極　聖誕老人 收',
    body: '謝謝您上個月幫忙找回走失的小麋鹿。牠現在每天都跟在媽媽後面，連吃地衣都要搶第一口。',
    back: { note: '回信寄出了，附上一包地衣。', sign: 'K.', date: '12/21', hand: 'k' },
  },
  {
    id: 'route', from: '工作筆記', to: '平安夜路線',
    body: '台北 → 東京 → 雷克雅維克 → 多倫多。\n冰島風大，記得多帶一條圍巾。雪橇第三個座位的扣環有點鬆。',
    back: { note: '收到，後半段換我飛。扣環修好了。', sign: 'H.', date: '12/23', hand: 'h' },
  },
  {
    id: 'lumi', from: '露米（10 歲）', to: '北極　聖誕老人 收',
    body: '去年的手套好溫暖，我戴著它堆了三個雪人！今年想要一本會講故事的書，可以讀給弟弟聽。',
    back: { note: '書包好了，夾了一張書籤。', sign: 'K.', date: '12/22', hand: 'k' },
  },
];
// The reply waiting in the rack, to be sealed with wax before it goes.
export const REPLY = {
  id: 'reply', from: '北極　聖誕老人', to: '給小米',
  body: '親愛的小米：\n奶奶的雪橇已經上好軟墊，平安夜就會停在你家門口。謝謝你每天幫忙掃雪，這比什麼禮物都珍貴。',
  sign: 'S.',
};
