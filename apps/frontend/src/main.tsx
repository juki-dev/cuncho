import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import 'leaflet/dist/leaflet.css'
import './styles/global.css'
import { router } from './app/router'
import { Providers } from './app/providers'
import { crearQueryClient } from './app/queryClient'

async function iniciarMocks() {
  if (import.meta.env.VITE_API_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

void iniciarMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers client={crearQueryClient()}>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
})
