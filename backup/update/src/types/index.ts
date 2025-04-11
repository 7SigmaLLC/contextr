export interface IncludeDirConfig {
    path: string;
    include: string[];
    exclude?: string[];
    recursive: boolean;
    useRegex?: boolean;
  }
  
  export interface FileCollectorConfig {
    name: string;
    showContents: boolean;
    showMeta: boolean;
    includeDirs?: IncludeDirConfig[];
    includeFiles?: string[];
    excludeFiles?: string[];
    useRegex?: boolean;
    searchInFiles?: {
      pattern: string;
      isRegex: boolean;
    };
  }
  
  export interface CollectedFile {
    filePath: string;
    relativePath: string;
    content: string;
    fileSize: number;
    lineCount: number;
  }
  
  export interface FileContext {
    config: FileCollectorConfig;
    files: CollectedFile[];
  }