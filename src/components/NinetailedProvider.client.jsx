/**
 * Ninetailed / Contentful Personalization — Hydrogen v1 safe init
 *
 * Two responsibilities:
 *  1. Initialise the Ninetailed SDK with the Preview Plugin
 *  2. Forward SPECIFIC Segment events to Ninetailed (not everything)
 *
 * Events forwarded to Ninetailed (audience-building relevant):
 *   - identify()          → always (user traits / profile enrichment)
 *   - page()              → always (page context)
 *   - Product Viewed      → product interest signal
 *   - Product Added       → purchase intent signal
 *   - Country Changed     → geo-personalisation trigger
 *   - User Signed In      → loyalty / returning user signal
 *   - User Registered     → new user signal
 *
 * Events NOT forwarded (noise):
 *   - Cart Viewed, Test Event, internal tracking events, etc.
 */
import {useEffect} from 'react';
import {setNinetailedInstance} from '../lib/ninetailed.client';

const CLIENT_ID = '3ac91ddb-9b3a-4c7f-9879-d17f306a1be7';

/**
 * Events that are meaningful for audience building in Contentful Personalization.
 * Only these track() events are forwarded — everything else is ignored.
 */
const FORWARDED_TRACK_EVENTS = new Set([
  'Product Viewed',
  'Product Added',
  'Product List Viewed',
  'Collection Clicked',
  'Country Changed',
  'User Signed In',
  'User Registered',
  'Checkout Started',
  'Promotion Viewed',
]);

export default function NinetailedInit({country}) {
  useEffect(() => {
    import('../lib/ninetailed-bundle.js').then(({Ninetailed, NinetailedPreviewPlugin}) => {

      const nt = new Ninetailed(
        // Required: API client options
        { clientId: CLIENT_ID, environment: 'main' },
        // Optional: plugins
        {
          plugins: [
            new NinetailedPreviewPlugin({
              // The preview widget floats in bottom-right corner
              // Only visible when ?nt_preview=true in URL or in Contentful preview
              ui: { opener: { position: 'bottom-right' } },
            }),
          ],
        }
      );

      setNinetailedInstance(nt);
      console.log('[Ninetailed] ✅ SDK + Preview Plugin ready');

      // Fire initial page view so a profile gets created immediately
      nt.page({
        name:       document.title || 'Page',
        properties: { path: window.location.pathname, url: window.location.href, country },
      });

      // ── Bridge: selective Segment → Ninetailed forwarding ──
      const analytics = window.analytics;
      if (!analytics) return;

      // Sync current Segment identity to Ninetailed on init
      analytics.ready?.(() => {
        const user = analytics.user?.();
        if (user) {
          nt.identify(user.id?.() || '', { ...user.traits?.(), country });
        }
      });

      // Forward only relevant future events
      analytics.after?.((method, ...args) => {

        if (method === 'identify') {
          // Always forward identify — it's the core profile enrichment
          const [userId, traits = {}] = args;
          nt.identify(userId || '', { ...traits, country });

        } else if (method === 'page') {
          // Always forward page — gives Ninetailed URL/referrer context
          const [name, props = {}] = args;
          nt.page({ name: name || 'Page', properties: { ...props, country } });

        } else if (method === 'track') {
          // Only forward events that help build meaningful audiences
          const [event, props = {}] = args;
          if (FORWARDED_TRACK_EVENTS.has(event)) {
            nt.track({ event, properties: props });
          }
        }
      });

    }).catch(err => console.warn('[Ninetailed] Load failed:', err.message));
  }, []);

  return null;
}
