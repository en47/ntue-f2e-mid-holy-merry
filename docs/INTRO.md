# Intro — 紙雕故事書與聖誕地圖

頁面由兩段組成，自由捲動。不用 scroll-snap：吸附會把頁面拉回，書下方的按鈕按不到。進頁時雪丘、松樹、吊飾依序以立體書方式立起，書最後登場。翻開書時只做一次平滑捲動，把書和按鈕一起帶進畫面；手機的控制列固定在底部。

1. **故事書：** 書封置中放在雪地上。點擊後書滑到中線、封面以書脊為軸翻開，封面背面就是左頁；可合上。
2. **聖誕地圖：** 信紙與捲軸先出現，展開後才看得到地圖、雪橇航線與國家捷徑。

## 檔案分工

- `js/components/intro-book.js`：翻開、翻頁、合上與紙雕收合的流程，不含任何圖。
- `js/components/intro-art.js`：書封、書板、內頁角落、按鈕底圖、雪地背景。
- `js/components/intro-scenes.js`：三章紙雕卡片；`js/data/intro-stories.js` 只放配置座標。
- `js/components/intro-map.js`、`intro-scroll.js`：地圖、雪橇航線、捲軸。
- `js/components/intro-harbor.js`：地圖後方的紙雕海港，快捲到才生成圖層，離開畫面暫停。風由左向右、光源在左上；船與浮冰的吃水線對齊前一層浪。
- `js/components/intro-postcard-art.js`：六張明信片的互動紙雕；文案與抽獎內容在 `js/data/intro-cultures.js`。
- `js/data/intro-map-shapes.js`：由 `scripts/build-intro-map.py` 描 `christmas_map.jpg` 產生，需要 opencv，不要手改。

每片紙只轉成圖片一次。紙片各自帶 `perspective()` 往後倒下，不共用 3D 空間：往後倒只會縮小，不會超出書頁，也不會互相穿過；前後順序交給 z-index。

`assets/illustrations/intro/` 的原始 PNG 全部保留，頁面已不載入，`docs/INTRO-ASSETS.json` 的雜湊檢查照舊。

---

以下是改版前的紀錄。


本次只修正既有 Intro。入口仍為 `intro.html`，沒有增加框架、改用 Demo iframe、發布或更動其他三頁。Header、Footer、共用 CSS、遊戲、Firebase、模型與原創圖檔保持原樣。

## 本次原因與修正

原書頁左／右為 43%／57%，翻轉的右頁無法在中央書脊完整對齊左頁。翻頁正反面只有裝飾符號，並在轉到一半時直接替換章節，因此看起來像空白遮片及內容切換。收合只等待 540ms，但紙雕的 transition 本身為 620ms，另有分層延遲；尚未折完便進入下一階段。書本上的 isolation 也不適合保留該層 3D 翻頁。

- 開場改為小標、標題「聖誕節的故事」與指定短句，移除額外跳轉按鈕及大間距。
- 三章使用使用者提供的完整三段繁體中文故事。文字維持 16px，沒有省略、固定小捲軸或隱藏內容。
- 書頁改為等寬 50%／50%，書脊與翻頁鉸鏈均在中央。三份文字共用同一個 grid cell，隱藏章節仍參與尺寸計算，避免換章改變書本高度。
- 原百分比紙雕座標、前後景錯位、建築底部 18% 基準線與 PNG alpha-bounds 資料保持不變。各章場景共用同一個舞台。SVG 只調整原圖顯示的 viewBox，不重畫或改檔。
- 每一片硬紙以底邊為鉸鏈，從 rotateX(-84deg) 立起。遠景終點為 -9deg，其餘 -3deg；沒有使用 scaleY 或壓縮圖片。前景先收、背景先展，各自保留 translateZ 深度與原比例。
- 使用 Web Animations API 及 Animation.finished：所有收合完成 → 實體紙頁轉動 → 新場景逐層展開。前後翻頁都把實際故事／已收合場景放入正反頁，不再使用空白星號遮片或固定中途換頁計時。
- 書頁雙面使用 backface-visibility、中央 transform-origin、兩面間距及窄紙邊。獨立場景有自己的 perspective，避免場景的 Z 深度穿出翻頁。動畫中的紙頁陰影使用 box-shadow，不用會扁平化 3D 子面的 filter。
- 手機改為上文下圖，翻頁也使用含故事和場景的完整紙面；不把桌機整本縮成小字。
- 操作鎖阻止重複翻頁。減少動態設定直接顯示最終狀態；視窗隱藏或尺寸變更時安全完成當前動畫；離頁取消動畫與事件。金幣只有第二章互動時短暫出現，離頁／翻章會清除。

## 捲動與明信片

Intro 的根捲軸使用 y proximity，故事書及地圖各為一個 start 目標。Header 是非固定 Header：以 ResizeObserver 讀取其實際高度，套入第一節的高度及 scroll-margin，避免載入即把 Header 捲走。沒有新增 wheel／touch 攔截。內容較長時自然增加高度；700px 以下及減少動態設定停用吸附。

原地圖仍使用 `assets/illustrations/intro/christmas_map.jpg`，六點座標不變：

