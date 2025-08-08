// 共用的型別定義

export interface MetadataResponse {
  success: boolean;
  data?: MetadataData;
  error?: string;
}

export interface MetadataData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  publisher?: string;
  logo?: string;
}

// Plugin 中使用的介面
export interface BookmarkMatch {
  fullMatch: string;
  url: string;
  startIndex: number;
  endIndex: number;
}
