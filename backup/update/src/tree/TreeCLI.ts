// CLI integration for Tree View feature
// This file adds tree view commands to the CLI

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { generateTree, formatTree, TreeViewConfig } from './TreeView';
import { FileContextBuilder } from '../FileContextBuilder';
import { PluginEnabledFileContextBuilder } from '../plugins/PluginEnabledFileContextBuilder';
import * as fs from 'fs-extra';

/**
 * Register tree view commands with the CLI
 * @param program Commander program instance
 */
export function registerTreeCommands(program: Command): void {
  // Add tree command
  const treeCommand = program
    .command('tree')
    .description('Show file tree of a directory');
  
  // Show tree
  treeCommand
    .command('show')
    .description('Show file tree of a directory')
    .option('-d, --dir <path>', 'Directory to show tree for (default: current directory)', process.cwd())
    .option('-H, --include-hidden', 'Include hidden files and directories')
    .option('-D, --max-depth <depth>', 'Maximum depth to traverse', parseInt)
    .option('-e, --exclude <patterns>', 'Patterns to exclude (comma-separated)')
    .option('-i, --include <patterns>', 'Patterns to include (comma-separated)')
    .option('-r, --regex', 'Use regex for pattern matching')
    .option('--no-dirs', 'Exclude directories from the output')
    .option('--no-files', 'Exclude files from the output')
    .option('--no-size', 'Don\'t show file sizes')
    .option('-m, --mod-time', 'Show file modification times')
    .option('-l, --list-only <patterns>', 'Patterns for files to list only (comma-separated)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .action(async (options) => {
      try {
        // Parse patterns
        const exclude = options.exclude ? options.exclude.split(',') : [];
        const include = options.include ? options.include.split(',') : [];
        const listOnlyPatterns = options.listOnly ? options.listOnly.split(',') : [];
        
        // Create tree config
        const treeConfig: TreeViewConfig = {
          rootDir: options.dir,
          includeHidden: options.includeHidden,
          maxDepth: options.maxDepth,
          exclude,
          include,
          useRegex: options.regex,
          includeDirs: options.dirs,
          includeFiles: options.files,
          includeSize: options.size,
          includeModTime: options.modTime,
          listOnlyPatterns
        };
        
        // Generate tree
        const tree = await generateTree(treeConfig);
        
        // Format output
        let output: string;
        if (options.format === 'json') {
          output = JSON.stringify(tree, null, 2);
        } else {
          output = formatTree(tree, {
            showSize: options.size,
            showModTime: options.modTime,
            showListOnly: true
          });
        }
        
        // Output result
        if (options.output) {
          await fs.writeFile(options.output, output);
          console.log(chalk.green(`Tree written to ${options.output}`));
        } else {
          console.log(output);
        }
      } catch (error) {
        console.error(chalk.red('Error showing tree:'), error.message);
        process.exit(1);
      }
    });
  
  // Build context from tree
  treeCommand
    .command('build')
    .description('Build context from file tree')
    .option('-d, --dir <path>', 'Directory to show tree for (default: current directory)', process.cwd())
    .option('-H, --include-hidden', 'Include hidden files and directories')
    .option('-D, --max-depth <depth>', 'Maximum depth to traverse', parseInt)
    .option('-e, --exclude <patterns>', 'Patterns to exclude (comma-separated)')
    .option('-i, --include <patterns>', 'Patterns to include (comma-separated)')
    .option('-r, --regex', 'Use regex for pattern matching')
    .option('-l, --list-only <patterns>', 'Patterns for files to list only (comma-separated)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-f, --format <format>', 'Output format (console, json, markdown, html)', 'console')
    .option('--enable-plugins', 'Enable plugin system')
    .option('--security-scanners <ids>', 'Security scanner plugin IDs to use (comma-separated)')
    .option('--output-renderer <id>', 'Output renderer plugin ID to use')
    .option('--llm-reviewers <ids>', 'LLM reviewer plugin IDs to use (comma-separated)')
    .option('--generate-security-report', 'Generate security reports')
    .option('--generate-summaries', 'Generate summaries using LLM reviewers')
    .action(async (options) => {
      try {
        // Parse patterns
        const exclude = options.exclude ? options.exclude.split(',') : [];
        const include = options.include ? options.include.split(',') : [];
        const listOnlyPatterns = options.listOnly ? options.listOnly.split(',') : [];
        
        // Create tree config
        const treeConfig: TreeViewConfig = {
          rootDir: options.dir,
          includeHidden: options.includeHidden,
          maxDepth: options.maxDepth,
          exclude,
          include,
          useRegex: options.regex,
          includeDirs: true,
          includeFiles: true,
          includeSize: true,
          includeModTime: false,
          listOnlyPatterns
        };
        
        // Generate tree
        const tree = await generateTree(treeConfig);
        
        // Prepare file list
        const fileList: string[] = [];
        const listOnlyFiles: string[] = [];
        
        function traverseTree(node: any, basePath: string = '') {
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
        let builder;
        if (options.enablePlugins) {
          builder = new PluginEnabledFileContextBuilder(builderConfig);
          
          // Apply plugin options
          if (options.securityScanners) {
            (builder as any).pluginConfig.securityScanners = options.securityScanners.split(',');
          }
          
          if (options.outputRenderer) {
            (builder as any).pluginConfig.outputRenderer = options.outputRenderer;
          }
          
          if (options.llmReviewers) {
            (builder as any).pluginConfig.llmReviewers = options.llmReviewers.split(',');
          }
          
          if (options.generateSecurityReport) {
            (builder as any).pluginConfig.generateSecurityReports = true;
          }
          
          if (options.generateSummaries) {
            (builder as any).pluginConfig.generateSummaries = true;
          }
        } else {
          builder = new FileContextBuilder(builderConfig);
        }
        
        // Build context
        const result = await builder.build(options.format);
        
        // Output result
        if (options.output) {
          await fs.writeFile(options.output, result.output);
          console.log(chalk.green(`Context written to ${options.output}`));
        } else {
          console.log(result.output);
        }
      } catch (error) {
        console.error(chalk.red('Error building context from tree:'), error.message);
        process.exit(1);
      }
    });
  
  // Add tree options to build command
  program.commands.forEach(cmd => {
    if (cmd.name() === 'build') {
      cmd
        .option('--show-tree', 'Show file tree before building context')
        .option('--list-only <patterns>', 'Patterns for files to list only (comma-separated)');
    }
  });
}

/**
 * Apply tree options from CLI to config
 * @param config Configuration object
 * @param options CLI options
 */
export function applyTreeOptions(config: any, options: any): void {
  if (options.listOnly) {
    config.listOnlyFiles = options.listOnly.split(',');
  }
}
