// Tree View Feature Implementation
// This file adds support for showing the full project tree

import * as fs from 'fs-extra';
import * as path from 'path';
import { FileCollectorConfig } from '../types';

/**
 * Configuration for tree view
 */
export interface TreeViewConfig {
  /** Root directory to start from */
  rootDir: string;

  /** Whether to include hidden files (default: false) */
  includeHidden?: boolean;

  /** Maximum depth to traverse (default: Infinity) */
  maxDepth?: number;

  /** File patterns to exclude */
  exclude?: string[];

  /** File patterns to include */
  include?: string[];

  /** Whether to use regex for pattern matching (default: false) */
  useRegex?: boolean;

  /** Whether to include directories in the result (default: true) */
  includeDirs?: boolean;

  /** Whether to include files in the result (default: true) */
  includeFiles?: boolean;

  /** Whether to include file sizes (default: true) */
  includeSize?: boolean;

  /** Whether to include file modification times (default: false) */
  includeModTime?: boolean;

  /** Files to mark as "list-only" (contents won't be included) */
  listOnlyPatterns?: string[];
}

/**
 * Tree node representing a file or directory
 */
export interface TreeNode {
  /** Path relative to root */
  path: string;

  /** Full path */
  fullPath: string;

  /** Whether this is a directory */
  isDirectory: boolean;

  /** Children (for directories) */
  children?: TreeNode[];

  /** File size in bytes (for files) */
  size?: number;

  /** Last modification time (for files) */
  modTime?: Date;

  /** Whether this file should be list-only (contents won't be included) */
  listOnly?: boolean;
}

/**
 * Generate a tree view of a directory
 * @param config Tree view configuration
 * @returns Tree structure
 */
export async function generateTree(config: TreeViewConfig): Promise<TreeNode> {
  const effectiveConfig = getEffectiveConfig(config);

  // Create root node
  const rootNode: TreeNode = {
    path: '',
    fullPath: effectiveConfig.rootDir,
    isDirectory: true,
    children: []
  };

  // Build tree recursively
  await buildTree(rootNode, effectiveConfig, 0);

  return rootNode;
}

/**
 * Build tree recursively
 * @param node Current node
 * @param config Tree view configuration
 * @param depth Current depth
 */
async function buildTree(
  node: TreeNode,
  config: TreeViewConfig,
  depth: number
): Promise<void> {
  // Check depth limit
  if (depth >= config.maxDepth!) {
    return;
  }

  try {
    // Read directory contents
    const entries = await fs.readdir(node.fullPath, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const entryName = entry.name;
      const entryPath = path.join(node.path, entryName);
      const entryFullPath = path.join(node.fullPath, entryName);

      // Skip hidden files if not included
      if (!config.includeHidden && entryName.startsWith('.')) {
        continue;
      }

      // Check if entry should be excluded
      if (shouldExclude(entryPath, config)) {
        continue;
      }

      // Check if entry should be included
      if (config.include && config.include.length > 0 && !shouldInclude(entryPath, config)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Skip directories if not included
        if (!config.includeDirs) {
          continue;
        }

        // Create directory node
        const dirNode: TreeNode = {
          path: entryPath,
          fullPath: entryFullPath,
          isDirectory: true,
          children: []
        };

        // Add to parent's children
        node.children!.push(dirNode);

        // Process directory recursively
        await buildTree(dirNode, config, depth + 1);
      } else {
        // Skip files if not included
        if (!config.includeFiles) {
          continue;
        }

        // Create file node
        const fileNode: TreeNode = {
          path: entryPath,
          fullPath: entryFullPath,
          isDirectory: false
        };

        // Add file size if requested
        if (config.includeSize) {
          try {
            const stats = await fs.stat(entryFullPath);
            fileNode.size = stats.size;

            // Add modification time if requested
            if (config.includeModTime) {
              fileNode.modTime = stats.mtime;
            }
          } catch (error) {
            console.warn(`Error getting stats for ${entryFullPath}:`, error);
          }
        }

        // Check if file should be list-only
        if (isListOnly(entryPath, config)) {
          fileNode.listOnly = true;
        }

        // Add to parent's children
        node.children!.push(fileNode);
      }
    }

    // Sort children: directories first, then files, both alphabetically
    node.children!.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) {
        return -1;
      }
      if (!a.isDirectory && b.isDirectory) {
        return 1;
      }
      return a.path.localeCompare(b.path);
    });
  } catch (error) {
    console.error(`Error reading directory ${node.fullPath}:`, error);
  }
}

/**
 * Check if a path should be excluded
 * @param relativePath Path relative to root
 * @param config Tree view configuration
 * @returns Whether the path should be excluded
 */
