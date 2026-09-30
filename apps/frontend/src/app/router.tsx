import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { TabsLayout } from './TabsLayout'
import { NotFound } from './NotFound'
import { ExplorarPage } from '../features/map/ExplorarPage'
import { BitacoraPage } from '../features/bitacora/BitacoraPage'
import { Paso1Lugar } from '../features/catacion/Paso1Lugar'
import { Paso2Grano } from '../features/catacion/Paso2Grano'
import { Paso3Sensorial } from '../features/catacion/Paso3Sensorial'
import { RecomendacionPage } from '../features/recomendacion/RecomendacionPage'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        element: <TabsLayout />,
        children: [
          { path: '/', element: <ExplorarPage /> },
          { path: '/bitacora', element: <BitacoraPage /> },
        ],
      },
      { path: '/catar', element: <Navigate to="/catar/lugar" replace /> },
      { path: '/catar/lugar', element: <Paso1Lugar /> },
      { path: '/catar/grano', element: <Paso2Grano /> },
      { path: '/catar/sensorial', element: <Paso3Sensorial /> },
      { path: '/recomendar', element: <RecomendacionPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
