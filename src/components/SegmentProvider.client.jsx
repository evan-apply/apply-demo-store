import {useEffect, useRef} from 'react';
import {page, anonymousIdentify} from '../lib/segment.client';

/**
 * Apply Demo Store — Segment Provider (client component)
 * Fires page() on every render (route change) and sets geo traits once.
 */
export default function SegmentProvider({country, children}) {
  const prevPathRef = useRef(null);
  const geoSentRef  = useRef(false);

  // Fire page view whenever the path changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (prevPathRef.current === currentPath) return;
    prevPathRef.current = currentPath;

    page(getPageName(currentPath), {
      path:     currentPath,
      url:      window.location.href,
      referrer: document.referrer,
      title:    document.title,
      country:  country || 'unknown',
    });
  });

  // Set geo traits once on first load
  useEffect(() => {
    if (geoSentRef.current || !country) return;
    geoSentRef.current = true;
    anonymousIdentify({
      country,
      locale:   navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, [country]);

  return children;
}

function getPageName(path) {
  if (path === '/')                           return 'Home';
  if (path.startsWith('/products/'))          return 'Product Detail';
  if (path.startsWith('/collections/'))       return 'Collection';
  if (path.startsWith('/cart'))               return 'Cart';
  if (path.startsWith('/account/login'))      return 'Login';
  if (path.startsWith('/account'))            return 'Account';
  if (path.startsWith('/checkout'))           return 'Checkout';
  return 'Page';
}
