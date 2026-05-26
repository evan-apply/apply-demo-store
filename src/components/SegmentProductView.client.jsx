import {useEffect} from 'react';
import {ecommerce} from '../lib/segment.client';
import {trackBackcountryProductView} from './BackcountryHeroLogic.client';

/**
 * Fires Segment "Product Viewed" event when a PDP mounts.
 * Placed inside ProductOptionsProvider so selectedVariant is available.
 */
export default function SegmentProductView({product}) {
  useEffect(() => {
    if (!product) return;
    const variant = product.variants?.nodes?.[0];
    ecommerce.productViewed(product, variant);

    // Track backcountry products so the hero can show the last clicked one
    const BACKCOUNTRY = ['the-huebert-snowboard','the-now-in-3d-snowboard',
      'v3-the-dev-snowboard','the-apex','the-ascend'];
    if (BACKCOUNTRY.includes(product.handle)) {
      trackBackcountryProductView(product.handle);
    }
  }, [product?.id]);

  return null; // render nothing
}
