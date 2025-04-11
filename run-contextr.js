#!/usr/bin/env node

// This script runs contextr without building it
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a temporary directory for the build
const tempDir = path.join(__dirname, 'temp-build');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Get command line arguments
const args = process.argv.slice(2);

// If no arguments provided, show help
if (args.length === 0) {
  console.log(`
Contextr Runner
--------------
This script helps you run contextr without building it.

Usage:
  node run-contextr.js <command> [options]

Commands:
  build       Build context from your project files
  search      Search for content within files
  studio      Launch the ContextR Studio UI
  example     Run the example-usage.ts file

Examples:
  node run-contextr.js build --dir src --output context.txt
  node run-contextr.js search "TODO" --dir src
  node run-contextr.js studio
  node run-contextr.js example
`);
  process.exit(0);
}

// Handle the example command separately
if (args[0] === 'example') {
  runCommand('npx', ['tsx', 'example-usage.ts']);
  process.exit(0);
}

// For other commands, pass them to the CLI
runCommand('npx', ['tsx', 'src/cli/index.ts', ...args]);

function runCommand(cmd, args) {
  const proc = spawn(cmd, args, { 
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  
  proc.on('error', (err) => {
    console.error('Failed to run command:', err);
    process.exit(1);
  });
  
  proc.on('close', (code) => {
    if (code !== 0) {
      console.error(`Command exited with code ${code}`);
    }
  });
}
