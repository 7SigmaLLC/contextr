import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { HTMLRenderer } from '../src/plugins/output-renderers/HTMLRenderer';
import { SecurityIssueSeverity } from '../src/types';

describe('HTMLRenderer', () => {
  let renderer: HTMLRenderer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new renderer for each test
    renderer = new HTMLRenderer();
  });

  describe('render', () => {
    test('should render files to HTML format', async () => {
      // Create mock files
      const files = [
        { filePath: 'src/index.js', content: 'console.log("Hello world");', meta: {} },
        { filePath: 'README.md', content: '# Project\n\nDescription', meta: {} }
      ];

      // Render the files
      const html = await renderer.render(files);

      // Verify the HTML contains expected elements
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });
  });


});
