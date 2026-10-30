# Wish：安定紙雕信封與獨立精靈操作

2026-10-30。沿用既有網站和 Wish 場景；沒有重建網站、改動其他三頁或部署。已查看使用者提供的 `螢幕錄影 2026-10-29 下午5.49.22.mov`（約 4.5 秒），並核對現有 transform。問題主要來自過大的紙邊、外伸掛線及多個旋轉層混用；原程式未發現持續 billboard 指令。

## 信封的視覺與階層

```text
treeGroup（只由使用者轉動）
└─ hanging-paper-wishes（不另加旋轉）
   └─ branchAnchor（固定枝葉位置、朝向、尺寸）
      └─ hangingPivot（頂端懸掛點；固定小角度＋新信一次輕晃）
         ├─ 短細掛線
         └─ paperCutEnvelope（原圖、紙邊、紙背、封口與蠟封一起移動）
```

- 原普通／金色 PNG、透明輪廓、蝴蝶結孔洞、原圖 UV 均保留。沒有重新生成圖片、矩形透明邊框或 Sprites。
- 主紙厚由寬度的 2.2% 改為 **1.6%**，含 bevel 的側緣約 **1.72%**。暖米色側面、霧面背面、封口與蠟封微凸仍保留，但凸起減小。
- 相對紙寬，掛線垂降 `.22 → .12`、向外偏移 `.58 → .36`、線半徑 `.009 → .0035`。掛線與紙身共用頂端 pivot，不脫離懸掛點。
- 掛點的 Y 軸朝向固定；靜止 Z 軸角度只在 **±3–6°** 範圍。沒有每幀重新看向鏡頭、額外 yaw、全向翻轉或剛體模擬。
- 普通信與已存在的金色信完全靜止。僅成功寄送的新金色 ID 觸發一次 **1.4 秒**衰減擺動，5° 為振幅上限，實際峰值約 **3.05°**，結束精確回到靜止角度。刷新同一批資料不重播；減少動態設定取消擺動。

縮短掛線後重新對照真實 GLB 三角網格；移除會讓紙身凹入葉片的九個候選點：`middle-0-3`、`middle-0-7`、`middle-0-8`、`middle-2-0`、`middle-2-1`、`middle-2-2`、`lower-0-11`、`lower-2-10`、`lower-3-0`。只刪候選位置，沒有刪原素材。候選共 **71 個：上13／中21／下37**；實際十封仍是 **上2／中3／下5**，沿用 session seed、ID、本人金色信優先和最小紙身間距，不逐幀重新抽位置。

## 實際模型命中與手勢

`wish-picking.js` 僅在 pointerdown 使用真實樹 GLB、目前蒙皮精靈及 alpha 輪廓紙身做 Raycaster。最近的可見表面決定操作物件；同深度才按精靈、信封、樹排序。人物在樹前時先操作人物，旁邊樹葉／樹幹仍可轉樹，空白天空／雪地不會開始旋轉。

`wish-interaction.js` 將一次指標手勢綁定一個物件直到放開或取消。橫向超過 6px 才進入旋轉，直向保留捲動；不會拖到別的物件就中途換控制。點信讀取，拖信則轉樹。直接拖活動中的精靈會先進入原生動態待機，僅轉精靈，兩秒後平滑回正；第二次點擊恢復活動。表單、襪架及投遞回饋不搶手勢。

原透明按鈕保留鍵盤與輔助閱讀功能，關閉其 pointer 命中；不再用大矩形攔截空白處。沿用單一 renderer／RAF、背景暫停、尺寸量測和資源清理。

## 精靈原生動作補全

顯示的仍是使用者新提供的 `wish-elf-original.glb`，原生唯一 `look_around` 為 15.583333 秒。既有舊 GLB 的骨架、bind/rest transforms 與網格相容，才沿用以下原始 keyframes；沒有下載新模型或修改骨頭比例。

