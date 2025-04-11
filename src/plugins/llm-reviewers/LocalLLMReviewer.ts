// Local LLM Reviewer Plugin
// This plugin uses a local LLM for reviewing code and generating summaries

import * as path from 'path';
import * as fs from 'fs-extra';
import { spawn } from 'child_process';
import { BaseLLMReviewer, BaseLLMReviewerConfig } from './BaseLLMReviewer';
import { CollectedFile, SecurityIssueSeverity } from '../../types';

/**
 * Configuration for Local LLM reviewer
 */
interface LocalLLMReviewerConfig extends BaseLLMReviewerConfig {
  /** Path to the LLM executable or script */
  modelPath?: string;

  /** Model name to use (if supported by the executable) */
  modelName?: string;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for generation */
  temperature?: number;

  /** Additional arguments to pass to the LLM executable */
  additionalArgs?: string[];

  /** Timeout in milliseconds for LLM operations */
  timeout?: number;
}

/**
 * Local LLM Reviewer Plugin
 * Uses a locally installed LLM for reviewing code and generating summaries
 */
export class LocalLLMReviewer extends BaseLLMReviewer {
  // Default paths to check for LLM executables
  private readonly DEFAULT_LLM_PATHS = [
    // Ollama
    '/usr/local/bin/ollama',
    '/usr/bin/ollama',
    // LLama.cpp
    '/usr/local/bin/llama',
    '/usr/bin/llama',
    // GPT4All
    '/usr/local/bin/gpt4all',
    '/usr/bin/gpt4all',
  ];

  // Default model names
  private readonly DEFAULT_MODEL_NAMES = {
    'ollama': 'codellama',
    'llama': 'codellama-7b-instruct.Q4_K_M.gguf',
    'gpt4all': 'ggml-model-gpt4all-falcon-q4_0.bin'
  };

  private modelPath: string = '';
  private modelType: string = '';
  private modelName: string = '';
  private isModelAvailable: boolean = false;

  /**
   * Constructor
   */
  constructor() {
    super(
      'local-llm-reviewer',
      'Local LLM Reviewer',
      '1.0.0',
      'Uses a locally installed LLM for reviewing code and generating summaries'
    );
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    // Find LLM executable
    await this.findLLM();
  }

  /**
   * Check if the LLM is available
   */
  async isAvailable(): Promise<boolean> {
    return this.isModelAvailable;
  }

  /**
   * Find LLM executable
   */
  private async findLLM(): Promise<void> {
    // Check if model path is already set and valid
    if (this.modelPath && await fs.pathExists(this.modelPath)) {
      this.isModelAvailable = true;
      return;
    }

    // Check default paths
    for (const llmPath of this.DEFAULT_LLM_PATHS) {
      if (await fs.pathExists(llmPath)) {
        this.modelPath = llmPath;
        this.modelType = path.basename(llmPath);
        this.modelName = this.DEFAULT_MODEL_NAMES[this.modelType as keyof typeof this.DEFAULT_MODEL_NAMES] || '';

        // Verify the model works
        try {
          await this.testLLM();
          this.isModelAvailable = true;
          console.log(`Found working LLM at ${this.modelPath}`);
          return;
        } catch (error) {
          console.warn(`Found LLM at ${this.modelPath} but it failed the test:`, error instanceof Error ? error.message : String(error));
        }
      }
    }

    console.warn('No working LLM found');
    this.isModelAvailable = false;
  }

