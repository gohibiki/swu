# Full Technical SEO Audit, swutcg.one

**Date:** 2026-05-19
**URL audited:** https://www.swutcg.one/
**Trigger:** Baseline audit. Site is new, ramping impressions on Google (113 to 133 over the past week), zero clicks on Bing yet.

---

## Summary

| Category | Score | Status |
|----------|------:|:------:|
| Page Weight | 100/100 | Pass |
| Security Headers | 90/100 | HSTS missing |
| On-Page SEO (title/meta/canonical) | 100/100 | Pass |
| Heading Hierarchy | 100/100 | Pass |
| Schema Markup | 100/100 | Pass |
| Social Meta | 85/100 | Twitter optional fields missing |
| Robots.txt | 100/100 | Pass |
| AI Crawler Management | 100/100 | Pass |
| Indexing Status (Google) | 70/100 | Homepage indexed, /database not |
| Indexing Status (Bing) | 50/100 | Only homepage indexed |
| Core Web Vitals (Mobile) | 88/100 | LCP at 3.6s (needs improvement) |
| Core Web Vitals (Desktop) | 100/100 | Perfect |
| **Overall** | **89/100** | **Strong foundation, two coverage gaps** |

## Critical issues

**None.** No broken pages, no crawl errors flagged by GSC, no Bing crawl issues, no schema invalid markup.

## Warnings (optimization opportunities)

### W1, HSTS header missing
- **Evidence:** Live response from `https://www.swutcg.one/` returns CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection. No `Strict-Transport-Security` header.
- **Source:** `public/_headers` does not include an HSTS line.
- **Impact:** Browsers re-check HTTPS on every visit instead of trusting an HSTS pin. Lowers Security score, can be flagged by audits like securityheaders.com.
- **Fix:** Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to the top block in `public/_headers`. Same value as optcg uses.

### W2, /database not yet indexed by Google
- **Evidence:** GSC URL inspection on `https://www.swutcg.one/database` returns coverage state `Discovered - currently not indexed`. `last_crawled: null`. Google found the URL but has not crawled it.
- **Impact:** Largest-keyword page ("swu tcg database" already shows pos 8.8 for the homepage) is missing from Google's index. The homepage is currently absorbing the entire query share.
- **Fix:** GSC, URL Inspection, paste `/database`, click **Request Indexing**. Google queues a fresh crawl. Submitted URLs typically index within 1 to 7 days.

### W3, /decklists never discovered by Bing
- **Evidence:** Bing Webmaster `get_url_info` for `https://www.swutcg.one/decklists` returns `DiscoveryDate: -62135568000000` (epoch zero). Bing has no record of the URL.
- **Context:** IndexNow fires on every build (`scripts/indexnow.js`, included in `npm run build`). The script lists `/decklists` in `ALWAYS_SUBMIT`. Either the IndexNow ping silently failed, or Bing has not yet processed the queue.
- **Fix:** Submitted via `submit_url_batch` during this audit (along with `/database`, `/builder`, `/how-to-play`). Bing typically crawls within 24 to 72 hours.

### W4, Mobile LCP at 3.6s, "needs improvement" tier
- **Evidence:** PageSpeed Insights mobile (lab data) returns LCP 3.6s. Other metrics excellent: FCP 1.4s, CLS 0.003, INP/TBT 30ms, TTFB 4ms.
- **Cause hypothesis:** Same family of issue as optcg, the LCP is likely the eager-loaded hero card image. Cloudflare's edge cache hit/miss controls whether the image arrives fast.
- **Impact:** Mobile LCP between 2.5s and 4.0s rates as "Needs Improvement" by Google. If field data (CrUX) reflects this, it becomes a Page Experience signal.
- **Fix to investigate:**
  1. Identify the LCP image (likely an OGN or VEN spotlight card on the homepage).
  2. Check if it has a 160w/640w srcset and `imagesizes` declared in the preload.
  3. Verify the image size is sane (under 80 KB for the slot served).
  4. Consider preloading the LCP image with `<link rel="preload" as="image" imagesrcset=... imagesizes=...>`.

### W5, HTTP variant still tracked by Google
- **Evidence:** Multiple GSC query rows attribute impressions to `http://swutcg.one/` (no www, plain HTTP) alongside the canonical `https://www.swutcg.one/`. Total impression split: 6 query rows on HTTP, 11 on HTTPS+www.
- **Cause:** The redirect chain works at the server level (`http://swutcg.one/` 301 to `https://swutcg.one/` 301 to `https://www.swutcg.one/`), but Google has a cached impression of the HTTP variant from before the redirects fully consolidated. URL Inspection on `http://swutcg.one/` returns `google_canonical: http://swutcg.one/` (Google still treats it as its own canonical) despite our `user_canonical` declaring HTTPS+www.
- **Impact:** Signal dilution. Two URLs sharing one signal pool.
- **Fix:** GSC, URL Inspection, paste `http://swutcg.one/`, click **Request Indexing**. Forces Google to re-crawl, observe the 301, drop it from the index. Same approach worked for previous protocol consolidation cases.

