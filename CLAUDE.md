# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# swutcg.one — Star Wars Unlimited Database

## Overview
Static Astro site for Star Wars Unlimited (Fantasy Flight Games). Forked from the gundamtcg.one template; same TCGCSV-driven pipeline. Hosted on Cloudflare Pages.

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
npm run fetch-data        # Pull cards + sets + prices from TCGCSV (categoryId 79)
npm run download-images   # Mirror card images from TCGPlayer CDN
```

## Data sources

| Layer | Source | Notes |
|-------|--------|-------|
| Card metadata + prices | **TCGCSV** (`tcgcsv.com/tcgplayer/79/...`) | Full Star Wars Unlimited catalog. Set codes are 3-letter (SOR, SHD, TWI, JTL, LOF, SEC, LAW, ASH, TS26, IBH, GFT, CE2025, SN1, WPP-suffixed promos). |
| Card images | **TCGPlayer CDN** | High-res JPEGs, converted to WebP via sharp on download. |
| Tournament decklists | **TBD** — `melee.gg` and `swustats.net` are candidates. | Scraper not yet wired. `/decklists` page renders empty-state until populated. |

## URLs & trailing slashes
`astro.config.mjs` uses `trailingSlash: 'never'` and `build.format: 'file'`. Pages serve at `/database`, `/card/{id}` — no trailing slashes anywhere.

## Card schema (post-TCGCSV)

Each card in `data/cards.json.br` is a clean object:

| Field | TCGCSV source | Notes |
|-------|---------------|-------|
| `id` | `extendedData[Number]` (cleaned) | SWU card code, e.g. `SOR-001`, `ASH-094` |
| `slug` | synthesized | `{id}-{slugified-name}` for URL routing |
| `name` | `name` | "Moff Jerjerrod - We Shall Redouble Our Efforts" |
| `cleanName` | `cleanName` | ASCII-safe variant |
| `set` | from group abbreviation | `SOR`, `SHD`, `LAW`, `ASH`, etc. |
| `groupId` | TCGCSV `groupId` | Joins back to set list |
| `type` | `extendedData[CardType]` | `Leader`, `Base`, `Unit`, `Event`, `Upgrade` |
| `aspects` | `extendedData[Aspect]`, split on `;` | Multi-value array, e.g. `['Command', 'Villainy']` |
| `aspect` | first element of `aspects` | Convenience for single-aspect lookups |
| `rarity` | `extendedData[Rarity]` mapped via `RARITY_SHORT` | `C`, `U`, `R`, `L`, `S` |
| `cost` | `extendedData[Cost]` | Number |
| `power` | `extendedData[Power]` | Number (Units only) |
| `hp` | `extendedData[HP]` | Number (Units and Bases) |
| `traits` | `extendedData[Traits]`, split on `;` | Multi-value (Imperial, Official, Force, Rebel, etc.) |
| `arena` | `extendedData[Arena Type]` | `Ground` or `Space` (Units only) |
| `description` | `extendedData[Description]` | Card text, may include `<mark>` / `<b>` / `<i>` markup |
| `tcgPlayerId` | `productId` | Used by `getTcgAffiliateUrl()` |
| `imageUrl` | TCGCSV `imageUrl` | TCGplayer CDN, `_200w.jpg` |
| `price` family | TCGCSV `/prices` endpoint | Normal subtype preferred, Foil split into `priceFoil` |
| `releasedOn`, `isPresale` | `presaleInfo` | Used by the homepage roadmap |

Legacy aliases retained for template compat: `color` (mirrors first aspect), `trait` (raw Traits string), `action` (mirrors description).

## Set classification (`src/utils/setData.js`)

The classifier handles SWU's 3-letter and patterned codes:

| Pattern | Kind |
|---|---|
| 3 capital letters (`SOR`, `SHD`, `LAW`, `ASH`, ...) | `main` |
| `TS\d+` (Twin Suns numbered) | `main` |
| `IB[A-Z]` (Intro Battle) | `starter` |
| `SN\d`, `CE\d+`, `*WPP` suffix | `promo` |
| `GFT` (Gift Box) | `special` |
| anything else | `special` |

## Page inventory

| Route | Status | Purpose |
|-------|--------|---------|
| `/` | Live | Hero + spotlight + roadmap + features + FAQ |
| `/database` | Live | Card database with Aspect / Type / Arena / Cost / Power / HP filters |
| `/builder` | Live | Leader + Base + 50-card minimum builder; aspect-cost penalty enforcement TODO |
| `/decklists` | Stub | Empty-state until a scraper is wired |
| `/how-to-play` | Live | Rules walkthrough (manually authored, not from a PDF) |
| `/card/[id]` | Live | Card detail page with alt-art cycler |
| `/set/[slug]` | Live | Per-set card listing |
| `/404` | Live | 404 page |

## Outstanding work (post-clone)

1. **Decklist scraper** — pick between `melee.gg` (richer event data, Cloudflare-protected) and `swustats.net` (simpler structure). Wire similarly to lorcana's `nodriver-cf-verify` pattern if going with melee.
2. **Aspect-cost penalty in /builder** — current build doesn't apply the +2 cost for off-aspect cards. Rule is well-known; should be one helper function.
3. **Brand assets** — `public/favicon.svg`, `apple-touch-icon.png`, `social-preview.png` still inherited from gundam. Need SWU-themed replacements (Star Wars logotype or aspect-icon mark).
4. **Manifest** — `public/manifest.json` was deleted during clone; regenerate after favicons are in place.
5. **Theme color** — currently `#1A237E` (placeholder dark navy in `src/layouts/Layout.astro`). Pick the canonical SWU brand color.
6. **Aspect hex values** — see `src/utils/cardConstants.js`. Current values are reasonable approximations; sample from real card scans to refine.
7. **CSS tokens** — `src/styles/tokens.css` has `--color-swu-yellow`, `--color-swu-gold` etc. that were the gundam Federation palette. Rename or update values to a SWU-appropriate palette.

## How this fork was created

Literal copy-paste of `gundam/`, then:
- `cp -r gundam swu` + wipe `.git` + `git init`
- `sed` find/replace across `*.astro,*.js,*.ts,*.css,*.json,*.md,*.txt,*.xml` for: `gundamtcg.one → swutcg.one`, `Gundam Card Game → Star Wars Unlimited`, `Bandai → Fantasy Flight Games`, `GCG → SWU`, plus 15 more passes.
- Card schema mapping in `scripts/fetch-data.js` updated for SWU's `extendedData` field names (`Aspect`, `Power`, `Arena Type`, `Traits`).
- Set classifier in `src/utils/setData.js` rewritten for SWU 3-letter codes.
- `src/utils/cardConstants.js` rewritten with SWU `ASPECTS`, `CARD_TYPES`, `ARENAS`, and `ABILITIES`.
- `src/components/SearchFilters.astro`, `src/pages/card/[id].astro`, `src/pages/builder.astro` updated for SWU fields.
- FAQ + `/how-to-play` content rewritten for SWU mechanics.
- IndexNow key rotated; verification file regenerated under `public/{KEY}.txt`.
- Gundam-only files stripped: comprehensive-rules PDF, `scripts/scrape-tcgtopdecks/`, `scripts/fetch-decklists.js`, `src/utils/loadDecklists.js`, stale `data/*.json.br`, old `manifest.json`.

## Don't put here

- Per-page implementation details that already live in the page itself.
- Secret keys (none required).
- Speculation about future features — wait until they're real.
