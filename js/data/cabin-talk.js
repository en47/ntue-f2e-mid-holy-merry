// Talking to Santa in the room, with no AI: tap him (or his portrait in the corner) and a paper card opens with his
// line and a few questions to ask (components/cabin-chat.js shows it; components/cabin-play.js picks the line). For each
// goal (data/cabin-clues.js GOALS) two lines in his own words that point the way and never give the answer; asked a third
// time, he only smiles. Before he has told you the secret, nothing here says "substitute". All made up.
export const TALK = {
  hello: { guest: '外面很冷吧？在火爐邊暖暖身子。', told: '又見面了。想好了嗎？不急。', partner: '辛苦了，夥伴。' },
  asks: { now: '我現在該做什麼？', place: '這是什麼地方？', where: '你剛剛去哪了？' },
  place: { guest: '這是我的小屋。一年到頭，我大多待在這裡。', told: '這間小屋，是所有替身的家。' },
  where: '麋鹿又把飼料弄翻了，我出去收拾了一下。',
  again: '慢慢來，不急。',
  now: {
    yard: ['院子裡好幾樣東西，都少了點什麼。郵筒的旗子不是豎著嗎？', '給麋鹿的點心、雪人腳邊的雪堆、穀倉的絞盤……慢慢找。'],
    room: ['屋裡的東西都可以碰，別客氣。', '壁爐的火快熄了，書桌的抽屜也鎖著。你在院子裡撿到的東西，說不定用得上。'],
    bookcase: ['我那個書櫃啊，挑書挑得很。', '搖椅上那張紙條，你讀過了嗎？'],
    log: ['小房間那張交接表，被雪水弄濕了，我正頭痛呢。', '牆上名牌的顏色和記號，還有你一路撿到的紙條，都看看。'],
    join: ['登記簿最下面那一格，還空著。', '不想加入也沒關係，院子的世界路標會帶你回家。'],
    jobs: ['登記簿上寫著今天要幫忙的事，先做哪一件都行。', '餵食表在穀倉門上，路線在書桌上，信在小房間，摩天輪在遊樂場。'],
    cord: ['書桌另一頭那本紅繩綁著的舊紀錄簿，是用一個年份鎖著的。', '有一個年份，在這間屋子裡出現了好幾次。'],
    reread: ['那本舊紀錄簿，現在再讀一次看看。', '你已經知道每晚是兩個人接力了，讀起來會不一樣的。'],
    wish: ['三個章，夠許一個願望了。', '不急著許願的話，多幫幾件事也很歡迎。'],
    endings: ['登記簿下方記著你看過的結局。', '換個選擇，故事就會不一樣。'],
    done: ['謝謝你陪我過了這個聖誕節。', '想再從頭來一次，線索本最下面可以重新開始。'],
  },
};

// Santa home once the shift log is put right: the secret told one line at a time, each moved on by your reply, then
// the empty row in the register. The line about the old record only for someone who opened it before knowing.
export const RETURN = {
  door: '門開了，聖誕老人拍掉身上的雪走進來：「看來，你已經發現我們的小秘密了。」',
  chair: '聖誕老人從搖椅上看著你，笑了：「看來，你已經發現我們的小秘密了。」',
  first: '你們是……？',
  steps: [
    ['「一個晚上要飛遍全世界，我一個人可來不及。」', '所以？'],
    ['「名牌板上那五位，是輪流替我飛的夥伴，我們叫他們『替身』。交接表上記的，就是誰飛哪一段。」', '原來如此'],
    ['「小冊後面黏住的那幾頁，我幫你翻開了，替身的規矩都寫在上面。」', '嗯'],
  ],
  record: ['「……那本舊紀錄，你也翻開過了啊。現在再讀一次，說不定會讀出不一樣的東西。」', '嗯'],
  ask: '「登記簿最下面那一格，一直空著。想留下來幫忙嗎？」',
  join: ['我想幫忙', '「太好了！到小房間的登記簿，在最下面那格簽上你的縮寫。」'],
  wait: ['我再想想', '「不急。想回家的話，院子的世界路標會帶你走。」'],
};
