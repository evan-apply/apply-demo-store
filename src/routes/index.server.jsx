import {
  useShop,
  useShopQuery,
  flattenConnection,
  Link,
  Image,
  Seo,
  CacheDays,
  useSession,
  useServerAnalytics,
  ShopifyAnalyticsConstants,
  gql,
} from '@shopify/hydrogen';

import Layout from '../components/Layout.server';
import FeaturedCollection from '../components/FeaturedCollection';
import ProductCard from '../components/ProductCard';
import {Suspense} from 'react';
import {useContentfulQuery} from '../api/useContetnfulQuery';
import BackcountryHeroLogic from '../components/BackcountryHeroLogic.client';

const HERO_QUERY = gql`
  query heroProduct($language: LanguageCode) @inContext(language: $language) {
    products(first: 1) {
      edges {
        node {
          title
          handle
          variants(first: 1) {
            edges {
              node {
                image { id url altText width height }
              }
            }
          }
        }
      }
    }
  }
`;

export default function Index() {
  const {countryCode = 'US'} = useSession();

  useServerAnalytics({
    shopify: {pageType: ShopifyAnalyticsConstants.pageType.home},
  });

  // ── Contentful: fetch homepage settings ──────────────────
  const cmsData = useContentfulQuery({
    query: HOMEPAGE_CONTENTFUL_QUERY,
    key: ['homepageSettings'],
  });

  // homepageSettings returns a single object (fetched by ID)
  const cms = cmsData?.data?.homepageSettings ?? {};

  return (
    <Layout hero={<Hero cms={cms} />}>
      <Suspense fallback={null}>
        <SeoForHomepage cms={cms} />
      </Suspense>

      {/* Featured Products */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProductsSection country={countryCode} cms={cms} />
      </Suspense>

      {/* Editorial collection grid */}
      <Suspense fallback={<SectionSkeleton />}>
        <CollectionEditorialGrid country={countryCode} cms={cms} />
      </Suspense>
    </Layout>
  );
}

/* ─── Hero ─────────────────────────────────────────────── */
function Hero({cms = {}}) {
  const {languageCode} = useShop();

  // Use the product handle from Contentful
  // '__DYNAMIC__' means the backcountry variant — resolved client-side
  const isDynamic = cms.heroFeaturedProductHandle === '__DYNAMIC__';
  const featuredHandle = isDynamic ? null : (cms.heroFeaturedProductHandle || null);

  const {data} = useShopQuery({
    query: featuredHandle ? HERO_QUERY_BY_HANDLE : HERO_QUERY,
    variables: featuredHandle
      ? {language: languageCode, handle: featuredHandle}
      : {language: languageCode},
    preload: true,
  });

  // Support both product(handle:) and products(first:1) query shapes
  const heroProduct = featuredHandle
    ? data?.product
    : flattenConnection(data?.products ?? {edges: []})[0];
  const heroImage = heroProduct?.variants?.edges?.[0]?.node?.image;

  // CMS copy with fallbacks
  const eyebrow     = cms.heroEyebrow     ?? 'New Arrivals — 2026';
  const headline    = cms.heroHeadline    ?? 'Gear That Moves With You';
  const accent      = cms.heroHeadlineAccent ?? 'Moves';
  const subheadline = cms.heroSubheadline ?? 'Premium merchandise for the people who build things.';
  const ctaPrimary  = cms.heroCtaPrimary  ?? 'Shop Now';
  const ctaSecondary = cms.heroCtaSecondary ?? 'All Collections';

  // Build the headline: split on accent word so we can colour it
  const headlineParts = headline.split(new RegExp(`(${accent})`, 'i'));

  return (
    <section style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '88vh',
      }}>

        {/* ── Left panel: copy — content pushed to right edge (near divider) ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',         /* centre text block within left panel */
          padding: '72px 56px',
          borderRight: '1px solid #D6D3CC',
        }}>
          {/* Inner text block — fixed width, left-aligned internally */}
          <div style={{width: '340px'}}>

            <p id="hero-eyebrow" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9D9A93',
              margin: '0 0 32px',
            }}>
              {eyebrow}
            </p>

            <h1 id="hero-headline" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '54px',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              color: '#282A33',
              margin: '0 0 28px',
            }}>
              {headlineParts.map((part, i) =>
                part.toLowerCase() === accent.toLowerCase()
                  ? <span key={i} style={{color: '#FF481A'}}>{part}</span>
                  : part
              )}
            </h1>

            <div style={{
              width: '24px',
              height: '1px',
              backgroundColor: '#C8C5BE',
              margin: '0 0 24px',
            }} />

            <p id="hero-subheadline" style={{
              fontFamily: "'Wix Madefor Text', sans-serif",
              fontSize: '15px',
              lineHeight: 1.8,
              color: '#5F5C4E',
              margin: '0 0 44px',
            }}>
              {subheadline}
            </p>

            <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
              <Link
                id="hero-cta-primary"
                to={heroProduct ? `/products/${heroProduct.handle}` : '/collections/freestyle'}
                className="apply-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '13px 26px',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'Space Grotesk', sans-serif",
                  textDecoration: 'none',
                  color: '#FFFFFF',
                }}
              >
                {ctaPrimary}
              </Link>
              <Link
                to={`/collections/${cms.featuredCollectionHandle ?? 'freestyle'}`}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#6D6A63',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {ctaSecondary}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {(heroProduct || isDynamic) && (
              <p
                id="nt-hero-label"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#C0BDB6',
                  margin: '36px 0 0',
                }}
              >
                {heroProduct?.title || 'Backcountry Board'}
              </p>
            )}
          </div>
        </div>

        {/* ── Right panel: product image ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '72px 64px',
          position: 'relative',
        }}>
          {/* Client logic: resolve last-clicked or random backcountry product */}
          {isDynamic && <BackcountryHeroLogic />}

          {heroImage ? (
            <img
              id="nt-hero-img"
              src={heroImage.url}
              alt={heroImage.altText || 'Featured product'}
              style={{
                maxHeight: '72vh',
                maxWidth: '100%',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                mixBlendMode: 'multiply',
              }}
            />
          ) : isDynamic ? (
            <img
              id="nt-hero-img"
              src=""
              alt="Backcountry board"
              style={{ maxHeight: '72vh', maxWidth: '100%', width: 'auto',
                objectFit: 'contain', display: 'none', mixBlendMode: 'multiply' }}
            />
          ) : (
            <div style={{width: '300px', height: '400px', backgroundColor: '#E5E7EB'}} />
          )}
        </div>

      </div>
    </section>
  );
}

