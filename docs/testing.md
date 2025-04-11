# Testing Guide for ContextR

This document provides comprehensive information about testing the ContextR library, including how to run tests, what tests are available, and how to write new tests.

## Table of Contents

- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Categories](#test-categories)
  - [Core Functionality Tests](#core-functionality-tests)
  - [Plugin System Tests](#plugin-system-tests)
  - [Security Scanner Tests](#security-scanner-tests)
  - [Output Renderer Tests](#output-renderer-tests)
- [Writing New Tests](#writing-new-tests)
- [Test Examples](#test-examples)
- [Feature Tests Script](#feature-tests-script)

## Running Tests

ContextR uses Jest for unit testing. To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- __tests__/PluginManager.test.ts

# Run tests matching a pattern
npm test -- -t "PluginManager"

# Run feature tests (integration tests)
npm run test:features
```

## Test Structure

Tests are organized in the `__tests__` directory, with each test file corresponding to a specific component or feature of the library. The test files follow the naming convention `ComponentName.test.ts`.

## Test Categories

### Core Functionality Tests

These tests cover the core functionality of the library, such as file collection, pattern matching, and basic rendering.

- **FileContextBuilder.test.ts**: Tests the basic context builder functionality
- **FileCollector.test.ts**: Tests file collection with various patterns and options
- **WhitelistBlacklist.test.ts**: Tests inclusion and exclusion patterns
- **FileContentSearch.test.ts**: Tests searching for content within files

### Plugin System Tests

These tests cover the plugin system, including plugin registration, loading, and management.

- **PluginManager.test.ts**: Tests the plugin manager functionality
- **PluginEnabledFileContextBuilder.test.ts**: Tests the plugin-enabled context builder

### Security Scanner Tests

These tests cover the security scanner plugins, which detect potential security issues in files.

- **GitIgnoreSecurityScanner.test.ts**: Tests the GitIgnore security scanner
- **SensitiveDataSecurityScanner.test.ts**: Tests the sensitive data security scanner

### Output Renderer Tests

These tests cover the output renderer plugins, which format context in different ways.

- **MarkdownRenderer.test.ts**: Tests the Markdown renderer
- **HTMLRenderer.test.ts**: Tests the HTML renderer

## Writing New Tests

When writing new tests for ContextR, follow these guidelines:

1. Create a new test file in the `__tests__` directory with the naming convention `ComponentName.test.ts`
2. Import the necessary dependencies and the component to test
3. Use Jest's `describe`, `test`, and `expect` functions to structure your tests
4. Mock external dependencies using Jest's mocking capabilities
5. Test both success and failure cases
6. Test edge cases and boundary conditions

Example test structure:

```typescript
import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { ComponentToTest } from '../src/path/to/component';

describe('ComponentToTest', () => {
  let component: ComponentToTest;
  
  beforeEach(() => {
    // Reset mocks and create a new component for each test
    jest.clearAllMocks();
    component = new ComponentToTest();
  });
  
  describe('methodName', () => {
    test('should do something', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
    
    test('should handle errors', () => {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      expect(() => component.methodName(invalidInput)).toThrow('Error message');
    });
  });
});
```

## Test Examples

### Plugin Manager Test Example

```typescript
// Test registering a security scanner plugin
test('should register a security scanner plugin', () => {
  // Create a mock security scanner plugin
  const mockPlugin = {
    id: 'test-security-scanner',
    name: 'Test Security Scanner',
    type: PluginType.SECURITY_SCANNER,
    version: '1.0.0',
    description: 'A test security scanner plugin',
    scanFiles: jest.fn()
  };
  
  // Register the plugin
  pluginManager.registerPlugin(mockPlugin);
  
  // Verify the plugin was registered
  expect(pluginManager.getAllPlugins()).toContain(mockPlugin);
  expect(pluginManager.getSecurityScanners()).toContain(mockPlugin);
});
```

### Security Scanner Test Example

```typescript
// Test detecting sensitive data in file content
test('should detect sensitive data in file content', () => {
  // Sample file content with sensitive data
  const content = `
    const apiKey = "abc123xyz456";
    const password = "securePassword123";
    const config = {
      secret: "very-secret-value",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    };
  `;
  
  // Define patterns to search for
  const patterns = [
    'api[_\\s-]?key',
    'password',
    'secret',
    'token'
  ];
  
  // Scan the content
  const issues = scanner.scanContent('config.js', content, patterns);
  
  // Verify issues were found for each pattern
  expect(issues).toHaveLength(4);
  expect(issues.some(issue => issue.name === 'API Key')).toBe(true);
  expect(issues.some(issue => issue.name === 'Password')).toBe(true);
  expect(issues.some(issue => issue.name === 'Secret')).toBe(true);
  expect(issues.some(issue => issue.name === 'Token')).toBe(true);
});
```

### Output Renderer Test Example

```typescript
// Test rendering files to Markdown format
test('should render files to Markdown format', async () => {
  // Create mock files
  const files = [
    {
      filePath: 'src/index.js',
      content: 'console.log("Hello world");',
      meta: { size: 100, lastModified: new Date('2023-01-01') }
    },
    {
      filePath: 'README.md',
      content: '# Project\n\nDescription',
      meta: { size: 200, lastModified: new Date('2023-01-02') }
    }
  ];
  
  // Render the files
  const markdown = await renderer.render(files);
  
  // Verify the markdown contains expected elements
  expect(markdown).toContain('# Code Context');
  expect(markdown).toContain('## Summary');
  expect(markdown).toContain('This context contains 2 files');
  expect(markdown).toContain('## Files');
  expect(markdown).toContain('### src/index.js');
  expect(markdown).toContain('### README.md');
  expect(markdown).toContain('```javascript');
  expect(markdown).toContain('```markdown');
  expect(markdown).toContain('console.log("Hello world");');
  expect(markdown).toContain('# Project');
});
```

## Feature Tests Script

In addition to unit tests, ContextR includes a feature tests script (`scripts/test-features.js`) that tests the major features of the library in an integrated way. This script:

1. Creates test files with various content and structures
2. Tests basic file collection
3. Tests regex pattern matching
4. Tests whitelist/blacklist functionality
5. Tests in-file search
6. Tests tree view generation
7. Tests list-only mode
8. Tests security features
9. Tests output renderers

To run the feature tests:

```bash
npm run test:features
```

The feature tests generate output files in the `scripts/test-output` directory, which can be inspected to verify the functionality of the library.

### Expected Results

When running the feature tests, you should see output similar to the following:

```
Starting contextr feature tests...
Creating test files...
Test files created successfully!

Testing basic file collection...
Basic file collection successful!
Collected 10 files

Testing regex pattern matching...
Regex pattern matching successful!
Matched 3 files with pattern .*\.js$

Testing whitelist/blacklist...
Whitelist/blacklist successful!
Included 5 files, excluded 3 files

Testing in-file search...
In-file search successful!
Found 2 files containing "API_KEY"

Testing tree view...
Tree view successful!
Generated tree with 10 nodes

Testing list-only mode...
List-only mode successful!
Listed 2 binary files

Testing security features...
Security features successful!
Found 3 security issues

Testing output renderers...
Output renderers successful!
Markdown output length: 3456 characters
HTML output length: 7890 characters

All tests completed successfully!
Test output files are available in the test-output directory
```

The test output files include:

- `context.md`: Markdown output from the Markdown renderer
- `context.html`: HTML output from the HTML renderer
- `tree.txt`: Text representation of the file tree
- `security-report.json`: JSON report of security issues

These files can be inspected to verify that the renderers and security scanners are working correctly.