### W6, Optional Twitter Card fields missing
- **Evidence:** `<meta name="twitter:site">` and `<meta name="twitter:creator">` not present in `Layout.astro`.
- **Impact:** Twitter Card preview works without these (using `summary_large_image`); just no creator/site attribution badge.
- **Priority:** Low. Skip if no brand Twitter handle exists.

## Passes (working well, do not change)

### Page weight
- Compressed HTML: 82.5 KB
- Load time: 0.26s
- Static output served behind Cloudflare CDN

### Security headers (5 of 6 present)
- CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locked down, X-XSS-Protection
- HTTPS enforced (and chained correctly across protocol/www variants)
- Missing: HSTS only

### On-page SEO
- **Title (56 chars):** `Star Wars Unlimited Database - Cards, Decks & Rules`, covers all brand variants
- **Meta description (132 chars):** mentions 793 cards, 21 sets, tournament decklists, rules
- **Canonical:** self-referencing `https://www.swutcg.one/`
- **Meta robots:** `index, follow, max-snippet:160, max-image-preview:large`

### Schema markup
- WebSite + SearchAction (valid)
- Organization with logo (valid)
- FAQPage with Question + Answer entries (valid)
- Google URL inspection: `"detected_types": ["FAQ"]`, rich results PASS

### Robots.txt
- Sitemap declared
- AI crawlers allowed: GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Amazonbot, FacebookBot
- SEO scrapers throttled with crawl-delay 5: AhrefsBot, SemrushBot, DotBot
- Bytespider blocked
- Major crawlers (Googlebot, Bingbot, Slurp) explicitly allowed

### Indexing (Google, homepage)
- `/` indexed, PASS verdict, FAQ rich results detected
- Sitemap: 8 URLs submitted, 0 errors, 0 warnings, last downloaded 2026-05-16
- Note: GSC reports `indexed: 0` for the sitemap content breakdown, but URL inspection contradicts this and confirms `/` IS indexed. The sitemap metric appears stale.

### Indexing (Bing)
- 5 pages crawled, 1 in index (homepage)
- 0 crawl issues flagged
- 0 deep link blocks, 0 page preview blocks
- 0 inbound anchors (expected for a new domain, not a config issue)
- Sitemap accepted

### Core Web Vitals
**Desktop: 100/100**
- LCP 0.5s, FCP 0.4s, CLS 0, INP 0ms, TTFB 3ms. Best-in-class.

**Mobile: 88/100**
- LCP 3.6s is the only weak metric (W4 above)
- FCP 1.4s, CLS 0.003, INP/TBT 30ms, TTFB 4ms are all excellent

## Indexing snapshot

| URL | Google verdict | Google canonical match | Bing in index |
|---|---|---|---|
| `https://www.swutcg.one/` | PASS, indexed | Yes | Yes |
| `https://www.swutcg.one/database` | NEUTRAL, discovered not indexed | n/a | No |
| `https://www.swutcg.one/decklists` | not checked | n/a | No (never discovered) |
| `http://swutcg.one/` | NEUTRAL, indexed as separate URL | No (Google ignored our canonical) | n/a |

## Search performance snapshot (last 28 days)

| Source | Clicks | Impressions | CTR | Avg position |
|---|--:|--:|--:|--:|
| Google | 2 | 133 | 1.5% | 9.2 |
| Bing | n/a (0 query data yet) | n/a | n/a | n/a |

**Top Google queries (sorted by impressions):**

| Query | Imp | Position |
|---|--:|--:|
| swu tcg database | 6 | 8.8 |
| swu tcg card list | 3 | 45 to 48 (split HTTP/HTTPS) |
| swu tcg | 2 | 48 |
| swu card game database | 2 | 7 to 10 (split) |
| swu tcg digital | 1 | 27 |
| gd05 swu card list | 1 | 11 |
| swu eb01 card list | 1 | 10 |
| swu tcg decklist | 1 | 28 |
| swu tcg online | 1 | 51 |

Trend: impressions rising day over day (18 to 36 over the past week), site is gaining traction.

## Environment limitations

- **Screaming Frog full-site crawl:** SF v22 installed with licence in place but is invalid in CLI/MCP mode. GUI relaunch with licence re-entry needed to unlock site-wide crawls.
- **CrUX field data (real-user metrics):** not yet available, site too new for the Chrome User Experience Report dataset.

---

## Score interpretation

**89/100 = Strong.** The site is technically sound. The two main losses are the missing HSTS header and the two URLs in coverage limbo (`/database` not indexed by Google, `/decklists` not discovered by Bing). Both are recoverable in a single GSC click + a single Bing submission, the latter already done as part of this audit.

The site is not the bottleneck. Brand authority is, same situation as optcg.one. Anchor count is zero, which is a slow-build problem rather than a technical one. Continue posting fresh sets and decklists daily, and let the impression trend keep climbing.
