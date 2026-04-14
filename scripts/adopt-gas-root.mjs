import fs from 'node:fs';
import path from 'node:path';
import { GAS_SOURCE_FILES } from './gas-manifest.mjs';

const rootDirectory = process.cwd();
const deployDirectory = path.join(rootDirectory, 'dist', 'gas');

for (const relativeSourcePath of GAS_SOURCE_FILES) {
  const sourcePath = path.join(deployDirectory, path.basename(relativeSourcePath));
  const targetPath = path.join(rootDirectory, relativeSourcePath);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

console.log(`Adopted ${GAS_SOURCE_FILES.length} Apps Script deploy files from dist/gas back into src/gas.`);
