import {useEffect} from 'react';
import {ecommerce} from '../lib/segment.client';

/**
 * Fires Segment "Product List Viewed" when a collection page mounts.
 */
export default function SegmentCollectionView({collection, products}) {
  useEffect(() => {
    if (!collection) return;
    ecommerce.productListViewed(collection, products || []);
  }, [collection?.id]);

  return null;
}
