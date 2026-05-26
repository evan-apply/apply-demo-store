/**
 * Creates the HomepageSettings content type + entry via REST API.
 * Run: node scripts/setup-homepage.mjs
 */

// Set these via env vars: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN
const SPACE_ID   = process.env.CONTENTFUL_SPACE_ID   || 't989h97jfgjz';
const ENV_ID     = 'master';
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const BASE       = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}`;

const headers = {
  'Authorization':  `Bearer ${MGMT_TOKEN}`,
  'Content-Type':   'application/json',
};

async function api(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...headers, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json.message || json)}`);
  return json;
}

async function run() {
  if (!MGMT_TOKEN) {
    console.error('❌ CONTENTFUL_MANAGEMENT_TOKEN env var is required.');
    console.error('   Run: CONTENTFUL_MANAGEMENT_TOKEN=your_token node scripts/setup-homepage.mjs');
    process.exit(1);
  }
  /* ── 1. Create / update content type ────────────────────── */
  console.log('\n1. Creating HomepageSettings content type...');

  const contentTypeBody = {
    name:         'Homepage Settings',
    description:  'Singleton — controls all editable copy on the home page.',
    displayField: 'internalTitle',
    fields: [
      { id: 'internalTitle',             name: 'Internal title (CMS only)',            type: 'Symbol', required: true  },
      { id: 'heroEyebrow',               name: 'Hero — Eyebrow',                        type: 'Symbol', required: false },
      { id: 'heroHeadline',              name: 'Hero — Headline',                        type: 'Symbol', required: true  },
      { id: 'heroHeadlineAccent',        name: 'Hero — Headline accent word (orange)',   type: 'Symbol', required: false },
      { id: 'heroSubheadline',           name: 'Hero — Subheadline',                     type: 'Symbol', required: false },
      { id: 'heroCtaPrimary',            name: 'Hero — CTA primary label',               type: 'Symbol', required: false },
      { id: 'heroCtaSecondary',          name: 'Hero — CTA secondary label',             type: 'Symbol', required: false },
      { id: 'heroFeaturedProductHandle', name: 'Hero — Featured product handle',         type: 'Symbol', required: false },
      { id: 'featuredSectionTitle',      name: 'Featured products — Section title',      type: 'Symbol', required: false },
      { id: 'featuredCollectionHandle',  name: 'Featured products — Collection handle',  type: 'Symbol', required: false },
      { id: 'collectionsGridTitle',      name: 'Collections grid — Section title',       type: 'Symbol', required: false },
      { id: 'seoTitle',                  name: 'SEO — Page title',                       type: 'Symbol', required: false },
      { id: 'seoDescription',            name: 'SEO — Meta description',                 type: 'Symbol', required: false },
    ],
  };

  // Check if it exists first
  let existingVersion;
  try {
    const existing = await api('GET', '/content_types/homepageSettings');
    existingVersion = existing.sys.version;
    console.log('  Already exists (v' + existingVersion + ') — updating...');
  } catch {
    existingVersion = null;
  }

  const putHeaders = existingVersion !== null
    ? { 'X-Contentful-Version': String(existingVersion) }
    : {};

  const ct = await api('PUT', '/content_types/homepageSettings', contentTypeBody, putHeaders);
  console.log('  Saved v' + ct.sys.version);

  // Publish
  const published = await api('PUT', `/content_types/homepageSettings/published`, null,
    { 'X-Contentful-Version': String(ct.sys.version) });
  console.log('  ✅ Content type published (v' + published.sys.version + ')');

  /* ── 2. Create / update the singleton entry ─────────────── */
  console.log('\n2. Creating HomepageSettings entry...');

  const locale = 'en-US';
  const entryFields = {
    internalTitle:             { [locale]: 'Homepage (master)' },
    heroEyebrow:               { [locale]: 'New Arrivals — 2026' },
    heroHeadline:              { [locale]: 'Gear That Moves With You' },
    heroHeadlineAccent:        { [locale]: 'Moves' },
    heroSubheadline:           { [locale]: 'Premium merchandise for the people who build things.' },
    heroCtaPrimary:            { [locale]: 'Shop Now' },
    heroCtaSecondary:          { [locale]: 'All Collections' },
    heroFeaturedProductHandle: { [locale]: 'v2-snowboard' },
    featuredSectionTitle:      { [locale]: 'Featured Collection' },
    featuredCollectionHandle:  { [locale]: 'freestyle' },
    collectionsGridTitle:      { [locale]: 'Shop by Collection' },
    seoTitle:                  { [locale]: 'Apply Demo Store — Personalization' },
    seoDescription:            { [locale]: 'Premium merchandise powered by Contentful & Shopify.' },
  };

  let entryVersion;
  try {
    const existing = await api('GET', '/entries/homepageSettings');
    entryVersion = existing.sys.version;
    console.log('  Entry exists (v' + entryVersion + ') — updating...');
  } catch {
    entryVersion = null;
  }

  const entryPutHeaders = {
    'X-Contentful-Content-Type': 'homepageSettings',
    ...(entryVersion !== null ? { 'X-Contentful-Version': String(entryVersion) } : {}),
  };

  const entry = await api('PUT', '/entries/homepageSettings', { fields: entryFields }, entryPutHeaders);
  console.log('  Entry saved v' + entry.sys.version);

  // Publish entry
  const publishedEntry = await api('PUT', '/entries/homepageSettings/published', null,
    { 'X-Contentful-Version': String(entry.sys.version) });
  console.log('  ✅ Entry published — ID: ' + publishedEntry.sys.id);

  console.log('\n🎉 Done! HomepageSettings is live in your Contentful space.');
  console.log('   View it at: https://app.contentful.com/spaces/' + SPACE_ID + '/entries/homepageSettings');
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
