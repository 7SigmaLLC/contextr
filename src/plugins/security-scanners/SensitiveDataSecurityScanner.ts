// Sensitive Data Security Scanner Plugin
// This plugin scans files for sensitive data patterns like API keys, passwords, etc.

import * as fs from 'fs-extra';
import * as path from 'path';
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
 * Configuration for Sensitive Data scanner
 */
interface SensitiveDataScannerConfig {
  /** Custom patterns to scan for (in addition to built-in patterns) */
  customPatterns?: Array<{
    name: string;
    pattern: string;
    severity: SecurityIssueSeverity;
  }>;

  /** Whether to redact sensitive data in reports (default: true) */
  redactSensitiveData?: boolean;

  /** Whether to scan env files (default: true) */
  scanEnvFiles?: boolean;

  /** Whether to only include env file keys without values (default: true) */
  envFilesKeysOnly?: boolean;

  /** File patterns to treat as env files */
  envFilePatterns?: string[];
}

/**
 * Sensitive Data Security Scanner Plugin
 * Scans files for sensitive data patterns like API keys, passwords, etc.
 */
export class SensitiveDataSecurityScanner implements SecurityScannerPlugin {
  id = 'sensitive-data-scanner';
  name = 'Sensitive Data Security Scanner';
  type: PluginType.SECURITY_SCANNER = PluginType.SECURITY_SCANNER;
  version = '1.0.0';
  description = 'Scans files for sensitive data patterns like API keys, passwords, and other credentials';

  // Built-in patterns for sensitive data
  private readonly builtInPatterns = [
    {
      name: 'AWS Access Key',
      pattern: '(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])',
      severity: SecurityIssueSeverity.CRITICAL
    },
    {
      name: 'AWS Secret Key',
      pattern: '(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{20}(?![A-Za-z0-9/+=])',
      severity: SecurityIssueSeverity.CRITICAL
    },
    {
      name: 'Google API Key',
      pattern: 'AIza[0-9A-Za-z\\-_]{35}',
      severity: SecurityIssueSeverity.CRITICAL
    },
    {
      name: 'GitHub Token',
      pattern: 'gh[pousr]_[A-Za-z0-9_]{36}',
      severity: SecurityIssueSeverity.CRITICAL
    },
    {
      name: 'Generic API Key',
      pattern: '(?i)(api_key|apikey|api token|access_token)(.{0,20})[\'"][0-9a-zA-Z]{16,}[\'"]',
      severity: SecurityIssueSeverity.ERROR
    },
    {
      name: 'Generic Secret',
      pattern: '(?i)(secret|password|credentials)(.{0,20})[\'"][0-9a-zA-Z]{8,}[\'"]',
      severity: SecurityIssueSeverity.ERROR
    },
    {
      name: 'Private Key',
      pattern: '-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----',
      severity: SecurityIssueSeverity.CRITICAL
    },
    {
      name: 'Connection String',
      pattern: '(?i)(mongodb|postgresql|mysql|jdbc|redis)://[^\\s]+',
      severity: SecurityIssueSeverity.ERROR
    },
    {
      name: 'IP Address',
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
      severity: SecurityIssueSeverity.INFO
    }
  ];

