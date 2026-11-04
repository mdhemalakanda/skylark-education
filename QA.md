# QA.md — Skylark Education Redesign Test Report

Tested: 2026-11-04 · Build: `node scripts/build.mjs` → `site/` (372 HTML pages)
Server: `python3 -m http.server 8123` from `site/` · Browser: Playwright Chromium 156 (headless)

## 1. What was tested and actual results

### Link & asset integrity (automated, all 372 pages)
- **131,948 → 88,796 internal `/`-links checked: 0 broken.** (Count dropped after URL cleanup — every link now uses clean directory URLs.)
- Asset references (`/assets/...`): 0 broken.
- Relative leftover hrefs: 0. (`scripts/linkcheck.mjs` is rerunnable.)
- 26 links intentionally point to the original site (Elementor template targets, `.docx` uploads, textbook PDFs — hotlink-protected, see Limitations).

### Content preservation (automated, all items)
- 343 public content items: **all present, zero truncation** (first-80-char normalized text match against the WordPress REST-API corpus).
- Tables: **235/235** items with original `<table>` render `<table>` in the redesign.
- Bengali: sampled 10 `hasBengali` items — all render Bengali text; Hind Siliguri loaded via Google Fonts.
- TOC anchors: sampled 10 TOC-bearing pages — every `#h-N` href has a matching `id="h-N"`, counts match exactly (e.g. 38/38, 20/20). Verified visually on `/informal-letter/`.
- Elementor junk (`data-id=`, `wp-block-file__button`, tracker pixels): 0 occurrences in output.
- Stub pages (9 items with <15 words): no fabricated content — honest title + navigation only.
- 8 duplicate slugs (page+post): richer copy kept, recorded in AUDIT.md §8.

### Browser interaction tests (Playwright, actual assertions)
| Feature | Result |
|---|---|
| Mega menu opens on hover, **closes on mouseleave** | PASS (after fix) |
| Mega compact layout (Grammar 10 groups) renders cleanly | PASS (after fix) |
| Homepage SSC/HSC tabs switch panels | PASS |
| Search overlay opens (⌘K tested via keyboard), "tense" → 14 results, keyboard ↓ + Enter navigates to `/tense/` | PASS |
| Search grouped by section, `<mark>` highlighting | PASS (visual) |
| Board year filter: 9 cards → 2026 only: 1 → 2025+2026: 4 → All: 9 | PASS (after fix) |
| TOC renders once (no duplication), scrollspy active states | PASS (after fix) |
| Contact demo form: invalid → inline errors; valid submit → honest demo disclosure shown | PASS (after fix) |
| Mobile nav opens/closes at 390px, sub-groups accordion | PASS (after fix) |
| Reading progress bar on article pages | PASS (visual) |
| Reveal-on-scroll fires for tall article bodies | PASS (after fix) |
| Console/page errors across tested journeys | **0 errors** |

### Visual review (screenshots captured)
- Home desktop 1280px + mobile 390px: hero, discovery cards, grammar index, exam tabs, founder block — all render as designed, no horizontal overflow observed.
- Grammar hub desktop, Literature hub desktop, Board SSC page, article page with sticky TOC (desktop + mobile) — reviewed via screenshots.
- Mobile article: single column, readable measure, tables scroll within `.table-wrap`.

### Routing
- Direct access + refresh on deep routes (`/tense/`, `/board-question/ssc/`, `/admission/university/`) — static `index.html` per route, works under any static server.
- Custom 404 exists (`/404.html`); note: python http.server does not honor it as a fallback — a host with `error_page` (Netlify/Fly static, nginx) will. Recorded as limitation.

## 2. Bugs found during QA and fixed (all re-verified)

1. **Reveal-on-scroll never fired for tall article bodies** — IntersectionObserver `threshold: 0.12` unreachable on multi-thousand-px elements → threshold 0.
2. **Mega menu stayed open over content** — 10-column link wall taller than viewport → compact group-index layout for >6 groups, 6-link cap for lists.
3. **Search returned 0 results** — index schema mismatch (`{t,s,p,x}` vs `{title,text,section,path}`) → build emits JS-expected fields.
4. **Board year filter didn't filter** — two causes: `Set.prototype.some` (invalid) in matcher; cards rendered outside the `[data-matrix]` container the JS scopes to.
5. **"All years" chip broke matching** (no item has year "all") → special-cased as "clear group".
6. **TOC duplicated on all pre-rendered-TOC pages** — JS rebuilt without clearing → pre-rendered TOCs are now authoritative, JS only wires scrollspy.
7. **Demo forms showed nothing** — shipped notice element stayed `hidden` → JS unhides and fills it.
8. **Mobile nav never opened** — JS toggled `.is-open` but never the `hidden` attribute → now toggles both.
9. **`[hidden]` silently defeated by display rules** (cards/tabs/overlays) → global `[hidden]{display:none!important}`.
10. **Search result/error class names didn't match CSS** → aligned (`title`/`snippet`/`empty`).
11. **Double chevron on mega triggers, unstyled brand mark** → template + CSS fixes.
12. **Content h1 duplicated the page title** → dedup/demotion of content h1s, headings recomputed so TOC ids stay aligned.
13. **Anchors hid under sticky header** → global `scroll-margin-top`.
14. **Invalid `height="auto"` on hero SVG** → inline style.

