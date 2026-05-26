import {useEffect} from 'react';
import {ecommerce, incrementSessionCount} from '../lib/segment.client';

/**
 * Fires Segment "Product List Viewed" when a collection page mounts.
 *
 * Audience Strategy: We do NOT hardcode audience traits here.
 * Segment Engage computes audiences from this event and pushes
 * identify() traits to Contentful via the Ninetailed destination.
 *
 * To create a new audience (e.g. "Backcountry Visitors"):
 *   1. Segment Engage → New Audience
 *      Rule: event "Product List Viewed" WHERE category = "Backcountry Collection"
 *   2. Connect "Ninetailed by Contentful" destination to that audience
 *      Trait name: "backcountry_visitors"
 *   3. Contentful Optimization → New Audience
 *      Rule: backcountry_visitors == true
 *   → No code changes needed for any future audience.
 */
export default function SegmentCollectionView({collection, products}) {
  useEffect(() => {
    if (!collection) return;

    // Fires "Product List Viewed" — this is what Segment Engage uses
    // to compute audience membership (e.g. who visited Backcountry)
    ecommerce.productListViewed(collection, products || []);

    // Track collection view count for session-level signals
    incrementSessionCount('collection_views');

  }, [collection?.id]);

  return null;
}
