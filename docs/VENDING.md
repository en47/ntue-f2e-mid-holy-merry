# 第五頁 Christmas Vending

雪夜裡的聖誕販賣機（3D）、右邊小攤子吊著的降臨曆，和取出小東西後打開的紙雕著色桌（2026-11-23）。這一頁跟 Santa 頁的劇情沒有連結。導覽順序是 Home、Intro、Game、Wish、Vending、Santa。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `vending.html` | 頁面：標題、夜景、3D 舞台、降臨曆攤子、著色桌（平常藏著） |
| `js/vending.js` | 進入點：掛上夜景、販賣機、降臨曆、著色桌；從取物口拿出東西，著色桌就從取物口展開，回販賣機時收回去；bfcache 離開時釋放、回來時重建 |
| `js/components/vending-scene.js` | 紙雕夜景：夜空、紙月亮與星星、遠山與山下的小村、平平一整片雪地、兩邊的松樹、路燈和它照在雪上的暖光、前景雪堆、少量飄雪 |
| `js/components/vending-machine.js` | Three.js 販賣機的燈光、鏡頭與互動：載入四個商品模型（`assets/models/vending-*-web.glb`，見 `docs/VENDING-MODELS.md`），按鈕、拉桿、小劇場各疊一個 HTML 熱區，選擇、拉桿、出貨與復位的動畫和音效 |
| `js/components/vending-papercraft.js` | 紙雕拉霸機本體：用程式疊出來的卡紙（招牌、展示格、按鍵板、小劇場、拉桿組、底座），尺寸都在 `MACHINE`（見 `docs/VENDING-MACHINE.md`） |
| `js/services/vending-lever.js` | 拉桿與出貨的純邏輯：指標角度換成拉動幅度、五顆燈的亮度、狀態怎麼走、出貨每一段的時間（`tests/vending-lever.test.mjs`） |
| `js/data/marquee-glyphs.js` | 招牌 CHRISTMAS VENDING 的字形輪廓，由 `scripts/build-title-glyphs.mjs` 產生，不要手改 |
| `js/components/vending-advent.js` | 降臨曆攤子：紙雕小屋頂與橫木、用繩子吊著的曆、24 扇小門、開門後的小卡 |
| `js/components/vending-coloring.js` | 著色桌：四張線稿、蠟筆盒、復原／重做／重設／完成作品／存成圖片／回到販賣機 |
| `js/data/vending.js` | 文字：四樣東西、蠟筆顏色、降臨曆 24 天的一句話與小圖 |
| `css/vending.css` | 版面與動畫（只動 transform 和 opacity，減少動態時都不動） |

另外 `cabin-paper.js` 多了這一頁的紙張對照（按鈕、蠟筆盒、降臨曆的門與小卡），`site-loader.js` 多一個 vending 主題，`page-foreground.js` 多一組夜晚的頁尾地面（路燈、禮物），標題字形 `christmas-vending` 由 `scripts/build-title-glyphs.mjs` 產生。

## 販賣機

2026-11-24 改成紙雕聖誕拉霸機（設計與尺寸見 `docs/VENDING-MACHINE.md`）。原本 Tripo3D 的機器和按鈕模型不再載入，檔案留在 `assets/models/`。

- 不用投幣。先按一顆按鈕選一樣：按鈕停在半沉的位置，那一格變亮、商品跳一下，拉桿的卡榫鬆開。
- 再把右邊的拉桿往下拉（拖曳，或方向鍵一次 20%），五顆燈泡沿著弧線一顆顆亮。拉到底放開才出貨；沒拉到底放開會彈回去。還沒選就拉，拉桿被卡住、按鈕輕輕浮一下。
- 出貨（約 4 秒）：展示門落下 → 紅紙幕後面的燈亮起，商品的剪影從上方降下 → 燈熄、紙幕拉開 → 托盤推出、商品轉身、鈴聲。
- 點舞台上的商品，著色桌就從托盤的位置展開；回來時機器已經補貨、拉桿重新扣上。
- 著色桌開著時，販賣機停止繪製（`hold`）。WebGL 或模型載入失敗時，改成直接列出四個選項。
- 讀屏軟體會聽到每一步（選了什麼、拉桿彈回、出發、到舞台上），畫面上不出現提示字。

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

- 商品 GLB：照 `docs/VENDING-MODELS.md` 換 `assets/models/source/` 的原檔，再跑 `node scripts/build-vending-models.mjs`。機器本體是程式疊的紙板，展示格、按鈕、拉桿、舞台的位置都在 `vending-papercraft.js` 的 `MACHINE`。
- 手繪 SVG：改 `vending-coloring.js` 的 `DRAWINGS`。每張有 `parts`（可以塗色的區塊，由下往上疊）和 `ink`（不塗色的細節線），viewBox 300×360。換成手繪稿時，把每個封閉區塊存成一個 path 放進 `parts` 就好，抖動與顆粒濾鏡會自動套上。

## 目前還是示意的部分

- 四張線稿是用程式畫的簡潔造型，再加上抖動濾鏡，還不是手繪稿。
- 降臨曆小卡的 24 個小場景沿用 Santa 頁原本的紙雕場景，有幾個是聖誕村裡的東西（分揀架、摩天輪、郵戳）。
