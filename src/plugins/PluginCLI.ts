// Plugin system CLI integration
// This file extends the CLI to support plugin commands and options

import { Command } from 'commander';
import { pluginManager } from './PluginManager';
import { PluginEnabledFileContextBuilder } from './PluginEnabledFileContextBuilder';
import chalk from 'chalk';

/**
 * Register plugin-related commands with the CLI
 * @param program Commander program instance
 */
export function registerPluginCommands(program: Command): void {
  // Add plugins command
  const pluginsCommand = program
    .command('plugins')
    .description('Manage plugins');

  // List plugins
  pluginsCommand
    .command('list')
    .description('List installed plugins')
    .option('-t, --type <type>', 'Filter by plugin type (security-scanner, output-renderer, llm-reviewer)')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        await pluginManager.loadPlugins();

        let plugins = pluginManager.getAllPlugins();

        // Filter by type if specified
        if (options.type) {
          plugins = plugins.filter(p => p.type === options.type);
        }

        if (options.json) {
          console.log(JSON.stringify(plugins, null, 2));
          return;
        }

        if (plugins.length === 0) {
          console.log('No plugins installed.');
          return;
        }

        console.log(chalk.bold('Installed plugins:'));

        // Group by type
        const byType = plugins.reduce((acc, plugin) => {
          if (!acc[plugin.type]) {
            acc[plugin.type] = [];
          }
          acc[plugin.type].push(plugin);
          return acc;
        }, {} as Record<string, any[]>);

        for (const [type, typePlugins] of Object.entries(byType)) {
          console.log(chalk.cyan(`\n${formatPluginType(type)}:`));

          for (const plugin of typePlugins) {
            console.log(`  ${chalk.green(plugin.name)} (${plugin.id}) v${plugin.version}`);
            console.log(`    ${plugin.description}`);
          }
        }
      } catch (error) {
        console.error(chalk.red('Error listing plugins:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Add plugin options to build command
  program.commands.forEach(cmd => {
    if (cmd.name() === 'build') {
      cmd
        .option('--enable-plugins', 'Enable plugin system')
        .option('--security-scanners <ids>', 'Security scanner plugin IDs to use (comma-separated)')
        .option('--output-renderer <id>', 'Output renderer plugin ID to use')
        .option('--llm-reviewers <ids>', 'LLM reviewer plugin IDs to use (comma-separated)')
        .option('--generate-security-report', 'Generate security reports')
        .option('--generate-summaries', 'Generate summaries using LLM reviewers')
        .option('--security-report-file <file>', 'File to write security report to')
        .option('--summaries-file <file>', 'File to write summaries to');
    }
  });

  // Add plugin options to search command
  program.commands.forEach(cmd => {
    if (cmd.name() === 'search') {
      cmd
        .option('--enable-plugins', 'Enable plugin system')
        .option('--security-scanners <ids>', 'Security scanner plugin IDs to use (comma-separated)')
        .option('--output-renderer <id>', 'Output renderer plugin ID to use');
    }
  });
}

/**
 * Apply plugin options from CLI to config
 * @param config Configuration object
 * @param options CLI options
 */
export function applyPluginOptions(config: any, options: any): void {
  if (options.enablePlugins) {
    config.enablePlugins = true;
  }

  if (options.securityScanners) {
    config.securityScanners = options.securityScanners.split(',');
  }

  if (options.outputRenderer) {
    config.outputRenderer = options.outputRenderer;
  }

  if (options.llmReviewers) {
    config.llmReviewers = options.llmReviewers.split(',');
  }

  if (options.generateSecurityReport) {
    config.generateSecurityReports = true;
  }

  if (options.generateSummaries) {
    config.generateSummaries = true;
  }
}

/**
 * Handle plugin-specific output from build result
 * @param result Build result
 * @param options CLI options
 */
export async function handlePluginOutput(result: any, options: any): Promise<void> {
  // Write security reports to file if specified
  if (options.securityReportFile && result.securityReports && result.securityReports.length > 0) {
    const fs = require('fs-extra');
    await fs.writeJson(options.securityReportFile, result.securityReports, { spaces: 2 });
    console.log(chalk.green(`Security reports written to ${options.securityReportFile}`));
  }

  // Write summaries to file if specified
  if (options.summariesFile && result.summaries && Object.keys(result.summaries).length > 0) {
    const fs = require('fs-extra');
    await fs.writeJson(options.summariesFile, result.summaries, { spaces: 2 });
    console.log(chalk.green(`Summaries written to ${options.summariesFile}`));
  }

  // Display security issues in console
  if (result.securityReports && result.securityReports.length > 0) {
    console.log(chalk.yellow('\nSecurity issues found:'));

    let totalIssues = 0;

    for (const report of result.securityReports) {
      console.log(chalk.cyan(`\n${report.scannerId}:`));

      if (report.issues.length === 0) {
        console.log('  No issues found');
        continue;
      }

      totalIssues += report.issues.length;

      // Group by severity
      const bySeverity = report.issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) {
          acc[issue.severity] = [];
        }
        acc[issue.severity].push(issue);
        return acc;
      }, {} as Record<string, any[]>);

      // Display issues by severity (critical first)
      const severities = ['critical', 'error', 'warning', 'info'];

      for (const severity of severities) {
        if (bySeverity[severity]) {
          const color = getSeverityColor(severity);
          console.log(`  ${color(severity.toUpperCase())} (${bySeverity[severity].length}):`);

          // Limit to 5 issues per severity to avoid overwhelming output
          const issuesToShow = bySeverity[severity].slice(0, 5);
          const remaining = bySeverity[severity].length - issuesToShow.length;

          for (const issue of issuesToShow) {
            console.log(`    ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''}`);
            console.log(`      ${issue.description}`);
          }

          if (remaining > 0) {
            console.log(`    ... and ${remaining} more ${severity} issues`);
          }
        }
      }
    }

    console.log(chalk.yellow(`\nTotal security issues: ${totalIssues}`));
  }

  // Display summaries
  if (result.summaries && Object.keys(result.summaries).length > 0) {
    console.log(chalk.yellow('\nSummaries:'));

    for (const [reviewerId, summary] of Object.entries(result.summaries)) {
      console.log(chalk.cyan(`\n${reviewerId}:`));
      console.log(summary);
    }
  }
}

/**
 * Format plugin type for display
 * @param type Plugin type
 */
function formatPluginType(type: string): string {
  switch (type) {
    case 'security-scanner':
      return 'Security Scanners';
    case 'output-renderer':
      return 'Output Renderers';
    case 'llm-reviewer':
      return 'LLM Reviewers';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

/**
 * Get color function for severity
 * @param severity Severity level
 */
function getSeverityColor(severity: string): (text: string) => string {
  switch (severity) {
    case 'critical':
      return chalk.red.bold;
    case 'error':
      return chalk.red;
    case 'warning':
      return chalk.yellow;
    case 'info':
      return chalk.blue;
    default:
      return chalk.white;
  }
}
