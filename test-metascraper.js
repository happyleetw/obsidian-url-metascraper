const metascraper = require('metascraper')([
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-title')(),
  require('metascraper-url')()
]);

const { got } = require('got');

async function scrapeUrl(url) {
  try {
    console.log(`正在抓取網頁: ${url}`);
    
    // 獲取網頁 HTML 內容
    const { body: html, url: responseUrl } = await got(url);
    
    // 使用 metascraper 提取元數據
    const metadata = await metascraper({ html, url: responseUrl });
    
    console.log('\n===== 提取的元數據 =====');
    console.log('標題:', metadata.title);
    console.log('描述:', metadata.description);
    console.log('圖片:', metadata.image);
    console.log('網址:', metadata.url);
    console.log('========================\n');
    
    return metadata;
    
  } catch (error) {
    console.error('抓取網頁時發生錯誤:', error.message);
    return null;
  }
}

// 格式化為 Markdown 連結的函數
function formatAsMarkdownLink(metadata, customFormat = null) {
  if (!metadata) return null;
  
  if (customFormat) {
    // 允許自定義格式，使用變數替換
    return customFormat
      .replace('{title}', metadata.title || '無標題')
      .replace('{description}', metadata.description || '無描述')
      .replace('{url}', metadata.url || '')
      .replace('{image}', metadata.image || '');
  }
  
  // 預設格式：[標題](網址) - 描述
  const title = metadata.title || '無標題';
  const url = metadata.url || '';
  const description = metadata.description || '';
  
  return `[${title}](${url})${description ? ' - ' + description : ''}`;
}

// 測試不同的網站
async function runTests() {
  const testUrls = [
    'https://github.com/microlinkhq/metascraper',
    'https://www.npmjs.com/package/metascraper',
    'https://docs.obsidian.md/'
  ];
  
  console.log('開始測試 metascraper...\n');
  
  for (const url of testUrls) {
    const metadata = await scrapeUrl(url);
    
    if (metadata) {
      console.log('格式化為 Markdown:');
      console.log(formatAsMarkdownLink(metadata));
      
      console.log('\n自定義格式範例:');
      console.log(formatAsMarkdownLink(metadata, '**{title}** ({url}) - _{description}_'));
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
    // 避免請求過於頻繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  scrapeUrl,
  formatAsMarkdownLink
};
