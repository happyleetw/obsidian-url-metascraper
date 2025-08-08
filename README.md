# Obsidian URL Metascraper 專案

這是一個完整的解決方案，結合 Cloudflare Worker 和 Obsidian Plugin，實現自動將 URL 轉換為豐富的書籤卡片。

## 🏗️ 架構概覽

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Obsidian       │    │  Cloudflare     │    │  目標網站        │
│  Plugin         │───▶│  Worker         │───▶│  (任意URL)      │
│                 │    │                 │    │                 │
│  - 文件解析      │    │  - metascraper  │    │  - HTML內容     │
│  - 內容替換      │    │  - 元數據提取    │    │  - Meta標籤     │
│  - 格式轉換      │    │  - API回傳      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 專案結構

```
obsidian-url-metascraper/
├── cloudflare-worker/          # Cloudflare Worker
│   ├── src/index.js           # Worker 主程式
│   ├── wrangler.toml          # Worker 配置
│   ├── package.json           # 依賴管理
│   └── test-worker.js         # Worker 測試
│
├── obsidian-plugin/           # Obsidian Plugin
│   ├── src/main.ts           # Plugin 主程式
│   ├── manifest.json         # Plugin 資訊
│   ├── tsconfig.json         # TypeScript 配置
│   ├── esbuild.config.mjs    # 建置配置
│   └── package.json          # 依賴管理
│
├── shared/                   # 共用型別定義
│   └── types.ts
│
├── test-content.md          # 測試用 Markdown 檔案
├── integration-test.js      # 整合測試腳本
└── README.md               # 本文件
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
# Worker 依賴
cd cloudflare-worker
npm install

# Plugin 依賴  
cd ../obsidian-plugin
npm install
```

### 2. 啟動 Cloudflare Worker (開發環境)

```bash
cd cloudflare-worker
npm run dev
```

Worker 將在 `http://localhost:8787` 啟動

### 3. 建置 Obsidian Plugin

```bash
cd obsidian-plugin
npm run build
```

### 4. 執行整合測試

```bash
# 在專案根目錄
node integration-test.js
```

## 📝 使用方法

### 在 Markdown 檔案中標記 URL

```markdown
%%bookmarkthis%%
![描述文字](https://example.com)
```

### 執行轉換命令

在 Obsidian 中使用 `轉換書籤` 命令，或在命令面板搜尋 "Convert Bookmarks"

### 轉換結果

```html
<figure class="kg-card kg-bookmark-card">
    <a href="https://example.com" class="kg-bookmark-container">
        <div class="kg-bookmark-content">
            <div class="kg-bookmark-title">網頁標題</div>
            <div class="kg-bookmark-description">網頁描述</div>
            <div class="kg-bookmark-metadata">
                <img src="logo.png" class="kg-bookmark-icon">
                <span class="kg-bookmark-author">作者</span>
                <span class="kg-bookmark-publisher">發布者</span>
            </div>
        </div>
        <div class="kg-bookmark-thumbnail">
            <img src="thumbnail.jpg">
        </div>
    </a>
</figure>
```

## ⚙️ 配置

### Worker 配置 (wrangler.toml)

```toml
name = "url-metascraper"
main = "src/index.js"
compatibility_date = "2024-12-26"
compatibility_flags = ["nodejs_compat"]

[env.production]
routes = [
  { pattern = "happylee.app/scraper/*", zone_name = "happylee.app" }
]
```

### Plugin 設定

在 Obsidian 設定中可以修改：
- API 端點網址 (預設: https://happylee.app/scraper)

## 🧪 測試

### Worker 測試

```bash
cd cloudflare-worker
node test-worker.js
```

### 整合測試

```bash
node integration-test.js
```

測試檔案：`test-content.md` → 轉換結果：`test-content-converted.md`

## 🚀 部署

### 部署 Cloudflare Worker

```bash
cd cloudflare-worker
npm run deploy
```

### 安裝 Obsidian Plugin

1. 將 `obsidian-plugin` 資料夾複製到 Obsidian vault 的 `.obsidian/plugins/` 目錄
2. 在 Obsidian 設定中啟用 "URL Bookmark Converter" plugin

## ✨ 功能特色

### ✅ 支援的功能

- **跨平台相容**: Desktop 和 Mobile 都支援
- **自動元數據提取**: 標題、描述、圖片、作者等
- **錯誤處理**: 失敗時保留原內容並顯示錯誤訊息
- **批次處理**: 一次轉換多個 URL
- **進度顯示**: 處理過程中的即時反饋

### 🎯 支援的元數據

- `title` - 網頁標題
- `description` - 網頁描述  
- `image` - 縮圖
- `url` - 標準化網址
- `author` - 作者
- `publisher` - 發布者
- `logo` - 網站圖示

## 🔧 技術細節

### 核心套件

- **metascraper**: 元數據提取
- **Cloudflare Workers**: 無伺服器運算
- **Obsidian API**: Plugin 開發框架
- **TypeScript**: 型別安全
- **esbuild**: 快速建置

### API 端點

```
GET https://happylee.app/scraper/{encoded_url}

Response:
{
  "success": true,
  "data": {
    "title": "...",
    "description": "...",
    "image": "...",
    "url": "...",
    "author": "...",
    "publisher": "...",
    "logo": "..."
  }
}
```

## 🐛 錯誤處理

### 常見錯誤

1. **Worker 無法連線**: 確認 Worker 正在運行
2. **URL 無效**: 檢查 URL 格式是否正確
3. **網頁無法存取**: 目標網站可能有防護機制
4. **元數據不完整**: 部分網站可能缺少某些 meta 標籤

### 錯誤訊息格式

轉換失敗時會在原始內容前加上錯誤訊息：

```markdown
%% 轉換失敗: 具體錯誤原因 %%
![原始描述](原始URL)
```

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！