| 來源原生 clip | 秒數 | 用途 |
| --- | ---: | --- |
| `walk` | 2.333333 | 完整步態週期散步 |
| `dance_03` | 12.791667 | 低頻原生舞蹈，包含來源轉身 |
| `dance_04` | 10.791667 | 低頻原生舞蹈 |
| `dance_05` | 2.875 | 低頻原生短舞／既有投遞反應 |

三舞共用完成後至少 75 秒冷卻、初次等待 45–75 秒，並避免連續選到相同舞蹈。未額外加整體跳躍／傾斜／旋轉來假造舞步。根群組的地面校正只修來源略穿地的下界，保留原生抬腳及向上運動，未增加足部 IK。新增兩舞後動畫 JSON 為 3,450,744 bytes；瀏覽器不重複下載舊 GLB 的模型或貼圖。

## 本次檔案清單

相對開始本次工作的 189 檔 SHA-256 基準：

| 類型 | 修改檔案 |
| --- | --- |
| Wish 接線／樣式 | `wish.html`、`css/wish.css`、`js/components/wish-scene.js` |
| 紙雕與掛點 | `js/components/paper-envelope.js`、`wish-envelope-layout.js`、`wish-envelopes.js`、`js/data/wish-tree-anchors.js`、`scripts/build-wish-anchors.py` |
| 精靈 | `js/components/elf-behavior.js`、`elf-interaction.js`、`js/data/elf-ground.js`、`assets/animations/elf-actions.json`、`scripts/build-elf-actions.mjs`、`scripts/build-elf-ground.mjs` |
| 測試 | `package.json`、`tests/elf.test.mjs`、`tests/wish-cloud.test.mjs`、`tests/elf-stage.html`、`tests/paper-envelope-preview.html`、`tests/paper-envelope-preview.js` |
| 紀錄 | `TESTING.md`、`docs/WISH-ELF-BEHAVIOR.md` |

新增：`js/data/paper-envelope-style.js`、`js/components/wish-interaction.js`、`js/components/wish-picking.js`、`tests/wish-interaction.test.mjs`、`tests/envelope-motion-preview.html`／`.js`、`tests/elf-clips-preview.html`／`.js`、本文件。

沒有刪除基準中的原檔；Home／Intro／Game、Firebase／安全規則／管理員頁、`js/wish.js`、摺信飛行程式、原始 PNG／GLB 均與基準相同。

## 驗收結果與限制

`npm test`：**23 組 smoke checks＋16 項測試全部通過**。測試包含真實 GLB 蒙皮姿勢／來源 keyframes、1200 秒三舞排程、左右安全路線、實際模型命中、鎖定手勢／取消／捲動、100 組種子配額／間距、透明輪廓孔洞、360° 父子 transform 不變、一次擺動及資源釋放。

實際 Safari 無 Firebase 預覽完成 12 秒 360° 慢轉，檢視正面／側面／背面與390px；背面信及金色信可點讀，新金色信一次輕晃後停。完整 Wish 桌面與390px模型、原生待機、左右活動、鍵盤旋轉與回正已查看。Chrome 成功載入五段原生動畫，查看 dance_03 後段、dance_04 前後段，未見明顯肢體拉伸，兩舞完整播放後回到待機。

**尚未完成完整人工滑鼠／實體手機拖曳驗收。** 原生工具多次遇視窗切換、座標錯誤或遮擋；跨到其他分頁的拖曳不能算通過。手勢邏輯及實際 GLB 命中程式測試已通過，與人工驗收分開記錄。未重測正式 Firebase 寄信／審核，也沒有建立雲端測試願望。低階手機效能、Firefox及長時間運作尚未實測；原生步態可能仍有輕微腳滑。

可透過 Live Server 開啟 `tests/envelope-motion-preview.html`、`tests/wish-distribution-preview.html`、`tests/elf-clips-preview.html` 自行核對；它們使用本機測試信且不載入 Firebase。正式 Wish 仍使用原雲端資料流程。
