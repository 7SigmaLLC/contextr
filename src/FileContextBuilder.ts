import { FileCollector } from './collector/FileCollector';
import { FileCollectorConfig, FileContext } from './types';
import { ConsoleRenderer } from './renderers/ConsoleRenderer';
import { JsonRenderer } from './renderers/JsonRenderer';

export class FileContextBuilder {
  protected config: FileCollectorConfig;
  protected collector: FileCollector;

  constructor(config: FileCollectorConfig = {}) {
    this.config = config;
    this.collector = new FileCollector(this.config);
  }

  /**
   * Build context with files
   * @param format Optional output format (uses configured renderer if not specified)
   * @returns File context with collected files
   */
  public async build(format?: string): Promise<FileContext> {
    // Collect files
    const files = await this.collector.collectFiles();

    // Create base context
    const context: FileContext = {
      config: this.config,
      files,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
    };

    // Render output if format is specified
    if (format) {
      context.output = await this.renderOutput(context, format);
    }

    return context;
  }

  /**
   * Build context with a custom renderer
   * @param renderer Custom renderer to use
   * @returns File context with rendered output
   */
  public async buildWithRenderer(renderer: any): Promise<FileContext> {
    const context = await this.build();
    context.output = await this.renderWithCustomRenderer(context, renderer);
    return context;
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  public getConfig(): FileCollectorConfig {
    return this.config;
  }

  /**
   * Set new configuration
   * @param config New configuration
   */
  public setConfig(config: FileCollectorConfig): void {
    this.config = config;
    this.collector = new FileCollector(this.config);
  }

  /**
   * Render output with a specific format
   * @param context File context
   * @param format Output format
   * @returns Rendered output
   */
  protected async renderOutput(context: FileContext, format: string): Promise<string> {
    switch (format.toLowerCase()) {
      case 'json':
        return new JsonRenderer().render(context);
      case 'console':
      default:
        return new ConsoleRenderer().render(context);
    }
  }

  /**
   * Render with a custom renderer
   * @param context File context
   * @param renderer Custom renderer
   * @returns Rendered output
   */
  protected async renderWithCustomRenderer(context: FileContext, renderer: any): Promise<string> {
    return renderer.render(context);
  }
}