  /**
   * Test if the LLM works
   */
  private async testLLM(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const testPrompt = 'Say hello';
      let args: string[] = [];

      // Prepare arguments based on model type
      if (this.modelType === 'ollama') {
        args = ['run', this.modelName, testPrompt];
      } else if (this.modelType === 'llama') {
        args = ['-m', this.modelName, '-p', testPrompt, '--temp', '0.7', '-n', '10'];
      } else if (this.modelType === 'gpt4all') {
        args = ['-m', this.modelName, '-p', testPrompt];
      } else {
        reject(new Error(`Unsupported model type: ${this.modelType}`));
        return;
      }

      // Run the LLM with a timeout
      const process = spawn(this.modelPath, args);

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('LLM test timed out'));
      }, 10000);

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0 && output.length > 0) {
          resolve();
        } else {
          reject(new Error(`LLM test failed with code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Review a file using the LLM
   * @param prompt Prompt for the LLM
   * @param file File being reviewed
   * @returns Review results
   */
  protected async reviewFile(
    prompt: string,
    file: CollectedFile
  ): Promise<{
    summary: string;
    securityIssues?: Array<{
      description: string;
      severity: string;
      recommendation?: string;
    }>;
    improvements?: string[];
    notes?: string[];
  }> {
    // Run LLM with the prompt
    const response = await this.runLLM(prompt, {
      maxTokens: 1000,
      temperature: 0.3
    });

    // Parse the response
    return this.parseReviewResponse(response);
  }

  /**
   * Generate a project summary using the LLM
   * @param prompt Prompt for the LLM
   * @returns Project summary
   */
  protected async generateProjectSummary(prompt: string): Promise<string> {
    // Run LLM with the prompt
    return await this.runLLM(prompt, {
      maxTokens: 2000,
      temperature: 0.7
    });
  }

  /**
   * Run the LLM with a prompt
   * @param prompt Prompt for the LLM
   * @param options Options for the LLM
   * @returns LLM response
   */
  private async runLLM(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.isModelAvailable) {
        reject(new Error('LLM is not available'));
        return;
      }

      let args: string[] = [];

      // Prepare arguments based on model type
      if (this.modelType === 'ollama') {
        args = ['run', this.modelName, prompt];

        if (options.temperature !== undefined) {
          args.push('--temperature');
          args.push(options.temperature.toString());
        }

        if (options.maxTokens !== undefined) {
          args.push('--num-predict');
          args.push(options.maxTokens.toString());
        }
      } else if (this.modelType === 'llama') {
        args = ['-m', this.modelName, '-p', prompt];

        if (options.temperature !== undefined) {
          args.push('--temp');
          args.push(options.temperature.toString());
        }

        if (options.maxTokens !== undefined) {
          args.push('-n');
          args.push(options.maxTokens.toString());
        }
      } else if (this.modelType === 'gpt4all') {
        args = ['-m', this.modelName, '-p', prompt];

        if (options.temperature !== undefined) {
          args.push('--temp');
          args.push(options.temperature.toString());
        }

        if (options.maxTokens !== undefined) {
          args.push('--tokens');
          args.push(options.maxTokens.toString());
        }
      } else {
        reject(new Error(`Unsupported model type: ${this.modelType}`));
        return;
      }

      // Run the LLM with a timeout
      const process = spawn(this.modelPath, args);

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('LLM operation timed out'));
      }, 60000); // 1 minute timeout

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`LLM operation failed with code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Parse the LLM response for a file review
   * @param response LLM response
   * @returns Parsed review
   */
  private parseReviewResponse(response: string): {
    summary: string;
    meta?: {
      securityIssues?: Array<{
        description: string;
        severity: SecurityIssueSeverity;
        recommendation?: string;
      }>;
      improvements?: string[];
      notes?: string[];
    };
  } {
    // Default result
    const result = {
      summary: '',
      meta: {
        securityIssues: [] as Array<{
          description: string;
          severity: SecurityIssueSeverity;
          recommendation?: string;
        }>,
        improvements: [] as string[],
        notes: [] as string[]
      }
    };

    // Try to extract structured information
    const summaryMatch = response.match(/(?:Summary|SUMMARY):\s*(.*?)(?:\n\n|\n(?:Security|SECURITY)|$)/s);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    } else {
      // If no summary section, use the first paragraph as summary
      const firstParagraph = response.split('\n\n')[0];
      result.summary = firstParagraph.trim();
    }

    // Extract security issues
    const securitySection = response.match(/(?:Security Issues|SECURITY ISSUES|Security|SECURITY):\s*(.*?)(?:\n\n|\n(?:Improvements|IMPROVEMENTS)|$)/s);
    if (securitySection) {
      const securityText = securitySection[1].trim();
      const issues = securityText.split(/\n\s*-\s*/).filter(Boolean);

      for (const issue of issues) {
        if (!issue.trim()) continue;

        // Try to extract severity
        const severityMatch = issue.match(/\b(critical|high|medium|low|info)\b/i);
        const severityStr = severityMatch ? severityMatch[1].toLowerCase() : 'medium';
        const severity = severityStr === 'critical' ? SecurityIssueSeverity.CRITICAL :
          severityStr === 'high' ? SecurityIssueSeverity.HIGH :
          severityStr === 'medium' ? SecurityIssueSeverity.MEDIUM :
          severityStr === 'low' ? SecurityIssueSeverity.LOW :
          severityStr === 'info' ? SecurityIssueSeverity.INFO :
          SecurityIssueSeverity.MEDIUM;

        // Try to extract recommendation
        const recommendationMatch = issue.match(/(?:Recommendation|Recommended|Suggest|Fix):\s*(.*?)(?:$)/s);
        const recommendation = recommendationMatch ? recommendationMatch[1].trim() : undefined;

        result.meta.securityIssues.push({
          description: issue.trim(),
          severity,
          recommendation
        });
      }
    }

    // Extract improvements
    const improvementsSection = response.match(/(?:Improvements|IMPROVEMENTS|Suggestions|SUGGESTIONS):\s*(.*?)(?:\n\n|\n(?:Notes|NOTES)|$)/s);
    if (improvementsSection) {
      const improvementsText = improvementsSection[1].trim();
      result.meta.improvements = improvementsText.split(/\n\s*-\s*/).filter(Boolean).map(i => i.trim());
    }

    // Extract notes
    const notesSection = response.match(/(?:Notes|NOTES|Additional|ADDITIONAL):\s*(.*?)(?:\n\n|$)/s);
    if (notesSection) {
      const notesText = notesSection[1].trim();
      result.meta.notes = notesText.split(/\n\s*-\s*/).filter(Boolean).map(n => n.trim());
    }

    return result;
  }

  /**
   * Get effective configuration with defaults
   * @param config User-provided configuration
   * @returns Effective configuration with defaults applied
   */
  protected getEffectiveConfig(config?: LocalLLMReviewerConfig): LocalLLMReviewerConfig {
    const baseConfig = super.getEffectiveConfig(config);

    return {
      ...baseConfig,
      modelPath: config?.modelPath || this.modelPath,
      modelName: config?.modelName || this.modelName,
      maxTokens: config?.maxTokens || 1000,
      temperature: config?.temperature || 0.7,
      additionalArgs: config?.additionalArgs || [],
      timeout: config?.timeout || 60000
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up
  }
}

// Export plugin instance
export default new LocalLLMReviewer();
