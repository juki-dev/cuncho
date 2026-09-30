import { defineConfig, devices } from '@playwright/test'

const geo = { geolocation: { latitude: 5.0692, longitude: -75.5171, accuracy: 8 }, permissions: ['geolocation'] }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', locale: 'es-CO', trace: 'retain-on-failure', ...geo },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, ...geo } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, ...geo } },
  ],
  // Servidor de desarrollo con MSW (VITE_API_MOCKS=true en .env.development).
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true },
})
