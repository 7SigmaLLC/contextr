// HTML Output Renderer Plugin
// This plugin renders context files to HTML format with syntax highlighting

import * as path from 'path';
import {
  Plugin,
  PluginType,
  OutputRendererPlugin,
  SecurityIssueSeverity
} from '../PluginManager';
import { CollectedFile } from '../../types';

/**
 * Configuration for HTML renderer
 */
interface HTMLRendererConfig {
  /** Include file metadata (default: true) */
  includeMetadata?: boolean;

  /** Include table of contents (default: true) */
  includeTableOfContents?: boolean;

  /** Include security warnings (default: true) */
  includeSecurityWarnings?: boolean;

  /** Include line numbers (default: true) */
  includeLineNumbers?: boolean;

  /** Custom title for the document (default: "Project Context") */
  title?: string;

  /** Group files by directory (default: true) */
  groupByDirectory?: boolean;

  /** Include CSS in the HTML (default: true) */
  includeCSS?: boolean;

  /** Custom CSS to add to the HTML */
  customCSS?: string;

  /** Include collapsible sections (default: true) */
  collapsibleSections?: boolean;
}

/**
 * HTML Output Renderer Plugin
 * Renders context files to HTML format with syntax highlighting
 */
export class HTMLRenderer implements OutputRendererPlugin {
  id = 'html-renderer';
  name = 'HTML Renderer';
  type: PluginType.OUTPUT_RENDERER = PluginType.OUTPUT_RENDERER;
  version = '1.0.0';
  description = 'Renders context files to HTML format with syntax highlighting and interactive features';

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
    return 'html';
  }

  /**
   * Render files to HTML format
   * @param files Files to render
   * @param config Configuration for the renderer
   * @returns Rendered HTML
   */
  async render(files: CollectedFile[], config?: HTMLRendererConfig): Promise<string> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Start building HTML
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(effectiveConfig.title || 'Code Context')}</title>
  ${this.getStylesTag(effectiveConfig)}
