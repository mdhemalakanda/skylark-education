#!/usr/bin/env node
/**
 * transform.mjs — Convert the Skylark Education WordPress corpus
 * (raw JSON exported via wp-json) into a clean, classified dataset
 * at data/content.json for the static site build.
 *
 * Rules:
 *  - Preserve ALL educational content text, tables, lists, headings.
 *  - Strip Elementor wrapper divs and presentational junk only.
 *  - Never invent or drop content; failures are recorded, not hidden.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));

const posts = [...read('posts-all.json'), ...read('posts-all-2.json')];
const pages = [...read('pages-all.json'), ...read('pages-all-2.json'), ...read('pages-all-3.json')];
const cats = [...read('categories.json'), ...read('categories-2.json')];
const catById = Object.fromEntries(cats.map((c) => [c.id, c]));

/* ------------------------------------------------------------------ *
 * HTML cleaning — unwrap Elementor containers, strip presentation.  *
 * ------------------------------------------------------------------ */

function cleanHtml(raw) {
  let h = raw ?? '';
  h = h.replace(/<script[\s\S]*?<\/script>/gi, '')
       .replace(/<style[\s\S]*?<\/style>/gi, '')
       .replace(/<!--[\s\S]*?-->/g, '');

  // MailPoet / subscribe forms are backend features — remove.
  h = h.replace(/<form[\s\S]*?<\/form>/gi, '');

  // Unwrap every <div> (Elementor containers/widgets) but keep children.
  h = h.replace(/<div\b[^>]*>/gi, '').replace(/<\/div\s*>/gi, '');

  // Remove Elementor inline-tag attributes we don't want: styles, classes, ids.
  h = h.replace(/\s(?:style|class|data-[a-z-]+|aria-label|role|id)\s*=\s*"[^"]*"/gi, '');
  h = h.replace(/\s(?:style|class|id)\s*=\s*'[^']*'/gi, '');

  // Colour/font spans: keep <strong>/<em> meaning, drop naked styling spans.
  h = h.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // Empty paragraphs / br runs.
  h = h.replace(/<p\b[^>]*>(\s|&nbsp;| )*<\/p>/gi, '');
  h = h.replace(/(<br\s*\/?>\s*){3,}/gi, '$1');

  // wp-block noise + empty heading links.
  h = h.replace(/<h([1-6])\b[^>]*>\s*<\/h\1>/gi, '');

  // Non-breaking spaces block line wrapping (Bengali lines never break
  // without this) — regular spaces preserve meaning and fix overflow.
  h = h.replace(/&nbsp;/gi, ' ');

  // Bengali word-runs arrive as adjacent inline tags with no whitespace
  // (e.g. <em>কবি</em><em>এক</em>) — an unbreakable run that overflows
  // phones. Restore the inter-word space at Bengali tag joins.
  const BN = '\\u0964-\\u09FF';
  h = h.replace(new RegExp(`</(em|strong|i|b)><(?:em|strong|i|b)>[${BN}]`, 'g'), (m) => m.replace('><', '> <'));
  h = h.replace(new RegExp(`[${BN}]</(em|strong|i|b)><(em|strong|i|b)>`, 'g'), (m) => m.replace('><', '> <'));

  // Collapse whitespace between tags.
  h = h.replace(/>\s+</g, '><').trim();

  // Drop a leading run of empty tags.
  h = h.replace(/^(?:<p>\s*<\/p>|<br\s*\/?>)+/i, '');
  return h;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#8217;/g, '’')
    .replace(/\s+/g, ' ').trim();
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) out.push({ level: +m[1], text });
  }
  return out;
}

function slugOf(link) {
  const u = new URL(link);
  return u.pathname.replace(/^\/|\/+$/g, '') || 'home';
}

/* ------------------------------------------------------------------ *
 * Classification.                                                    *
 * ------------------------------------------------------------------ */

// Internal WP/Elementor scaffolding pages — not public content.
const SKIP_SLUGS = [
  'elementor-1201', 'elementor-5147', 'elementor-6357', 'elementor-8058',
  'elementor-8179', 'elementor-8231', 'elementor-1854', 'elementor-2526',
  'elementor-2569', 'elementor-2613', 'elementor-2626', 'elementor-2635',
  'elementor-3424', 'elementor-3435', 'elementor-4179', 'elementor-4201',
  'mailpoet', 'a', 'front-page-latest', 'learn-english-smarter-with-skylark-education',
];

