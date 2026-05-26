/**
 * Apply Demo Store — Segment Analytics Client
 * Write Key: Auow5Mz9AvCpknkmhduZFGcBivvwziDO
 *
 * Uses window.analytics loaded by the snippet in index.html.
 * Safe for Hydrogen v1 (no ESM import, no SSR issues).
 */

function getAnalytics() {
  if (typeof window === 'undefined') return null;
  return window.analytics || null;
}

/* ─── Core wrappers ──────────────────────────────────────── */

export function track(event, properties = {}) {
  const props = { ...properties, source: 'apply-demo-store' };
  getAnalytics()?.track(event, props);
  // Mirror to Ninetailed (lazy import avoids SSR issues)
  import('./ninetailed.client').then(({ntTrack}) => ntTrack(event, props)).catch(() => {});
}

export function identify(userId, traits = {}) {
  getAnalytics()?.identify(userId, traits);
  import('./ninetailed.client').then(({ntIdentify}) => ntIdentify(userId, traits)).catch(() => {});
}

export function anonymousIdentify(traits = {}) {
  // Persist country to sessionStorage so enrichAndIdentify can use it
  if (traits.country && typeof window !== 'undefined') {
    sessionStorage.setItem('apply_country', traits.country);
  }
  getAnalytics()?.identify(traits);
  import('./ninetailed.client').then(({ntIdentify}) => ntIdentify('', traits)).catch(() => {});
}

export function page(name, properties = {}) {
  getAnalytics()?.page(name, properties);
  import('./ninetailed.client').then(({ntPage}) => ntPage(name, properties)).catch(() => {});
}

/* ─── Audience trait enrichment ─────────────────────────────
 *
 * These are the traits Contentful Personalization uses to match audiences.
 * Call enrichAndIdentify() whenever meaningful behaviour happens so both
 * Segment profiles AND Ninetailed profiles stay up to date.
 *
 * In Contentful Optimization → Audiences, create rules like:
 *   country == 'CA'
 *   product_views_count >= 3
 *   high_intent == true
 *   is_returning_visitor == true
 * ─────────────────────────────────────────────────────────── */

/** Session-level counters stored in sessionStorage */
function getSessionCounts() {
  try {
    return JSON.parse(sessionStorage.getItem('nt_session_counts') || '{}');
  } catch { return {}; }
}
function setSessionCounts(counts) {
  try { sessionStorage.setItem('nt_session_counts', JSON.stringify(counts)); } catch {}
}

/**
 * Compute audience-ready traits from session behaviour and send to
 * BOTH Segment (for profile enrichment) AND Ninetailed (for real-time matching).
 *
 * Call this whenever something meaningful happens — product view, add-to-cart, etc.
 */
export function enrichAndIdentify(userId, baseTraits = {}) {
  if (typeof window === 'undefined') return;

  const counts = getSessionCounts();

  // Compute derived traits
  const enriched = {
    ...baseTraits,

    // Geo — from Contentful geo-detection
    country:  baseTraits.country || sessionStorage.getItem('apply_country') || 'unknown',

    // Engagement depth
    product_views_count:     counts.product_views     || 0,
    collection_views_count:  counts.collection_views  || 0,
    cart_adds_count:         counts.cart_adds         || 0,

    // Derived audience flags — these become audience rules in Contentful
    high_intent:          (counts.product_views || 0) >= 2 || (counts.cart_adds || 0) >= 1,
    is_active_shopper:    (counts.product_views || 0) >= 3,
    has_added_to_cart:    (counts.cart_adds || 0) >= 1,
    is_returning_visitor: !!localStorage.getItem('nt_has_visited_before'),

    // Session meta
    session_page_views: counts.page_views || 0,
  };

  // Mark as returning on next visit
  localStorage.setItem('nt_has_visited_before', '1');

  // Send to Segment (enriches the profile in Segment Profiles)
  if (userId) {
    getAnalytics()?.identify(userId, enriched);
    import('./ninetailed.client').then(({ntIdentify}) => ntIdentify(userId, enriched)).catch(() => {});
  } else {
    getAnalytics()?.identify(enriched);
    import('./ninetailed.client').then(({ntIdentify}) => ntIdentify('', enriched)).catch(() => {});
  }
}

