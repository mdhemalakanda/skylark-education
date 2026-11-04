# AUDIT.md — Skylark Education (skylarkeducation.com) Redesign Audit

Audited: 2026-11-04 · Method: full crawl via WordPress REST API (`wp-json/wp/v2`) + sitemaps (`wp-sitemap.xml`), direct page inspection, robots.txt.

---

## 1. Website Overview

Skylark Education is a Bengali/English secondary-and-higher-secondary English learning
resource site built on **WordPress + Elementor** (hosted at ashraf.life infrastructure,
MailPoet newsletter, JetPack stats). Tagline: **"Nurturing young recruits with pride and care."**

- **Founder:** Abdullah-Al-Mamun, BA (Hons), MA in English — Founder Director
- **Address:** Skylark Education, 45 Navy Market, Mirpur 14, Dhaka 1206
- **Phones:** +8801521441859, +8801710730506
- **Emails:** tuhin0011@gmail.com, artuhin104@gmail.com
- **Purpose (from the Preface):** a rule-and-example-rich English grammar reference for
  school/college students aligned to their syllabi, born from the gap between
  time-limited classroom lectures and example-poor grammar books.

Content is **English-medium educational material**; **183 of 360 content items contain Bengali text** (grammar explanations, instructions).

## 2. Discovered URL Inventory

Raw sitemap inventory: **512 URLs** (238 pages, 149 posts, 125 category archives).
After de-duplication and removal of 19 internal template pages:
**360 real content items**, preserved in full in `data/content.json`.

| Section | Items | Description |
|---|---|---|
| Grammar | 87 | 27+ grammar topics: rules pages + per-level exercise sets (SSC/HSC/JSC/Class 8) |
| Literature | 82 | Poems (Frost, Blake, Byron, Keats, Hughes, Tagore translations…), literary prose, biographical passages, prose pieces, literary terms |
| Academic | 91 | English-for-Today textbook passages (Class 5–12), seen/unseen passages, gap filling, matching, rearrange, model questions, textbook PDF pages |
| Board Questions | 54 | SSC & HSC board questions by year (2009–2026), 1st & 2nd paper, marks distributions (SSC 2025/2026, HSC 2025/2026, Class 6–8), board solutions |
| Creative Writing | 34 | Paragraph, letter (formal/informal), email, dialogue, story, composition, report, CV, graph & chart, complaint/notice |
| Admission | 1 + hub | Cadet College admission syllabus/marks, University admission hub ("Advanced Grammar For Admission Test") |
| Site pages | 11 | Home/Preface, Privacy Policy, Log-in, Register, Newsletter |

Full itemized inventory: `data/content.json` (`slug`, `title`, `section`, `subsection`, `words` per item).

## 3. Page Titles & Parent–Child Relationships

Original navigation (top menu): **Literature · Grammar · Imaginative · Academic · Admission · Board · Account** — flat, no visible hierarchy; child pages are reached only through category archives (`/topics/...`), which are inconsistent.

Parent-child relationships are carried by a **200-item WordPress category tree**, e.g.
`board-questions/second-paper/hsc-11-12/filling-gaps-with-clues`, `grammar/tense`,
`creative-writing/paragraph/for-hsc-only`. Depth reaches 4 levels but naming is
inconsistent (mixed case: "CLASS 6", "Class 8"; synonyms: "text-books" vs "board-questions").

## 4. Content Categories (as found)

- Grammar topics grouped under `/topics/grammar/` with sub-groups (rules vs exercises distinguished only by category).
- Question-type groups (Seen Passage, Gap Filling with/without clues, Rearrange, Matching, Substitution Table, Summary, WH-questions, Form Completion, Arrange/Rewrite).
- Exam years as categories: 2013–2026, duplicated across SSC/HSC and 1st/2nd paper (e.g. "2020 (SSC)", "2020 (SSC).", "2020" — three separate categories for the same year).
- Creative writing types (paragraph/for-all-classes, paragraph/for-hsc-only, email/formal, email/informal…).

## 5. Existing Features

- Site-wide keyword search (WordPress search).
- Newsletter signup (MailPoet) with privacy-policy link.
- Account: `/log-in/`, `/register/` (WordPress account pages).
- PDF textbook embeds (Class 5, Class 9, Class 11–12 English For Today).
- Category archive browsing.
- Facebook / Twitter / WhatsApp links in footer.
- Direct phone/email links.

## 6. Existing Navigation Structure

Header: logo + search box + flat menu (no dropdowns). Footer: About Us blurb, Contact details, Privacy Policy link, social icons, newsletter form. **No breadcrumbs anywhere.** No year/board navigation on board pages; users rely on menus listing year-pages linearly.

