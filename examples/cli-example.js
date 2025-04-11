// CLI Usage Example
// This file demonstrates how to use the contextr CLI for various tasks

/**
 * Building Context
 * ----------------
 * Basic usage to build context from a directory:
 * 
 * $ contextr build -d ./src -o context.txt
 * 
 * With regex pattern matching:
 * 
 * $ contextr build -d ./src -r -i ".*\.js$" -e ".*\.test\.js$" -o context.json -f json
 * 
 * With multiple directories and file extension filtering:
 * 
 * $ contextr build -d ./src -d ./lib --ext js,ts -o context.txt
 * 
 * With in-file content search:
 * 
 * $ contextr build -d ./src --search "import React" -o context.txt
 * 
 * With whitelist and blacklist:
 * 
 * $ contextr build -d ./src --whitelist "**/*.js" --blacklist "**/node_modules/**" -o context.txt
 */

/**
 * Searching in Files
 * -----------------
 * Basic search:
 * 
 * $ contextr search -p "function" -d ./src
 * 
 * With regex:
 * 
 * $ contextr search -p "function\s+\w+" -r -d ./src
 * 
 * With case sensitivity and whole word matching:
 * 
 * $ contextr search -p "render" -c -w -d ./src
 * 
 * With context lines:
 * 
 * $ contextr search -p "useState" --context 3 -d ./src
 * 
 * With different output formats:
 * 
 * $ contextr search -p "import" -f json -o search-results.json -d ./src
 * $ contextr search -p "export" -f files-only -d ./src
 * $ contextr search -p "class" -f count -d ./src
 * 
 * With file extension filtering:
 * 
 * $ contextr search -p "function" --ext js,ts -d ./src
 * 
 * With maximum results limit:
 * 
 * $ contextr search -p "const" --max-results 50 -d ./src
 */

/**
 * Studio Mode
 * -----------
 * Launch the UI studio:
 * 
 * $ contextr studio
 * 
 * With custom port and host:
 * 
 * $ contextr studio -p 8080 --host 0.0.0.0
 * 
 * Without automatically opening browser:
 * 
 * $ contextr studio --no-open
 */

/**
 * Configuration Management
 * -----------------------
 * Save current configuration:
 * 
 * $ contextr config --save my-config
 * 
 * Load a saved configuration:
 * 
 * $ contextr config --load my-config
 * 
 * List all saved configurations:
 * 
 * $ contextr config --list
 * 
 * Delete a saved configuration:
 * 
 * $ contextr config --delete my-config
 */

// This file is for documentation purposes only and is not meant to be executed
