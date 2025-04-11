// src/renderers/JsonRenderer.ts
import { FileContext } from '../types';
import { Renderer } from './Renderer';

export interface FileContextJson {
  fileContext: FileContext;
  summary: {
    includedFiles: {
      filePath: string;
      fileSize: number;
      lineCount: number;
    }[];
    statistics: {
      totalFiles: number;
      totalLines: number;
      totalSize: number;
      estimatedTokens: number;
    };
  };
}

export class JsonRenderer implements Renderer {
  /**
   * Returns the rendered output as a string.
   */
  render(context: FileContext): string {
    const jsonData = this.renderToObject(context);
    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * Returns the rendered output as a typed object.
   */
  renderToObject(context: FileContext): FileContextJson {
    const includedFiles = context.files.map(file => ({
      filePath: file.filePath,
      fileSize: file.fileSize || 0,
      lineCount: file.lineCount || 0,
    }));

    const totalFiles = context.files.length;
    const totalLines = context.files.reduce((sum, file) => sum + (file.lineCount || 0), 0);
    const totalSize = context.files.reduce((sum, file) => sum + (file.fileSize || 0), 0);
    const totalChars = context.files.reduce((sum, file) => sum + file.content.length, 0);
    // A rough heuristic: 1 token ≈ 4 characters.
    const estimatedTokens = Math.round(totalChars / 4);

    return {
      fileContext: context,
      summary: {
        includedFiles,
        statistics: {
          totalFiles,
          totalLines,
          totalSize,
          estimatedTokens,
        },
      },
    };
  }
}