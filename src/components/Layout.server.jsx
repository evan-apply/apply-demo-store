import {
  useShop,
  useShopQuery,
  flattenConnection,
  LocalizationProvider,
  CacheHours,
  gql,
} from '@shopify/hydrogen';

import Header from './Header.client';
import Footer from './Footer.server';
import Cart from './Cart.client';
import SegmentProvider from './SegmentProvider.client';
import {Suspense} from 'react';
import {useSession} from '@shopify/hydrogen';
import {useContentfulQuery} from '../api/useContetnfulQuery';

/**
 * Apply Digital — Editorial Momentum
 * Main layout wrapper
 */
export default function Layout({children, hero}) {
  const {languageCode} = useShop();
  const {countryCode = 'US'} = useSession();

  const {data} = useShopQuery({
    query: QUERY,
    variables: {language: languageCode, numCollections: 3},
    cache: CacheHours(),
    preload: '*',
  });

  const collections = data ? flattenConnection(data.collections) : null;
  const products    = data ? flattenConnection(data.products) : null;
  const storeName   = data ? data.shop.name : '';

  // Contentful: footer copy (shared across all pages)
  const cmsData = useContentfulQuery({
    query: FOOTER_CONTENTFUL_QUERY,
    key: ['footerSettings'],
  });
  const footerCms = cmsData?.data?.homepageSettingsCollection?.items?.[0] ?? {};

  return (
    <LocalizationProvider preload="*">
      {/* Skip link */}
      <div className="absolute top-0 left-0">
        <a href="#mainContent" className="p-4 focus:block sr-only focus:not-sr-only">
          Skip to content
        </a>
      </div>

      <div className="min-h-screen max-w-screen" style={{backgroundColor: '#FFFFFF', color: '#282A33'}}>
        <Suspense fallback={null}>
          <SegmentProvider country={countryCode}>
            <Header collections={collections} storeName={storeName} />
            <Cart />
          </SegmentProvider>
        </Suspense>

        <main role="main" id="mainContent" className="relative" style={{backgroundColor: '#FFFFFF'}}>
          {hero}
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
            <Suspense fallback={null}>{children}</Suspense>
          </div>
        </main>

        <Footer collection={collections?.[0]} product={products?.[0]} storeName={storeName} cms={footerCms} />
      </div>
    </LocalizationProvider>
  );
}

const FOOTER_CONTENTFUL_QUERY = `
  query {
    homepageSettingsCollection(limit: 1) {
      items {
        footerTagline
        footerShopTitle
        footerInfoTitle
        footerCopyrightName
        footerTaglineRight
      }
    }
  }
`;

const QUERY = gql`
  query layoutContent($language: LanguageCode, $numCollections: Int!)
  @inContext(language: $language) {
    shop { name }
    collections(first: $numCollections) {
      edges {
        node {
          description
          handle
          id
          title
          image { id url altText width height }
        }
      }
    }
    products(first: 1) {
      edges {
        node { handle }
      }
    }
  }
`;
