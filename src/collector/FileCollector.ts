import fg from 'fast-glob';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileCollectorConfig, CollectedFile } from '../types';

export class FileCollector {
  private config: FileCollectorConfig;

  constructor(config: FileCollectorConfig) {
    this.config = config;
  }

  public async collectFiles(): Promise<CollectedFile[]> {
    const filePaths: Set<string> = new Set();

    // Process directories specified in includeDirs
    if (this.config.includeDirs) {
      for (const dirConfig of this.config.includeDirs) {
        const patterns = dirConfig.include.map(pattern =>
          path.join(dirConfig.path, pattern)
        );
        const options = {
          onlyFiles: true,
          deep: dirConfig.recursive ? Infinity : 1,
        };
        const matches = await fg(patterns, options);
        matches.forEach(match => filePaths.add(match));
      }
    }

    // Process explicit file paths
    if (this.config.includeFiles) {
      this.config.includeFiles.forEach(file => filePaths.add(file));
    }

    const results: CollectedFile[] = [];
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        const lineCount = content.split('\n').length;
        const absoluteFilePath = path.resolve(filePath);
        const relativePath = path.relative(process.cwd(), absoluteFilePath);
        results.push({ filePath, relativePath, content, fileSize, lineCount });
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
      }
    }
    return results;
  }
}