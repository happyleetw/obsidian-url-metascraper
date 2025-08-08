import { App, Plugin, PluginSettingTab, Setting, Notice, TFile } from 'obsidian';

// 型別定義
interface MetadataResponse {
  success: boolean;
  data?: MetadataData;
  error?: string;
}

interface MetadataData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  publisher?: string;
  logo?: string;
}

interface BookmarkMatch {
  fullMatch: string;
  url: string;
  startIndex: number;
  endIndex: number;
}

interface PluginSettings {
  apiEndpoint: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  apiEndpoint: 'https://url-metascraper.happylee-tw.workers.dev/scraper'
}

export default class UrlBookmarkConverterPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    // 添加命令
    this.addCommand({
      id: 'convert-bookmarks',
      name: '轉換書籤',
      callback: () => this.convertBookmarks()
    });

    // 添加設定頁面
    this.addSettingTab(new SettingTab(this.app, this));
  }

  onunload() {
    // 清理資源
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async convertBookmarks() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('請先開啟一個 Markdown 檔案');
      return;
    }

    try {
      // 讀取檔案內容
      const content = await this.app.vault.read(activeFile);
      
      // 尋找需要轉換的書籤
      const matches = this.findBookmarkPatterns(content);
      
      if (matches.length === 0) {
        new Notice('未找到需要轉換的書籤模式');
        return;
      }

      new Notice(`找到 ${matches.length} 個需要轉換的書籤，開始處理...`);

      // 處理每個書籤
      let newContent = content;
      let offset = 0;

      for (const match of matches) {
        try {
          const metadata = await this.fetchMetadata(match.url);
          
          if (metadata.success && metadata.data) {
            const bookmarkHtml = this.generateBookmarkHtml(metadata.data);
            
            // 計算實際位置（考慮之前的替換造成的偏移）
            const actualStart = match.startIndex + offset;
            const actualEnd = match.endIndex + offset;
            
            // 替換內容
            newContent = newContent.slice(0, actualStart) + 
                        bookmarkHtml + 
                        newContent.slice(actualEnd);
            
            // 更新偏移量
            offset += bookmarkHtml.length - match.fullMatch.length;
            
            new Notice(`✅ 成功轉換: ${metadata.data.title || match.url}`);
            
          } else {
            // API 失敗時插入錯誤訊息
            const errorMessage = `%% 轉換失敗: ${metadata.error || '未知錯誤'} %%`;
            const actualStart = match.startIndex + offset;
            const actualEnd = match.endIndex + offset;
            
            newContent = newContent.slice(0, actualStart) + 
                        errorMessage + '\n' + match.fullMatch.replace('%%bookmarkthis%%\n', '') + 
                        newContent.slice(actualEnd);
            
            offset += errorMessage.length + 1 - '%%bookmarkthis%%\n'.length;
            
            new Notice(`❌ 轉換失敗: ${match.url}`);
          }
          
          // 避免請求過於頻繁
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error('處理書籤時發生錯誤:', error);
          new Notice(`❌ 處理書籤時發生錯誤: ${match.url}`);
        }
      }

      // 寫回檔案
      await this.app.vault.modify(activeFile, newContent);
      new Notice('書籤轉換完成！');

    } catch (error) {
      console.error('轉換書籤時發生錯誤:', error);
      new Notice('轉換書籤時發生錯誤，請查看控制台');
    }
  }

  findBookmarkPatterns(content: string): BookmarkMatch[] {
    const matches: BookmarkMatch[] = [];
    
    // 正則表達式：尋找 %%bookmarkthis%%\n![任意文字](URL) 模式
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

  async fetchMetadata(url: string): Promise<MetadataResponse> {
    try {
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${this.settings.apiEndpoint}/${encodedUrl}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: MetadataResponse = await response.json();
      return data;
      
    } catch (error) {
      console.error('API 請求失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateBookmarkHtml(metadata: MetadataData): string {
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
}

class SettingTab extends PluginSettingTab {
  plugin: UrlBookmarkConverterPlugin;

  constructor(app: App, plugin: UrlBookmarkConverterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'URL Bookmark Converter 設定' });

    new Setting(containerEl)
      .setName('API 端點')
      .setDesc('Metascraper Worker 的 API 端點網址')
      .addText(text => text
        .setPlaceholder('https://happylee.app/scraper')
        .setValue(this.plugin.settings.apiEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.apiEndpoint = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', { text: '使用說明' });
    
    const instructions = containerEl.createEl('div');
    instructions.innerHTML = `
      <p>使用此插件轉換書籤的步驟：</p>
      <ol>
        <li>在 Markdown 檔案中使用以下格式標記要轉換的 URL：</li>
        <li><code>%%bookmarkthis%%</code></li>
        <li><code>![描述文字](網址)</code></li>
        <li>執行「轉換書籤」命令</li>
        <li>插件會自動獲取網頁元數據並轉換為 HTML 書籤卡片</li>
      </ol>
      <p><strong>注意：</strong>轉換失敗時會保留原始內容並添加錯誤訊息。</p>
    `;
  }
}
