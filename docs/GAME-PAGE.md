# Game 頁：舞台與手機版修正（2026-10-30）

以下是目前實作；後方舊記錄保留作為歷程，不代表目前採用的嵌入方式。

## 診斷與選擇

- Game 01 偏窄來自父頁用 viewport 高度倒推寬度，最低收至約 720px。現在恢復 `min(100%, 1100px)`。原作畫面本來就是寬版（1100:510 的場景，另有 HUD 和操作列）；保留這個比例與原作難度，不改成 16:9 或拉伸角色。短視窗允許捲動完整舞台。
- Game 02 外站 CSS 的 `body` 使用 `min-height:100vh` 並垂直置中，卡牌區固定最小 360px；固定高 iframe 會放大空白。原作 `.card-face` 沒有明確 inset，在 Safari 可見卡面定位異常。外站直接開啟也曾觀察到相同問題。
- 比較後選擇混合方式：Game 01 繼續載入永久 GitHub Pages URL；Game 02 使用專案內既有、已測試的原作五關模組，放入 `games/christmas-matching.html` 同源 iframe。這不是重建遊戲，未更動 `js/games/game2-matching.js`、`css/game2-matching.css` 或 `vendor/game2`。
- 本機遊戲修正由獨立 `css/game2-embed.css` 管理：卡面 `inset:0`，手機緊湊資訊列、200px 最小卡區，桌面卡區280px；內容可自然增高。父頁僅量測同源 iframe 的 body 高度，透過 ResizeObserver 調整外框，不讀 Game 01 的跨域 DOM。Game 02 的 GitHub Pages 更新不會自動更新本機副本；Game 01 仍隨原站部署更新。

## 版面與滾動

- 結構為既有 Header → Game 01（含短版 welcome）→ Game 02 → 既有 Footer。Header / Footer HTML 與共用樣式沒有修改。
- 桌面兩個舞台共用 `min-height:calc(100svh - 108px)`；不設固定 height，不用 hidden overflow 裁切遊戲。1440×900 的共同最小高度792px，1366×768為660px，768×1024為916px。內容較高時舞台自然長大。
- 真正捲動容器為 html，採 `y proximity`、stage `start`；首舞台留 Header 的 scroll-margin，避免首次吸附隱藏品牌。Footer 的 end snap 保留可達性。700px 以下及 reduced-motion 關閉吸附，不攔 wheel / touch，不排程重載。
- Game 02 左欄只保留 GAME 02、標題及一段繁中介紹。移除外部 Start、HOW TO PLAY、重複說明、展開五關說明與開發來源連結。只有遊戲內原本的 Start / Restart；收合式故障備援入口仍可另開原作。
- 刪除獨立裝飾區的版面角色，原禮物改置 Game 02 內的絕對定位雪地前景，不增加高度。禮物寬120／60／38px，錯落排列；1100px以下隱藏禮物，避免窄螢幕擋操作。雪地保留。裝飾 z-index 位於遊戲下層且 pointer-events:none，Game 01 沒有外部雪景覆蓋。

## 實際驗收

使用 `tests/game-viewport.html` 的真實 CSS viewport，在瀏覽器看過1440×900、1366×768、768×1024、390×844的實際 Game 頁；外部預覽才縮放，遊戲本身不被 transform 縮放。

- Chrome：四尺寸檢視；Game 01 最大寬1100px，完整底部操作可經自然捲動抵達；實測開始、上移、距離得分、碰撞結束（142公尺）、重玩及暫停。未改動原作碰撞或計分演算法。
- Chrome：Game 02 實際翻牌、錯配翻回、成功配對4/4、第一關完成、進入第二關（6組／40秒）、逾時、重玩。沒有把全五關的瀏覽器通關列為已完成。
- 手機：358px寬配對遊戲，說明畫面約413px高；自然高度完整、無水平溢出，Start可操作，卡片與 Restart 全部可見。這是桌面瀏覽器的手機 viewport，尚未在實體手機驗證觸控。
- 桌面：以原生捲動穿過較高 Game 01，再接近 Game 02 時吸附；游標在飛行 iframe 上仍可繼續捲動。Game 02 和 Footer 皆可抵達。禮物不遮擋 iframe，雪景／Footer 間距0px。
- Safari：前階段版面與本機 Game 02 載入有檢視；最終高度自適應以 Chrome 複核。
- 過程確實發現瀏覽器曾快取舊 `game.js`，導致已移除的本機初始化仍執行。強制重新整理後消失，未加入 production cache-busting、輪詢或 gameplay 自動重新載入。
- `tests/smoke.mjs` 23群組通過（含原作素材雜湊及五關邏輯）。Firebase emulator 未因本次版面工作重跑。

## 重現

