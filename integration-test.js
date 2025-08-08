// 整合測試腳本 - 模擬 Obsidian Plugin 的書籤轉換功能

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  apiEndpoint: 'https://url-metascraper.happylee-tw.workers.dev/scraper', // workers.dev API 端點
  testFile: 'test-content.md',
  outputFile: 'test-content-workers-dev.md'
};

// 模擬 Plugin 的核心功能
class BookmarkConverter {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
  }

  // 尋找書籤模式
  findBookmarkPatterns(content) {
    const matches = [];
    const pattern = /%%bookmarkthis%%\n!\[[^\]]*\]\(([^)]+)\)/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        url: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return matches;
  }

  // 獲取元數據
  async fetchMetadata(url) {
    try {
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${this.apiEndpoint}/${encodedUrl}`;
      
      console.log(`🔗 正在獲取元數據: ${url}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ API 請求失敗:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成書籤 HTML
  generateBookmarkHtml(metadata) {
    const title = metadata.title || '無標題';
    const description = metadata.description || '無描述';
    const url = metadata.url || '';
    const image = metadata.image || '';
    const author = metadata.author || '';
    const publisher = metadata.publisher || '';
    const logo = metadata.logo || '';

    return `<figure class="kg-card kg-bookmark-card">
    <a href="${url}" class="kg-bookmark-container">
        <div class="kg-bookmark-content">
            <div class="kg-bookmark-title">${title}</div>
            <div class="kg-bookmark-description">${description}</div>
            <div class="kg-bookmark-metadata">
                ${logo ? `<img src="${logo}" class="kg-bookmark-icon">` : ''}
                ${author ? `<span class="kg-bookmark-author">${author}</span>` : ''}
                ${publisher ? `<span class="kg-bookmark-publisher">${publisher}</span>` : ''}
            </div>
        </div>
        ${image ? `<div class="kg-bookmark-thumbnail">
            <img src="${image}">
        </div>` : ''}
    </a>
</figure>`;
  }

  // 轉換書籤
  async convertBookmarks(content) {
    const matches = this.findBookmarkPatterns(content);
    
    if (matches.length === 0) {
      console.log('📝 未找到需要轉換的書籤模式');
      return content;
    }

    console.log(`📚 找到 ${matches.length} 個需要轉換的書籤`);

    let newContent = content;
    let offset = 0;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        console.log(`\n📖 處理第 ${i + 1}/${matches.length} 個書籤...`);
        
        const metadata = await this.fetchMetadata(match.url);
        
        if (metadata.success && metadata.data) {
          const bookmarkHtml = this.generateBookmarkHtml(metadata.data);
          
          const actualStart = match.startIndex + offset;
          const actualEnd = match.endIndex + offset;
          
          newContent = newContent.slice(0, actualStart) + 
                      bookmarkHtml + 
                      newContent.slice(actualEnd);
          
          offset += bookmarkHtml.length - match.fullMatch.length;
          
          console.log(`✅ 成功轉換: ${metadata.data.title || match.url}`);
          
        } else {
          const errorMessage = `%% 轉換失敗: ${metadata.error || '未知錯誤'} %%`;
          const actualStart = match.startIndex + offset;
          const actualEnd = match.endIndex + offset;
          
          newContent = newContent.slice(0, actualStart) + 
                      errorMessage + '\n' + match.fullMatch.replace('%%bookmarkthis%%\n', '') + 
                      newContent.slice(actualEnd);
          
          offset += errorMessage.length + 1 - '%%bookmarkthis%%\n'.length;
          
          console.log(`❌ 轉換失敗: ${match.url}`);
        }
        
        // 避免請求過於頻繁
        if (i < matches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ 處理書籤時發生錯誤: ${match.url}`, error.message);
      }
    }

    return newContent;
  }
}

// 檢查 Worker 狀態
async function checkWorkerStatus(endpoint) {
  try {
    // 使用簡單的 URL 來測試 Worker 狀態
    const testUrl = encodeURIComponent('https://example.com');
    const response = await fetch(`${endpoint}/${testUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js integration test)'
      }
    });
    
    if (response.ok) {
      console.log('🟢 Worker 狀態: 連線成功');
      return true;
    } else {
      console.log(`🟡 Worker 狀態: HTTP ${response.status}`);
      return true; // 即使是錯誤回應，也表示 Worker 有回應
    }
  } catch (error) {
    console.log('🔴 Worker 狀態: 無法連線');
    console.log('錯誤:', error.message);
    
    // 如果是 fetch 相關錯誤，可能是 Node.js 版本問題，嘗試提示用戶
    if (error.message.includes('fetch')) {
      console.log('💡 提示: 如果您使用較舊的 Node.js 版本，可能需要安裝 node-fetch 或升級到 Node.js 18+');
    }
    return false;
  }
}

// 主測試函數
async function runIntegrationTest() {
  console.log('🚀 開始整合測試...\n');
  
  // 檢查 fetch 是否可用
  if (typeof fetch === 'undefined') {
    console.log('❌ fetch 不可用，請升級到 Node.js 18+ 或安裝 node-fetch');
    process.exit(1);
  }
  
  console.log(`📍 API 端點: ${CONFIG.apiEndpoint}`);

  // 檢查 Worker 狀態
  const isWorkerRunning = await checkWorkerStatus(CONFIG.apiEndpoint);
  if (!isWorkerRunning) {
    console.log('💡 雖然連線測試失敗，但讓我們繼續嘗試實際的測試...');
    console.log('   (有時候簡單的連線測試會失敗，但實際 API 調用可能成功)\n');
  }

  // 讀取測試檔案
  if (!fs.existsSync(CONFIG.testFile)) {
    console.error(`❌ 測試檔案不存在: ${CONFIG.testFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CONFIG.testFile, 'utf8');
  console.log(`📄 讀取測試檔案: ${CONFIG.testFile}\n`);

  // 執行轉換
  const converter = new BookmarkConverter(CONFIG.apiEndpoint);
  const convertedContent = await converter.convertBookmarks(content);

  // 寫入結果檔案
  fs.writeFileSync(CONFIG.outputFile, convertedContent);
  console.log(`\n💾 轉換結果已儲存至: ${CONFIG.outputFile}`);

  // 顯示轉換前後的比較
  console.log('\n' + '='.repeat(60));
  console.log('📊 轉換統計:');
  console.log(`原始檔案大小: ${content.length} 字元`);
  console.log(`轉換後大小: ${convertedContent.length} 字元`);
  console.log(`差異: ${convertedContent.length - content.length > 0 ? '+' : ''}${convertedContent.length - content.length} 字元`);

  console.log('\n✨ 整合測試完成！');
}

// 執行測試
if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });
}
