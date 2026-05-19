# Action Plan, swutcg.one technical SEO

**Date:** 2026-05-19
**Source:** Full Audit Report 2026-05-19 (overall 89/100, no critical issues)

---

## Priority 1, do this week

### P1.1, Add HSTS header
**File:** `swu/public/_headers`
**Change:**
```diff
  /*
    Content-Security-Policy: default-src 'self'; ...
+   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    ...
```
**Why:** HSTS is the one security header missing. Same value optcg uses, 1-year preload-eligible.
**Effort:** 1 line edit. Verify with `curl -I https://www.swutcg.one/` after deploy.

### P1.2, Request indexing for /database in GSC
**Where:** Google Search Console, URL Inspection
**Steps:**
1. Paste `https://www.swutcg.one/database`
2. Click **Request Indexing**
3. Wait 1 to 7 days for Google to crawl
**Why:** GSC says `Discovered - currently not indexed` with `last_crawled: null`. Google found the URL but never fetched it. Manual request bumps it to the crawl queue.
**Bonus:** Do the same for `http://swutcg.one/` (the HTTP variant Google still tracks separately, see W5). Forces re-crawl, Google observes 301, drops it.

### P1.3, Bing URL submissions, already done
**Status:** During this audit, `submit_url_batch` fired for `/database`, `/decklists`, `/builder`, `/how-to-play`. Bing should crawl within 24 to 72 hours.
**Verify in 3 days:** `mcp__bing-webmaster__get_url_info` should show `DiscoveryDate` no longer at epoch zero for `/decklists`, and `InIndex` count should grow past 1.

## Priority 2, investigate and polish

### P2.1, Mobile LCP at 3.6s
**Symptom:** PageSpeed mobile reports LCP 3.6s, "needs improvement" tier. Desktop is perfect at 0.5s.
**Hypothesis:** Same family of issue as optcg, eager-loaded hero card image. Cloudflare edge cache hit/miss determines speed.
**Things to check:**
1. **Identify the LCP image:** open the homepage in Chrome DevTools, Performance tab, record a load on mobile throttling. The LCP node will be highlighted.
2. **Verify the preload:** check `Layout.astro` or `index.astro` for a `<link rel="preload" as="image">` for the hero. If missing, add one with `imagesrcset` and `imagesizes` so mobile picks the 160w or 640w variant, not the full-res.
3. **Image size:** `curl -I https://www.swutcg.one/cards/<id>.webp` for the LCP card. If over 80 KB for the slot served, generate a smaller variant.
4. **Cloudflare cache hit rate:** dashboard, Analytics. Under 90% means cold-cache fetches are hitting origin.
**Effort:** 30 to 60 min. Likely fix is one preload line or one srcset adjustment.

### P2.2, Optional Twitter Card attribution
**File:** `swu/src/layouts/Layout.astro`
**Change:** Add `<meta name="twitter:site" content="@your_handle">` and `<meta name="twitter:creator" content="@your_handle">` if a brand Twitter handle exists.
**Why:** Twitter Card score is 85/100, missing optional fields. No SERP impact, only affects share-preview attribution.
**Effort:** 2 line edits. Skip if no Twitter handle.

## Priority 3, informational / monitoring

### P3.1, Watch the impression trend
**Current trajectory:** 18 to 36 daily impressions over the last week on Google.
**Useful signal:** If impressions cross 50 per day with the same ranking position, it means more queries are matching, not just position drift. Track in GSC weekly.

### P3.2, Watch Bing pickup after URL submissions
**Submitted 2026-05-19:** `/database`, `/decklists`, `/builder`, `/how-to-play`
**Check in 3 days:** `get_url_info` on each. `DiscoveryDate` should move off epoch zero, `LastCrawledDate` should populate, `InIndex` on the rank stats should grow.

### P3.3, Sitemap "indexed: 0" metric is misleading
**GSC reports:** `content_breakdown: [{"type": "WEB", "submitted": "8", "indexed": "0"}]`
**Reality:** Homepage IS indexed (URL inspection PASS). The sitemap-level metric appears stale.
**Action:** Ignore the sitemap "indexed: 0" number. Trust per-URL inspection instead.
**Re-check:** After `/database` indexes (P1.2), the sitemap metric should update.

### P3.4, Set/card pages are noindex by design
**Source:** [src/pages/sitemap.xml.js:23-27](src/pages/sitemap.xml.js#L23-L27) explicitly excludes `/set/*` and `/card/*` because they are noindexed (low/mixed-quality content).
**No action needed.** Same approach as optcg. Documented in code.

## Re-audit triggers

Re-run this audit if any of the following happens:
- New page types added (e.g., articles, set guides, news)
- `public/_headers` is changed (security regressions can sneak in)
- Sitemap content changes substantially (more than 5 new URLs)
- Cloudflare Pages build settings change
- Move to a new hosting provider

## Verification path after each fix

```powershell
# After HSTS deploy
curl -I https://www.swutcg.one/ | Select-String "strict-transport"

# After GSC request-indexing
# Check GSC URL Inspection again in 2 to 3 days for /database, expect verdict PASS

# After Bing pickup, check next week
# Use the bing-webmaster MCP: get_url_info on each URL
```

## Out of scope for this audit

- **Backlink building:** AnchorCount is 0 on Bing, no inbound links. This is a slow-build authority problem, not a technical fix. Cross-linking your own four TCG sites (optcg, lorcanatcg, swutcg, riftbound) in a footer is the only zero-effort lever discussed earlier.
- **Ranking position improvements for head terms:** "swu tcg" sits at pos 48. Will move with site age + brand searches, not direct technical changes.
- **Site-wide deep crawl:** Screaming Frog is installed but licence is invalid in CLI mode. Re-enter via GUI to unlock.

---

**Bottom line:** Two coverage fixes (HSTS, request-indexing /database) and one investigation (mobile LCP). One Bing submission already done in this audit. The site is technically clean, the gap is youth + zero backlinks. Patience plus the impression trend is the main play.
