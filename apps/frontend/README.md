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

## Contrato de API

Es el de la API Nest.js (`apps/api`; Swagger en `/docs` del entorno local). `src/lib/api/client.ts` adapta
las respuestas a los tipos de la UI (p. ej. `distancia_m` → `distancia_km`). Prefijo `/api/v1`.

| Uso | Endpoint |
|---|---|
| Pines del mapa | `GET /places?bbox=oeste,sur,este,norte` |
| Cafeterías cercanas | `GET /places/nearby?lat&lng&radius` (km) |
| Crear lugar | `POST /places` (409 si hay duplicado cercano: se usa el existente) |
| Bitácora | `GET /tastings/me?limit&cursor` (paginada; el cliente recorre las páginas) |
| Guardar catación | `POST /tastings` con `lugar.id` y un `id` UUID del cliente (idempotente) |

Guardar una catación en un lugar nuevo son dos llamadas: `POST /places` y luego `POST /tastings`.
El `id` de la catación se genera al encolarla, así que reintentar (cola sin conexión) no la duplica.

**Autenticación: pendiente.** El frontend no envía token. La API exige Bearer en `/places/nearby`,
`/places` (POST), `/tastings/*` y `/recommendations`; solo `GET /places` (mapa) es pública. Hasta que se
añada el login, esas llamadas responden 401 contra la API real.

La recomendación se calcula en el cliente (`features/recomendacion/ranking.ts`) sobre `/places/nearby`. La API tiene `GET /recommendations`; migrarla es una mejora pendiente.
