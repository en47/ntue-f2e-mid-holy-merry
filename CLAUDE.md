# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本專案文件、UI 文案與測試名稱皆為繁體中文；請沿用相同語言撰寫新文案與文件。

## 專案性質

原生 HTML / CSS / ES modules 的聖誕主題網站（Home / Intro / Game / Wish 四頁＋`admin.html`），**沒有建置步驟與打包工具**。Three.js、model-viewer 與兩個外部遊戲原作都以原樣副本放在 `vendor/`。Node.js 只用於測試，不是執行網站的前提。

## 常用指令

```sh
# 預覽（必須走 HTTP，ES modules 無法以 file:// 載入）
python3 -m http.server 5500 --bind 127.0.0.1    # 或 VS Code Live Server 開 index.html

npm ci                      # 僅測試需要（Node.js 22+）
npm test                    # tests/smoke.mjs ＋ node:test（wish-cloud / elf / wish-interaction / intro）
npm run test:firebase       # Firestore 規則與整合測試，需 Java 21 與 firebase-tools emulator

# 單獨執行
node --experimental-vm-modules tests/smoke.mjs                 # 全部通過才結束；本身無法篩選單一組
node --experimental-vm-modules --test tests/intro.test.mjs     # 需要這個旗標，否則會出現 SourceTextModule 錯誤
node --test --test-name-pattern 'waypoints' tests/elf.test.mjs  # node:test 檔可依名稱過濾（名稱為英文）
```

`tests/*.html`（`game-viewport.html`、`wish-drag.html`、`elf-clips-preview.html` …）是人工瀏覽器量測／預覽台，要透過上述 HTTP 伺服器開啟，不在 `npm test` 內。

## 架構重點

### 頁面與進入點
每頁自行列出 `<link>` / `<script type="module">`，沒有共用 layout：

| 頁面 | 進入模組 |
| --- | --- |
| `index.html` | `js/shared.js`、`js/home-scene.js`、`js/home.js`、`js/santa-model.js` |
| `intro.html` | `js/shared.js`、`js/intro.js` |
| `game.html` | `js/shared.js`、`js/game.js`、`js/game-hero.js` |
| `wish.html` | `js/shared.js`、`js/wish.js` |
| `games/christmas-matching.html` | `js/games/game2-embed.js`（iframe 內獨立文件） |

`js/shared.js` 在四頁都載入（導覽選單、資訊對話框、音樂面板），不得啟動任何單頁的遊戲或計時器。需要 3D 的頁面在 HTML 內放 `<script type="importmap">` 把 `three` 指向 `./vendor/three/build/three.module.js`。

導覽與 Footer 標記在四個 HTML 各有一份；修改時必須同步四頁，`tests/smoke.mjs` 第一組會檢查四個互連連結、唯一一個 `aria-current="page"`、所有本機 `src`/`href` 真的存在、以及頁內 ID 不重複。

改動 CSS / JS 後執行 `node scripts/stamp-modules.mjs`：它依檔案內容更新 HTML 的 `?v=` 與 importmap（內部模組沒有寫在 HTML，版本只能靠 importmap 傳下去），`npm test` 會在忘記執行時失敗。

### 目錄分工
- `js/components/` — DOM 與 Three.js 行為單元（角色場景、精靈、信封、世界地圖、Intro 故事書）。
- `js/components/paper-art.js`、`paper-props.js` — SVG 紙雕工法與道具。每片紙只轉成圖片一次，會動的部位拆成獨立圖層以 CSS 移動，不要動畫 SVG 內部（濾鏡重算成本很高）。
- `js/data/` — 純資料表。多數由 `scripts/` 的 `.mjs` / `.py` 產生（`title-glyphs.js`、`elf-actions.json`、`elf-ground.js`、`envelope-shapes.js`、`wish-tree-anchors.js`、`storybook-masks`）；**不要手改產出檔**，改腳本後重新產生。
- `js/services/` — 儲存與 Firebase。
- `js/games/` — 配對遊戲適配層；`js/games/matching.js` 是保留的舊單關原型，已不載入。
- `css/tokens.css` 設計變數 → `css/shared.css` 導覽／按鈕／Footer／音樂 → 各頁 CSS。