</head>
<body>
  <div class="container">
    <header>
      <h1>${this.escapeHtml(effectiveConfig.title || 'Code Context')}</h1>
      <div class="summary">
        <p>This context contains ${files.length} files.</p>
        <p>Total size: ${this.formatSize(files.reduce((sum, file) => sum + (file.meta?.size || 0), 0))}</p>
      </div>
    </header>`;

    // Add table of contents if enabled
    if (effectiveConfig.includeTableOfContents) {
      html += `
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>`;

      if (effectiveConfig.groupByDirectory) {
        // Group files by directory
        const filesByDirectory = this.groupFilesByDirectory(files);

        for (const [directory, directoryFiles] of Object.entries(filesByDirectory)) {
          if (directory === '') {
            // Root directory
            for (const file of directoryFiles) {
              const fileName = path.basename(file.filePath);
              const anchor = this.createAnchor(file.filePath);
              html += `
        <li><a href="#${anchor}">${this.escapeHtml(fileName)}</a></li>`;
            }
          } else {
            // Subdirectory
            html += `
        <li class="directory">
          <span>${this.escapeHtml(directory)}/</span>
          <ul>`;

            for (const file of directoryFiles) {
              const fileName = path.basename(file.filePath);
              const anchor = this.createAnchor(file.filePath);
              html += `
            <li><a href="#${anchor}">${this.escapeHtml(fileName)}</a></li>`;
            }

            html += `
          </ul>
        </li>`;
          }
        }
      } else {
        // Flat list of files
        for (const file of files) {
          const anchor = this.createAnchor(file.filePath);
          html += `
        <li><a href="#${anchor}">${this.escapeHtml(file.filePath)}</a></li>`;
        }
      }

      html += `
      </ul>
    </nav>`;
    }

    // Add security warnings if enabled and present
    if (effectiveConfig.includeSecurityWarnings) {
      const filesWithIssues = files.filter(file =>
        file.meta?.securityIssues && file.meta.securityIssues.length > 0
      );

      if (filesWithIssues.length > 0) {
        html += `
    <section class="security-warnings">
      <h2>Security Warnings</h2>
      <p>The following files have security warnings:</p>`;

        for (const file of filesWithIssues) {
          const issues = file.meta?.securityIssues || [];
          html += `
      <div class="file-warnings">
        <h3>${this.escapeHtml(file.filePath)}</h3>
        <ul>`;

          for (const issue of issues) {
            const severity = issue.severity || 'warning';
            html += `
          <li class="severity-${severity.toLowerCase()}">
            <strong>${severity.toUpperCase()}:</strong> ${this.escapeHtml(issue.message)}`;

            if (issue.details) {
              html += `
            <div class="details">${this.escapeHtml(issue.details)}</div>`;
            }

            html += `
          </li>`;
          }

          html += `
        </ul>
      </div>`;
        }

        html += `
    </section>`;
      }
    }

    // Add file contents
    html += `
    <section class="files">
      <h2>Files</h2>`;

    if (effectiveConfig.groupByDirectory) {
      // Group files by directory
      const filesByDirectory = this.groupFilesByDirectory(files);

      for (const [directory, directoryFiles] of Object.entries(filesByDirectory)) {
        if (directory !== '') {
          html += `
      <div class="directory-group">
        <h3 class="directory-heading">${this.escapeHtml(directory)}/</h3>`;
        }

        for (const file of directoryFiles) {
          html += this.renderFileHtml(file, effectiveConfig);
        }

        if (directory !== '') {
          html += `
      </div>`;
        }
      }
    } else {
      // Render files in order
      for (const file of files) {
        html += this.renderFileHtml(file, effectiveConfig);
      }
    }

    html += `
    </section>
  </div>`;

    // Add JavaScript for interactive features
    if (effectiveConfig.collapsibleSections) {
      html += `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Make file sections collapsible
      document.querySelectorAll('.file-heading').forEach(heading => {
        heading.addEventListener('click', function() {
          this.parentElement.classList.toggle('collapsed');
        });
      });

      // Make directory sections collapsible
      document.querySelectorAll('.directory-heading').forEach(heading => {
        heading.addEventListener('click', function() {
          this.parentElement.classList.toggle('collapsed');
        });
      });
    });
  </script>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Render a single file to HTML
   * @param file File to render
   * @param config Renderer configuration
   * @returns HTML for the file
   */
  private renderFileHtml(
    file: CollectedFile,
    config: HTMLRendererConfig
  ): string {
    const anchor = this.createAnchor(file.filePath);
    let html = `
      <div class="file" id="${anchor}">
        <h3 class="file-heading">${this.escapeHtml(file.filePath)}</h3>
        <div class="file-content">`;

    // Add metadata if enabled
    if (config.includeMetadata && file.meta) {
      html += `
          <div class="metadata">`;

      if (file.meta.size !== undefined) {
        html += `
            <div class="meta-item">Size: ${this.formatSize(file.meta.size)}</div>`;
      }

      if (file.meta.lastModified) {
        html += `
            <div class="meta-item">Last Modified: ${new Date(file.meta.lastModified).toISOString()}</div>`;
      }

      if (file.meta.type) {
        html += `
            <div class="meta-item">Type: ${this.escapeHtml(file.meta.type)}</div>`;
      }

      html += `
          </div>`;
    }

    // Add security warnings if enabled and present
    if (config.includeSecurityWarnings && file.meta?.securityIssues && file.meta.securityIssues.length > 0) {
      html += `
          <div class="file-warnings">
            <ul>`;

      for (const issue of file.meta.securityIssues) {
        const severity = issue.severity || 'warning';
        html += `
              <li class="severity-${severity.toLowerCase()}">
                <strong>${severity.toUpperCase()}:</strong> ${this.escapeHtml(issue.message)}
              </li>`;
      }

      html += `
            </ul>
          </div>`;
    }

    // Add file content with syntax highlighting based on extension
    const extension = path.extname(file.filePath).substring(1);
    const language = this.getLanguageForExtension(extension);

    html += `
          <pre class="code${language ? ` language-${language}` : ''}">`;

    if (config.includeLineNumbers) {
      // Add content with line numbers
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const lineContent = this.escapeHtml(lines[i]);
        html += `<div class="line"><span class="line-number">${lineNumber}</span><span class="line-content">${lineContent}</span></div>`;
      }
    } else {
      // Add content without line numbers
      html += this.escapeHtml(file.content);
    }

    html += `</pre>
        </div>
      </div>`;

    return html;
  }

  /**
   * Get CSS styles tag
   * @param config Renderer configuration
   * @returns HTML style tag with CSS
   */
  private getStylesTag(config: HTMLRendererConfig): string {
    if (!config.includeCSS) {
      return '';
    }

    const defaultCSS = `
    :root {
      --primary-color: #4a6fa5;
      --secondary-color: #6c757d;
      --background-color: #ffffff;
      --code-background: #f8f9fa;
      --border-color: #dee2e6;
      --text-color: #212529;
      --link-color: #0366d6;
      --warning-color: #ffc107;
      --error-color: #dc3545;
      --critical-color: #721c24;
      --info-color: #17a2b8;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: var(--text-color);
      background-color: var(--background-color);
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    h1, h2, h3, h4 {
      margin-top: 0;
      color: var(--primary-color);
    }

    a {
      color: var(--link-color);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .toc {
      background-color: var(--code-background);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }

    .toc ul {
      list-style-type: none;
      padding-left: 1rem;
    }

    .toc li {
      margin-bottom: 0.5rem;
    }

    .directory > span {
      font-weight: bold;
      color: var(--secondary-color);
    }

    .file {
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
    }

    .file-heading {
      background-color: var(--primary-color);
      color: white;
      padding: 0.75rem 1rem;
      margin: 0;
      cursor: pointer;
      position: relative;
    }

    .file-heading:after {
      content: "▼";
      position: absolute;
      right: 1rem;
      transition: transform 0.2s;
    }

    .file.collapsed .file-heading:after {
      transform: rotate(-90deg);
    }

    .file.collapsed .file-content {
      display: none;
    }

    .file-content {
      padding: 1rem;
    }

    .metadata {
      background-color: var(--code-background);
      padding: 0.5rem 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      font-size: 0.9rem;
      color: var(--secondary-color);
    }

    .file-warnings {
      margin-bottom: 1rem;
    }

    .file-warnings ul {
      list-style-type: none;
      padding-left: 0;
      margin: 0;
    }

    .file-warnings li {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }

    .severity-info {
      background-color: rgba(23, 162, 184, 0.1);
      border-left: 4px solid var(--info-color);
    }

    .severity-warning {
      background-color: rgba(255, 193, 7, 0.1);
      border-left: 4px solid var(--warning-color);
    }

    .severity-error {
      background-color: rgba(220, 53, 69, 0.1);
      border-left: 4px solid var(--error-color);
    }

    .severity-critical {
      background-color: rgba(114, 28, 36, 0.1);
      border-left: 4px solid var(--critical-color);
    }

    pre.code {
      background-color: var(--code-background);
      border-radius: 4px;
      padding: 1rem;
      overflow-x: auto;
      margin: 0;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9rem;
    }

    .line {
      display: flex;
      white-space: pre;
    }

    .line-number {
      color: var(--secondary-color);
      text-align: right;
      padding-right: 1rem;
      user-select: none;
      min-width: 3rem;
      border-right: 1px solid var(--border-color);
      margin-right: 1rem;
    }

    .line-content {
      flex: 1;
    }

    .directory-group {
      margin-bottom: 2rem;
    }

    .directory-heading {
      color: var(--secondary-color);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      margin-top: 2rem;
      cursor: pointer;
    }

    .directory-group.collapsed .file {
      display: none;
    }

    .security-warnings {
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: rgba(255, 193, 7, 0.1);
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }
    }`;

    return `<style>
${defaultCSS}
${config.customCSS || ''}
</style>`;
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
   * Escape HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get effective configuration with defaults
   * @param config User-provided configuration
   * @returns Effective configuration with defaults applied
   */
  private getEffectiveConfig(config?: HTMLRendererConfig): HTMLRendererConfig {
    return {
      includeMetadata: config?.includeMetadata !== false,
      includeTableOfContents: config?.includeTableOfContents !== false,
      includeSecurityWarnings: config?.includeSecurityWarnings !== false,
      includeLineNumbers: config?.includeLineNumbers !== false,
      title: config?.title || 'Project Context',
      groupByDirectory: config?.groupByDirectory !== false,
      includeCSS: config?.includeCSS !== false,
      customCSS: config?.customCSS || '',
      collapsibleSections: config?.collapsibleSections !== false
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
export default new HTMLRenderer();
