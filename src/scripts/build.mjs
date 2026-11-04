#!/usr/bin/env node
/** build.mjs — generate the static Skylark Education site into site/.
 *  Input : data/content.json (produced by scripts/transform.mjs)
 *  Output: site/**.html, assets/search-index.json, copied css/js/img
 *
 *  Honesty rules: content renders verbatim; no fabricated data anywhere.
 *  Demo forms disclose their demo nature. Broken/unavailable targets link
 *  to the original site rather than being invented. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
/** Base path for hosting under a sub-path (e.g. GitHub Pages project sites).
 *  Build with `BASE_PATH=/repo-name/ node scripts/build.mjs`. */
const BASE = process.env.BASE_PATH || '/';
const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'content.json'), 'utf8'));
const bySlug = new Map(items.map((i) => [i.slug, i]));

const CONTACT = {
  name: 'Skylark Education',
  address: '45 Navy Market, Mirpur 14, Dhaka 1206',
  phones: ['+8801521441859', '+8801710730506'],
  emails: ['tuhin0011@gmail.com', 'artuhin104@gmail.com'],
};

/* ------------------------------------------------------------ routing */
// Items replaced by purpose-built pages (hubs/static). Not emitted as articles.
const HUB_SLUGS = new Set(['grammar', 'grammar-2', 'academic', 'academic-2', 'board',
  'board-question', 'english-literature', 'creative-writing', 'imaginative', 'admission', 'admission-2']);

const SPECIAL_ROUTE = {
  home: 'about/index.html',
  university: 'admission/university/index.html',
  'log-in': 'account/log-in/index.html',
  register: 'account/register/index.html',
};

const routeOf = (it) => SPECIAL_ROUTE[it.slug] ?? `${it.slug}/index.html`;
const hrefOf = (it) => ('/' + routeOf(it)).replace(/\/index\.html$/, '/');

/* ------------------------------------------------------- group config */
const GRAMMAR_GROUPS = [
  ['Parts of Speech', 'parts-of-speech', ['noun', 'pronoun-and-pronoun-references', 'adjective', 'adverb', 'article', 'preposition', 'conjunction', 'part-of-speech', 'identification-of-parts-of-speech', 'interchange-of-part-of-speech', 'rules-on-interchange-of-part-of-speech', 'exercise-on-interchange-of-part-of-speech', 'verb', 'definition-and-classification-of-verb', 'conjugation-of-verbs', 'definition-and-classification']],
  ['Tense & Verbs', 'tense-verbs', ['tense', 'subject-verb-agreement', 'rules-on-right-form-of-verbs', 'right-form-of-verbs', 'right-forms-of-verbs', 'right-form-of-verb-for-class-8', 'correct-form-of-verbs-exercises-for-hsc', 'correct-form-of-verb-exercises-for-ssc', 'subjunctive-mood', 'conditional-sentences']],
  ['Sentence & Transformation', 'sentence-transformation', ['sentence', 'transformation-of-sentences', 'transformation-of-sentences-2', 'transformation-from-affirmative-to-negative', 'assertive-to-interrogative', 'assertive-to-exclamatory', 'assertive-to-imperative', 'assertive-to-optative-and-vice-versa', 'simple-complex-and-compound', 'changing-voices', 'changing-degree', 'changing-degree-advanced', 'changing-degree-2', 'exercises-on-transformation-for-hsc', 'exercises-on-transformation-for-ssc', 'exercises-on-transformation-for-class-8']],
  ['Narration', 'narration', ['direct-and-indirect-speech-narration', 'rules-on-narration', 'narration-exercises-for-jsc-and-ssc', 'narration-exercises-for-hsc', 'passage-narration', 'direct-and-indirect-speeches-narration']],
  ['Preposition & Article', 'preposition-article', ['preposition', 'rules-on-preposition', 'appropriate-preposition', 'preposition-exercises', 'preposition-exercise-for-ssc', 'exercises-on-preposition-for-hsc', 'article', 'articles-exercises-for-hsc', 'articles-exercises-for-class-6-8']],
  ['Prefix, Suffix & Connectors', 'prefix-suffix-connectors', ['prefixes-and-suffixes', 'basics-of-prefixes-and-suffixes', 'connector', 'rules-on-connectors', 'connector-exercises-for-ssc', 'connector-exercises-for-hsc', 'prefix-and-suffix-for-ssc', 'exercises-on-suffix-and-prefix-for-jsc', 'exercises-on-suffix-and-prefix-for-ssc', 'complete-the-text-adding-suffixes-prefixes-or-the-both-with-the-underlined-root-words-given-in-the-text', 'complete-the-text-adding-suffixes-prefixes-or-the-both-with-the-underlined-root-words-given-in-the-text-2']],
  ['Completing Sentences & Modifiers', 'completing-modifiers', ['completing-sentences', 'rules-on-completing-sentences', 'exercises-on-completing-sentences-for-hsc', 'completing-sentences-exercises-for-ssc', 'completing-with-words-phrases', 'modifier', 'rules-on-modifier', 'dangling-modifiers']],
  ['Number, Gender & Case', 'number-gender-case', ['number', 'gender', 'case']],
  ['Capitalization & Punctuation', 'capitalization-punctuation', ['capitalization-and-punctuation', 'capitalization-and-punctuation-2', 'exercise-on-capital-letter-and-punctuation', 'capital-letters-and-punctuation-marks-for-class-8']],
  ['Vocabulary & Reference', 'vocabulary-reference', ['synonym-and-antonym', 'proverbs', 'pronunciation', 'inversion', 'tag-question', 'phrases-and-clauses', 'important-abbreviations', 'exploring-simile-and-metaphor', 'common-error']],
];

const LIT_POEMS = new Set(['a-little-plant', 'boats-sail-on-the-rivers', 'stopping-by-woods-on-a-snowy-evening', 'something-told-the-wild-geese', 'blow-blow-thou-winter-wind', 'amidst-killer-speeds-i-stand', 'how-do-i-love-thee-by-elizabeth-barrett-browning', 'those-winter-sundays-by-robert-hayden', 'dreams-by-langston-hughes', 'dreams-by-h-lawrence', 'because-i-have-seen-bengals-face', 'i-have-seen-bengals-face', 'lets-play', 'the-chaos', 'bangladesh', 'leisure', 'from-a-railway-carriage', 'o-me-o-life', 'solitude', 'holding-hands', 'the-school-boy', 'out-out', 'she-walks-in-beauty-like-the-night', 'i-died-for-beauty', 'auld-lang-syne', 'time-you-old-gipsy-man', 'two-mothers-remembered', 'the-sands-of-dee', 'whose-child-is-this']);
const LIT_PROSE = new Set(['once-there-was-a-bird', 'mr-moti', 'the-story-of-an-hour', 'a-pound-of-flesh', 'the-three-caskets', 'the-trial', 'the-purple-jar-part-1', 'the-purple-jar-part-2', 'the-purple-jar-part-3', 'andre', 'contemplation', 'green-escape', 'the-news', 'books', 'the-orphanage-is-high-in-the-carolina-mountains', 'have-you-heard-of-superman', 'amitabh-ghoshs-the-great-derangement', 'sharing-the-earth-is-a-collection', 'answering-questions-from-stories']);
const LIT_TERMS = new Set(['tongue-twister', 'answering-questions-from-poems', 'answering-questions-from-poems-for-class-7', 'answering-questions-from-poems-for-class-8', 'answering-questions-from-poems-for-ssc', 'answering-question-from-poems-for-class-7', 'theme-and-summary-of-the-poems', 'proverbs', 'pronunciation']);

