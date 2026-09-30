import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [192, 512], favicons: [[48, 'favicon.ico']] },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: '#B24F2B' } },
    apple: { sizes: [180], padding: 0.3, resizeOptions: { background: '#B24F2B' } },
  },
  images: ['public/icons/icon.svg'],
})
