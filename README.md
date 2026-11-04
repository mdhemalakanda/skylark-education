# Skylark Education — Complete Website Redesign

**Live preview:** https://mdhemalakanda.github.io/skylark-education/

A complete frontend redesign of skylarkeducation.com — 372 static HTML pages, all
349 public learning resources preserved verbatim from the original WordPress site.
Pure HTML5 + CSS3 + vanilla JS. No frameworks, no backend.

## What's inside

| Path | Description |
|---|---|
| `/` (root) | The built site — deploy anywhere as-is |
| `src/scripts/` | Build pipeline (`transform.mjs` → `content.json`, `build.mjs` → `site/`, `linkcheck.mjs`) |
| `src/assets/` | Source CSS design system + JS interactions |
| `src/data/` | Cleaned & classified content dataset (360 items) |
| `AUDIT.md` | Full audit of the original website |
| `SITEMAP.md` | Information architecture — every audited item mapped |
| `DESIGN-SYSTEM.md` | Creative direction, tokens, component contract |
| `QA.md` | Test report: 115 responsive checks, interaction tests, fixes |

## Rebuild locally

```bash
cd src/scripts
node transform.mjs        # WordPress corpus → data/content.json (needs data/raw)
node build.mjs            # → site/  (BASE_PATH=/repo-name/ for sub-path hosting)
node linkcheck.mjs        # verifies 0 broken links
```

## Key facts

- Content honesty: every article is the original text; demo forms and login/register
  pages explicitly disclose they store nothing; no fabricated testimonials or statistics.
- Instant client-side search (⌘K) over a 341-item index.
- SSC & HSC board questions (2009–2026) with year filters and verified marks distributions.
- Bengali text set in Hind Siliguri; fully responsive (390px → 1920px, 115 automated checks).
