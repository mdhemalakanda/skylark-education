/* ==========================================================================
   Skylark Education — main.js
   Vanilla JS behavior layer for the static site. Zero dependencies.
   Loaded with <script defer>; safe on any page (every feature checks for
   its own elements first). Wrapped in an IIFE so nothing leaks to global.
   ========================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Site root: pages live at varying depths, so the search index path is
     resolved against <meta name="site-root" content="/">. */
  const siteRoot = (document.querySelector('meta[name="site-root"]')?.content || '/');

  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  /* --------------------------------------------------------------------------
     1. Header shadow on scroll
     -------------------------------------------------------------------------- */
  function initHeaderShadow() {
    const header = $('.site-header');
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* --------------------------------------------------------------------------
     2. Mega menu (desktop nav)
     -------------------------------------------------------------------------- */
  function initMegaMenu() {
    const items = $$('.nav-item.has-mega');
    if (!items.length) return;

    /* Keep the open panel inside the viewport: on 900–1200px screens the
       nav sits near the edges and a centered 680px panel would clip. */
    const fitPanel = (item) => {
      const panel = $('.mega', item);
      if (!panel) return;
      if (window.innerWidth >= 1200) {
        panel.style.left = '';
        panel.style.transform = '';
        panel.style.transition = '';
        return;
      }
      // Measure with transitions off — otherwise the enter animation's
      // mid-flight geometry corrupts the calculation.
      panel.style.transition = 'none';
      panel.style.transform = 'none';
      panel.style.left = '0px';
      void panel.offsetWidth; // flush
      const margin = 12;
      const vw = window.innerWidth;
      const w = panel.getBoundingClientRect().width;
      const anchor = item.getBoundingClientRect();
      // Panel is absolutely positioned relative to the nav ITEM, so the
      // style value must be a parent-relative offset, not a viewport coord.
      let viewportLeft = anchor.left + anchor.width / 2 - w / 2; // centered on trigger
      viewportLeft = Math.max(margin, Math.min(viewportLeft, vw - margin - w));
      panel.style.left = Math.round(viewportLeft - anchor.left) + 'px';
    };
    window.addEventListener('resize', () => {
      items.forEach((item) => { if (item.classList.contains('is-open')) fitPanel(item); });
    });

    const closeAll = (except = null) => {
      items.forEach((item) => {
        if (item === except) return;
        item.classList.remove('is-open');
        const trigger = $('.nav-link', item);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    items.forEach((item) => {
      const trigger = $('.nav-link', item);
      if (!trigger) return;

      // Open on hover (desktop handles via CSS pointer state too; JS manages ARIA)
      item.addEventListener('mouseenter', () => {
        closeAll(item);
        item.classList.add('is-open');
        fitPanel(item);
        trigger.setAttribute('aria-expanded', 'true');
      });
      let leaveTimer = null;
      item.addEventListener('mouseleave', () => {
        // Short grace period so crossing the gap or a brief slip doesn't slam shut.
        leaveTimer = setTimeout(() => {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }, 180);
      });
      item.addEventListener('mouseenter', () => {
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      });

      // Open on focus-within (keyboard users tabbing into the menu)
      item.addEventListener('focusin', () => {
        closeAll(item);
        item.classList.add('is-open');
        fitPanel(item);
        trigger.setAttribute('aria-expanded', 'true');
      });
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Click / Enter / Space / ArrowDown on the trigger toggles
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const open = item.classList.toggle('is-open');
        if (open) fitPanel(item);
        trigger.setAttribute('aria-expanded', String(open));
      });
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          item.classList.add('is-open');
          fitPanel(item);
          trigger.setAttribute('aria-expanded', 'true');
          const first = $('.mega a', item);
          if (first) first.focus();
        }
      });
    });

    // Esc anywhere closes; outside click closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item.has-mega')) closeAll();
    });
  }

  /* --------------------------------------------------------------------------
     3. Mobile nav
     -------------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = $('.mobile-toggle');
    const nav = $('.mobile-nav');
    if (!toggle || !nav) return;

    const open = () => {
      nav.hidden = false;
      requestAnimationFrame(() => nav.classList.add('is-open'));
      toggle.setAttribute('aria-expanded', 'true');
      const firstLink = $('a, button', nav);
      if (firstLink) firstLink.focus();
    };
    const close = (restoreFocus = true) => {
      nav.classList.remove('is-open');
      nav.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? close(false) : open();
    });

    // Accordion sub-groups inside the panel
    $$('[data-nav-group] > button, .mobile-nav .nav-group-toggle', nav).forEach((btn) => {
      const group = btn.parentElement;
      btn.setAttribute('aria-expanded', group.classList.contains('is-open') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        const isOpen = group.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });

    // Close on any link click
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      close();
    });

    // Simple focus trap while open
    nav.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = $$('a[href], button:not([disabled])', nav)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Reset when resizing back to desktop
    window.matchMedia('(min-width: 1140px)').addEventListener('change', (e) => {
      if (e.matches) close(false);
    });
  }

  /* --------------------------------------------------------------------------
     4. Search overlay + instant search
     -------------------------------------------------------------------------- */
  function initSearch() {
    const overlay = $('.search-overlay');
    if (!overlay) return;

    const input = $('.search-input', overlay);
    const results = $('.search-results', overlay);
    const panel = $('.search-panel', overlay);
    const searchToggles = $$('.search-toggle');
    let index = null;          // loaded lazily
    let indexFailed = false;
    let flatResults = [];      // current rendered list (for keyboard nav)
    let lastFocus = null;

    const loadIndex = async () => {
      if (index || indexFailed) return index;
      try {
        const res = await fetch(`${siteRoot}assets/search-index.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        index = await res.json();
        if (!Array.isArray(index)) index = [];
      } catch {
        indexFailed = true;
        index = [];
      }
      return index;
    };

    const escapeHtml = (s) => String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Highlight every query term inside a snippet with <mark>
    const highlight = (text, terms) => {
      let out = escapeHtml(text);
      terms.forEach((term) => {
        const re = new RegExp(`(${escapeRegExp(escapeHtml(term))})`, 'gi');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    };

    const scoreEntry = (entry, q, terms) => {
      const title = (entry.title || '').toLowerCase();
      const text = (entry.text || '').toLowerCase();
      const section = (entry.section || '').toLowerCase();
      let score = -1;
      if (title.includes(q)) score = 100;
      else if (terms.every((t) => title.includes(t))) score = 80;
      else if (text.includes(q)) score = 40;
      else if (terms.every((t) => text.includes(t) || section.includes(t))) score = 30;
      else if (terms.some((t) => text.includes(t) || title.includes(t) || section.includes(t))) score = 10;
      return score;
    };

    const makeSnippet = (entry, terms) => {
      const text = entry.text || '';
      const lower = text.toLowerCase();
      let pos = -1;
      for (const t of terms) {
        const p = lower.indexOf(t);
        if (p !== -1 && (pos === -1 || p < pos)) pos = p;
      }
      if (pos === -1) return text.slice(0, 140);
      const start = Math.max(0, pos - 40);
      return (start > 0 ? '…' : '') + text.slice(start, start + 140) + (start + 140 < text.length ? '…' : '');
    };

    const render = (q) => {
      flatResults = [];
      if (!results) return;

      if (!q) { results.innerHTML = ''; return; } // empty query shows nothing

      if (indexFailed) {
        results.innerHTML =
          '<p class="empty">Search is unavailable right now — the index could not be loaded.</p>';
        return;
      }

      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = [];
      for (const entry of index) {
        const s = scoreEntry(entry, q.toLowerCase(), terms);
        if (s > 0) scored.push({ entry, s });
      }
      scored.sort((a, b) => b.s - a.s);
      const top = scored.slice(0, 30);

      if (!top.length) {
        results.innerHTML = '<p class="empty">No results found. Try a different word or phrase.</p>';
        return;
      }

      // Group by section, preserving score order within groups
      const groups = new Map();
      top.forEach(({ entry }) => {
        const key = entry.section || 'Other';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
      });

      const frag = document.createDocumentFragment();
      let i = 0;
      groups.forEach((entries, section) => {
        const group = document.createElement('div');
        group.className = 'result-group';
        const heading = document.createElement('h3');
        heading.className = 'result-group-title';
        heading.textContent = section;
        group.appendChild(heading);

        entries.forEach((entry) => {
          const item = document.createElement('a');
          item.className = 'result-item';
          item.href = entry.path || '#';
          item.dataset.index = String(i++);
          const title = document.createElement('span');
          title.className = 'title';
          title.innerHTML = highlight(entry.title || 'Untitled', terms);
          const snippet = document.createElement('span');
          snippet.className = 'snippet';
          snippet.innerHTML = highlight(makeSnippet(entry, terms), terms);
          item.append(title, snippet);
          group.appendChild(item);
          flatResults.push(item);
        });
        frag.appendChild(group);
      });
      results.innerHTML = '';
      results.appendChild(frag);
    };

    const debouncedRender = debounce(() => {
      render(input ? input.value.trim() : '');
    }, 80);

    const setActive = (i) => {
      flatResults.forEach((el, j) => el.classList.toggle('is-active', i === j));
    };

    const openOverlay = () => {
      lastFocus = document.activeElement;
      overlay.classList.add('is-open');
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      loadIndex();
      if (input) { input.value = ''; input.focus(); }
      render('');
    };

    const closeOverlay = () => {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    };

    searchToggles.forEach((btn) => {
      btn.addEventListener('click', openOverlay);
    });

    if (input) {
      input.addEventListener('input', debouncedRender);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && flatResults.length) {
          e.preventDefault();
          setActive(0);
          flatResults[0].focus();
        }
      });
    }

    if (results) {
      results.addEventListener('keydown', (e) => {
        const current = e.target.closest('.result-item');
        if (!current) return;
        const i = Number(current.dataset.index);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (i + 1 < flatResults.length) { setActive(i + 1); flatResults[i + 1].focus(); }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (i > 0) { setActive(i - 1); flatResults[i - 1].focus(); }
          else if (input) { setActive(-1); input.focus(); }
        }
      });
    }

    // Enter on a result navigates via its href (default anchor behavior).
    // Esc / outside click / close button close the overlay.
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); }
    });

    overlay.addEventListener('mousedown', (e) => {
      if (panel && !panel.contains(e.target)) closeOverlay();
    });

    const closeBtn = $('.search-close', overlay);
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    // Focus trap inside the panel
    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !panel) return;
      const focusables = $$('a[href], button:not([disabled]), input', panel)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Global keyboard shortcut: Ctrl/⌘ + K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.classList.contains('is-open') ? closeOverlay() : openOverlay();
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Tabs
     -------------------------------------------------------------------------- */
  function initTabs() {
    $$('.tabs').forEach((container) => {
      const tabs = $$('.tab', container);
      if (!tabs.length) return;

      const activate = (tab, focus = false) => {
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
          t.setAttribute('tabindex', active ? '0' : '-1');
          const panelId = t.getAttribute('aria-controls');
          const panel = panelId ? document.getElementById(panelId) : null;
          if (panel) panel.hidden = !active;
        });
        if (focus) tab.focus();
      };

      tabs.forEach((tab, i) => {
        // Wire ARIA if missing
        if (!tab.id) tab.id = `tab-${i}-${Math.random().toString(36).slice(2, 7)}`;
        tab.setAttribute('role', 'tab');
        const panelId = tab.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tab.id);
        }

        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (e) => {
          let next = null;
          if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
          else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === 'Home') next = tabs[0];
          else if (e.key === 'End') next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); activate(next, true); }
        });
      });

      // Initialize state from markup (or first tab)
      const active = tabs.find((t) => t.classList.contains('is-active')) || tabs[0];
      activate(active);
    });
  }

  /* --------------------------------------------------------------------------
     6. Accordions
     -------------------------------------------------------------------------- */
  function initAccordions() {
    $$('.accordion').forEach((accordion) => {
      const singleOpen = accordion.hasAttribute('data-single-open') ||
        accordion.getAttribute('data-accordion') === 'single';

      $$('.accordion-item', accordion).forEach((item) => {
        const head = $('.accordion-head', item);
        const body = $('.accordion-body', item);
        if (!head || !body) return;

        head.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');

        const setOpen = (open) => {
          item.classList.toggle('is-open', open);
          head.setAttribute('aria-expanded', String(open));

          if (prefersReducedMotion.matches) {
            body.style.height = open ? 'auto' : '0px';
            return;
          }
          if (open) {
            body.style.height = '0px';
            requestAnimationFrame(() => { body.style.height = `${body.scrollHeight}px`; });
            body.addEventListener('transitionend', function done(e) {
              if (e.propertyName !== 'height') return;
              body.style.height = 'auto';
              body.removeEventListener('transitionend', done);
            });
          } else {
            body.style.height = `${body.scrollHeight}px`;
            requestAnimationFrame(() => { body.style.height = '0px'; });
          }
        };

        head.addEventListener('click', () => {
          const willOpen = !item.classList.contains('is-open');
          if (willOpen && singleOpen) {
            $$('.accordion-item.is-open', accordion).forEach((other) => {
              if (other !== item) {
                const otherHead = $('.accordion-head', other);
                const otherBody = $('.accordion-body', other);
                other.classList.remove('is-open');
                if (otherHead) otherHead.setAttribute('aria-expanded', 'false');
                if (otherBody) otherBody.style.height = '0px';
              }
            });
          }
          setOpen(willOpen);
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. TOC + scrollspy
     -------------------------------------------------------------------------- */
  function initToc() {
    const toc = $('.toc');
    if (!toc) return;

    let list = $('ul, ol, .toc-list', toc);
    const prose = $('.prose');

    // Collect heading targets: [data-toc] first, else h2/h3 inside .prose
    let headings = $$('[data-toc]');
    if (!headings.length && prose) headings = $$('h2, h3', prose);
    if (!headings.length) return;

    // Build links only if the TOC aside ships without any; a pre-rendered
    // TOC (build-time) is authoritative — just wire the scrollspy to it.
    if (list && list.children.length) {
      const wired = $$('a', list).map((a) => {
        const id = a.getAttribute('href').slice(1);
        return { link: a, heading: document.getElementById(id) };
      }).filter((x) => x.heading);
      wireToc(list, wired);
      return;
    }
    if (!list) {
      list = document.createElement('ul');
      list.className = 'toc-list';
      toc.appendChild(list);
    }
    const links = [];
    headings.forEach((heading, i) => {
      if (!heading.id) heading.id = `section-${i + 1}`;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.className = 'toc-link';
      a.textContent = heading.textContent.trim();
      if (heading.tagName === 'H3') a.classList.add('toc-link--sub');
      li.appendChild(a);
      list.appendChild(li);
      links.push({ link: a, heading });
    });
    wireToc(list, links);

    function wireToc(listEl, links) {
      const setActive = (id) => {
        links.forEach(({ link, heading }) => {
          link.classList.toggle('is-active', heading.id === id);
        });
      };

      // Smooth scroll on click
      listEl.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
          block: 'start',
        });
        history.replaceState(null, '', `#${target.id}`);
        setActive(target.id);
      });

      // Scrollspy
      if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
          const visible = entries
            .filter((en) => en.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length) setActive(visible[0].target.id);
        }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
        links.forEach(({ heading }) => spy.observe(heading));
      }
    }
  }

  /* --------------------------------------------------------------------------
     8. Reading progress bar (article pages only)
     -------------------------------------------------------------------------- */
  function initReadingProgress() {
    if (document.body.getAttribute('data-page') !== 'article') return;
    const bar = $('.reading-progress');
    if (!bar) return;

    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = `${pct}%`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* --------------------------------------------------------------------------
     9. Reveal on scroll
     -------------------------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      return; // content stays visible — no animation, no hiding
    }
    document.body.classList.add('reveal-armed');

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target); // once only
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* --------------------------------------------------------------------------
     10. Back to top
     -------------------------------------------------------------------------- */
  function initBackToTop() {
    const btn = $('.back-to-top');
    if (!btn) return;
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Back to top');

    let ticking = false;
    const update = () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* --------------------------------------------------------------------------
     11. Demo forms — validate, then disclose. NEVER fakes a submission.
     -------------------------------------------------------------------------- */
  const DEMO_MESSAGES = {
    contact: 'This is a design preview — the contact form is not connected to a server. Your message was not sent and nothing was stored.',
    login: 'This is a design preview — there is no account system. No sign-in was attempted and nothing was stored.',
    register: 'This is a design preview — there is no account system. No account was created and nothing was stored.',
    newsletter: 'This is a design preview — the newsletter signup is not connected to a service. No subscription was recorded and nothing was stored.',
  };

  function validateField(field) {
    const value = field.value.trim();
    const errorEl = field.closest('.form-field')?.querySelector('.form-error');
    let message = '';

    if (field.hasAttribute('required') || field.getAttribute('aria-required') === 'true') {
      if (!value) message = 'This field is required.';
    }
    if (!message && field.type === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Please enter a valid email address.';
    }
    const min = Number(field.getAttribute('minlength') || field.getAttribute('data-minlength') || 0);
    if (!message && min && value.length < min) {
      message = `Must be at least ${min} characters.`;
    }

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = !message;
    }
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  function initDemoForms() {
    $$('form[data-demo-form]').forEach((form) => {
      const kind = form.getAttribute('data-demo-form');
      const fields = $$('input, textarea, select', form);

      form.addEventListener('submit', (e) => {
        e.preventDefault(); // always — this form never submits anywhere

        const invalid = fields.filter((f) => !validateField(f));
        if (invalid.length) {
          invalid[0].focus();
          // Remove any previously shown demo notice — validation failed
          const old = $('.notice--demo', form);
          if (old) old.remove();
          return;
        }

        // Valid: show the honest demo disclosure (idempotent)
        let notice = $('.notice--demo', form);
        if (!notice) {
          notice = document.createElement('div');
          notice.className = 'notice notice--demo';
          notice.setAttribute('role', 'status');
          form.appendChild(notice);
        }
        notice.hidden = false;
        notice.textContent = DEMO_MESSAGES[kind] ||
          form.querySelector('.notice--demo')?.getAttribute('data-demo-text') ||
          'This is a design preview — this form does not send or store any data.';
      });

      // Re-validate a field live once it has been flagged invalid
      fields.forEach((field) => {
        field.addEventListener('input', () => {
          if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        });
        field.addEventListener('blur', () => {
          if (field.value.trim() || field.getAttribute('aria-invalid') === 'true') validateField(field);
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     12. Board matrix filters
     -------------------------------------------------------------------------- */
  function initMatrix() {
    const matrix = $('[data-matrix]');
    if (!matrix) return;

    const chips = $$('[data-filter]', matrix);
    const items = $$('[data-item]', matrix);
    if (!chips.length || !items.length) return;

    // Multi-select groups (years) vs single-select (paper, level)
    const multiKeys = (matrix.getAttribute('data-multi') || 'year').split(',').map((s) => s.trim());

    // Track active filters: { key: Set(values) }
    const active = new Map();
    chips.forEach((chip) => {
      const [key, value] = chip.getAttribute('data-filter').split('-');
      // data-filter="year-2023" → key "year", value "2023".
      // For keys with hyphens in values (e.g. "paper-1"), split on first hyphen.
      if (!active.has(key)) active.set(key, new Set());
    });

    const matches = (item) => {
      for (const [key, values] of active) {
        if (!values.size) continue; // no filter for this key = show all
        const itemVals = (item.getAttribute(`data-${key}`) || '').split(/\s+/);
        if (![...values].some((v) => itemVals.includes(v))) return false;
      }
      return true;
    };

    const apply = () => {
      let visible = 0;
      items.forEach((item) => {
        const show = matches(item);
        item.hidden = !show;
        if (show) visible++;
      });

      // "No matches" state
      let empty = $('.matrix-empty', matrix);
      if (!visible) {
        if (!empty) {
          empty = document.createElement('p');
          empty.className = 'matrix-empty';
          empty.textContent = 'No questions match the selected filters.';
          items[0].parentElement.appendChild(empty);
        }
        empty.hidden = false;
      } else if (empty) {
        empty.hidden = true;
      }
    };

    chips.forEach((chip) => {
      const [key, ...rest] = chip.getAttribute('data-filter').split('-');
      const value = rest.join('-'); // handles "paper-1" → key "paper", value "1"
      const isMulti = multiKeys.includes(key);

      chip.addEventListener('click', () => {
        const values = active.get(key);
        if (isMulti) {
          if (value === 'all') {
            // "All X" chip: clear this filter group entirely.
            values.clear();
            chips.forEach((c) => {
              const [k] = c.getAttribute('data-filter').split('-');
              if (k === key) {
                c.classList.toggle('is-active', c === chip);
                c.setAttribute('aria-pressed', String(c === chip));
              }
            });
          } else {
            if (values.has(value)) values.delete(value);
            else values.add(value);
            // If any specific value is active, "all" is no longer selected.
            const allChip = chips.find((c) => {
              const [k, v] = c.getAttribute('data-filter').split('-');
              return k === key && v === 'all';
            });
            if (allChip) {
              allChip.classList.toggle('is-active', !values.size);
              allChip.setAttribute('aria-pressed', String(!values.size));
            }
            chip.classList.toggle('is-active', values.has(value));
            chip.setAttribute('aria-pressed', String(values.has(value)));
          }
        } else {
          // Single-select: clicking the active chip clears it
          const wasActive = values.has(value);
          values.clear();
          chips.forEach((other) => {
            const [oKey, ...oRest] = other.getAttribute('data-filter').split('-');
            if (oKey === key) {
              other.classList.remove('is-active');
              other.setAttribute('aria-pressed', 'false');
            }
          });
          if (!wasActive) {
            values.add(value);
            chip.classList.add('is-active');
            chip.setAttribute('aria-pressed', 'true');
          }
        }
        apply();
      });
    });

    apply();
  }

  /* --------------------------------------------------------------------------
     13. Footer year
     -------------------------------------------------------------------------- */
  function initYear() {
    const year = String(new Date().getFullYear());
    $$('[data-footer-year]').forEach((el) => { el.textContent = year; });
  }

  /* --------------------------------------------------------------------------
     Init
     -------------------------------------------------------------------------- */
  const init = () => {
    initHeaderShadow();
    initMegaMenu();
    initMobileNav();
    initSearch();
    initTabs();
    initAccordions();
    initToc();
    initReadingProgress();
    initReveal();
    initBackToTop();
    initDemoForms();
    initMatrix();
    initYear();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // script is deferred — DOM is ready
  }
})();
