import * as path from "path";
import fastglob from "fast-glob";
import { FileCollectorConfig } from "../types";
import { RegexPatternMatcher } from "./RegexPatternMatcher";

/**
 * Helper class for managing whitelist and blacklist functionality
 */
export class WhitelistBlacklist {
  /**
   * Creates a whitelist configuration from a list of patterns
   * @param patterns Array of file patterns to include
   * @param useRegex Whether to use regex matching
   * @returns A partial FileCollectorConfig with whitelist settings
   */
  public static createWhitelist(patterns: string[], useRegex = false): Partial<FileCollectorConfig> {
    return {
      includeFiles: patterns,
      useRegex
    };
  }

  /**
   * Creates a blacklist configuration from a list of patterns
   * @param patterns Array of file patterns to exclude
   * @param useRegex Whether to use regex matching
   * @returns A partial FileCollectorConfig with blacklist settings
   */
  public static createBlacklist(patterns: string[], useRegex = false): Partial<FileCollectorConfig> {
    return {
      excludeFiles: patterns,
      useRegex
    };
  }

  /**
   * Merges a whitelist and blacklist configuration
   * @param whitelist Whitelist configuration
   * @param blacklist Blacklist configuration
   * @returns A merged FileCollectorConfig
   */
  public static mergeConfigs(
    whitelist: Partial<FileCollectorConfig>, 
    blacklist: Partial<FileCollectorConfig>
  ): Partial<FileCollectorConfig> {
    return {
      includeFiles: whitelist.includeFiles,
      excludeFiles: blacklist.excludeFiles,
      useRegex: whitelist.useRegex || blacklist.useRegex
    };
  }

  /**
   * Creates a combined configuration with both directory and file patterns
   * @param dirPatterns Directory patterns to include
   * @param filePatterns File patterns to include
   * @param excludePatterns Patterns to exclude
   * @param useRegex Whether to use regex matching
   * @returns A complete FileCollectorConfig
   */
  public static createConfig(
    dirPatterns: string[] = [],
    filePatterns: string[] = [],
    excludePatterns: string[] = [],
    useRegex = false
  ): Partial<FileCollectorConfig> {
    const config: Partial<FileCollectorConfig> = {
      useRegex
    };
    
    if (dirPatterns.length > 0) {
      config.includeDirs = dirPatterns.map(dirPattern => ({
        path: path.dirname(dirPattern) || '.',
        include: [path.basename(dirPattern)],
        recursive: true,
        useRegex
      }));
    }
    
    if (filePatterns.length > 0) {
      config.includeFiles = filePatterns;
    }
    
    if (excludePatterns.length > 0) {
      config.excludeFiles = excludePatterns;
    }
    
    return config;
  }

  /**
   * Checks if a file path is in the whitelist
   * @param filePath File path to check
   * @param patterns Whitelist patterns
   * @param useRegex Whether to use regex matching
   * @returns True if the file is in the whitelist
   */
  public static isInWhitelist(filePath: string, patterns: string[], useRegex = false): boolean {
    if (!patterns || patterns.length === 0) {
      return true; // Empty whitelist means include everything
    }

    if (useRegex) {
      return patterns.some(pattern => RegexPatternMatcher.test(filePath, pattern));
    } else {
      // Use fast-glob for standard glob patterns
      return patterns.some(pattern => {
        if (fastglob.isDynamicPattern(pattern)) {
          return fastglob.sync(pattern, { onlyFiles: true }).includes(filePath);
        } else {
          return pattern === filePath;
        }
      });
    }
  }

  /**
   * Checks if a file path is in the blacklist
   * @param filePath File path to check
   * @param patterns Blacklist patterns
   * @param useRegex Whether to use regex matching
   * @returns True if the file is in the blacklist
   */
  public static isInBlacklist(filePath: string, patterns: string[], useRegex = false): boolean {
    if (!patterns || patterns.length === 0) {
      return false; // Empty blacklist means exclude nothing
    }

    return this.isInWhitelist(filePath, patterns, useRegex); // Reuse the same logic
  }

  /**
   * Filters a list of file paths using whitelist and blacklist patterns
   * @param filePaths Array of file paths to filter
   * @param whitelist Whitelist patterns
   * @param blacklist Blacklist patterns
   * @param useRegex Whether to use regex matching
   * @returns Filtered array of file paths
   */
  public static filterPaths(
    filePaths: string[], 
    whitelist: string[] = [], 
    blacklist: string[] = [], 
    useRegex = false
  ): string[] {
    return filePaths.filter(filePath => 
      this.isInWhitelist(filePath, whitelist, useRegex) && 
      !this.isInBlacklist(filePath, blacklist, useRegex)
    );
  }

  /**
   * Filters file paths based on file extension
   * @param filePaths Array of file paths to filter
   * @param extensions Array of file extensions to include (without the dot)
   * @returns Filtered array of file paths
   */
  public static filterByExtension(filePaths: string[], extensions: string[]): string[] {
    if (!extensions || extensions.length === 0) {
      return filePaths;
    }
    
    return filePaths.filter(filePath => {
      const ext = path.extname(filePath).toLowerCase().substring(1); // Remove the dot
      return extensions.includes(ext);
    });
  }

  /**
   * Filters file paths based on directory
   * @param filePaths Array of file paths to filter
   * @param directories Array of directories to include
   * @param includeSubdirs Whether to include subdirectories
   * @returns Filtered array of file paths
   */
  public static filterByDirectory(
    filePaths: string[], 
    directories: string[], 
    includeSubdirs = true
  ): string[] {
    if (!directories || directories.length === 0) {
      return filePaths;
    }
    
    return filePaths.filter(filePath => {
      const dir = path.dirname(filePath);
      
      return directories.some(directory => {
        if (includeSubdirs) {
          // Check if the file is in the directory or any subdirectory
          return dir === directory || dir.startsWith(directory + path.sep);
        } else {
          // Check if the file is directly in the directory
          return dir === directory;
        }
      });
    });
  }

  /**
   * Creates a pattern that matches files with specific content
   * @param contentPattern Pattern to match in file content
   * @param isRegex Whether the pattern is a regex
   * @returns A FileSearchOptions object for content-based filtering
   */
  public static createContentFilter(contentPattern: string, isRegex = false): { searchInFiles: { pattern: string, isRegex: boolean } } {
    return {
      searchInFiles: {
        pattern: contentPattern,
        isRegex
      }
    };
  }
}
