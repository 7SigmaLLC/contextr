#!/usr/bin/env node

// Test script for contextr features
// This script tests all the major features of contextr

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Import contextr
let contextr;
try {
  contextr = require('../dist/cjs');
} catch (error) {
  console.error(chalk.red('Error importing contextr:'), error.message);
  console.error(chalk.yellow('Make sure you have built the project with "npm run build"'));
  process.exit(1);
}

// Create test directory structure
async function createTestFiles() {
  console.log(chalk.blue('Creating test files...'));
  
  const testDir = path.join(__dirname, 'test-project');
  
  // Create directories
  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.mkdir(path.join(testDir, 'src'), { recursive: true });
  await fs.promises.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });
  await fs.promises.mkdir(path.join(testDir, 'config'), { recursive: true });
  await fs.promises.mkdir(path.join(testDir, 'public'), { recursive: true });
  await fs.promises.mkdir(path.join(testDir, 'public', 'images'), { recursive: true });
  
  // Create test files
  await fs.promises.writeFile(path.join(testDir, 'src', 'index.js'), `
// Main entry point
const { utils } = require('./utils');

function main() {
  console.log('Hello from contextr test project!');
  utils.greet('World');
}

main();
  `);
  
  await fs.promises.writeFile(path.join(testDir, 'src', 'utils', 'index.js'), `
// Utility functions
exports.utils = {
  greet: function(name) {
    console.log(\`Hello, \${name}!\`);
  },
  
  // TODO: Implement this function
  calculate: function(a, b) {
    return a + b;
  }
};
  `);
  
  await fs.promises.writeFile(path.join(testDir, 'config', 'config.js'), `
// Configuration
module.exports = {
  apiKey: 'abc123xyz456', // This is a sensitive value
  dbPassword: 'securePassword123', // This is a sensitive value
  endpoint: 'https://api.example.com'
};
  `);
  
  await fs.promises.writeFile(path.join(testDir, '.env'), `
API_KEY=abc123xyz456
DB_PASSWORD=securePassword123
ENDPOINT=https://api.example.com
  `);
  
  await fs.promises.writeFile(path.join(testDir, '.gitignore'), `
node_modules
.env
*.log
dist
  `);
  
  // Create a binary-like file
  const imageData = Buffer.from('fake image data');
  await fs.promises.writeFile(path.join(testDir, 'public', 'images', 'logo.png'), imageData);
  
  console.log(chalk.green('Test files created successfully!'));
  
  return testDir;
}

// Test basic file collection
async function testBasicFileCollection(testDir) {
  console.log(chalk.blue('\nTesting basic file collection...'));
  
  const { FileContextBuilder } = contextr;
  
  const builder = new FileContextBuilder({
    includeDirs: [
      path.join(testDir, 'src')
    ],
    includeFiles: [
      path.join(testDir, 'config', 'config.js')
    ]
  });
  
  const result = await builder.build('console');
  
  console.log(chalk.green('Basic file collection successful!'));
  console.log(`Collected ${result.files.length} files`);
  
  return result;
}

// Test regex pattern matching
async function testRegexPatternMatching(testDir) {
  console.log(chalk.blue('\nTesting regex pattern matching...'));
  
  const { FileContextBuilder } = contextr;
  
  const builder = new FileContextBuilder({
    includeDirs: [
      path.join(testDir, 'src')
    ],
    exclude: [
      /utils/
    ],
    useRegex: true
  });
  
  const result = await builder.build('console');
  
  console.log(chalk.green('Regex pattern matching successful!'));
  console.log(`Collected ${result.files.length} files`);
  
  return result;
}

// Test whitelist/blacklist
async function testWhitelistBlacklist(testDir) {
  console.log(chalk.blue('\nTesting whitelist/blacklist...'));
  
  const { FileContextBuilder, WhitelistBlacklist } = contextr;
  
  // Create whitelist/blacklist configuration
  const fileFilter = WhitelistBlacklist.create({
    whitelist: [
      path.join(testDir, 'src', '**', '*.js')
    ],
    blacklist: [
      path.join(testDir, 'src', 'utils', '**')
    ]
  });
  
  // Use with context builder
  const builder = new FileContextBuilder({
    fileFilter
  });
  
  const result = await builder.build('console');
  
  console.log(chalk.green('Whitelist/blacklist successful!'));
  console.log(`Collected ${result.files.length} files`);
  
  return result;
}

// Test in-file search
async function testInFileSearch(testDir) {
  console.log(chalk.blue('\nTesting in-file search...'));
  
  const { FileContentSearch } = contextr;
  
  // Search for specific content
  const searchResults = await FileContentSearch.searchInFiles({
    patterns: ['TODO', /apiKey/i],
    directories: [testDir],
    useRegex: true,
    caseSensitive: false
  });
  
  console.log(chalk.green('In-file search successful!'));
  console.log(`Found ${searchResults.length} matches`);
  
  return searchResults;
}

