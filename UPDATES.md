# ContextR Updates

This document provides an overview of the updates integrated from the enhanced version of ContextR.

## Major Updates

### 1. Plugin System

A comprehensive plugin system has been added to extend ContextR's functionality:

- **Security Scanners**: Plugins that scan files for security issues
  - `GitIgnoreSecurityScanner`: Detects files that should be ignored according to .gitignore rules
  - `SensitiveDataSecurityScanner`: Identifies sensitive data in files (API keys, passwords, etc.)

- **Output Renderers**: Plugins that render files to different formats
  - `HTMLRenderer`: Renders context to HTML format
  - `MarkdownRenderer`: Renders context to Markdown format

- **LLM Reviewers**: Plugins that use language models to review code
  - `BaseLLMReviewer`: Base class for LLM-based code reviewers
  - `LocalLLMReviewer`: Implementation for local LLMs (Ollama, Llama, GPT4All)

### 2. CLI Improvements

- New command-line interface with more features
- Studio UI for visual exploration of code context
- Tree view for visualizing file structure

### 3. File Collection Enhancements

- `ListOnlySupport`: Ability to list files without loading their content
- `FileContentSearch`: Search for content within files
- `RegexPatternMatcher`: Improved pattern matching with regex support
- `WhitelistBlacklist`: Better file filtering capabilities

### 4. Security Features

- Git integration to respect .gitignore rules
- Sensitive data detection and redaction
- Security reports generation

### 5. Documentation and Examples

- Added comprehensive examples in the `examples/` directory
- Visual documentation with SVG diagrams in the `images/` directory
- Release notes in `RELEASE_NOTES.md`

### 6. VS Code Extension Concept

- Added a concept document for a VS Code extension in `docs/vscode-extension-concept.md`

## File Structure Changes

### New Directories

- `src/cli/`: Command-line interface code
- `src/plugins/`: Plugin system implementation
- `src/security/`: Security-related features
- `src/tree/`: Tree view implementation
- `docs/`: Documentation files
- `examples/`: Example usage files
- `images/`: Diagrams and visual assets
- `scripts/`: Utility scripts

### New Files

- `run-contextr.js`: Script to run ContextR without building
- `tsconfig.esm.json`: TypeScript configuration for ESM output
- Various type definition files in `src/types/`
- Test files in `__tests__/`

## Running the Updated Version

Since there are TypeScript compilation errors that need to be fixed, you can use the `run-contextr.js` script to run the library directly:

```bash
# Show help
node run-contextr.js

# Run the example usage
node run-contextr.js example

# Build context from a directory
node run-contextr.js build --dir src --output context.txt

# Search in files
node run-contextr.js search "TODO" --dir src

# Launch the Studio UI
node run-contextr.js studio --port 3001
```

## Known Issues

- There are TypeScript compilation errors that prevent a full build
- Some interfaces have mismatches between their definitions and implementations
- Express.js type issues in the Studio UI

## Next Steps

1. Fix TypeScript errors to enable proper building
2. Implement the VS Code extension based on the concept document
3. Add more tests for the new features
4. Improve documentation for the plugin system
