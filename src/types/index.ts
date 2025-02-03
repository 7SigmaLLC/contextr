export interface IncludeDirConfig {
    path: string;
    include: string[];
    recursive: boolean;
  }
  
  export interface FileCollectorConfig {
    name: string;
    showContents: boolean;
    showMeta: boolean;
    includeDirs?: IncludeDirConfig[];
    includeFiles?: string[];
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