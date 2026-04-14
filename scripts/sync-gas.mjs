import fs from 'node:fs';
import path from 'node:path';
import { GAS_SOURCE_FILES } from './gas-manifest.mjs';

const rootDirectory = process.cwd();
const deployDirectory = path.join(rootDirectory, 'dist', 'gas');

fs.rmSync(deployDirectory, { force: true, recursive: true });
fs.mkdirSync(deployDirectory, { recursive: true });

for (const relativeSourcePath of GAS_SOURCE_FILES) {
  const sourcePath = path.join(rootDirectory, relativeSourcePath);
  const targetPath = path.join(deployDirectory, path.basename(relativeSourcePath));

  fs.copyFileSync(sourcePath, targetPath);
}

console.log(`Synced ${GAS_SOURCE_FILES.length} Apps Script source files to dist/gas.`);
