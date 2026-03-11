# 四象限待辦平台

以 React + Vite + Firebase 建立的四象限待辦事項管理平台，支援：

- 多帳號登入與資料隔離（Firebase Authentication）
- 雲端待辦資料儲存（Firestore）
- 繁體中文、簡體中文、英文、日文介面切換
- 四象限圖與列表切換
- 依欄位排序的列表檢視
- 深色 / 淺色模式


# 部署手冊

本專案是一個以 **React + Vite + Firebase** 建立的任務管理系統。特別之處在於：本專案採用 **「雲端自動化部署流程」**，開發者本地電腦不需要安裝 Node.js 或 Firebase CLI，僅需透過瀏覽器與 GitHub 即可完成所有維護與更新。

## 🚀 部署架構

* **託管平台**：Firebase Hosting (Static)
* **後端服務**：Firebase Authentication & Cloud Firestore
* **自動化工具**：GitHub Actions (負責雲端編譯與部署)

---

## 🛠 初始化設定步驟 (GUI)

### 1. Firebase 專案設定

1. 前往 [Firebase Console](https://console.firebase.google.com/) 建立新專案。
2. **啟用服務**：
* **Authentication**：啟用「電子郵件/密碼」登入方式。
* **Firestore Database**：建立資料庫，建議位置選擇 `asia-east1` (台灣)。


3. **註冊 Web App**：取得 Firebase Config (包含 `apiKey`, `appId` 等資訊)。

### 2. Google Cloud 權限配置

為了讓 GitHub 有權限代為部署，需設定服務帳號：

1. 前往 [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam)。
2. 建立服務帳號（確認 Project ID 必須是 `the-4-ds-todo-list`）。
3. 賦予該帳號以下角色：
* `Editor` (或細分為 `Firebase Admin` + `Service Usage Consumer`)。


4. 產生 **JSON 金鑰** 並下載備用。
5. 在 Google Cloud [API 庫](https://console.developers.google.com/apis/library) 啟用 **Firebase Management API**。

### 3. GitHub 儲存庫設定

1. 將程式碼上傳至 GitHub。
2. 在 Repo 的 **Settings > Secrets and variables > Actions** 中新增以下祕密 (Secrets)：
* `FIREBASE_SERVICE_ACCOUNT_THE_4_DS_TODO_LIST`：貼入下載的 JSON 金鑰全文。
* 以及所有 Firebase Web App 設定（以 `VITE_` 開頭，例如 `VITE_FIREBASE_API_KEY`）。



---

## 🤖 自動化部署流程

本專案使用 GitHub Actions。當你將程式碼推送到 `main` 分支時，會觸發以下動作：

1. **環境架設**：在 GitHub 伺服器啟動 Ubuntu 與 Node.js 環境。
2. **依賴安裝**：執行 `npm install`。
3. **雲端編譯**：執行 `npm run build`，並將 Secrets 注入環境變數。
4. **發布上線**：使用 Firebase Hosting Action 將 `dist` 資料夾內容推送到網站。

### 部署腳本位置

`.github/workflows/firebase-hosting-merge.yml`

---

## 📝 後續維護指令 (無 Node 環境下)

如果你想在沒有 Node.js 的環境修改程式碼：

1. 直接在 GitHub 網頁端編輯檔案（例如修改 `src/translations.js` 中的文字）。
2. 點擊 **Commit changes**。
3. 前往 GitHub 的 **Actions** 分頁查看部署進度。
4. 部署成功後，重新整理網站即可看到更新。

---

## 📁 檔案結構說明

* `src/`：React 原始碼。
* `firestore.rules`：Firestore 安全性規則（確保資料隔離）。
* `firebase.json`：Firebase Hosting 路由設定（支援 Single Page App）。
* `dist/`：編譯後的成品目錄（由 GitHub Actions 自動產生，不需手動上傳）。
