#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { 
  FileContextBuilder, 
  FileCollectorConfig,
  ConsoleRenderer,
  JsonRenderer,
  WhitelistBlacklist,
  FileContentSearch,
  FileSearchOptions,
  RegexPatternMatcher
} from '../index';

// Get package version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
);

const program = new Command();

program
  .name('contextr')
  .description('A lightweight library that packages your project\'s code files into structured context for LLMs')
  .version(packageJson.version);

program
  .command('build')
  .description('Build context from your project files')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .option('-d, --dir <directories...>', 'Directories to include (comma-separated patterns)')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-r, --regex', 'Use regex for pattern matching', false)
  .option('-n, --name <n>', 'Context name', 'Project Context')
  .option('--no-contents', 'Don\'t show file contents')
  .option('--no-meta', 'Don\'t show metadata')
  .option('--ext <extensions...>', 'Filter by file extensions (e.g., js,ts,md)')
  .option('--search <pattern>', 'Only include files containing this pattern')
  .option('--search-regex', 'Use regex for search pattern', false)
  .option('--whitelist <patterns...>', 'Whitelist patterns (alternative to include)')
  .option('--blacklist <patterns...>', 'Blacklist patterns (alternative to exclude)')
  .action(async (options) => {
    try {
      let config: FileCollectorConfig;

      // Load from config file if provided
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (!fs.existsSync(configPath)) {
          console.error(chalk.red(`Error: Config file not found: ${configPath}`));
          process.exit(1);
        }
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        // Build config from command line options
        config = {
          name: options.name,
          showContents: options.contents !== false,
          showMeta: options.meta !== false,
          includeDirs: [],
          includeFiles: [],
          excludeFiles: [],
          useRegex: options.regex
        };

        // Add directories
        if (options.dir) {
          const dirs = Array.isArray(options.dir) ? options.dir : [options.dir];
          dirs.forEach((dirStr: string) => {
            const dirParts = dirStr.split(':');
            const dirPath = dirParts[0];
            const patterns = dirParts.length > 1 ? dirParts[1].split(',') : ['**/*'];
            
            config.includeDirs!.push({
              path: dirPath,
              include: patterns,
              recursive: true,
              useRegex: options.regex
            });
          });
        }

        // Add include files (or whitelist)
        if (options.include || options.whitelist) {
          const includes = options.include 
            ? (Array.isArray(options.include) ? options.include : [options.include])
            : (Array.isArray(options.whitelist) ? options.whitelist : [options.whitelist]);
          config.includeFiles = includes;
        }

        // Add exclude files (or blacklist)
        if (options.exclude || options.blacklist) {
          const excludes = options.exclude
            ? (Array.isArray(options.exclude) ? options.exclude : [options.exclude])
            : (Array.isArray(options.blacklist) ? options.blacklist : [options.blacklist]);
          config.excludeFiles = excludes;
        }
        
        // Add search in files option
        if (options.search) {
          config.searchInFiles = {
            pattern: options.search,
            isRegex: options.searchRegex || false
          };
        }
      }

      console.log(chalk.blue('Building context...'));
      const builder = new FileContextBuilder(config);
      let context = await builder.build();
      
      // Filter by file extensions if specified
      if (options.ext) {
        const extensions = Array.isArray(options.ext) 
          ? options.ext 
          : options.ext.split(',').map((ext: string) => ext.trim());
        
        const filteredFiles = context.files.filter(file => {
          const fileExt = path.extname(file.filePath).substring(1); // Remove the dot
          return extensions.includes(fileExt);
        });
        
        console.log(chalk.blue(`Filtered to ${filteredFiles.length} files with extensions: ${extensions.join(', ')}`));
        context.files = filteredFiles;
      }

      let output: string;
      if (options.format === 'json') {
        const jsonRenderer = new JsonRenderer();
        const jsonOutput = jsonRenderer.render(context);
        output = JSON.stringify(jsonOutput, null, 2);
      } else {
        const consoleRenderer = new ConsoleRenderer();
        output = consoleRenderer.render(context);
      }

      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, output);
        console.log(chalk.green(`Context written to ${outputPath}`));
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(chalk.red('Error building context:'), error);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for content within files')
  .option('-p, --pattern <pattern>', 'Search pattern')
  .option('-d, --dir <directories...>', 'Directories to search in')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-r, --regex', 'Use regex for pattern matching', false)
  .option('-c, --case-sensitive', 'Case sensitive search', false)
  .option('-w, --whole-word', 'Match whole words only', false)
  .option('--context <lines>', 'Number of context lines', '2')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (text, json, files-only, count)', 'text')
  .option('--ext <extensions...>', 'Filter by file extensions (e.g., js,ts,md)')
  .option('--no-highlight', 'Disable match highlighting')
  .option('--max-results <number>', 'Maximum number of results to return', '100')
  .action(async (options) => {
    try {
      if (!options.pattern) {
        console.error(chalk.red('Error: Search pattern is required'));
        process.exit(1);
      }

      // Build config for file collection
      const config: FileCollectorConfig = {
        name: 'Search Context',
        showContents: true,
        showMeta: false,
        includeDirs: [],
        includeFiles: [],
        excludeFiles: [],
        useRegex: options.regex
      };

      // Add directories
      if (options.dir) {
        const dirs = Array.isArray(options.dir) ? options.dir : [options.dir];
        dirs.forEach((dirStr: string) => {
          const dirParts = dirStr.split(':');
          const dirPath = dirParts[0];
          const patterns = dirParts.length > 1 ? dirParts[1].split(',') : ['**/*'];
          
          config.includeDirs!.push({
            path: dirPath,
            include: patterns,
            recursive: true,
            useRegex: options.regex
          });
        });
      } else {
        // Default to current directory if none specified
        config.includeDirs!.push({
          path: '.',
          include: ['**/*'],
          recursive: true,
          useRegex: options.regex
        });
      }

      // Add include files
      if (options.include) {
        const includes = Array.isArray(options.include) ? options.include : [options.include];
        config.includeFiles = includes;
      }

      // Add exclude files
      if (options.exclude) {
        const excludes = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
        config.excludeFiles = excludes;
      }

      console.log(chalk.blue('Collecting files...'));
      const builder = new FileContextBuilder(config);
      const context = await builder.build();
      
      // Filter by file extensions if specified
      let filesToSearch = context.files;
      if (options.ext) {
        const extensions = Array.isArray(options.ext) 
          ? options.ext 
          : options.ext.split(',').map((ext: string) => ext.trim());
        
        filesToSearch = context.files.filter(file => {
          const fileExt = path.extname(file.filePath).substring(1); // Remove the dot
          return extensions.includes(fileExt);
        });
        
        console.log(chalk.blue(`Filtered to ${filesToSearch.length} files with extensions: ${extensions.join(', ')}`));
      }

      console.log(chalk.blue(`Searching ${filesToSearch.length} files for: ${options.pattern}`));
      
      const searchOptions: FileSearchOptions = {
        pattern: options.pattern,
        isRegex: options.regex,
        caseSensitive: options.caseSensitive,
        wholeWord: options.wholeWord,
        contextLines: parseInt(options.context, 10),
        maxResults: parseInt(options.maxResults, 10)
      };

      // Handle different output formats
      switch (options.format.toLowerCase()) {
        case 'json': {
          const results = FileContentSearch.searchAsJson(filesToSearch, searchOptions);
          if (results.length === 0) {
            console.log(chalk.yellow('No matches found.'));
            return;
          }
          
          const jsonOutput = JSON.stringify(results, null, 2);
          if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, jsonOutput);
            console.log(chalk.green(`Search results written to ${outputPath}`));
          } else {
            console.log(jsonOutput);
          }
          break;
        }
        
        case 'files-only': {
          const matchingFiles = FileContentSearch.searchForMatchingFiles(filesToSearch, searchOptions);
          if (matchingFiles.length === 0) {
            console.log(chalk.yellow('No matches found.'));
            return;
          }
          
          const output = matchingFiles.join('\n');
          if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, output);
            console.log(chalk.green(`Matching files written to ${outputPath}`));
          } else {
            console.log(output);
          }
          break;
        }
        
        case 'count': {
          const totalMatches = FileContentSearch.countMatches(filesToSearch, searchOptions);
          const searchResults = FileContentSearch.searchInFiles(filesToSearch, searchOptions);
          const output = `Total matches: ${totalMatches}\nMatching files: ${searchResults.length}`;
          
          if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, output);
            console.log(chalk.green(`Search count written to ${outputPath}`));
          } else {
            console.log(chalk.green(output));
          }
          break;
        }
        
        default: { // text format
          const searchResults = FileContentSearch.searchInFiles(filesToSearch, searchOptions);
          
          if (searchResults.length === 0) {
            console.log(chalk.yellow('No matches found.'));
            return;
          }

          console.log(chalk.green(`Found matches in ${searchResults.length} files.`));
          
          const formatOptions = {
            showFilePath: true,
            highlightMatches: options.highlight !== false
          };
          
          let resultsWithContext = searchResults;
          if (searchOptions.contextLines && searchOptions.contextLines > 0) {
            resultsWithContext = searchResults.map(result => 
              FileContentSearch.addContextLines(result, searchOptions.contextLines)
            );
          }
          
          const formattedResults = FileContentSearch.formatResults(
            resultsWithContext,
            formatOptions.showFilePath,
            formatOptions.highlightMatches
          );
          
          if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, formattedResults);
            console.log(chalk.green(`Search results written to ${outputPath}`));
          } else {
            console.log(formattedResults);
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('Error searching files:'), error);
      process.exit(1);
    }
  });

