/**
 * BackcountryHeroLogic.client.jsx
 *
 * Resolves the backcountry hero product and injects it into the DOM:
 *   1. Last product the user clicked in the backcountry collection (localStorage)
 *   2. Random fallback from the backcountry collection if no history
 *
 * Updates #nt-hero-img and #nt-hero-label directly via DOM.
 * No props needed — safe for Hydrogen v1 server → client boundary.
 */
import {useEffect} from 'react';

const BACKCOUNTRY_HANDLES = [
  'the-huebert-snowboard',
  'the-now-in-3d-snowboard',
  'v3-the-dev-snowboard',
  'the-apex',
  'the-ascend',
];

const LS_KEY = 'nt_last_backcountry_product';

/** Call this when user views a product from the backcountry collection */
export function trackBackcountryProductView(handle) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, handle); } catch {}
}

function resolveHandle() {
  try {
    const last = localStorage.getItem(LS_KEY);
    if (last && BACKCOUNTRY_HANDLES.includes(last)) return last;
  } catch {}
  // Random fallback
  return BACKCOUNTRY_HANDLES[Math.floor(Math.random() * BACKCOUNTRY_HANDLES.length)];
}

export default function BackcountryHeroLogic() {
  useEffect(() => {
    const handle = resolveHandle();
    if (!handle) return;

    // Fetch product image from Shopify Storefront API
    fetch('https://hydrogen-preview.myshopify.com/api/2022-07/graphql.json', {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': '3b580e70970c4528da70c98e097c2fa0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{ product(handle:"${handle}") { title featuredImage { url altText } } }`
      }),
    })
      .then(r => r.json())
      .then(d => {
        const product = d?.data?.product;
        if (!product) return;

        // Inject image
        const img = document.getElementById('nt-hero-img');
        if (img && product.featuredImage?.url) {
          img.src    = product.featuredImage.url;
          img.alt    = product.featuredImage.altText || product.title;
          img.style.display = 'block';
        }

        // Inject label
        const label = document.getElementById('nt-hero-label');
        if (label) label.textContent = product.title;
      })
      .catch(() => {});
  }, []);

  return null;
}
