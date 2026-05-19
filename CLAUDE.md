# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# swutcg.one â€” Star Wars Unlimited Database

## Overview
Static Astro site for the Star Wars Unlimited (Fantasy Flight Games). Hosted on Cloudflare Pages.

## Tech Stack
- **Framework**: Astro 6 with TypeScript (Node 22+)
- **Styling**: Tailwind CSS 3.4 + plain CSS in `src/styles/`
- **Hosting**: Cloudflare Pages (static output, `output: 'static'`)
- **Data**: Brotli-compressed JSON in `data/`, decompressed at build time to `public/data/`

## Commands
```bash
npm run dev               # Astro dev server
npm run build             # Decompress data + astro check + astro build + IndexNow
npm run preview           # Preview production build
npm run fetch-data        # Pull cards + sets + prices from TCGCSV
npm run fetch-decklists   # Scrape tournament decklists from tcgtopdecks-hq.com
npm run download-images   # Mirror card images from TCGPlayer CDN
```

## Data sources

| Layer | Source | What we get | Auth |
|-------|--------|-------------|------|
| Card metadata + prices | **TCGCSV** (`tcgcsv.com/tcgplayer/86/...`) | Full Fantasy Flight Games catalog (GD01-GD04, ST01-ST10, EB01, promos), TCGPlayer productIds, low/mid/high/market prices | None â€” but they gate the default Node fetch UA, so we send a custom one |
| Card images | **TCGPlayer CDN** (`tcgplayer-cdn.tcgplayer.com/product/{productId}_in_1000x1000.jpg`) | High-res JPEGs, converted to WebP via sharp on download | None |
| Tournament decklists | **tcgtopdecks-hq.com** (`/swu-cg-decks-{set}/`) â€” scraped via `cloudscraper` + `jsdom` | TablePress tables with deck composition encoded as `{N}n{cardId}a` | None â€” Cloudflare-protected, cloudscraper bypasses |

TCGCSV replaced dotgg.gg in this repo because dotgg's coverage caps at GD02 â€” they don't index GD03/GD04/EB01/ST07+. TCGCSV mirrors TCGplayer's catalog daily and has every card the moment TCGplayer lists it (typically near release).

## Daily refresh
`.github/workflows/fetch-data.yml` runs daily at 06:00 UTC and on `workflow_dispatch`:
1. `git fetch && git reset --hard origin/main` (race-safe sync)
2. `node scripts/fetch-data.js` â€” TCGCSV catalog + prices
3. `node scripts/fetch-decklists.js` â€” tcgtopdecks-hq scrape
4. `node scripts/download-images.js` â€” fetch any new card images via TCGPlayer CDN
5. `node scripts/process-card-images.js` â€” sharp generates 160w / 640w variants
6. Commit only if `data/` or `public/cards/` changed; push.

## URLs & Trailing Slashes
`astro.config.mjs` uses `trailingSlash: 'never'` and `build.format: 'file'`. Pages serve at `/database`, `/card/{id}` â€” no trailing slashes anywhere (links, canonicals, sitemap).

## Card schema (post-TCGCSV migration)

Each card in `data/cards.json.br` is a clean object â€” no column-store reshape:

| Field | Source in TCGCSV | Notes |
|-------|-------------------|-------|
| `id` | `extendedData[Number]` | Fantasy Flight Games card code, e.g. `GD03-001`, `GD03-001_p1` (alt-art) |
| `slug` | synthesized | `{id}-{slugified-name}` for URL routing |
| `name` | `name` | "Star Wars Unlimited NT-1" |
| `cleanName` | `cleanName` | ASCII-safe variant from TCGplayer |
| `set` | from group abbreviation | `GD03`, `ST01`, `EB01`, `SWU-PR`, etc. |
| `groupId` | TCGCSV groupId | Joins back to set list |
| `type` | `extendedData[CardType]` | `Unit`, `Pilot`, `Command`, `Base`, `Resource` |
| `color` | `extendedData[Color]` | `Blue`, `Green`, `Purple`, `Red`, `White` (5 colors) |
| `rarity` | `extendedData[Rarity]` mapped via `RARITY_SHORT` | `C`, `U`, `R`, `SR`, `LR`, `P` (full label kept in `rarityFull`) |
| `cost`, `level`, `ap`, `hp` | `extendedData` numeric fields | All converted to `Number` or `null` |
| `trait` | `extendedData[Trait]` | e.g. `(Earth Federation)` |
| `link` | `extendedData[Link Condition]` | Pilot link, e.g. `[Christina Mackenzie] / [Amuro Ray]` |
| `description` / `action` | `extendedData[Description]` | Card text. `action` is an alias used by older page templates |
| `tcgPlayerId` | `productId` | Used by `getTcgAffiliateUrl()` |
| `productUrl` | TCGCSV `url` | TCGplayer product page direct link |
| `imageUrl` | TCGCSV `imageUrl` | TCGplayer CDN, `_200w.jpg` |
| `price`, `priceLow`, `priceMid`, `priceHigh`, `priceFoil` | TCGCSV `/prices` endpoint | All Normal subtype, Holofoil split into `priceFoil` |
| `releasedOn`, `isPresale` | `presaleInfo` | Used by the homepage roadmap |

Fields TCGCSV does NOT provide: `zone` (Space/Earth/Both â€” not in extendedData) and `source_title` (anime/series). These render blank when displayed; pages handle gracefully.

## Set list (from TCGCSV groups)

20 groups. `setData.js` classifies each:
- `kind: 'main'` â€” `GD01`-`GD04`+ (booster sets)
- `kind: 'starter'` â€” `ST01`-`ST10`+
- `kind: 'extra'` â€” `EB01`+
- `kind: 'promo'` â€” `SWU-PR`, `EXBP`, `EXRP`, `RP`
- `kind: 'special'` â€” `GD01_b` (Edition Beta), other Fantasy Flight Games-internal groupings

## Page inventory

| Route | Purpose |
|-------|---------|
| `/` | Homepage â€” hero + spotlight + latest decks + roadmap + features + FAQ |
| `/database` | Card database with search/filters + AA toggle (3-state: all/AA-only/regular-only) |
| `/builder` | 50-card main + 10-card resource deck builder, click-to-add, color/copy validation, URL-shareable hash |
| `/decklists` | Tournament decklists scraped from tcgtopdecks-hq |
| `/how-to-play` | Rules walkthrough + the official PDF (`/swu-comprehensive-rules-1.6.0.pdf`) |
| `/card/[id]` | Card detail page with alt-art cycler |
| `/set/[slug]` | Per-set card listing |
| `/404` | 404 page |

## Things that still carry over from the lorcana fork

- `src/utils/cardConstants.js` â€” keyword and color constants are Star Wars Unlimited-specific. Older pages may still reference `INKS` (alias for `COLORS`).
- `src/styles/` may contain unused Lorcana CSS classes (`.amber`, `.amethyst`, etc.) â€” harmless dead code, low priority cleanup.
- `src/pages/set/[slug].astro` â€” works but uses generic templating; can be polished.

## Manual asset replacements still pending
- `public/social-preview.png` (1200Ã—630 OG image â€” currently inherited from lorcana)
- `public/manifest.json` â€” rewrite name + theme color if you change branding
