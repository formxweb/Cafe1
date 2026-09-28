import { defineConfig } from 'astro/config';
import { site } from './src/data/site.js';

export default defineConfig({
  site: site.url,
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    responsiveStyles: false,
  },
  devToolbar: { enabled: false },
});
