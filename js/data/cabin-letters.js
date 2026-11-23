// The letters on Santa's desk. All made up: nothing here comes from the Wish page, where visitors' own letters stay private.
// Each has a front (who it is from, and the letter itself) and a back, where whoever dealt with it wrote a line and signed
// with an initial. The initials are in different hands (`hand`): a first small clue that more than one person works here.
// `paper` is what it was written on (a child's lined page, or a squared work pad), `doodle` the crayon drawing in its corner.
// The work pad with Christmas Eve's route comes first, on top of the pile: its back is a note the shift log needs.
export const DESK_LETTERS = [
  {
    id: 'route', from: '工作筆記', to: '平安夜路線', paper: 'pad',
    body: '台北 → 東京 → 雷克雅維克 → 多倫多。\n冰島風大，記得多帶一條圍巾。雪橇第三個座位的扣環有點鬆。',
    back: { note: '收到，扣環修好了。12/23 前半夜換我飛，12/22 晚上我先睡飽。', sign: 'H.', date: '12/22', hand: 'h' },
  },
  {
    id: 'mia', from: '小米（7 歲）', to: '北極　聖誕老人 收', paper: 'kid', doodle: 'sled',
    body: '親愛的聖誕老人：\n奶奶的膝蓋不好，冬天出門很辛苦。可以送她一台會自己滑的雪橇嗎？我會每天幫忙掃門口的雪。',
    back: { note: '雪橇加了軟墊，已備妥。', sign: 'N.', date: '12/20', hand: 'n' },
  },
  {
    id: 'ole', from: '奧勒（北邊的麋鹿牧場）', to: '北極　聖誕老人 收', paper: 'kid', doodle: 'reindeer',
    body: '謝謝您上個月幫忙找回走失的小麋鹿。牠現在每天都跟在媽媽後面，連吃地衣都要搶第一口。',
    back: { note: '回信寄出了，附上一包地衣。', sign: 'K.', date: '12/21', hand: 'k' },
  },
  {
    id: 'lumi', from: '露米（10 歲）', to: '北極　聖誕老人 收', paper: 'kid', doodle: 'book',
    body: '去年的手套好溫暖，我戴著它堆了三個雪人！今年想要一本會講故事的書，可以讀給弟弟聽。',
    back: { note: '書包好了，夾了一張書籤。', sign: 'K.', date: '12/22', hand: 'k' },
  },
];
// The reply waiting in the rack: folded into its envelope, sealed with wax, postmarked and dropped in the mail sack.
export const REPLY = {
  id: 'reply', from: '北極　聖誕老人', to: '給小米', greeting: '親愛的小米：',
  body: '奶奶的雪橇加好了軟墊，昨晚已經停在你家門口了。謝謝你每天幫忙掃雪，這比什麼禮物都珍貴。',
  sign: 'S.',
};
// Two letters that come to the desk once the visitor has signed the register: their backs wait for the new substitute's
// initial (`sign` is filled in with it), and the volunteer writes the reply, choosing one of three things to say (`answers`;
// none is wrong). `name` is how the reply greets the child.
export const VOLUNTEER_LETTERS = [
  {
    id: 'tomas', from: '托馬（8 歲）', to: '北極　聖誕老人 收', name: '托馬', paper: 'kid', doodle: 'friends',
    body: '親愛的聖誕老人：\n我們家搬到新的城市了，我還沒有朋友。可以讓我在新學校交到一個好朋友嗎？我會先跟大家打招呼的！',
    back: { note: '交給新來的替身：第一封回信，就從這封開始吧。', date: '12/25', hand: 'you' },
    answers: ['新學校的第一天，先對坐在你旁邊的同學笑一笑吧。好朋友，常常就是從一句「早安」開始的。', '聽說你很會畫畫？把畫帶去學校吧，喜歡畫畫的人一定會湊過來看。', '別擔心，麋鹿們剛來北極的時候也沒有朋友，現在牠們每天都一起拉雪橇呢。'],
  },
  {
    id: 'aya', from: '阿雅（6 歲）', to: '北極　聖誕老人 收', name: '阿雅', paper: 'kid', doodle: 'nose',
    body: '聖誕老人你好：\n弟弟生病住院，今年不能回家過聖誕節。可以請你也去醫院看看他嗎？他最喜歡麋鹿了。',
    back: { note: '交給新來的替身：第一封回信，就從這封開始吧。', date: '12/25', hand: 'you' },
    answers: ['昨晚，魯道夫特地繞到醫院的窗外。弟弟有看見牠閃閃發亮的紅鼻子嗎？', '請把這張麋鹿貼紙送給弟弟，告訴他：北極的麋鹿都在幫他加油。', '醫院的護理師也是聖誕老人的好幫手，今年的禮物，昨晚就是他們送到弟弟床邊的。'],
  },
];