Live Server 開啟 `tests/game-viewport.html`，或附加 `?viewport=tablet&stage=matching`、`?viewport=mobile&stage=matching`。一般作品入口仍是 `game.html`。若看到先前舊版，Chrome 使用 Cmd+Shift+R；不用改外站網址。

---

## 以下為先前版本記錄

# Game 頁：外站飛行遊戲與手繪雪景

日期：2026-10-29。只調整第三頁，沿用原生 HTML／CSS／JavaScript，沒有新增套件。

## 問題及修正

1. 原 Game 01 是早期本機 Canvas 佔位遊戲；改為唯一的外部 iframe，`src` 固定為使用者指定的永久網址 `https://en47.github.io/game1-flyingsanta/`。舊 `js/games/sleigh.js` 原檔仍保留，但第三頁不再初始化它。沒有把外站 HTML、CSS、JavaScript 或素材下載成主網站副本；只透過唯讀 GitHub 工具查看版面與操作方式。
2. Game 02 保留原五關、圖片、倒數、翻牌及配對實作。桌面採約 35% 說明／5% 間隔／60% 遊戲，遊戲最大寬 650px；880px 以下調整為 33%／4%／63%，700px 以下改為直排。左欄直接放在淺藍背景，沒有大色卡。
3. 左側 START GAME 觸發既有 `#start-btn`，不是新遊戲或第二個計時器。開始後隱藏快捷鈕，保留原作 Restart；手機開始時捲動到遊戲。原模組的 pagehide／pageshow 清理與重建保留。
4. 手機實際檢查發現原 `.card-face` 未設定絕對定位原點，使圖案偏離按鈕。只在 `css/game.css` 的第三頁樣式補上 `inset: 0`；原 Game 02 CSS、JS 與圖片沒有修改。實測卡面與點擊區的 left／top／width／height 差距均小於 1px。
5. 原雪景位於固定最大寬的 `.shell` 中，並以負 bottom 偏移，頁尾又是不同藍色，造成矩形邊界及斷層。現在遊戲內容保留 `.shell`，雪景移到外層全寬 `.game-landscape`，以正常文件流接到頁尾，不用大負 margin。
6. 後、中層沿用既有 `assets/illustrations/wish/snow-ground.svg`，保持比例；前層用 CSS 奶油色弧面與細粒紋理，銜接相同 `#fff9eb` 頁尾。只用 `.games-body` 限定此頁的 footer／手機音樂區背景，保留所有原頁尾內容與功能。
7. 初次三個較寫實禮盒的頁面實例已移除，檔案保留。新素材使用真正 RGBA 的 `-removebg-preview.png`；最初 RGB 版本的棋盤格已烙在像素裡，沒有直接上站。
8. 左邊是較大的禮物堆與小熊，右邊兩個較小禮盒錯落重疊，局部受前景雪遮住底邊。裝飾在遊戲區下方，`pointer-events: none`，不會攔住操作或頁尾連結。
9. 遊戲入場只用淡入及小幅平移；禮物依序上升／淡入 800ms，只有右側兩件有不同週期的 2px 微幅擺動；雪地不持續移動。CSS 與 JS 均處理 `prefers-reduced-motion`，內容在 JS／IntersectionObserver 不支援時仍顯示。主區 `overflow-x: clip` 只限制進場動畫超出 viewport 的行程，不縮放遊戲或裁切遊戲內部。

## 素材來源與非破壞性取圖

實際新增於 `assets/illustrations/games/` 的透明原圖：

- `水彩聖誕禮物堆與小熊-removebg-preview.png`，612×408 RGBA。
- `手繪蠟筆風聖誕禮盒貼紙集-removebg-preview.png`，612×408 RGBA。

兩張均與 Downloads 來源逐 byte 相同。貼紙集沒有重繪，也沒有產生重新壓縮的衍生圖片；使用兩個獨立 CSS sprite 視窗，以同一張原圖分別顯示完整藍盒及奶油色禮盒：

| 圖案 | 原圖 x / y / width / height |
| --- | --- |
| 藍盒 | 8 / 158 / 181 / 129 |
| 奶油禮盒 | 172 / 5 / 153 / 150 |

兩個視窗四周邊界 alpha 都是 0；蝴蝶結及葉片完整，沒有切入鄰近禮物。保留單一原圖可避免多份素材與像素重採樣；未另外輸出獨立 PNG 檔。

原先複製的 `手作紙藝聖誕紅蝴蝶結禮盒-1.png`、`手作質感紅蝴蝶結星星禮盒-2.png`、`手繪質感聖誕禮物盒.png` 保留在同資料夾，但最終 HTML 不引用。

## 外站比例、鍵盤與更新

