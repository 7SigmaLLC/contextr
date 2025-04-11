const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directories
console.log('Creating dist directories...');
fs.mkdirSync('dist/cjs', { recursive: true });
fs.mkdirSync('dist/esm', { recursive: true });

// Copy files
console.log('Copying files...');
execSync('cp -r src/* dist/cjs/');
execSync('cp -r src/* dist/esm/');

// Make bin file executable
console.log('Making bin file executable...');
execSync('chmod +x dist/cjs/cli/bin.js');

console.log('Build completed successfully!');
