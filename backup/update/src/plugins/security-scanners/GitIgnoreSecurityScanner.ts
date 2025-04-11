// GitIgnore Security Scanner Plugin
// This plugin scans files based on .gitignore patterns

import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'fast-glob';
import { 
  Plugin, 
  PluginType, 
  SecurityScannerPlugin, 
  SecurityReport, 
  SecurityIssue,
  SecurityIssueSeverity 
} from '../PluginManager';
import { CollectedFile } from '../../types';

/**
 * Configuration for GitIgnore scanner
 */
interface GitIgnoreScannerConfig {
  /** Path to .gitignore file (default: auto-detect) */
  gitignorePath?: string;
  
  /** Whether to use global gitignore (default: true) */
  useGlobalGitignore?: boolean;
  
  /** Whether to warn about files that should be ignored (default: true) */
  warnAboutIgnoredFiles?: boolean;
  
  /** Severity level for ignored files (default: warning) */
  ignoredFileSeverity?: SecurityIssueSeverity;
}

/**
 * GitIgnore Security Scanner Plugin
 * Scans files based on .gitignore patterns to identify files that should be excluded
 */
export class GitIgnoreSecurityScanner implements SecurityScannerPlugin {
  id = 'gitignore-scanner';
  name = 'GitIgnore Security Scanner';
  type = PluginType.SECURITY_SCANNER;
  version = '1.0.0';
  description = 'Scans files based on .gitignore patterns to identify files that should be excluded';
  
