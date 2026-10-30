# Firebase：Wish 第二階段連線與安全基礎

日期：2026-10-29，專案 `holymerry`，資料庫 `(default)`。

## 目前完成與未完成

已建立真實 Web App 設定、瀏覽器 Modular SDK 連線、持久匿名登入、獨立管理員登入、願望資料服務、審核規則及 Emulator 測試。官方 SDK／測試相依套件均固定版本並留有 package-lock.json。瀏覽器與測試統一使用 Firebase 12.19.0；目前 rules-unit-testing 5.0.2 的 peer dependency 為 Firebase 12，不強制忽略版本衝突。

正式環境先確認 Anonymous Authentication 登入成功、Firestore 拒絕存取；使用者明確確認發布後，已透過登入中的 Firebase Console 發布規則（08:09），並建立 wishes 集合群組的 status ASC / createdAt ASC 索引，索引 ID CICAgOjXh4EK，08:19:33 顯示已啟用。資料庫實際位置 asia-east1，原先無集合。規則編輯器內容與本機測試檔逐字核對（忽略排版空白），原 deny-all 政策保存於 FIRESTORE-PREVIOUS.rules。

在正式規則及讀取驗證成功後，已將 Wish commit callback 接到真實 Firestore transaction，寄信後顯示自己的金色信封，重新整理查回最新願望。私人／公開同意選項預設私人；公開信須先通過審核。仍保留原紙張摺疊、飛行、實際等待時的雪花、原 GLB 與精靈動畫；其餘三頁及共用檔案保持原樣。正式管理員 claim、本人重新登入、核准／拒絕及另一訪客讀取公開副本也已實測，最新細節見 [FIREBASE-ADMIN-VERIFICATION.md](FIREBASE-ADMIN-VERIFICATION.md)。

## 設定及實作位置

| 檔案 | 用途 |
| --- | --- |
| js/config/firebase-config.js | 使用者提供的 Web App 公開設定、database ID |
| js/services/firebase-sdk.js | 官方 gstatic 固定版本原生 ES modules，只載入 App / Auth / Firestore |
| js/services/firebase-client-core.js、firebase-client.js | 共用初始化、訪客與管理員分開的 Firebase App／Auth |
| js/services/wish-repository-core.js、wish-repository.js | 願望建立／最新願望／公開抽樣／審核 |
| wish.html、js/wish.js、css/wish-cloud.css | 雲端寄信、私人／公開選擇、舊本機收藏保留、雲端願望清單 |
| js/components/wish-envelopes.js、wish-scene.js、wish-delivery.js | 同一 Renderer 的樹上信封／可點擊投影、可設定的真實儲存提示 |
| js/services/wish-selection.js | 最多 10 封或 9+1 的去重／排除本人邏輯 |
| admin.html、admin/index.html、css/admin.css、js/admin.js | 獨立管理員登入、待審列表及核准／拒絕；/admin 相容導向 |
| firestore.rules、firestore.indexes.json、firebase.json | 權限、審核複合索引與本機模擬器設定 |
| tools/firebase-admin/set-admin-claim.mjs | 可信任本機或後端的 claim 初始化工具 |
| tools/firebase-admin/verify-wish-access.mjs | 明確指定正式環境的唯讀驗收；會建立匿名 Auth 工作階段，不寫願望 |
| tests/firestore.rules.test.mjs、firebase.integration.test.mjs | 真正 Auth／Firestore Emulator 測試 |
| tests/firebase-connection.html、firebase-connection.js | 正式連線檢查；只登入及讀取，不寫願望 |
| package.json、package-lock.json、.gitignore | 僅開發工具依賴、版本鎖定及機密排除 |

前端不需要 npm build，仍由 Live Server 開啟。開發測試與 Admin 工具需要 Node.js 22+，Firestore Emulator 需要 Java 21。未引入新框架，也未將 Admin SDK 載入瀏覽器。

## 資料及權限

`users/{uid}/wishes/{wishId}` 保存 nickname、content、visibility（private/public）、status（建立時只能 pending）及 createdAt（serverTimestamp）。審核後才由管理員加入 reviewedAt / reviewedBy。原信建立後不開放訪客修改，避免審核後換掉內容。

本人可 get 自己的信，並以最多 60 筆的查詢讀取本人信件。管理員可讀取原信；待審列表使用 collection-group query，status + createdAt 複合索引、每批最多 50 封。其他訪客連已核准原信也不能讀取。

`publicWishes/{wishId}` 只保存核准副本：nickname、content、createdAt、publishedAt、randomKey 及 ownerUid。ownerUid 是用於排除本人信件的匿名 Firebase UID，不包含 Email、密碼、審核者或備註。匿名 UID 不是密碼，也不作為授權憑證；私人資料仍受 Auth Token 與 Rules 保護。

