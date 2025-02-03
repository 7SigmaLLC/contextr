import { FileContext } from '../types';
import { Renderer } from './Renderer';

export class JsonRenderer implements Renderer {
  render(context: FileContext): string {
    // Compute summary details based on the file context.
    const includedFiles = context.files.map(file => ({
      filePath: file.filePath,
      fileSize: file.fileSize,
      lineCount: file.lineCount
    }));

    const totalFiles = context.files.length;
    const totalLines = context.files.reduce((sum, file) => sum + file.lineCount, 0);
    const totalSize = context.files.reduce((sum, file) => sum + file.fileSize, 0);
    const totalChars = context.files.reduce((sum, file) => sum + file.content.length, 0);
    // A rough heuristic: 1 token ≈ 4 characters.
    const estimatedTokens = Math.round(totalChars / 4);

    const summary = {
      includedFiles,
      statistics: {
        totalFiles,
        totalLines,
        totalSize,
        estimatedTokens
      }
    };

    // Create an output object that includes both the original file context and the computed summary.
    const output = {
      fileContext: context,
      summary
    };

    return JSON.stringify(output, null, 2);
  }
}