| 國家 | 原圖 1728×947 座標 | 互動 |
| --- | --- | --- |
| 冰島 | 132,276 | 鞋子裡隨機出現糖果、小禮物或馬鈴薯 |
| 台灣 | 704,459 | 拆出小熊或搞怪長襪 |
| 日本 | 783,399 | 蛋糕切片移出 |
| 紐西蘭 | 883,756 | 紅色花朵綻放 |
| 加拿大 | 1120,287 | 展開回信及非加拿大獨有的小精靈彩蛋 |
| 巴西 | 1401,664 | 點亮樹燈及湖面倒影 |

明信片開啟前先鎖住背景捲動並停用吸附；關閉後恢復，焦點回到原入口時使用 preventScroll。保留 Escape、背景點擊、上下關閉鈕及小螢幕明信片內捲動。

## 修改檔案

- `intro.html`
- `css/intro.css`
- `js/intro.js`
- `js/components/intro-book.js`
- `js/components/intro-postcards.js`
- `js/data/intro-stories.js`
- `js/data/intro-cultures.js`
- `tests/intro.test.mjs`
- `tests/intro-preview.html`
- 本文件。

沒有更動原圖、`intro-image-bounds.js`、六個標記座標、共用 Header／Footer 或其他三頁。

## 已執行驗證

以 Node 22 執行：

```sh
node --experimental-vm-modules --test tests/intro.test.mjs
node --experimental-vm-modules tests/smoke.mjs
```

Intro 4 項測試及既有 23 組 smoke checks 通過。涵蓋原圖 SHA、三章完整段落及地面／錯位規則、必須等待最後一片收合才翻頁、正反面確有內容、實際翻頁完成才提交章節、1→2→3→2→1、快速操作鎖、重播、金幣及動畫清理、背景中斷、減少動態，以及六個明信片的開關／結果／焦點回復。這些是 DOM 替身下的流程測試，不等同實際瀏覽器視覺驗收。

### 實際瀏覽器驗收

Chrome 已實際載入正式 Intro，透過 `tests/intro-preview.html` 的同源 iframe 設定精確 CSS viewport。外部預覽只等比縮小以放進驗收視窗，不改動正式頁面的字級或座標。四個尺寸都目視檢查過：

| viewport | 書本外框 | 紙雕舞台 | 首屏翻頁控制底部 | 水平溢出 |
| --- | --- | --- | --- | --- |
| 1440×900 | 1100×512 | 510×423 | 824px | 無 |
| 1366×768 | 1100×512 | 510×423 | 763px | 無 |
| 768×1024 | 700×570 | 322×473 | 873px | 無 |
| 390×844 | 354×912 | 323×284 | 1237px，正常捲動可達 | 無 |

短筆電只壓縮開場區及控制列間距，保留完整書本、16px 內文及原插畫比例。平板明確限制書本 width:100% / min-width:0，並移除會鎖住高度的 aspect-ratio，由文字決定所需高度，避免書本撐寬及文字超出紙面。手機不強制一屏塞完整本書，停用吸附並取消地圖節的整屏最小高度，避免頁尾前出現大量空白。

實際操作及觀察：

- 桌機三章 1→2→3→2→1、連點下一章、紙雕重播。章節及場景尺寸穩定，建築基準線一致；家庭面孔、角色及前景可見，第三章沒有加回遠景村莊。
- 使用僅驗收頁可選的慢速模式檢視翻轉中間狀態，確認中央鉸鏈、非鏡像的故事背面與實際轉動紙頁。該選項只調低驗收頁中的 animation playbackRate，不改正式網站速度。
- 六個地圖紅點皆開啟正確國家，逐一點插畫操作鞋子、禮物、切片、開花、回信與燈光倒影；加拿大彩蛋明確註明不是加拿大獨有傳統。
- 地圖明信片開關前後的背景 scrollY 保持不變（筆電 792px、手機 820px），開啟時 snap:none，關閉後恢復原設定。
- 原生 Page Down 從書本進入地圖、Page Up 回到書本；較高內容可以繼續捲動，不以 JavaScript 攔截 wheel。
- 手機三章維持 354×912 書本與 323×284 舞台；第二章金幣按鈕換列，位於書本下方，不影響舞台大小。可捲到所有控制、地圖及原 Footer。
- 手機加拿大長回信可以在 dialog 內捲到小精靈及底部收起鈕，關閉後背景位置不跳動。頂端關閉鈕保持可見。
- 最終載入的 Chrome Console 顯示 0 messages，沒有 JavaScript 或素材載入錯誤紀錄。

限制：四尺寸為桌面 Chrome 的實際 CSS viewport，並非實體手機驗收。滑鼠滾輪注入曾被工具中斷，因此完整捲動路徑以原生 Page Down／Page Up 驗證；未宣稱實體觸控手勢已通過。減少動態及背景中斷另由程式測試確認，沒有更改使用者的作業系統設定。尚未在 Safari、Firefox 或 GitHub Pages 部署後逐一驗收。

驗收頁入口：`tests/intro-preview.html?viewport=desktop`、`?viewport=laptop`、`?viewport=tablet`、`?viewport=mobile`；加上 `&section=map` 可檢視地圖，加上 `&slow=1` 可慢速檢視紙頁。
