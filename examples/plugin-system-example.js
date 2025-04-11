// Example: Using the Plugin System
// This example demonstrates how to use the plugin system in contextr

const { PluginEnabledFileContextBuilder } = require('contextr');

// Create a plugin-enabled context builder
const builder = new PluginEnabledFileContextBuilder({
  // Files to include in the context
  includeFiles: [
    'src/index.js',
    'src/utils.js',
    'package.json',
    'README.md'
  ],
  
  // Files to include in the tree but not their contents
  listOnlyFiles: [
    'public/images/logo.png',
    'public/styles/main.css'
  ],
  
  // Plugin configuration
  plugins: {
    // Enable specific security scanners
    securityScanners: [
      'gitignore-security-scanner',
      'sensitive-data-security-scanner'
    ],
    
    // Configure security scanners
    securityScannerConfig: {
      'sensitive-data-security-scanner': {
        // Patterns to look for
        patterns: [
          'api[_\\s-]?key',
          'password',
          'secret',
          'token'
        ],
        // Special handling for env files
        envFilesKeysOnly: true
      },
      
      'gitignore-security-scanner': {
        // Additional gitignore files to use
        additionalGitIgnoreFiles: [
          '.env.example'
        ],
        // Automatically exclude gitignore matches
        autoExcludeGitIgnoreMatches: true
      }
    },
    
    // Enable specific output renderers
    outputRenderers: [
      'markdown-renderer',
      'html-renderer'
    ],
    
    // Configure output renderers
    outputRendererConfig: {
      'markdown-renderer': {
        includeSecurityWarnings: true,
        includeTableOfContents: true,
        includeLineNumbers: true
      },
      
      'html-renderer': {
        includeSecurityWarnings: true,
        collapsibleSections: true,
        customCSS: '.security-warning { color: red; }'
      }
    },
    
    // Enable LLM reviewers
    llmReviewers: [
      'local-llm-reviewer'
    ],
    
    // Configure LLM reviewers
    llmReviewerConfig: {
      'local-llm-reviewer': {
        generateFileSummaries: true,
        generateProjectSummary: true,
        maxFiles: 20
      }
    }
  }
});

// Build context with the plugin system
async function buildContext() {
  try {
    // Build context with HTML format
    const result = await builder.build('html');
    
    // Output the result
    console.log('Context built successfully!');
    console.log(`Output length: ${result.output.length} characters`);
    
    // Write to file
    const fs = require('fs');
    fs.writeFileSync('context.html', result.output);
    console.log('Context written to context.html');
    
    // Get security issues
    const securityIssues = result.files
      .filter(file => file.meta?.securityIssues?.length > 0)
      .map(file => ({
        filePath: file.filePath,
        issues: file.meta.securityIssues
      }));
    
    if (securityIssues.length > 0) {
      console.log('\nSecurity issues found:');
      securityIssues.forEach(file => {
        console.log(`\n${file.filePath}:`);
        file.issues.forEach(issue => {
          console.log(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      });
    } else {
      console.log('\nNo security issues found.');
    }
    
    // Get LLM project summary if available
    const projectSummary = result.files[0]?.meta?.llmProjectSummary?.['local-llm-reviewer'];
    if (projectSummary) {
      console.log('\nProject Summary:');
      console.log(projectSummary);
    }
  } catch (error) {
    console.error('Error building context:', error);
  }
}

buildContext();
