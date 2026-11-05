# Holy Merry!

Holy Moly! It's Christmas! 一個紙雕繪本風格的聖誕主題網站，有 3D 角色、互動故事書、兩款小遊戲和可以掛上聖誕樹的願望信。

**線上網站：** https://en47.github.io/ntue-f2e-mid-holy-merry/

原生 HTML、CSS、ES modules 製作，沒有框架，也不需要建置。Node.js 只用於測試。

## 頁面

| 頁面 | 內容 |
| --- | --- |
| Home（`index.html`） | 聖誕倒數翻頁日曆（點一下撒紙片）、可互動的 3D 聖誕老人與麋鹿，點角色會收到一封小信；點冰湖會冒出打太極的雪人（手機只有漣漪） |
| Intro（`intro.html`） | 三章立體故事書（電腦左右翻、手機上下翻，窄視窗用滑鼠時有翻頁按鈕）；展開捲軸地圖，六國文化明信片（冰島、台灣、日本、紐西蘭、加拿大、巴西），點插圖有小互動，例如台灣的交換禮物抽獎 |
| Game（`game.html`） | 開頭是雪地遊樂園：點熱氣球會載著不同角色升起、點摩天輪會加速，雪橇雲霄飛車自動繞場（小螢幕俯衝後改走平路）。下方是 Santa Flying 雪橇閃避與收集禮物遊戲、Christmas Matching 五關配對遊戲 |
| Wish（`wish.html`） | 在夜晚雪地小屋寫信，摺信投進聖誕襪，信封會掛上 3D 聖誕樹；可拖曳旋轉聖誕樹、和小精靈互動，點月亮會劃過流星、點小屋的門會有訪客開門。電腦全螢幕時，前景雪地可以留下腳印、按住拖曳畫畫 |
| Admin（`admin.html`） | 管理員審核願望 |

## 全站功能

- **Loading：** 四頁各有主題動畫：首頁牛頓擺、Intro 翻書、Game 摩天輪、Wish 信封。全部內嵌 SVG，不必等圖片下載。
- **導覽：** 聖誕燈串上的紙吊牌，滑過會擺動，換頁時亮光沿燈串跑到新分頁。
- **背景音樂：** 五首聖誕歌可選。每次新打開網站都是關閉的，由訪客自己選歌；同一個分頁換頁會接著播放，音量與播放方式會記住。
- **頁尾：** 每頁一個互動主角：雪橇、地球儀、驚喜禮物盒、許願流星。頁尾的 Site Accessibility、FAQ（幽默問答）與 Contact us（芬蘭聖誕老人郵局地址）以紙雕信紙彈窗呈現，點信紙外也能關閉。
- **回到頂端：** 長頁面捲到底時，音樂按鈕上方會出現拐杖糖造型的按鈕。
- **無障礙：** 支援鍵盤操作與 `prefers-reduced-motion`；JavaScript 失效時內容與導覽仍可使用。

## 設計規格

- **字型 3 種：** 系統黑體（內文，Mac 為 PingFang TC、Windows 為微軟正黑體）、Mountains of Christmas（英文標題）、霞鶩文楷 TC（信紙手寫字）。
- **字級 3 級：** 標題 32px、內文 16px、小字 13px，定義在 `css/tokens.css`。
- **色彩：** 主色為紅、綠、金，天空藍與奶油白作為背景。

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

## 新增管理員

管理員是 Email／密碼帳號加上 `admin: true` 權限，不需要改程式或安全規則。

1. 在 Firebase Console 建立 Email／密碼帳號，取得 UID（也可以讓對方登入 `admin.html`，未授權的帳號會顯示自己的 UID）。
2. 以臨時權限執行 `tools/firebase-admin/set-admin-claim.mjs`，先試跑再加 `--apply`，完成後移除臨時權限。

完整步驟與注意事項見 [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md) 與 [docs/FIREBASE-ADMIN-VERIFICATION.md](docs/FIREBASE-ADMIN-VERIFICATION.md)。

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
| `images/` | 插畫與 SVG |
| `assets/` | 模型、音樂與字型 |
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
