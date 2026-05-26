/**
 * Ninetailed / Contentful Personalization — Hydrogen v1 safe init
 *
 * Fetches nt_audience entries from Contentful CDA, passes them to
 * NinetailedPreviewPlugin so the widget shows all available audiences.
 *
 * Uses onProfileChange to swap hero content client-side when the
 * visitor matches the Backcountry Collection Visitors audience.
 */
import {useEffect} from 'react';
import {setNinetailedInstance} from '../lib/ninetailed.client';

const CLIENT_ID      = '3ac91ddb-9b3a-4c7f-9879-d17f306a1be7';
const SPACE_ID       = 't989h97jfgjz';
const DELIVERY_TOKEN = 'AQPcpgRZf6zcXNOjwWGe1lax-wWJF1wnDphYisJ2Psc';
const CDA_BASE       = `https://cdn.contentful.com/spaces/${SPACE_ID}`;

/** Forward-only events for Ninetailed */
const FORWARDED_EVENTS = new Set([
  'Product Viewed','Product Added','Product List Viewed','Collection Clicked',
  'Country Changed','User Signed In','User Registered','Checkout Started','Promotion Viewed',
]);

/** Fetch Contentful entry fields */
async function fetchEntry(entryId) {
  const res = await fetch(`${CDA_BASE}/entries/${entryId}`, {
    headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
  });
  const data = await res.json();
  return data.fields || null;
}

/** Update hero DOM elements with fields from a Contentful entry */
function applyHeroEntry(entryId) {
  fetchEntry(entryId).then(f => {
    if (!f) return;

    // Headline with accent
    const h1 = document.getElementById('hero-headline');
    if (h1 && f.heroHeadline) {
      const accent = f.heroHeadlineAccent || '';
      if (accent) {
        const parts = f.heroHeadline.split(new RegExp(`(${accent})`, 'i'));
        h1.innerHTML = parts.map(p =>
          p.toLowerCase() === accent.toLowerCase()
            ? `<span style="color:#FF481A">${p}</span>` : p
        ).join('');
      } else {
        h1.textContent = f.heroHeadline;
      }
    }

    // Eyebrow
    const eyebrow = document.getElementById('hero-eyebrow');
    if (eyebrow && f.heroEyebrow) eyebrow.textContent = f.heroEyebrow;

    // Subheadline
    const sub = document.getElementById('hero-subheadline');
    if (sub && f.heroSubheadline) sub.textContent = f.heroSubheadline;

    // CTAs
    const cta1 = document.getElementById('hero-cta-primary');
    if (cta1 && f.heroCtaPrimary) cta1.textContent = f.heroCtaPrimary;
    const cta2label = document.querySelector('#hero-cta-secondary span');
    if (cta2label && f.heroCtaSecondary) cta2label.textContent = f.heroCtaSecondary;

    // Product image — fetch from Shopify if handle is __DYNAMIC__ (backcountry variant)
    if (f.heroFeaturedProductHandle && f.heroFeaturedProductHandle !== '__DYNAMIC__') {
      fetch('https://hydrogen-preview.myshopify.com/api/2022-07/graphql.json', {
        method: 'POST',
        headers: {
          'X-Shopify-Storefront-Access-Token': '3b580e70970c4528da70c98e097c2fa0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: `{product(handle:"${f.heroFeaturedProductHandle}"){title featuredImage{url altText}}}` }),
      }).then(r => r.json()).then(d => {
        const img = document.getElementById('nt-hero-img');
        const url = d?.data?.product?.featuredImage?.url;
        if (img && url) { img.src = url; img.style.display = 'block'; }
        const label = document.getElementById('nt-hero-label');
        if (label) label.textContent = d?.data?.product?.title || '';
      }).catch(() => {});
    }

    console.log('[Ninetailed] Hero updated from entry:', entryId);
  }).catch(e => console.warn('[Ninetailed] applyHeroEntry failed:', e.message));
}

/** Wait for hero DOM to be ready then apply entry */
function scheduleApply(entryId, attempts = 0) {
  if (document.getElementById('hero-headline')) {
    applyHeroEntry(entryId);
  } else if (attempts < 8) {
    setTimeout(() => scheduleApply(entryId, attempts + 1), 250);
  }
}

export default function NinetailedInit({country}) {
  useEffect(() => {
    Promise.all([
      import('../lib/ninetailed-bundle.js'),
      fetch(`${CDA_BASE}/entries?content_type=nt_audience&include=0&limit=200`, {
        headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
      }).then(r => r.json()),
    ]).then(([{ Ninetailed, NinetailedPreviewPlugin }, audRes]) => {

      const audiences = (audRes.items || []).map(e => ({
        id:          e.sys.id,
        name:        e.fields?.nt_name        || e.sys.id,
        description: e.fields?.nt_description || '',
      }));

      console.log('[Ninetailed] init with', audiences.length, 'audiences');

      const nt = new Ninetailed(
        { clientId: CLIENT_ID, environment: 'main' },
        { plugins: [ new NinetailedPreviewPlugin({ audiences, experiences: [], ui: { opener: { position: 'bottom-right' } } }) ] }
      );

      setNinetailedInstance(nt);
      console.log('[Ninetailed] ✅ SDK + Preview Plugin ready');

      nt.page({ name: document.title || 'Page', properties: { path: window.location.pathname, url: window.location.href, country } });

      // ── Hero personalisation via onProfileChange ───────────────
      nt.onProfileChange((profileState) => {
        if (!profileState?.profile) return;

        const traits = profileState.profile?.traits || {};
        // Merge with localStorage for reliability (API sometimes returns stale data)
        try {
          const stored = JSON.parse(localStorage.getItem('__nt_profile__') || '{}');
          Object.assign(traits, stored.traits || {});
        } catch {}

        const hasBackcountryTrait =
          traits.viewed_backcountry === true ||
          String(traits.viewed_backcountry) === 'true';

        // Preview Plugin "On" forces audience membership via internal overwrite
        const hasAudienceOverwrite = (profileState.profile?.audiences || [])
          .includes('backcountry-visitors');

        const inBackcountry = hasBackcountryTrait || hasAudienceOverwrite;

        const entryId = inBackcountry
          ? 'homepageSettings-backcountry-variant'
          : 'homepageSettings';

        console.log('[Ninetailed] onProfileChange →', entryId, { inBackcountry, hasBackcountryTrait, hasAudienceOverwrite });
        scheduleApply(entryId);
      });

      // ── Segment → Ninetailed bridge ────────────────────────────
      const analytics = window.analytics;
      if (!analytics) return;
      analytics.ready?.(() => {
        const user = analytics.user?.();
        if (user) nt.identify(user.id?.() || '', { ...user.traits?.(), country });
      });
      analytics.after?.((method, ...args) => {
        if (method === 'identify')                          nt.identify(args[0] || '', { ...args[1], country });
        else if (method === 'page')                         nt.page({ name: args[0] || 'Page', properties: { ...args[1], country } });
        else if (method === 'track' && FORWARDED_EVENTS.has(args[0])) nt.track({ event: args[0], properties: args[1] || {} });
      });

    }).catch(err => console.warn('[Ninetailed] Init failed:', err.message));
  }, []);

  return null;
}
