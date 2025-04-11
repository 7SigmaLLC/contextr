import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { MarkdownRenderer } from '../src/plugins/output-renderers/MarkdownRenderer';
import { SecurityIssueSeverity } from '../src/types';

describe('MarkdownRenderer', () => {
  let renderer: MarkdownRenderer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new renderer for each test
    renderer = new MarkdownRenderer();
  });

  describe('render', () => {
    test('should render files to Markdown format', async () => {
      // Create mock files
      const files = [
        { filePath: 'src/index.js', content: 'console.log("Hello world");', meta: {} },
        { filePath: 'README.md', content: '# Project\n\nDescription', meta: {} }
      ];

      // Render the files
      const markdown = await renderer.render(files);

      // Verify the markdown contains expected elements
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
    });
  });


});
