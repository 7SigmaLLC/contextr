// LLM Reviewer Plugin Interface
// This file defines the base class for LLM reviewer plugins

import * as path from 'path';
import * as fs from 'fs-extra';
import {
  Plugin,
  PluginType,
  LLMReviewerPlugin
} from '../PluginManager';
import { CollectedFile } from '../../types';

/**
 * Base configuration for LLM reviewers
 */
export interface BaseLLMReviewerConfig {
  /** Maximum content length to review (default: 100000) */
  maxContentLength?: number;

  /** Whether to include file metadata in review (default: true) */
  includeMetadata?: boolean;

  /** Whether to include security issues in review (default: true) */
  includeSecurityIssues?: boolean;

  /** Whether to generate summaries for individual files (default: true) */
  generateFileSummaries?: boolean;

  /** Whether to generate an overall project summary (default: true) */
  generateProjectSummary?: boolean;

  /** Custom prompt template for file review */
  fileReviewPrompt?: string;

  /** Custom prompt template for project summary */
  projectSummaryPrompt?: string;

  /** File patterns to exclude from review */
  excludePatterns?: string[];

  /** File patterns to include in review */
  includePatterns?: string[];

  /** Maximum number of files to review (default: 50) */
  maxFiles?: number;
}

/**
 * Abstract base class for LLM reviewer plugins
 * Provides common functionality for LLM reviewers
 */
export abstract class BaseLLMReviewer implements LLMReviewerPlugin {
  id: string;
  name: string;
  type: PluginType.LLM_REVIEWER = PluginType.LLM_REVIEWER;
  version: string;
  description: string;

  // Default prompts
  protected readonly DEFAULT_FILE_REVIEW_PROMPT =
    "Review the following file and identify any security issues, " +
    "potential improvements, or notable patterns. " +
    "Also provide a brief summary of the file's purpose and functionality.\n\n" +
    "File: {filePath}\n\n" +
    "{content}";

  protected readonly DEFAULT_PROJECT_SUMMARY_PROMPT =
    "Based on the files reviewed, provide a summary of the project. " +
    "Include information about the project structure, main components, " +
    "technologies used, and any security concerns or recommendations.\n\n" +
    "Files reviewed: {fileCount}\n\n" +
    "File summaries:\n{fileSummaries}";

