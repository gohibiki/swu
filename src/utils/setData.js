// Build-time loader for Star Wars Unlimited set metadata.
// Reads data/sets.json.br (refreshed daily by scripts/fetch-data.js from
// dotgg.gg's /cgfw/getsets endpoint) and exposes a lookup keyed by set ID.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Convert a set name to a URL slug. "The First Chapter" â†’ "the-first-chapter".
export function slugifySetName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/['â€™`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// SWU set kinds:
//   main: the booster sets (3-letter codes: SOR, SHD, TWI, JTL, LOF, SEC, LAW, TS26, ASH, ...)
//   starter: Intro Battles + starter decks (IBH, INTRO, etc.)
//   promo: weekly play promos (*-WPP, *WPP) + tournament promos (SN1, CE2025)
//   special: gift boxes, accessories
function classifyKind(id) {
  if (!id) return 'special';
  if (/WPP$|^WPP/i.test(id)) return 'promo';
  if (/^SN\d/i.test(id) || /^CE\d/i.test(id)) return 'promo';
  if (/^IB[A-Z]/i.test(id) || /INTRO/i.test(id)) return 'starter';
  if (/^GFT|GIFT/i.test(id)) return 'special';
  if (/^[A-Z]{3}$/i.test(id)) return 'main';      // SOR / SHD / LOF / SEC / LAW / ASH / etc.
  if (/^TS\d+$/i.test(id)) return 'main';          // TS26 series
  return 'special';
}

// Manual overrides for sets that exist in /getcards but haven't been
// officially listed in /getsets yet (preview leaks). Empty by default.
// Add entries here when a set leaks before TCGCSV adds metadata.
const OVERRIDES = {};

let cache = null;

export function loadSets() {
  if (cache) return cache;

  const file = path.join(process.cwd(), 'data', 'sets.json.br');
  if (!fs.existsSync(file)) {
    console.warn('[loadSets] no sets.json.br at', file, 'â€” returning empty');
    cache = { sets: [], byId: new Map() };
    return cache;
  }

  const raw = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(file)).toString('utf8'));

  // TCGCSV-shaped: array of { id, groupId, name, abbreviation, slug,
  // cardsCount, release } where id is the set abbreviation (e.g. "GD03").
  const sets = raw.map(s => ({
    id: s.id || s.abbreviation,
    groupId: s.groupId,
    name: s.name || `Set ${s.id}`,
    slug: s.slug || slugifySetName(s.name) || (s.id || '').toLowerCase(),
    cardsCount: s.cardsCount || 0,
    release: s.release || null,
    kind: classifyKind(s.id || s.abbreviation || ''),
  }));

  const byId = new Map(sets.map(s => [s.id, s]));
  cache = { sets, byId };
  return cache;
}

// Look up a single set's metadata. Resolution order:
//   1. /getsets API data (source of truth)
//   2. OVERRIDES (hand-maintained for preview-leak sets)
//   3. Synthesized "Set XXX" fallback (graceful degradation)
export function getSetMeta(setId) {
  const { byId } = loadSets();
  const hit = byId.get(setId);
  if (hit) return hit;

  const ov = OVERRIDES[setId];
  if (ov) {
    return {
      id: setId,
      name: ov.name,
      slug: slugifySetName(ov.name) || setId.toLowerCase(),
      cardsCount: 0,
      release: ov.release,
      kind: classifyKind(setId),
      override: true,
    };
  }

  return {
    id: setId,
    name: `Set ${setId}`,
    slug: setId.toLowerCase(),
    cardsCount: 0,
    release: null,
    kind: classifyKind(setId),
    unmapped: true,
  };
}

// Latest *released* main set by release date. Future sets (announced but
// not yet launched, so cards aren't in the data) are filtered out â€” the
// homepage "Latest drop" section needs a set that actually has cards.
// Falls back to highest numeric ID if no dated sets exist.
export function getLatestMainSet() {
  const { sets } = loadSets();
  const main = sets.filter(s => s.kind === 'main');
  if (main.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const released = main
    .filter(s => s.release && s.release <= today)
    .sort((a, b) => b.release.localeCompare(a.release));
  if (released.length) return released[0];
  return main.sort((a, b) => b.id.localeCompare(a.id))[0];
}

// Warn about set IDs that appear in cards data but have no metadata in
// /getsets AND no manual override â€” the truly-unmapped case. Called from
// index.astro at build time so the GH Actions log surfaces it.
export function warnOnUnmappedSets(cardSetIds) {
  const { byId } = loadSets();
  const unmapped = [...new Set(cardSetIds)]
    .filter(id => id && !byId.has(id) && !OVERRIDES[id]);
  if (unmapped.length) {
    console.warn(
      `[setData] cards reference unmapped set IDs: ${unmapped.join(', ')}. ` +
      `These will display as "Set XXX" until /cgfw/getsets adds them ` +
      `or you add an entry to OVERRIDES in setData.js.`
    );
  }
  return unmapped;
}