[Game 01 永久入口](https://en47.github.io/game1-flyingsanta/) 目前會自行轉到站內遊戲頁。iframe 的 src 保留永久入口，不綁內頁路徑、版本、commit 或時間戳。

依目前原作實際 CSS：

- 桌面場景為 1100:510；完整頁面包括 94px HUD、78px 控制列與 2px 邊框。容器以 `((W − 2) × 510/1100) + 174` 計算高度。
- iframe 自身寬度不超過 650px 時，原作切為 1.1:1 場景、88px HUD；完整高度為 `((W − 2) / 1.1) + 168`。
- 容器採 CSS container query，依 iframe 真正寬度切換，不將遊戲當成一張圖縮放或裁切。計分列、場景與底部控制鈕都保留。
- 點進遊戲後，方向鍵及空白鍵交給 iframe 自己處理；主站沒有全域鍵盤攔截。原作也支援 P、Enter 與畫面方向鈕。
- （已於 2026-10-31 移除）右下「無法載入？另開原作」連結。跨網域限制使主站無法可靠從 iframe 的 load 事件判斷內頁是否真的成功；沒有做假的成功／失敗判定。

外站更新並完成 GitHub Pages 部署後，重新整理主網站就會重新導覽 iframe 的同一永久入口，依一般瀏覽器／GitHub Pages 快取載入內容；只更新外站的遊戲功能或素材時，不需要主網站重新部署。沒有觀察到實際快取故障，因此沒有加 cache-busting、輪詢、排程 reload、Service Worker 或 gameplay 中 src 重寫。若遇舊版，先檢查外站部署與實際快取；不要預先用隨機 query 破壞快取。

容器高度目前依原作兩種版面配置；若未來外站連 HUD 高度或 responsive 斷點都重新設計，需再檢查容器。跨網域內頁未提供 postMessage 尺寸協定，主站無法自行讀取它的新 scrollHeight。

Game 02 繼續使用本機已整合的原作副本，原作連結仍為 `https://me666good.github.io/game2/`，沒有改成另一個網址。

## 實際驗收

透過 `tests/game-viewport.html` 設定真實 CSS viewport；只有外部預覽等比縮放以適應工作視窗，內頁與兩款遊戲接收到的都是指定寬度。量測依 ResizeObserver、事件及使用者切換尺寸更新，不定時重載 iframe。

| Viewport | 飛行 iframe W×H（四捨五入） | 配對區寬度 | 水平溢出 | 雪景寬度／與頁尾間距 |
| --- | --- | --- | --- | --- |
| 1920 | 1100×683 | 650 | 0px | 1920／0px |
| 1440 | 1100×683 | 650 | 0px | 1440／0px |
| 1024 | 976×626 | 586 | 0px | 1024／0px |
| 880 | 832×559 | 524 | 0px | 880／0px |
| 768 | 720×507 | 454 | 0px | 768／0px |
| 390 | 358×492 | 358 | 0px | 390／0px |

- Chrome 與 Safari 均實際載入外站 Game 01；Chrome 測開始、上下方向鍵及空白鍵暫停／繼續、碰撞結束與重玩。Safari 390px 測開始與暫停，看到完整 HUD、遊戲畫面、上下鈕及底部控制列。
- Safari 實測 Game 02 左側 START GAME 啟動第一關、快捷鈕隱藏、倒數、卡片翻開、翻牌次數增加、逾時與重玩。390px 已確認卡面與點擊區完全對齊；鍵盤使用 Safari 的 Option+Tab 在按鈕間移動可翻兩張牌。
- 1440／1920／768／390px 看過實際遊戲／裝飾畫面，1024／880px 也讀取了實際渲染量測。手機禮物位於遊戲下方、前景遮住少量底邊，沒有棋盤格矩形、雪景藍縫或頁尾擋住問題。
- `npm test` 的既有 23 組 smoke tests 與 2 項信封測試通過，包括 Game 02 全五關牌數／秒數／通關／重玩及原作素材雜湊。未宣稱人工在瀏覽器完成五關通關。
- 沒有用測試造訪 Wish 或寫入 Firestore；Firebase、Home／Intro／Wish、原圖片／模型、共用 CSS／JS、Game 02 原 CSS／JS 保持 byte-identical。沒有 commit、push 或 deploy。

## 本機查看與界線

1. 啟動 VS Code Live Server，開啟 `http://localhost:5500/game.html`。
2. 點遊戲內的開始，測 ↑／↓、空白鍵；外站需要網路，若無法嵌入可另開原作。
3. Game 02 點左側 START GAME 或原作 START，測翻牌與 Restart。
4. 開啟 `http://localhost:5500/tests/game-viewport.html` 可查看指定寬度、卡面對齊、溢出及雪景／頁尾間距。

尚未以實體手機觸控驗收、未在作業系統切換減少動態設定、未在 Firefox 驗收。兩個 sprite 保留在一張 PNG，並未輸出成獨立 PNG 檔。沒有尚未提供的素材佔位，也沒有替換角色或 Firebase 架構。
