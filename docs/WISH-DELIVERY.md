# Wish：V5 摺信與襪口投遞

> 最新狀態：Firebase 已整合並發布規則；以下保留前一階段紀錄。現行雲端流程、管理員初始化及尚待驗收項目見 [FIREBASE-SETUP.md](FIREBASE-SETUP.md)。
2026-10-29。本階段延續既有 Wish Room，只接入使用者新提供的摺信 Demo；樹、精靈、場景比例及其他三頁保持原樣。

## 參考與實作

來源為 Downloads/holy_merry_wish_room_v5_smooth_delivery.html，逐位元組參考副本與 SHA-256 記在 WISH-DELIVERY-REFERENCE.json。副本放在 docs/references/wish-delivery-v5.html，正式 Wish 頁不載入它。

- 保留 Demo 的 1500ms 摺信、1850ms 弧線飛行節奏。以真實表單快照組合五個紙片，底部、側邊與上緣有旋轉鉸鏈、紙背及蠟封過渡，再接上原有紅蠟封 PNG。
- 同一個 delivery-travel 元素從信紙中心開始摺疊，再直接沿曲線飛行；不在兩階段之間另造一個飛行信封而造成位置跳動。
- 表單保持原本排版空間。動畫層在 wish-room 裡以相對座標定位，正常頁面捲動不會改變襪口終點。
- 每次量測 form / stocking img 的 getBoundingClientRect，扣除舞台邊框。襪子 SVG 的 viewBox 為 360×247，依 object-fit: contain、center bottom 算出實際繪製範圍；終點是原圖 (208,80)，不是固定螢幕像素。
- cubic Bézier 路徑有 61 個影格，弧高隨距離在 28–90 CSS px 間調整。末段縮小至 20%，移入襪口覆蓋層後才移除；飛行本體不預先透明消失。
- 修正初次視覺檢查出現的細長側片：側片只占中間紙帶，橫向摺片包含四角。裁切與淡出放在紙片的面上，避免破壞 preserve-3d、導致 Safari 看見反向文字。

相對 Demo 的調整：沒有搬入它的假願望、假網路等待，也沒有讓整座木架搖晃。成功區改為明確的本機儲存提示；保留再寫一封的操作。現有樹／精靈 GLB、骨架動畫、Renderer 與素材均未變動。

## 真實儲存與中斷

流程為 idle → preparing → folding → flying → saving → success。只在飛行完成後執行真正的儲存 callback；成功畫面只在 callback 成功後出現。saving 雪花顯示期間就是實際儲存時間，本機寫入很快，不額外延遲。

沿用 holy-merry:wishes:v1、暱稱 20 字、願望 300 字、最多 60 封的既有驗證。實際寫入前再讀一次資料與上限；原願望不清空，內容用 textContent / 表單值處理。一次只接受一個投遞。

PNG 解碼失敗、儲存失敗、畫面尺寸改變、切換分頁或離頁時，會清除暫存動畫與覆蓋層、恢復原信紙；未成功寫入時保留輸入。成功後 Write Another Wish 才清空表單。prefers-reduced-motion 啟用時跳過摺紙／飛行，仍執行真實儲存與成功回饋。

目前沒有 Firebase 連線、跨訪客分享或審核；沒有把暫存稱為雲端寄送。樹上 10 封願望、金色特殊信封及精靈寄信反應留待下一階段。

## 檔案範圍

正式頁面修改：wish.html、js/wish.js。

新增正式依賴：css/wish-delivery.css、js/components/wish-delivery.js、js/components/wish-delivery-path.js。

驗收與記錄：tests/smoke.mjs、tests/wish-viewport.html、TESTING.md、docs/WISH-ROOM.md、本文件、參考副本與 WISH-DELIVERY-REFERENCE.json。

## 驗證

- 23 組程式測試通過，包含實際儲存順序、重複送出、再寫一封、PNG 解碼失敗、儲存額滿、減少動態、尺寸／離頁取消、曲線端點及 object-fit 座標。
- Safari 實際檢查 1440×900、1024×900、768×900、390×900。測試頁 iframe 使用真實 CSS viewport，外層僅等比縮放以便檢視；它不嵌入正式網站。
- 四尺寸均輸入測試信並看到本機成功回條；1024、768、390px 連續截圖確認摺紙及飛行，390px 最終確認紙背不透出反向字。樹冠、樹幹、精靈與雪地未受本次改動影響，手機正常縱向捲動。
- 驗收使用 Safari / localhost:5500，與原 Chrome / 127.0.0.1:5500 的願望儲存分開。測試信保留在該測試瀏覽器，沒有刪除任何舊資料。
- 水平溢出與模型完整性是實際畫面檢視，不是 DOM 尺寸數值斷言。實體手機、Firefox、長時間效能與雲端流程尚未驗收。
