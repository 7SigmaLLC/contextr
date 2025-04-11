// Example: Tree View and List-Only Mode
// This example demonstrates how to use the tree view feature and list-only mode

const { generateTree, formatTree, integrateTreeWithCollector } = require('contextr');
const { FileContextBuilder } = require('contextr');
const path = require('path');
const fs = require('fs');

// Example 1: Generate and display a tree
async function showProjectTree() {
  console.log('Example 1: Generate and display a project tree\n');
  
  // Configure tree view
  const treeConfig = {
    rootDir: process.cwd(),
    includeHidden: false,
    maxDepth: 3,
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**'
    ],
    includeSize: true,
    listOnlyPatterns: [
      '**/*.png',
      '**/*.jpg',
      '**/*.gif',
      '**/*.svg'
    ]
  };
  
  // Generate tree
  const tree = await generateTree(treeConfig);
  
  // Format and display tree
  const formattedTree = formatTree(tree, {
    showSize: true,
    showListOnly: true
  });
  
  console.log(formattedTree);
  console.log('\n');
}

// Example 2: Build context using tree and list-only mode
async function buildContextFromTree() {
  console.log('Example 2: Build context using tree and list-only mode\n');
  
  // Configure tree view
  const treeConfig = {
    rootDir: process.cwd(),
    includeHidden: false,
    maxDepth: 3,
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**'
    ],
    listOnlyPatterns: [
      '**/*.png',
      '**/*.jpg',
      '**/*.gif',
      '**/*.svg',
      '**/*.min.js'
    ]
  };
  
  // Generate tree
  const tree = await generateTree(treeConfig);
  
  // Extract file paths from tree
  const fileList = [];
  const listOnlyFiles = [];
  
  function traverseTree(node, basePath = '') {
    if (!node.isDirectory) {
      const fullPath = path.join(basePath, node.path);
      if (node.listOnly) {
        listOnlyFiles.push(fullPath);
      } else {
        fileList.push(fullPath);
      }
    }
    
    if (node.children) {
      for (const child of node.children) {
        traverseTree(child, basePath);
      }
    }
  }
  
  traverseTree(tree);
  
  // Create builder config
  const builderConfig = {
    includeFiles: fileList,
    listOnlyFiles: listOnlyFiles
  };
  
  // Create builder
  const builder = new FileContextBuilder(builderConfig);
  
  // Build context
  const result = await builder.build('console');
  
  // Output summary
  console.log(`Context built with ${fileList.length} regular files and ${listOnlyFiles.length} list-only files.`);
  console.log('List-only files:');
  listOnlyFiles.forEach(file => {
    console.log(`- ${file}`);
  });
  
  // Write context to file
  fs.writeFileSync('context.txt', result.output);
  console.log('Context written to context.txt');
}

// Example 3: Using list-only mode with specific file types
async function listOnlySpecificTypes() {
  console.log('Example 3: Using list-only mode with specific file types\n');
  
  // Create builder with list-only configuration
  const builder = new FileContextBuilder({
    includeDirs: [
      'src',
      'public'
    ],
    exclude: [
      'node_modules/**',
      'dist/**'
    ],
    // List-only patterns for binary and large files
    listOnlyPatterns: [
      // Images
      '**/*.png',
      '**/*.jpg',
      '**/*.gif',
      '**/*.svg',
      // Minified files
      '**/*.min.js',
      '**/*.min.css',
      // Binary files
      '**/*.pdf',
      '**/*.zip',
      '**/*.exe',
      // Large files (handled separately in the code)
    ],
    // Use regex for some patterns
    useRegex: true
  });
  
  // Build context
  const result = await builder.build('console');
  
  // Output summary
  console.log(`Context built successfully.`);
  
  // Count list-only files
  const listOnlyCount = result.files.filter(file => file.meta?.isListOnly).length;
  console.log(`List-only files: ${listOnlyCount}`);
  
  // Write context to file
  fs.writeFileSync('context-list-only.txt', result.output);
  console.log('Context written to context-list-only.txt');
}

// Run examples
async function runExamples() {
  try {
    await showProjectTree();
    await buildContextFromTree();
    await listOnlySpecificTypes();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

runExamples();
