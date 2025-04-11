import { promises as fs } from "fs";
import * as path from "path";
import { CollectedFile } from "../types";
import { RegexPatternMatcher } from "./RegexPatternMatcher";

/**
 * Result of a file content search operation
 */
export interface FileSearchResult {
  file: CollectedFile;
  filePath?: string;
  content?: string;
  matches: {
    line: number;
    content: string;
    matchIndex: number;
    matchLength: number;
    contextContent?: string;
    contextStartLine?: number;
    contextEndLine?: number;
    beforeContext?: string;
    afterContext?: string;
  }[];
  matchCount: number;
}

/**
 * Options for file content search
 */
export interface FileSearchOptions {
  pattern: string;
  isRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  maxResults?: number;
  contextLines?: number;
}

/**
 * Helper class for searching content within files
 */
export class FileContentSearch {
  /**
   * Searches for content within a single file
   * @param file The file to search in
   * @param options Search options
   * @returns Search results with matches
   */
  public static searchInFile(file: CollectedFile, options: FileSearchOptions): FileSearchResult {
    const { pattern, isRegex, caseSensitive, wholeWord } = options;
    const lines = file.content.split('\n');
    const matches: FileSearchResult['matches'] = [];

    // Create regex pattern based on options
    let searchRegex: RegExp | null;

    if (isRegex) {
      // Use RegexPatternMatcher to handle pattern with flags
      const flags = caseSensitive ? 'g' : 'gi';
      searchRegex = RegexPatternMatcher.createRegex(pattern, flags);
    } else {
      // For plain text search
      let escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        escapedPattern = `\\b${escapedPattern}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';
      searchRegex = new RegExp(escapedPattern, flags);
    }

    if (!searchRegex) {
      console.error(`Invalid search pattern: ${pattern}`);
      return { file, matches: [], matchCount: 0 };
    }

    // Search each line for matches
    lines.forEach((lineContent, lineIndex) => {
      let match;
      searchRegex!.lastIndex = 0; // Reset regex for each line

      while ((match = searchRegex!.exec(lineContent)) !== null) {
        matches.push({
          line: lineIndex + 1, // 1-based line numbers
          content: lineContent,
          matchIndex: match.index,
          matchLength: match[0].length
        });

        // Avoid infinite loops with zero-length matches
        if (match.index === searchRegex!.lastIndex) {
          searchRegex!.lastIndex++;
        }
      }
    });

    return {
      file,
      matches,
      matchCount: matches.length
    };
  }

  /**
   * Searches for content within multiple files
   * @param files Array of files to search in
   * @param options Search options
   * @returns Array of search results
   */
  public static searchInFiles(files: CollectedFile[], options: FileSearchOptions): FileSearchResult[] {
    const results = files
      .map(file => this.searchInFile(file, options))
      .filter(result => result.matchCount > 0);

    // Limit results if maxResults is specified
    if (options.maxResults && results.length > options.maxResults) {
      return results.slice(0, options.maxResults);
    }

    return results;
  }

  /**
   * Gets context lines around a match
   * @param result Search result
   * @param contextLines Number of context lines before and after match
   * @returns Search result with context lines added
   */
  public static addContextLines(result: FileSearchResult, contextLines: number = 2): FileSearchResult {
    if (contextLines <= 0) {
      return result;
    }

    const lines = result.file.content.split('\n');
    const matchesWithContext = result.matches.map(match => {
      // Use RegexPatternMatcher's findMatchesWithContext for more robust context extraction
      const lineIndex = match.line - 1; // Convert to 0-based for array access
      const lineContent = lines[lineIndex];

      const startLine = Math.max(0, lineIndex - contextLines);
      const endLine = Math.min(lines.length - 1, lineIndex + contextLines);

      // Add context lines to the match object
      const contextContent = lines.slice(startLine, endLine + 1).join('\n');
      const beforeContext = lines.slice(startLine, lineIndex).join('\n');
      const afterContext = lines.slice(lineIndex + 1, endLine + 1).join('\n');

      return {
        ...match,
        contextContent,
        contextStartLine: startLine + 1, // Convert back to 1-based
        contextEndLine: endLine + 1,    // Convert back to 1-based
        beforeContext,
        afterContext
      };
    });

    return {
      ...result,
      matches: matchesWithContext as any
    };
  }

  /**
   * Formats search results as a string
   * @param results Search results
   * @param showFilePath Whether to show file paths
   * @param highlightMatches Whether to highlight matches
   * @returns Formatted string with search results
   */
  public static formatResults(
    results: FileSearchResult[],
    showFilePath: boolean = true,
    highlightMatches: boolean = true
  ): string {
    let output = '';

    results.forEach(result => {
      if (showFilePath) {
        output += `\nFile: ${result.file.filePath} (${result.matchCount} matches)\n`;
        output += '='.repeat(result.file.filePath.length + 10) + '\n';
      }

      result.matches.forEach(match => {
        // Check if we have context content (from addContextLines)
        if (match.contextContent) {
          // Show line numbers for context
          output += `Lines ${match.contextStartLine}-${match.contextEndLine}:\n`;

          // Show before context if available
          if (match.beforeContext && match.beforeContext.length > 0) {
            output += match.beforeContext + '\n';
          }

          // Show the matching line with highlighting
          if (highlightMatches && match.matchIndex >= 0) {
            const beforeMatch = match.content.substring(0, match.matchIndex);
            const matchText = match.content.substring(match.matchIndex, match.matchIndex + match.matchLength);
            const afterMatch = match.content.substring(match.matchIndex + match.matchLength);

            output += `${beforeMatch}>>>${matchText}<<<${afterMatch}\n`;
            output += `Line ${match.line}: ` + ' '.repeat(match.matchIndex) + '^'.repeat(match.matchLength) + '\n';
          } else {
            output += `Line ${match.line}: ${match.content}\n`;
          }

          // Show after context if available
          if (match.afterContext && match.afterContext.length > 0) {
            output += match.afterContext + '\n';
          }
        } else {
          // Original behavior for results without context
          output += `Line ${match.line}: ${match.content}\n`;

          // Add a pointer to the match
          if (highlightMatches && match.matchIndex >= 0) {
            output += ' '.repeat(match.matchIndex + 7) + '^'.repeat(match.matchLength) + '\n';
          }
        }

        output += '\n';
      });
    });

    return output;
  }

  /**
   * Searches for content in files and returns formatted results
   * @param files Array of files to search in
   * @param options Search options
   * @param formatOptions Formatting options
   * @returns Formatted string with search results
   */
  public static search(
    files: CollectedFile[],
    options: FileSearchOptions,
    formatOptions: {
      showFilePath?: boolean,
      highlightMatches?: boolean
    } = {}
  ): string {
    const results = this.searchInFiles(files, options);

    if (options.contextLines && options.contextLines > 0) {
      const resultsWithContext = results.map(result =>
        this.addContextLines(result, options.contextLines)
      );
      return this.formatResults(
        resultsWithContext,
        formatOptions.showFilePath !== undefined ? formatOptions.showFilePath : true,
        formatOptions.highlightMatches !== undefined ? formatOptions.highlightMatches : true
      );
    }

    return this.formatResults(
      results,
      formatOptions.showFilePath !== undefined ? formatOptions.showFilePath : true,
      formatOptions.highlightMatches !== undefined ? formatOptions.highlightMatches : true
    );
  }

  /**
   * Searches for content in files and returns results as JSON
   * @param files Array of files to search in
   * @param options Search options
   * @returns JSON object with search results
   */
  public static searchAsJson(files: CollectedFile[], options: FileSearchOptions): any {
    const results = this.searchInFiles(files, options);

    if (options.contextLines && options.contextLines > 0) {
      return results.map(result => this.addContextLines(result, options.contextLines));
    }

    return results;
  }

  /**
   * Searches for content in files and returns only matching file paths
   * @param files Array of files to search in
   * @param options Search options
   * @returns Array of file paths that contain matches
   */
  public static searchForMatchingFiles(files: CollectedFile[], options: FileSearchOptions): string[] {
    const results = this.searchInFiles(files, options);
    return results.map(result => result.file.filePath);
  }

  /**
   * Counts matches across all files
   * @param files Array of files to search in
   * @param options Search options
   * @returns Total number of matches
   */
  public static countMatches(files: CollectedFile[], options: FileSearchOptions): number {
    const results = this.searchInFiles(files, options);
    return results.reduce((total, result) => total + result.matchCount, 0);
  }
}
