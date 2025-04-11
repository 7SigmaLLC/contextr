// Markdown Output Renderer Plugin
// This plugin renders context files to Markdown format

import * as path from 'path';
import {
  Plugin,
  PluginType,
  OutputRendererPlugin
} from '../PluginManager';
import { CollectedFile } from '../../types';

/**
 * Configuration for Markdown renderer
 */
interface MarkdownRendererConfig {
  /** Include file metadata (default: true) */
  includeMetadata?: boolean;

  /** Include table of contents (default: true) */
  includeTableOfContents?: boolean;

  /** Include security warnings (default: true) */
  includeSecurityWarnings?: boolean;

  /** Include line numbers (default: false) */
  includeLineNumbers?: boolean;

  /** Custom title for the document (default: "Project Context") */
  title?: string;

  /** Group files by directory (default: true) */
  groupByDirectory?: boolean;
}

/**
 * Markdown Output Renderer Plugin
 * Renders context files to Markdown format
 */
export class MarkdownRenderer implements OutputRendererPlugin {
  id = 'markdown-renderer';
  name = 'Markdown Renderer';
  type: PluginType.OUTPUT_RENDERER = PluginType.OUTPUT_RENDERER;
  version = '1.0.0';
  description = 'Renders context files to Markdown format with syntax highlighting';

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    // Nothing to initialize
  }

  /**
   * Get the format name for this renderer
   */
  getFormatName(): string {
    return 'markdown';
  }

  /**
   * Render files to Markdown format
   * @param files Files to render
   * @param config Configuration for the renderer
   * @returns Rendered Markdown
   */
  async render(files: CollectedFile[], config?: MarkdownRendererConfig): Promise<string> {
    const effectiveConfig = this.getEffectiveConfig(config);
    const output: string[] = [];

    // Add title
    output.push(`# ${effectiveConfig.title}`);
    output.push('');

    // Add summary
    output.push(`## Summary`);
    output.push('');
    output.push(`This context contains ${files.length} files.`);

    // Add file size information
    const totalSize = files.reduce((sum, file) => sum + (file.meta?.size || 0), 0);
    output.push(`Total size: ${this.formatSize(totalSize)}`);
    output.push('');

    // Add table of contents if enabled
    if (effectiveConfig.includeTableOfContents) {
      output.push(`## Table of Contents`);
      output.push('');

      if (effectiveConfig.groupByDirectory) {
        // Group files by directory
        const filesByDirectory = this.groupFilesByDirectory(files);

        for (const [directory, directoryFiles] of Object.entries(filesByDirectory)) {
          if (directory === '') {
            // Root directory
            for (const file of directoryFiles) {
              const fileName = path.basename(file.filePath);
              const anchor = this.createAnchor(file.filePath);
              output.push(`- [${fileName}](#${anchor})`);
            }
          } else {
            // Subdirectory
            output.push(`- ${directory}/`);
            for (const file of directoryFiles) {
              const fileName = path.basename(file.filePath);
              const anchor = this.createAnchor(file.filePath);
              output.push(`  - [${fileName}](#${anchor})`);
            }
          }
        }
      } else {
        // Flat list of files
        for (const file of files) {
          const anchor = this.createAnchor(file.filePath);
          output.push(`- [${file.filePath}](#${anchor})`);
        }
      }

      output.push('');
    }

    // Add security warnings if enabled and present
    if (effectiveConfig.includeSecurityWarnings) {
      const filesWithIssues = files.filter(file =>
        file.meta?.securityIssues && file.meta.securityIssues.length > 0
      );

      if (filesWithIssues.length > 0) {
        output.push(`## Security Warnings`);
        output.push('');
        output.push('The following files have security warnings:');
        output.push('');

        for (const file of filesWithIssues) {
          const issues = file.meta?.securityIssues || [];
          output.push(`### ${file.filePath}`);
          output.push('');

          for (const issue of issues) {
            const severity = issue.severity || 'warning';
            output.push(`- **${severity.toUpperCase()}**: ${issue.message}`);
            if (issue.details) {
              output.push(`  - ${issue.details}`);
            }
          }

          output.push('');
        }
      }
    }

    // Add file contents
    output.push(`## Files`);
    output.push('');

    if (effectiveConfig.groupByDirectory) {
      // Group files by directory
      const filesByDirectory = this.groupFilesByDirectory(files);

      for (const [directory, directoryFiles] of Object.entries(filesByDirectory)) {
        if (directory !== '') {
          output.push(`### Directory: ${directory}/`);
          output.push('');
        }

        for (const file of directoryFiles) {
          this.renderFile(file, output, effectiveConfig);
        }
      }
    } else {
      // Render files in order
      for (const file of files) {
        this.renderFile(file, output, effectiveConfig);
      }
    }

    return output.join('\n');
  }

  /**
   * Render a single file to Markdown
   * @param file File to render
   * @param output Output array to append to
   * @param config Renderer configuration
   */
  private renderFile(
    file: CollectedFile,
    output: string[],
    config: MarkdownRendererConfig
  ): void {
    const anchor = this.createAnchor(file.filePath);
    output.push(`### <a id="${anchor}"></a>${file.filePath}`);
    output.push('');

    // Add metadata if enabled
    if (config.includeMetadata && file.meta) {
      const metadataLines: string[] = [];

      if (file.meta.size !== undefined) {
        metadataLines.push(`Size: ${this.formatSize(file.meta.size)}`);
      }

      if (file.meta.lastModified) {
        metadataLines.push(`Last Modified: ${new Date(file.meta.lastModified).toISOString()}`);
      }

      if (file.meta.type) {
        metadataLines.push(`Type: ${file.meta.type}`);
      }

      if (metadataLines.length > 0) {
        output.push('**Metadata:**');
        for (const line of metadataLines) {
          output.push(`- ${line}`);
        }
        output.push('');
      }
    }

    // Add security warnings if enabled and present
    if (config.includeSecurityWarnings && file.meta?.securityIssues && file.meta.securityIssues.length > 0) {
      output.push('**Security Warnings:**');
      for (const issue of file.meta.securityIssues) {
        const severity = issue.severity || 'warning';
        output.push(`- **${severity.toUpperCase()}**: ${issue.message}`);
      }
      output.push('');
    }

    // Add file content with syntax highlighting based on extension
    const extension = path.extname(file.filePath).substring(1);
    const language = this.getLanguageForExtension(extension);

    if (config.includeLineNumbers) {
      // Add content with line numbers
      const lines = file.content.split('\n');
      const codeLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const paddedLineNumber = lineNumber.toString().padStart(4, ' ');
        codeLines.push(`${paddedLineNumber}: ${lines[i]}`);
      }

      output.push('```' + language);
      output.push(codeLines.join('\n'));
      output.push('```');
    } else {
      // Add content without line numbers
      output.push('```' + language);
      output.push(file.content);
      output.push('```');
    }

    output.push('');
  }

  /**
   * Group files by directory
   * @param files Files to group
   * @returns Files grouped by directory
   */
  private groupFilesByDirectory(files: CollectedFile[]): Record<string, CollectedFile[]> {
    const result: Record<string, CollectedFile[]> = {};

    for (const file of files) {
      const directory = path.dirname(file.filePath);

      if (!result[directory]) {
        result[directory] = [];
      }

      result[directory].push(file);
    }

    return result;
  }

  /**
   * Create an anchor ID from a file path
   * @param filePath File path
   * @returns Anchor ID
   */
  private createAnchor(filePath: string): string {
    return filePath
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  /**
   * Format file size in human-readable format
   * @param size Size in bytes
   * @returns Formatted size
   */
  private formatSize(size: number): string {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  /**
   * Get language identifier for syntax highlighting based on file extension
   * @param extension File extension
   * @returns Language identifier
   */
  private getLanguageForExtension(extension: string): string {
    const extensionMap: Record<string, string> = {
      // Programming languages
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',

      // Web technologies
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'svg': 'svg',

      // Configuration files
      'yml': 'yaml',
      'yaml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'env': 'dotenv',

      // Shell scripts
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'bat': 'batch',
      'ps1': 'powershell',

      // Documentation
      'md': 'markdown',
      'markdown': 'markdown',
      'txt': 'text',

      // Other
      'sql': 'sql',
      'graphql': 'graphql',
      'dockerfile': 'dockerfile',
      'gitignore': 'gitignore'
    };

    return extensionMap[extension.toLowerCase()] || '';
  }

  /**
   * Get effective configuration with defaults
   * @param config User-provided configuration
   * @returns Effective configuration with defaults applied
   */
  private getEffectiveConfig(config?: MarkdownRendererConfig): MarkdownRendererConfig {
    return {
      includeMetadata: config?.includeMetadata !== false,
      includeTableOfContents: config?.includeTableOfContents !== false,
      includeSecurityWarnings: config?.includeSecurityWarnings !== false,
      includeLineNumbers: config?.includeLineNumbers || false,
      title: config?.title || 'Project Context',
      groupByDirectory: config?.groupByDirectory !== false
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
export default new MarkdownRenderer();
