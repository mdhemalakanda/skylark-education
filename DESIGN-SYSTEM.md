# DESIGN-SYSTEM.md — Skylark Education Redesign

## 1. Creative Direction — "Dawn Study"

A skylark sings at first light. The identity is built on that image: **a deep, calm
ink-navy sky warming into parchment**, with one confident **amber-gold** accent. The
feel is scholarly and editorial — closer to a beautifully set textbook or literary
journal than to a typical ed-tech landing page. Content is the hero; the frame around
it is quiet, precise, and warm.

Principles:

1. **Editorial typography first.** Display serif for headings, highly readable serif
   for article bodies, clean sans for UI. Bengali set in a dedicated Bengali face.
2. **One accent, used sparingly.** Gold marks interaction and emphasis — never decoration for its own sake.
3. **Generous, rhythmic whitespace.** Sections breathe; reading measures stay ~68ch.
4. **Calm motion.** Small reveals, gentle hovers; everything respects `prefers-reduced-motion`.
5. **Honest components.** Every control works; demo forms disclose their demo nature.

## 2. Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Fraunces** (Google Fonts, 500–700) | Soft, literary serif with presence |
| UI / labels / nav | **Inter** (400–700) | Crisp, neutral |
| Article body / prose | **Source Serif 4** (400–600) | Long-form reading comfort |
| Bengali text | **Hind Siliguri** (400–700) | Full Bengali coverage; auto-applied via `:lang(bn)` + unicode-range fallback |

Loaded via Google Fonts CDN with `display=swap`. Fallback stacks ensure offline readability.

### Type scale (rem)

12 · 14 · 16 (body) · 18 · 20 · 24 · 30 · 38 · 48 · 60 — fluid via `clamp()` for hero display sizes.

## 3. Color Tokens

```
--ink-950: #0c1a2c   (near-black navy — footer, hero depth)
--ink-900: #12253d   (primary navy — headings, header text)
--ink-700: #24405f   (secondary text)
--ink-500: #4c6480   (muted text)
--mist:    #dfe7ee   (borders on dark)
--paper:   #faf8f3   (page background — warm parchment)
--card:    #ffffff   (card surfaces)
--line:    #e7e2d6   (hairline borders on paper)
--gold-500:#d99a2b   (accent — links-hover, CTAs, highlights)
--gold-600:#b57e14   (accent-strong, pressed)
--gold-100:#f7ecd7   (soft highlight fills)
--teal-600:#2e6e6a   (secondary accent — literature / subtle tags)
--teal-100:#e2efee
--ok-600:  #2f7d4f   (success)
--warn-600:#b3591c   (demo notices)
```

Section identity hues (used only as thin top-borders/tags, never full fills):
Grammar `--gold-500` · Literature `--teal-600` · Academic `#3e5e9e` · Board `#a04a3a` ·
Creative Writing `#7b5ea7` · Admission `#2f7d4f`.

Contrast: body text ≥ 7:1 on paper; gold is never used for small text on paper.

## 4. Spacing, Radius, Elevation

- Space scale: `4 8 12 16 24 32 48 64 96` (px, used as rem-converted tokens).
- Radius: `10px` cards · `8px` inputs · `999px` pills.
- Shadows: `sm` (0 1px 2px rgba(12,26,44,.06)) · `md` (0 6px 24px rgba(12,26,44,.10)) ·
  `lg` (0 16px 48px rgba(12,26,44,.16)) — used sparingly (header on scroll, overlays, cards on hover).
- Container: `max-width: 1180px`, gutters 24px (16px on mobile).
- Breakpoints: `640` (mobile) · `900` (tablet) · `1180` (desktop).

## 5. Page Templates

1. **Home** — hero, discovery cards, grammar groups, exam matrix teaser, literature feature, founder preface, contact strip.
2. **Section hub** — breadcrumb, intro, grouped card lists (subsections), search hint.
3. **Grammar article** — rules/examples prose, TOC aside, prev/next topic, related exercises.
4. **Reading article** (literature / academic / creative writing) — title block with meta, TOC aside when ≥3 headings, prose body, prev/next, related.
5. **Board matrix** — year × paper × level filterable grid + marks distribution tables.
6. **Search** — instant results grouped by section.
7. **Static pages** — about/preface, contact (demo form), privacy, login/register previews, newsletter (demo), 404.

## 6. Component & Class Contract (implementation must match exactly)

### Layout
`.site-header` (sticky) `.header-inner` `.brand` `.brand-mark` `.nav` `.nav-list`
`.nav-item` `.nav-link` `.nav-item.has-mega` `.mega` `.mega-grid` `.mega-col` `.mega-title`
`.header-actions` `.search-toggle` `.mobile-toggle` `.mobile-nav` `.site-main` `.site-footer`
`.container` `.container-narrow` (max 860px) `.section` `.section-head` `.kicker` `.grid-3` `.grid-4` `.grid-2`

### Elements
`.btn` `.btn-primary` `.btn-ghost` `.btn-light` (on dark) `.chip` `.badge` (section tag)
`.card` `.card-title` `.card-meta` `.card:hover` lift · `.breadcrumb` `.toc` `.toc-link.is-active`
`.prose` (article typography wrapper) `.table-wrap` (responsive table scroll) `.notice`
`.notice--demo` (demo disclosure, warn hue) `.form-field` `.form-error` `.tabs` `.tab`
`.tab.is-active` `.accordion` `.accordion-item` `.accordion-head` `.accordion-body`
`.year-grid` `.matrix-table` `.reading-progress` `.back-to-top` `.reveal` (scroll reveal)
`.hero` `.hero-copy` `.hero-art` `.stat-chip` `.founder-card` `.search-overlay` `.search-panel`
`.search-input` `.search-results` `.result-group` `.result-item`

### Behavior contract (`assets/js/main.js`)
1. Sticky header shadow after 8px scroll; hide-on-scroll-down optional, keep shadow only.
2. Mega menu: open on hover/focus-within (desktop); `aria-expanded` managed; Esc closes.
3. Mobile nav: hamburger → slide-down panel with nested disclosure (details/summary style), focus trapped, `aria-expanded` on button.
4. Search overlay: `Ctrl/⌘+K` and header button; instant client-side search over `search-index.json` (title + text), grouped by section, keyboard navigable (↑↓ Enter Esc).
5. Tabs & accordions: ARIA roles, keyboard arrows for tabs.
6. TOC: sticky aside, IntersectionObserver scrollspy, smooth anchor scroll.
7. Reading progress bar on article pages (`data-page="article"` body attr).
8. Reveal-on-scroll: `.reveal` elements get `.is-in` via IntersectionObserver; disabled under reduced motion.
9. Back-to-top button appears after 600px.
10. Demo forms (contact/login/register/newsletter): validate inline, then show `.notice--demo` explaining no data is sent — never fake success.
11. Board matrix: year/paper filter chips filter the grid client-side.
12. No console errors; all JS deferred; no dependencies beyond optional jQuery-free vanilla (vanilla only).

### Prose conventions (`@import` inline styles are stripped by the transform)
- All article content renders inside `.prose`; Elementor inline colors are gone.
- `.prose table` gets `.table-wrap` wrapper + zebra rows + sticky header row.
- Bengali segments render via `:lang(bn)` font switch — no manual markup needed.
- Exercises (numbered lists following "answer the questions") are plain ordered lists — visually distinguished by `.prose ol` styling, not by fabrication.
