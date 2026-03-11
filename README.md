# 四象限待辦平台

以 React + Vite + Firebase 建立的四象限待辦事項管理平台，支援：

- 多帳號登入與資料隔離（Firebase Authentication）
- 雲端待辦資料儲存（Firestore）
- 繁體中文、簡體中文、英文、日文介面切換
- 四象限圖與列表切換
- 依欄位排序的列表檢視
- 深色 / 淺色模式

## 本機開發

1. 建立 Firebase 專案並新增 Web App。
2. 複製環境變數範本：

   ```bash
   cp .env.example .env.local
   ```

3. 將 Firebase Web App 的設定填入 `.env.local`。
4. 安裝依賴：

   ```bash
   npm install
   ```

5. 啟用 Firebase Console 內的：
   - Authentication -> Sign-in method -> Email/Password
   - Firestore Database
6. 啟動開發環境：

   ```bash
   npm run dev
   ```

## 資料結構

- 使用者待辦資料存放於 `users/{uid}/todos/{todoId}`
- 每筆待辦欄位：
  - `title`
  - `dueDate`
  - `dueTime`
  - `dueAt`
  - `importance`
  - `notes`
  - `createdAt`
  - `updatedAt`

## Firebase Hosting 部署步驟

1. 安裝 Firebase CLI：

   ```bash
   npm install -g firebase-tools
   ```

2. 登入 Firebase：

   ```bash
   firebase login
   ```

3. 綁定 Firebase 專案：

   ```bash
   firebase use --add
   ```

4. 建置前端：

   ```bash
   npm run build
   ```

5. 部署 Hosting 與 Firestore 規則：

   ```bash
   firebase deploy --only hosting,firestore:rules,firestore:indexes
   ```

## 補充

- Hosting 設定已寫在 `firebase.json`
- Firestore 規則已寫在 `firestore.rules`
- 若只想更新前端，可執行：

  ```bash
  firebase deploy --only hosting
  ```
# The-4-Ds-Todo-List
