# Release Notes - contextr v1.1.0

## Overview

We're excited to announce the release of contextr v1.1.0, which introduces a powerful plugin system and numerous enhancements to make building context for LLMs more flexible, secure, and user-friendly.

## New Features

### Plugin System
- Added a comprehensive plugin architecture that supports:
  - Security scanners for detecting sensitive information
  - Output renderers for formatting context in different ways
  - LLM reviewers for code analysis and summarization
- Implemented plugin discovery and loading from a designated plugins directory
- Created a plugin management system with lifecycle hooks

### Security Features
- **GitIgnore Security Scanner**: Automatically exclude files matched by .gitignore patterns
- **Sensitive Data Security Scanner**: Detect API keys, passwords, and other sensitive information
- Special handling for env files with option to include only keys without values
- Security warnings integration with output renderers

### Tree View Feature
- Added ability to show the full project tree structure
- Comprehensive configuration options for tree visualization
- Integration with the context building process
- CLI commands for tree operations

### List-only Mode
- Support for including files in the tree without their contents
- Pattern-based configuration for list-only files
- Special handling for binary files with appropriate placeholders
- Integration with the tree view feature

### Output Renderers
- **Markdown Renderer**: Creates documentation with syntax highlighting and table of contents
- **HTML Renderer**: Generates interactive HTML with collapsible sections and security warnings
- Enhanced console and JSON renderers

### LLM Reviewer Support
- Base framework for LLM-powered code review
- Local LLM integration with support for Ollama, LLama.cpp, and GPT4All
- No API key requirements - works with locally installed models
- Code summarization and security analysis capabilities

### CLI Enhancements
- New commands for tree operations and security scanning
- Improved help documentation
- Support for all new features via command-line options

### UI Studio Mode
- Visual interface for building context and managing files
- File tree navigation with drag-and-drop support
- Configuration management with visual controls
- Preview in multiple formats

### Module Compatibility
- Support for both CommonJS and ES modules
- Improved import compatibility across different JavaScript environments
- Consistent API across module systems

## Improvements

### Documentation
- Comprehensive README with detailed usage examples
- Plugin development guide
- VSCode extension concept documentation
- Improved inline code documentation

### Examples
- Added comprehensive examples demonstrating all features
- Examples for both CommonJS and ES modules
- Security features demonstration
- Tree view and list-only mode examples

### Performance
- Optimized file collection process
- Improved handling of large files
- Better error handling and reporting

## Breaking Changes
- None. This release maintains backward compatibility with previous versions.

## Upgrading
To upgrade to the latest version:

```bash
npm install contextr@latest
```

## Future Plans
- VSCode extension implementation
- Additional security scanners
- More output renderers
- Enhanced LLM integration

## Feedback
We welcome your feedback and contributions! Please open issues or pull requests on our GitHub repository.

## Contributors
- 7SigmaLLC Team