### Second fix round (from real-browser user screenshots + full visual sweep of 16 page types at desktop & mobile widths)

15. **Exam tabs rendered as a giant gold blob swallowing the year cards** — the pill background/padding sat on the whole `.tabs` container including panels → pill moved to the tablist row only, panels plain.
16. **Founder quote squeezed into a ~200px sliver** — `.founder-card` was a `1fr 200px` grid expecting a photo the template doesn't have → single-column card, editorial blockquote styling.
17. **Header search stacked vertically (icon / "Search" / ⌘K)** — `.search-toggle` was a 40px grid → inline-flex pill; label+shortcut hidden under 1120px.
18. **Board sub-hub cards wiped to a single "2026"** — `initYear` set `textContent` on every `[data-year]` element, which matched the filter cards → footer year moved to a dedicated `[data-footer-year]` attribute. (This is why user screenshots showed empty cards.)
19. **Footer brand mark was a solid gold box** — painted background behind the SVG → transparent mark, gold ring, correct sizing; social icons bordered on one row.
20. **Founder "Read the full preface" button invisible** (dark-on-dark) → light ghost variant.
21. **`&AMP;` artifacts in card snippets** — double-escaped entities from the original corpus → entity decoding added to titles/snippets pipeline.

### Third fix round (user-reported: mega menu + mobile issues)

22. **Mega menu disappeared when moving the mouse into it** — 8px dead gap between trigger and panel fired `mouseleave` mid-crossing → invisible hover bridge (::before) + 180 ms close grace period.
23. **Mega panels clipped the viewport** on 900–1200px screens (up to 732px overflow on Board Exam) → JS fit-to-viewport clamp on open/resize (verified: min 12px margin at 920/1000/1100/1280/1440 across all 5 megas).
24. **Compact mega badges collided with wrapped group titles** → 2-column layout with wider panel (760px), centered badge alignment, balanced title wrapping.
25. **Mobile nav rows flush to screen edges, chevrons cut off** → dedicated `mn-*` styling: horizontal padding, aligned chevrons, indented link lists, section dividers, tinted CTA footer.
26. **Bengali text never wrapped on mobile (631px overflow)** — original content glued words as adjacent `<em>` tags with no whitespace and used `&nbsp;` runs → inter-word space restored at Bengali tag joins during transform + `overflow-wrap: anywhere` safety net on `.prose`.
27. **Article tables overflowed phones** — bare `<table>` in prose now wrapped in scrollable `.table-wrap` during build.
28. **Quote box had zero padding & cream gap above footer** — stylesheet's spacing scale skipped `--sp-5`, so `var(--sp-5)` computed to 0 → all 5 occurrences remapped to real tokens; footer top margin removed for seamless navy join.

### Final verification after round 3
- Horizontal overflow: **0 pages** across 18 representative pages at 390px (was 2).
- Mega fit: all 5 megas within viewport at 920/1000/1100/1280/1440.
- Hover bridge: cursor crosses into panel without closing; closes 180 ms after leave.
- Full regression (search, tabs, year filters, TOC, mobile nav, demo forms, footer year): **all PASS, 0 console errors**; 0 broken links across 88,796.

### Final regression (all PASS, 0 console errors)
search (30 results for "preposition") · mega open/close · SSC & HSC tabs · card titles present on both board sub-hubs · year filter narrows 12→5 · TOC rendered once · newsletter/contact demo disclosures · footer year. Visual sweep re-verified: home, grammar, literature, creative writing, academic, board hub, SSC, marks distribution, admission, grammar article, poem, letter (TOC), about/preface, contact, login, 404 — desktop 1280px and mobile 390px.

## 3. Remaining limitations (honest)

