import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { FileContentSearch } from '../src/collector/FileContentSearch';
import { CollectedFile } from '../src/types';

describe('FileContentSearch', () => {
  // Mock files for testing
  const mockFiles: CollectedFile[] = [
    {
      filePath: '/path/to/file1.js',
      content: 'function hello() {\n  return "world";\n}\n\nconst test = "example";',
      meta: { size: 100, lastModified: new Date() }
    },
    {
      filePath: '/path/to/file2.js',
      content: 'const goodbye = () => {\n  console.log("goodbye world");\n};\n\nfunction test() {}',
      meta: { size: 120, lastModified: new Date() }
    },
    {
      filePath: '/path/to/file3.txt',
      content: 'This is a plain text file\nwith multiple lines\nNo functions here',
      meta: { size: 80, lastModified: new Date() }
    }
  ];

  describe('searchInFiles', () => {
    test('should find matches with plain text search', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      expect(results).toHaveLength(2);
      expect(results[0].filePath).toBe('/path/to/file1.js');
      expect(results[1].filePath).toBe('/path/to/file2.js');
      expect(results[0].matches[0].content).toContain('function');
    });

    test('should respect case sensitivity', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'Function',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false
      });

      expect(results).toHaveLength(0);
    });

    test('should support regex patterns', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'function\\s+\\w+',
        isRegex: true,
        caseSensitive: false,
        wholeWord: false
      });

      expect(results).toHaveLength(2);
      expect(results[0].matches[0].content).toContain('function hello');
      expect(results[1].matches[0].content).toContain('function test');
    });

    test('should respect whole word matching', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'test',
        isRegex: false,
        caseSensitive: false,
        wholeWord: true
      });

      expect(results).toHaveLength(1);
      expect(results[0].filePath).toBe('/path/to/file2.js');
    });

    test('should limit results if maxResults is specified', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'e',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false,
        maxResults: 1
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('searchAsJson', () => {
    test('should return results in JSON format', () => {
      const results = FileContentSearch.searchAsJson(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('filePath');
      expect(results[0]).toHaveProperty('matches');
      expect(results[0]).toHaveProperty('matchCount');
    });
  });

  describe('searchForMatchingFiles', () => {
    test('should return only file paths of matching files', () => {
      const results = FileContentSearch.searchForMatchingFiles(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      expect(results).toHaveLength(2);
      expect(results).toContain('/path/to/file1.js');
      expect(results).toContain('/path/to/file2.js');
    });
  });

  describe('countMatches', () => {
    test('should count total matches across all files', () => {
      const count = FileContentSearch.countMatches(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      expect(count).toBe(3); // 1 in file1.js, 2 in file2.js
    });
  });

  describe('addContextLines', () => {
    test('should add context lines around matches', () => {
      const result = {
        filePath: '/path/to/file1.js',
        content: 'function hello() {\n  return "world";\n}\n\nconst test = "example";',
        matches: [
          {
            lineNumber: 1,
            content: 'function hello() {',
            match: 'function',
            startIndex: 0,
            endIndex: 8
          }
        ],
        matchCount: 1
      };

      const withContext = FileContentSearch.addContextLines(result, 1);
      
      expect(withContext.matches[0]).toHaveProperty('contextBefore');
      expect(withContext.matches[0]).toHaveProperty('contextAfter');
      expect(withContext.matches[0].contextAfter).toContain('return "world"');
    });
  });

  describe('formatResults', () => {
    test('should format results as text with file paths', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      const formatted = FileContentSearch.formatResults(results, true, false);
      
      expect(formatted).toContain('/path/to/file1.js');
      expect(formatted).toContain('/path/to/file2.js');
    });

    test('should highlight matches when requested', () => {
      const results = FileContentSearch.searchInFiles(mockFiles, {
        pattern: 'function',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false
      });

      const formatted = FileContentSearch.formatResults(results, true, true);
      
      expect(formatted).toContain('\x1b[1;33m'); // ANSI color codes for highlighting
    });
  });
});
