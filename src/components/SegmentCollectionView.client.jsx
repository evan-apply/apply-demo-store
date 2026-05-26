import {useEffect} from 'react';
import {ecommerce, anonymousIdentify, incrementSessionCount} from '../lib/segment.client';

/**
 * Fires events + sends audience trait when a collection page loads.
 *
 * The trait pattern: viewed_{collection_handle} = true
 * flows via the Ninetailed destination → Contentful Personalization.
 *
 * To add a new audience in Contentful (NO code change needed):
 *   When someone visits /collections/backcountry → trait: viewed_backcountry: true
 *   When someone visits /collections/freestyle  → trait: viewed_freestyle: true
 *   Contentful Optimization → New Audience → Rule: viewed_backcountry == true
 *
 * If you later upgrade to Segment Engage:
 *   Remove this file's identify call — Segment will handle it automatically.
 */
export default function SegmentCollectionView({collection, products}) {
  useEffect(() => {
    if (!collection) return;

    const handle = collection.handle?.toLowerCase() || '';

    // 1. Standard e-commerce event (Segment Engage will use this if/when upgraded)
    ecommerce.productListViewed(collection, products || []);

    // 2. Send audience trait directly via identify → Ninetailed destination
    //    This is the free-tier equivalent of Segment Engage audiences.
    //    The Ninetailed destination forwards this to Contentful Personalization.
    if (handle) {
      anonymousIdentify({
        [`viewed_${handle}`]:         true,
        last_collection_viewed:       collection.title,
        last_collection_handle:       handle,
      });
    }

    incrementSessionCount('collection_views');

  }, [collection?.id]);

  return null;
}
