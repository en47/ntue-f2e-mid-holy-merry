# Holy Merry!

Holy Moly! It's Christmas! 一個紙雕繪本風格的聖誕主題網站，有 3D 角色、互動故事書、兩款小遊戲和可以掛上聖誕樹的願望信。

**線上網站：** https://en47.github.io/ntue-f2e-mid-holy-merry/

原生 HTML、CSS、ES modules 製作，沒有框架，也不需要建置。Node.js 只用於測試。

## 頁面

| 頁面 | 內容 |
| --- | --- |
| Home（`index.html`） | 聖誕倒數翻頁日曆、可互動的 3D 聖誕老人與麋鹿，點角色會收到一封小信 |
| Intro（`intro.html`） | 會翻開的立體故事書、世界地圖、捲軸、明信片與海港 |
| Game（`game.html`） | Santa Flying 雪橇閃避遊戲、Christmas Matching 五關配對遊戲 |
| Wish（`wish.html`） | 在夜晚雪地小屋寫信，摺信投進聖誕襪，信封會掛上 3D 聖誕樹 |
| Admin（`admin.html`） | 管理員審核願望 |

## 全站功能

- **Loading：** 四頁各有主題動畫：首頁牛頓擺、Intro 翻書、Game 摩天輪、Wish 信封。全部內嵌 SVG，不必等圖片下載。
- **導覽：** 聖誕燈串上的紙吊牌，滑過會擺動，換頁時亮光沿燈串跑到新分頁。
- **背景音樂：** 五首聖誕歌可選，換頁後接著播放。預設關閉，由訪客自己選歌。
- **頁尾：** 每頁一個互動主角：雪橇、地球儀、驚喜禮物盒、許願流星。
- **無障礙：** 支援鍵盤操作與 `prefers-reduced-motion`；JavaScript 失效時內容與導覽仍可使用。

## 願望如何運作

1. 訪客以匿名身分登入，不需要帳號。
2. 信預設是私人的，只有本人和管理員看得到，存在 Firebase Firestore。
3. 勾選同意公開並通過管理員審核後，稱呼和內容才會公開掛上聖誕樹。
4. 樹上最多 10 封：訪客自己最新的一封，加上其他已核准的願望。

同一個瀏覽器重新整理後信還在；清除網站資料或換瀏覽器就找不回原本的信。

## 本機預覽

網站使用 ES modules，必須透過 HTTP 開啟，不能用 `file://`。

```sh
python3 -m http.server 5500 --bind 127.0.0.1
```

也可以用 VS Code 的 Live Server 開啟 `index.html`。

Wish 和 Admin 在 `localhost`、`127.0.0.1` 上會自動改連本機模擬器，不會碰到正式資料，所以要先啟動模擬器：

```sh
npx firebase emulators:start --only auth,firestore --project demo-holy-merry
npm run admin:local   # 另開終端機，建立本機測試管理員
```

模擬器關閉後，裡面的資料和測試管理員都會消失。

## 測試

需要 Node.js 22+；Firebase 測試另需 Java 21。

```sh
npm ci
npm test               # 語法、素材完整性、模型、遊戲與互動邏輯
npm run test:firebase  # Firestore 規則與整合測試
```

## 部署

GitHub Pages 從 `main` 分支根目錄發布，push 後約 1 分鐘生效。Firestore 規則與索引由 Firebase 另外部署，不會跟著 push 更新；步驟見 [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)。

改動 CSS 或 JS 後要執行 `node scripts/stamp-modules.mjs` 更新版本號，否則 `npm test` 會失敗。

## 專案結構

| 路徑 | 內容 |
| --- | --- |
| `js/components/` | 頁面元件與 Three.js 場景 |
| `js/data/` | 純資料表，多數由 `scripts/` 產生 |
| `js/services/` | Firebase 與儲存 |
| `css/` | `tokens.css` 設計變數、`shared.css` 共用樣式、各頁樣式 |
| `assets/` | 模型、音樂、字型與插畫 |
| `vendor/` | Three.js 與兩款遊戲原作的原樣副本 |
| `scripts/` | 素材產生與檢查工具 |
| `tests/` | 自動測試與人工預覽頁 |
| `docs/` | 各功能的設計記錄與素材清單 |

開發規範見 [CLAUDE.md](CLAUDE.md)，歷次修改見 [REPORT.md](REPORT.md)，驗證紀錄見 [TESTING.md](TESTING.md)。

## 素材授權

- **插畫：** 作者手繪與 AI 生成。
- **3D 模型：** 作者使用 Tripo 製作。
- **音樂：** 來自 Pixabay，採 Pixabay Content License。
- **字型：** 授權檔在 `assets/fonts/`。
- **遊戲：** 配對遊戲來自 [me666good/game2](https://github.com/me666good/game2)，來源記錄在 `docs/GAME2-UPSTREAM.json`。
