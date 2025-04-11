import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { SensitiveDataSecurityScanner } from '../src/plugins/security-scanners/SensitiveDataSecurityScanner';
import { SecurityIssueSeverity } from '../src/types';

describe('SensitiveDataSecurityScanner', () => {
  let scanner: SensitiveDataSecurityScanner;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new scanner for each test
    scanner = new SensitiveDataSecurityScanner();
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