只有帶 `admin: true` claim、以 password provider 登入的管理員可審核。核准交易同時修改原信狀態並建立公開副本；Rules 使用 getAfter 驗證副本逐欄吻合原信且本人同意公開。拒絕已公開信件必須在同一交易刪除公開副本。訪客、一般 Email/Password 帳號及匿名帳號自帶的假 admin 欄位都沒有審核權限。

公開集合僅登入後可讀，每次 list 上限 30。未匹配路徑預設拒絕。Admin SDK／Console 具有 IAM 權限時會繞過 Rules，因此不要手動把未核准內容寫入 publicWishes；現有網頁審核流程使用 Client SDK，必須通過 Rules。

Firestore client Rules 不等於防機器人或全站流量限制；此階段沒有假裝完成服務端限流。未使用 Functions。若後續有濫用、嚴格配額或自動處理需求，再規劃 App Check／可信任後端。

## 資料服務的行為

`getVisitor()` 先恢復 Auth 持久狀態，只有尚未登入才 signInAnonymously；相同 origin／瀏覽器重新整理沿用 UID。管理員另用 named App 與 session persistence，登入或登出不會替換訪客的匿名 UID。清除網站資料、無痕瀏覽、換裝置或切換 localhost / 127.0.0.1 不能保證同一身分。

`draft()` 先產生固定文件 ID。`submitWish(draft)` 使用 Firestore transaction；伺服器已存在同 ID、同內容的信時回傳該信，不重複建立。離線交易不會冒充完成。連線結果不明時，後續 UI 必須重用同一 draft ID 重試或查詢確認，不能立刻改 ID 再寄。

`latestWish()` 用 server query 取得本人的最新一封。`publicWishes(9|10)` 只查公開集合，使用 randomKey 隨機起點與前後兩段、各最多 30 筆的索引抽樣，排除本人的全部信件、去重及洗牌。這不是整個資料庫的嚴格等機率抽樣；不足時返回實際數量，不造假信補滿。自己最新一封可為 private 或 pending，由本人私有查詢取得金色信封，不依賴公開副本。

正式 Wish UI 已接上這些接口，沒有自動搬移既有 localStorage 願望到雲端。已加入預設不勾選的公開同意選項；未勾選為私人。實際提交失敗保留輸入及相同 draft ID 供同頁重試，不會轉存本機假稱成功。重新整理會從伺服器查回自己的最新願望；若提交結果不明，應先重新整理查看再決定是否寄新信。

## 本機測試

安裝 Node.js / Java 後，在專案根目錄：

```sh
npm ci
npm test
npm run test:firebase
```

test:firebase 僅啟動 demo-holy-merry，不使用正式 Firebase config；兩份測試檔必須有 Emulator host 環境變數才會執行。會清空模擬器資料，沒有正式資料刪除。模擬器關閉後測試匿名帳號與測試信不會寫到正式專案。

本次環境原本沒有 Node／Java，實際測試使用官方下載且 SHA-256 核對的 Node 22.23.4 與 Temurin Java 21.0.13，放於 /private/tmp，未安裝全域軟體。這些暫存路徑可能在重新開機後消失：

```sh
export PATH="/private/tmp/holy-merry-runtime/node-v22.23.4-darwin-arm64/bin:$PATH"
export JAVA_HOME="/private/tmp/holy-merry-java/jdk-21.0.13+9/Contents/Home"
export XDG_CONFIG_HOME="/private/tmp/holy-merry-firebase-config"
export FIREBASE_EMULATORS_PATH="/private/tmp/holy-merry-emulators"
npm run test:firebase
```

18 項 Emulator 測試通過，包含 17 項 Rules 測試與 1 項真實 SDK 整合流程：匿名登入、固定 ID 重試、私人隔離、一般帳號拒絕、管理員 claim、原子核准／撤回、本人最新願望及排除本人抽樣。既有 23 組網站 smoke tests、2 項樹上信封測試通過；後者使用真實 Three.js 變換確認 10／9+1 選取、正背面、縮放與清理。沒有把 Emulator 成功當作正式管理員審核已完成。

## 正式規則與索引部署

