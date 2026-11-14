// The words of two volunteer jobs (the rules are in services/cabin-story.js): the reindeer's feeding table on the barn
// wall, and the sleigh's loading. All made up.
export const FEED = {
  title: '12/25 麋鹿餵食表',
  // The table as it is pinned up: by the clock, but not written in that order.
  lines: [['07:30', '胡蘿蔔一根'], ['06:00', '北極燕麥餅一塊（先墊墊肚子）'], ['09:00', '地衣一小撮（牠最愛的，留到最後）']],
  never: '✗ 薑餅：那是聖誕老人的點心！',
  note: '（貼在穀倉門上，今天早上的。）',
  foods: { oats: '北極燕麥餅', carrot: '胡蘿蔔', lichen: '地衣', gingerbread: '薑餅' },
  // The little name tags hung under each food in the basket.
  tags: { oats: '燕麥餅', carrot: '胡蘿蔔', lichen: '地衣', gingerbread: '薑餅' },
  start: '今天輪到你照顧麋鹿。照穀倉門上的餵食表，一樣一樣餵。',
  wrong: '麋鹿歪著頭，沒有吃……好像還不到吃這個的時候。照餵食表的時間，從頭再來一次。',
  good: count => ['喀滋喀滋！', '好甜！', ''][count] ?? '',
  done: '餵食表上的三樣都照時間餵完了，麋鹿心滿意足地打了個呵欠。',
  checked: '餵食表上，今天的三格都打上勾了。',
};
export const SLEIGH = {
  title: '裝載雪橇', label: '麋鹿旁的雪橇',
  rule: '雪橇的貨架很窄，袋子只能一袋疊一袋。每到一站，只拿得到最上面那一袋。',
  how: '點一袋禮物放上貨架（疊在最上面）；點貨架最上面那一袋可以拿下來。',
  tag: city => `${city}`,
  wrong: city => `……雪橇到了第一站，可是要給${city}的那一袋不在最上面。袋子都卸下來了，再裝一次。`,
  done: '四袋都裝好了，第一站的那袋就在最上面。雪橇準備好了！',
  loaded: '雪橇已經裝好了，四袋禮物疊得整整齊齊。',
};