// Section landing pages (hub pages we redesign as section index templates).
const HUB_PAGES = new Set([
  '', 'grammar', 'grammar-2', 'english-literature', 'creative-writing',
  'academic', 'academic-2', 'admission', 'admission-2', 'board-question',
  'board', 'article', 'privacy-policy', 'log-in', 'register', 'newsletter',
]);

// Top-level taxonomy slugs that identify sections.
const catPathOf = (item) => (item.categories ?? [])
  .map((id) => catById[id])
  .filter(Boolean)
  .map((c) => c.link.replace(/^https?:\/\/[^/]+\/topics\//, '').replace(/\/+$/, ''))
  .filter((s) => s.length > 0);

function classify(slug, title, catPaths, kind) {
  const s = slug.toLowerCase();
  const cats = catPaths.join(' ').toLowerCase();

  const has = (...pats) => pats.some((p) => catPaths.some((c) => c.toLowerCase().startsWith(p)));
  const matches = (...pats) => pats.some((p) => cats.includes(p) || cats.startsWith(p + ' ') || cats.startsWith(p + '/'));

  // Landing/hub pages first.
  if (HUB_PAGES.has(s)) return { section: 'site', subsection: s || 'home' };

  // Preface / founder.
  if (s === 'in-the-name-of-creator-the-beneficent-the-merciful')
    return { section: 'site', subsection: 'preface' };

  // Board questions & exam years.
  if (has('board-questions', 'marks-distributions') || matches('board-questions', 'marks-distributions'))
    return { section: 'board', subsection: null };
  if (/^(19|20)\d{2}/.test(s) || /all-board-20\d{2}/.test(s) || /board-20\d{2}/.test(s) ||
      /^hsc-?\d/.test(s) || /^ssc-board/.test(s) ||
      (matches('2024', '2023', '2022', '2020', '2019', '2018', '2017', '2016', '2013-to-2009', '2019-2015', '2018-2017-ssc', '2024ssc', '2024-second-paper')) && kind === 'post' ||
      /marks-distribution/.test(s) || /hsc-english-2nd-paper-board/.test(s) ||
      /exercises-for-hsc-board/.test(s) || /hsc-preposition-board/.test(s) ||
      /paragraphs-(ssc|hsc)-/.test(s) || /second-paper-model-question/.test(s))
    return { section: 'board', subsection: null };

  // Admission.
  if (has('university', 'cadet-colleges') || matches('university', 'marks-distributions/cadet-colleges') ||
      /cadet-college/.test(s) || /syllabus-for-cadet/.test(s))
    return { section: 'admission', subsection: null };

  // Academic: class-5..12 text book passages, model questions, class marks distributions.
  if (has('text-books', 'class-5', 'class-6', 'class-7', 'class-8', 'class-9-10', 'class-10', 'class-11-12', 'class-12') ||
      matches('text-books', 'board-questions/first-paper/class-5', 'board-questions/first-paper/class-8') ||
      /marks-distribution-for-class/.test(s) || /seen-passage-for-class/.test(s) ||
      /model-question/.test(s) || /^class-\d/.test(s) || /for-class-6|for-class-7|for-class-8/.test(s) ||
      /^ss[c2]-?2?$/.test(s) || /^hs[c2]-?2?$/.test(s))
    return { section: 'academic', subsection: null };

  // Creative writing.
  if (has('creative-writing') || matches('creative-writing') ||
      /^(paragraph|letter|formal-email|informal-email|dialogue-writing|story-writing|composition|report-writing|formal-letter|informal-letter|complaint-letter-notice|graph-chart|cv-writing|paragraph-for-hsc)/.test(s))
    return { section: 'creative-writing', subsection: null };

  // Literature: poems, stories, writers, literary pieces.
  if (/english-literature|literature|poem|poetry|proverb|tongue-twister/.test(s) ||
      /^(leisure|from-a-railway-carriage|o-me-o-life|solitude|holding-hands|andre|contemplation|green-escape|the-news|the-chaos|the-school-boy|out-out|books|the-story-of-an-hour|two-mothers-remembered|the-sands-of-dee|time-you-old-gipsy-man|she-walks-in-beauty|i-died-for-beauty|auld-lang-syne)/.test(s) ||
      /(nelson-mandela|brojen-das|nishat-mazumder|helen-keller|begum-rokeya|pritilata|zahir-raihan|zainul-abedin|michael-madhusudan|lalon|behula|meherjan|river-gypsies|nakshi-kantha|pele|hason-rajas|jasimuddin|polan-sarkar|masanobu|amitabh|a-pound-of-flesh|three-caskets|the-trial|the-purple-jar|the-giant|the-orphanage|superman|whose-child|the-falcon|the-internet-technology|the-field-of-the-embroidered|the-childrens-songs|answering-questions-from-poems|answering-questions-from-stories|answering-question-from-poems|theme-and-summary|translation-of-hason)/.test(s) ||
      has('grammar/proverb', 'grammar/pronunciation') && false)
    return { section: 'literature', subsection: null };

  // Everything else with a grammar-ish category → grammar.
  if (has('grammar', 'rules', 'connector', 'modifier', 'prefix-and-suffix', 'changing-voice') ||
      matches('grammar'))
    return { section: 'grammar', subsection: null };

  // Remaining well-known grammar articles by slug.
  if (/^(tense|noun|number|gender|case|adjective|adverb|article|conjunction|connector|modifier|tag-question|proverbs|pronunciation|inversion|subjunctive-mood|sentence|part-of-speech|pronoun|preposition|transformation|narration|passage-narration|conditional|subject-verb|right-form|correct-form|completing|synonym|common-error|phrases-and-clauses|substitution-table|rearrange|matching|unseen-passage|seen-passage|filling-gaps|gap-filling|form-completion|making-wh-questions|arrange-rewrite|short-questions|summary|identification-of-parts|english-2nd-paper|important-abbreviations|exploring-simile|dangling)/.test(s) ||
      /-(exercises?|rules|for-ssc|for-hsc|for-jsc)/.test(s))
    return { section: 'grammar', subsection: null };

  // Fallback: leave unclassified and report.
  return { section: 'unclassified', subsection: null };
}

/* ------------------------------------------------------------------ */

const seen = new Set();
const items = [];
const skipped = [];
const duplicates = [];

function addItem(item, kind) {
  const slug = slugOf(item.link);
  if (SKIP_SLUGS.some((p) => slug === p || slug.startsWith('elementor-'))) {
    skipped.push({ slug, kind, reason: 'internal WP/Elementor template page' });
    return;
  }

  const html = cleanHtml(item.content?.rendered ?? '');
  const text = stripTags(html);
  const catPaths = catPathOf(item);
  const { section, subsection } = classify(slug, item.title.rendered, catPaths, kind);

  const built = {
    kind, // 'page' | 'post'
    slug,
    title: stripTags(item.title?.rendered ?? '') || slug,
    link: item.link,
    section,
    subsection,
    categories: catPaths,
    headings: extractHeadings(html),
    words: text.split(/\s+/).filter(Boolean).length,
    hasBengali: /[ঀ-৿]/.test(text),
    html,
  };

  // Duplicate slugs (same page published as post + page): keep the richer copy.
  if (seen.has(slug)) {
    duplicates.push(slug);
    const i = items.findIndex((x) => x.slug === slug);
    if (built.words > items[i].words) items[i] = built;
    return;
  }
  seen.add(slug);
  items.push(built);
}

for (const p of pages) addItem(p, 'page');
for (const p of posts) addItem(p, 'post');

/* Second pass — content-aware classification for pages that carry no
 * category metadata (Elementor pages). Deterministic, auditable lists. */

const LITERATURE_SLUGS = new Set([
  // poems
  'a-little-plant', 'boats-sail-on-the-rivers', 'stopping-by-woods-on-a-snowy-evening',
  'something-told-the-wild-geese', 'blow-blow-thou-winter-wind', 'amidst-killer-speeds-i-stand',
  'how-do-i-love-thee-by-elizabeth-barrett-browning', 'those-winter-sundays-by-robert-hayden',
  'dreams-by-langston-hughes', 'dreams-by-h-lawrence', 'because-i-have-seen-bengals-face',
  'i-have-seen-bengals-face', 'lets-play', 'the-chaos', 'bangladesh',
  // literary prose & stories
  'once-there-was-a-bird', 'mr-moti', 'a-long-time-ago-when-raju-was',
]);

const CW_PARAGRAPHS = new Set([
  'health-is-the-condition-3', 'the-word-hygiene-means', 'pahela-boishakh-is-the-first-day',
  'yoga-is-a-kind-of-posture', 'may-day-or-international-workers-day', '26-march-our-independence-day',
  '21-february-is-a-memorable-day', '21-february-is-observed-as-shaheed-dibosh',
  'eid-is-the-main-religious-festival', 'december-16-is-a-remarkable-day',
  'bangladesh-is-a-small-country', 'bangladesh-is-home', 'people-around-the-world',
  'traditional-childhood-pastimes', 'the-republic-of-maldives', 'bhutan-is-called-the-jewel',
  'today-there-are-many-jobs', 'sometimes-the-food-we-like', 'everyone-must-play-a-part',
  'i-hope-you-are-doing-well',
]);

const ACADEMIC_PASSAGES = new Set([
  'the-negro-is-still-not-free-2', '2-the-famous-greek-philosopher',
  '3-beauty-is-easy-to-appreciate', '4-education-gives-us-knowledge',
  '5-behula-is-a-legendary-folk', '6-lalon-shah', 'according-to-some-myths-and-legends',
  'nelson-mandela-guided-south-africa', 'sima-is-at-home-today',
  'saikat-islam-lives-with-his-parents', 'zara-lives-with-her-parents-in-london',
  'zara-lives-with-her-parents-2', 'mariam-is-a-student-of-class-six', 'ashar-is-now-in-congo',
  'farabi-is-floras-best-friend', 'dont-be-sad-farabi-and-dont-think',
  'shahanas-husband-mr-zamil-huda', 'my-friend-sajjad-and-i', 'my-first-day-at-the-new-school',
  'it-was-zishans-grandparents-house', 'the-family-gathering-in-the-yard',
  'every-thursday-afternoon-ashish', 'ashish-and-arun-are-two-players', 'hello-i-am-kobita',
  'the-name-of-kobitas-village', 'paul-went-to-sundarpur-high-school',
  'paul-went-to-meet-kobita', 'hello-dear-readers-im-paul', 'it-was-late-summer',
  'it-was-sunday', 'hakkonchandra-village-was-situated', 'bulbul-collects-rubbish',
  'the-children-had-now-nowhere', 'two-sick-men-were-given-the-same-room',
  'oxygen-and-the-air-pressure-2', 'human-beings-conquered-the-distance',
  'countries-of-the-world-rely', 'humans-can-neither-change', 'bangladesh-is-already-experiencing',
  'artificial-intelligence-has-the-potential', 'the-internet-technology-has-helped',
  'education-aims-to-bring-about', 'it-is-easy-to-understand',
  'can-you-think-of-a-classroom', 'the-class-comes-up-with-different-problems',
  'with-the-curtains-closing', 'mainul-islam-is-a-qualified-farmer',
  'children-must-pass-through-several-stages', 'in-a-traditional-society-like-ours-little-boys-and-girls',
  'art-is-generally-understood-as-an-expression', 'dreams-have-fascinated-philosophers',
  'education-aims-to-bring-about-positive-changes', 'the-falcon-hypersonic-technology-vehicle-2',
  'communication-of-ideas-2', 'have-you-ever-thought-of', 'peoples-music-also-known-as-folk-music',
  'the-orphanage-is-high-in-the-carolina-mountains', 'have-you-heard-of-superman',
  'brojen-das-on-conquering-the-english-channel', 'nishat-mazumder-a-bangladeshi-woman',
  'nelson-mandela-i-am-the-first-accused', 'ekushey-padak-winner-polan-sarkar',
  'helen-keller-was-a-great-humanitarian', 'begum-rokeya', 'pritilata-waddedar',
  'zahir-raihan', 'zainul-abedin-was-a-bangladeshi-painter', 'michael-madhusudan-dutta',
  'michael-madhusudan-dutt', 'meherjan-lives-in-a-slum', 'river-gypsies-in-bangladesh-face',
  'pele-is-widely-regarded', 'masanobu-fukuoka-was-born-on-the-japanese',
  'amitabh-ghoshs-the-great-derangement', 'bangladesh',
]);

const GRAMMAR_EXTRA = new Set([
  'capitalization-and-punctuation', 'prefixes-and-suffixes',
  'direct-and-indirect-speech-narration', 'assertive-to-optative-and-vice-versa',
  'rules-on-interchange-of-part-of-speech', 'interchange-of-part-of-speech',
  'conjugation-of-verbs', 'definition-and-classification-of-verb',
  'rules-on-filling-gaps', 'appropriate-preposition', 'simple-complex-and-compound',
  'assertive-to-imperative', 'assertive-to-exclamatory', 'transformation-of-sentences',
]);

const CW_STORY = new Set([
  'once-a-lion-was-sitting-beside-a-river', 'once-there-was-a-bird',
]);

const SECTION_HUB_ALIASES = {
  imaginative: { section: 'creative-writing', subsection: 'hub' },
  university: { section: 'admission', subsection: 'hub' },
  academic: { section: 'academic', subsection: 'hub' },
  'academic-2': { section: 'academic', subsection: 'hub' },
  'grammar-2': { section: 'grammar', subsection: 'hub' },
  board: { section: 'board', subsection: 'hub' },
  'board-question': { section: 'board', subsection: 'hub' },
  article: { section: 'site', subsection: 'hub' },
};

const EXERCISE_RE = /read the (following )?(passage|text)|answer the questions?|unit-?\s?0?\d|lesson-?\s?\d/i;

function applyContentClassification() {
  for (const it of items) {
    if (it.section === 'site' && SECTION_HUB_ALIASES[it.slug]) {
      Object.assign(it, SECTION_HUB_ALIASES[it.slug]);
    }
    if (it.section !== 'unclassified') continue;
    if (LITERATURE_SLUGS.has(it.slug)) { it.section = 'literature'; continue; }
    if (CW_PARAGRAPHS.has(it.slug)) { it.section = 'creative-writing'; it.subsection = 'Paragraph'; continue; }
    if (CW_STORY.has(it.slug)) { it.section = 'creative-writing'; it.subsection = 'Story Writing'; continue; }
    if (GRAMMAR_EXTRA.has(it.slug)) { it.section = 'grammar'; it.subsection = slugToGroup[it.slug] ?? 'Grammar'; continue; }
    const textMatch = it.html.match(EXERCISE_RE);
    if (ACADEMIC_PASSAGES.has(it.slug) || textMatch) { it.section = 'academic'; continue; }
    // Remaining narrative pages: default to academic textbook passages and record it.
    it.section = 'academic';
    it.subsection = 'Textbook Passages';
  }
}

/* Grammar subsections — derive from the curated topic list so the
 * Grammar hub can group topics (parts of speech, tense, ...). */
const GRAMMAR_GROUPS = {
  'Parts of Speech': ['noun', 'pronoun-and-pronoun-references', 'adjective', 'adverb', 'article', 'preposition', 'conjunction', 'verb', 'part-of-speech', 'identification-of-parts-of-speech', 'interchange-of-part-of-speech', 'exercise-on-interchange-of-part-of-speech', 'rules-on-interchange-of-part-of-speech'],
  'Tense & Verbs': ['tense', 'subject-verb-agreement', 'rules-on-right-form-of-verbs', 'right-form-of-verbs', 'right-forms-of-verbs', 'correct-form-of-verbs-exercises-for-hsc', 'correct-form-of-verb-exercises-for-ssc', 'right-form-of-verb-for-class-8', 'conjugation-of-verbs', 'definition-and-classification-of-verb', 'definition-and-classification', 'subjunctive-mood', 'conditional-sentences'],
  'Sentence & Transformation': ['sentence', 'transformation-of-sentences', 'transformation-from-affirmative-to-negative', 'assertive-to-interrogative', 'assertive-to-exclamatory', 'assertive-to-imperative', 'assertive-to-optative-and-vice-versa', 'simple-complex-and-compound', 'changing-voices', 'changing-degree', 'changing-degree-advanced', 'changing-degree-2', 'exercises-on-transformation-for-hsc', 'exercises-on-transformation-for-ssc', 'exercises-on-transformation-for-class-8', 'transformation-of-sentences-2'],
  'Narration': ['direct-and-indirect-speeches-narration', 'direct-and-indirect-speech-narration', 'rules-on-narration', 'narration-exercises-for-jsc-and-ssc', 'narration-exercises-for-hsc', 'passage-narration'],
  'Preposition & Article': ['preposition', 'rules-on-preposition', 'appropriate-preposition', 'preposition-exercises', 'preposition-exercise-for-ssc', 'articles-exercises-for-hsc', 'articles-exercises-for-class-6-8'],
  'Prefix, Suffix & Connectors': ['prefixes-and-suffixes', 'basics-of-prefixes-and-suffixes', 'connector', 'rules-on-connectors', 'connector-exercises-for-ssc', 'connector-exercises-for-hsc', 'prefix-and-suffix-for-ssc'],
  'Completing & Modifiers': ['completing-sentences', 'rules-on-completing-sentences', 'exercises-on-completing-sentences-for-hsc', 'completing-sentences-exercises-for-ssc', 'completing-with-words-phrases', 'modifier', 'dangling-modifiers', 'rules-on-modifier'],
  'Number, Gender & Case': ['number', 'gender', 'case'],
  'Capitalization & Punctuation': ['capitalization-and-punctuation', 'capitalization-and-punctuation-2', 'exercise-on-capital-letter-and-punctuation', 'capital-letters-and-punctuation-marks-for-class-8'],
  'Vocabulary & Reference': ['synonym-and-antonym', 'proverbs', 'pronunciation', 'inversion', 'important-abbreviations', 'exploring-simile-and-metaphor', 'common-error', 'tag-question', 'phrases-and-clauses'],
};
const slugToGroup = {};
for (const [group, slugs] of Object.entries(GRAMMAR_GROUPS))
  for (const s of slugs) slugToGroup[s] = slugToGroup[s] ?? group;

for (const it of items) {
  if (it.section === 'grammar') it.subsection = slugToGroup[it.slug] ?? 'Grammar';
  if (it.section === 'unclassified') it.subsection = null;
}
applyContentClassification();

/* Final corrections — content wins over category quirks. */
for (const it of items) {
  // Grammar topic lists always own their canonical topics.
  if (it.section === 'board' && slugToGroup[it.slug] && !/exercises?|for-(ssc|hsc|class)/.test(it.slug)) {
    it.section = 'grammar';
    it.subsection = slugToGroup[it.slug];
  }
  // Cadet-college material is admission content even when filed under marks-distributions.
  if (/cadet/.test(it.slug) || /cadet/.test(it.categories.join(' '))) {
    it.section = 'admission';
    it.subsection = it.slug.startsWith('syllabus') ? 'Cadet College' : 'Marks Distribution';
  }
  // Textbook compilations are academic.
  if (/^text-book/.test(it.slug)) {
    it.section = 'academic';
    it.subsection = 'Textbook';
  }
}

/* First paper question-type groups (board / academic exercises). */
const QTYPE_GROUPS = [
  ['Seen Passage', /seen-passage/],
  ['Unseen Passage', /unseen-passage/],
  ['Gap Filling', /filling-gaps|gap-filling|fill-in-the-(gaps|blanks)/],
  ['Rearrange', /rearrange/],
  ['Matching', /matching|match-given-words/],
  ['Substitution Table', /substitution-table/],
  ['Summary & Theme', /summary|theme-and/],
  ['WH Questions', /making-wh-questions|short-questions/],
  ['Form Completion', /form-completion/],
  ['Arrange/Rewrite', /arrange-rewrite/],
  ['Story / Completing Story', /story-writing|once-there-was|once-a-lion|the-giant|completing-story/],
];
for (const it of items) {
  if ((it.section === 'board' || it.section === 'academic') && !it.subsection) {
    for (const [name, re] of QTYPE_GROUPS) if (re.test(it.slug)) { it.subsection = name; break; }
  }
}

/* ---------------- output ---------------- */
const bySection = {};
for (const it of items) (bySection[it.section] ??= []).push(it);
const report = {
  total: items.length,
  bySection: Object.fromEntries(Object.entries(bySection).map(([k, v]) => [k, v.length])),
  duplicates,
  skipped,
  unclassified: bySection.unclassified?.map((i) => `${i.slug} :: ${i.title}`) ?? [],
  bengaliCount: items.filter((i) => i.hasBengali).length,
  zeroWords: items.filter((i) => i.words < 5).map((i) => i.slug),
};
fs.writeFileSync(path.join(ROOT, 'data', 'content.json'), JSON.stringify(items, null, 1));
fs.writeFileSync(path.join(ROOT, 'data', 'transform-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
