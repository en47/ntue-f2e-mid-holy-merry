# Wish Room：排版、基本動畫與本機摺信

> 最新狀態：Firebase 已整合並發布規則；以下保留前一階段紀錄。現行雲端流程、管理員初始化及尚待驗收項目見 [FIREBASE-SETUP.md](FIREBASE-SETUP.md)。
日期：2026-10-29（Asia/Taipei）。兩份 Wish 規格合併採用，樹為主要比例基準的補充規格優先。先完成視覺排版、模型載入與基本動畫；取得 V5 Demo 後，已接上本機摺信及襪口投遞演出。正式雲端寄送與公開願望仍未啟用，最新流程見 `WISH-DELIVERY.md`。

## 素材檢查

| 素材 | 專案副本 | 檢查結果 |
| --- | --- | --- |
| christmas tree 3d model.glb | assets/models/wish-tree.glb | 31,086,392 bytes；GLB 2.0；無骨架／動畫；三張內嵌貼圖。 |
| elf+toy+3d+model.glb | assets/models/wish-elf.glb | 10,955,168 bytes；GLB 2.0；一組骨架、65 個關節；三張內嵌貼圖。 |
| 手繪蠟封節慶信封.png | assets/illustrations/wish/envelope.png | 1536×1024 RGBA，保留原透明度及光暈；用於原有本機收藏。 |
| 魔法聖誕金色星星信封.png | assets/illustrations/wish/envelope-star.png | 1536×1024 RGBA；已保存原檔，尚未掛到樹上。 |

四份副本與 Downloads 原檔逐位元組一致，詳見 `WISH-ASSETS.json`。沒有修改或複製多套模型。字體沿用使用者已提供的 christmas-3d-complete.zip 內 handwritten-ui.woff，授權副本位於 assets/fonts/WISH-FONT-LICENSE.txt。

修改檔案：`wish.html`、`css/wish.css`、`js/wish.js`、`tests/smoke.mjs`、`TESTING.md`。

新增檔案：`js/components/wish-scene.js`、`js/components/wish-layout.js`、上述四份 GLB／PNG 副本、`assets/illustrations/wish/stocking-rack.svg`、`snow-ground.svg`、`assets/fonts/wish-handwritten.woff`、`WISH-FONT-LICENSE.txt`、`docs/WISH-ASSETS.json` 與本說明。其他三頁、共用 CSS／JS、Home 角色與所有既有素材 SHA-256 均與本次開始前一致，沒有刪除原有檔案。

木架聖誕襪與連續雪地是本階段新增、可替換的 SVG，沒有使用網路圖或替代 3D 模型。後續已取得 `holy_merry_wish_room_v5_smooth_delivery.html`，參考副本及來源雜湊見 `WISH-DELIVERY-REFERENCE.json`。

## 排版與尺寸

- 樹的原始外框：寬 0.649536、高 0.978119、深 0.631927，最低點 y=0。精靈靜態外框：寬 0.711090、高 0.979431、深 0.461914。
- 右側區域在桌面占 61%，左側信紙占 34%；中尺寸為左 36%、樹區 61%，768px 左 39%、樹區 59%。原始幾何保持等比。
- 以真實頂點在 XZ 平面上的最大半徑預留 360° 旋轉空間。顯示高度取「樹區高 96%」和「樹區寬 94% 能容納的完整旋轉外框」的較小值。較窄平板優先完整呈現，而非硬拉高或裁樹冠。
- 100 CSS px 對應一個正交相機世界單位；每次 ResizeObserver 通知後重新量測樹區及路徑。樹模型依外框中心／最低點放入父群組。
- 桌面基準線距舞台底部 11%；樹幹、精靈路徑與木架使用同一條基準。木架高度依信紙實際底邊預留至少 24px 間距；SVG 已移除底部多餘畫布空間。
- 手機改為信紙 → 聖誕襪 → 520px 樹區 → 65px 底部控制列。雪地由木架腳下連續延伸至樹與精靈，沒有分開的模型展示框。表單字級 16px，可正常輸入。
- 信紙錯誤／狀態文字改變高度時，也會重新量測，避免木架與信紙重疊。

## 模型與動畫

`js/components/wish-scene.js` 只有一個透明 Renderer、單一 Scene／Camera 和一個 RAF。材質及貼圖保留原樣，使用柔和 Hemisphere、Directional 燈及低強度環境光；腳底接觸陰影透明，沒有不透明雪平台。

