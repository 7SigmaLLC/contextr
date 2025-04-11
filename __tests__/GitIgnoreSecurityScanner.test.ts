import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { GitIgnoreSecurityScanner } from '../src/plugins/security-scanners/GitIgnoreSecurityScanner';
import { SecurityIssueSeverity } from '../src/types';

describe('GitIgnoreSecurityScanner', () => {
  let scanner: GitIgnoreSecurityScanner;

  beforeEach(() => {
    // Create a new scanner for each test
    scanner = new GitIgnoreSecurityScanner();
  });

  describe('scanFiles', () => {
    test('should scan files and return them', async () => {
      // Create mock files
      const files = [
        { filePath: 'src/index.js', content: 'console.log("Hello");', meta: {} },
        { filePath: '.env', content: 'API_KEY=123456', meta: {} }
      ];

      // Scan the files
      const result = await scanner.scanFiles(files);

      // Verify files were returned
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });
});
