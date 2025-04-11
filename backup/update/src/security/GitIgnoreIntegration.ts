// GitIgnore Security Scanner Integration
// This file integrates the GitIgnore security scanner with the file collector

import * as path from 'path';
import * as fs from 'fs-extra';
import { GitIgnoreSecurityScanner } from '../plugins/security-scanners/GitIgnoreSecurityScanner';
import { FileCollectorConfig, CollectedFile } from '../types';

/**
 * Configuration for GitIgnore integration
 */
export interface GitIgnoreIntegrationConfig {
  /** Whether to use .gitignore files for security scanning (default: true) */
  useGitIgnore?: boolean;
  
  /** Additional .gitignore files to use */
  additionalGitIgnoreFiles?: string[];
  
  /** Whether to treat .gitignore matches as security issues (default: true) */
  treatGitIgnoreAsSecurityIssue?: boolean;
  
  /** Whether to automatically exclude files matched by .gitignore (default: false) */
  autoExcludeGitIgnoreMatches?: boolean;
  
  /** Whether to scan for sensitive patterns in files not excluded by .gitignore (default: true) */
  scanNonGitIgnoredFiles?: boolean;
}

/**
 * Integrate GitIgnore security scanner with file collector
 * @param config File collector configuration
 * @param gitIgnoreConfig GitIgnore integration configuration
 * @returns Enhanced file collector configuration
 */
export async function integrateGitIgnoreSecurity(
  config: FileCollectorConfig,
  gitIgnoreConfig: GitIgnoreIntegrationConfig = {}
): Promise<FileCollectorConfig> {
  // Apply defaults
  const effectiveConfig = {
    useGitIgnore: gitIgnoreConfig.useGitIgnore !== false,
    additionalGitIgnoreFiles: gitIgnoreConfig.additionalGitIgnoreFiles || [],
    treatGitIgnoreAsSecurityIssue: gitIgnoreConfig.treatGitIgnoreAsSecurityIssue !== false,
    autoExcludeGitIgnoreMatches: gitIgnoreConfig.autoExcludeGitIgnoreMatches || false,
    scanNonGitIgnoredFiles: gitIgnoreConfig.scanNonGitIgnoredFiles !== false
  };
  
  // Skip if not using GitIgnore
  if (!effectiveConfig.useGitIgnore) {
    return config;
  }
  
  // Create GitIgnore scanner
  const scanner = new GitIgnoreSecurityScanner();
  await scanner.initialize();
  
  // Find project root (directory containing .git)
  let projectRoot = process.cwd();
  let currentDir = projectRoot;
  let foundGit = false;
  
  while (currentDir !== path.parse(currentDir).root) {
    if (await fs.pathExists(path.join(currentDir, '.git'))) {
      projectRoot = currentDir;
      foundGit = true;
      break;
    }
    currentDir = path.dirname(currentDir);
  }
  
  if (!foundGit) {
    console.warn('No .git directory found, using current directory as project root');
  }
  
  // Find all .gitignore files
  const gitIgnoreFiles = [
    path.join(projectRoot, '.gitignore'),
    ...effectiveConfig.additionalGitIgnoreFiles
  ].filter(async file => await fs.pathExists(file));
  
  // Load .gitignore patterns
  await scanner.loadGitIgnoreFiles(gitIgnoreFiles);
  
  // Create enhanced config
  const enhancedConfig = { ...config };
  
  // Auto-exclude files matched by .gitignore if requested
  if (effectiveConfig.autoExcludeGitIgnoreMatches) {
    // Get all files that would be included
    const allFiles: string[] = [];
    
    if (config.includeFiles) {
      allFiles.push(...config.includeFiles);
    }
    
    if (config.includeDirs) {
      for (const dir of config.includeDirs) {
        const files = await getAllFilesInDir(dir);
        allFiles.push(...files);
      }
    }
    
    // Filter out files matched by .gitignore
    const filteredFiles = allFiles.filter(file => !scanner.isIgnored(file));
    
    // Update config
    enhancedConfig.includeFiles = filteredFiles;
    enhancedConfig.includeDirs = [];
  }
  
  // Add scanner to security scanners
  if (!enhancedConfig.securityScanners) {
    enhancedConfig.securityScanners = [];
  }
  
  enhancedConfig.securityScanners.push({
    name: 'gitignore',
    scan: async (file: CollectedFile): Promise<CollectedFile> => {
      // Skip if file is already excluded
      if (effectiveConfig.autoExcludeGitIgnoreMatches) {
        return file;
      }
      
      // Check if file is ignored by .gitignore
      const isIgnored = scanner.isIgnored(file.filePath);
      
      // Add security issue if ignored and configured to treat as security issue
      if (isIgnored && effectiveConfig.treatGitIgnoreAsSecurityIssue) {
        if (!file.meta) {
          file.meta = {};
        }
        
        if (!file.meta.securityIssues) {
          file.meta.securityIssues = [];
        }
        
        file.meta.securityIssues.push({
          message: 'File matches .gitignore pattern',
          severity: 'warning',
          details: 'This file would be ignored by Git, which may indicate it contains sensitive information or should not be included in the context.'
        });
      }
      
      return file;
    }
  });
  
  return enhancedConfig;
}

