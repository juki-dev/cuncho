import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'

/** Renderiza `element` en `path` con React Query y un router en memoria. */
export function renderRuta(element: ReactElement, path: string, extra: RouteObject[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path, element }, ...extra], { initialEntries: [path] })
  return { router, ...render(<QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider>) }
}

/** Geolocalización falsa con una posición fija. */
export function mockGeolocalizacion(lat: number, lng: number, accuracy = 8) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: (ok: PositionCallback) => {
        ok({ coords: { latitude: lat, longitude: lng, accuracy } } as GeolocationPosition)
        return 1
      },
      clearWatch: () => {},
      getCurrentPosition: () => {},
    },
  })
}
