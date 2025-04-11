import fastglob from "fast-glob";
import { promises as fs } from "fs";
import * as path from "path";
import { FileCollectorConfig, CollectedFile } from "../types";
import { RegexPatternMatcher } from "./RegexPatternMatcher";

export class FileCollector {
  private config: FileCollectorConfig;

  constructor(config: FileCollectorConfig) {
    this.config = config;
  }

  /**
   * Checks if a file path matches a pattern using either glob or regex
   * @param filePath The file path to check
   * @param pattern The pattern to match against
   * @param useRegex Whether to use regex matching instead of glob
   * @returns True if the file matches the pattern
   */
  private matchesPattern(filePath: string, pattern: string, useRegex: boolean): boolean {
    if (useRegex) {
      return RegexPatternMatcher.test(filePath, pattern);
    } else {
      // Use minimatch or similar for glob pattern matching
      // Fast-glob already handles this at directory level, but we need this for individual file checks
      return fastglob.isDynamicPattern(pattern) 
        ? fastglob.sync(pattern, { onlyFiles: true }).includes(filePath)
        : pattern === filePath;
    }
  }

  /**
   * Checks if a file should be excluded based on exclude patterns
   * @param filePath The file path to check
   * @param excludePatterns Array of patterns to exclude
   * @param useRegex Whether to use regex matching
   * @returns True if the file should be excluded
   */
  private shouldExcludeFile(filePath: string, excludePatterns: string[], useRegex: boolean): boolean {
    if (!excludePatterns || excludePatterns.length === 0) {
      return false;
    }
    
    return excludePatterns.some(pattern => 
      this.matchesPattern(filePath, pattern, useRegex)
    );
  }

  /**
   * Checks if file content matches the search pattern
   * @param content The file content to search in
   * @param searchPattern The pattern to search for
   * @param isRegex Whether to use regex for searching
   * @returns True if the content matches the search pattern
   */
  private contentMatchesSearch(content: string, searchPattern: string, isRegex: boolean): boolean {
    if (!searchPattern) {
      return true; // No search pattern means include all files
    }

    if (isRegex) {
      return RegexPatternMatcher.test(content, searchPattern, 'gm');
    } else {
      return content.includes(searchPattern);
    }
  }

  public async collectFiles(): Promise<CollectedFile[]> {
    const filePaths: Set<string> = new Set();
    const excludedPaths: Set<string> = new Set();

    // Process directories specified in includeDirs
    if (this.config.includeDirs) {
      for (const dirConfig of this.config.includeDirs) {
        const useRegex = dirConfig.useRegex ?? this.config.useRegex ?? false;
        
        // Handle include patterns
        if (useRegex) {
          // For regex, we need to get all files in the directory first, then filter
          const allFiles = await fastglob(path.join(dirConfig.path, '**/*'), {
            onlyFiles: true,
            deep: dirConfig.recursive ? Infinity : 1,
          });
          
          // Filter files using regex patterns
          for (const file of allFiles) {
            const shouldInclude = dirConfig.include.some(pattern => 
              this.matchesPattern(file, pattern, true)
            );
            
            if (shouldInclude) {
              filePaths.add(file);
            }
          }
        } else {
          // Use fast-glob for standard glob patterns
          const patterns = dirConfig.include.map((pattern) =>
            path.join(dirConfig.path, pattern),
          );
          const options = {
            onlyFiles: true,
            deep: dirConfig.recursive ? Infinity : 1,
          };
          const matches = await fastglob(patterns, options);
          matches.forEach((match: string) => filePaths.add(match));
        }
        
        // Handle exclude patterns if present
        if (dirConfig.exclude && dirConfig.exclude.length > 0) {
          // Get files that match exclude patterns
          if (useRegex) {
            // Filter out excluded files using regex
            for (const file of Array.from(filePaths)) {
              if (this.shouldExcludeFile(file, dirConfig.exclude, true)) {
                excludedPaths.add(file);
              }
            }
          } else {
            // Use fast-glob for standard glob exclude patterns
            const excludePatterns = dirConfig.exclude.map((pattern) =>
              path.join(dirConfig.path, pattern),
            );
            const excludedMatches = await fastglob(excludePatterns, {
              onlyFiles: true,
              deep: dirConfig.recursive ? Infinity : 1,
            });
            excludedMatches.forEach((match: string) => excludedPaths.add(match));
          }
        }
      }
    }

    // Process explicit include file paths
    if (this.config.includeFiles) {
      const useRegex = this.config.useRegex ?? false;
      
      if (useRegex) {
        // Get all files in current directory and subdirectories
        const allFiles = await fastglob('**/*', { onlyFiles: true });
        
        // Filter using regex patterns
        for (const file of allFiles) {
          const shouldInclude = this.config.includeFiles.some(pattern => 
            this.matchesPattern(file, pattern, true)
          );
          
          if (shouldInclude) {
            filePaths.add(file);
          }
        }
      } else {
        // Standard glob or direct file paths
        this.config.includeFiles.forEach((file) => filePaths.add(file));
      }
    }

    // Process explicit exclude file paths
    if (this.config.excludeFiles) {
      const useRegex = this.config.useRegex ?? false;
      
      if (useRegex) {
        // Filter out excluded files using regex
        for (const file of Array.from(filePaths)) {
          if (this.shouldExcludeFile(file, this.config.excludeFiles, true)) {
            excludedPaths.add(file);
          }
        }
      } else {
        // Use fast-glob for standard glob exclude patterns
        const excludedMatches = await fastglob(this.config.excludeFiles, { onlyFiles: true });
        excludedMatches.forEach((match: string) => excludedPaths.add(match));
      }
    }

    // Remove excluded paths from included paths
    for (const excludedPath of excludedPaths) {
      filePaths.delete(excludedPath);
    }

    const results: CollectedFile[] = [];
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, "utf8");
        
        // Check if content matches search pattern if specified
        if (this.config.searchInFiles) {
          const { pattern, isRegex } = this.config.searchInFiles;
          if (!this.contentMatchesSearch(content, pattern, isRegex)) {
            continue; // Skip this file if content doesn't match search pattern
          }
        }
        
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        const lineCount = content.split("\n").length;
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
