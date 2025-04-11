// src/renderers/ConsoleRenderer.ts
import * as path from 'path';
import chalk from 'chalk';
import { FileContext } from '../types';
import { Renderer } from './Renderer';

interface TreeNode {
  name: string;
  children: TreeNode[];
  isFile: boolean;
  filePath?: string;
  fileSize?: number;
}

export class ConsoleRenderer implements Renderer<string> {
  render(context: FileContext): string {
    let output = "";
    const config = context.config;
    const files = context.files;

    // Render meta: Directory Tree
    if (config.showMeta) {
      output += chalk.bold.blue("=== Directory Tree ===") + "\n";
      const tree = this.buildTree(files);
      output += chalk.bold(tree.name) + "\n";
      output += this.getTreeString(tree, "");
      output += "\n";
    }

    // Render file contents
    if (config.showContents) {
      for (const file of files) {
        if (config.showMeta) {
          output += chalk.yellow(
            `--- File: ${file.filePath} (Size: ${file.fileSize} bytes, ${file.lineCount} lines) ---`
          ) + "\n";
        }
        output += file.content + "\n";
        if (config.showMeta) {
          output += "\n";
        }
      }
    }

    // Render summary with Included Files and Statistics sections.
    if (config.showMeta) {
      output += chalk.bold.blue("=== Summary ===") + "\n";

      // Included Files Section: list every file with its metadata.
      output += "\n" + chalk.bold.magenta("Included Files:") + "\n";
      files.forEach((file) => {
        output += `  ${chalk.cyan(file.filePath)} - ${chalk.green(
          file.fileSize + " bytes"
        )}, ${chalk.green(file.lineCount + " lines")}\n`;
      });

      // Statistics Section: compute overall stats based on file content.
      const totalFiles = files.length;
      const totalLines = files.reduce((sum, file) => sum + (file.lineCount || 0), 0);
      const totalSize = files.reduce((sum, file) => sum + (file.fileSize || 0), 0);
      const totalChars = files.reduce((sum, file) => sum + file.content.length, 0);
      // A rough heuristic: 1 token ≈ 4 characters.
      const estimatedTokens = Math.round(totalChars / 4);

      output += "\n" + chalk.bold.magenta("Statistics:") + "\n";
      output += `  ${chalk.green("Total files:")} ${chalk.cyan(totalFiles.toString())}\n`;
      output += `  ${chalk.green("Total lines:")} ${chalk.cyan(totalLines.toString())}\n`;
      output += `  ${chalk.green("Total size:")} ${chalk.cyan(totalSize.toString() + " bytes")}\n`;
      output += `  ${chalk.green("Estimated tokens:")} ${chalk.cyan(estimatedTokens.toString())}\n`;
    }

    return output;
  }

  private buildTree(files: FileContext["files"]): TreeNode {
    const root: TreeNode = { name: ".", children: [], isFile: false };
    for (const file of files) {
      const parts = (file.relativePath || file.filePath).split(path.sep);
      let currentNode = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        let child = currentNode.children.find((n) => n.name === part);
        if (!child) {
          child = {
            name: part,
            children: [],
            isFile: i === parts.length - 1,
          };
          if (child.isFile) {
            child.filePath = file.filePath;
            child.fileSize = file.fileSize;
          }
          currentNode.children.push(child);
        }
        currentNode = child;
      }
    }
    return root;
  }

  private getTreeString(node: TreeNode, prefix: string): string {
    let str = "";
    const children = node.children;
    const lastIndex = children.length - 1;
    children.forEach((child, index) => {
      const isLast = index === lastIndex;
      str += prefix + (isLast ? "└── " : "├── ") + chalk.yellow(child.name) + "\n";
      str += this.getTreeString(child, prefix + (isLast ? "    " : "│   "));
    });
    return str;
  }
}