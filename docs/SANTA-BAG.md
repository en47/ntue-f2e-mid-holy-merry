# Santa 口袋與檢查模式（第一階段：共通解謎基礎）

`docs/SANTA-PUZZLE-DESIGN.md` 第 12 節第 1 階段。這一階段只做共通系統，還沒有任何關卡發道具，所以正式的 Santa 頁上，口袋會一直藏著，直到第 2 階段開始發道具。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `js/services/cabin-bag.js` | 純規則（node:test）：八樣道具的種類、撿起 `take`、用掉 `spend`、讀存檔 `readBag` |
| `js/data/cabin-items.js` | 道具名稱、檢查時的描述、背面的字；口袋的字幕 |
| `js/components/cabin-items.js` | 八樣道具、口袋、提示手套的紙雕 SVG |
| `js/components/cabin-inspect.js` | 檢查卡：浮起、拖曳或方向鍵轉動、翻面、Esc 收好（之後場景物件也能用） |
| `js/components/cabin-bag.js` | 口袋介面：飛進口袋、拖曳或點選使用、紅墨水圈、搖頭彈回、紙屑、裝上 |
| `tests/bag-preview.html` | 手動預覽台（三樣道具、三個目標，存檔用預覽專用 key） |
| `scripts/check-santa-bag.mjs` | 瀏覽器驗收（不在 `npm test` 內） |

## 道具種類

| 種類 | 道具 | 用對之後 |
| --- | --- | --- |
| `tool` 工具 | 放大鏡、黃銅撥針 | 回到口袋，永遠留著 |
| `spent` 消耗品 | 地衣、火柴盒、空白紙條 | 化成紙屑，離開口袋 |
| `fitted` 安裝 | 小鑰匙、木把手、特大齒輪 | 嵌進目標，離開口袋（場景要畫出裝好的樣子） |

用錯（目標不接受）一律不扣東西：目標搖一下頭、道具彈回口袋、字幕說明原因。

## 之後的關卡怎麼接

`mountPlay` 已經建立 `bag`；第 2 階段起把它傳進各個遊戲：

```js
// 撿到：從場景的某個元素（或舞台上的矩形）飛進口袋；撿過的東西回傳 false
bag.give('handle', snowPile);
// 目標：accepts 回傳 true，或一句「為什麼不行」；use 做遊戲自己的事，可回傳一句字幕
const forget = bag.target(winch, { accepts: id => id === 'handle' || '絞盤少了一個把手，這個裝不上去。', use: () => { fitHandle(); return '把手卡進去了。'; } });
```

遊戲關閉時 `play.leave()` 會呼叫 `bag.clear()`，目標全部忘掉、手上拿的東西放回口袋。

## 存檔

`holy-merry:cabin:v1` 多一個 `bag: { held: [...], used: [...] }`。沒有 `bag` 的舊存檔讀進來是空口袋，其他進度不變；不認得的 id、重複、同時在 held 與 used、被「用掉」的工具都會被修正（`readBag`）。舊存檔「已解開的關卡視為已拿到對應道具」的轉換，跟著各章的道具在第 2～5 階段加入。

## 操作

- 滑鼠：拖曳；或點一下（道具抬起、游標旁跟著小影子、經過目標時畫圈）再點目標；雙擊或「檢查」打開檢查卡。
- 觸控：拖曳；或點一下再點目標。手機上口袋預設收起，點口袋展開。
- 鍵盤：Enter 選道具、Tab 到目標按 Enter；Esc 先放下手上的道具，再按才離開場景。
- 減少動態：不飛、不搖、不轉場，直接出現結果。
