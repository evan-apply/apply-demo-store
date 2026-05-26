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