// Test tree view
async function testTreeView(testDir) {
  console.log(chalk.blue('\nTesting tree view...'));
  
  const { generateTree, formatTree } = contextr;
  
  // Generate tree
  const tree = await generateTree({
    rootDir: testDir,
    exclude: ['node_modules/**'],
    listOnlyPatterns: ['**/*.png']
  });
  
  // Format tree
  const formattedTree = formatTree(tree, { 
    showSize: true, 
    showListOnly: true 
  });
  
  console.log(chalk.green('Tree view successful!'));
  console.log(formattedTree);
  
  return tree;
}

// Test list-only mode
async function testListOnlyMode(testDir) {
  console.log(chalk.blue('\nTesting list-only mode...'));
  
  const { FileContextBuilder } = contextr;
  
  const builder = new FileContextBuilder({
    includeDirs: [testDir],
    listOnlyPatterns: ['**/*.png', '**/.env']
  });
  
  const result = await builder.build('console');
  
  const listOnlyFiles = result.files.filter(file => file.meta?.isListOnly);
  
  console.log(chalk.green('List-only mode successful!'));
  console.log(`Found ${listOnlyFiles.length} list-only files`);
  
  return result;
}

// Test security features
async function testSecurityFeatures(testDir) {
  console.log(chalk.blue('\nTesting security features...'));
  
  const { PluginEnabledFileContextBuilder } = contextr;
  
  // Create a plugin-enabled builder
  const builder = new PluginEnabledFileContextBuilder({
    includeDirs: [testDir],
    plugins: {
      securityScanners: [
        'gitignore-security-scanner',
        'sensitive-data-security-scanner'
      ],
      securityScannerConfig: {
        'gitignore-security-scanner': {
          treatGitIgnoreAsSecurityIssue: true
        },
        'sensitive-data-security-scanner': {
          envFilesKeysOnly: true
        }
      }
    }
  });
  
  const result = await builder.build('console');
  
  // Find security issues
  const securityIssues = result.files
    .filter(file => file.meta?.securityIssues?.length > 0)
    .map(file => ({
      filePath: file.filePath,
      issues: file.meta.securityIssues
    }));
  
  console.log(chalk.green('Security features successful!'));
  console.log(`Found ${securityIssues.length} files with security issues`);
  
  return result;
}

// Test output renderers
async function testOutputRenderers(testDir) {
  console.log(chalk.blue('\nTesting output renderers...'));
  
  const { PluginEnabledFileContextBuilder } = contextr;
  
  // Create a plugin-enabled builder
  const builder = new PluginEnabledFileContextBuilder({
    includeDirs: [
      path.join(testDir, 'src')
    ],
    includeFiles: [
      path.join(testDir, 'config', 'config.js')
    ],
    plugins: {
      outputRenderers: [
        'markdown-renderer',
        'html-renderer'
      ],
      outputRendererConfig: {
        'markdown-renderer': {
          includeTableOfContents: true,
          includeSecurityWarnings: true
        },
        'html-renderer': {
          includeSecurityWarnings: true,
          collapsibleSections: true
        }
      }
    }
  });
  
  // Test markdown renderer
  const markdownResult = await builder.build('markdown');
  
  // Test HTML renderer
  const htmlResult = await builder.build('html');
  
  console.log(chalk.green('Output renderers successful!'));
  console.log(`Markdown output length: ${markdownResult.output.length} characters`);
  console.log(`HTML output length: ${htmlResult.output.length} characters`);
  
  // Write outputs to files for inspection
  const outputDir = path.join(__dirname, 'test-output');
  await fs.promises.mkdir(outputDir, { recursive: true });
  
  await fs.promises.writeFile(
    path.join(outputDir, 'context.md'), 
    markdownResult.output
  );
  
  await fs.promises.writeFile(
    path.join(outputDir, 'context.html'), 
    htmlResult.output
  );
  
  console.log(chalk.green(`Output files written to ${outputDir}`));
  
  return { markdownResult, htmlResult };
}

// Run all tests
async function runTests() {
  try {
    console.log(chalk.yellow('Starting contextr feature tests...'));
    
    // Create test files
    const testDir = await createTestFiles();
    
    // Run tests
    await testBasicFileCollection(testDir);
    await testRegexPatternMatching(testDir);
    await testWhitelistBlacklist(testDir);
    await testInFileSearch(testDir);
    await testTreeView(testDir);
    await testListOnlyMode(testDir);
    await testSecurityFeatures(testDir);
    await testOutputRenderers(testDir);
    
    console.log(chalk.green('\nAll tests completed successfully!'));
    console.log(chalk.yellow('Test output files are available in the test-output directory'));
    
  } catch (error) {
    console.error(chalk.red('\nTest failed:'), error);
    process.exit(1);
  }
}

// Run tests
runTests();
