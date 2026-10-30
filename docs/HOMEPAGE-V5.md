# Holy Merry! 首頁 V5 精修

2026-10-28。延續現有 V4 紙雕繪本，只改首頁及其直接相依檔案。其他三頁、共用樣式／導覽、遊戲、所有原始 PNG 與 GLB 均與本次修改前逐檔 SHA-256 一致，沒有刪除既有檔案。

## 檔案清單

| 檔案 | 變更 |
| --- | --- |
| `index.html` | 原生角色按鈕、移除名稱及暫停／回正控制列、改用兩個暫時性信紙按鈕、讀屏提示 |
| `css/home.css` | 原標題縮小上移、六張 PNG 遮罩、信紙滑入／展紙、紙雕 CTA、手機留白與減少動態 |
| `js/home.js` | 接收直接角色點擊、隨機對話、五秒收起、互斥、Escape／焦點恢復及清理 |
| `js/components/characters-scene.js` | 原生 click／鍵盤操作，移除舊控制事件；保留拖曳與直向捲動分流、單 Renderer 與資源釋放 |
| `js/components/character-animation.js` | 只調整麋鹿擺幅、點頭與前腳支撐補償；Santa 邏輯未改 |
| `assets/illustrations/storybook/masks/*.svg` | 新增六份對位 alpha 遮罩 |
| `assets/illustrations/storybook/christmas-letter.svg` | 新增輕量原生 SVG 信紙，奶油紙面、紙紋、冬青、小信封與手切邊 |
| `assets/illustrations/storybook/paper-tab.svg` | 新增小型紙標籤 CTA 背景 |
| `docs/STORYBOOK-MASKS.json` | 遮罩座標、來源尺寸與 fitting 資料 |
| `scripts/build-storybook-masks.py` | 可重建 SVG 遮罩，不讀寫原 PNG 像素 |
| `tests/smoke.mjs` | 更新現行互動、骨架支撐及遮罩資源驗證，共 17 組 |
| `README.md`、`TESTING.md`、`docs/HOMEPAGE-STORYBOOK.md`、本文 | 現行說明、驗證及歷史版本標記 |

## 原畫的裁切檢查與修正

七張 PNG 均有透明通道。主要殘條存在於原圖像素，並非紙雕開場動畫產生；不使用新增裝飾遮住它們，也沒有重畫或覆寫 PNG。SVG 白色範圍保留原圖 alpha，黑／透明區域排除相鄰素材殘片，原有紙邊、筆觸與紙紋保留。

| 原 PNG | 處理 |
| --- | --- |
| `01_mountains.png` | 排除底部多餘碎片及右邊孤立的截斷雲片 |
| `02_village.png` | 沿樹頂與教堂輪廓分區，排除頂部來自前一列的水平殘條 |
| `03_pine_trees.png` | 排除頂部相鄰素材橫條，保留四棵樹現有輪廓 |
| `04_foreground_snow.png` | 排除左上及左邊相鄰雪景碎片，保留雪丘、圍籬、漿果與松樹 |
| `06_clouds.png` | 排除左下孤立碎片 |
| `07_small_snowbanks.png` | 排除底部多餘殘片，保留雪丘輪廓 |
| `05_merry_christmas.png` | 無需遮罩，繼續使用原標題圖 |

山景／村落／前景是 `object-fit: fill`，對應遮罩 `preserveAspectRatio="none"`；松樹是 contain／底部對齊，遮罩用 `xMidYMax meet`；雲是 contain／置中，遮罩用 `xMidYMid meet`。這項對位在瀏覽器跨尺寸檢查後校準，避免遮罩與原圖的空白區比例不同而重新露出殘條。

**來源限制：** `03_pine_trees.png` 最大松樹的頂尖、`02_village.png` 教堂尖頂在原檔上邊界已缺失；山景底邊及村落底邊亦混有與主畫相接／重疊的相鄰圖案，部分松樹尖角仍可能辨識出來。遮罩無法恢復已遺失或被覆蓋的山景／雪景像素。為避免削掉合法紙邊或生成替代插畫，這些相接部分保守保留；完整修復需要未裁切的原始分層畫稿或重新匯出的透明素材。不能宣稱所有原圖缺陷均已還原。

## 標題、舞步與 UI

標題保留原字圖和輕搖動畫。桌面寬度為舞台的 34%、最多 390px，移至上方天空；768px 使用 46%／最多 370px，390px 使用 76%／最多 320px。進場角度亦收斂，避免過場碰到倒數。角色尺寸沒有為了標題而縮小。

麋鹿沿用 `assets/models/reindeer.glb` 的真實四足骨架與四秒自訂循環；不播放 GLB 內的原走路動畫。`Spine_1` 左右擺幅從 ±0.014rad 提升至 ±0.075rad（約 ±4.3°），頭部點動從 0.035rad 提升至 0.06rad，保留交替小抬前腿及最後小跳。以靜止姿勢的前腳支撐點計算上身平移補償，減少腳底穿地及水平滑動；後腿在抬前腿階段固定。沒有變更骨長、縮放、網格、材質或原模型位置。

Santa 繼續載入 `assets/models/santa-dance.glb`，原 `dance_02` 的 1.000–4.000 秒，三秒循環。原每軌插值、端點取樣及先前已說明的 0.18 秒端點姿勢混合均保持不變；沒有播放區間外動作或新增轉身。

點 Santa／麋鹿或用原生按鈕 Enter／Space 開信。兩者分別從左／右滑入，再以輕微 rotateX 展開紙面；隨機讀取原有對話陣列，避免連續重複。一次一封，約五秒後自然收起，可點信紙或 Escape 關閉。手機信紙置中並移到視窗底部 5svh，避免遮臉；短暫遮住下方 CTA 時可直接收信。沒有常駐大卡片或角色名稱。

可見角色控制列已移除；左右方向鍵仍可旋轉，P 暫停／繼續，拖曳後緩慢回正。P 使用實體 KeyP 相容中文輸入法，避開 Cmd／Ctrl／Alt 組合，不攔截瀏覽器列印。手機保留 `touch-action: pan-y`。角色及信紙具 accessible name、expanded 狀態、焦點支援及 live region；減少動態模式停用過場、預設暫停角色。

CTA 只更換紙標籤外觀，文字與 `intro.html`／`wish.html` 目的地不變。保留原有紙雕鉸鏈展開、前景蓋腳尖、倒數、音樂與導覽；沒有新增框架、Renderer 或動畫迴圈。

## 驗證與未完成項目

17 組程式測試全部通過，含真實 GLB／骨架、Santa 原動畫逐軌對照、麋鹿支撐點、互動生命週期、遮罩資源及原網站回歸。其他三頁及所有原始資源雜湊保持一致。

Chrome 已實際檢視 1440×900、768×900、390×900：完成紙雕開場後的主要水平殘條已移除，標題避開角色及倒數、角色完整、CTA 可見；左右開信與自動收信正常，最後手機信紙位置與內距亦經畫面檢查。Console 無可見網站錯誤／警告。詳見 `TESTING.md`。

尚需未裁切原畫以完整修復上述來源缺失；尚未在實體手機、Safari／Firefox 或低階裝置長時間測試。麋鹿支撐補償針對現有骨架，並非通用 IK；未來換骨架需重新校準。Santa 原片段首尾差異仍存在，延續既有端點混合，沒有擅自換舞步。
