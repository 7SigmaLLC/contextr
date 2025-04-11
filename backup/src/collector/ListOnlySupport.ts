// Integration of list-only mode with FileCollector
// This file enhances the FileCollector to support list-only files

import * as path from 'path';
import * as fs from 'fs-extra';
import { FileCollectorConfig, CollectedFile } from '../types';
import { RegexPatternMatcher } from './RegexPatternMatcher';

/**
 * Enhanced file collector configuration with list-only support
 */
export interface EnhancedFileCollectorConfig extends FileCollectorConfig {
  /** Files to include in the tree but not their contents */
  listOnlyFiles?: string[];
  
  /** Patterns for files to include in the tree but not their contents */
  listOnlyPatterns?: string[];
  
  /** Whether to use regex for list-only patterns */
  useRegexForListOnly?: boolean;
}

/**
 * Check if a file should be list-only
 * @param filePath File path to check
 * @param config File collector configuration
 * @returns Whether the file should be list-only
 */
export function isListOnlyFile(filePath: string, config: EnhancedFileCollectorConfig): boolean {
  // Check explicit list-only files
  if (config.listOnlyFiles && config.listOnlyFiles.includes(filePath)) {
    return true;
  }
  
  // Check list-only patterns
  if (config.listOnlyPatterns && config.listOnlyPatterns.length > 0) {
    const matcher = new RegexPatternMatcher();
    
    for (const pattern of config.listOnlyPatterns) {
      if (config.useRegexForListOnly) {
        if (matcher.matchRegexPattern(filePath, pattern)) {
          return true;
        }
      } else {
        if (matcher.matchGlobPattern(filePath, pattern)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Process a list-only file
 * @param filePath Path to the file
 * @returns Collected file with minimal content
 */
export async function processListOnlyFile(filePath: string): Promise<CollectedFile> {
  try {
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Get file extension
    const extension = path.extname(filePath).toLowerCase();
    
    // Create placeholder content based on file type
    let placeholderContent = '';
    let fileType = '';
    
    // Determine file type and create appropriate placeholder
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(extension)) {
      fileType = 'image';
      placeholderContent = `[Image file: ${path.basename(filePath)}]`;
    } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(extension)) {
      fileType = 'video';
      placeholderContent = `[Video file: ${path.basename(filePath)}]`;
    } else if (['.mp3', '.wav', '.ogg', '.flac', '.aac'].includes(extension)) {
      fileType = 'audio';
      placeholderContent = `[Audio file: ${path.basename(filePath)}]`;
    } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(extension)) {
      fileType = 'document';
      placeholderContent = `[Document file: ${path.basename(filePath)}]`;
    } else if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(extension)) {
      fileType = 'archive';
      placeholderContent = `[Archive file: ${path.basename(filePath)}]`;
    } else if (['.exe', '.dll', '.so', '.dylib'].includes(extension)) {
      fileType = 'binary';
      placeholderContent = `[Binary file: ${path.basename(filePath)}]`;
    } else {
      fileType = 'unknown';
      placeholderContent = `[File: ${path.basename(filePath)} (list-only)]`;
    }
    
    // Create collected file
    return {
      filePath,
      content: placeholderContent,
      meta: {
        size: stats.size,
        lastModified: stats.mtime.getTime(),
        type: fileType,
        isListOnly: true
      }
    };
  } catch (error) {
    console.error(`Error processing list-only file ${filePath}:`, error);
    
    // Return minimal information on error
    return {
      filePath,
      content: `[Error: Could not process file ${path.basename(filePath)}]`,
      meta: {
        isListOnly: true,
        error: error.message
      }
    };
  }
}

/**
 * Enhance a file collector configuration with list-only support
 * @param config Original configuration
 * @returns Enhanced configuration
 */
export function enhanceConfigWithListOnly(config: FileCollectorConfig): EnhancedFileCollectorConfig {
  return {
    ...config,
    listOnlyFiles: [],
    listOnlyPatterns: [],
    useRegexForListOnly: config.useRegex
  };
}
