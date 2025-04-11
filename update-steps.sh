# 1. Backup your current project
cp -r ./* ./backup/

# 2. Copy over the new files, maintaining directory structure
cp -r update/src/* ./src/
cp -r update/examples/* ./examples/
cp -r update/docs/* ./docs/
cp -r update/__tests__/* ./__tests__/

# 3. Copy root configuration files
cp update/package.json ./package.json
cp update/package-lock.json ./package-lock.json
cp update/tsconfig.json ./tsconfig.json
cp update/.npmrc ./.npmrc
cp update/.gitignore ./.gitignore
cp update/RELEASE_NOTES.md ./RELEASE_NOTES.md
cp update/README.md ./README.md
cp update/CONTRIBUTING.md ./CONTRIBUTING.md

# 4. Install dependencies and rebuild
npm install
npm run build