const CW_GROUPS = [
  ['Paragraph Writing', 'paragraph', 'paragraph', /^paragraph|paragraph-for-hsc$|for-hsc-only/],
  ['Letters & Emails', 'letters-emails', null, /^(formal-letter|informal-letter|formal-email|informal-email|letter)$/],
  ['Composition & Story', 'composition-story', null, /^(composition|composition-2|story-writing|dialogue-writing)$/],
  ['Reports & CV', 'reports-cv', null, /^(report-writing|cv-writing)$/],
  ['Graph & Chart Writing', 'graph-chart', null, /^graph-chart$/],
  ['Notices & Complaints', 'notices', null, /^complaint-letter-notice$/],
];

const ACADEMIC_CLASSES = [
  ['Class 5', 'class-5', /class-5|text-book-5|saikat-islam|form-completion|making-wh|arrange-rewrite|short-questions|match-given-words/],
  ['Class 6', 'class-6', /class-6|marks-distribution-for-class-6|seen-passage-for-classs-6|synonym-and-antonym-for-class-6|mariam-is-a-student|gap-filling-textual-for-class-6|my-friend-sajjad/],
  ['Class 7', 'class-7', /class-7|marks-distribution-for-class-7|answering-question-from-poems-for-class-7|30-sets-of-model-question-for-class-7|a-long-time-ago-when-raju-was|zara-lives/],
  ['Class 8', 'class-8', /class-8|marks-distribution-for-class-8|text-book-8|seen-passage-for-class-8|right-form-of-verb-for-class-8|capital-letters-and-punctuation-marks-for-class-8|second-paper-model-question-for-class-8|answering-questions-from-poems-for-class-8|mr-moti/],
  ['Class 9–10 (SSC)', 'class-9-10', /class-9-10|text-book-9-10|substitution-table|river-gypsies/],
  ['Class 11–12 (HSC)', 'class-11-12', /class-11-12|text-book-11-12|once-there-was-a-bird|the-negro-is-still-not-free|hsc-2|communication-of-ideas|the-falcon|the-purple-jar|o-me-o-life|andre/],
];

