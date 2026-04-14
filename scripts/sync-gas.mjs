import fs from 'node:fs';
import path from 'node:path';
import { GAS_SOURCE_FILES } from './gas-manifest.mjs';

const rootDirectory = process.cwd();

for (const relativeSourcePath of GAS_SOURCE_FILES) {
  const sourcePath = path.join(rootDirectory, relativeSourcePath);
  const targetPath = path.join(rootDirectory, path.basename(relativeSourcePath));

  fs.copyFileSync(sourcePath, targetPath);
}

console.log(`Synced ${GAS_SOURCE_FILES.length} Apps Script source files to the flat deploy root.`);
