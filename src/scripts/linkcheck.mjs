#!/usr/bin/env node
/** linkcheck.mjs — verify every internal link & asset reference in site/. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const routes = new Set(['404.html']);
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else routes.add(path.relative(SITE, p));
  }
})(SITE);

const badLinks = [], relLeft = [], badAssets = [];
let pages = 0, intLinks = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith('.html')) continue;
    pages++;
    const html = fs.readFileSync(p, 'utf8');
    const rel = path.relative(SITE, p);
    for (const m of html.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
      intLinks++;
      const t = m[1].replace(/^\/+/, '').replace(/\/+$/, '');
      if (t.startsWith('assets/')) continue;
      const target = t === '' ? 'index.html' : t.endsWith('.html') ? t : t + '/index.html';
      if (!routes.has(target)) badLinks.push(`${rel} -> ${m[1]}`);
    }
    for (const m of html.matchAll(/(src|href)="([^"]+)"/g)) {
      const u = m[2];
      if (u.startsWith('/assets/')) {
        const t = path.join(SITE, u.split('#')[0]);
        if (!fs.existsSync(t)) badAssets.push(`${rel} -> ${u}`);
      } else if (!/^(https?:|\/|#|mailto:|tel:|data:)/.test(u)) {
        relLeft.push(`${rel} -> ${u}`);
      }
    }
  }
})(SITE);

console.log(`pages: ${pages} | /-links: ${intLinks}`);
console.log(`broken /-links: ${badLinks.length}`);
[...new Set(badLinks)].slice(0, 25).forEach((x) => console.log('  ' + x));
console.log(`broken asset refs: ${badAssets.length}`);
[...new Set(badAssets)].slice(0, 10).forEach((x) => console.log('  ' + x));
console.log(`relative hrefs left: ${relLeft.length}`);
[...new Set(relLeft)].slice(0, 10).forEach((x) => console.log('  ' + x));