program
  .command('studio')
  .description('Launch the ContextR Studio UI')
  .option('-p, --port <port>', 'Port to run the studio on', '3000')
  .option('--host <host>', 'Host to bind to', 'localhost')
  .option('--open', 'Open browser automatically', false)
  .action((options) => {
    console.log(chalk.yellow(`ContextR Studio is launching on http://${options.host}:${options.port}...`));
    
    // Set environment variables for the studio
    process.env.CONTEXTR_STUDIO_PORT = options.port;
    process.env.CONTEXTR_STUDIO_HOST = options.host;
    process.env.CONTEXTR_STUDIO_OPEN_BROWSER = options.open ? 'true' : 'false';
    
    require('./studio');
  });

program
  .command('config')
  .description('Manage configuration presets')
  .option('--save <name>', 'Save current options as a preset')
  .option('--load <name>', 'Load a saved preset')
  .option('--list', 'List all saved presets')
  .option('--delete <name>', 'Delete a saved preset')
  .action((options) => {
    try {
      // Create config directory if it doesn't exist
      const configDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.contextr');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const presetsFile = path.join(configDir, 'presets.json');
      let presets = {};
      
      // Load existing presets if available
      if (fs.existsSync(presetsFile)) {
        presets = JSON.parse(fs.readFileSync(presetsFile, 'utf8'));
      }
      
      if (options.list) {
        console.log(chalk.blue('Saved presets:'));
        if (Object.keys(presets).length === 0) {
          console.log(chalk.yellow('No presets found.'));
        } else {
          Object.keys(presets).forEach(name => {
            console.log(`- ${name}`);
          });
        }
      } else if (options.save) {
        // Get all options from command line
        const preset = {
          // Capture relevant options here
          name: options.save,
          timestamp: new Date().toISOString()
        };
        
        presets[options.save] = preset;
        fs.writeFileSync(presetsFile, JSON.stringify(presets, null, 2));
        console.log(chalk.green(`Preset "${options.save}" saved successfully.`));
      } else if (options.load) {
        if (!presets[options.load]) {
          console.error(chalk.red(`Preset "${options.load}" not found.`));
          process.exit(1);
        }
        
        console.log(chalk.green(`Loaded preset "${options.load}".`));
        // Apply preset options
        // This would typically modify the command line args or set environment variables
      } else if (options.delete) {
        if (!presets[options.delete]) {
          console.error(chalk.red(`Preset "${options.delete}" not found.`));
          process.exit(1);
        }
        
        delete presets[options.delete];
        fs.writeFileSync(presetsFile, JSON.stringify(presets, null, 2));
        console.log(chalk.green(`Preset "${options.delete}" deleted successfully.`));
      } else {
        console.log(chalk.yellow('No action specified. Use --save, --load, --list, or --delete.'));
      }
    } catch (error) {
      console.error(chalk.red('Error managing configuration:'), error);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${(program as any).args?.join(' ') || 'unknown'}`));
  console.error('See --help for a list of available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}
