// example-usage.ts
import chalk from "chalk";
import {
  FileContextBuilder,
  FileCollectorConfig,
  ConsoleRenderer,
  JsonRenderer,
  FileContextJson,
} from "./src";

export const collectorConfig: FileCollectorConfig = {
  name: "Relevant Files",
  showContents: true,
  showMeta: true,
  includeDirs: [
    {
      path: "./src",
      include: ["**/*.ts"],
      recursive: true,
    },
    {
      path: "./__tests__",
      include: ["**/*.*"],
      recursive: true,
    },
    {
      path: "./.husky",
      include: ["**/*.*"],
      recursive: true,
    },
    {
      path: "./.github",
      include: ["**/*.yml"],
      recursive: true,
    },
  ],
  includeFiles: [
    "README.md",
    "LICENSE.md",
    "package.json",
    "tsconfig.json",
    "example-usage.ts",
    "jest.config.js",
    ".npmrc",
    ".gitignore",
  ],
};

(async () => {
  const builder = new FileContextBuilder(collectorConfig);
  const context = await builder.build();

  // Option 1: Render as a console-friendly string
  const consoleRenderer = new ConsoleRenderer();
  console.log(chalk.bold.blueBright("=== ConsoleRenderer Output ==="));
  console.log(consoleRenderer.render(context));

  // Option 2: Render as a strongly-typed JSON object
  const jsonRenderer = new JsonRenderer();
  const output = jsonRenderer.renderToObject(context);

  // Now you have a strongly typed JSON object.
  // console.log(chalk.bold.blueBright("Summary Statistics:", JSON.stringify(output.summary.statistics, null, 2)));
  // console.log(chalk.bold.cyanBright("Context:", output.fileContext.config.name));

  // You can also work directly with the file context if needed.
  // if (process.env.NODE_ENV !== "test") {
  //   console.log("Files:", output.fileContext.files);
  // }
})();
