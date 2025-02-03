// example-usage.ts
import {
  FileContextBuilder,
  FileCollectorConfig,
  ConsoleRenderer,
  JsonRenderer
} from "./src";

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

(async () => {
  const builder = new FileContextBuilder(config);
  const context = await builder.build();

  // Option 1: Render as a console-friendly string
  const consoleRenderer = new ConsoleRenderer();
  console.log(consoleRenderer.render(context));

  // Option 2: Render as JSON
  // const jsonRenderer = new JsonRenderer();
  // console.log(jsonRenderer.render(context));

  // You can also work directly with the strongly-typed context:
  // console.log(context.config, context.files);
})();