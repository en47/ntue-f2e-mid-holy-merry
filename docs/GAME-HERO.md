# Game Hero

第三頁第一屏改為無邊框紙雕舞台：高度等於視窗扣掉導覽列，所以開啟頁面時不會看到 Game 01。這取代規格 §五A.2「框架與首頁相同」，由使用者於 2026-10-31 確認；§五A.6 的只露頭肩維持不變。

## 圖層（後到前）

彩旗、雲、熱氣球 → 遠方雪丘 → 旋轉木馬與摩天輪 → 雪坡 → 松樹與圍欄 → 3D Santa → 雪丘 → 立牌 → 前景雪堤 → 紙邊。全部由 `js/components/game-scene.js` 以 SVG 繪製；首頁是雪地村莊（`js/components/home-scene.js`），兩頁刻意不重複，也都不用山。光源固定在左上，道具集中在 `paper-props.js`。

## 立牌

路牌由 `js/components/game-hero-signs.js` 以 SVG 紙雕繪製，色調刻意比手繪場景低飽和。木牌會動，木柱與雪堆留在底座；文字與按鈕仍是 HTML，字體為 `assets/fonts/mountains-of-christmas-700.woff2`（OFL，只用於路牌）。`signs.png` 已不載入，原檔保留。

## Santa

模型為 `assets/models/santa-new.glb`（僅 Game 頁使用，首頁用 `santa-dance.glb`），由 `scripts/build-santa-model.mjs` 從 `assets/santa claus.glb` 壓縮並烘入重定向後的舞步。`js/game-hero.js` 於執行時姿勢化骨架：手臂轉成向下，`Spine1`／`Neck`／`Head` 以小幅正弦擺動；`js/components/santa-head.js` 再讓頭頸跟隨滑鼠（首頁共用），觸控與減少動態不追蹤。離開視野、分頁隱藏或減少動態時停止繪製。升起是畫布在 `.games-hero-santa` 裁切範圍內的 CSS 位移。可調常數：`VIEW_HEIGHT`（越大角色越小）、`VIEW_CENTER`。

## SVG 紙雕

`js/components/paper-art.js` 是共用工法，`game-wreath.js`、`game-sleigh.js`、`game-foreground.js` 與路牌都用它。SVG 濾鏡重繪成本高（量測中讓 Santa 就緒由 9.5 秒變 41 秒），所以每片紙只轉成圖片一次，會動的部位拆成獨立圖層，以 CSS 移動。新增會動的部位時要拆新圖層，不要動畫 SVG 內部。離開視野的循環動畫由 `pauseOffscreen()` 暫停。底部場景在文件流內，不再疊在遊戲連結上。

## 檢查

先啟動本機伺服器，再執行 `node scripts/screenshot-pages.mjs`（靜態）與 `node scripts/check-game-hero.mjs`（進場、搖擺、Hover、捲動、減少動態）。這兩支不在 `npm test` 內。
