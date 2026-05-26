import {defineConfig} from 'vite';
import hydrogen from '@shopify/hydrogen/plugin';

/**
 * Vite plugin: stub the `diary` logging package with a no-op browser shim.
 * diary's node build imports util.format which doesn't exist in browsers,
 * and Vite 2 doesn't honour the "browser" export condition on the diary package.
 */
function diaryBrowserShim() {
  const VIRTUAL_ID = '\0virtual:diary-shim';
  return {
    name: 'diary-browser-shim',
    resolveId(id) {
      // Intercept any import of diary (direct or sub-path)
      if (id === 'diary' || id.startsWith('diary/')) return VIRTUAL_ID;
    },
    load(id) {
      if (id === VIRTUAL_ID) {
        // No-op logger — diary is only used for debug output inside Ninetailed
        return `
export function diary(name) {
  return function() {};
}
export default diary;
export const enable = () => {};
export const disable = () => {};
`;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [hydrogen(), diaryBrowserShim()],
  optimizeDeps: {
    include: ['@headlessui/react'],
    exclude: [
      '@ninetailed/experience.js',
      '@ninetailed/experience.js-react',
    ],
  },
  ssr: {
    external: ['@ninetailed/experience.js', 'diary'],
  },
  test: {
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
