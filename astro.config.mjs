import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://www.swutcg.one',
  trailingSlash: 'never',
  integrations: [tailwind()],
  output: 'static',
  build: {
    format: 'file',
    assets: 'assets',
    inlineStylesheets: 'always'
  },
  compressHTML: true,
  vite: {
    build: {
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
            if (id.includes('src/scripts/builder')) return 'builder';
            if (id.includes('src/scripts/database') || id.includes('src/scripts/cardDatabase')) return 'database';
            if (id.includes('src/scripts/decklists')) return 'decklists';
          }
        }
      }
    }
  }
});
