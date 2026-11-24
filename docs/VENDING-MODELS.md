# 販賣機頁的 3D 模型

來源：使用者用 Tripo3D 生成（2026-11-23）。販賣機本體一個，四樣商品各一個（聖誕襪、聖誕樹、薑餅人、雪人），每樣商品各配一顆販賣機上的圓形按鈕，共九個。

2026-11-24 起販賣機改成程式疊的紙雕拉霸機（`docs/VENDING-MACHINE.md`），頁面只載入四個商品；機器本體和四顆按鈕的模型不再載入，檔案和雜湊表照舊保留。

| 檔案（網頁用） | 原檔 | 大小 | 三角面 | 貼圖 |
| --- | --- | --- | --- | --- |
| `vending-machine-web.glb` | `source/vending-machine.glb`（27MB） | 約 1.45MB | 約 8.9 萬 | 顏色 4096、其他 2048 |
| `vending-{stocking,tree,gingerbread,snowman}-web.glb` | 各約 26～30MB | 各約 0.8～1.05MB | 約 7.7 萬 | 顏色 2048、其他 1024 |
| `vending-{…}-button-web.glb` | 各約 27MB | 各約 0.46MB | 約 3.8 萬 | 顏色 1024、其他 512 |

2026-11-23 使用者嫌商品和按鈕精度太低、整台太黃，所以貼圖和面數都多留一些（合計約 6.9MB，原本約 2.8MB）。顏色照原檔，不另外調。

販賣機在 Tripo3D 檢視器裡是霧面、柔和的紅、米白和淡奶油黃。頁面要長得一樣（`vending-machine.js`）：材質一律霧面（金屬度 0、粗糙度 0.72，不用原檔的金屬粗糙度貼圖），中性的攝影棚環境光（RoomEnvironment）加一盞白色主光，ACES 色調映射、曝光 0.5。這組數字是拿使用者的原圖逐點量顏色比出來的（紅、米白、奶油黃、窗內的綠、按鈕都對得上）。之前只打暖色燈、沒有環境光，金邊被算成深色金屬，整台又暗又黃。

- 原檔每個約 76 萬面、三張 4096 貼圖，九個加起來約 250MB，太大，不放進版本控制：放在 `assets/models/source/`（已寫進 `.gitignore`），只留在本機。
- `node scripts/build-vending-models.mjs` 由原檔產生 `*-web.glb`：簡化網格（meshopt）、貼圖縮小轉 WebP、EXT_meshopt_compression 壓縮。載入時要 `MeshoptDecoder`（和首頁、Wish 頁的模型一樣）。
- 每個 `*-web.json` 記下網頁版的大小與 SHA-256，也記下原檔的大小與 SHA-256（`sourceSha256`），換原檔時可以核對；smoke 會比對網頁版的雜湊與大小上限。
- 預覽台：`tests/vending-models.html`（夜晚燈光下九格慢慢轉，人工檢查用，不在 `npm test` 內）。
