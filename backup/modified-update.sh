#!/bin/bash
set -e

# 1. Create necessary directories
mkdir -p backup examples docs

# 2. Backup your current project
cp -r ./* ./backup/ 2>/dev/null || true

# 3. Update TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "CommonJS",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "downlevelIteration": true
  },
  "include": [
    "src/**/*",
    "example-usage.ts"
  ],
  "exclude": [
    "__tests__"
  ]
}
EOF

# 4. Copy over the new files, maintaining directory structure
cp -r update/src/* ./src/ 2>/dev/null || true
cp -r update/examples/* ./examples/ 2>/dev/null || true
cp -r update/docs/* ./docs/ 2>/dev/null || true
cp -r update/__tests__/* ./__tests__/ 2>/dev/null || true

# 5. Copy root configuration files
cp update/package.json ./package.json 2>/dev/null || true
cp update/package-lock.json ./package-lock.json 2>/dev/null || true
cp update/.npmrc ./.npmrc 2>/dev/null || true
cp update/.gitignore ./.gitignore 2>/dev/null || true
cp update/RELEASE_NOTES.md ./RELEASE_NOTES.md 2>/dev/null || true
cp update/README.md ./README.md 2>/dev/null || true
cp update/CONTRIBUTING.md ./CONTRIBUTING.md 2>/dev/null || true

# 6. Install dependencies and rebuild
npm install
npm run build
