import metascraper from 'metascraper';
import description from 'metascraper-description';
import image from 'metascraper-image';
import title from 'metascraper-title';
import url from 'metascraper-url';
import author from 'metascraper-author';
import publisher from 'metascraper-publisher';
import logo from 'metascraper-logo';

// 初始化 metascraper
const scraper = metascraper([
  description(),
  image(),
  title(),
  url(),
  author(),
  publisher(),
  logo()
]);

export default {
  async fetch(request, env, ctx) {
    // 處理 CORS
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // 檢查路徑格式: /scraper/{encoded_url}
      const match = pathname.match(/^\/scraper\/(.+)$/);
      if (!match) {
        return createErrorResponse('Invalid URL format. Use /scraper/{encoded_url}', 400);
      }

      // 解碼目標 URL
      const targetUrl = decodeURIComponent(match[1]);
      
      // 驗證 URL 格式
      if (!isValidUrl(targetUrl)) {
        return createErrorResponse('Invalid URL provided', 400);
      }

      console.log(`正在抓取網頁: ${targetUrl}`);

      // 獲取網頁內容
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        return createErrorResponse(`Failed to fetch URL: ${response.status} ${response.statusText}`, 500);
      }

      const html = await response.text();

      // 使用 metascraper 提取元數據
      const metadata = await scraper({ html, url: targetUrl });

      // 返回成功結果
      return createSuccessResponse({
        title: metadata.title || '',
        description: metadata.description || '',
        image: metadata.image || '',
        url: metadata.url || targetUrl,
        author: metadata.author || '',
        publisher: metadata.publisher || '',
        logo: metadata.logo || ''
      });

    } catch (error) {
      console.error('Worker 錯誤:', error);
      return createErrorResponse(`Internal server error: ${error.message}`, 500);
    }
  }
};

// 驗證 URL 格式
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// 創建成功回應
function createSuccessResponse(data) {
  return new Response(JSON.stringify({
    success: true,
    data: data
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// 創建錯誤回應
function createErrorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// 處理 CORS 預檢請求
function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