確認專案無其他既有資料結構需要兼容後，在自己的可信任終端登入 Firebase CLI，先檢視 firestore.rules，再執行：

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project holymerry
```

本專案沒有設定 Firebase Hosting，也不會在這個指令部署網頁或開啟 Cloud Functions。不要使用 Test mode 或 allow read,write: if true。索引建立可能需要等待，完成後再測管理員 pending 查詢。

部署後用 Live Server 開啟 tests/firebase-connection.html，點「連接」，預期匿名登入及兩項 Firestore 讀取皆成功。重新整理再點一次，UID 應保持一致。沒有既有雲端信時顯示 0 封是正常；它不會自行新增正式測試願望。

## 管理員初始化

管理員帳號密碼只在 admin.html 由本人輸入，不提供給代理、不寫入程式碼。尚未設 claim 的帳號登入後會顯示自己的 UID 並登出；這是提供給本機初始化工具的 UID。

在可信任本機，以具有 holymerry Firebase Authentication 使用者管理權限的 IAM 身分取得 Application Default Credentials，或在可信任後端使用工作負載身分。若使用個人 ADC，依官方文件為 Firebase Auth 設定自己的 OAuth client（不可將 OAuth secret 放入網站）：

https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments

先 dry run，檢查專案與 UID；確認正確才加 --apply：

```sh
node tools/firebase-admin/set-admin-claim.mjs --project holymerry --uid YOUR_ADMIN_UID --grant
node tools/firebase-admin/set-admin-claim.mjs --project holymerry --uid YOUR_ADMIN_UID --grant --apply
```

工具保留其他 custom claims，只更改 admin。預設 dry run 不寫入；錯專案、缺 UID、匿名／停用帳號不能被授權。`--revoke --apply` 移除 admin 並 revokeRefreshTokens。移除權限後，已簽發的 ID token 仍可能有效到過期（通常最多約一小時），不是即時強制撤銷所有舊 token；需要即時撤權時另加可即時檢查的角色資料／後端機制。

若選擇服務帳戶方式，憑證必須留在專案及網站公開根目錄以外，只透過可信任環境設定給 Admin SDK；不要貼到對話、前端或 GitHub。不能只靠 .gitignore 保護對外提供的網站目錄。本次依本人選擇採用無私鑰服務帳戶 impersonation，已對指定正式帳號完成授權。

完成後管理員登出再登入，以取得新 token。本次已由本人完成登入，並實際通過正式核准／拒絕、公開副本與訪客讀取驗收。日常審核只需開啟 /admin 登入，不需要重新執行 Admin SDK 或保留 CLI／ADC。

## 官方依據

- https://firebase.google.com/docs/web/alt-setup
- https://firebase.google.com/docs/auth/web/auth-state-persistence
- https://firebase.google.com/docs/auth/admin/custom-claims
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/rules/unit-tests
- https://firebase.google.com/docs/admin/setup


## 初次整合的正式環境及畫面驗收

以下為首次整合時的歷史紀錄；管理員初始化後的最新紀錄見 [FIREBASE-ADMIN-VERIFICATION.md](FIREBASE-ADMIN-VERIFICATION.md)。

- Safari / localhost:5500 實際匿名登入成功，重新整理維持相同 UID。最初 permission-denied；發布規則後，本人最新願望及公開集合的 server query 都成功。
- 以「Firebase 私人驗收」寄送一封明確標示用途的私人測試信（公開同意保持未勾選），實際雲端確認成功、金色信封出現；重新整理後仍能開啟相同暱稱／內容及伺服器時間（08:28）。該測試信留在正式資料庫，沒有公開或刪除。
- 1440／1024／768／390 ×900 的真實 CSS viewport 已由 Safari 檢視；信紙與木架分開，樹冠／樹幹保留比例，精靈仍在雪地。390px 可點金色信封開信；方向鍵旋轉樹後信封轉到背面會隱藏，Home 回正後恢復。沒有以手機實機觸控驗收取代說明。
- 正式公開集合目前沒有核准信件，因此實際畫面只有本人的 1 封金色信，不造假信補滿。10 封構圖使用真實 Three 變換的程式測試；正式管理員登入、核准／拒絕及多封公開信的完整瀏覽器驗收，仍待初始化管理員 claim 後進行。
- 樹上信封使用原有兩張 PNG 做 Sprite，錨點掛在原 tree 父群組，沿用 Renderer／RAF。每列兩封、五列，相對樹高 .76 / .64 / .52 / .40 / .28；精靈活動區域在其下方。背面不顯示可點擊區，前面使用至少 44px 原生按鈕供滑鼠／鍵盤點擊；亦保留下方清單供 WebGL 失敗時讀信。PNG 沒有修改、GPU 貼圖各載入一份。
- Sprite 為面向相機的紙片，採前半球顯示，並非逐葉片的精密遮擋。後續可在不改資料服務的情況下調整正式樹枝掛點與慶祝效果。

管理員登入頁已在 Safari 實際開啟，SDK 初始化後登入按鈕可用，尚未輸入或讀取管理員密碼。本機沒有 Application Default Credentials，因此沒有執行正式 claim 授權。
