export interface IncludeDirConfig {
    path: string;
    include: string[];
    exclude?: string[];
    recursive: boolean;
    useRegex?: boolean;
  }

  export interface FileCollectorConfig {
    name?: string;
    showContents?: boolean;
    showMeta?: boolean;
    includeDirs?: IncludeDirConfig[];
    includeFiles?: string[];
    excludeFiles?: string[];
    useRegex?: boolean;
    searchInFiles?: {
      pattern: string;
      isRegex: boolean;
    };
    listOnlyFiles?: string[];
  }

  export interface CollectedFile {
    filePath: string;
    relativePath?: string;
    content: string;
    fileSize?: number;
    lineCount?: number;
    meta?: {
      size?: number;
      lastModified?: number;
      type?: string;
      securityIssues?: SecurityIssue[];
      securityTransformed?: boolean;
      securityTransformedReason?: string;
      llmReviews?: Record<string, any>;
      llmProjectSummary?: Record<string, any>;
      isListOnly?: boolean;
      error?: string;
      [key: string]: any;
    };
  }

  export enum SecurityIssueSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
  }

  export interface SecurityIssue {
    description: string;
    severity: SecurityIssueSeverity;
    filePath?: string;
    line?: number;
    column?: number;
    code?: string;
    recommendation?: string;
    scanner?: string;
    remediation?: string;
    content?: string;
    [key: string]: any;
  }

  export interface FileContext {
    config: FileCollectorConfig;
    files: CollectedFile[];
    output?: string;
    totalFiles?: number;
    totalSize?: number;
  }

  export interface PluginEnabledConfig extends FileCollectorConfig {
    enablePlugins?: boolean;
    securityScanners?: string[];
    securityScannerConfig?: any;
    outputRenderers?: string[];
    outputRendererConfig?: any;
    llmReviewers?: string[];
    llmReviewerConfig?: any;
    generateSecurityReports?: boolean;
    generateSummaries?: boolean;
  }

  export interface PluginEnabledBuildResult extends FileContext {
    securityReports?: any[];
    summaries?: Record<string, any>;
  }

  export enum PluginType {
    SECURITY_SCANNER = 'security-scanner',
    OUTPUT_RENDERER = 'output-renderer',
    LLM_REVIEWER = 'llm-reviewer'
  }

  export interface Plugin {
    id: string;
    name: string;
    description: string;
    type: PluginType;
    version: string;
    author?: string;
    homepage?: string;
    isEnabled: boolean;
    isAvailable?(): Promise<boolean>;
    initialize?(): Promise<void>;
    cleanup?(): Promise<void>;
  }

  export interface SecurityScannerPlugin extends Plugin {
    type: PluginType.SECURITY_SCANNER;

    /**
     * Scan files for security issues
     * @param files Files to scan
     * @param config Configuration for the scanner
     * @returns Files with security warnings added to metadata
     */
    scan(files: CollectedFile[], config?: any): Promise<CollectedFile[]>;

    /**
     * Get security warnings as a separate report
     * @param files Files to scan
     * @param config Configuration for the scanner
     * @returns Security report
     */
    generateSecurityReport?(files: CollectedFile[], config?: any): Promise<any>;

    /**
     * Alternative method name for scanning files
     * @deprecated Use scan instead
     */
    scanFiles?(files: CollectedFile[], config?: any): Promise<CollectedFile[]>;
  }

  export interface OutputRendererPlugin extends Plugin {
    type: PluginType.OUTPUT_RENDERER;

    /**
     * Render files to a specific output format
     * @param context Context containing files to render
     * @param config Configuration for the renderer
     * @returns Rendered output
     */
    render(context: FileContext | { files: CollectedFile[] }, config?: any): string | Promise<string>;

    /**
     * Get the format name for this renderer
     */
    getFormatName(): string;
  }

  export interface LLMReviewerPlugin extends Plugin {
    type: PluginType.LLM_REVIEWER;

    /**
     * Review files using an LLM
     * @param files Files to review
     * @param config Configuration for the reviewer
     * @returns Files with review comments added to metadata
     */
    reviewFiles(files: CollectedFile[], config?: any): Promise<CollectedFile[]>;

    /**
     * Generate a summary of the review
     * @param files Files that were reviewed
     * @param config Configuration for the reviewer
     * @returns Summary of the review
     */
    generateSummary?(files: CollectedFile[], config?: any): Promise<any>;

    /**
     * Check if the LLM is available
     * @returns True if the LLM is available
     */
    isAvailable(): Promise<boolean>;
  }