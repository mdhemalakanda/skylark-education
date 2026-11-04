# SITEMAP.md — Redesigned Skylark Education Information Architecture

Every one of the 360 audited content items maps to exactly one route below.
Original slugs are preserved so existing links and bookmarks keep working.
Static build output lives in `site/` — every route is a real `index.html`.

```
/                                   Home (hero, resource discovery, founder, contact)
/search                             Search (client-side, full-content index of all 360 items)
/404.html                           Custom 404
/privacy-policy/                    Privacy Policy (original content)

├─ grammar/                         GRAMMAR hub — 10 topic groups, 87 pages
│   ├─ parts-of-speech/             Noun · Pronoun & Reference · Adjective · Adverb · Article
│   │                               Preposition · Conjunction · Verb · Parts of Speech
│   │                               Interchange of Parts of Speech (+ rules + exercise)
│   ├─ tense-verbs/                 Tense · Subject–Verb Agreement · Right Form of Verbs
│   │                               Conjugation · Conditional · Subjunctive (+ SSC/HSC/Class 8 exercises)
│   ├─ sentence-transformation/     Sentence · Transformation (affirmative↔negative,
│   │                               assertive↔interrogative/exclamatory/imperative/optative,
│   │                               voice, degree, simple-complex-compound) + exercises
│   ├─ narration/                   Direct & Indirect Speech rules + JSC/SSC/HSC exercises + passage narration
│   ├─ preposition-article/         Preposition rules · Appropriate preposition · exercises · Articles
│   ├─ prefix-suffix-connectors/    Prefixes & Suffixes · Connectors (+ SSC/HSC exercises)
│   ├─ completing-modifiers/        Completing Sentences (+ exercises) · Modifiers · Dangling modifiers
│   ├─ number-gender-case/          Number · Gender · Case
│   ├─ capitalization-punctuation/  Rules + exercises
│   └─ vocabulary-reference/        Synonym & Antonym · Proverbs · Pronunciation · Inversion
│                                   Tag Question · Phrases & Clauses · Abbreviations · Simile & Metaphor
│                                   Common Error
│   Each grammar article: rules + examples layout, TOC, prev/next topic, related exercises.
│
├─ english-literature/              LITERATURE hub — 82 items
│   ├─ poems/                       30+ poems with poet, text, theme/summary, questions
│   ├─ prose-stories/               Literary prose & stories (The Story of an Hour, Merchant of
│   │                               Venice excerpts, The Purple Jar, Mr. Moti, Tagore's parrot tale…)
│   ├─ passages/                    Biographical & literary passages (Mandela, Behula, Lalon…)
│   └─ literary-terms/              Literary terminology, proverbs, pronunciation, tongue twisters
│
├─ creative-writing/                CREATIVE WRITING hub — 34 items
│   ├─ paragraph/                   20+ paragraph models (by class level where stated)
│   ├─ letter-email/                Formal & informal letters, formal & informal email
│   ├─ composition-story/           Composition · Story writing · Dialogue
│   ├─ report-cv/                   Report writing · CV writing
│   ├─ graph-chart/                 Graph & chart writing (with the original 22 chart images)
│   └─ notices/                     Complaint letter / notice
│
├─ academic/                        ACADEMIC hub — 91 items
│   ├─ class-5/  class-6/  class-7/  class-8/      Class hubs: passages, exercises, marks distribution,
│   ├─ class-9-10/  class-11-12/                   model questions, textbook PDF link
│   ├─ seen-passages/                              Seen passage sets
│   ├─ exercises/                                  Gap filling, matching, rearrange, WH-questions
│   └─ textbook/                                   English For Today PDF pages (links to originals)
│
├─ board-question/                  BOARD EXAM hub — 54 items
│   ├─ ssc/                         SSC matrix: year (2015–2026) × paper (1st/2nd) × board
│   │                               All-board compilations, marks distribution SSC 2025/2026
│   ├─ hsc/                         HSC matrix: same structure, marks distribution HSC 2025/2026,
│   │                               board solutions (e.g. Sylhet 2023 2nd paper solution)
│   └─ marks-distribution/          Consolidated marks-distribution tables (verified data only)
│
├─ admission/                       ADMISSION hub
│   ├─ cadet-college/               Cadet College admission syllabus & marks distribution
│   └─ university/                  University admission: Advanced Grammar resources
│
├─ about/                           About & Preface (founder's preface, verbatim)
├─ contact/                         Contact (address, phones, emails, map-free, demo form)
├─ account/
│   ├─ log-in/                      Login preview (clearly-marked demo — no real auth)
│   └─ register/                    Registration preview (clearly-marked demo)
└─ newsletter/                      Newsletter demo page (no fake subscription claims)
```

### URL strategy

- Original WordPress slugs are kept 1:1 (e.g. `/tense/`, `/rules-on-right-form-of-verbs/`,
  `/2023-2/`, `/marks-distribution-for-ssc-2026/`) so nothing is orphaned.
- Section hubs are new routes (`/grammar/`, `/english-literature/`, …) that replace the
  old empty Elementor stubs.
- Every content page carries: breadcrumb → section hub, prev/next within its group,
  and 3 related items from the same group.

### Coverage check (360 audited items → routes)

| Section | Items | Route family |
|---|---|---|
| Grammar | 87 | `/grammar/**` + original slugs |
| Literature | 82 | `/english-literature/**` + original slugs |
| Academic | 91 | `/academic/**` + original slugs |
| Board | 54 | `/board-question/**` + original year slugs |
| Creative writing | 34 | `/creative-writing/**` + original slugs |
| Site pages | 11 | `/`, `/about/`, `/privacy-policy/`, account, newsletter, hubs |
| Admission | 1 | `/admission/**` |