  // Default env file patterns
  private readonly defaultEnvFilePatterns = [
    '**/.env',
    '**/.env.*',
    '**/config/secrets.*',
    '**/credentials.*'
  ];

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    // Nothing to initialize
  }

  /**
   * Scan files for sensitive data
   * @param files Files to scan
   * @param config Configuration for the scanner
   * @returns Files with security warnings added to metadata
   */
  async scanFiles(files: CollectedFile[], config?: SensitiveDataScannerConfig): Promise<CollectedFile[]> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Combine built-in and custom patterns
    const patterns = [
      ...this.builtInPatterns,
      ...(effectiveConfig.customPatterns || [])
    ];

    // Clone files to avoid modifying the original
    const result = [...files];

    // Process each file
    for (const file of result) {
      // Check if this is an env file
      const isEnvFile = this.isEnvFile(file.filePath, effectiveConfig);

      // Handle env files specially if configured
      if (isEnvFile && effectiveConfig.scanEnvFiles) {
        if (effectiveConfig.envFilesKeysOnly) {
          // Replace env file content with keys only
          file.content = this.extractEnvFileKeys(file.content);

          // Add metadata about this transformation
          if (!file.meta) {
            file.meta = {};
          }

          file.meta.securityTransformed = true;
          file.meta.securityTransformedReason = 'Env file values redacted, only keys included';

          // Skip further scanning for this file
          continue;
        }
      }

      // Scan file content for sensitive patterns
      const issues = this.scanContent(file.filePath, file.content, patterns);

      if (issues.length > 0) {
        // Add security warnings to file metadata
        if (!file.meta) {
          file.meta = {};
        }

        if (!file.meta.securityIssues) {
          file.meta.securityIssues = [];
        }

        // Add each issue to metadata
        for (const issue of issues) {
          file.meta.securityIssues.push({
            scanner: this.id,
            severity: issue.severity,
            description: `Found potential ${issue.name}`,
            details: `Line ${issue.lineNumber}: ${issue.description}`,
            line: issue.lineNumber
          });
        }
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
  async generateSecurityReport(files: CollectedFile[], config?: SensitiveDataScannerConfig): Promise<SecurityReport> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Combine built-in and custom patterns
    const patterns = [
      ...this.builtInPatterns,
      ...(effectiveConfig.customPatterns || [])
    ];

    const issues: SecurityIssue[] = [];
    let filesWithIssues = 0;

    // Process each file
    for (const file of files) {
      // Check if this is an env file
      const isEnvFile = this.isEnvFile(file.filePath, effectiveConfig);

      // Handle env files specially if configured
      if (isEnvFile && effectiveConfig.scanEnvFiles) {
        if (effectiveConfig.envFilesKeysOnly) {
          // Add a note about env file transformation
          issues.push({
            filePath: file.filePath,
            severity: SecurityIssueSeverity.INFO,
            description: 'Env file values redacted, only keys included',
            remediation: 'No action needed, this is a security precaution'
          });

          filesWithIssues++;
          continue;
        }
      }

      // Scan file content for sensitive patterns
      const fileIssues = this.scanContent(file.filePath, file.content, patterns);

      if (fileIssues.length > 0) {
        // Convert to SecurityIssue format
        for (const issue of fileIssues) {
          issues.push({
            filePath: file.filePath,
            lineNumber: issue.lineNumber,
            severity: issue.severity,
            description: `Found potential ${issue.name}`,
            content: effectiveConfig.redactSensitiveData
              ? this.redactSensitiveData(issue.content)
              : issue.content
          });
        }

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
   * Scan content for sensitive data patterns
   * @param filePath File path (for reporting)
   * @param content Content to scan
   * @param patterns Patterns to scan for
   * @returns Issues found
   */
  private scanContent(
    filePath: string,
    content: string,
    patterns: Array<{ name: string; pattern: string; severity: SecurityIssueSeverity }>
  ): Array<{
    name: string;
    severity: SecurityIssueSeverity;
    lineNumber: number;
    description: string;
    content: string;
  }> {
    const issues: Array<{
      name: string;
      severity: SecurityIssueSeverity;
      lineNumber: number;
      description: string;
      content: string;
    }> = [];

    // Split content into lines
    const lines = content.split('\n');

    // Check each line against each pattern
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { name, pattern, severity } of patterns) {
        try {
          const regex = new RegExp(pattern, 'g');
          const matches = line.matchAll(regex);

          for (const match of matches) {
            issues.push({
              name,
              severity,
              lineNumber: i + 1,
              description: `Found potential ${name}`,
              content: line
            });
          }
        } catch (error) {
          console.warn(`Error with pattern ${name}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }

    return issues;
  }

  /**
   * Check if a file is an env file
   * @param filePath File path
   * @param config Scanner configuration
   * @returns Whether the file is an env file
   */
  private isEnvFile(filePath: string, config: SensitiveDataScannerConfig): boolean {
    const envFilePatterns = config.envFilePatterns || this.defaultEnvFilePatterns;

    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check against patterns
    for (const pattern of envFilePatterns) {
      if (this.matchesGlobPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    // Also check common env file names
    const basename = path.basename(filePath).toLowerCase();
    if (basename === '.env' || basename.startsWith('.env.') || basename === 'credentials.json') {
      return true;
    }

    return false;
  }

  /**
   * Extract keys from env file content
   * @param content Env file content
   * @returns Content with only keys (values redacted)
   */
  private extractEnvFileKeys(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        result.push(line);
        continue;
      }

      // Extract key from KEY=VALUE format
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        result.push(`${key}=<REDACTED>`);
      } else {
        // If not in KEY=VALUE format, keep the line as is
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Redact sensitive data from a string
   * @param text Text containing sensitive data
   * @returns Redacted text
   */
  private redactSensitiveData(text: string): string {
    // Simple redaction: replace middle part with asterisks
    // Keep first and last 4 characters if long enough
    if (text.length > 8) {
      const firstPart = text.substring(0, 4);
      const lastPart = text.substring(text.length - 4);
      const middleLength = text.length - 8;
      const redactedMiddle = '*'.repeat(Math.min(middleLength, 10));
      return `${firstPart}${redactedMiddle}${lastPart}`;
    }

    // For shorter strings, replace all with asterisks
    return '*'.repeat(text.length);
  }

  /**
   * Check if a path matches a glob pattern
   * @param path Path to check
   * @param pattern Glob pattern
   * @returns Whether the path matches the pattern
   */
  private matchesGlobPattern(path: string, pattern: string): boolean {
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
  private getEffectiveConfig(config?: SensitiveDataScannerConfig): SensitiveDataScannerConfig {
    return {
      customPatterns: config?.customPatterns || [],
      redactSensitiveData: config?.redactSensitiveData !== false,
      scanEnvFiles: config?.scanEnvFiles !== false,
      envFilesKeysOnly: config?.envFilesKeysOnly !== false,
      envFilePatterns: config?.envFilePatterns || this.defaultEnvFilePatterns
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
export default new SensitiveDataSecurityScanner();
