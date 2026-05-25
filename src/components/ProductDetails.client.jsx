import {
  useProductOptions,
  ProductPrice,
  AddToCartButton,
  BuyNowButton,
  ProductOptionsProvider,
} from '@shopify/hydrogen';
import ProductOptions from './ProductOptions.client';
import Gallery from './Gallery.client';
import SegmentProductView from './SegmentProductView.client';
import {ecommerce} from '../lib/segment.client';

function AddToCartMarkup({product}) {
  const {selectedVariant} = useProductOptions();
  const isOutOfStock = !selectedVariant?.availableForSale;

  return (
    <div className="space-y-3 mb-8">
      <AddToCartButton
        disabled={isOutOfStock}
        style={{
          display: 'block',
          width: '100%',
          padding: '16px 24px',
          backgroundColor: isOutOfStock ? '#E5E7EB' : '#282A33',
          color: isOutOfStock ? '#9D9A93' : '#FFFFFF',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        className={isOutOfStock ? '' : 'hover:bg-[#FF481A]'}
        onClick={() => {
          if (!isOutOfStock && product) {
            ecommerce.productAdded(product, selectedVariant, 1);
          }
        }}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </AddToCartButton>

      {!isOutOfStock && (
        <BuyNowButton
          variantId={selectedVariant?.id}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px 24px',
            backgroundColor: 'transparent',
            color: '#282A33',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
        >
          Buy Now
        </BuyNowButton>
      )}
    </div>
  );
}

function ProductPrices({product}) {
  const {selectedVariant} = useProductOptions();
  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: '10px', margin: '12px 0 20px'}}>
      <ProductPrice
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px',
          color: '#9D9A93',
          textDecoration: 'line-through',
        }}
        priceType="compareAt"
        variantId={selectedVariant?.id}
        data={product}
      />
      <ProductPrice
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '22px',
          fontWeight: 700,
          color: '#282A33',
          letterSpacing: '-0.02em',
        }}
        variantId={selectedVariant?.id}
        data={product}
      />
    </div>
  );
}

export default function ProductDetails({product}) {
  const initialVariant = product.variants.nodes[0];

  // Safely get contentful data
  const contentfulProduct = (() => {
    try {
      return product.contentful?.data?.productCollection?.items?.[0] ?? null;
    } catch {
      return null;
    }
  })();

  return (
    <ProductOptionsProvider data={product} initialVariantId={initialVariant?.id}>
      {/* Segment: fires Product Viewed */}
      <SegmentProductView product={product} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          padding: '48px 0 80px',
          alignItems: 'start',
        }}
        className="grid-cols-1 md:grid-cols-2"
      >
        {/* Left: Gallery */}
        <Gallery product={product} />

        {/* Right: Product info */}
        <div>
          {/* Vendor */}
          {product.vendor && (
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#9D9A93',
              marginBottom: '10px',
            }}>
              {product.vendor}
            </p>
          )}

          {/* Title */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#282A33',
            marginBottom: '4px',
          }}>
            {product.title}
          </h1>

          {/* Prices */}
          <ProductPrices product={product} />

          {/* Divider */}
          <div style={{height: '1px', backgroundColor: '#E5E7EB', margin: '20px 0'}} />

          {/* Product options (size, color etc) */}
          <div style={{marginBottom: '24px'}}>
            <ProductOptions />
          </div>

          {/* Add to cart */}
          <AddToCartMarkup product={product} />

          {/* Description */}
          {product.description && (
            <div style={{borderTop: '1px solid #E5E7EB', paddingTop: '24px', marginTop: '8px'}}>
              <p style={{
                fontFamily: "'Wix Madefor Text', sans-serif",
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#5F5C4E',
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Contentful enrichment — shown if data exists */}
          {contentfulProduct && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#F4F2F0',
              borderRadius: '4px',
            }}>
              {contentfulProduct.productName && (
                <p style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FF481A',
                  marginBottom: '6px',
                }}>
                  {contentfulProduct.productName}
                </p>
              )}
              {contentfulProduct.productDescription && (
                <p style={{fontSize: '13px', color: '#5F5C4E', lineHeight: 1.7}}>
                  {contentfulProduct.productDescription}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </ProductOptionsProvider>
  );
}