const decodeEntities = (s) => s
  .replace(/&amp;/gi, '&').replace(/&#0?38;/g, '&').replace(/&AMP;/g, '&')
  .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&nbsp;/gi, ' ').replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
  .replace(/&#8217;|&rsquo;/gi, '’').replace(/&#8216;|&lsquo;/gi, '‘')
  .replace(/&#8220;|&ldquo;/gi, '“').replace(/&#8221;|&rdquo;/gi, '”')
  .replace(/&#8230;|&hellip;/gi, '…');
const textOf = (it) => decodeEntities(it.html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
const snippetOf = (it, n = 160) => { const t = textOf(it); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t; };

/* ------------------------------------------------------ derived groups */
function listBy(slugs) {
  return slugs.map((s) => bySlug.get(s)).filter(Boolean).filter((i) => !HUB_SLUGS.has(i.slug));
}

const grammar = GRAMMAR_GROUPS.map(([title, id, slugs]) => ({ title, id, items: listBy(slugs) }));
const grammarAssigned = new Set(grammar.flatMap((g) => g.items.map((i) => i.slug)));

const litGroups = [
  { title: 'Poems', id: 'poems', blurb: 'Poems from the syllabus — text, theme, and questions.', items: items.filter((i) => i.section === 'literature' && LIT_POEMS.has(i.slug) && !HUB_SLUGS.has(i.slug)) },
  { title: 'Prose & Stories', id: 'prose-stories', blurb: 'Literary prose, drama excerpts and short stories.', items: items.filter((i) => i.section === 'literature' && LIT_PROSE.has(i.slug) && !HUB_SLUGS.has(i.slug)) },
  { title: 'Passages & Biographies', id: 'passages', blurb: 'Reading passages about writers, leaders and lives.', items: items.filter((i) => i.section === 'literature' && !LIT_POEMS.has(i.slug) && !LIT_PROSE.has(i.slug) && !LIT_TERMS.has(i.slug) && !HUB_SLUGS.has(i.slug)) },
  { title: 'Literary Terms & Guides', id: 'literary-terms', blurb: 'Terminology, pronunciation and study guides.', items: items.filter((i) => i.section === 'literature' && LIT_TERMS.has(i.slug) && !HUB_SLUGS.has(i.slug)) },
];
const litAssigned = new Set(litGroups.flatMap((g) => g.items.map((i) => i.slug)));

const cwGroups = CW_GROUPS.map(([title, id, single, re]) => ({
  title, id,
  items: items.filter((i) => i.section === 'creative-writing' && re.test(i.slug) && !HUB_SLUGS.has(i.slug)),
}));
const cwAssigned = new Set(cwGroups.flatMap((g) => g.items.map((i) => i.slug)));

const acadClasses = ACADEMIC_CLASSES.map(([title, id, re]) => ({
  title, id,
  items: items.filter((i) => i.section === 'academic' && (re.test(i.slug) || i.categories.some((c) => c.includes(id) || (id === 'class-9-10' && c.includes('class-10')))) && !HUB_SLUGS.has(i.slug)),
}));
const acadAssigned = new Set(acadClasses.flatMap((g) => g.items.map((i) => i.slug)));

const acadOther = {
  title: 'Passages & Exercises', id: 'exercises',
  blurb: 'Seen passages, gap filling, matching and rearrange practice.',
  items: items.filter((i) => i.section === 'academic' && !acadAssigned.has(i.slug) && !HUB_SLUGS.has(i.slug)),
};

/* Board matrix metadata */
function boardMeta(it) {
  const hay = `${it.slug} ${it.title}`.toLowerCase();
  const yearM = hay.match(/(20\d\d)/);
  const years = [];
  if (yearM) {
    const y = +yearM[1];
    const range = hay.match(/(20\d\d)-(20\d\d)/);
    if (range) for (let v = +range[1]; v <= +range[2]; v++) years.push(String(v));
    else years.push(String(y));
  }
  const level = /hsc|alim/.test(hay) ? 'hsc' : /(^|[^a-z])ssc|dakhil/.test(hay) ? 'ssc' : /class-\d/.test(hay) ? 'class' : 'general';
  const paper = /2nd|second-paper|second paper/.test(hay) ? '2' : /1st|first-paper|first paper/.test(hay) ? '1' : '';
  const type = /marks-distribution/.test(hay) ? 'marks' : /model/.test(hay) ? 'model' : /solution/.test(hay) ? 'solution' : /paragraph/.test(hay) ? 'prep' : /all-board|(^|[^0-9])(19|20)\d\d/.test(hay) ? 'questions' : 'prep';
  return { years, level, paper, type };
}
const boardItems = items.filter((i) => i.section === 'board' && !HUB_SLUGS.has(i.slug));
const admissionItems = items.filter((i) => i.section === 'admission' && !HUB_SLUGS.has(i.slug));

/* ------------------------------------------------------------- nav */
function countItems(list) { return list.length ? `<span class="mega-count">${list.length}</span>` : ''; }

const NAV = [
  { label: 'Home', root: null, href: '/' },
  { label: 'Grammar', root: 'grammar', href: '/grammar/', mega: grammar.map((g) => ({ title: g.title, href: `/grammar/${g.id}/`, count: g.items.length, links: g.items.slice(0, 6).map((i) => ({ label: i.title, href: hrefOf(i) })) })) },
  { label: 'Literature', root: 'literature', href: '/english-literature/', mega: litGroups.map((g) => ({ title: g.title, href: `/english-literature/#${g.id}`, count: g.items.length, links: g.items.slice(0, 6).map((i) => ({ label: i.title, href: hrefOf(i) })) })) },
  { label: 'Academic', root: 'academic', href: '/academic/', mega: [...acadClasses, acadOther].map((g) => ({ title: g.title, links: g.items.slice(0, 8).map((i) => ({ label: i.title, href: hrefOf(i) })) })) },
  { label: 'Writing', root: 'creative-writing', href: '/creative-writing/', mega: cwGroups.map((g) => ({ title: g.title, links: g.items.slice(0, 6).map((i) => ({ label: i.title, href: hrefOf(i) })) })) },
  {
    label: 'Board Questions', root: 'board', href: '/board-question/',
    mega: [
      { title: 'SSC', links: [{ label: 'SSC Board Questions', href: '/board-question/ssc/' }, { label: 'Marks Distribution SSC 2026', href: hrefOf(bySlug.get('marks-distribution-for-ssc-2026')) }, { label: 'Marks Distribution SSC 2025', href: hrefOf(bySlug.get('marks-distribution-for-ssc-2025')) }, { label: 'Paragraphs for SSC 2025', href: hrefOf(bySlug.get('paragraphs-ssc-dakhil-2025')) }] },
      { title: 'HSC', links: [{ label: 'HSC Board Questions', href: '/board-question/hsc/' }, { label: 'Marks Distribution HSC 2026', href: hrefOf(bySlug.get('marks-distribution-for-hsc-2026')) }, { label: 'Marks Distribution HSC 2025', href: hrefOf(bySlug.get('marks-distribution-for-hsc-2025')) }, { label: 'Paragraphs for HSC 2026', href: hrefOf(bySlug.get('paragraphs-hsc-alim-2026')) }] },
      { title: 'Resources', links: [{ label: 'All Board 2025', href: hrefOf(bySlug.get('all-board-2025')) }, { label: 'All Board 2026', href: hrefOf(bySlug.get('all-board-2026')) }, { label: 'HSC 2nd Paper Board Questions', href: hrefOf(bySlug.get('hsc-english-2nd-paper-board-question')) }, { label: 'Class 6–8 Marks Distributions', href: '/board-question/marks-distribution/' }] },
    ],
  },
  { label: 'Admission', root: 'admission', href: '/admission/' },
  { label: 'Contact', root: null, href: '/contact/' },
];

const QUICK = {
  learn: [
    { label: 'Grammar Topics', href: '/grammar/' },
    { label: 'English Literature', href: '/english-literature/' },
    { label: 'Creative Writing', href: '/creative-writing/' },
    { label: 'Academic Resources', href: '/academic/' },
    { label: 'Admission', href: '/admission/' },
  ],
  exams: [
    { label: 'Board Question Hub', href: '/board-question/' },
    { label: 'SSC Board Questions', href: '/board-question/ssc/' },
    { label: 'HSC Board Questions', href: '/board-question/hsc/' },
    { label: 'Marks Distributions', href: '/board-question/marks-distribution/' },
  ],
  institute: [
    { label: 'About & Preface', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Privacy Policy', href: '/privacy-policy/' },
    { label: 'Search', href: '/search/' },
  ],
};

/* -------------------------------------------------- content rewriting */
const LOCAL_IMGS = new Set(fs.readdirSync(path.join(ROOT, 'assets/img/content')));
const ORIGIN = 'https://skylarkeducation.com';

function rewriteLinks(html) {
  // Internal links → local routes when they exist; else keep original URL.
  html = html.replace(/href="https?:\/\/skylarkeducation\.com\/([^"]*?)\/?"/gi, (m, p) => {
    const slug = p.replace(/\/+$/, '');
    if (!slug) return m;
    const target = bySlug.get(slug);
    if (target && !HUB_SLUGS.has(slug)) return `href="${hrefOf(target)}"`;
    if (SPECIAL_ROUTE[slug]) return `href="/${SPECIAL_ROUTE[slug]}"`;
    const hubRoute = { grammar: '/grammar/', 'english-literature': '/english-literature/', 'creative-writing': '/creative-writing/', academic: '/academic/', admission: '/admission/', 'board-question': '/board-question/', board: '/board-question/', imaginative: '/creative-writing/', university: '/admission/university/' }[slug];
    if (hubRoute) return `href="${hubRoute}"`;
    return m; // unknown → original site (valid external destination)
  });
  // Local images.
  html = html.replace(/src="(https?:\/\/[^"]+\/([^\/?"]+)(?:\?[^"]*)?)"/gi, (m, url, file) => {
    if (/pixel\.wp\.com/.test(url)) return 'src="" style="display:none" alt=""';
    const base = decodeURIComponent(file);
    if (LOCAL_IMGS.has(base)) return `src="/assets/img/content/${base}"`;
    return m;
  });
  // PDF embed objects → honest download links to the original site.
  html = html.replace(/<object[^>]*data="(https?:\/\/[^"]+\.pdf)"[^>]*>[\s\S]*?<\/object>/gi,
    (m, url) => `<p class="notice"><strong>Textbook PDF:</strong> This textbook is available as a PDF on the original Skylark Education site — <a href="${url}" rel="noopener">open the textbook PDF</a>.</p>`);
  html = html.replace(/href="(https?:\/\/skylarkeducation\.com\/wp-content\/uploads\/[^"]+\.pdf)"/gi, (m, url) => `href="${url}" rel="noopener"`);
  // Relative content links (Elementor emits them without origin): resolve locally
  // when the target exists; otherwise point to the original site.
  const HUB_REL = { grammar: '/grammar/', 'english-literature': '/english-literature/', 'creative-writing': '/creative-writing/', academic: '/academic/', admission: '/admission/', 'board-question': '/board-question/', board: '/board-question/', imaginative: '/creative-writing/', university: '/admission/university/' };
  html = html.replace(/href="(?!https?:|#|\/|mailto:|tel:)([^"]+)"/gi, (m, p) => {
    const clean = p.replace(/[?#].*$/, '').replace(/\/+$/, '');
    const target = bySlug.get(clean);
    if (target && !HUB_SLUGS.has(clean)) return `href="${hrefOf(target)}"`;
    if (SPECIAL_ROUTE[clean]) return `href="/${SPECIAL_ROUTE[clean]}"`;
    if (HUB_REL[clean]) return `href="${HUB_REL[clean]}${p.includes('#') ? '#' + p.split('#')[1] : ''}"`;
    // Skipped internal template pages / uploads → original site (valid destination).
    return `href="https://skylarkeducation.com/${p}"`;
  });
  // Strip stray empty anchors left by cleaning.
  html = html.replace(/<a[^>]*>\s*<\/a>/gi, '');
  return html;
}

function injectTocIds(html, headings) {
  let idx = 0;
  return html.replace(/<h([2-4])\b([^>]*)>/gi, (m, lvl, attrs) => {
    const h = headings[idx++];
    if (!h) return m;
    return `<h${lvl} id="h-${idx - 1}"${attrs}>`;
  });
}

/* --------------------------------------------------------- generators */
function shell(o) {
  return T.layout({ rootPrefix: BASE, nav: NAV, quickLinks: QUICK, contact: CONTACT, ...o });
}

