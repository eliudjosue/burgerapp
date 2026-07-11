#!/usr/bin/env node
/**
 * Generates public/sitemap.xml before the Angular build.
 *
 * Required env vars (set in Vercel dashboard, or locally in .env):
 *   SUPABASE_URL      — Supabase project URL
 *   SUPABASE_ANON_KEY — Supabase anon (public) key
 *   SITE_URL          — Production domain, e.g. https://burgers.com
 *
 * If Supabase vars are missing or the request fails, the script writes a
 * static-only sitemap (home + catalog) and exits 0 so the build continues.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── Load .env if present (local development) ─────────────────────────────
try {
  const envPath = resolve(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] ??= val;
    }
    console.log('[sitemap] Loaded .env');
  }
} catch {
  // .env is optional — keep going
}

// ─── Config ───────────────────────────────────────────────────────────────
const SITE_URL      = (process.env.SITE_URL ?? 'https://TU-DOMINIO-AQUI.com').replace(/\/$/, '');
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY;

/** Static pages always included — no staff/cart/checkout */
const STATIC_PAGES = [
  { path: '/',        changefreq: 'daily',  priority: '1.0' },
  { path: '/catalog', changefreq: 'daily',  priority: '0.9' },
];

// ─── XML helpers ──────────────────────────────────────────────────────────
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod)    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function w3cDate(iso) {
  // Convert ISO timestamptz → YYYY-MM-DD (valid W3C date for sitemaps)
  return iso ? iso.slice(0, 10) : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('[sitemap] Generating…');

  const entries = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    entries.push(urlEntry({
      loc: `${SITE_URL}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
    }));
  }

  // Dynamic product pages
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[sitemap] ⚠  SUPABASE_URL / SUPABASE_ANON_KEY not set — skipping product URLs.');
  } else {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('is_active', true);

      if (error) throw error;

      console.log(`[sitemap] ${products.length} active product(s) found.`);
      for (const p of products) {
        entries.push(urlEntry({
          loc:        `${SITE_URL}/product/${p.id}`,
          lastmod:    w3cDate(p.updated_at),
          changefreq: 'weekly',
          priority:   '0.7',
        }));
      }
    } catch (err) {
      console.warn(`[sitemap] ⚠  Supabase error: ${err.message}`);
      console.warn('[sitemap]    Falling back to static-only sitemap.');
    }
  }

  // Write XML
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  const publicDir = resolve(ROOT, 'public');
  mkdirSync(publicDir, { recursive: true });
  const outPath = resolve(publicDir, 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');

  console.log(`[sitemap] ✔ ${outPath} — ${entries.length} URL(s) written.`);
}

// Never exit 1 — Supabase failures must not break the Angular build
main().catch((err) => {
  console.error('[sitemap] ⚠  Unexpected error (build will continue):', err.message);
});
