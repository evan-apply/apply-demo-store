import {
  useSession,
  useShop,
  useShopQuery,
  flattenConnection,
  Seo,
  useServerAnalytics,
  ShopifyAnalyticsConstants,
  gql,
} from '@shopify/hydrogen';

import LoadMoreProducts from '../../components/LoadMoreProducts.client';
import Layout from '../../components/Layout.server';
import ProductCard from '../../components/ProductCard';
import NotFound from '../../components/NotFound.server';
import SegmentCollectionView from '../../components/SegmentCollectionView.client';

export default function Collection({collectionProductCount = 24, params}) {
  const {languageCode} = useShop();
  const {countryCode = 'US'} = useSession();
  const {handle} = params;

  const {data} = useShopQuery({
    query: QUERY,
    variables: {handle, country: countryCode, language: languageCode, numProducts: collectionProductCount},
    preload: true,
  });

  useServerAnalytics(
    data?.collection
      ? {shopify: {pageType: ShopifyAnalyticsConstants.pageType.collection, resourceId: data.collection.id}}
      : null,
  );

  if (data?.collection == null) return <NotFound />;

  const collection  = data.collection;
  const products    = flattenConnection(collection.products);
  const hasNextPage = data.collection.products.pageInfo.hasNextPage;

  return (
    <Layout>
      <Seo type="collection" data={collection} />

      {/* Segment: Product List Viewed */}
      <SegmentCollectionView collection={collection} products={products} />

      {/* Collection header */}
      <div style={{
        paddingTop: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '48px',
      }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9D9A93',
          marginBottom: '12px',
        }}>
          Collection
        </p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '40px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.0,
          color: '#282A33',
          marginBottom: collection.description ? '16px' : '0',
        }}>
          {collection.title}
        </h1>
        {collection.description && (
          <p style={{
            fontFamily: "'Wix Madefor Text', sans-serif",
            fontSize: '15px',
            lineHeight: 1.7,
            color: '#5F5C4E',
            maxWidth: '560px',
            marginTop: '12px',
          }}>
            {collection.description}
          </p>
        )}
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: '#C0BDB6',
          marginTop: '16px',
        }}>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Product grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '32px',
        marginBottom: '64px',
      }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasNextPage && <LoadMoreProducts startingCount={collectionProductCount} />}
    </Layout>
  );
}

const QUERY = gql`
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $numProducts: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      descriptionHtml
      description
      seo { description title }
      image { id url width height altText }
      products(first: $numProducts) {
        edges {
          node {
            id
            title
            vendor
            handle
            descriptionHtml
            compareAtPriceRange {
              maxVariantPrice { currencyCode amount }
              minVariantPrice { currencyCode amount }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  image { id url altText width height }
                  priceV2 { currencyCode amount }
                  compareAtPriceV2 { currencyCode amount }
                }
              }
            }
          }
        }
        pageInfo { hasNextPage }
      }
    }
  }
`;
