// 測試 Cloudflare Worker 的腳本

async function testWorker() {
  const baseUrl = 'http://localhost:8787'; // Wrangler dev 預設端口
  
  const testUrls = [
    'https://github.com/microlinkhq/metascraper',
    'https://www.npmjs.com/package/metascraper',
    'https://docs.obsidian.md/'
  ];

  console.log('開始測試 Cloudflare Worker...\n');

  for (const testUrl of testUrls) {
    try {
      const encodedUrl = encodeURIComponent(testUrl);
      const apiUrl = `${baseUrl}/scraper/${encodedUrl}`;
      
      console.log(`測試 URL: ${testUrl}`);
      console.log(`API 端點: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 成功獲取元數據:');
        console.log(`  標題: ${data.data.title || '無'}`);
        console.log(`  描述: ${data.data.description ? data.data.description.substring(0, 100) + '...' : '無'}`);
        console.log(`  圖片: ${data.data.image || '無'}`);
        console.log(`  作者: ${data.data.author || '無'}`);
        console.log(`  發布者: ${data.data.publisher || '無'}`);
        console.log(`  網站圖示: ${data.data.logo || '無'}`);
      } else {
        console.log(`❌ 錯誤: ${data.error}`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // 避免請求過於頻繁
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 請求失敗: ${error.message}`);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
}

// 檢查 Worker 是否已啟動
async function checkWorkerStatus() {
  try {
    const response = await fetch('http://localhost:8787/scraper/test');
    console.log('Worker 狀態檢查: 連線成功');
    return true;
  } catch (error) {
    console.log('Worker 狀態檢查: 無法連線');
    console.log('請確保已執行 "npm run dev" 啟動 Worker');
    return false;
  }
}

// 主執行函數
async function main() {
  console.log('檢查 Worker 狀態...');
  
  const isWorkerRunning = await checkWorkerStatus();
  if (!isWorkerRunning) {
    process.exit(1);
  }
  
  await testWorker();
}

// 如果直接執行此檔案
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testWorker, checkWorkerStatus };