function writePage(route, html) {
  if (BASE !== '/') {
    html = html
      .replaceAll('href="/"', `href="${BASE}"`)
      .replaceAll('href="/', `href="${BASE}`)
      .replaceAll('src="/', `src="${BASE}`)
      .replaceAll('name="site-root" content="/"', `name="site-root" content="${BASE}"`);
  }
  const file = path.join(SITE, route);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function trailOf(crumbRoot, ...rest) {
  return [{ label: 'Home', href: '/' }, ...(crumbRoot ? [{ label: crumbRoot.label, href: crumbRoot.href }] : []), ...rest];
}

/* -- article pages ---------------------------------------------------- */
const stripTagsB = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function extractHeadingsB(html) {
  const out = [];
  for (const m of html.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = stripTagsB(m[2]);
    if (text) out.push({ level: +m[1], text });
  }
  return out;
}

function article(it, { crumb, kicker, groupList, sectionLabel }) {
  let body = rewriteLinks(it.html);
  // The page template already renders the title as h1 — drop a duplicated
  // leading h1 and demote any remaining h1s to h2 for heading hierarchy.
  body = body.replace(/^<h1\b[^>]*>([\s\S]*?)<\/h1>/i, (m, inner) => {
    const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    return norm(inner) === norm(it.title) ? '' : `<h2>${inner}</h2>`;
  });
  body = body.replace(/<h1\b([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
  const headings = extractHeadingsB(body);
  const toc = headings.length >= 3 ? headings : null;
  // Responsive tables: wrap every bare table in a scroll container.
  let html = injectTocIds(body, toc ?? []);
  html = html.replace(/<table\b/g, '<div class="table-wrap"><table')
             .replace(/<\/table>/g, '</table></div>');
  let prev = null, next = null;
  if (groupList) {
    const idx = groupList.findIndex((x) => x.slug === it.slug);
    if (idx >= 0) {
      prev = idx > 0 ? { href: hrefOf(groupList[idx - 1]), label: groupList[idx - 1].title } : null;
      next = idx < groupList.length - 1 ? { href: hrefOf(groupList[idx + 1]), label: groupList[idx + 1].title } : null;
    }
  }
  const flat = [...grammar.flatMap((g) => g.items), ...litGroups.flatMap((g) => g.items), ...cwGroups.flatMap((g) => g.items), ...acadClasses.flatMap((g) => g.items)];
  const pool = groupList ?? flat;
  const self = pool.findIndex((x) => x.slug === it.slug);
  const related = (self >= 0 ? pool.filter((_, k) => k !== self) : pool)
    .slice(self >= 0 ? self : 0).concat(pool).slice(0, 12)
    .filter((x, k, arr) => x.slug !== it.slug && arr.findIndex((y) => y.slug === x.slug) === k)
    .slice(0, 3)
    .map((x) => ({ href: hrefOf(x), label: x.title, sectionLabel: x.section }));
  writePage(routeOf(it), shell({
    title: `${it.title} — Skylark Education`,
    description: snippetOf(it),
    section: it.section === 'site' ? 'site' : it.section,
    pageType: 'article',
    activeRoot: crumb?.root,
    body: T.articlePage({
      trail: trailOf(crumb ? { label: crumb.label, href: crumb.href } : null, { label: it.title, href: hrefOf(it) }),
      kicker: kicker ?? sectionLabel,
      title: it.title,
      tags: it.subsection ? [it.subsection] : [],
      html,
      toc,
      prev, next, related,
    }),
  }));
}

/* -- hub pages --------------------------------------------------------- */
function hubGroupLinks(list) {
  return list.map((i) => ({ href: hrefOf(i), label: i.title, meta: snippetOf(i, 90) }));
}

const HUBS = [
  {
    route: 'grammar/index.html', activeRoot: 'grammar', section: 'grammar',
    kicker: 'Grammar', title: 'English Grammar, rule by rule',
    lead: 'Every major grammar topic with clear rules and a wealth of worked examples — plus exercises for SSC, HSC and junior classes.',
    groups: grammar.map((g) => ({ ...g, kicker: 'Topic group', links: hubGroupLinks(g.items) })),
  },
  {
    route: 'english-literature/index.html', activeRoot: 'literature', section: 'literature',
    kicker: 'Literature', title: 'English Literature',
    lead: 'Poems, prose and stories from the syllabus — with themes, summaries and question practice.',
    groups: litGroups.map((g) => ({ ...g, kicker: 'Collection', links: hubGroupLinks(g.items) })),
  },
  {
    route: 'creative-writing/index.html', activeRoot: 'creative-writing', section: 'creative-writing',
    kicker: 'Creative Writing', title: 'Imaginative & Creative Writing',
    lead: 'Model paragraphs, letters, emails, compositions, stories, reports, CVs and graph descriptions.',
    groups: cwGroups.map((g) => ({ ...g, kicker: 'Skill', links: hubGroupLinks(g.items) })),
  },
  {
    route: 'academic/index.html', activeRoot: 'academic', section: 'academic',
    kicker: 'Academic', title: 'Academic Resources',
    lead: 'Class-wise English resources — textbook passages, seen passages, exercises and marks distributions for Class 5 through HSC.',
    groups: [...acadClasses.map((g) => ({ ...g, kicker: 'Class', links: hubGroupLinks(g.items) })), { ...acadOther, kicker: 'Practice', links: hubGroupLinks(acadOther.items.slice(0, 60)) }],
  },
  {
    route: 'admission/index.html', activeRoot: 'admission', section: 'admission',
    kicker: 'Admission', title: 'Admission Resources',
    lead: 'Preparation material for cadet college and university admission tests.',
    groups: [
      { title: 'Cadet College Admission', id: 'cadet-college', kicker: 'Cadet Colleges', links: hubGroupLinks(admissionItems.filter((i) => /cadet/.test(i.slug))) },
      { title: 'University Admission', id: 'university', kicker: 'University', links: hubGroupLinks(admissionItems.filter((i) => !/cadet/.test(i.slug))) },
    ],
  },
];

function renderHub(h, crumbLabel) {
  const groups = h.groups.filter((g) => g.links.length);
  writePage(h.route, shell({
    title: `${h.title} — Skylark Education`,
    description: h.lead,
    section: h.section, pageType: 'hub', activeRoot: h.activeRoot,
    body: T.hubPage({
      trail: trailOf(null, { label: h.title, href: '/' + h.route }),
      kicker: h.kicker, title: h.title, lead: h.lead,
      jump: groups.map((g) => ({ id: g.id, label: g.title })),
      groups,
    }),
  }));
}

/* Board sub-hubs: SSC / HSC / marks distribution */
function boardSubHub(route, title, kicker, lead, filter) {
  const list = boardItems.filter(filter);
  const years = [...new Set(list.flatMap((i) => boardMeta(i).years))].sort().reverse();
  const yearChips = years.map((y) => `<button class="chip" type="button" data-filter="year-${y}">${y}</button>`).join('');
  const cards = list.map((i) => {
    const m = boardMeta(i);
    const tags = [m.level !== 'general' ? m.level.toUpperCase() : '', m.paper ? `${m.paper === '1' ? '1st' : '2nd'} Paper` : '', ...m.years.slice(0, 1).map((y) => y)].filter(Boolean).join(' · ');
    return `<a class="card" href="${hrefOf(i)}" data-item data-year="${m.years.join(' ')}" data-level="${m.level}" data-paper="${m.paper || 'any'}" data-type="${m.type}">
      <h3 class="card-title">${T.esc(i.title)}</h3>
      <p class="card-meta">${T.esc(tags)}</p></a>`;
  }).join('');
  writePage(route, shell({
    title: `${title} — Skylark Education`, description: lead,
    section: 'board', pageType: 'hub', activeRoot: 'board',
    body: `<div class="container hub">
  ${T.breadcrumb(trailOf({ label: 'Board Questions', href: '/board-question/' }, { label: title, href: '/' + route }))}
  <header class="hub-head reveal"><p class="kicker">${T.esc(kicker)}</p><h1>${T.esc(title)}</h1><p class="hub-lead">${T.esc(lead)}</p></header>
  <div data-matrix>
  ${yearChips ? `<div class="hub-jump"><button class="chip is-active" type="button" data-filter="year-all">All years</button>${yearChips}</div>` : ''}
  <div class="grid-3">${cards}</div>
  <p class="matrix-empty" hidden>No questions match this year yet — try another year.</p>
  </div>
</div>`,
  }));
}

/* ------------------------------------------------------------- HOME */
function homePage() {
  const counts = {
    resources: items.filter((i) => !HUB_SLUGS.has(i.slug)).length,
    grammar: grammar.reduce((n, g) => n + g.items.length, 0),
    literature: items.filter((i) => i.section === 'literature').length,
  };
  const icon = (d, color) => `<span class="icon-bubble" style="--ic:${color}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg></span>`;
  const P = (d) => `<path d="${d}"/>`;

  const quickCards = [
    { t: 'Grammar', d: 'Easy grammar rules with examples', href: '/grammar/', ic: P('M12 6.25c-2.5-2-6-2-9-1v13c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-13c-3-1-6.5-1-9 1zm0 0v13'), c: '#1d59e0' },
    { t: 'Literature', d: 'Poems, stories and literary analysis', href: '/english-literature/', ic: P('M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5'), c: '#7b5ea7' },
    { t: 'Academic', d: 'School & college English support', href: '/academic/', ic: P('M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5'), c: '#2f7d4f' },
    { t: 'Board Questions', d: 'SSC & HSC board preparation', href: '/board-question/', ic: P('M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6M9 13l2 2 4-4'), c: '#e8871e' },
  ].map((c) => `
      <a class="quick-card reveal" href="${c.href}">
        ${icon(c.ic, c.c)}
        <span class="qc-body"><strong>${c.t}</strong><span>${c.d}</span><em class="qc-more">Learn More →</em></span>
      </a>`).join('');

  const checks = ['SSC & HSC focused', 'Beginner friendly', 'Mobile friendly learning', 'Step-by-step lessons']
    .map((t) => `<li>${icon(P('M20 6L9 17l-5-5'), '#2f7d4f')}<span>${t}</span></li>`).join('');

  const categories = [
    { t: 'English Grammar', d: 'Learn grammar rules with clear examples', href: '/grammar/', ic: P('M12 6.25c-2.5-2-6-2-9-1v13c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-13c-3-1-6.5-1-9 1zm0 0v13'), c: '#1d59e0' },
    { t: 'Paragraph Writing', d: 'Step-by-step paragraph writing for all classes', href: '/creative-writing/#paragraph', ic: P('M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z'), c: '#c2410c' },
    { t: 'Application & Email', d: 'Application, email & letter writing made easy', href: '/creative-writing/#letters-emails', ic: P('M4 4h16v16H4zM4 7l8 6 8-6'), c: '#7b5ea7' },
    { t: 'Story Writing', d: 'Short & creative story writing for practice', href: '/creative-writing/#composition-story', ic: P('M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18zM2 2l7.6 7.6'), c: '#0e7490' },
    { t: 'Literature Analysis', d: 'Poems, stories and literary explanations', href: '/english-literature/#poems', ic: P('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'), c: '#a04a3a' },
    { t: 'Seen Passage', d: 'Seen passages with questions and answers', href: '/academic/#exercises', ic: P('M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z'), c: '#2f7d4f' },
    { t: 'Vocabulary Building', d: 'Improve vocabulary with words & meanings', href: '/grammar/vocabulary-reference/', ic: P('M4 20h16M6 20V9m6 11V4m6 16v-8'), c: '#b57e14' },
    { t: 'Board Exam Prep', d: 'Important questions, suggestions & model answers', href: '/board-question/', ic: P('M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6'), c: '#e8871e' },
  ].map((c) => `
      <a class="cat-card reveal" href="${c.href}">
        ${icon(c.ic, c.c)}
        <strong>${c.t}</strong>
        <span>${c.d}</span>
        <em class="qc-more">Read More →</em>
      </a>`).join('');

  const whyCards = [
    { t: 'Rule & Example Method', d: 'Every grammar rule comes with a wealth of worked examples — the approach our founder set out in the preface.', ic: P('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'), c: '#1d59e0' },
    { t: 'Simple Explanations', d: 'Complex topics explained in simple, easy-to-understand language.', ic: P('M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z'), c: '#2f7d4f' },
    { t: 'Up-to-date Materials', d: 'Board questions and marks distributions up to 2026, kept current.', ic: P('M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2a8.4 8.4 0 1 1 16.1-4.3z'), c: '#7b5ea7' },
    { t: 'Learn Anytime', d: 'Study anywhere with a mobile-friendly website — free to access.', ic: P('M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z'), c: '#e8871e' },
  ].map((c) => `
      <div class="why-card reveal">
        ${icon(c.ic, c.c)}
        <strong>${c.t}</strong>
        <span>${c.d}</span>
      </div>`).join('');

  const featured = [
    { t: 'Grammar Topics', d: counts.grammar + ' topics with rules and worked examples — from tense to transformation.', href: '/grammar/', ic: P('M12 6.25c-2.5-2-6-2-9-1v13c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-13c-3-1-6.5-1-9 1zm0 0v13'), c: '#1d59e0' },
    { t: 'Board Questions 2009–2026', d: 'SSC & HSC questions by year and paper, with verified marks distributions.', href: '/board-question/', ic: P('M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6M9 13l2 2 4-4'), c: '#a04a3a' },
    { t: 'Writing Models', d: 'Paragraphs, letters, emails, stories, reports and CVs for every class.', href: '/creative-writing/', ic: P('M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z'), c: '#7b5ea7' },
  ].map((c) => `
      <a class="feat-card reveal" href="${c.href}">
        ${icon(c.ic, c.c)}
        <strong>${c.t}</strong>
        <span>${c.d}</span>
        <em class="qc-more">Open →</em>
      </a>`).join('');

  const body = `
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="kicker">Learn · Practice · Excel</p>
        <h1>Learn English Smarter with Skylark Education</h1>
        <p class="hero-lead">Comprehensive English learning platform for SSC, HSC, grammar, literature, and academic excellence.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/grammar/">Explore Resources</a>
          <a class="btn btn-outline" href="/board-question/">Board Questions</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <svg viewBox="0 0 440 350" style="width:100%;height:auto">
          <defs>
            <linearGradient id="heroSky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#dbe7ff"/><stop offset="1" stop-color="#eef4ff"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="440" height="350" rx="22" fill="url(#heroSky)"/>
          <circle cx="330" cy="86" r="46" fill="#f2c14e" opacity=".85"/>
          <rect x="118" y="150" width="204" height="118" rx="12" fill="#1e3a8a"/>
          <rect x="132" y="164" width="176" height="90" rx="8" fill="#2b50cf"/>
          <text x="220" y="204" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="19" fill="#fff">ENGLISH</text>
          <text x="220" y="228" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="15" fill="#f2c14e">LEARNING</text>
          <rect x="96" y="268" width="70" height="16" rx="4" fill="#c2410c"/>
          <rect x="104" y="252" width="54" height="16" rx="4" fill="#e8871e"/>
          <rect x="274" y="268" width="70" height="16" rx="4" fill="#2f7d4f"/>
          <rect x="282" y="252" width="54" height="16" rx="4" fill="#3f9a68"/>
          <path d="M352 78l24 8-24 10-24-8z" fill="#14235c"/>
          <path d="M352 96v22" stroke="#14235c" stroke-width="3"/>
          <circle cx="352" cy="122" r="4" fill="#f2c14e"/>
          <rect x="30" y="70" width="34" height="34" rx="8" fill="#fff"/>
          <text x="47" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="17" fill="#1d59e0">A</text>
          <rect x="30" y="112" width="34" height="34" rx="8" fill="#fff"/>
          <text x="47" y="136" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="17" fill="#c2410c">B</text>
          <path d="M60 190c26-12 52-10 72 6-18 4-30 14-36 28-8-14-20-24-36-34z" fill="#9db8f2" opacity=".6"/>
        </svg>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="quick-strip">${quickCards}</div>
    </div>
  </section>

  <section class="section">
    <div class="container welcome-grid">
      <div class="welcome-art reveal" aria-hidden="true">
        <svg viewBox="0 0 420 320" style="width:100%;height:auto">
          <rect x="0" y="0" width="420" height="320" rx="20" fill="#eef4ff"/>
          <rect x="52" y="40" width="130" height="240" rx="8" fill="#c9d9f7"/>
          <rect x="60" y="56" width="114" height="10" rx="3" fill="#9db8f2"/>
          <rect x="60" y="76" width="114" height="10" rx="3" fill="#9db8f2"/>
          <rect x="60" y="96" width="114" height="10" rx="3" fill="#9db8f2"/>
          <rect x="60" y="130" width="60" height="70" rx="6" fill="#e8871e"/>
          <rect x="128" y="130" width="46" height="70" rx="6" fill="#2f7d4f"/>
          <rect x="60" y="212" width="114" height="52" rx="6" fill="#dfe9fb"/>
          <rect x="200" y="90" width="170" height="190" rx="12" fill="#fff"/>
          <text x="220" y="130" font-family="Inter, sans-serif" font-weight="800" font-size="26" fill="#1d59e0">Aa</text>
          <rect x="218" y="146" width="134" height="8" rx="4" fill="#dfe7ee"/>
          <rect x="218" y="162" width="134" height="8" rx="4" fill="#dfe7ee"/>
          <rect x="218" y="178" width="100" height="8" rx="4" fill="#dfe7ee"/>
          <text x="220" y="216" font-family="Inter, sans-serif" font-weight="800" font-size="22" fill="#c2410c">Bb</text>
          <rect x="218" y="230" width="134" height="8" rx="4" fill="#dfe7ee"/>
          <rect x="218" y="246" width="110" height="8" rx="4" fill="#dfe7ee"/>
        </svg>
      </div>
      <div class="welcome-copy reveal">
        <p class="kicker">About Skylark Education</p>
        <h2>Welcome to Skylark Education</h2>
        <p>Skylark Education is a modern English learning platform designed for school and college students. We simplify grammar, literature, and academic English through clear explanations, structured lessons, and practical examples.</p>
        <ul class="check-grid">${checks}</ul>
        <a class="btn btn-primary" href="/about/">Read More About Us →</a>
      </div>
    </div>
  </section>

  <section class="section section--tinted">
    <div class="container">
      <div class="section-head section-head--center"><p class="kicker">Explore Topics</p><h2>Start Learning by Category</h2></div>
      <div class="cat-grid">${categories}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="exam-banner reveal">
        <div class="exam-art" aria-hidden="true">
          <svg viewBox="0 0 300 240" style="width:100%;height:auto">
            <rect x="0" y="0" width="300" height="240" rx="18" fill="#eef4ff"/>
            <rect x="70" y="150" width="160" height="26" rx="6" fill="#2b50cf"/>
            <rect x="82" y="124" width="136" height="26" rx="6" fill="#1d59e0"/>
            <rect x="94" y="98" width="112" height="26" rx="6" fill="#5b84f0"/>
            <path d="M150 40l54 18-54 22-54-22z" fill="#14235c"/>
            <path d="M150 80v30" stroke="#14235c" stroke-width="4"/>
            <circle cx="150" cy="116" r="6" fill="#f2c14e"/>
            <rect x="196" y="52" width="70" height="10" rx="5" fill="#c9d9f7"/>
            <rect x="34" y="52" width="70" height="10" rx="5" fill="#c9d9f7"/>
          </svg>
        </div>
        <div class="exam-copy">
          <p class="kicker">Board Exam Preparation</p>
          <h2>SSC & HSC English Preparation</h2>
          <ul class="check-list">
            <li>${icon(P('M20 6L9 17l-5-5'), '#1d59e0')}Previous board questions</li>
            <li>${icon(P('M20 6L9 17l-5-5'), '#1d59e0')}Verified marks distributions</li>
            <li>${icon(P('M20 6L9 17l-5-5'), '#1d59e0')}Model questions</li>
            <li>${icon(P('M20 6L9 17l-5-5'), '#1d59e0')}Grammar shortcuts & techniques</li>
          </ul>
          <a class="btn btn-primary" href="/board-question/">View Board Resources →</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tinted">
    <div class="container">
      <div class="section-head section-head--center"><p class="kicker">Why Choose Us</p><h2>Why Students Choose Skylark Education?</h2></div>
      <div class="why-grid">${whyCards}</div>
    </div>
  </section>

  <section class="section">
    <div class="container founder-band">
      <div class="founder-avatar" aria-hidden="true">
        <svg viewBox="0 0 120 120" style="width:120px;height:120px">
          <circle cx="60" cy="60" r="60" fill="#eef4ff"/>
          <circle cx="60" cy="44" r="20" fill="#1d59e0"/>
          <path d="M28 104a32 32 0 0 1 64 0z" fill="#1d59e0"/>
        </svg>
      </div>
      <div class="founder-quote reveal">
        <span class="q-mark" aria-hidden="true">“</span>
        <p>My goal is to make English learning easier, clearer, and more accessible for every student. Education is the key to success, and I am here to help you achieve your goals.</p>
        <p class="fq-sig"><strong>— Abdullah-Al-Mamun</strong><br>Founder Director, Skylark Education</p>
        <a class="btn btn-outline" href="/about/">Read Full Preface →</a>
      </div>
    </div>
  </section>

  <section class="section section--tinted">
    <div class="container">
      <div class="section-head section-head--center"><p class="kicker">Featured Resources</p><h2>Start With These</h2></div>
      <div class="feat-grid">${featured}</div>
    </div>
  </section>

  <section class="news-strip">
    <div class="container news-inner">
      <div class="news-copy">
        <h2>Get Free English Learning Updates</h2>
        <p>Subscribe and get the latest lessons, tests, and important updates.</p>
      </div>
      <form class="news-form" data-demo-form="newsletter" novalidate>
        <div class="news-row">
          <input type="email" required placeholder="Enter your email address" aria-label="Email address">
          <button class="btn btn-cta" type="submit">Subscribe Now</button>
        </div>
        <p class="news-note">No spam — unsubscribe anytime. Read our <a href="/privacy-policy/">privacy policy</a>.</p>
        <div class="notice notice--demo" role="status" hidden data-demo-text="This is a design preview — subscribing is not active yet and nothing is sent or stored. The newsletter will return when the backend is ready."></div>
      </form>
    </div>
  </section>`;
  writePage('index.html', shell({
    title: 'Skylark Education — Learn English Smarter | SSC, HSC, Grammar & Literature',
    description: 'Comprehensive English learning platform for SSC, HSC, grammar, literature, and academic excellence — free, syllabus-aligned.',
    section: 'site', pageType: 'home', activeRoot: null, body,
  }));
}

/* ------------------------------------------------- static / demo pages */
function demoNotice(kind) {
  const texts = {
    contact: 'This is a design preview — the contact form does not send or store anything yet. Please reach us directly at the phone numbers or emails above; a working inbox is planned for the live site.',
    login: 'This is a design preview — there is no account system yet and nothing you type here is sent or stored. Accounts are planned for the backend phase.',
    register: 'This is a design preview — registration is not available yet and nothing is sent or stored. Accounts are planned for the backend phase.',
    newsletter: 'This is a design preview — subscribing is not active yet and nothing is sent or stored. The newsletter will return when the backend is ready.',
  };
  return `<div class="notice notice--demo" role="status" hidden data-demo-text="${T.esc(texts[kind])}"></div>`;
}

function staticPages() {
  /* About — the founder's preface, verbatim. */
  const preface = bySlug.get('home');
  writePage('about/index.html', shell({
    title: 'About & Preface — Skylark Education',
    description: 'The founder\'s preface — why Skylark Education exists.',
    section: 'site', pageType: 'article', activeRoot: 'about',
    body: T.articlePage({
      trail: trailOf(null, { label: 'About', href: '/about/' }),
      kicker: 'About Skylark Education',
      title: 'Preface',
      tags: [],
      html: rewriteLinks(preface.html),
      toc: preface.headings.length >= 3 ? preface.headings : null,
    }),
  }));

  /* Contact */
  writePage('contact/index.html', shell({
    title: 'Contact — Skylark Education',
    description: 'Contact Skylark Education — Mirpur 14, Dhaka.',
    section: 'site', pageType: 'page', activeRoot: 'about',
    body: `<div class="container container-narrow">
  ${T.breadcrumb(trailOf(null, { label: 'Contact', href: '/contact/' }))}
  <header class="hub-head reveal"><p class="kicker">Contact</p><h1>We'd love to hear from you</h1>
  <p class="hub-lead">Questions, corrections, or suggestions are always welcome.</p></header>
  <div class="contact-grid">
    <div class="card contact-info">
      <h3 class="card-title">Skylark Education</h3>
      <p>${T.esc(CONTACT.address)}</p>
      <p><strong>Cell:</strong><br>${CONTACT.phones.map((p) => `<a href="tel:${p.replace(/\s/g, '')}">${p}</a>`).join('<br>')}</p>
      <p><strong>Email:</strong><br>${CONTACT.emails.map((e) => `<a href="mailto:${e}">${e}</a>`).join('<br>')}</p>
      <p><strong>Website:</strong> <a href="https://skylarkeducation.com" rel="noopener">skylarkeducation.com</a></p>
    </div>
    <form class="card contact-form" data-demo-form="contact" novalidate>
      <h3 class="card-title">Send a message</h3>
      <div class="form-field"><label for="cf-name">Your name</label><input id="cf-name" name="name" required minlength="2"><p class="form-error" hidden>Please tell us your name.</p></div>
      <div class="form-field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required><p class="form-error" hidden>Please enter a valid email address.</p></div>
      <div class="form-field"><label for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="5" required minlength="10"></textarea><p class="form-error" hidden>Please write at least a short message.</p></div>
      <button class="btn btn-primary" type="submit">Send message</button>
      ${demoNotice('contact')}
    </form>
  </div>
</div>`,
  }));

  /* Privacy policy — original content. */
  const privacy = bySlug.get('privacy-policy');
  writePage('privacy-policy/index.html', shell({
    title: 'Privacy Policy — Skylark Education',
    description: 'Privacy policy of Skylark Education.',
    section: 'site', pageType: 'article', activeRoot: 'about',
    body: T.articlePage({
      trail: trailOf(null, { label: 'Privacy Policy', href: '/privacy-policy/' }),
      kicker: 'Legal', title: 'Privacy Policy', tags: [],
      html: rewriteLinks(privacy.html),
      toc: privacy.headings.length >= 3 ? privacy.headings : null,
    }),
  }));

  /* Account previews */
  writePage('account/log-in/index.html', shell({
    title: 'Log In (Preview) — Skylark Education',
    description: 'Account login preview — demo only.',
    section: 'site', pageType: 'page', activeRoot: null,
    body: `<div class="container page-center">
  <div class="auth-card">
    <p class="kicker">Account</p>
    <h1>Welcome back</h1>
    <p class="auth-switch">New here? <a href="/account/register/">Create an account</a></p>
    <form data-demo-form="login" novalidate>
      <div class="form-field"><label for="li-email">Email</label><input id="li-email" type="email" required><p class="form-error" hidden>Please enter a valid email.</p></div>
      <div class="form-field"><label for="li-pass">Password</label><input id="li-pass" type="password" required minlength="6"><p class="form-error" hidden>Password must be at least 6 characters.</p></div>
      <button class="btn btn-primary" type="submit">Log in</button>
      ${demoNotice('login')}
    </form>
  </div>
</div>`,
  }));

  writePage('account/register/index.html', shell({
    title: 'Register (Preview) — Skylark Education',
    description: 'Account registration preview — demo only.',
    section: 'site', pageType: 'page', activeRoot: null,
    body: `<div class="container page-center">
  <div class="auth-card">
    <p class="kicker">Account</p>
    <h1>Create your account</h1>
    <p class="auth-switch">Already registered? <a href="/account/log-in/">Log in</a></p>
    <form data-demo-form="register" novalidate>
      <div class="form-field"><label for="rg-name">Full name</label><input id="rg-name" required minlength="2"><p class="form-error" hidden>Please enter your name.</p></div>
      <div class="form-field"><label for="rg-email">Email</label><input id="rg-email" type="email" required><p class="form-error" hidden>Please enter a valid email.</p></div>
      <div class="form-field"><label for="rg-pass">Password</label><input id="rg-pass" type="password" required minlength="6"><p class="form-error" hidden>Password must be at least 6 characters.</p></div>
      <button class="btn btn-primary" type="submit">Create account</button>
      ${demoNotice('register')}
    </form>
  </div>
</div>`,
  }));

  /* Newsletter */
  writePage('newsletter/index.html', shell({
    title: 'Newsletter — Skylark Education',
    description: ' Skylark Education newsletter — preview.',
    section: 'site', pageType: 'page', activeRoot: null,
    body: `<div class="container container-narrow">
  ${T.breadcrumb(trailOf(null, { label: 'Newsletter', href: '/newsletter/' }))}
  <header class="hub-head reveal"><p class="kicker">Newsletter</p><h1>Study tips, straight to your inbox</h1>
  <p class="hub-lead">Occasional updates about new grammar topics, board questions and writing models. We don't spam.</p></header>
  <form class="card" data-demo-form="newsletter" novalidate>
    <div class="form-field"><label for="nl-email">Email address</label><input id="nl-email" type="email" required><p class="form-error" hidden>Please enter a valid email.</p></div>
    <button class="btn btn-primary" type="submit">Subscribe</button>
    ${demoNotice('newsletter')}
  </form>
</div>`,
  }));

  /* Search page */
  writePage('search/index.html', shell({
    title: 'Search — Skylark Education',
    description: 'Search all Skylark Education resources.',
    section: 'site', pageType: 'page', activeRoot: null,
    body: `<div class="container container-narrow">
  ${T.breadcrumb(trailOf(null, { label: 'Search', href: '/search/' }))}
  <header class="hub-head reveal"><p class="kicker">Search</p><h1>Find any resource</h1>
  <p class="hub-lead">Search across every grammar topic, poem, passage and board question on Skylark.</p></header>
  <button class="btn btn-primary search-open-hint" type="button">Open search <kbd>⌘K</kbd></button>
</div>`,
  }));

  /* 404 */
  writePage('404.html', shell({
    title: 'Page not found — Skylark Education',
    description: 'Page not found.',
    section: 'site', pageType: 'page', activeRoot: null,
    body: `<div class="container page-center">
  <p class="error-code">404</p>
  <h1>This page flew away</h1>
  <p class="hub-lead">The page you're looking for doesn't exist — but everything else is a click away.</p>
  <div class="hero-actions" style="justify-content:center">
    <a class="btn btn-primary" href="/">Go home</a>
    <a class="btn btn-ghost" href="/grammar/">Browse grammar</a>
  </div>
</div>`,
  }));
}

/* ------------------------------------------------- board group pages */
function boardPages() {
  writePage('board-question/index.html', shell({
    title: 'Board Questions — Skylark Education',
    description: 'SSC and HSC board questions by year, paper and board — with marks distributions.',
    section: 'board', pageType: 'hub', activeRoot: 'board',
    body: T.hubPage({
      trail: trailOf(null, { label: 'Board Questions', href: '/board-question/' }),
      kicker: 'Examinations', title: 'Board Question Hub',
      lead: 'Everything for SSC and HSC English — questions by year and paper, marks distributions, model questions and board solutions. All data shown is exactly what Skylark has published.',
      jump: [{ id: 'ssc', label: 'SSC' }, { id: 'hsc', label: 'HSC' }, { id: 'class', label: 'Class 6–8' }, { id: 'marks', label: 'Marks Distributions' }, { id: 'all', label: 'All resources' }],
      groups: [
        { title: 'SSC Board Questions', id: 'ssc', kicker: 'SSC · Dakhil', links: [{ href: '/board-question/ssc/', label: 'Browse all SSC resources →', meta: 'Year and paper filters' }, ...hubGroupLinks(boardItems.filter((i) => boardMeta(i).level === 'ssc'))] },
        { title: 'HSC Board Questions', id: 'hsc', kicker: 'HSC · Alim', links: [{ href: '/board-question/hsc/', label: 'Browse all HSC resources →', meta: 'Year and paper filters' }, ...hubGroupLinks(boardItems.filter((i) => boardMeta(i).level === 'hsc'))] },
        { title: 'Class 6–8 Exam Resources', id: 'class', kicker: 'Junior classes', links: hubGroupLinks(boardItems.filter((i) => boardMeta(i).level === 'class')) },
        { title: 'Marks Distributions', id: 'marks', kicker: 'Verified data', links: hubGroupLinks(boardItems.filter((i) => boardMeta(i).type === 'marks')) },
        { title: 'All Board Resources', id: 'all', kicker: 'Complete list', links: hubGroupLinks(boardItems) },
      ],
    }),
  }));

  boardSubHub('board-question/ssc/index.html', 'SSC Board Questions', 'SSC · Dakhil',
    'Board questions and preparation by year — filter by year, then open any resource.',
    (i) => boardMeta(i).level === 'ssc');
  boardSubHub('board-question/hsc/index.html', 'HSC Board Questions', 'HSC · Alim',
    'Board questions and preparation by year — filter by year, then open any resource.',
    (i) => boardMeta(i).level === 'hsc');
  writePage('board-question/marks-distribution/index.html', shell({
    title: 'Marks Distribution — Skylark Education',
    description: 'Marks distributions for SSC, HSC and classes 6–8, as published by Skylark Education.',
    section: 'board', pageType: 'hub', activeRoot: 'board',
    body: T.hubPage({
      trail: trailOf({ label: 'Board Questions', href: '/board-question/' }, { label: 'Marks Distribution', href: '/board-question/marks-distribution/' }),
      kicker: 'Verified data', title: 'Marks Distributions',
      lead: 'Every marks distribution Skylark has published, exactly as provided. No figures are invented.',
      groups: [{ title: 'All marks distributions', id: 'all', kicker: 'List', links: hubGroupLinks(boardItems.filter((i) => boardMeta(i).type === 'marks')) }],
    }),
  }));
}

/* -------------------------------------------------- grammar group pages */
function grammarGroupPages() {
  for (const g of grammar) {
    writePage(`grammar/${g.id}/index.html`, shell({
      title: `${g.title} — Grammar — Skylark Education`,
      description: `${g.title} — grammar topics, rules and exercises on Skylark Education.`,
      section: 'grammar', pageType: 'hub', activeRoot: 'grammar',
      body: T.hubPage({
        trail: trailOf({ label: 'Grammar', href: '/grammar/' }, { label: g.title, href: `/grammar/${g.id}/` }),
        kicker: 'Grammar', title: g.title,
        lead: `Topics in ${g.title.toLowerCase()} — open any topic for rules and examples.`,
        groups: [{ title: 'Topics', id: 'topics', kicker: 'Topic group', links: hubGroupLinks(g.items) }],
      }),
    }));
  }
}

/* --------------------------------------------------------- search index */
function writeSearchIndex() {
  const sectionLabelMap = { grammar: 'Grammar', literature: 'Literature', 'creative-writing': 'Creative Writing', academic: 'Academic', board: 'Board Questions', admission: 'Admission', site: 'Skylark' };
  const idx = items.filter((i) => !HUB_SLUGS.has(i.slug) && i.words >= 5).map((i) => ({
    title: i.title,
    text: textOf(i).slice(0, 1200),
    section: sectionLabelMap[i.section] ?? i.section,
    path: BASE === '/' ? hrefOf(i) : (BASE.replace(/\/$/, '') + hrefOf(i)),
  }));
  fs.mkdirSync(path.join(SITE, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'assets/search-index.json'), JSON.stringify(idx));
}

/* ------------------------------------------------------------ assembly */
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

renderHub(HUBS[0]); renderHub(HUBS[1]); renderHub(HUBS[2]); renderHub(HUBS[4]);
renderHub(HUBS[3]);
boardPages();
grammarGroupPages();
homePage();
staticPages();
writeSearchIndex();

/* Article pages for every content item not replaced by a hub/static page. */
const STATIC_DONE = new Set(['home', 'privacy-policy', 'log-in', 'register', 'newsletter']);
for (const it of items) {
  if (HUB_SLUGS.has(it.slug) || STATIC_DONE.has(it.slug)) continue;
  const gl = grammar.find((g) => g.items.some((x) => x.slug === it.slug));
  const gl2 = gl ?? cwGroups.find((g) => g.items.some((x) => x.slug === it.slug));
  const gl3 = gl2 ?? acadClasses.find((g) => g.items.some((x) => x.slug === it.slug));
  const crumbMap = {
    grammar: { label: 'Grammar', href: '/grammar/', root: 'grammar' },
    literature: { label: 'Literature', href: '/english-literature/', root: 'literature' },
    'creative-writing': { label: 'Creative Writing', href: '/creative-writing/', root: 'creative-writing' },
    academic: { label: 'Academic', href: '/academic/', root: 'academic' },
    board: { label: 'Board Questions', href: '/board-question/', root: 'board' },
    admission: { label: 'Admission', href: '/admission/', root: 'admission' },
    site: null,
  };
  const sectionLabelMap = { grammar: 'Grammar', literature: 'Literature', 'creative-writing': 'Creative Writing', academic: 'Academic', board: 'Board Questions', admission: 'Admission', site: 'Skylark' };
  article(it, {
    crumb: crumbMap[it.section],
    kicker: sectionLabelMap[it.section],
    groupList: gl3 ? gl3.items : (it.section === 'board' ? boardItems : null),
    sectionLabel: sectionLabelMap[it.section],
  });
}

/* Copy static assets */
fs.cpSync(path.join(ROOT, 'assets/css'), path.join(SITE, 'assets/css'), { recursive: true });
fs.cpSync(path.join(ROOT, 'assets/js'), path.join(SITE, 'assets/js'), { recursive: true });
fs.cpSync(path.join(ROOT, 'assets/img'), path.join(SITE, 'assets/img'), { recursive: true });

/* Report */
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : files.push(f.name); })(SITE);
const htmlCount = files.filter((f) => f.endsWith('.html')).length;
console.log(`Built site: ${htmlCount} HTML pages, ${files.length} files total.`);
