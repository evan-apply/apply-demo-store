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
  getAnalytics()?.identify(traits);
  import('./ninetailed.client').then(({ntIdentify}) => ntIdentify('', traits)).catch(() => {});
}

export function page(name, properties = {}) {
  getAnalytics()?.page(name, properties);
  import('./ninetailed.client').then(({ntPage}) => ntPage(name, properties)).catch(() => {});
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

  /** PDP load → Product Viewed */
  productViewed(product, variant) {
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

  /** Add to Cart → Product Added */
  productAdded(product, variant, quantity = 1) {
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