1. **Textbook PDFs** (Class 5/9/11–12) are hotlink-protected on the original host — pages link to the original PDFs instead of mirroring them.
2. **Custom 404 fallback** depends on the hosting platform (file exists; python http.server won't serve it for unknown paths).
3. **Search index** covers all 341 content items (title + first 1,200 chars) — full-text search of entire bodies is a backend-phase improvement.
4. **Forms are honest demos** — contact/login/register/newsletter never send or store data; all state this explicitly on submit.
5. **5 content pages** keep original links to `elementor-*` template pages as external URLs to the live site (faithful preservation; a launch would clean these up).
6. **Board year-page titles** are reproduced verbatim (e.g. the stub post titled "Marks Distribution For Class 6" at `/marks-distribution-for-ssc/` is mislabeled on the original site — kept as-is, flagged here rather than silently changed).
7. **Bengali font** loads from Google Fonts CDN; offline use falls back to system fonts.
8. Original MailPoet newsletter embeds and WordPress login forms were backend features — replaced by clearly-marked frontend preview pages, per project rules.

## 4. Not tested
- Real mobile devices (tested via viewport emulation only).
- Safari/Firefox (Chromium only in this environment).
- Screen-reader UX beyond semantic markup/ARIA attributes being present and correctly wired.

### Fourth round — blue education re-theme (reference layout) + responsive audit

29. **Full re-theme to the reference design**: navy top bar (phone/email + social + Login/Register), white header with tagline + "Start Learning" CTA, light-blue hero ("Learn · Practice · Excel"), 4-card quick strip, Welcome section with checklist, 8-card category grid, SSC & HSC exam banner with checklist, "Why Choose" cards, founder quote band, featured resources, navy newsletter strip. Typography moved to Plus Jakarta Sans headings + Inter UI; blue primary (#1d59e0) replaces gold as chrome accent. Section hues for grammar/literature/etc. retained.
30. **Honesty kept**: the reference's student testimonials with star ratings were NOT fabricated — replaced with real featured-resource cards. "Experienced Instructor" claim replaced with the factual rule-and-example method.
31. **Reveal made progressive-enhancement safe** — content visible by default; hidden only after JS arms the page; reduced-motion users get no hiding at all.
32. **Desktop nav breakpoint raised to 1140px** — 9-item nav overflowed every page at 1024px (1138px scrollWidth); hamburger now serves 900–1139px.
33. **Mega compact grid unwrapped** — nested `.mega-grid` containers produced 77px columns and badge collisions; single grid, 2×289px columns, badges inline.
34. **Search overlay fully styled** — `.search-box`, `.search-close`, result groups, snippets and `<mark>` highlights had no CSS at all.
35. **Search slow-network race** — typing before the lazy index resolved threw "index is not iterable"; render now retries after the index arrives.
36. **GitHub Pages base-path support** — `BASE_PATH` build flag + single-pass link rewriting (a sequential replace double-prefixed every home link); `OUT_DIR` separates publish builds from the local build.

### Responsive audit matrix (final)
23 representative pages × 5 widths (390/768/1024/1440/1920) = **115 checks: zero horizontal overflow, zero JS/console errors.** Interactions re-verified on the live deployment: search, mega fit, year filters, TOC, demo forms, mobile nav — all PASS.

### Fifth round — user screenshot audit (color/button/responsive polish)

37. **Cream page background replaced with white** — the warm paper tint read as "beige issue" against the blue theme; base is now white with blue-tinted hairlines.
38. **Kickers were still gold on all pages** — `body[data-section] .kicker` outranked the override → matched specificity with blue.
39. **Gold divider lines above section headings removed** — they were `border-top` on the h2 itself (`body[data-section] .section-head h2`), not the pseudo previously overridden.
40. **Icon bubbles now solid colored circles with white glyphs** (reference style) instead of 12% tints.
41. **Both "Home" and "Contact" highlighted as active simultaneously** — items with `root: null` matched a null activeRoot; Home now carries its own token and only true matches highlight.
42. **Footer brand text navy-on-navy** → white/light-blue hierarchy; mark transparent with gold ring.
43. **Reading progress bar** → brand blue.
44. **Nav breakpoint 1140px** — 9-item desktop nav overflowed every page at 1024px (1138px scrollWidth); hamburger now owns 900–1139px (verified open/close at 1024).
45. **Card hover underlines removed** (user screenshot: "Board Exam Prep" underlined on hover).

### Final responsive matrix
23 pages × 5 widths (390/768/1024/1440/1920): **zero overflow, zero JS errors.** Interaction suite (search, mega fit, filters, TOC, forms, mobile nav): **all PASS.**