/**
 * Get all files in a directory recursively
 * @param dir Directory to scan
 * @returns Array of file paths
 */
async function getAllFilesInDir(dir: string): Promise<string[]> {
  const result: string[] = [];
  
  async function scanDir(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  }
  
  await scanDir(dir);
  return result;
}

/**
 * Apply GitIgnore security scanner to collected files
 * @param files Collected files
 * @param gitIgnoreConfig GitIgnore integration configuration
 * @returns Enhanced collected files
 */
export async function applyGitIgnoreSecurity(
  files: CollectedFile[],
  gitIgnoreConfig: GitIgnoreIntegrationConfig = {}
): Promise<CollectedFile[]> {
  // Apply defaults
  const effectiveConfig = {
    useGitIgnore: gitIgnoreConfig.useGitIgnore !== false,
    additionalGitIgnoreFiles: gitIgnoreConfig.additionalGitIgnoreFiles || [],
    treatGitIgnoreAsSecurityIssue: gitIgnoreConfig.treatGitIgnoreAsSecurityIssue !== false
  };
  
  // Skip if not using GitIgnore
  if (!effectiveConfig.useGitIgnore) {
    return files;
  }
  
  // Create GitIgnore scanner
  const scanner = new GitIgnoreSecurityScanner();
  await scanner.initialize();
  
  // Find project root (directory containing .git)
  let projectRoot = process.cwd();
  let currentDir = projectRoot;
  let foundGit = false;
  
  while (currentDir !== path.parse(currentDir).root) {
    if (await fs.pathExists(path.join(currentDir, '.git'))) {
      projectRoot = currentDir;
      foundGit = true;
      break;
    }
    currentDir = path.dirname(currentDir);
  }
  
  if (!foundGit) {
    console.warn('No .git directory found, using current directory as project root');
  }
  
  // Find all .gitignore files
  const gitIgnoreFiles = [
    path.join(projectRoot, '.gitignore'),
    ...effectiveConfig.additionalGitIgnoreFiles
  ].filter(async file => await fs.pathExists(file));
  
  // Load .gitignore patterns
  await scanner.loadGitIgnoreFiles(gitIgnoreFiles);
  
  // Process each file
  return Promise.all(files.map(async (file) => {
    // Check if file is ignored by .gitignore
    const isIgnored = scanner.isIgnored(file.filePath);
    
    // Add security issue if ignored and configured to treat as security issue
    if (isIgnored && effectiveConfig.treatGitIgnoreAsSecurityIssue) {
      if (!file.meta) {
        file.meta = {};
      }
      
      if (!file.meta.securityIssues) {
        file.meta.securityIssues = [];
      }
      
      file.meta.securityIssues.push({
        message: 'File matches .gitignore pattern',
        severity: 'warning',
        details: 'This file would be ignored by Git, which may indicate it contains sensitive information or should not be included in the context.'
      });
    }
    
    return file;
  }));
}
