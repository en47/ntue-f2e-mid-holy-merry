# 販賣機頁的 3D 模型

來源：使用者用 Tripo3D 生成（2026-11-23）。販賣機本體一個，四樣商品各一個（聖誕襪、聖誕樹、薑餅人、雪人），每樣商品各配一顆販賣機上的圓形按鈕，共九個。

| 檔案（網頁用） | 原檔 | 大小 | 三角面 | 貼圖 |
| --- | --- | --- | --- | --- |
| `vending-machine-web.glb` | `source/vending-machine.glb`（27MB） | 約 1.45MB | 約 8.9 萬 | 顏色 4096、其他 2048 |
| `vending-{stocking,tree,gingerbread,snowman}-web.glb` | 各約 26～30MB | 各約 0.8～1.05MB | 約 7.7 萬 | 顏色 2048、其他 1024 |
| `vending-{…}-button-web.glb` | 各約 27MB | 各約 0.46MB | 約 3.8 萬 | 顏色 1024、其他 512 |

2026-11-23 使用者嫌商品和按鈕精度太低、整台太黃，所以貼圖和面數都多留一些（合計約 6.9MB，原本約 2.8MB），販賣機和按鈕的顏色貼圖降一點飽和度（0.86），頁面的燈光改成接近白光、加上 Neutral 色調映射（`vending-machine.js`）。

- 原檔每個約 76 萬面、三張 4096 貼圖，九個加起來約 250MB，太大，不放進版本控制：放在 `assets/models/source/`（已寫進 `.gitignore`），只留在本機。
- `node scripts/build-vending-models.mjs` 由原檔產生 `*-web.glb`：簡化網格（meshopt）、貼圖縮小轉 WebP、EXT_meshopt_compression 壓縮。載入時要 `MeshoptDecoder`（和首頁、Wish 頁的模型一樣）。
- 每個 `*-web.json` 記下網頁版的大小與 SHA-256，也記下原檔的大小與 SHA-256（`sourceSha256`），換原檔時可以核對；smoke 會比對網頁版的雜湊與大小上限。
- 預覽台：`tests/vending-models.html`（夜晚燈光下九格慢慢轉，人工檢查用，不在 `npm test` 內）。
