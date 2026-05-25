import {Suspense} from 'react';
import {Image, Link} from '@shopify/hydrogen';

import MoneyCompareAtPrice from './MoneyCompareAtPrice.client';
import MoneyPrice from './MoneyPrice.client';

/**
 * Apply Digital — Editorial Momentum
 * Product card: warm white bg, 8px radius, orange badge, hover scale
 */
export default function ProductCard({product}) {
  const selectedVariant = product.variants.edges[0].node;

  if (selectedVariant == null) return null;

  return (
    <div className="group relative">
      <Link to={`/products/${product.handle}`}>
        {/* Image container */}
        <div className="relative overflow-hidden rounded-lg bg-white border border-[#E5E7EB] mb-3 aspect-square">
          {selectedVariant.image ? (
            <Image
              className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-500 ease-in-out group-hover:scale-105"
              data={selectedVariant.image}
            />
          ) : (
            <div className="absolute inset-0 bg-[#F3F3F4] flex items-center justify-center">
              <span className="text-[#6D6A63] text-sm" style={{fontFamily: "'Space Grotesk', sans-serif"}}>No image</span>
            </div>
          )}

          {/* Out of stock badge */}
          {!selectedVariant?.availableForSale && (
            <div className="absolute top-3 left-3 bg-[#282A33] text-white text-[11px] font-medium tracking-[0.06em] uppercase px-3 py-1.5 rounded-full"
              style={{fontFamily: "'Space Grotesk', sans-serif"}}>
              Out of stock
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-1">
          <h3
            className="text-[#282A33] font-semibold text-[15px] leading-snug group-hover:text-[#FF481A] transition-colors"
            style={{fontFamily: "'Space Grotesk', sans-serif"}}
          >
            {product.title}
          </h3>

          {product.vendor && (
            <p className="text-[#6D6A63] text-[13px] tracking-[0.04em] uppercase"
              style={{fontFamily: "'Space Grotesk', sans-serif"}}>
              {product.vendor}
            </p>
          )}

          <div className="flex items-baseline gap-2 pt-0.5">
            {selectedVariant.compareAtPriceV2 && (
              <Suspense fallback={null}>
                <span className="text-[#6D6A63] line-through text-sm">
                  <MoneyCompareAtPrice money={selectedVariant.compareAtPriceV2} />
                </span>
              </Suspense>
            )}
            <Suspense fallback={null}>
              <span className="text-[#282A33] font-semibold text-[15px]" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                <MoneyPrice money={selectedVariant.priceV2} />
              </span>
            </Suspense>
          </div>
        </div>
      </Link>
    </div>
  );
}
