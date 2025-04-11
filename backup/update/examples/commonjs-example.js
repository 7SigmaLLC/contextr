// CommonJS Example
const { 
  FileContextBuilder, 
  WhitelistBlacklist, 
  FileContentSearch,
  RegexPatternMatcher
} = require('contextr');

// Create a configuration with whitelist and blacklist
const config = {
  name: "My Project Context",
  showContents: true,
  showMeta: true,
  includeDirs: [
    {
      path: "./src",
      include: ["**/*.js", "**/*.ts"],
      exclude: ["**/*.test.js", "**/*.spec.ts"],
      recursive: true
    }
  ],
  includeFiles: ["./package.json", "./README.md"],
  excludeFiles: ["**/node_modules/**", "**/dist/**"],
  useRegex: false
};

// Using the WhitelistBlacklist helper
const whitelist = WhitelistBlacklist.createWhitelist(["**/*.js", "**/*.ts"]);
const blacklist = WhitelistBlacklist.createBlacklist(["**/*.test.js", "**/node_modules/**"]);

// Combine whitelist and blacklist
const combinedConfig = WhitelistBlacklist.createConfig({
  whitelist,
  blacklist,
  baseDir: "./src"
});

// Add in-file search to only include files containing specific content
config.searchInFiles = {
  pattern: "import React",
  isRegex: false
};

// Build the context
async function buildContext() {
  try {
    // Using the basic configuration
    const builder = new FileContextBuilder(config);
    const context = await builder.build();
    
    console.log(`Built context with ${context.files.length} files`);
    
    // Search for content within the context files
    const searchOptions = {
      pattern: "function",
      isRegex: false,
      caseSensitive: false,
      wholeWord: true,
      contextLines: 2
    };
    
    const searchResults = FileContentSearch.searchInFiles(context.files, searchOptions);
    console.log(`Found ${searchResults.length} files with matches`);
    
    // Get total match count
    const totalMatches = FileContentSearch.countMatches(context.files, searchOptions);
    console.log(`Total matches: ${totalMatches}`);
    
    // Format the results with highlighting
    const formattedResults = FileContentSearch.formatResults(searchResults, true, true);
    console.log(formattedResults);
    
    // Using regex pattern matching directly
    const fileContent = "function hello() { return 'world'; }";
    const isMatch = RegexPatternMatcher.test(fileContent, "function\\s+hello", "i");
    console.log(`Pattern match: ${isMatch}`);
    
    // Get matches with context
    const matches = RegexPatternMatcher.getMatches(fileContent, "function\\s+\\w+", "g");
    console.log(`Found ${matches.length} function declarations`);
    
    return context;
  } catch (error) {
    console.error("Error building context:", error);
    throw error;
  }
}

// Export the function for use in other modules
module.exports = { buildContext };

// Execute if run directly
if (require.main === module) {
  buildContext()
    .then(context => {
      console.log("Context built successfully");
    })
    .catch(error => {
      console.error("Failed to build context:", error);
      process.exit(1);
    });
}
