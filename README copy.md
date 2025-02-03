# File Context Builder

File Context Builder is a lightweight, configurable library for gathering and rendering the context of code files in a project. It allows you to quickly “globb” files and package them into a structured context (including metadata and content) that can be rendered in multiple formats. This context can then be used to feed language models (LLMs) in a single-shot prompt, support LLM agents by continuously packaging code files, or even generate change reports (by diffing JSON outputs) when traditional `git diff` is not enough.

## Why File Context Builder?

- **Single-Shot Code Context:** Easily generate a complete context of your project files to send to an LLM.
- **LLM Agent Support:** Package and resend code files dynamically as part of an LLM agent’s workflow.
- **Enhanced Reporting:** Create summaries and statistics (total files, lines, estimated tokens, etc.) that can be more useful than a simple diff.
- **Extensibility:** Built-in renderers (console-friendly text, JSON, etc.) can be extended with new renderers (e.g., human-friendly JSON) to fit your needs.

## Quickstart

To try out the library locally, run the following command from the project root:

```bash
yarn example
```

This runs the example-usage.ts script which:
 - Uses a default configuration (see below) to collect files from your project.
 - Renders the file context (including a directory tree, file contents, and a summary) to standard output.
 - Redirects output to a file named .context.out (which is gitignored) for quick testing and inspection.

### What’s in .context.out?

The generated output includes:
 - Directory Tree: A hierarchical view of the collected files.
 - Included Files: A list of files with their paths, sizes, and line counts.
 - Statistics: Overall summary including:
 - Total files
 - Total lines (summed from each file’s content)
 - Total file size (in bytes)
 - Estimated tokens (a heuristic based on assuming 1 token ≈ 4 characters)

### Configuration

The library is controlled via a configuration object (FileCollectorConfig). Here’s an example configuration:

```ts
const config: FileCollectorConfig = {
  name: "MyProjectFileContext",
  showContents: true,
  showMeta: true,
  includeDirs: [
    {
      path: "./src",
      include: ["**/*.ts"],
      recursive: true
    }
  ],
  includeFiles: [
    "README.md",
    "package.json",
    "tsconfig.json",
    "example-usage.ts"
  ]
};
```

### Fields:

 - name: A descriptive name for your context.
 - showContents: Whether to include the file contents in the rendered output.
 - showMeta: Whether to include meta information (directory tree and summary).
 - includeDirs: An array of directory configurations specifying:
 - path: The base directory.
 - include: Glob patterns (relative to the directory) to include.
 - recursive: Whether to search subdirectories.
 - includeFiles: An array of explicit file paths to include.

### Renderers

Renderers take the collected file context and output it in a specific format. The library includes several built-in renderers that implement a common interface (Renderer):

 - ***ConsoleRenderer***:  Outputs a human-friendly text format with a directory tree, file contents, and a detailed summary split into Included Files and Statistics.
 - ***JsonRenderer***:
Outputs a JSON object that includes the original file context and a computed summary (with included files and statistics).

You can create additional renderers by implementing the Renderer interface, which defines a single method:

interface Renderer {
  render(context: FileContext): string;
}

## Usage in Other Projects

File Context Builder is hosted on GitHub and can be added to other projects directly. 

To install it in another project, run:

```yarn add https://github.com/7SigmaLLC/file-context-builder.git```

Then, import and use the API as follows:

```ts
import {
  FileContextBuilder,
  FileCollectorConfig,
  ConsoleRenderer,
  JsonRenderer
} from "@7sigma/file-context-builder";

const config: FileCollectorConfig = {
  // Your configuration here…
};

(async () => {
  const builder = new FileContextBuilder(config);
  const context = await builder.build();

  // Render as console-friendly text:
  const consoleRenderer = new ConsoleRenderer();
  console.log(consoleRenderer.render(context));

  // Or render as JSON:
  const jsonRenderer = new JsonRenderer();
  console.log(jsonRenderer.render(context));
})();
```

## Contribution Guidelines

We welcome contributions! Please follow these guidelines:
 - Fork & Feature Branch:
Fork the repository and create a new feature branch for your changes.
 - Bug Fixes & Enhancements:
If you’re fixing a bug or making an enhancement, submit a pull request (PR) referencing the appropriate issue.
 - For bug fixes or enhancements, see our Issues Tracker for details.
 - New Features or Renderers:
For new features (including new renderers), please submit a PR from a feature branch with tests and updated documentation.
 - Clearly explain in your PR why the new feature or renderer is needed and how it improves the library.
 - Review Process:
All PRs will be reviewed by the core team. Please ensure your code adheres to our style guidelines and includes relevant tests.

## Why We Built It

File Context Builder was created because it is common to want to share parts of a codebase with LLMs:
	•	Single Shot Code Context: Generate a complete context of your code files for an LLM prompt.
	•	LLM Agent Support: Dynamically package and resend code files as part of an agent’s workflow.
	•	Enhanced File Change Reporting: Use JSON-based summaries to compare file changes when traditional diff tools aren’t available or sufficient.

This library aims to simplify these tasks and provide a common solution that you can extend and integrate into your projects.

## Issues & Feature Requests
 - Bug Reports & Enhancements:
Please open an issue for bugs or enhancements. Reference existing issues if relevant and provide clear reproduction steps.
 - New Features or Renderers:
If you have an idea for a new feature or renderer, open an issue first to discuss your approach before submitting a PR.

For more details, please visit our Github Issues.
https://github.com/7SigmaLLC/file-context-builder/issues

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions or feedback, please open an issue on GitHub or contact one of the repository maintainers.

