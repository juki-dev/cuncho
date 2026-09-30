# Cuncho — API

Nest.js 11 · TypeScript strict · PostgreSQL 16 + PostGIS · TypeORM (migraciones explícitas).

## Correr en local

Requisitos: Node 20+ (`.nvmrc`), Docker.

```bash
# 1. Base de datos (PostGIS en el puerto 5433 del host)
docker compose up -d            # desde la raíz del repo

# 2. API
cd apps/api
cp .env.example .env            # cambia JWT_ACCESS_SECRET
npm install
npm run migration:run
npm run seed                    # datos de ejemplo de design/ (usuario demo)
npm run start:dev
```

- API: <http://localhost:3000/api/v1>
- Swagger: <http://localhost:3000/docs> · OpenAPI JSON: <http://localhost:3000/docs/openapi.json>
- Health: <http://localhost:3000/health>
- Usuario demo del seed: `demo@cuncho.co` / `cafe-de-origen`

### Probar rápido con curl

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo@cuncho.co","password":"cafe-de-origen"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).access_token')

curl -s "localhost:3000/api/v1/places?bbox=-75.53,5.05,-75.49,5.09"
curl -s -H "Authorization: Bearer $TOKEN" "localhost:3000/api/v1/recommendations?lat=5.0689&lng=-75.5174&descriptors=frutal,floral"
curl -s -H "Authorization: Bearer $TOKEN" "localhost:3000/api/v1/tastings/me?limit=10"
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API con recarga |
| `npm run lint` / `npm run typecheck` | ESLint (incluye reglas de fronteras entre dominios) / `tsc --noEmit` |
| `npm test` | Unitarios (Jest) |
| `npm run test:e2e` | E2E con Supertest + Testcontainers (levanta su propio PostGIS; requiere Docker) |
| `npm run migration:generate -- src/shared/database/migrations/<Nombre>` | Genera migración desde las entidades (revísala antes de aplicarla) |
| `npm run migration:run` / `migration:revert` / `migration:show` | Migraciones |
| `npm run seed` | Datos de desarrollo (idempotente; no corre en producción) |
| `npm run build` / `npm run start:prod` | Build y arranque de `dist/` |

## Endpoints (`/api/v1`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | pública (rate limit estricto) | JWT de acceso + refresh token rotativo |
| GET | `/users/me` | JWT | Perfil |
| GET | `/catalog` | pública | Variedades, procesos, métodos, acidez, notas → descriptor, escalas |
| GET | `/places?bbox=minLng,minLat,maxLng,maxLat` | pública | Pines del mapa con promedio, descriptores y catación destacada |
| GET | `/places/nearby?lat=&lng=&radius=` | JWT | Cercanos por distancia (`radius` en km, por defecto 1) |
| POST | `/places` | JWT | Crea lugar; 409 con `details.lugar_existente` si hay uno a < 30 m con nombre parecido |
| POST | `/tastings` | JWT | Crea catación; idempotente por `id` o header `Idempotency-Key` (201 nueva / 200 reintento) |
| GET | `/tastings/me?cursor=&limit=` | JWT | Bitácora paginada por cursor (`siguiente_cursor`) |
| GET | `/tastings/me/stats` | JWT | Estadísticas |
| GET | `/tastings/:id` | JWT | Detalle (solo el dueño) |
| GET | `/recommendations?lat=&lng=&descriptors=frutal,floral&radius=2.5` | JWT | Ranking `S = 0.60·J + 0.25·(1 − d/R) + 0.15·(puntaje/100)` |

Errores siempre como `{ statusCode, error, message, details? }`.

## Estructura

```
src/
  shared/          config, database (migraciones, seeds), geo, http, security, logging, health, utils, types
  domains/<d>/     api/ · application/ · domain/ · infrastructure/ · __tests__/ · index.ts (API pública)
```

Un dominio solo importa otro a través de su `index.ts`; `shared/` no importa dominios. ESLint lo verifica.

## Docker

```bash
docker build -t cuncho-api apps/api
docker run --env-file apps/api/.env -p 3000:3000 cuncho-api
```

Las migraciones no corren al arrancar: ejecútalas como paso de despliegue (`npm run migration:run:prod`).
