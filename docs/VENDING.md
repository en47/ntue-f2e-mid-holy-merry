# 第五頁 Christmas Vending

雪夜裡的聖誕販賣機（3D）、右邊小攤子吊著的降臨曆，和取出小東西後打開的紙雕著色桌（2026-11-23）。這一頁跟 Santa 頁的劇情沒有連結。導覽順序是 Home、Intro、Game、Wish、Vending、Santa。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `vending.html` | 頁面：標題、夜景、3D 舞台、降臨曆攤子、著色桌（平常藏著） |
| `js/vending.js` | 進入點：掛上夜景、販賣機、降臨曆、著色桌；從取物口拿出東西，著色桌就從取物口展開，回販賣機時收回去；bfcache 離開時釋放、回來時重建 |
| `js/components/vending-scene.js` | 紙雕夜景：夜空、紙月亮與星星、遠山與山下的小村、平平一整片雪地、兩邊的松樹、路燈和它照在雪上的暖光、前景雪堆、少量飄雪 |
| `js/components/vending-machine.js` | Three.js 販賣機：模型是 `assets/models/vending-*-web.glb`（見 `docs/VENDING-MODELS.md`），按鈕與取物口各疊一個 HTML 熱區，運作動畫與音效 |
| `js/components/vending-advent.js` | 降臨曆攤子：紙雕小屋頂與橫木、用繩子吊著的曆、24 扇小門、開門後的小卡 |
| `js/components/vending-coloring.js` | 著色桌：四張線稿、蠟筆盒、復原／重做／重設／完成作品／存成圖片／回到販賣機 |
| `js/data/vending.js` | 文字：四樣東西、蠟筆顏色、降臨曆 24 天的一句話與小圖 |
| `css/vending.css` | 版面與動畫（只動 transform 和 opacity，減少動態時都不動） |

另外 `cabin-paper.js` 多了這一頁的紙張對照（按鈕、蠟筆盒、降臨曆的門與小卡），`site-loader.js` 多一個 vending 主題，`page-foreground.js` 多一組夜晚的頁尾地面（路燈、禮物），標題字形 `christmas-vending` 由 `scripts/build-title-glyphs.mjs` 產生。

## 販賣機

- 一進頁面就能按，不用投幣。按下去：按鈕往內縮 → 機身輕輕震一下、喀一聲 → 那一格的東西往前倒、掉進取物口、彈一下 → 在取物口裡每 2.4 秒輕跳一下，提示可以拿出來。
- 四顆按鈕平常微微發亮。3D 模型和按鈕分開：每顆按鈕是自己的 GLB（`vending-*-button-web.glb`），上面疊一個透明的 HTML 按鈕接收滑鼠、觸控和鍵盤。
- 掉下來的只是代表物，不在 3D 模型上著色。
- 著色桌開著時，販賣機停止繪製（`hold`）。
- WebGL 或模型載入失敗時，改成直接列出四個選項。

## 降臨曆

- 不照真實日期，24 扇門都能開（前五頁沒有故事日期）。開過的門記在這台瀏覽器（localStorage `holy-merry:vending:advent`）；開過的門再點一次，會再看一次小卡。
- 曆用兩條繩子掛在橫木上，平常只有 ±0.7° 的輕晃；開門時在繩子上彈一下。晃和彈分在兩層，兩個動作不會互相打架。
- 門打開露出小圖（`cabin-clue-art.js` 的 `adventPicture`），接著出現小卡：日期、那一天的紙雕小場景（沿用 Santa 頁原本為降臨小屋做的 `cabin-advent-scenes.js`，點一下播下一段）和一句話。原本句子裡提到 N.、K.、H.、E.、O. 的都改寫了，不會透露 Santa 頁的秘密。

## 著色桌

- 外觀：木頭桌面、用紙膠帶貼著的厚紙、綠色蠟筆盒、紙籤按鈕；紙張和按鈕都由 `cabin-paper.js` 依大小畫（跟 Santa 頁同一套紙）。
- 線稿：四張（薑餅人、雪人、聖誕樹、聖誕襪），每個可以塗色的區塊是一個 path。線條經過 SVG 位移濾鏡（`feTurbulence`＋`feDisplacementMap`）微微抖動，再疊一條細一點、偏一點的線，所以粗細不會完全一樣。
- 顆粒：填色那一層多一道濾鏡，在同樣的抖動之外，用細密的 `feTurbulence` 做出紙色的小斑點疊在顏色上，像蠟筆沒塗到的紙紋。
- 色盤：十支蠟筆，深紅、奶油白、鼠尾草綠、松樹綠、暖黃、淡藍、淺粉、焦糖棕、柔和灰、夜空藍；可以用方向鍵切換。
- 功能：點區塊塗色；復原、重做（每一筆一步）；重設（也能復原）；完成作品（紙的右下角蓋上紅色的「Merry Christmas」印章，字是首頁標題的字形路徑）；存成圖片（三倍大小的 PNG：底色、紙張、線稿和印章一起畫進 canvas，保留紙紋與顆粒）；回到販賣機（Esc 也可以）。
- 轉場：從取物口拿出東西時，著色桌從取物口的位置放大展開，紙張再像立體書一樣立起來；回販賣機時縮回取物口。

## 之後替換素材

- 正式 GLB：照 `docs/VENDING-MODELS.md` 換 `assets/models/source/` 的原檔，再跑 `node scripts/build-vending-models.mjs`。機身上按鈕、層架、取物口的位置寫在 `vending-machine.js` 開頭的 `BUTTONS`、`SHELVES`、`TRAY`（用機器自己的座標）。
- 手繪 SVG：改 `vending-coloring.js` 的 `DRAWINGS`。每張有 `parts`（可以塗色的區塊，由下往上疊）和 `ink`（不塗色的細節線），viewBox 300×360。換成手繪稿時，把每個封閉區塊存成一個 path 放進 `parts` 就好，抖動與顆粒濾鏡會自動套上。

## 目前還是示意的部分

- 四張線稿是用程式畫的簡潔造型，再加上抖動濾鏡，還不是手繪稿。
- 降臨曆小卡的 24 個小場景沿用 Santa 頁原本的紙雕場景，有幾個是聖誕村裡的東西（分揀架、摩天輪、郵戳）。
