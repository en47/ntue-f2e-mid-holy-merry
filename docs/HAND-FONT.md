# 手寫字型：芫荽 Iansui

2026-11-12 起，全站的手寫字（`--font-hand`）改用「芫荽 Iansui」。

- **字型資訊**：作者 But Ko，SIL OFL 1.1 授權，授權全文在 `assets/fonts/IANSUI-LICENSE.txt`。
- **為什麼換**：原本的 `WishHand`（`assets/fonts/wish-handwritten.woff`，霞鶩文楷的精簡子集）只收了少數字。網站用到的 1382 個中文字（含標點）裡，它只涵蓋 113 個，其餘都退回黑體，一行字裡會混兩種字體。
- **舊檔**：舊字型檔依「不刪 assets 原始素材」的規則保留，只是不再使用。

## 兩個子集

| 檔案 | 內容 | 大小 | 什麼時候下載 |
| --- | --- | --- | --- |
| `assets/fonts/iansui-site.woff2` | 網站頁面、程式、樣式用到的每個字，加上英數 | 約 504 KB | 頁面出現手寫字時 |
| `assets/fonts/iansui-common.woff2` | Big5 常用字裡其餘的字，約 4000 字 | 約 1.2 MB | 只有畫面出現網站以外的字時，例如訪客在 Wish 寫的署名 |

`css/shared.css` 裡有兩條 `@font-face`：常用字那條涵蓋整段中日韓區塊，網站那條寫在後面、只列自己的字，所以網站本身的字一律用小的那個檔。

## 改了文字以後

新增或修改頁面上的中文字以後，如果用到子集裡沒有的字，`npm test` 會失敗，並列出缺的字。這時重建字型：

```sh
python3 -m venv /tmp/font-venv && /tmp/font-venv/bin/pip install fonttools brotli
/tmp/font-venv/bin/python scripts/build-hand-font.py
```

腳本會做這些事：
1. 下載 Google Fonts 倉庫裡的原檔，用 SHA-256 確認是同一個版本。
2. 重做兩個子集。
3. 改寫 `css/shared.css` 裡標記之間的 `@font-face`。
4. 更新 `docs/HAND-FONT.json`（字表與雜湊）。

改完記得跑 `node scripts/stamp-modules.mjs`。
