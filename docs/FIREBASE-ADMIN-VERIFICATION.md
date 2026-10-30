# Firebase 管理員與正式端到端驗收

日期：2026-10-29（Asia/Taipei）。專案：`holymerry`，資料庫：`(default)`。

## 實際結果

| 項目 | 結果與證據 |
| --- | --- |
| 管理員 UID | `ruJo1twnFcYZxNaYGvhrryXUCjz2`；Firebase Console 與 Admin SDK 均確認帳號存在；SDK 確認未停用、有 password provider |
| custom claim | 現有 `set-admin-claim.mjs` 先 dry run，再以 `--grant --apply` 寫入 `admin: true`，工具重新 getUser 確認成功 |
| 新 ID token | 本人在 Safari / localhost:5500/admin 登入；現有 authorize() 強制更新 token，驗證 admin claim 與 password provider 後，正式待審查詢成功 |
| 待審清單 | 實際顯示暱稱、願望內容、提交時間及公開／私人選擇；初始化後最初顯示 3 封 |
| 核准 | 從管理頁核准「47／你好」；清單由 3 封減為 2 封，Admin SDK 確認原信 approved、reviewedBy 為指定管理員，並有 reviewedAt |
| 公開副本 | 原信為 `users/imyoalRi5hMvKSEdN0MIaLNbRsH3/wishes/tqmmeLgWb70iBKDa3swT`；公開副本 `publicWishes/tqmmeLgWb70iBKDa3swT` 的暱稱、內容、ownerUid 及 createdAt 與原信一致，並有 publishedAt |
| 拒絕 | 從管理頁拒絕先前的「Firebase 私人驗收」；清單減為 1 封。SDK 確認 rejected 且沒有公開副本。未刪除原信，未操作「666」願望 |
| 核准前隔離 | 唯讀正式測試確認「47／你好」為 pending、沒有公開副本；另一個匿名工作階段不能讀原稿或私人驗收信，不能查詢審核清單；公開抽樣為 0 封 |
| 核准後隔離與公開 | 新的匿名 SDK 工作階段能讀取核准公開副本、公開抽樣為 1 封；仍無法讀取核准信的私人原稿、已拒絕私人信或審核清單 |
| 實際瀏覽器閱讀 | Safari 的原有匿名訪客與「47」作者不同；Wish 顯示自己的金色信與「47」公開信，實際點開後顯示「你好」及已核准公開標示 |
| 重新整理 | Wish 重整後仍顯示 2 封；本人金色信保持原內容與原提交時間，已拒絕不會使本人失去讀取自己的私人信的能力 |
| 規則及索引 | 沿用已發布規則及已啟用索引，本次沒有放寬或重新部署。正式 Client SDK 的管理員交易、訪客公開讀取與拒絕原稿讀取驗證其生效 |

## 無私鑰本機初始化與收尾

1. 使用 Google 官方 CLI 591.0.0，官方 ARM64 壓縮檔 SHA-256：`3b7bbaaf2dd0287fab5320359fb61c678cbd6e8d6d58b884470def1bf96589a1`。工具放於 `/private/tmp/holy-merry-gcloud`，未更改系統 PATH。
2. Google Cloud 首次服務條款與兩次 OAuth 登入均由本人處理；未讀取或輸入管理員密碼。CLI 與 SDK ADC 為分開授權。
3. 沿用 `firebase-adminsdk-fbsvc@holymerry.iam.gserviceaccount.com`，確認服務帳戶沒有金鑰。啟用 `iamcredentials.googleapis.com`，未開通 Cloud Functions 或變更計費方案。
4. 僅在這個服務帳戶上，對本人 Google 帳號加入條件式 `roles/iam.serviceAccountTokenCreator`，條件為 `request.time < timestamp("2026-10-29T02:54:00Z")`（台北 10:54）。沒有授予整個專案的 Token Creator。
5. 使用 `gcloud auth application-default login --impersonate-service-account=firebase-adminsdk-fbsvc@holymerry.iam.gserviceaccount.com --disable-quota-project` 取得 impersonated ADC。憑證只在專案外 `/private/tmp/holy-merry-gcloud-auth`，目錄 0700、ADC 檔 0600。
6. 既有 Admin SDK 工具使用該 ADC 完成唯讀確認、寫入及重讀。沒有產生或複製服務帳戶私鑰，也沒有把憑證寫入前端、儲存庫或 Live Server 目錄。
7. 完成後精確移除本次條件式 IAM binding，服務帳戶 policy 回到無 bindings；刪除 ADC 暫存檔並確認不存在；撤銷本次隔離 CLI 登入並確認無 active account。SDK 對 impersonated ADC 的 revoke 指令回報僅刪本機檔案，未宣稱所有已簽發的短期 access tokens 即時失效。

`admin: true` 保留在 Firebase Auth 帳號上，與暫時的 Google IAM 權限不同。日常審核不需要重新初始化、保留 ADC 或執行 CLI；直接開啟 `/admin` 登入即可。

## 程式與驗收工具

- `admin/index.html`：新增 `/admin` 靜態入口，導向既有 `admin.html`；Live Server 原本的 /admin 404 已在 Safari 實際確認修復。未新增第二套登入與審核邏輯。
- `tools/firebase-admin/verify-wish-access.mjs`：必須明確指定 `--project holymerry --uid ADMIN_UID --phase pending|approved`；只讀 Firestore，並建立獨立匿名 Auth 工作階段，不寫、核准、拒絕或刪除願望。pending 與 approved 兩階段均實際執行成功；後者亦確認私人驗收信被拒絕而沒有公開副本。
- `README.md`、`TESTING.md`、`FIREBASE-SETUP.md` 與 `FIREBASE-VERIFICATION.json`：更新實際狀態，保留初次整合的歷史紀錄。
- 原 `set-admin-claim.mjs`、管理頁前端、Rules、願望服務、Wish 視覺／動畫／圖片／模型及其他三頁沒有修改。新增工具的 syntax check 通過；本次重新執行的 18 項 Auth／Firestore Emulator 測試全部通過。

## 測試界線

- 正式公開池目前僅 1 封，因此實際驗收為「最多 10」中的 1 封，以及另一瀏覽器「最多 9＋自己的 1」中的 1＋1；沒有製造假公開信補滿。完整 10／9＋1 的上限與排除本人選取邏輯有既有程式測試，本次未宣稱正式 10 封視覺驗收。
- 核准前與核准後各執行一次唯讀驗收，會留下兩個額外匿名 Auth 測試帳號，沒有新增願望，也未刪除任何 Auth 帳號。
- 正式負向測試只嘗試讀取，不冒險用未授權寫入修改真實資料。一般訪客不能核准／拒絕、不能自行公開私人信的寫入拒絕測試，在 Emulator 完成。
- 本次沒有再寄信、重播摺紙／飛行或重測實體手機觸控；這些程式與素材保持原樣，先前驗收紀錄仍保留於 TESTING.md。

## 官方參考

- [Google Cloud：本機 ADC 與服務帳戶 impersonation](https://docs.cloud.google.com/docs/authentication/set-up-adc-local-dev-environment)
- [Firebase Admin SDK 與本機 end-user credentials 限制](https://firebase.google.com/docs/admin/setup#test-with-gcloud-end-user-credentials)
- [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)

一般 gcloud 使用者 ADC 不能直接假設可用於 Firebase Auth；本次採用真正的服務帳戶 impersonation，未使用 Web API key 冒充 Admin SDK 權限。