/** Increment a session counter (call on meaningful events) */
export function incrementSessionCount(key) {
  if (typeof window === 'undefined') return;
  const counts = getSessionCounts();
  counts[key] = (counts[key] || 0) + 1;
  setSessionCounts(counts);
}

/* ─── Identity helpers ───────────────────────────────────── */

/**
 * Called when a known user logs in.
 * userId = Shopify GID stripped to numeric ID, or email as fallback.
 */
export function identifyUser(userId, traits = {}) {
  const a = getAnalytics();
  if (!a) return;
  if (userId) {
    a.identify(userId, traits);
  } else {
    a.identify(traits); // anonymous identify when no userId yet
  }
}

/** Called on logout — clears the anonymous/identified profile */
export function resetIdentity() {
  getAnalytics()?.reset();
}

/** Strip Shopify GID to a plain numeric ID */
export function shopifyIdToUserId(gid = '') {
  return gid.split('/').pop() || null;
}

/* ─── E-Commerce helpers (Segment E-Commerce Spec) ──────── */

export const ecommerce = {

  /** PDP load → Product Viewed + increment product_views */
  productViewed(product, variant) {
    incrementSessionCount('product_views');
    enrichAndIdentify(null, {}); // re-compute high_intent / is_active_shopper
    track('Product Viewed', {
      product_id: product.id,
      sku:        variant?.sku || product.handle,
      name:       product.title,
      brand:      product.vendor,
      category:   'Snowboards',
      variant:    variant?.title,
      price:      parseFloat(variant?.priceV2?.amount || 0),
      currency:   variant?.priceV2?.currencyCode || 'USD',
      url:        typeof window !== 'undefined' ? window.location.href : '',
      image_url:  variant?.image?.url || product.featuredImage?.url,
    });
  },

  /** Collection page → Product List Viewed */
  productListViewed(collection, products) {
    track('Product List Viewed', {
      list_id:  collection.id,
      category: collection.title,
      products: (products || []).map((p, i) => ({
        product_id: p.id,
        sku:        p.handle,
        name:       p.title,
        price:      parseFloat(p.variants?.edges?.[0]?.node?.priceV2?.amount || 0),
        position:   i + 1,
        category:   collection.title,
      })),
    });
  },

  /** Add to Cart → Product Added + increment cart_adds */
  productAdded(product, variant, quantity = 1) {
    incrementSessionCount('cart_adds');
    enrichAndIdentify(null, {}); // re-compute has_added_to_cart = true
    track('Product Added', {
      cart_id:    getCartId(),
      product_id: product.id,
      sku:        variant?.sku || product.handle,
      name:       product.title,
      brand:      product.vendor,
      variant:    variant?.title,
      price:      parseFloat(variant?.priceV2?.amount || 0),
      currency:   variant?.priceV2?.currencyCode || 'USD',
      quantity,
      image_url:  variant?.image?.url,
    });
  },

  /** Cart drawer opened */
  cartViewed(cartItems, total, currency) {
    track('Cart Viewed', {
      cart_id:  getCartId(),
      products: cartItems,
      total,
      currency,
    });
  },

  /** Hero banner in viewport */
  promotionViewed(name, position = 'hero') {
    track('Promotion Viewed', {
      promotion_id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      position,
      creative: 'hero-banner',
    });
  },

  /** Editorial collection tile clicked */
  collectionClicked(collection, position) {
    track('Collection Clicked', {
      collection_id:   collection.id,
      collection_name: collection.title,
      position,
    });
  },

  /** Country changed — geo or manual */
  countryChanged(fromCode, toCode, method = 'manual') {
    track('Country Changed', {
      from_country:     fromCode,
      to_country:       toCode,
      detection_method: method,
    });
    anonymousIdentify({country: toCode});
  },
};

/* ─── Internal helpers ───────────────────────────────────── */
function getCartId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem('apply_cart_id');
  if (!id) {
    id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('apply_cart_id', id);
  }
  return id;
}
