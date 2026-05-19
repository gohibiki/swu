/**
 * IndexNow submission script (Bing/Yandex/etc.).
 * Fetches URLs from sitemap and streams them to the IndexNow API.
 * Run after build: node scripts/indexnow.js
 *
 * Pattern adapted from optcg.one. The site verification key file lives
 * at public/{INDEXNOW_KEY}.txt so search engines can confirm ownership.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEXNOW_KEY = 'dd2261171da6ec69ce98e2512ad53424';
const HOST = 'www.swutcg.one';
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const CACHE_FILE = path.join(__dirname, '.indexnow-cache.json');

// Streaming: small batches with delay between each.
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

// Pages that always get submitted (frequently updated content).
const ALWAYS_SUBMIT = [
  `https://${HOST}/`,
  `https://${HOST}/decklists`,
  `https://${HOST}/database`,
  `https://${HOST}/builder`,
];

function loadCache() {
  if (!existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; }
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
}

function hashUrl(url) {
  return createHash('md5').update(url).digest('hex');
}

async function fetchSitemap() {
  console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
  const response = await fetch(SITEMAP_URL);
  if (!response.ok) throw new Error(`Failed to fetch sitemap: ${response.status}`);
  const xml = await response.text();
  const urlMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  const urls = Array.from(urlMatches, match => match[1]);
  console.log(`Found ${urls.length} URLs in sitemap`);
  return urls;
}

function getChangedUrls(allUrls, cache) {
  const changed = [];
  const newCache = {};

  allUrls.forEach(url => {
    const hash = hashUrl(url);
    newCache[url] = hash;

    // Always submit core pages + any new URLs not in cache.
    if (ALWAYS_SUBMIT.includes(url) || !cache[url]) {
      changed.push(url);
    }
  });

  return { changed, newCache };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function submitStreaming(urls) {
  let submitted = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    console.log(`  Streaming batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: batch
    };

    const response = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 202) {
      submitted += batch.length;
      console.log(`  Batch ${batchNum} accepted (status: ${response.status})`);
    } else {
      const text = await response.text();
      console.error(`  Batch ${batchNum} failed: ${response.status} - ${text}`);
    }

    if (i + BATCH_SIZE < urls.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return submitted;
}

async function main() {
  try {
    console.log('IndexNow Streaming Submission');
    console.log('==============================\n');

    const allUrls = await fetchSitemap();
    if (allUrls.length === 0) {
      console.log('No URLs found in sitemap. Exiting.');
      return;
    }

    const cache = loadCache();
    const { changed, newCache } = getChangedUrls(allUrls, cache);

    if (changed.length === 0) {
      console.log('No new or changed URLs to submit.');
      saveCache(newCache);
      return;
    }

    const newCount = changed.length - changed.filter(u => ALWAYS_SUBMIT.includes(u)).length;
    console.log(`${changed.length} URLs to submit (${ALWAYS_SUBMIT.length} core + ${newCount} new)\n`);

    const submitted = await submitStreaming(changed);

    saveCache(newCache);

    console.log(`\nDone! ${submitted} URLs streamed to IndexNow.`);
  } catch (error) {
    // Soft-fail: treat IndexNow as a "best effort" build step. If the
    // sitemap isn't live yet (first deploy) or we're building offline,
    // skip rather than crashing the build.
    console.warn('IndexNow skipped:', error.message);
    process.exit(0);
  }
}

main();
