import {useEffect} from 'react';
import {ecommerce} from '../lib/segment.client';

/**
 * Fires Segment "Product Viewed" event when a PDP mounts.
 * Placed inside ProductOptionsProvider so selectedVariant is available.
 */
export default function SegmentProductView({product}) {
  useEffect(() => {
    if (!product) return;
    const variant = product.variants?.nodes?.[0];
    ecommerce.productViewed(product, variant);
  }, [product?.id]);

  return null; // render nothing
}
