# Wish 精靈原生待機、散步與互動

2026-10-29 初次完成；2026-10-30 補充原生舞蹈與真實網格操作。最新信封及獨立手勢修改見 `WISH-INTERACTION-REFINEMENT.md`。Firebase、審核、摺信投遞、其他三頁及原始模型／圖片均保留。

## 模型與實際 AnimationClips

使用者新提供的 `/Users/fuminjan/Downloads/elf toy 3d model.glb` 複製為 `assets/models/wish-elf-original.glb`。兩者逐位元組相同，SHA-256：`7bc100cab325dc01b57b294053021c5bc4330c1a99f2c3fd3af60f95595fe0e3`。沒有修改 GLB、材質、貼圖或骨架比例。

| 來源 | 原生 clip | 秒數 | 本次用途 |
| --- | --- | ---: | --- |
| 新提供的原始 GLB | `look_around` | 15.583333 | 動態待機、休息及張望 |
| 原專案 `wish-elf.glb` | `walk` | 2.333333 | 散步 |
| 原專案 `wish-elf.glb` | `dance_05` | 2.875 | 低頻短舞及成功投遞反應 |
| 原專案 `wish-elf.glb` | `dance_03` | 12.791667 | 低頻原生舞蹈，不連續重複 |
| 原專案 `wish-elf.glb` | `dance_04` | 10.791667 | 低頻原生舞蹈，不連續重複 |

新檔只有 `look_around`，沒有內建 walk 或 dance。本次驗證兩個 GLB 的 65 根骨頭名稱、父子關係、rest transforms 與網格相容，才從舊檔擷取完全相同的 `walk`／`dance_03`／`dance_04`／`dance_05` keyframes 到 `assets/animations/elf-actions.json`（3,450,744 bytes，約 3.45 MB）。瀏覽器只載入新 GLB 與這份動畫資料，不重複載入舊模型／貼圖。舊 GLB 保留不動。

## 動作與操作

- 初次取得安全路線後散步。以固定安全路標、完整步態週期、約每秒 0.29 身高的來源步速選擇路程；使用權重選擇散步、張望、休息及短舞，不採固定 walk → dance 排程。
- 初次舞蹈至少等 45–75 秒；三段原生舞蹈共用完成後至少 75 秒的冷卻，不會因候選增加而每走幾步就跳舞。避免連續選到同一舞蹈；不額外施加整體跳躍、傾斜、搖擺或轉圈冒充不同舞蹈。原生 dance_03 本身有轉身，保留來源動作。
- 點精靈切換動態待機，位置不重設；原生 `look_around` 持續循環。0.32 秒混合原生動作，正常以 1× 播放。
- 直接橫拖活動中的精靈也會進入動態待機。互動時橫拖只改 `elf-user-rotation` 的 Y 軸。6px 手勢門檻、直向捲動保留，拖曳放開不會被當成第二次點擊。按下即捕捉指標，避免快速移出小目標時漏接拖曳。
- 放開後保留角度 2 秒，再以 1.05 秒 ease-in-out 回到正面；拖曳中不計回正時間，再次拖曳會取消原回正。鍵盤方向鍵及 Home 也可操作。
- 第二次點擊從當前位置恢復活動。已移除可見「暫停精靈」按鈕與舊固定 28 秒巡邏程式。
- 成功投遞沿用現有 `setWishes` 成功 ID，不新增資料庫流程。自由活動可原地短舞；手動待機／拖曳優先，不因投遞強制恢復活動。
- 使用真實 GLB 網格深度 raycast，前景精靈、可見信封及樹葉／樹幹依實際距離決定命中。一次手勢只綁定一個物件，拖過另一個物件也不切換；空白處不會轉樹。透明按鈕僅保留鍵盤／輔助閱讀操作，不攔截指標。

## 左右路線與落地

原本將樹幹的螢幕 X 範圍從雪地扣除，只能保留其中一側，造成精靈無法走到右邊。現在將精靈放在整棵樹的三維半徑之外的前景深度：

`elf.z = max(2, treeRadius × treeScale + elfHeight × 0.55 + 0.18)`

正交鏡頭下人物視覺大小和雪地高度不變。安全路線只在 Z 深度會與樹幹相交時排除樹幹；目前前景路線可連續經過樹前、到達左右兩側，仍避開投影到底部的信紙及木架。接觸陰影跟隨同一地面與前景深度。四個路標按可用寬度比例生成，尺寸改變時重新量測。

來源骨架本身有些姿勢略低於地面。開發工具以實際蒙皮網格 24fps 取樣，產出 `elf-ground.js`，僅補償模型根群組的 Y，不改動骨頭 keyframes、不壓掉原生向上運動。另在 0.32 秒 crossfade 期間檢查非線性混合造成的短暫穿地；正常播放不逐幀掃描網格。這不是足部 IK，窄路線及轉身仍可能有輕微來源步態滑動。

## 效能與測試方式

沿用原 Wish 的單一 renderer／RAF、共用燈光。手機全場景最多 30fps，桌面最多 60fps，pixel ratio 上限 1.5。背景頁面／離開視窗暫停昂貴繪製，模型及事件隨頁面釋放。`prefers-reduced-motion` 停止自動散步和骨架動畫，保留操作、立即回正。

```sh
npm test
node --experimental-vm-modules scripts/build-elf-actions.mjs
node --experimental-vm-modules scripts/build-elf-ground.mjs
```

後兩個是素材變動後才需執行的開發工具，須依順序使用；平常 Live Server 不必執行。模型 rig 不符會拒絕擷取。

`tests/elf-preview.html` 是無 Firebase 的本機驗收頁，使用實際 Wish HTML/CSS、模型和控制器，可切換 1440／1024／768／390px，查看狀態、滑鼠事件與模擬成功投遞。模擬按鈕不建立／審核／發布任何願望，也不修改正式願望資料。

## 檔案清單

修改：`wish.html`、`css/wish.css`、`js/components/wish-scene.js`、`js/components/wish-layout.js`、`package.json`、`tests/smoke.mjs`、`tests/wish-distribution-stage.html`、`TESTING.md`。

新增：`js/components/elf-behavior.js`、`elf-animation.js`、`elf-interaction.js`、`js/data/elf-ground.js`、`assets/models/wish-elf-original.glb`、`assets/animations/elf-actions.json`、`scripts/build-elf-actions.mjs`、`scripts/build-elf-ground.mjs`、`tests/elf.test.mjs`、`tests/helpers/elf-model.mjs`、`tests/elf-preview.html`、`tests/elf-stage.html` 及本文件。

實際測試結果與未驗項目記於 `TESTING.md`；原有 176 檔案基準未出現檔案刪除，Home／Intro／Game、Firebase 及原始模型／圖片維持相同雜湊。沒有 commit、push 或部署。
