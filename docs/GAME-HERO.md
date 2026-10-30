# Game Hero

第三頁第一屏改為無邊框紙雕舞台：高度等於視窗扣掉導覽列，所以開啟頁面時不會看到 Game 01。這取代規格 §五A.2「框架與首頁相同」，由使用者於 2026-10-31 確認；§五A.6 的只露頭肩維持不變。

## 圖層（後到前）

雲 → 雪山（首頁 `mountains-clean.png`）→ 中景 `winter-scenery.png` → 3D Santa → 雪丘 → 立牌 → 雪堤 → 紙邊。天空由導覽列色 `#c7e3ec` 漸層到奶油色，與首頁深藍區隔。

## 立牌

路牌由 `js/components/game-hero-signs.js` 以 SVG 紙雕繪製，色調刻意比手繪場景低飽和。木牌會動，木柱與雪堆留在底座；文字與按鈕仍是 HTML，字體為 `assets/fonts/mountains-of-christmas-700.woff2`（OFL，只用於路牌）。`signs.png` 已不載入，原檔保留。

## Santa

`js/game-hero.js` 於執行時姿勢化骨架，不改 GLB：手臂轉成向下，`Spine1`／`Neck`／`Head` 以小幅正弦擺動。離開視野、分頁隱藏或減少動態時停止繪製。升起是畫布在 `.games-hero-santa` 裁切範圍內的 CSS 位移。可調常數：`VIEW_HEIGHT`（越大角色越小）、`VIEW_CENTER`。

## SVG 紙雕

`js/components/paper-art.js` 是共用工法，`game-wreath.js`、`game-sleigh.js`、`game-foreground.js` 與路牌都用它。SVG 濾鏡重繪成本高（量測中讓 Santa 就緒由 9.5 秒變 41 秒），所以每片紙只轉成圖片一次，會動的部位拆成獨立圖層，以 CSS 移動。新增會動的部位時要拆新圖層，不要動畫 SVG 內部。離開視野的循環動畫由 `pauseOffscreen()` 暫停。底部場景在文件流內，不再疊在遊戲連結上。

## 檢查

先啟動本機伺服器，再執行 `node scripts/screenshot-pages.mjs`（靜態）與 `node scripts/check-game-hero.mjs`（進場、搖擺、Hover、捲動、減少動態）。這兩支不在 `npm test` 內。
