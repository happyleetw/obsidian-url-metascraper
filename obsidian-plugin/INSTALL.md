# Obsidian Plugin 安裝說明

## 🚀 快速安裝

### 方法一：直接複製 dist 資料夾

1. **建置 Plugin**：
   ```bash
   npm run build
   ```

2. **複製到 Obsidian**：
   將整個 `dist/` 資料夾複製到您的 Obsidian vault：
   ```
   {您的vault}/.obsidian/plugins/url-bookmark-converter/
   ```

3. **檔案結構**：
   ```
   .obsidian/plugins/url-bookmark-converter/
   ├── main.js
   └── manifest.json
   ```

### 方法二：手動複製檔案

複製以下檔案到 Obsidian plugin 資料夾：
- `dist/main.js` → `.obsidian/plugins/url-bookmark-converter/main.js`  
- `dist/manifest.json` → `.obsidian/plugins/url-bookmark-converter/manifest.json`

## ⚙️ 啟用 Plugin

1. 開啟 Obsidian
2. 前往 **設定** → **社群插件**
3. 確保已開啟 **社群插件**
4. 在 **已安裝插件** 中找到 **URL Bookmark Converter**
5. 點擊切換開關啟用

## 📋 使用方法

### 1. 標記要轉換的 URL

在 Markdown 檔案中使用以下格式：

```markdown
%%bookmarkthis%%
![描述文字](https://example.com)
```

### 2. 執行轉換命令

- 使用命令面板：`Ctrl+P` (Windows) 或 `Cmd+P` (Mac)
- 搜尋並執行：**轉換書籤**

### 3. 結果

URL 會被轉換為豐富的 HTML 書籤卡片：

```html
<figure class="kg-card kg-bookmark-card">
    <a href="https://example.com" class="kg-bookmark-container">
        <div class="kg-bookmark-content">
            <div class="kg-bookmark-title">網頁標題</div>
            <div class="kg-bookmark-description">網頁描述</div>
            <div class="kg-bookmark-metadata">
                <span class="kg-bookmark-author">作者</span>
                <span class="kg-bookmark-publisher">發布者</span>
            </div>
        </div>
        <div class="kg-bookmark-thumbnail">
            <img src="縮圖網址">
        </div>
    </a>
</figure>
```

## 🔧 設定

在 Obsidian 設定中可以修改：
- **API 端點**: 預設為 `https://happylee.app/scraper`

## 📱 相容性

- ✅ **Obsidian Desktop**: 完全支援
- ✅ **Obsidian Mobile**: 完全支援
- ✅ **所有平台**: 使用 Cloudflare Worker API

## 🆘 疑難排解

### 轉換失敗
- 檢查網路連線
- 確認 URL 是否有效
- 查看是否有錯誤訊息 `%% 錯誤訊息 %%`

### Plugin 無法載入
- 確認檔案複製正確
- 重新啟動 Obsidian
- 檢查控制台錯誤訊息