樹沒有自動動畫，只能由橫向拖曳、左右方向鍵或 Home（回到正面）控制。觸控採 pan-y 及橫向／縱向意圖判斷，縱滑交由瀏覽器捲動。旋轉不包含縮放或相機平移。

精靈使用原始 `walk`（2.333 秒）與 `dance_05`（2.875 秒）；另有 dance_03、dance_04，未作為這次預設。以複製 Clip 固定 Hips 的 X／Z 位移，保留所有垂直與骨架旋轉資料，不修改來源動畫。巡邏一個週期 28 秒：走 7 秒 → 定點舞蹈 7 秒 → 返回 7 秒 → 定點舞蹈 7 秒。切換動作淡入淡出 0.28 秒。

精靈約為樹區高度的 19% 以下；路徑限於表單、襪口下方的底部空間。行走和舞蹈各採固定初始姿勢腳底偏移，不逐幀強制把動作腳底重設到地面。可手動暫停；系統減少動態時保持靜態，樹仍可手動旋轉。

離開視窗或場景不可見時停止 RAF；DPR 上限 1.5。pagehide 釋放 Renderer、貼圖、材質、幾何、骨架、環境與事件；pageshow 重新掛載。載入失敗顯示重試，已成功的模型不重複下載；WebGL 失敗不影響本機表單。

## 保留與未完成項目

原 `holy-merry:wishes:v1` 儲存鍵、60 封本機儲存上限、資料讀取／錯誤保護及原願望內容保留。按鈕明確標示「摺信並暫存」，沒有假裝寄至 Firebase 或已掛上樹。暱稱維持既有 20 字上限，避免舊儲存驗證器拒絕新資料。

已實作摺信、蠟封銜接、飛入襪口及本機投遞狀態機。以下尚未實作：實際網路 Loading、樹上 10 個 envelope anchors／raycast、9+1 真實願望選取、星星信封懸掛、精靈寄信反應、Firebase／管理員審核。

後續順序：實際樹枝上的信封定位與讀信 → 精靈送信反應 → 真實雲端資料與權限驗證。動畫應量測信紙及襪口的實際 rendered rect；目前沒有用假成功狀態掩蓋缺少後端。

## Firebase 待提供事項

專案內沒有 Firebase config、SDK、登入或資料庫，這次沒有連線或發布安全規則。後續需要：使用者選定的 Firebase Project、Web App 的公開 `firebaseConfig`、啟用 Anonymous Authentication、Firestore 資料庫與區域、開發／部署網域，以及授權審核管理員的帳號與安全設定。不要提供 service-account 私鑰至前端。

正式實作時再核對當時 SDK／Console 步驟，建立並測試資料驗證及權限規則；公開願望必須同時為 public + approved，pending/private 只能本人或授權管理員讀取。前端隱藏資料不等於權限控制。

## 排版階段驗證（摺信階段另見 WISH-DELIVERY.md）

- 20 組程式測試通過。新增實際 GLTFLoader 幾何／骨架檢查、資源 SHA-256、四尺寸完整旋轉容納、巡邏停留、原地化不改來源 Clip、不刪除垂直運動、手勢分流。測試以 Texture 替身隔離圖片解碼；實際貼圖另由 Chrome 檢查。
- Chrome 1440×900、1024×900、768×900、390×900 均已實際檢視。完整星星、樹冠與樹幹未被 Canvas 裁切，信紙與木架分開，精靈保持在底部雪地，沒有可見水平溢出。手機需正常縱向捲動才能看完直排場景，並非把整個桌面縮小。
- 390px 模擬實際橫拖後看到樹的另一面；暫停／繼續按鈕狀態能切換；原本已存在的一封本機願望仍可開啟。沒有新增假公開願望。
- 初次 PMREM 模糊參數有提示，已改用現有 Home 相同的 .04，重新載入後沒有可見網站錯誤／警告。DevTools 仍列出獨立 Issues／隱藏資訊，未宣稱全部瀏覽器診斷項為零。
- 實體手機觸控、Safari／Firefox、長時間低階裝置效能及 WebGL context-loss 恢復仍待驗收。模型合計約 40 MB，未壓縮原始貼圖。