/* ─── Featured Products ─────────────────────────────────── */
function FeaturedProductsSection({country, cms = {}}) {
  const {languageCode} = useShop();

  const {data} = useShopQuery({
    query: PRODUCTS_QUERY,
    variables: {country, language: languageCode},
    preload: true,
  });

  const collections   = data ? flattenConnection(data.collections) : [];
  const firstColl     = collections[0];
  const featuredProds = firstColl ? flattenConnection(firstColl.products) : [];

  if (!firstColl) return null;

  return (
    <section className="mb-16">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <h2
          className="text-2xl font-bold"
          style={{fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', color: '#282A33'}}
        >
          {cms.featuredSectionTitle || firstColl.title}
        </h2>
        <Link
          to={`/collections/${firstColl.handle}`}
          className="text-[13px] font-medium tracking-[0.06em] uppercase hover:text-[#FF481A] transition-colors flex items-center gap-2"
          style={{fontFamily: "'Space Grotesk', sans-serif", color: '#282A33'}}
        >
          Shop all
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredProds.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

/* ─── Muji-style Collection Editorial Grid ──────────────── */
function CollectionEditorialGrid({country, cms = {}}) {
  const {languageCode} = useShop();

  const {data} = useShopQuery({
    query: COLLECTIONS_QUERY,
    variables: {country, language: languageCode},
    preload: true,
  });

  const collections = data ? flattenConnection(data.collections) : [];
  if (!collections.length) return null;

  const [first, second, third] = collections;

  return (
    <section style={{borderTop: '1px solid #E5E7EB', paddingTop: '80px', paddingBottom: '80px'}}>

      {/* Section title — centred, Muji style */}
      <h2 style={{
        textAlign: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#282A33',
        marginBottom: '32px',
      }}>
        {cms.collectionsGridTitle || 'Shop by Collection'}
      </h2>

      {/* 2-col grid */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px'}}>

        {/* Top row — two equal tiles */}
        {[first, second].filter(Boolean).map((coll) => (
          <CollectionTile key={coll.id} collection={coll} aspectRatio="56%" />
        ))}

        {/* Bottom row — full-width feature tile */}
        {third && (
          <div style={{gridColumn: '1 / -1'}}>
            <CollectionTile collection={third} aspectRatio="42%" />
          </div>
        )}
      </div>
    </section>
  );
}

function CollectionTile({collection, aspectRatio}) {
  const img = collection.image;
  return (
    <Link
      to={`/collections/${collection.handle}`}
      style={{display: 'block', position: 'relative', overflow: 'hidden', textDecoration: 'none'}}
    >
      {/* Aspect-ratio box */}
      <div style={{paddingTop: aspectRatio, position: 'relative', overflow: 'hidden'}}>

        {/* Background image */}
        {img ? (
          <img
            src={img.url}
            alt={img.altText || collection.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.6s ease',
            }}
          />
        ) : (
          <div style={{position: 'absolute', inset: 0, backgroundColor: '#E5E7EB'}} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }} />

        {/* Text overlay — bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '36px',
        }}>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            margin: '0 0 8px',
          }}>
            {collection.title}
          </p>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            Shop Now
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SeoForHomepage({cms = {}}) {
  const {data: {shop: {description}}} = useShopQuery({
    query: SEO_QUERY,
    cache: CacheDays(),
    preload: true,
  });
  return (
    <Seo type="homepage" data={{
      title:       cms.seoTitle       || 'Apply Demo Store',
      description: cms.seoDescription || description,
    }} />
  );
}

function SectionSkeleton() {
  return <div className="h-64 rounded-lg bg-[#EEEEEE] mb-10 animate-pulse" />;
}

const SEO_QUERY = gql`
  query homeShopInfo {
    shop { description }
  }
`;

/* Fetch a specific product by handle (used when Contentful specifies one) */
const HERO_QUERY_BY_HANDLE = gql`
  query heroProductByHandle($language: LanguageCode, $handle: String!)
  @inContext(language: $language) {
    product(handle: $handle) {
      title
      handle
      variants(first: 1) {
        edges {
          node {
            image { id url altText width height }
          }
        }
      }
    }
  }
`;

/* Contentful: fetch all homepage copy in one call */
// Always fetch the DEFAULT entry by ID — prevents variant entries from leaking in
const HOMEPAGE_CONTENTFUL_QUERY = `
  query {
    homepageSettings(id: "homepageSettings") {
      heroEyebrow
      heroHeadline
      heroHeadlineAccent
      heroSubheadline
      heroCtaPrimary
      heroCtaSecondary
      heroFeaturedProductHandle
      featuredSectionTitle
      featuredCollectionHandle
      collectionsGridTitle
      seoTitle
      seoDescription
    }
  }
`;

const COLLECTIONS_QUERY = gql`
  query editorialCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 3) {
      edges {
        node {
          id
          handle
          title
          image { id url altText width height }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = gql`
  query indexContent($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 2) {
      edges {
        node {
          handle
          id
          title
          image { id url altText width height }
          products(first: 3) {
            edges {
              node {
                handle
                id
                title
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      image { id url altText width height }
                      priceV2       { currencyCode amount }
                      compareAtPriceV2 { currencyCode amount }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
