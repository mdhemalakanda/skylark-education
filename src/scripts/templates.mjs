#!/usr/bin/env node
/** templates.mjs — HTML partials & page templates for the Skylark build.
 *  Exports pure functions; build.mjs supplies data. */

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* ---------------------------------------------------------------- logo */
export function brandMark(cls = 'brand-mark') {
  // Stylised skylark: rising bird over an open-book baseline.
  return `<svg class="${cls}" viewBox="0 0 44 44" width="40" height="40" fill="none" aria-hidden="true">
    <circle cx="22" cy="22" r="21" class="bm-ring"/>
    <path d="M8 29c4.5 3.4 9 5 14 5s9.5-1.6 14-5" class="bm-book"/>
    <path d="M13 24c3.5-8 8-12.5 15-14-2.5 4.4-2.7 8-1 11.2-2.8-.5-4.6-1.8-5.6-3.7-.4 2.9.8 5.2 3.5 6.9-4 .9-8.1.7-11.9-.4z" class="bm-bird"/>
    <path d="M28 27l3.4 2.2L28.4 31" class="bm-note"/>
  </svg>`;
}

/* -------------------------------------------------------------- header */
export function header(nav, activeRoot, contact) {
  const topbar = `<div class="topbar">
    <div class="container topbar-inner">
      <div class="topbar-contact">
        <a href="tel:${contact.phones[0].replace(/\s/g, '')}"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/></svg>${contact.phones[0]}</a>
        <a href="mailto:${contact.emails[0]}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>${contact.emails[0]}</a>
      </div>
      <div class="topbar-actions">
        <a href="mailto:${contact.emails[0]}" aria-label="Email" class="topbar-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></a>
        <a href="https://wa.me/${contact.phones[0].replace(/[^0-9]/g, '')}" rel="noopener" aria-label="WhatsApp" class="topbar-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.1 13.9c-.2.6-1.2 1.1-1.7 1.1-.4.1-1 .1-1.6-.1a13 13 0 0 1-5.8-5.1c-.6-1-.9-1.9-.9-2.7 0-.8.4-1.5.8-1.9.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7a8 8 0 0 0 3.6 3.1c.3.1.5.1.7-.1l.8-.9c.2-.3.4-.2.7-.1l2 1c.3.2.5.3.5.5s0 .8-.4 1.2z"/></svg></a>
        <a class="topbar-auth" href="/account/log-in/">Login / Register</a>
      </div>
    </div>
  </div>`;

  const items = nav.map((n) => {
    const active = n.root === activeRoot ? ' is-active' : '';
    if (n.mega) {
      let inner;
      if (n.mega.length > 6) {
        // Large sections: compact group index instead of a tall link wall.
        inner = `<div class="mega-grid mega-grid--compact">${n.mega.map((col) => `
          <a class="mega-group" href="${col.href ?? n.href}">${esc(col.title)}${col.count ? ` <span class="mega-count">${col.count}</span>` : ''}</a>`).join('')}</div>`;
      } else {
        inner = n.mega.map((col) => `
          <div class="mega-col">
            <p class="mega-title">${esc(col.title)}</p>
            <ul>${col.links.slice(0, 6).map((l) => `<li><a href="${l.href}">${esc(l.label)}${l.count ? ` <span class="mega-count">${l.count}</span>` : ''}</a></li>`).join('')}</ul>
          </div>`).join('');
      }
      return `<li class="nav-item has-mega">
        <button class="nav-link${active}" type="button" aria-expanded="false" aria-haspopup="true">${esc(n.label)}</button>
        <div class="mega" role="menu">${n.mega.length > 6 ? inner : `<div class="mega-grid">${inner}</div>`}</div>
      </li>`;
    }
    return `<li class="nav-item"><a class="nav-link${active}" href="${n.href}">${esc(n.label)}</a></li>`;
  }).join('\n');

  return `${topbar}<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Skylark Education — home">
      ${brandMark()}
      <span class="brand-text"><strong>Skylark</strong> <span>Education</span><small>Nurturing young recruits with pride and care</small></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <ul class="nav-list">${items}</ul>
    </nav>
    <div class="header-actions">
      <button class="search-toggle" type="button" aria-label="Search (Ctrl+K)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>
      <a class="btn btn-cta header-cta" href="/grammar/">Start Learning</a>
      <button class="mobile-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav" hidden>${mobileNav(nav)}</div>
</header>`;
}

