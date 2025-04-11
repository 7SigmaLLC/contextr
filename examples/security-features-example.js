// Example: Security Features
// This example demonstrates how to use the security features in contextr

const { PluginEnabledFileContextBuilder } = require('contextr');
const { GitIgnoreSecurityScanner } = require('contextr');
const { SensitiveDataSecurityScanner } = require('contextr');
const fs = require('fs');

// Example 1: Using the GitIgnore security scanner
async function useGitIgnoreSecurity() {
  console.log('Example 1: Using the GitIgnore security scanner\n');
  
  // Create a GitIgnore scanner
  const scanner = new GitIgnoreSecurityScanner();
  await scanner.initialize();
  
  // Load .gitignore files
  await scanner.loadGitIgnoreFiles([
    '.gitignore',
    '.env.example'  // Additional gitignore patterns
  ]);
  
  // Check if files are ignored
  const filesToCheck = [
    'src/index.js',
    'node_modules/express/index.js',
    '.env',
    'dist/bundle.js'
  ];
  
  console.log('Checking files against .gitignore patterns:');
  for (const file of filesToCheck) {
    const isIgnored = scanner.isIgnored(file);
    console.log(`- ${file}: ${isIgnored ? 'IGNORED' : 'included'}`);
  }
  
  // Create a builder with GitIgnore security
  const builder = new PluginEnabledFileContextBuilder({
    includeDirs: [
      'src',
      'config'
    ],
    plugins: {
      securityScanners: [
        'gitignore-security-scanner'
      ],
      securityScannerConfig: {
        'gitignore-security-scanner': {
          // Treat gitignore matches as security issues
          treatGitIgnoreAsSecurityIssue: true,
          // Don't automatically exclude matches
          autoExcludeGitIgnoreMatches: false
        }
      }
    }
  });
  
  // Build context
  const result = await builder.build('console');
  
  // Find security issues related to gitignore
  const gitignoreIssues = result.files
    .filter(file => 
      file.meta?.securityIssues?.some(issue => 
        issue.message.includes('.gitignore')
      )
    )
    .map(file => ({
      filePath: file.filePath,
      issues: file.meta.securityIssues.filter(issue => 
        issue.message.includes('.gitignore')
      )
    }));
  
  console.log('\nFiles matching .gitignore patterns:');
  if (gitignoreIssues.length > 0) {
    gitignoreIssues.forEach(file => {
      console.log(`- ${file.filePath}`);
      file.issues.forEach(issue => {
        console.log(`  * ${issue.message}`);
      });
    });
  } else {
    console.log('None');
  }
  
  console.log('\n');
}

// Example 2: Using the Sensitive Data security scanner
async function useSensitiveDataSecurity() {
  console.log('Example 2: Using the Sensitive Data security scanner\n');
  
  // Create a Sensitive Data scanner
  const scanner = new SensitiveDataSecurityScanner();
  await scanner.initialize();
  
  // Create sample files with sensitive data
  const sampleFiles = [
    {
      filePath: 'config.js',
      content: `
module.exports = {
  apiKey: 'abc123xyz456',
  dbPassword: 'securePassword123',
  endpoint: 'https://api.example.com'
};
      `
    },
    {
      filePath: '.env',
      content: `
API_KEY=abc123xyz456
DB_PASSWORD=securePassword123
ENDPOINT=https://api.example.com
      `
    },
    {
      filePath: 'safe.js',
      content: `
function add(a, b) {
  return a + b;
}

module.exports = { add };
      `
    }
  ];
  
  // Scan each file
  console.log('Scanning files for sensitive data:');
  for (const file of sampleFiles) {
    console.log(`\nFile: ${file.filePath}`);
    
    // Scan the file
    const result = await scanner.scanFile(file);
    
    // Check for security issues
    if (result.meta?.securityIssues?.length > 0) {
      console.log('Security issues found:');
      result.meta.securityIssues.forEach(issue => {
        console.log(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
        if (issue.details) {
          console.log(`  Details: ${issue.details}`);
        }
      });
    } else {
      console.log('No security issues found.');
    }
  }
  
  // Create a builder with Sensitive Data security
  const builder = new PluginEnabledFileContextBuilder({
    includeFiles: [
      'config.js',
      '.env',
      'safe.js'
    ],
    plugins: {
      securityScanners: [
        'sensitive-data-security-scanner'
      ],
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
        }
      }
    }
  });
  
  // Build context
  const result = await builder.build('console');
  
  // Write context to file
  fs.writeFileSync('context-security.txt', result.output);
  console.log('\nContext written to context-security.txt');
  console.log('\n');
}

// Example 3: Combining security features
async function combinedSecurityFeatures() {
  console.log('Example 3: Combining security features\n');
  
  // Create a builder with multiple security features
  const builder = new PluginEnabledFileContextBuilder({
    includeDirs: [
      'src',
      'config'
    ],
    plugins: {
      securityScanners: [
        'gitignore-security-scanner',
        'sensitive-data-security-scanner'
      ],
      securityScannerConfig: {
        'gitignore-security-scanner': {
          treatGitIgnoreAsSecurityIssue: true,
          autoExcludeGitIgnoreMatches: true
        },
        'sensitive-data-security-scanner': {
          patterns: [
            'api[_\\s-]?key',
            'password',
            'secret',
            'token',
            'credential'
          ],
          envFilesKeysOnly: true
        }
      },
      // Use HTML renderer to show security issues
      outputRenderers: [
        'html-renderer'
      ],
      outputRendererConfig: {
        'html-renderer': {
          includeSecurityWarnings: true,
          title: 'Security Report'
        }
      }
    }
  });
  
  // Build context
  const result = await builder.build('html');
  
  // Write context to file
  fs.writeFileSync('security-report.html', result.output);
  console.log('Security report written to security-report.html');
  
  // Count security issues by type
  const securityIssues = result.files
    .filter(file => file.meta?.securityIssues?.length > 0)
    .flatMap(file => file.meta.securityIssues);
  
  const gitignoreIssues = securityIssues.filter(issue => 
    issue.message.includes('.gitignore')
  ).length;
  
  const sensitiveDataIssues = securityIssues.filter(issue => 
    !issue.message.includes('.gitignore')
  ).length;
  
  console.log(`\nSecurity issues found:`);
  console.log(`- GitIgnore issues: ${gitignoreIssues}`);
  console.log(`- Sensitive data issues: ${sensitiveDataIssues}`);
  console.log(`- Total: ${securityIssues.length}`);
}

// Run examples
async function runExamples() {
  try {
    await useGitIgnoreSecurity();
    await useSensitiveDataSecurity();
    await combinedSecurityFeatures();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

runExamples();
