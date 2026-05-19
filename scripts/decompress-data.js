// Pre-build: decompress the latest data/*.json.br to public/data/
// Cloudflare Pages serves these as static JSON.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { brotliDecompressSync } from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const outputDir = path.join(__dirname, '..', 'public', 'data');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const files = readdirSync(dataDir).filter(f => f.endsWith('.json.br'));

const groups = {};
for (const file of files) {
  const baseName = file.replace('.json.br', '');
  let prefix;
  if (baseName.startsWith('cards-')) prefix = 'cards';
  else prefix = baseName;
  if (!groups[prefix]) groups[prefix] = [];
  groups[prefix].push(file);
}

console.log(`Decompressing ${Object.keys(groups).length} data file(s) to public/data/...`);

for (const [prefix, groupFiles] of Object.entries(groups)) {
  groupFiles.sort();
  const latest = groupFiles[groupFiles.length - 1];
  const compressed = readFileSync(path.join(dataDir, latest));
  const decompressed = brotliDecompressSync(compressed);
  writeFileSync(path.join(outputDir, `${prefix}.json`), decompressed);
  console.log(`  ${latest} -> ${prefix}.json (${(decompressed.length / 1024).toFixed(0)} KB)`);
}

console.log('Done.');
