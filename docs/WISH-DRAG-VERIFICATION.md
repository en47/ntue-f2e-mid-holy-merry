# Wish 拖曳與文字選取驗收（2026-10-30）

## 原因與修正範圍

正式場景由 `.wish-room` 捕捉事件並對實際模型 raycast，Canvas 本身不接收指標；沒有啟用 OrbitControls 或第二套滑鼠旋轉控制器。舊控制器在命中模型的 `pointerdown` 未取消滑鼠原生行為，等移動 6px 才加 CSS 選取鎖。因此相容 `mousedown`／`selectstart` 可提早啟動；原有 CSS 又在拖曳時豁免輸入欄位。

修改 `js/components/wish-interaction.js` 與 `css/wish.css`：

- 只有真實模型命中才取消滑鼠／筆的按下預設行為；表單、連結、一般按鈕不攔截。
- 每次手勢固定樹、信封或精靈的擁有者；6px 確認橫向拖曳後才暫時鎖定選字。
- 保留指標捕捉，另由 document 接收移動、放開與取消，處理捕捉失敗與跨場景移動。
- 放開、取消、捕捉遺失、失焦、Escape、頁面隱藏與銷毀都清理狀態。
- 垂直觸控放棄模型手勢，交回瀏覽器；防止裝飾圖片原生拖曳。

未修改 HTML、場景／模型／動畫程式、Firebase、其他頁面與原畫。

## 實際 Chrome 驗收

`tests/wish-drag.html` 載入正式 Wish HTML、CSS、GLB 與控制器，使用 10 封明確標示的本機測試信。它不載入 Firebase，也不提交或儲存願望；預先讓精靈進入現有互動待機以便穩定測試。

| 操作 | 實際結果 |
| --- | --- |
| 舊控制器跨信紙拖曳 | 觀察到原生 mousedown 及 selectstart 各一次；本次未重現持續殘留的反白範圍 |
| 新控制器樹內橫拖、跨信紙拖曳、三次快速拖曳 | 樹旋轉；沒有新增 mousedown／selectstart，沒有選字，放開後捕捉與鎖都為 false |
| 樹拖曳跨出 iframe 再放開 | 收到 trusted pointerup，捕捉與鎖正常清除 |
| 精靈橫拖 | 精靈朝向改變，樹朝向維持原狀，沒有選字 |
| 暱稱輸入與全選複製 | 正常；內容可貼進願望欄位 |
| 願望欄位全選、複製、貼上、刪除 | 正常；可將 `Wish editing test` 複製成兩份，再刪除 |
| 公開勾選框 | 正常切換 |
| 金色信封滑鼠拖曳 | 樹旋轉，讀信次數維持 0 |
| 金色信封滑鼠單擊 | 讀信次數為 1，開啟對應測試信對話框，關閉正常 |
| 390px Chrome 裝置模式橫向觸控 | trusted touch 指標旋轉樹，沒有文字選取 |
| 390px 縱向觸控取消後再橫拖 | 觀察到 pointercancel 1 次；捕捉／鎖清除，後續橫向旋轉正常 |

測試時也發現 Chrome 曾在 iframe 使用舊模組快取；暫時透過 DevTools Disable cache 重載並確認新版控制器後驗收，結束已恢復該選項。未加入輪詢、重載或 cache-busting 邏輯。

## 自動測試與限制

- `tests/smoke.mjs`：23 組通過。
- `tests/wish-cloud.test.mjs`、`tests/elf.test.mjs`、`tests/wish-interaction.test.mjs`：18 項通過。
- 新增捕捉失敗的 document 後備、表單原生編輯、多指標排除、垂直觸控與裝飾拖曳測試；原有測試涵蓋 blur／lostpointercapture／Escape／hidden／destroy。
- 失焦、Escape 中斷與捕捉失敗是自動事件測試，未逐項在實際瀏覽器製造。
- 手機為 Chrome 觸控模擬，尚未在實體 iOS／Android 驗收。
- 本機測試頁一次重載曾出現字體 `ERR_SOCKET_NOT_CONNECTED`，另有測試頁 favicon 404；未見控制器執行錯誤。未修改不相關的伺服器或字體設定。

重新驗收：啟動現有本機伺服器後開啟 `/tests/wish-drag.html`；確認「控制器更新 true」，觀察每次拖曳後「捕捉 false／選取鎖 false」。上述本機測試不代表重新測試雲端寄信、權限或審核。