function mobileNav(nav) {
  const sec = nav.map((n) => {
    if (n.mega) {
      const groups = n.mega.map((col) => `
        <details class="mn-group">
          <summary>${esc(col.title)}</summary>
          <ul>${col.links.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
        </details>`).join('');
      return `<div class="mn-section"><p class="mn-label">${esc(n.label)}</p>${groups}</div>`;
    }
    return `<div class="mn-section"><p class="mn-label"><a href="${n.href}">${esc(n.label)}</a></p></div>`;
  }).join('');
  return `<nav aria-label="Mobile">${sec}<div class="mn-cta">
    <a class="btn btn-primary" href="${root('grammar/index.html')}">Explore Grammar</a>
    <a class="btn btn-ghost" href="${root('board-question/index.html')}">Board Questions</a>
  </div></nav>`;
}

const root = (p) => meta_root() + p;
let _root = '/';
export function setRootPrefix(r) { _root = r; }
function meta_root() { return _root; }

/* -------------------------------------------------------------- footer */
export function footer(quickLinks, contact) {
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand brand--light" href="/" aria-label="Skylark Education — home">
        ${brandMark()}
        <span class="brand-text"><strong>Skylark</strong> <span>Education</span></span>
      </a>
      <p class="footer-tag">Nurturing young recruits with pride and care.</p>
      <p class="footer-blurb">A rule-and-example-rich English learning resource for school and college students — built by teachers, aligned with the syllabus.</p>
      <div class="footer-social">
        <a href="mailto:${contact.emails[0]}" aria-label="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></a>
        <a href="https://wa.me/${contact.phones[0].replace(/[^0-9]/g, '')}" rel="noopener" aria-label="WhatsApp"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.1 13.9c-.2.6-1.2 1.1-1.7 1.1-.4.1-1 .1-1.6-.1a13 13 0 0 1-5.8-5.1c-.6-1-.9-1.9-.9-2.7 0-.8.4-1.5.8-1.9.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7a8 8 0 0 0 3.6 3.1c.3.1.5.1.7-.1l.8-.9c.2-.3.4-.2.7-.1l2 1c.3.2.5.3.5.5s0 .8-.4 1.2z"/></svg></a>
      </div>
    </div>
    <div class="footer-col">
      <h3>Learn</h3>
      <ul>${quickLinks.learn.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
    </div>
    <div class="footer-col">
      <h3>Examinations</h3>
      <ul>${quickLinks.exams.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
    </div>
    <div class="footer-col">
      <h3>Institute</h3>
      <ul>${quickLinks.institute.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
      <address>
        ${esc(contact.name)}<br>${esc(contact.address)}<br>
        ${contact.phones.map((p) => `<a href="tel:${p.replace(/\s/g, '')}">${esc(p)}</a>`).join('<br>')}<br>
        <a href="mailto:${contact.emails[0]}">${esc(contact.emails[0])}</a>
      </address>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© <span data-footer-year>2026</span> Skylark Education, Mirpur, Dhaka. All rights reserved.</p>
    <p><a href="${root('privacy-policy/index.html')}">Privacy Policy</a></p>
  </div>
</footer>
<button class="back-to-top" type="button" aria-label="Back to top">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
</button>
<div class="search-overlay" hidden>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search Skylark Education">
    <div class="search-box">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input class="search-input" type="search" placeholder="Search grammar topics, poems, board questions…" aria-label="Search" autocomplete="off" spellcheck="false">
      <button class="search-close" type="button" aria-label="Close search">Esc</button>
    </div>
    <div class="search-results" aria-live="polite"></div>
  </div>
</div>`;
}

/* ------------------------------------------------------------- partials */
export function breadcrumb(trail) {
  if (!trail || trail.length < 2) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${trail.map((t, i) =>
    i < trail.length - 1
      ? `<li><a href="${t.href}">${esc(t.label)}</a></li>`
      : `<li aria-current="page">${esc(t.label)}</li>`).join('')}</ol></nav>`;
}

export function tocAside(headings) {
  if (!headings || headings.length < 3) return '';
  const links = headings.slice(0, 40).map((h, i) =>
    `<li><a class="toc-link toc-l${h.level}" href="#h-${i}">${esc(h.text)}</a></li>`).join('');
  return `<aside class="article-aside"><nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ul>${links}</ul></nav></aside>`;
}

/* ------------------------------------------------------------ page shell */
export function layout(o) {
  setRootPrefix(o.rootPrefix ?? '/');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description ?? 'Skylark Education — English learning resources for school and college students in Bangladesh.')}">
<meta name="site-root" content="${esc(o.rootPrefix ?? '/')}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description ?? '')}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Hind+Siliguri:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${root('assets/css/style.css')}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='21' fill='%2312253d'/%3E%3Cpath d='M13 24c3.5-8 8-12.5 15-14-2.5 4.4-2.7 8-1 11.2-2.8-.5-4.6-1.8-5.6-3.7-.4 2.9.8 5.2 3.5 6.9-4 .9-8.1.7-11.9-.4z' fill='%23d99a2b'/%3E%3C/svg%3E">
</head>
<body data-section="${o.section ?? 'site'}" data-page="${o.pageType ?? 'page'}">
<a class="skip-link" href="#main">Skip to content</a>
<div class="reading-progress" aria-hidden="true"><span></span></div>
${header(o.nav, o.activeRoot, o.contact)}
<main class="site-main" id="main">
${o.body}
</main>
${footer(o.quickLinks, o.contact)}
<script src="${root('assets/js/main.js')}" defer></script>
</body>
</html>`;
}

/* ------------------------------------------------------- article template */
export function articlePage(o) {
  const tags = (o.tags ?? []).map((t) => `<span class="badge">${esc(t)}</span>`).join('');
  return `<div class="container article-layout">
  <article class="article-main">
    ${breadcrumb(o.trail)}
    <header class="article-header reveal">
      <p class="kicker">${esc(o.kicker)}</p>
      <h1>${esc(o.title)}</h1>
      ${tags ? `<div class="article-meta">${tags}</div>` : ''}
    </header>
    <div class="prose reveal">${o.html}</div>
    ${prevNext(o.prev, o.next)}
    ${related(o.related)}
  </article>
  ${tocAside(o.toc)}
</div>`;
}

function prevNext(prev, next) {
  if (!prev && !next) return '';
  return `<nav class="article-nav" aria-label="More in this section">
    ${prev ? `<a href="${prev.href}"><span class="dir">← Previous</span><span class="name">${esc(prev.label)}</span></a>` : '<span></span>'}
    ${next ? `<a href="${next.href}"><span class="dir">Next →</span><span class="name">${esc(next.label)}</span></a>` : '<span></span>'}
  </nav>`;
}

function related(items) {
  if (!items || !items.length) return '';
  return `<section class="related reveal">
    <div class="section-head"><p class="kicker">Related resources</p></div>
    <div class="grid-3">${items.map((r) => `
      <a class="card" href="${r.href}">
        <span class="badge">${esc(r.sectionLabel)}</span>
        <h3 class="card-title">${esc(r.label)}</h3>
      </a>`).join('')}</div>
  </section>`;
}

/* ------------------------------------------------------------ hub template */
export function hubPage(o) {
  const groups = o.groups.map((g) => {
    if (!g.links.length) return '';
    return `<section class="hub-group reveal" id="${esc(g.id)}">
      <div class="section-head"><p class="kicker">${esc(g.kicker ?? 'Resources')}</p><h2>${esc(g.title)}</h2>${g.blurb ? `<p>${esc(g.blurb)}</p>` : ''}</div>
      <div class="grid-3">${g.links.map((l) => `
        <a class="card" href="${l.href}">
          <h3 class="card-title">${esc(l.label)}</h3>
          ${l.meta ? `<p class="card-meta">${esc(l.meta)}</p>` : ''}
        </a>`).join('')}</div>
    </section>`;
  }).join('\n');
  return `<div class="container hub">
  ${breadcrumb(o.trail)}
  <header class="hub-head reveal">
    <p class="kicker">${esc(o.kicker)}</p>
    <h1>${esc(o.title)}</h1>
    ${o.lead ? `<p class="hub-lead">${esc(o.lead)}</p>` : ''}
    ${o.jump ? `<div class="hub-jump">${o.jump.map((j) => `<a class="chip" href="#${esc(j.id)}">${esc(j.label)}</a>`).join('')}</div>` : ''}
  </header>
  ${groups}
</div>`;
}
