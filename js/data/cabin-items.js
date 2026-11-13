// The things that go in the visitor's pocket (rules: services/cabin-bag.js; drawn in components/cabin-items.js): what each
// is called, what is seen looking at it closely, and what its other side shows. All made up.
export const ITEM_TEXT = {
  lichen: { name: '地衣', look: '一小包乾燥的地衣，用麻繩綁著，聞起來有雪和樹林的味道。', back: '包裝紙背面寫著：「給麋鹿的點心」。' },
  key: { name: '小鑰匙', look: '一把小小的黃銅鑰匙，繫著一段紅毛線。', back: '鑰匙柄背面刻著冬青葉，和書桌抽屜上的雕花一樣。' },
  handle: { name: '木把手', look: '一支彎彎的木把手，握的地方被磨得很光滑。', back: '另一頭是方形的榫頭，好像要插進什麼東西裡轉。' },
  matches: { name: '火柴盒', look: '一盒火柴，盒子上畫著一團小小的爐火。', back: '側面的磨砂紙還很新，只劃過一兩次。' },
  magnifier: { name: '放大鏡', look: '黃銅框的放大鏡，看小字剛剛好。', back: '握柄上有人用小刀刻了一個 S.。' },
  pin: { name: '黃銅撥針', look: '細細的黃銅撥針，尖端可以伸進很小的孔裡。', back: '圓圈那頭綁著一小段紅線。' },
  slip: { name: '空白紙條', look: '看起來什麼都沒寫，聞起來有一點檸檬的味道。', back: '背面也是空白的。' },
  gear: { name: '特大齒輪', look: '一個比手掌還大的木頭齒輪，齒都還很完整。', back: '背面刻著一座小小的摩天輪。' },
};
// The rocker blotter in the desk drawer, looked at closely (cabin-desk.js): on top and turned over, and the line soaked
// into its pad, which shows backwards (the English as on the object; the clue book keeps it backwards too).
export const BLOTTER = { name: '搖擺式吸墨器', look: '木頭搖擺式吸墨器，黃銅握柄擦得發亮。', back: '底下的吸墨紙印著一行字——反過來的。', writing: 'Look within\nour name.' };
// The pocket's own words. `got` when something goes in; `wrong` for a place that does not take it (a place may say why).
export const BAG = {
  label: '口袋', empty: '口袋裡空空的。', look: '檢查', flip: '翻面', close: '收好 ✓',
  how: '拖到要用的地方，或點一下再點那個地方', picked: name => `拿著${name}。點一下要用的地方，或再點一次放回口袋。`,
  got: name => `${name}收進口袋了。`, wrong: '好像不是用在這裡。',
  tip: '口袋裡的東西，可以拖到要用的地方；也可以點一下，再點那個地方。',
  turn: back => `拖曳或用方向鍵可以轉動${back ? '，按「翻面」看背面' : ''}。`,
};
