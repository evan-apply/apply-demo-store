/**
 * Ninetailed / Contentful Personalization — Hydrogen v1 safe init
 *
 * Fetches nt_audience + nt_experience entries from Contentful,
 * passes them to NinetailedPreviewPlugin so the preview widget
 * shows all available audiences.
 */
import {useEffect} from 'react';
import {setNinetailedInstance} from '../lib/ninetailed.client';

const CLIENT_ID       = '3ac91ddb-9b3a-4c7f-9879-d17f306a1be7';
const SPACE_ID        = 't989h97jfgjz';
const DELIVERY_TOKEN  = 'AQPcpgRZf6zcXNOjwWGe1lax-wWJF1wnDphYisJ2Psc';
const CDA_BASE        = `https://cdn.contentful.com/spaces/${SPACE_ID}`;

/** Fetch audiences + experiences from Contentful and map to Ninetailed format */
async function fetchNinetailedData() {
  const [audRes, expRes] = await Promise.all([
    fetch(`${CDA_BASE}/entries?content_type=nt_audience&include=0&limit=200`, {
      headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
    }).then(r => r.json()),
    fetch(`${CDA_BASE}/entries?content_type=nt_experience&include=2&limit=200`, {
      headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
    }).then(r => r.json()),
  ]);

  return { audienceEntries: audRes, experienceEntries: expRes };
}

/** Selective event forwarding to Ninetailed */
const FORWARDED_EVENTS = new Set([
  'Product Viewed', 'Product Added', 'Product List Viewed', 'Collection Clicked',
  'Country Changed', 'User Signed In', 'User Registered', 'Checkout Started', 'Promotion Viewed',
]);

export default function NinetailedInit({country}) {
  useEffect(() => {
    Promise.all([
      import('../lib/ninetailed-bundle.js'),
      fetchNinetailedData(),
    ]).then(([{ Ninetailed, NinetailedPreviewPlugin }, { audienceEntries, experienceEntries }]) => {

      // Map Contentful CDA entries → Ninetailed ExposedAudienceDefinition / ExperienceConfiguration
      const audiences = (audienceEntries.items || []).map(e => ({
        id:          e.sys.id,
        name:        e.fields?.nt_name        || e.sys.id,
        description: e.fields?.nt_description || '',
      }));

      // Keep experiences simple — Preview Plugin primarily needs audiences for the switcher
      // Experiences with complex config can cause render errors in the widget
      const experiences = [];

      console.log('[Ninetailed] Loading with', audiences.length, 'audiences,', experiences.length, 'experiences');

      const nt = new Ninetailed(
        { clientId: CLIENT_ID, environment: 'main' },
        {
          plugins: [
            new NinetailedPreviewPlugin({
              audiences,    // ← ExposedAudienceDefinition[]
              experiences,  // ← ExperienceConfiguration[]
              ui: { opener: { position: 'bottom-right' } },
            }),
          ],
        }
      );

      setNinetailedInstance(nt);
      console.log('[Ninetailed] ✅ SDK + Preview Plugin ready');

      // Fire initial page view
      nt.page({
        name:       document.title || 'Page',
        properties: { path: window.location.pathname, url: window.location.href, country },
      });

      // Listen for audience changes — swap hero content when profile changes
      nt.onProfileChange((profileState) => {
        if (!profileState?.profile) return;
        const traits = profileState.profile.traits || {};
        const inBackcountryAudience = traits.viewed_backcountry === true ||
                                       traits.viewed_backcountry === 'true';

        // Fetch the correct CMS entry and update the hero copy
        const entryId = inBackcountryAudience
          ? 'homepageSettings-backcountry-variant'
          : 'homepageSettings';

        fetch(`https://cdn.contentful.com/spaces/${SPACE_ID}/entries/${entryId}`, {
          headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
        }).then(r => r.json()).then(entry => {
          const f = entry.fields;
          if (!f) return;

          // Update headline
          const h1 = document.querySelector('#hero-headline');
          if (h1 && f.heroHeadline) {
            const accent = f.heroHeadlineAccent || '';
            const parts  = f.heroHeadline.split(new RegExp(`(${accent})`, 'i'));
            h1.innerHTML  = parts.map(p =>
              p.toLowerCase() === accent.toLowerCase()
                ? `<span style="color:#FF481A">${p}</span>`
                : p
            ).join('');
          }

          // Update eyebrow
          const eyebrow = document.querySelector('#hero-eyebrow');
          if (eyebrow && f.heroEyebrow) eyebrow.textContent = f.heroEyebrow;

          // Update subheadline
          const sub = document.querySelector('#hero-subheadline');
          if (sub && f.heroSubheadline) sub.textContent = f.heroSubheadline;

          // Update CTAs
          const cta1 = document.querySelector('#hero-cta-primary');
          if (cta1 && f.heroCtaPrimary) cta1.textContent = f.heroCtaPrimary;
          const cta2 = document.querySelector('#hero-cta-secondary span');
          if (cta2 && f.heroCtaSecondary) cta2.textContent = f.heroCtaSecondary;

          // Trigger BackcountryHeroLogic if variant
          if (inBackcountryAudience && f.heroFeaturedProductHandle === '__DYNAMIC__') {
            window.dispatchEvent(new CustomEvent('nt:backcountry-audience', { detail: { active: true } }));
          } else if (!inBackcountryAudience && f.heroFeaturedProductHandle) {
            // Restore default product image
            fetch(`https://hydrogen-preview.myshopify.com/api/2022-07/graphql.json`, {
              method: 'POST',
              headers: {
                'X-Shopify-Storefront-Access-Token': '3b580e70970c4528da70c98e097c2fa0',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: `{ product(handle:"${f.heroFeaturedProductHandle}"){title featuredImage{url altText}} }` }),
            }).then(r => r.json()).then(d => {
              const img = document.getElementById('nt-hero-img');
              const url = d?.data?.product?.featuredImage?.url;
              if (img && url) { img.src = url; img.style.display = 'block'; }
              const label = document.getElementById('nt-hero-label');
              if (label) label.textContent = d?.data?.product?.title || '';
            }).catch(() => {});
          }
        }).catch(() => {});
      });

      // Bridge Segment → Ninetailed
      const analytics = window.analytics;
      if (!analytics) return;

      analytics.ready?.(() => {
        const user = analytics.user?.();
        if (user) nt.identify(user.id?.() || '', { ...user.traits?.(), country });
      });

      analytics.after?.((method, ...args) => {
        if (method === 'identify') {
          nt.identify(args[0] || '', { ...args[1], country });
        } else if (method === 'page') {
          nt.page({ name: args[0] || 'Page', properties: { ...args[1], country } });
        } else if (method === 'track' && FORWARDED_EVENTS.has(args[0])) {
          nt.track({ event: args[0], properties: args[1] || {} });
        }
      });

    }).catch(err => console.warn('[Ninetailed] Init failed:', err.message));
  }, []);

  return null;
}
