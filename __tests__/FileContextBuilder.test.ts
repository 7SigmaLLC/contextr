import { FileContextBuilder } from "../src/FileContextBuilder";

describe("FileContextBuilder", () => {
  it("should create an instance", () => {
    const builder = new FileContextBuilder({
      name: "test",
      showContents: true,
      showMeta: true,
    });
    expect(builder).toBeInstanceOf(FileContextBuilder);
  });
});
