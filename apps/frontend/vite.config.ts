/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/** Regex (como string) que identifica los GET a la API, sea absoluta o relativa. */
function apiPattern(apiUrl: string): RegExp {
  const base = apiUrl.replace(/\/$/, '')
  if (/^https?:\/\//.test(base)) return new RegExp(`^${escapeRegExp(base)}/`)
  return new RegExp(`^https?://[^/]+${escapeRegExp(base)}/`)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = env.VITE_API_URL || '/api'

  return {
    plugins: [
      react(),
      {
        // El worker de MSW vive en public/ para desarrollo; no debe llegar a producción.
        name: 'quitar-msw-del-build',
        apply: 'build',
        async closeBundle() {
          if (env.VITE_API_MOCKS !== 'true') await rm(resolve('dist/mockServiceWorker.js'), { force: true })
        },
      },
      VitePWA({
        strategies: 'generateSW',
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/favicon.ico', 'icons/apple-touch-icon-180x180.png', 'icons/icon.svg'],
        manifest: {
          name: 'Cuncho — La huella del cuncho',
          short_name: 'Cuncho',
          description: 'Bitácora de cataciones de café de especialidad en Colombia, con mapa y recomendaciones.',
          lang: 'es-CO',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#FAF5EE',
          background_color: '#FAF5EE',
          icons: [
            { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
          globIgnores: ['mockServiceWorker.js'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Tiles de CARTO: cache bajo demanda, nunca prefetch masivo.
              urlPattern: /^https:\/\/[abcd]\.basemaps\.cartocdn\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tiles',
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: apiPattern(apiUrl),
              method: 'GET',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'font' || request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'assets', expiration: { maxEntries: 100 } },
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
