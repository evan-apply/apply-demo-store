#!/bin/bash
# Rebuilds the browser-safe Ninetailed bundle.
# Run this after updating @ninetailed/experience.js version.
# Output: src/lib/ninetailed-bundle.js

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Create diary stub
STUB=$(mktemp /tmp/diary-stub-XXXXXX.js)
cat > "$STUB" << 'EOF'
const noop = () => {};
const logger = { debug: noop, info: noop, warn: noop, error: noop };
export function diary(name) { return logger; }
export const enable = noop;
export const disable = noop;
export default diary;
EOF

node -e "
const esbuild = require('./node_modules/esbuild');
esbuild.build({
  entryPoints: ['node_modules/@ninetailed/experience.js/index.esm.js'],
  bundle: true, format: 'esm', platform: 'browser',
  outfile: 'src/lib/ninetailed-bundle.js',
  define: { 'process.env.NODE_ENV': '\"production\"' },
  plugins: [{ name: 'diary-stub', setup(build) {
    build.onResolve({filter: /^diary/}, () => ({ path: process.env.STUB_PATH }));
  }}],
  external: ['react', 'react-dom'],
}).then(() => {
  const size = require('fs').statSync('src/lib/ninetailed-bundle.js').size;
  console.log('✅ ninetailed-bundle.js rebuilt (' + (size/1024).toFixed(0) + 'KB)');
}).catch(e => { console.error('❌', e.message); process.exit(1); });
" STUB_PATH="$STUB"

rm -f "$STUB"
