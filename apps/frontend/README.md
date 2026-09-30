# Cuncho · Frontend

PWA en React 18 + Vite + TypeScript (CSR). Pantallas basadas en `../../design/`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local con MSW (datos de ejemplo, ver `.env.development`) |
| `npm run build` | `dist/` estático + service worker (Workbox) |
| `npm run lint` / `npm run typecheck` / `npm test` | ESLint, `tsc -b`, Vitest |
| `npm run test:e2e` | Playwright (390×844 y 1280×800) contra `npm run dev` |

## Variables (`.env.example`)

- `VITE_API_URL`: base de la API Nest.js. Se inyecta al compilar, así que hay un build por ambiente.
- `VITE_API_MOCKS=true`: usa MSW (`src/mocks/`) en lugar de la API.
- `VITE_MAP_DEFAULT_CENTER`: `lat,lng` usado cuando no hay GPS.
- `VITE_CARTO_KEY`: API key de CARTO basemaps. **Sin ella los tiles salen con la marca "API KEY REQUIRED".**
  Con `npm run dev` va en `.env.local`; con `docker compose` va en el `.env` de la raíz del repo, porque
  `.env.local` no entra al contenedor (está en `.dockerignore`). Ambos están ignorados por git.

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Explorar (`Main.dc.html`) |
| `/catar/lugar` · `/catar/grano` · `/catar/sensorial` | Pasos 1–3 |
| `/recomendar` | Recomendación |
| `/bitacora` | Bitácora |

El menú de acciones (`Acciones.dc.html`) es un `BottomSheet` que se abre desde el FAB sobre la ruta actual.

## Contrato de API (SUPUESTO)

Todavía no existe la API. Estos endpoints están en `src/lib/api/client.ts` y en los mocks:

- `GET /lugares?bbox=oeste,sur,este,norte` → `Lugar[]`
- `GET /lugares/cercanos?lat&lng&radio_km` → `LugarCercano[]`
- `GET /cataciones/mias` → `Catacion[]`
- `POST /cataciones` (`NuevaCatacion`; si `lugar.id` no viene, el backend crea el lugar) → `Catacion`

La recomendación se calcula en el cliente (`features/recomendacion/ranking.ts`) sobre `/lugares/cercanos`. Si el backend expone un endpoint propio, ese manda.
