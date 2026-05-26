/**
 * Ninetailed / Contentful Personalization — Hydrogen v1 safe init
 *
 * Uses dynamic import() inside useEffect so the SDK is NEVER evaluated
 * server-side (Hydrogen v1 evaluates .client.jsx during SSR for initial
 * HTML, which breaks packages that use Node.js-only modules at the top level).
 */
import {useEffect} from 'react';
import {setNinetailedInstance} from '../lib/ninetailed.client';

const CLIENT_ID = '3ac91ddb-9b3a-4c7f-9879-d17f306a1be7';

export default function NinetailedInit({country}) {
  useEffect(() => {
    // Import from the pre-built browser-safe bundle (avoids Node.js deps in Vite 2)
    import('../lib/ninetailed-bundle.js').then(({Ninetailed}) => {
      const nt = new Ninetailed({
        clientId: CLIENT_ID,
        environment: 'main',
      });

      setNinetailedInstance(nt);
      console.log('[Ninetailed] ✅ SDK ready, clientId:', CLIENT_ID.slice(0, 8) + '...');

      // Fire initial page view immediately so the profile gets created
      nt.page({
        name:       document.title || 'Page',
        properties: {
          path:    window.location.pathname,
          url:     window.location.href,
          country,
        },
      });

      const analytics = window.analytics;

      // Forward current identity
      analytics?.ready?.(() => {
        const user = analytics.user?.();
        if (user) {
          nt.identify(user.id?.() || '', { ...user.traits?.(), country });
        }
      });

      // Mirror all future Segment calls → Ninetailed
      analytics?.after?.((method, ...args) => {
        if (method === 'identify') {
          const [userId, traits = {}] = args;
          nt.identify(userId || '', { ...traits, country });
        } else if (method === 'track') {
          nt.track({ event: args[0], properties: args[1] || {} });
        } else if (method === 'page') {
          nt.page({ name: args[0], properties: args[1] || {} });
        }
      });

    }).catch(err => console.warn('[Ninetailed] Load failed:', err.message));
  }, []); // run once on mount

  return null;
}
