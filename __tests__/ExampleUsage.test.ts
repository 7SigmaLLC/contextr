import { collectorConfig } from "../example-usage"; // Import the config
import { FileContextBuilder } from "../src/FileContextBuilder";

describe("example-usage", () => {
  it("builds context with the example config", async () => {
    const builder = new FileContextBuilder(collectorConfig);
    const context = await builder.build();
    expect(context.files).toBeDefined();
    expect(context.files.length).toBeGreaterThan(0);
  });
});
