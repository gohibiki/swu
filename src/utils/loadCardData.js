// Build-time loader: reads the latest cards-*.json.br written by
// scripts/fetch-data.js (sourced from TCGCSV) and returns a plain
// array of card objects.
//
// TCGCSV provides a clean object array — no column-store reshape needed
// like dotgg required.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export async function loadCardData() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    throw new Error('data/ directory not found. Run `npm run fetch-data` first.');
  }

  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('cards-') && f.endsWith('.json.br'))
    .sort()
    .reverse();
  if (files.length === 0) {
    throw new Error('No cards-*.json.br found in data/. Run `npm run fetch-data`.');
  }

  const filePath = path.join(dataDir, files[0]);
  const compressed = fs.readFileSync(filePath);
  const cards = JSON.parse(zlib.brotliDecompressSync(compressed).toString('utf8'));

  // Backwards-compat alias — older code reads `displayName`.
  for (const c of cards) {
    if (c.name && !c.displayName) c.displayName = c.name;
  }

  return { cards, filename: files[0] };
}