## 7. Missing or Weak Functionality

1. No breadcrumbs or related-content navigation — deep pages are dead ends.
2. No grammar-topic grouping: 87 grammar pages have no logical index (only a flat archive).
3. Board questions are organized by arbitrary page slugs (`2023-2`, `2019-2015`, `all-board-2025`) with no year/board/paper matrix.
4. No table of contents on long articles (many exceed 2,000 words).
5. Search results presentation is a bare WordPress post list.
6. No prev/next topic navigation for grammar sequences.
7. Account/login pages are raw WordPress forms with no on-site purpose explained.
8. Newsletter form depends entirely on backend; no graceful demo/fallback.
9. Elementor template pages (`elementor-*`) are publicly indexed and reachable.
10. No mobile-specific navigation (flat menu only; long menu unusable on phones).

## 8. Duplicate or Confusing Content Structures

8 duplicate slugs exist (same page published as both post and page):
`gap-filling-textual`, `the-story-of-an-hour`, `passage-narration`, `2023-2`,
`capitalization-and-punctuation`, `interchange-of-part-of-speech`,
`transformation-of-sentences`, `conjugation-of-verbs` → redesign keeps the richer copy of each.
Near-duplicate titles exist (e.g. `michael-madhusudan-dutta` vs `michael-madhusudan-dutt`;
`21-february-is-a-memorable-day` vs `21-february-is-observed-as-shaheed-dibosh`) — both kept.
Year-page naming (`2023-2`, `2023-3`, `2023-4`, `2019-2015`, `2018-2017-ssc`) is opaque;
the redesign maps them into an explicit year/board/paper matrix without renaming content.

## 9. Mobile Usability Issues

- Elementor containers render fixed-width tables that overflow on phones (many grammar charts are 3–6 column tables).
- No hamburger menu; the flat menu wraps poorly on small screens.
- Newsletter/subscribe forms render wide on mobile.
- Long passages have no reading aids (font-size controls, TOC) — painful on phones.

## 10. Design Inconsistencies

- Inline-styled rainbow text (magenta/pink `<span style="color:#ff00ff">`) across grammar rules.
- Mixed heading levels (H2/H3 chosen freely), centered `<i>` headings.
- No consistent card/list components; archives are unstyled WordPress lists.
- Emphasis done via random `<strong><em>` combos; tables have no consistent styling.

## 11. Important Information That MUST Be Retained

- Preface text and founder signature block (Abdullah-Al-Mamun, credentials, Mirpur Dhaka).
- All contact details (two phone numbers, two emails, address: 45 Navy Market, Mirpur 14, Dhaka 1206).
- Tagline "Nurturing young recruits with pride and care."
- Every educational article in full — **360 items preserved verbatim** in `data/content.json`.
- Marks-distribution tables for SSC 2025/2026, HSC 2025/2026, Class 6/7/8, Cadet Colleges.
- Board questions 2009–2026 (SSC & HSC, 1st & 2nd paper).
- Privacy policy.
- Textbook PDF links (Class 5, 9, 11–12) — see limitation §13.

## 12. Broken or Inaccessible Pages

- `/wp-json/wp/v2/media`-hosted images on `i0.wp.com`/`ghior.com` required browser UA (22 chart images recovered; 1 needed retry — all 22 now stored locally).
- **Textbook PDFs** (`Class-5.pdf`, `Class-9.pdf`, `Class-11-12-3.pdf`) are hotlink-protected — cannot be mirrored; the redesign links to the original URLs.
- Tracker pixels (`pixel.wp.com/g.gif`) present in content — stripped in redesign.
- Stub pages with no content: `marks-distribution-for-hsc/-ssc` (posts superseded by `-2025`/`-2026` pages), `direct-and-indirect-speeches-narration` (superseded by `direct-and-indirect-speech-narration`), and empty hub pages (`grammar`, `academic`, `admission`, `board`, `creative-writing`, `imaginative`) — these hubs get generated index content in the redesign.

## 13. Limitations Recorded

| Limitation | Disposition |
|---|---|
| 3 textbook PDFs not downloadable (hotlink protection) | Linked to original site; noted on textbook page |
| Login/register/newsletter require backend | Frontend-only demo mode with explicit "demo" disclosure |
| Some board year-pages contain board-name ambiguity (slug only) | Mapped to year/board/paper matrix using page titles; nothing fabricated |
| `university` admission hub has minimal content | Kept as honest section landing listing available resources |
| Elementor pages carried no category metadata | Content-aware classification (documented in `scripts/transform.mjs`) |