function shouldExclude(relativePath: string, config: TreeViewConfig): boolean {
  if (!config.exclude || config.exclude.length === 0) {
    return false;
  }

  for (const pattern of config.exclude) {
    if (config.useRegex) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(relativePath)) {
          return true;
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
      }
    } else {
      // Use glob-like pattern matching
      if (matchGlobPattern(relativePath, pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a path should be included
 * @param relativePath Path relative to root
 * @param config Tree view configuration
 * @returns Whether the path should be included
 */
function shouldInclude(relativePath: string, config: TreeViewConfig): boolean {
  if (!config.include || config.include.length === 0) {
    return true;
  }

  for (const pattern of config.include) {
    if (config.useRegex) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(relativePath)) {
          return true;
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
      }
    } else {
      // Use glob-like pattern matching
      if (matchGlobPattern(relativePath, pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a file should be list-only
 * @param relativePath Path relative to root
 * @param config Tree view configuration
 * @returns Whether the file should be list-only
 */
function isListOnly(relativePath: string, config: TreeViewConfig): boolean {
  if (!config.listOnlyPatterns || config.listOnlyPatterns.length === 0) {
    return false;
  }

  for (const pattern of config.listOnlyPatterns) {
    if (config.useRegex) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(relativePath)) {
          return true;
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
      }
    } else {
      // Use glob-like pattern matching
      if (matchGlobPattern(relativePath, pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Match a path against a glob pattern
 * @param path Path to match
 * @param pattern Glob pattern
 * @returns Whether the path matches the pattern
 */
function matchGlobPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Get effective configuration with defaults
 * @param config User-provided configuration
 * @returns Effective configuration with defaults applied
 */
function getEffectiveConfig(config: TreeViewConfig): TreeViewConfig {
  return {
    rootDir: config.rootDir,
    includeHidden: config.includeHidden || false,
    maxDepth: config.maxDepth || Infinity,
    exclude: config.exclude || [],
    include: config.include || [],
    useRegex: config.useRegex || false,
    includeDirs: config.includeDirs !== false,
    includeFiles: config.includeFiles !== false,
    includeSize: config.includeSize !== false,
    includeModTime: config.includeModTime || false,
    listOnlyPatterns: config.listOnlyPatterns || []
  };
}

/**
 * Convert tree to a flat list of files
 * @param tree Tree structure
 * @returns Flat list of file paths
 */
export function treeToFileList(tree: TreeNode): string[] {
  const result: string[] = [];

  function traverse(node: TreeNode) {
    if (!node.isDirectory) {
      result.push(node.path);
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Format tree as a string
 * @param tree Tree structure
 * @param options Formatting options
 * @returns Formatted tree string
 */
export function formatTree(
  tree: TreeNode,
  options: {
    showSize?: boolean;
    showModTime?: boolean;
    showListOnly?: boolean;
  } = {}
): string {
  const lines: string[] = [];

  function traverse(node: TreeNode, prefix: string = '', isLast: boolean = true) {
    // Skip root node
    if (node.path !== '') {
      const nodeName = path.basename(node.path);
      const connector = isLast ? '└── ' : '├── ';
      let line = `${prefix}${connector}${nodeName}`;

      // Add size if requested and available
      if (options.showSize && node.size !== undefined) {
        line += ` (${formatSize(node.size)})`;
      }

      // Add modification time if requested and available
      if (options.showModTime && node.modTime) {
        line += ` [${node.modTime.toISOString()}]`;
      }

      // Add list-only indicator if requested and applicable
      if (options.showListOnly && node.listOnly) {
        line += ' [list-only]';
      }

      lines.push(line);
    }

    if (node.children) {
      const childPrefix = node.path === '' ? '' : `${prefix}${isLast ? '    ' : '│   '}`;

      for (let i = 0; i < node.children.length; i++) {
        const isLastChild = i === node.children.length - 1;
        traverse(node.children[i], childPrefix, isLastChild);
      }
    }
  }

  traverse(tree);
  return lines.join('\n');
}

/**
 * Format file size in human-readable format
 * @param size Size in bytes
 * @returns Formatted size
 */
function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * Integrate tree view with FileCollectorConfig
 * @param treeConfig Tree view configuration
 * @param collectorConfig File collector configuration
 * @returns Updated file collector configuration
 */
export async function integrateTreeWithCollector(
  treeConfig: TreeViewConfig,
  collectorConfig: FileCollectorConfig = {}
): Promise<FileCollectorConfig> {
  // Generate tree
  const tree = await generateTree(treeConfig);

  // Convert tree to file list
  const fileList = treeToFileList(tree);

  // Create list-only patterns
  const listOnlyPatterns = treeConfig.listOnlyPatterns || [];

  // Update collector config
  const updatedConfig: FileCollectorConfig = {
    ...collectorConfig,
    includeFiles: [
      ...(collectorConfig.includeFiles || []),
      ...fileList.filter(file => !isListOnly(file, treeConfig))
    ],
    listOnlyFiles: [
      ...(collectorConfig.listOnlyFiles || []),
      ...fileList.filter(file => isListOnly(file, treeConfig))
    ]
  };

  return updatedConfig;
}