  private gitignorePatterns: string[] = [];
  private gitignorePath: string = '';
  
  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    // Default initialization - actual patterns will be loaded during scan
  }
  
  /**
   * Scan files for security issues based on .gitignore patterns
   * @param files Files to scan
   * @param config Configuration for the scanner
   * @returns Files with security warnings added to metadata
   */
  async scanFiles(files: CollectedFile[], config?: GitIgnoreScannerConfig): Promise<CollectedFile[]> {
    const effectiveConfig = this.getEffectiveConfig(config);
    
    // Load gitignore patterns
    await this.loadGitignorePatterns(effectiveConfig);
    
    if (this.gitignorePatterns.length === 0) {
      console.warn('No .gitignore patterns found');
      return files;
    }
    
    // Clone files to avoid modifying the original
    const result = [...files];
    
    // Check each file against gitignore patterns
    for (const file of result) {
      if (this.shouldBeIgnored(file.filePath)) {
        // Add security warning to file metadata
        if (!file.meta) {
          file.meta = {};
        }
        
        if (!file.meta.securityIssues) {
          file.meta.securityIssues = [];
        }
        
        file.meta.securityIssues.push({
          scanner: this.id,
          severity: effectiveConfig.ignoredFileSeverity,
          message: `File matches .gitignore pattern and should be excluded`,
          details: `This file matches a pattern in ${this.gitignorePath} and might contain sensitive information.`
        });
      }
    }
    
    return result;
  }
  
  /**
   * Generate a security report for files
   * @param files Files to scan
   * @param config Configuration for the scanner
   * @returns Security report
   */
  async generateSecurityReport(files: CollectedFile[], config?: GitIgnoreScannerConfig): Promise<SecurityReport> {
    const effectiveConfig = this.getEffectiveConfig(config);
    
    // Load gitignore patterns if not already loaded
    await this.loadGitignorePatterns(effectiveConfig);
    
    const issues: SecurityIssue[] = [];
    let filesWithIssues = 0;
    
    // Check each file against gitignore patterns
    for (const file of files) {
      if (this.shouldBeIgnored(file.filePath)) {
        issues.push({
          filePath: file.filePath,
          severity: effectiveConfig.ignoredFileSeverity,
          description: `File matches .gitignore pattern and should be excluded`,
          remediation: `Consider removing this file from the context or checking if it contains sensitive information.`
        });
        
        filesWithIssues++;
      }
    }
    
    // Count issues by severity
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<SecurityIssueSeverity, number>);
    
    return {
      scannerId: this.id,
      issues,
      summary: {
        totalFiles: files.length,
        filesWithIssues,
        issuesBySeverity
      }
    };
  }
  
  /**
   * Load gitignore patterns from file
   * @param config Scanner configuration
   */
  private async loadGitignorePatterns(config: GitIgnoreScannerConfig): Promise<void> {
    // Reset patterns
    this.gitignorePatterns = [];
    
    // Try to find .gitignore file
    let gitignorePath = config.gitignorePath;
    
    if (!gitignorePath) {
      // Auto-detect .gitignore in current directory
      const currentDir = process.cwd();
      const possiblePath = path.join(currentDir, '.gitignore');
      
      if (await fs.pathExists(possiblePath)) {
        gitignorePath = possiblePath;
      }
    }
    
    // Load from specified or detected path
    if (gitignorePath && await fs.pathExists(gitignorePath)) {
      this.gitignorePath = gitignorePath;
      const content = await fs.readFile(gitignorePath, 'utf8');
      this.parseGitignoreContent(content);
    }
    
    // Load global gitignore if enabled
    if (config.useGlobalGitignore) {
      try {
        const globalGitignorePath = await this.findGlobalGitignore();
        if (globalGitignorePath && await fs.pathExists(globalGitignorePath)) {
          const content = await fs.readFile(globalGitignorePath, 'utf8');
          this.parseGitignoreContent(content);
          
          // Update path info to include global
          if (this.gitignorePath) {
            this.gitignorePath += ` and global gitignore (${globalGitignorePath})`;
          } else {
            this.gitignorePath = globalGitignorePath;
          }
        }
      } catch (error) {
        console.warn('Error loading global gitignore:', error.message);
      }
    }
  }
  
  /**
   * Parse gitignore content and extract patterns
   * @param content Gitignore file content
   */
  private parseGitignoreContent(content: string): void {
    const lines = content.split('\n');
    
    for (let line of lines) {
      // Remove comments
      const commentIndex = line.indexOf('#');
      if (commentIndex >= 0) {
        line = line.substring(0, commentIndex);
      }
      
      // Trim whitespace
      line = line.trim();
      
      // Skip empty lines
      if (!line) {
        continue;
      }
      
      // Add pattern
      this.gitignorePatterns.push(line);
    }
  }
  
  /**
   * Find global gitignore file
   * @returns Path to global gitignore file
   */
  private async findGlobalGitignore(): Promise<string | null> {
    try {
      // Try to get global gitignore from git config
      const { execSync } = require('child_process');
      const output = execSync('git config --global core.excludesfile', { encoding: 'utf8' }).trim();
      
      if (output && await fs.pathExists(output)) {
        return output;
      }
      
      // Check common locations
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      if (homeDir) {
        const commonLocations = [
          path.join(homeDir, '.gitignore_global'),
          path.join(homeDir, '.gitignore'),
          path.join(homeDir, '.config', 'git', 'ignore')
        ];
        
        for (const location of commonLocations) {
          if (await fs.pathExists(location)) {
            return location;
          }
        }
      }
    } catch (error) {
      console.warn('Error finding global gitignore:', error.message);
    }
    
    return null;
  }
  
  /**
   * Check if a file should be ignored based on gitignore patterns
   * @param filePath File path to check
   * @returns Whether the file should be ignored
   */
  private shouldBeIgnored(filePath: string): boolean {
    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const pattern of this.gitignorePatterns) {
      // Skip negated patterns (those starting with !)
      if (pattern.startsWith('!')) {
        continue;
      }
      
      // Convert gitignore pattern to glob pattern
      const globPattern = this.gitignoreToGlob(pattern);
      
      // Check if file matches pattern
      if (glob.isDynamicPattern(globPattern)) {
        if (glob.matchPatternBase(normalizedPath, globPattern)) {
          return true;
        }
      } else {
        // Simple string comparison for non-glob patterns
        if (normalizedPath.includes(pattern)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Convert gitignore pattern to glob pattern
   * @param pattern Gitignore pattern
   * @returns Glob pattern
   */
  private gitignoreToGlob(pattern: string): string {
    // Remove leading slash if present
    let result = pattern.startsWith('/') ? pattern.substring(1) : pattern;
    
    // Handle directory-only pattern (ending with /)
    if (result.endsWith('/')) {
      result = `${result}**`;
    }
    
    // Handle ** pattern
    if (!result.includes('**')) {
      // If pattern doesn't include a slash, it matches files in any directory
      if (!result.includes('/')) {
        result = `**/${result}`;
      }
    }
    
    return result;
  }
  
  /**
   * Get effective configuration with defaults
   * @param config User-provided configuration
   * @returns Effective configuration with defaults applied
   */
  private getEffectiveConfig(config?: GitIgnoreScannerConfig): GitIgnoreScannerConfig {
    return {
      gitignorePath: config?.gitignorePath,
      useGlobalGitignore: config?.useGlobalGitignore !== false,
      warnAboutIgnoredFiles: config?.warnAboutIgnoredFiles !== false,
      ignoredFileSeverity: config?.ignoredFileSeverity || SecurityIssueSeverity.WARNING
    };
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up
  }
}

// Export plugin instance
export default new GitIgnoreSecurityScanner();