### core 注入模式
`firebase-client.js` / `wish-repository.js` 只是五行的薄包裝，所有邏輯在 `*-core.js`，由外部注入 `sdk` 與 `client`，讓 Node 測試能換成 emulator 或替身。新增 Firebase 相關邏輯請放進 `-core` 檔，保持包裝層無邏輯。`js/services/firebase-sdk.js` 是唯一的 CDN import 處，所有 Firebase 模組固定同一版本號。

### Wish 資料流
- 訪客＝匿名登入；`users/{uid}/wishes/{id}` 存私人原件，核准後的公開副本在 `publicWishes/{id}`。管理員＝Email/Password ＋ `admin: true` custom claim（session persistence）。
- `firestore.rules` 會強制查詢上限（`bounded()`）與公開副本必須對應私人原件（`matchesSource()`）；改資料形狀時規則與 `tests/firestore.rules.test.mjs` 要同步。
- `js/services/wish-selection.js` 決定樹上顯示哪 10 封（自己最新一封＋9 封他人已核准）。
- `js/services/wish-storage.js` 的 `holy-merry:wishes:v1` 是**舊版本機收藏**，僅讀取顯示，不自動上傳。
- `js/config/firebase-config.js` 是公開的 Web App 設定；`tools/firebase-admin/*.mjs` 只用 ADC，拒絕 emulator 環境變數，絕不可被網頁 import。

### 遊戲整合（iframe 隔離）
`game.html` 以兩個 iframe 載入**本機獨立文件**：`vendor/game1-frameless/index.html` 與 `games/christmas-matching.html`。`js/game.js` 只量測外層文字與高度、設定 CSS 變數（例如 `--fly-reserved-height`，依 `vendor/game1-frameless/README.txt` 的 `寬度 × 510/1100 + 142px`），**不要改寫或重新載入 iframe 的 `src`**。配對遊戲的 DOM 寫在 `games/christmas-matching.html`、圖片直接引用 `vendor/game2/images/`，邏輯在 `js/games/game2-matching.js`，對外發出 `matching:level-start` / `pair-match` / `level-complete` / `timeout` / `complete` 事件供擴充，不要改動原作副本或配對判定。

### 素材完整性清單
`docs/GAME2-UPSTREAM.json`、`docs/STORYBOOK-ASSETS.json`、`docs/STORYBOOK-CLEAN-ASSETS.json`、`docs/WISH-ASSETS.json`、`vendor/three/UPSTREAM.json`、`assets/models/*.json` 都記錄逐檔 SHA-256，`tests/smoke.mjs` 會逐一比對。動到任何 `vendor/` 副本、PNG 或 GLB 都會讓測試失敗；若是刻意更換素材，必須同時更新對應清單的雜湊。測試也會用 `vendor/three` 的 GLTFLoader 真的解析 GLB（見 `tests/helpers/elf-model.mjs`）。

## 既有慣例

- 漸進增強：JS 或 IntersectionObserver 失效時內容仍須可見（見 `js/game.js` 的 `revealAll()`）。
- 所有動畫遵守 `prefers-reduced-motion`；優先使用 opacity / transform。
- 每個會持有資源的模組都處理 bfcache：`pagehide` 釋放（計時器、observer、Three.js geometry/material/texture dispose），`pageshow` 且 `event.persisted` 時重建或維持暫停。
- 使用者內容一律 `textContent`，不用 `innerHTML`。
- 較新的模組（`wish.js`、`services/`、測試）刻意採用緊湊的單行寫法；請比照鄰近檔案的密度與命名，不要改寫既有格式。
- 新功能通常附一份 `docs/<FEATURE>.md` 加一份驗證 JSON，並在 `TESTING.md` 追加當日紀錄；沿用這個習慣。
- `tests/smoke.mjs` 會走遍 `js/` 下所有 `.js` 做語法檢查，新模組自動納入。
