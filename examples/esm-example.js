// ES Modules Example
import { 
  FileContextBuilder, 
  WhitelistBlacklist, 
  FileContentSearch,
  RegexPatternMatcher,
  type FileCollectorConfig,
  type FileSearchOptions
} from 'contextr';

// Create a configuration with whitelist and blacklist
const config: FileCollectorConfig = {
  name: "My Project Context",
  showContents: true,
  showMeta: true,
  includeDirs: [
    {
      path: "./src",
      include: ["**/*.js", "**/*.ts"],
      exclude: ["**/*.test.js", "**/*.spec.ts"],
      recursive: true,
      useRegex: false
    }
  ],
  includeFiles: ["./package.json", "./README.md"],
  excludeFiles: ["**/node_modules/**", "**/dist/**"],
  useRegex: false
};

// Using the WhitelistBlacklist helper
const whitelist = WhitelistBlacklist.createWhitelist(["**/*.js", "**/*.ts"]);
const blacklist = WhitelistBlacklist.createBlacklist(["**/*.test.js", "**/node_modules/**"]);

// Combine whitelist and blacklist with regex support
const combinedConfig = WhitelistBlacklist.createConfig({
  whitelist,
  blacklist,
  baseDir: "./src",
  useRegex: true
});

// Add in-file search to only include files containing specific content
config.searchInFiles = {
  pattern: "import\\s+{\\s*React",
  isRegex: true
};

// Filter by file extension
const filterByExtension = (files, extensions) => {
  return files.filter(file => {
    const ext = file.filePath.split('.').pop();
    return extensions.includes(ext);
  });
};

// Build the context
async function buildContext() {
  try {
    // Using the basic configuration
    const builder = new FileContextBuilder(config);
    const context = await builder.build();
    
    console.log(`Built context with ${context.files.length} files`);
    
    // Filter files by extension
    const tsFiles = filterByExtension(context.files, ['ts', 'tsx']);
    console.log(`Found ${tsFiles.length} TypeScript files`);
    
    // Search for content within the context files
    const searchOptions: FileSearchOptions = {
      pattern: "function\\s+\\w+\\s*\\(",
      isRegex: true,
      caseSensitive: false,
      wholeWord: false,
      contextLines: 2,
      maxResults: 100
    };
    
    // Different search output formats
    const searchResults = FileContentSearch.searchInFiles(context.files, searchOptions);
    console.log(`Found ${searchResults.length} files with matches`);
    
    // Get total match count
    const totalMatches = FileContentSearch.countMatches(context.files, searchOptions);
    console.log(`Total matches: ${totalMatches}`);
    
    // Get just the list of matching files
    const matchingFiles = FileContentSearch.searchForMatchingFiles(context.files, searchOptions);
    console.log(`Matching files: ${matchingFiles.length}`);
    
    // Get results in JSON format
    const jsonResults = FileContentSearch.searchAsJson(context.files, searchOptions);
    
    // Format the results with highlighting
    const formattedResults = FileContentSearch.formatResults(
      searchResults.map(result => FileContentSearch.addContextLines(result, 2)),
      true, // show file path
      true  // highlight matches
    );
    
    // Using regex pattern matching directly with flags
    const fileContent = "function hello() { return 'world'; }\nFUNCTION goodbye() {}";
    
    // Case-insensitive search with 'i' flag
    const isMatch = RegexPatternMatcher.test(fileContent, "function:i");
    console.log(`Pattern match: ${isMatch}`); // true, matches both function and FUNCTION
    
    // Get matches with line numbers
    const matches = RegexPatternMatcher.getMatchesWithLineNumbers(fileContent, "function\\s+\\w+:gi");
    console.log(`Found ${matches.length} function declarations with line numbers`);
    
    // Extract context around matches
    const matchesWithContext = RegexPatternMatcher.getMatchesWithContext(fileContent, "function\\s+\\w+:g", 1);
    console.log(`Matches with context: ${JSON.stringify(matchesWithContext, null, 2)}`);
    
    return context;
  } catch (error) {
    console.error("Error building context:", error);
    throw error;
  }
}

// Execute the function
buildContext()
  .then(context => {
    console.log("Context built successfully");
  })
  .catch(error => {
    console.error("Failed to build context:", error);
  });

// Export for use in other modules
export { buildContext };