  /**
   * Constructor
   * @param id Plugin ID
   * @param name Plugin name
   * @param version Plugin version
   * @param description Plugin description
   */
  constructor(
    id: string,
    name: string,
    version: string,
    description: string
  ) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.description = description;
  }

  /**
   * Initialize the plugin
   * Must be implemented by subclasses
   */
  abstract initialize(): Promise<void>;

  /**
   * Check if the LLM is available
   * Must be implemented by subclasses
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Review files using an LLM
   * @param files Files to review
   * @param config Configuration for the reviewer
   * @returns Reviewed files with additional metadata
   */
  async reviewFiles(files: CollectedFile[], config?: BaseLLMReviewerConfig): Promise<CollectedFile[]> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Filter files based on include/exclude patterns
    let filesToReview = this.filterFiles(files, effectiveConfig);

    // Limit number of files if needed
    if (effectiveConfig.maxFiles && filesToReview.length > effectiveConfig.maxFiles) {
      filesToReview = filesToReview.slice(0, effectiveConfig.maxFiles);
    }

    // Clone files to avoid modifying the original
    const result = [...files];
    const reviewedFiles = new Set<string>();

    // Process each file
    for (const file of filesToReview) {
      try {
        // Skip files that are too large
        if (file.content.length > (effectiveConfig.maxContentLength || 10000)) {
          console.warn(`Skipping file ${file.filePath} because it exceeds the maximum content length`);
          continue;
        }

        // Prepare prompt for file review
        const prompt = this.prepareFileReviewPrompt(file, effectiveConfig);

        // Get review from LLM
        const review = await this.reviewFile(prompt, file);

        // Find the file in the result array and update its metadata
        const resultFile = result.find(f => f.filePath === file.filePath);
        if (resultFile) {
          if (!resultFile.meta) {
            resultFile.meta = {};
          }

          if (!resultFile.meta.llmReviews) {
            resultFile.meta.llmReviews = {};
          }

          resultFile.meta.llmReviews[this.id] = review;
          reviewedFiles.add(file.filePath);
        }
      } catch (error) {
        console.error(`Error reviewing file ${file.filePath}:`, error);
      }
    }

    // Generate project summary if enabled
    if (effectiveConfig.generateProjectSummary) {
      try {
        const fileSummaries = result
          .filter(file => reviewedFiles.has(file.filePath))
          .map(file => {
            const review = file.meta?.llmReviews?.[this.id];
            return review?.summary || '';
          })
          .filter(Boolean)
          .join('\n\n');

        const prompt = this.prepareProjectSummaryPrompt(fileSummaries, reviewedFiles.size, effectiveConfig);
        const summary = await this.generateProjectSummary(prompt);

        // Add summary to all files
        for (const file of result) {
          if (!file.meta) {
            file.meta = {};
          }

          if (!file.meta.llmProjectSummary) {
            file.meta.llmProjectSummary = {};
          }

          file.meta.llmProjectSummary[this.id] = summary;
        }
      } catch (error) {
        console.error('Error generating project summary:', error);
      }
    }

    return result;
  }

  /**
   * Generate a summary of the files
   * @param files Files to summarize
   * @param config Configuration for the summarizer
   * @returns Summary text
   */
  async generateSummary(files: CollectedFile[], config?: BaseLLMReviewerConfig): Promise<string> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Filter files based on include/exclude patterns
    let filesToReview = this.filterFiles(files, effectiveConfig);

    // Limit number of files if needed
    if (effectiveConfig.maxFiles && filesToReview.length > effectiveConfig.maxFiles) {
      filesToReview = filesToReview.slice(0, effectiveConfig.maxFiles);
    }

    // Extract summaries from file reviews
    const fileSummaries: string[] = [];

    for (const file of filesToReview) {
      try {
        // Skip files that are too large
        if (file.content.length > (effectiveConfig.maxContentLength || 10000)) {
          continue;
        }

        // Check if file already has a review
        if (file.meta?.llmReviews?.[this.id]?.summary) {
          fileSummaries.push(`${file.filePath}: ${file.meta.llmReviews[this.id].summary}`);
          continue;
        }

        // Prepare prompt for file review
        const prompt = this.prepareFileReviewPrompt(file, effectiveConfig);

        // Get review from LLM
        const review = await this.reviewFile(prompt, file);

        if (review.summary) {
          fileSummaries.push(`${file.filePath}: ${review.summary}`);
        }
      } catch (error) {
        console.error(`Error reviewing file ${file.filePath}:`, error);
      }
    }

    // Generate project summary
    const summaryPrompt = this.prepareProjectSummaryPrompt(
      fileSummaries.join('\n\n'),
      filesToReview.length,
      effectiveConfig
    );

    return await this.generateProjectSummary(summaryPrompt);
  }

  /**
   * Review a file using the LLM
   * Must be implemented by subclasses
   * @param prompt Prompt for the LLM
   * @param file File being reviewed
   * @returns Review results
   */
  protected abstract reviewFile(
    prompt: string,
    file: CollectedFile
  ): Promise<{
    summary: string;
    securityIssues?: Array<{
      description: string;
      severity: string;
      recommendation?: string;
    }>;
    improvements?: string[];
    notes?: string[];
  }>;

  /**
   * Generate a project summary using the LLM
   * Must be implemented by subclasses
   * @param prompt Prompt for the LLM
   * @returns Project summary
   */
  protected abstract generateProjectSummary(prompt: string): Promise<string>;

  /**
   * Prepare prompt for file review
   * @param file File to review
   * @param config Configuration
   * @returns Prompt for the LLM
   */
  protected prepareFileReviewPrompt(file: CollectedFile, config: BaseLLMReviewerConfig): string {
    let prompt = config.fileReviewPrompt || this.DEFAULT_FILE_REVIEW_PROMPT;

    // Replace placeholders
    prompt = prompt.replace('{filePath}', file.filePath);
    prompt = prompt.replace('{content}', file.content);

    // Add metadata if enabled
    if (config.includeMetadata && file.meta) {
      let metadataStr = 'File Metadata:\n';

      if (file.meta.size !== undefined) {
        metadataStr += `Size: ${file.meta.size} bytes\n`;
      }

      if (file.meta.lastModified) {
        metadataStr += `Last Modified: ${new Date(file.meta.lastModified).toISOString()}\n`;
      }

      if (file.meta.type) {
        metadataStr += `Type: ${file.meta.type}\n`;
      }

      prompt = prompt.replace('{metadata}', metadataStr);
    } else {
      prompt = prompt.replace('{metadata}', '');
    }

    // Add security issues if enabled
    if (config.includeSecurityIssues && file.meta?.securityIssues) {
      let securityStr = 'Security Issues:\n';

      for (const issue of file.meta.securityIssues) {
        securityStr += `- ${issue.severity?.toUpperCase() || 'WARNING'}: ${issue.message}\n`;
        if (issue.details) {
          securityStr += `  ${issue.details}\n`;
        }
      }

      prompt = prompt.replace('{securityIssues}', securityStr);
    } else {
      prompt = prompt.replace('{securityIssues}', '');
    }

    return prompt;
  }

  /**
   * Prepare prompt for project summary
   * @param fileSummaries Summaries of individual files
   * @param fileCount Number of files reviewed
   * @param config Configuration
   * @returns Prompt for the LLM
   */
  protected prepareProjectSummaryPrompt(
    fileSummaries: string,
    fileCount: number,
    config: BaseLLMReviewerConfig
  ): string {
    let prompt = config.projectSummaryPrompt || this.DEFAULT_PROJECT_SUMMARY_PROMPT;

    // Replace placeholders
    prompt = prompt.replace('{fileCount}', fileCount.toString());
    prompt = prompt.replace('{fileSummaries}', fileSummaries);

    return prompt;
  }

  /**
   * Filter files based on include/exclude patterns
   * @param files Files to filter
   * @param config Configuration
   * @returns Filtered files
   */
  protected filterFiles(files: CollectedFile[], config: BaseLLMReviewerConfig): CollectedFile[] {
    let result = [...files];

    // Apply exclude patterns
    if (config.excludePatterns && config.excludePatterns.length > 0) {
      result = result.filter(file => !this.matchesAnyPattern(file.filePath, config.excludePatterns!));
    }

    // Apply include patterns
    if (config.includePatterns && config.includePatterns.length > 0) {
      result = result.filter(file => this.matchesAnyPattern(file.filePath, config.includePatterns!));
    }

    return result;
  }

  /**
   * Check if a file path matches any of the given patterns
   * @param filePath File path to check
   * @param patterns Patterns to match against
   * @returns Whether the file path matches any pattern
   */
  protected matchesAnyPattern(filePath: string, patterns: string[]): boolean {
    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of patterns) {
      if (this.matchesGlobPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a path matches a glob pattern
   * @param path Path to check
   * @param pattern Glob pattern
   * @returns Whether the path matches the pattern
   */
  protected matchesGlobPattern(path: string, pattern: string): boolean {
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
  protected getEffectiveConfig(config?: BaseLLMReviewerConfig): BaseLLMReviewerConfig {
    return {
      maxContentLength: config?.maxContentLength || 100000,
      includeMetadata: config?.includeMetadata !== false,
      includeSecurityIssues: config?.includeSecurityIssues !== false,
      generateFileSummaries: config?.generateFileSummaries !== false,
      generateProjectSummary: config?.generateProjectSummary !== false,
      fileReviewPrompt: config?.fileReviewPrompt || this.DEFAULT_FILE_REVIEW_PROMPT,
      projectSummaryPrompt: config?.projectSummaryPrompt || this.DEFAULT_PROJECT_SUMMARY_PROMPT,
      excludePatterns: config?.excludePatterns || [],
      includePatterns: config?.includePatterns || [],
      maxFiles: config?.maxFiles || 50
    };
  }

  /**
   * Clean up resources
   * Must be implemented by subclasses
   */
  abstract cleanup(): Promise<void>;
}
