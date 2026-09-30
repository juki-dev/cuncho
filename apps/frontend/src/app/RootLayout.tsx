import { Outlet, ScrollRestoration } from 'react-router-dom'
import { useGeolocation } from '../features/map/useGeolocation'
import { UpdatePrompt } from './UpdatePrompt'
import { useOfflineSync } from './useOfflineSync'

export function RootLayout() {
  useGeolocation()
  useOfflineSync()
  return (
    <>
      <Outlet />
      <UpdatePrompt />
      <ScrollRestoration />
    </>
  )
}
