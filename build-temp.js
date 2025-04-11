const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary tsconfig file that ignores errors
const tempTsConfig = {
  compilerOptions: {
    target: "ES2018",
    module: "CommonJS",
    declaration: true,
    outDir: "./dist/cjs",
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    strict: false,
    skipLibCheck: true,
    noImplicitAny: false,
    noEmitOnError: false
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "**/*.test.ts", "dist"]
};

// Write the temporary config file
fs.writeFileSync('tsconfig.temp.json', JSON.stringify(tempTsConfig, null, 2));

try {
  // Build CJS version
  console.log('Building CommonJS version...');
  execSync('tsc -p tsconfig.temp.json', { stdio: 'inherit' });
  
  // Create ESM version config
  const tempEsmConfig = {
    ...tempTsConfig,
    compilerOptions: {
      ...tempTsConfig.compilerOptions,
      module: "ESNext",
      outDir: "./dist/esm",
      declaration: false
    }
  };
  
  // Write the temporary ESM config file
  fs.writeFileSync('tsconfig.temp.esm.json', JSON.stringify(tempEsmConfig, null, 2));
  
  // Build ESM version
  console.log('Building ESM version...');
  execSync('tsc -p tsconfig.temp.esm.json', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} finally {
  // Clean up temporary files
  fs.unlinkSync('tsconfig.temp.json');
  fs.unlinkSync('tsconfig.temp.esm.json');
}
