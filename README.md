# Holy Merry!

依照四頁 Wireframe 製作的原生 HTML / CSS / JavaScript 聖誕主題網站初版。
無框架、不需要安裝套件或建置。首頁 3D 使用已放入專案的 本機 Three.js 模組。

## Wish：Firebase 真實資料整合

第四頁已接上 holymerry 的 Anonymous Auth / Firestore，保留原 3D 樹、精靈與摺信／飛行／雪花。新信預設私人；同意公開後仍需管理員核准。寫入獲伺服器確認才顯示自己的金色信封，重新整理後恢復同一匿名身分的最新願望。舊 localStorage 收藏保留，不自動上傳。

安全規則及審核索引已發布。指定管理員 UID 的 `admin: true` 已透過無私鑰 impersonation 與 Admin SDK 設定、重讀確認；本人重新登入後，正式核准「47／你好」、拒絕既有私人驗收信及另一訪客讀取公開信皆通過。`/admin` 會導向既有 `admin.html`。完整紀錄與測試限制見 [FIREBASE-ADMIN-VERIFICATION.md](docs/FIREBASE-ADMIN-VERIFICATION.md)，安全設定見 [FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)。

瀏覽網站仍不需建置。開發測試另需 Node.js 22+／Java 21，可執行 `npm ci`、`npm test`、`npm run test:firebase`；共 23 組既有測試、18 項 Firebase Emulator 測試、2 項樹上信封測試通過。其他三頁與原素材沒有改動。

## 首頁：V5 手繪立體聖誕繪本

已依照提供的 V4 原型整合七張原始手繪 PNG：天空、山景、村落、前景雪堆與松樹逐層展開，沿用素材包的 Merry Christmas 手寫字圖。保留原有導覽、倒數、音樂控制與 Footer，其他三頁未修改。

- Santa 已改用新提供的 `santa+claus+figurine+3d+model.glb`，網站檔案 `assets/models/santa-dance.glb`。舊 Santa 檔案只留存，不載入也不作為 fallback。
- 原 `dance_02` 為 24fps，只裁切 **1.000–4.000 秒（24–96 幀）**，以三秒片段循環。使用原插值器保留兩端及所有內部關鍵影格；接點以 0.18 秒混合所選區間兩端的姿勢降低跳接，沒有播放區間外動作。原 GLB 未更動。
- 麋鹿沿用既有 GLB 與四秒原地舞步，前半身左右擺幅提高至約 ±4.3°、增加點頭，並補償前腳支撐點；不播放原 walk，不改骨長或網格。
- 兩角色共用一個透明 Three.js Renderer，統一地面與相機尺度；前景雪堆局部蓋住腳尖。左右拖曳可旋轉、放開回正，方向鍵也可操作。
- 角色名稱、暫停／回正按鈕與箭頭已移除。直接輕點角色或按 Enter／Space，顯示從左右滑入的手工聖誕信紙；隨機取既有對話，五秒收起，可手動關閉。P 鍵暫停／播放，方向鍵旋轉。
- 1440px、768px、390px 各有構圖調整；支援 `prefers-reduced-motion`，手機保留直向捲動。載入失敗可重試；模型鄰近畫面才載入，離頁釋放資源。

V5 修正六張 PNG 的殘條遮罩、縮小並提高原標題、改用紙雕 CTA，原始 PNG／GLB 不變。最新檔案清單、素材缺失及驗證見 [HOMEPAGE-V5.md](docs/HOMEPAGE-V5.md)；V4 基礎架構見 [HOMEPAGE-STORYBOOK.md](docs/HOMEPAGE-STORYBOOK.md)，原素材完整性紀錄在 `docs/STORYBOOK-ASSETS.json`。Chrome 已檢視 1440、768、390px；實體手機及其他瀏覽器仍待實機驗收。

## 遊戲二：已接入五關配對原作

