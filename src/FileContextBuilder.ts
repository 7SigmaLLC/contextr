import { FileCollector } from './collector/FileCollector';
import { FileCollectorConfig, FileContext } from './types';

export class FileContextBuilder {
  private config: FileCollectorConfig;

  constructor(config: FileCollectorConfig) {
    this.config = config;
  }

  public async build(): Promise<FileContext> {
    const collector = new FileCollector(this.config);
    const files = await collector.collectFiles();
    return { config: this.config, files };
  }
}