2026-10-28 已把 [me666good/game2](https://github.com/me666good/game2) 五關聖誕配對挑戰直接整合到 `game.html` 下半部。保留原本 22 張手繪素材、遊戲說明、花圈倒數、翻牌及通關流程。遊戲在同一頁操作，不需要跳轉，也沒有使用遠端 iframe。下方另保留原作網址與 GitHub 來源連結。

未修改的 26 個原始檔已保存在 `vendor/game2/`，來源 commit 與逐檔 SHA-256 記錄於 `docs/GAME2-UPSTREAM.json`。主站使用局部 CSS 與獨立 JS 適配模組，原始 GitHub Repository 未修改。各關組數為 4 / 6 / 8 / 10 / 12，倒數為 25 / 40 / 55 / 70 / 85 秒；每翻開兩張才計一次翻牌。頁面 Restart 回第一關，逾時重玩則留在當前關卡。

來源分析、整合架構與原始素材清單見 [GAME2-INTEGRATION-PLAN.md](docs/GAME2-INTEGRATION-PLAN.md)。開啟 Live Server 後重新載入 Game 頁，即可看到五關原作。舊單關原型檔保留作歷史參考，已停止載入。

## 本機預覽

1. 使用 VS Code 開啟「期中專題」資料夾。
2. 安裝或啟用 Live Server 擴充功能。
3. 在 `index.html` 按右鍵 → **Open with Live Server**。
4. 使用頁首 Home / Intro / Game / Wish 切換頁面。

也可以在此資料夾執行：

```sh
python3 -m http.server 5500 --bind 127.0.0.1
```

然後開啟 `http://127.0.0.1:5500/`。停止伺服器時按 Ctrl+C。
請透過 HTTP 預覽，不要直接以 `file://` 開啟，因為網站使用 JavaScript ES modules。

## 開發階段

- Phase 1：完成原始專案檢查、PDF 四頁視覺檢視及架構規劃。初次檢查時只有空白 `index.html`；其後已取得 game2 GitHub 來源並更新五關配對整合規劃。PDF 留在 Downloads，未修改。
- Phase 2：完成四頁、共用導覽與 Footer、音樂控制面板、設計變數、桌面及基本響應式布局。
- Phase 3：完成聖誕倒數、紙雕繪本、雙角色 GLB 與指定舞步循環播放、兩個角色對話、三國文化切換、雪橇基礎遊戲、原作五關配對整合、願望儲存與信封查看。
- Phase 4：`tests/smoke.mjs` 共 16 組測試通過，包含模型、五關流程與原作完整性；瀏覽器實測範圍及限制見 `TESTING.md`。其他角色素材與額外舞蹈動畫仍待後續整合。

## 檔案與修改入口

| 功能 | 檔案 |
| --- | --- |
| Home / Intro / Game / Wish | `index.html` / `intro.html` / `game.html` / `wish.html` |
| 設計系統：色彩、字體、間距 | `css/tokens.css` |
| 共用導覽、按鈕、Footer、音樂面板 | `css/shared.css`、`js/shared.js` |
| 各頁布局 | `css/home.css`、`intro.css`、`game.css`、`wish.css` |
| 首頁倒數、對話互動 | `js/home.js` |
| 首頁雙角色 3D 控制 | `js/santa-model.js`、`js/components/characters-scene.js`、`js/components/character-motion.js` |
| 新 Santa 模型與檔案資訊 | `assets/models/santa-dance.glb`、`assets/models/santa-dance.json` |
| 首頁動畫裁切／接點混合／麋鹿舞步 | `js/components/character-animation.js` |
| V4 原始紙雕插畫及來源 | `assets/illustrations/storybook/`、`docs/STORYBOOK-ASSETS.json` |
| 麋鹿模型與資訊 | `assets/models/reindeer.glb`、`assets/models/reindeer.json` |
| 本機 Three.js 與授權 | `vendor/three/` |
| 角色對話資料 | `js/data/dialogues.js` |
| 國家文化資料 | `js/data/countries.js` |
| 地圖按鈕位置 | `js/data/map-points.js` |
| 地圖事件與選取狀態 | `js/components/world-map.js` |
| 國家資訊卡 UI | `js/intro.js` |
| 遊戲初始化 | `js/game.js` |
| 雪橇遊戲 | `js/games/sleigh.js` |
| 五關配對遊戲適配 | `js/games/game2-matching.js`、`css/game2-matching.css` |
| 配對原始檔與全部圖片 | `vendor/game2/`（原樣保留） |
| 配對來源版本與完整性紀錄 | `docs/GAME2-UPSTREAM.json` |
| 舊單關配對原型（不載入） | `js/games/matching.js` |
| 願望表單、信封及內容對話框 | `js/wish.js` |
| 願望儲存服務 | `js/services/wish-storage.js` |

四頁保留獨立、語意化的導覽及 Footer 標記，共用樣式與互動程式。修改導覽或 Footer 內容時，請同步四個 HTML。

## 現有行為

- 倒數以**台灣時間 12 月 25 日 00:00**為目標，每秒更新天、時、分、秒；聖誕節當天顯示祝福與零倒數，12 月 26 日起倒數下一年。
- 首頁兩側均為可操作的真實 GLB 模型，對話按鈕與模型控制分開。對話按鈕也支援 Enter / Space。
- 地圖尚未提供，使用明確標示的佔位區及芬蘭、德國、日本三個按鈕。位置只是版面示意，不代表經緯度。選取後顯示資訊卡與資料來源；Escape 或關閉鍵返回選取按鈕。
- 雪橇目前是可操作的原型，使用標示「雪橇佔位／障礙」的方塊，未製作替代角色。Start 後以 ↑ ↓ 或按住畫面按鈕移動；Escape 暫停。離開操作區、切換視窗或分頁會暫停。碰撞結束後可重玩；分數依飛行時間增加。
- 配對沿用 game2 的五關：8 / 12 / 16 / 20 / 24 張卡片。按 Start 立刻啟動該關倒數，每翻開兩張計 1 次翻牌；錯配 700ms 後蓋回，期間鎖定翻牌。過關 500ms 後顯示原作下一關橫幅，第五關結束顯示通關圖。Restart 回第一關；逾時橫幅的重來則重玩當關。重開會清除舊計時及延遲回呼。
- 使用瀏覽器返回快取回到 Game 頁時，配對遊戲回到原作說明畫面；雪橇若先前執行中，會保持暫停。
- 音樂不自動播放。未提供音檔時可開啟面板、選擇本機音檔試聽，不會上傳；重新整理或跨頁後需重選。正式音檔放入 `assets/audio/`，再設定 `js/shared.js` 的 `MUSIC_SOURCE`。跨頁不自動恢復播放。
- 桌面音樂控制位於右下角；手機版移至頁尾，避免遮住輸入欄位與遊戲操作。

## 願望資料

儲存鍵：`holy-merry:wishes:v1`。內容格式為 `{ version: 1, wishes: [...] }`。
每筆包含 `id`、`nickname`、`content`、`createdAt`。

- 暱稱最多 20 字元、願望最多 300 字元；不接受只有空白的輸入。
- 初版最多保存 60 封信，達上限會提示，**不自動刪除舊願望**。
- 儲存失敗保留表單，並顯示失敗訊息；無法讀取舊資料時不覆蓋原資料。
- 願望用 `textContent` 顯示，輸入的 HTML 會呈現為文字。
- 願望只存在目前瀏覽器與相同網站來源，不是共享資料庫，也沒有傳送給聖誕老人或其他訪客。
- 清除網站資料或更換瀏覽器、主機名稱、協定、連接埠，可能看不到之前的資料。正式使用時請固定 Live Server 網址。
- 多分頁會接收 storage 更新，送出前也重新讀取資料；localStorage 不提供交易保證，未來多人同步須改接後端。

## 替換素材

`assets/` 下已預留 `illustrations/`、`maps/`、`fonts/`、`audio/`、`models/`。

1. Logo：替換四頁的 `.brand-mark`。目前使用字母標記，並非正式圖像 Logo。
2. 插畫：替換 `.hero`、`.origin-image`、`.elf-stage`、`.tree-placeholder` 的佔位內容。使用 `<img>` 時補上合適 `alt`，以 `object-fit: contain` 完整呈現素材。
3. 手寫字：在 `css/tokens.css` 加入 `@font-face`，調整 `--font-display`。目前不載入任何外部字體。
4. 地圖：把地圖圖片放入 `.map-stage` 的底層，調整 `map-points.js` 的百分比座標。保留按鈕與文字資訊，供鍵盤操作。
5. 3D：`[data-model-slot="santa"]` 與 `[data-model-slot="reindeer"]` 均已接上正式 GLB；調整來源及比例請修改 `MODELS`，維持模型與對話按鈕分離。
6. 既有雪橇遊戲：先保留原始檔，再調整 `initSleighGame(root)` 入口整合；不要修改配對模組的狀態。

## 動畫擴充

HTML 的 `data-animation` 標記已保留主標題、角色、區塊進場、地圖資訊切換、遊戲完成、信封飛行／展開與精靈移動入口。`data-state` 可用於遊戲完成及暫停樣式。

五關配對另提供 `matching:level-start`、`matching:pair-match`、`matching:level-complete`、`matching:timeout`、`matching:complete` DOM 事件，可在 `#matching-app` 或上層監聽；事件 detail 包含關卡、配對、翻牌與剩餘時間。第五關完成才發出整體 complete。擴充特效時不要修改原始副本或配對判定。

首頁已有紙雕展開與角色舞步，其他頁保留按鈕、卡片及信封的輕量互動，沒有持續飄雪或大型動畫套件。未來可在 body 的獨立、`aria-hidden="true"` 裝飾層加雪景；頁面過場放在共用導覽程式，保持正常連結可用。

新動畫需遵循 `prefers-reduced-motion`，以 opacity / transform 為優先；避免影響輸入、鍵盤焦點及主要內容。雪橇位移是遊戲核心玩法，僅在使用者開始後運行。

## 文化內容來源

- [聖誕節由來參考](https://www.biblegateway.com/resources/encyclopedia-of-the-bible/Christmas)
- [芬蘭觀光局：聖誕傳統](https://www.visitfinland.com/en/articles/experience-a-true-northern-christmas/)
- [德國觀光局：降臨節傳統](https://www.germany.travel/en/cities-culture/romantic-advent.html)
- [日本國家旅遊局：十二月介紹](https://www.japan.travel/en/guide/december/)

圖片、音樂和模型皆未從上述網站下載。
