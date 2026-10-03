# Spec: despliegue del backend de Cuncho (API + PostGIS en AWS Lightsail)

Estado: **en implementación** (Terraform, `deploy/` y workflows escritos; falta aplicar y desplegar) · Responsable: agente `devops` (con apoyo de `backend` donde se indica)

## 1. Objetivo

Publicar la API de Nest.js en `https://cuncho-api.jukidev.com` con PostgreSQL + PostGIS, desplegada automáticamente desde GitHub Actions al hacer push a `master`, con migraciones controladas, backups verificados y costo bajo (~7–12 USD/mes).

El frontend ya está desplegado (S3 + CloudFront en `https://cuncho.jukidev.com`, ver `infra/frontend/`) y espera la API en `https://cuncho-api.jukidev.com/api/v1`.

### Fuera de alcance
- Alta disponibilidad, balanceo o múltiples servidores.
- Staging separado (se puede añadir luego con otro servidor y otro `environment`).
- Monitoreo de pago.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Proveedor | **AWS Lightsail** (cambio: los planes baratos de Hetzner están agotados y los CPX subieron a ~12–20 €), un solo servidor, misma cuenta que Route 53 y S3 |
| Tipo de servidor | `micro_3_0` (1 GB, x86) en `us-east-1`, con swap de 2 GB y límites de memoria en Compose. **Escalable verticalmente** cambiando `instance_bundle_id` en Terraform (reemplaza la instancia; datos e IP se conservan) |
| Persistencia | Disco de datos de Lightsail (20 GB) montado en `/opt/cuncho`: Postgres, certificados de Caddy, `.env`, claves de host SSH. IP estática aparte |
| Infraestructura | Terraform en `infra/backend/` (Lightsail, disco, IP, puertos, Route 53, bucket y usuario IAM de backups) |
| Sistema | Ubuntu 24.04 LTS |
| Orquestación | Docker Compose (`docker-compose.prod.yml`) |
| Proxy y TLS | Caddy con Let's Encrypt automático |
| Base de datos | `postgis/postgis:16-3.4` en contenedor, volumen nombrado, sin puerto publicado |
| Registro de imágenes | GHCR (`ghcr.io/juki-dev/cuncho-api`) |
| Dominio | `cuncho-api.jukidev.com`, registro A en Route 53 (lo crea Terraform) |
| Despliegue | GitHub Actions por SSH (usuario `deploy`, llave dedicada) |
| Rama | `master` |
| CORS | `CORS_ORIGINS=https://cuncho.jukidev.com` |

## 3. Arquitectura

```
Navegador ──HTTPS──► cuncho-api.jukidev.com (IP estática de Lightsail)
                          │ :80/:443
                    ┌─────▼──────┐
                    │   Caddy    │  Let's Encrypt, reverse proxy
                    └─────┬──────┘
                          │ red interna de Compose
                    ┌─────▼──────┐     ┌──────────────┐
                    │  api :3000 │────►│ db (PostGIS) │ volumen db-data
                    └────────────┘     └──────┬───────┘
                     todo en /opt/cuncho (disco de datos)
                                              │ pg_dump diario
                                       Bucket S3 de backups (AWS)
```

Solo Caddy publica puertos (80, 443). `api` y `db` solo se ven dentro de la red de Compose.

## 4. Requisitos previos (manuales, los hace el usuario)

1. Credenciales de AWS locales con permisos sobre Lightsail, S3, IAM y Route 53.
2. Un par de llaves SSH dedicado al despliegue (`ssh-keygen -t ed25519`); la pública va en `terraform.tfvars`.
3. `terraform apply` en `infra/backend/` (crea servidor, disco, IP, firewall, DNS y bucket). Ver `infra/backend/README.md`.
4. Crear `/opt/cuncho/.env` en el servidor y configurar el environment `production` de GitHub. Ver `deploy/README.md`.
5. Repositorio en GitHub (`juki-dev/cuncho`) con el environment `production` ya creado (lo usa el frontend).

## 5. Cambios necesarios en el código (agente `backend`)

El agente `devops` no toca código de las apps. Estos puntos los implementa `backend` antes del primer despliegue:

1. **Confiar en el proxy (obligatorio).** `apps/api/src/app.setup.ts` no configura `trust proxy`. Detrás de Caddy, el limitador de peticiones (`@nestjs/throttler`) vería la IP del proxy para todos los usuarios y los límites de `/auth/*` se compartirían entre todos. **Hecho**: variable `TRUST_PROXY` (saltos de proxy, 0 por defecto; el Compose de producción la fija en 1), con test.
2. **Swagger en producción.** `SWAGGER_ENABLED` ya existe; en producción va en `false`.
3. **Migraciones en producción.** `npm run migration:run:prod` usa `dist/shared/database/data-source.js`. Comprobar que funciona dentro de la imagen `runtime` (que hace `npm prune --omit=dev`): `typeorm`, `dotenv` y `pg` están en `dependencies`, así que deberían estar. **Verificado** localmente con la imagen `runtime` contra una base de prueba.
4. **Seed.** `npm run seed` no debe ejecutarse en producción (el README ya lo indica). **Verificado**: el script ya se niega a correr con `NODE_ENV=production`.

## 6. Entregables (agente `devops`)

| Archivo | Contenido |
|---|---|
| `deploy/docker-compose.prod.yml` | Servicios `db`, `api`, `caddy`, y un servicio `migrations` de un solo uso. Healthchecks, `restart: unless-stopped`, límites de memoria razonables, volúmenes `db-data`, `caddy-data`, `caddy-config` |
| `deploy/Caddyfile` | `cuncho-api.jukidev.com { reverse_proxy api:3000 }` con compresión y cabeceras básicas |
| `deploy/.env.production.example` | Todas las variables de la API (ver sección 8), sin valores reales |
| `deploy/scripts/deploy.sh` | Se ejecuta en el servidor: `docker compose pull`, migraciones, `up -d`, comprobación de `/health`, `docker image prune`. Falla (y no cambia de versión) si las migraciones fallan |
| `deploy/scripts/backup.sh` | `pg_dump` comprimido a un bucket S3, con rotación |
| `deploy/scripts/restore.sh` | Restaura un dump en una base vacía (para probar los backups) |
| `deploy/scripts/bootstrap-server.sh` | Una sola vez: usuario `deploy`, SSH endurecido, `ufw`, `fail2ban`, `unattended-upgrades`, Docker, directorio `/opt/cuncho` |
| `.github/workflows/ci-api.yml` | `lint`, `typecheck`, `test`, `test:e2e` (Testcontainers), `build` |
| `.github/workflows/deploy-api.yml` | Construye y sube la imagen a GHCR, copia los archivos de `deploy/` al servidor y ejecuta `deploy.sh` por SSH |
| `deploy/README.md` | Guía de operación: logs, rollback, restauración |
| `infra/backend/` | Terraform: Lightsail (instancia, disco de datos, IP estática, puertos), registro en Route 53, bucket de backups y usuario IAM de solo escritura |

## 7. Pipelines

### 7.1 `ci-api.yml`
- Disparadores: `pull_request` y `workflow_call`, con filtro `paths: apps/api/**`.
- Pasos: `npm ci` → `lint` → `typecheck` → `test` → `test:e2e` → `build`, con caché de npm y `node-version-file: apps/api/.nvmrc`.
- Permisos `contents: read`, `concurrency` con cancelación en PRs, `timeout-minutes`.

### 7.2 `deploy-api.yml`
- Disparadores: `push` a `master` (con cambios en `apps/api/**` o `deploy/**`) y `workflow_dispatch`.
- `needs`: reutiliza `ci-api.yml`.
- Job `build`: `docker/build-push-action` con `target: runtime`, `linux/amd64`, caché `type=gha`, tags `sha-<corto>` y `latest`, permisos `packages: write`.
- Job `deploy` (`environment: production`, con aprobación): copia `deploy/` al servidor, ejecuta `deploy.sh <sha>` por SSH y verifica `https://cuncho-api.jukidev.com/health`.
- `concurrency` sin cancelación, serializada.
- Las llaves SSH van como secretos del `environment`; se verifica el servidor con `SSH_KNOWN_HOSTS`, nunca con `StrictHostKeyChecking=no`.

### 7.3 Orden de un despliegue
1. Imagen nueva en GHCR.
2. En el servidor: `docker compose pull api`.
3. Migraciones con la imagen nueva (`docker compose run --rm migrations`). Si fallan, se detiene todo y la versión anterior sigue sirviendo.
4. `docker compose up -d api`.
5. Comprobación de `/health` con reintentos. Si falla, **rollback automático** a la imagen anterior (guardar el tag previo).

Las migraciones deben ser compatibles hacia atrás: durante unos segundos el código viejo convive con el esquema nuevo. Un cambio destructivo se hace en dos despliegues (primero se deja de usar, luego se elimina).

## 8. Configuración y secretos

### 8.1 En el servidor (`/opt/cuncho/.env`, permisos `600`, fuera de git)
| Variable | Valor en producción |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `LOG_LEVEL` | `info` |
| `SWAGGER_ENABLED` | `false` |
| `CORS_ORIGINS` | `https://cuncho.jukidev.com` |
| `DB_HOST` / `DB_PORT` | `db` / `5432` |
| `DB_USER` / `DB_NAME` | usuario y base propios (no `coffee`, si se prefiere) |
| `DB_PASSWORD` | aleatoria, larga, generada una sola vez |
| `DB_SSL` | `false` (red interna de Compose) |
| `JWT_ACCESS_SECRET` | aleatorio, mínimo 32 caracteres |
| `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` | `900` / `2592000` |
| `THROTTLE_*` | como `apps/api/.env.example` |
| `RECOMMENDATION_*` | como `apps/api/.env.example` |

La API no arranca si falta alguna: la validación se hace al iniciar (`env.validation.ts`). Toda variable nueva debe añadirse al `.env.production.example` y al servidor.

### 8.2 En GitHub (`environment: production`)
| Tipo | Nombre | Uso |
|---|---|---|
| Secreto | `SSH_PRIVATE_KEY` | Llave dedicada al despliegue |
| Secreto | `SSH_KNOWN_HOSTS` | Huella del servidor |
| Variable | `SSH_HOST`, `SSH_USER` | Destino |
| Variable | `API_URL` | `https://cuncho-api.jukidev.com` (smoke test) |

`GITHUB_TOKEN` basta para subir a GHCR. Para que el servidor descargue imágenes privadas, `docker login ghcr.io` con un token de solo lectura (`read:packages`), o hacer público el paquete.

### 8.3 Backups
- Bucket S3 privado, con cifrado y rotación (lifecycle de 30 días).
- Usuario IAM **solo con permiso de escritura** en ese bucket (`s3:PutObject`), con sus claves guardadas en el servidor. Es el único caso donde se usan claves de larga duración, porque Lightsail no tiene identidad federada con AWS.
- Cron diario en el servidor que ejecuta `backup.sh`.

## 9. Seguridad

- Firewall de Lightsail: solo 22, 80, 443. En el servidor: `ufw` con las mismas reglas.
- SSH: solo llaves, `PermitRootLogin no`, usuario `deploy` sin privilegios de root.
- `fail2ban` y `unattended-upgrades` activos.
- Nunca se publica el puerto 5432 ni el 3000.
- La imagen corre como usuario `node`, sin `.env` dentro (el `.dockerignore` ya lo excluye).
- Los logs (`nestjs-pino`) no incluyen contraseñas, tokens ni coordenadas exactas asociadas a un usuario (regla del backend; verificar en una revisión).
- Rotación de `JWT_ACCESS_SECRET` y de la llave SSH de despliegue documentada en el README.

## 10. Observabilidad y operación

- Healthcheck: `GET /health` (fuera del prefijo `/api/v1`), que comprueba la conexión a la base.
- Logs: `docker compose logs`, con rotación del driver `json-file` (`max-size`, `max-file`) para no llenar el disco.
- Alerta simple: un monitor externo gratuito (por ejemplo UptimeRobot) sobre `https://cuncho-api.jukidev.com/health`, con aviso por correo.
- Rollback manual: `deploy.sh <sha-anterior>`.
- Disco: vigilar el volumen de la base; ampliar el disco de datos de Lightsail si hace falta (se puede ampliar, no reducir).

## 11. Decisiones abiertas (confirmar antes de implementar)

Resueltas:
1. **Plan y ubicación:** Lightsail `micro_3_0` en `us-east-1`, escalable por Terraform.
2. **Terraform:** sí, en `infra/backend/`, con estado local al inicio (S3 con bloqueo después).
3. **Backups del proveedor:** no; solo `pg_dump` diario a S3 (30 días).
4. **GHCR:** paquete público.

Pendiente al aplicar: confirmar IDs y precios vigentes de los planes (`aws lightsail get-bundles`). Apagar la instancia no reduce el costo en Lightsail (se cobra igual detenida), por eso se descartó programar apagados.

## 12. Criterios de aceptación

- [ ] `https://cuncho-api.jukidev.com/health` responde 200 con certificado válido.
- [ ] `https://cuncho-api.jukidev.com/api/v1/catalog` responde desde `https://cuncho.jukidev.com` sin errores de CORS.
- [ ] El puerto 5432 y el 3000 no son accesibles desde internet (comprobar con un escaneo externo).
- [ ] Un push a `master` que cambia `apps/api/**` ejecuta CI y, tras aprobación, despliega sin intervención manual.
- [ ] Una migración nueva se aplica antes de cambiar la versión; una migración que falla deja la versión anterior sirviendo.
- [ ] Un despliegue con un `/health` roto vuelve solo a la versión anterior.
- [ ] El limitador de peticiones distingue clientes por su IP real (verificar con dos IP distintas).
- [ ] Hay un backup diario en S3 y se **probó restaurar** uno en una base vacía.
- [ ] Ningún secreto está en el repositorio ni impreso en los logs de Actions.
- [ ] `deploy/README.md` explica cómo ver logs, hacer rollback y restaurar un backup.

## 13. Orden de implementación y estado

Actualizado el 2026-10-01.

| # | Paso | Estado |
|---|---|---|
| 1 | Decidir los puntos de la sección 11 | ✅ Hecho (Lightsail 1 GB, Terraform, GHCR público, sin backups del proveedor) |
| 2 | `backend`: `TRUST_PROXY`, migraciones y seed (sección 5) | ✅ Hecho; sin commit |
| 3 | `devops`: `deploy/` y prueba local del Compose | ✅ Hecho; db + migraciones + api sanas, dump/restore probado |
| 4 | `devops`: `bootstrap-server.sh` | 🟡 Escrito, **nunca ejecutado** en un servidor real |
| 5 | `devops`: `infra/backend/` (Terraform) | 🟡 Escrito, `validate` OK, **sin `plan` ni `apply`** |
| 6 | `devops`: `ci-api.yml` y `deploy-api.yml` | 🟡 Escritos, YAML válido, **nunca ejecutados** |
| 7 | Aplicar la infraestructura y preparar el servidor | ⏳ Pendiente (usuario) |
| 8 | Primer despliegue y verificación de la sección 12 | ⏳ Pendiente |
| 9 | Prueba de restauración desde S3, monitor externo | ⏳ Pendiente |

### Pasos siguientes (para retomar)

**0. Antes de nada: cerrar lo local**
- Revisar `git status` y `git diff`. Hay cambios sin commit: `apps/api` (TRUST_PROXY), `deploy/`, `infra/backend/`, los dos workflows y `docs/`. Commitear en una rama (por ejemplo `feat/deploy-backend`) y abrir PR; `ci-api.yml` correrá por primera vez en ese PR (filtro `apps/api/**`) y servirá de prueba de que el CI funciona.
- Confirmar que `infra/backend/terraform.tfvars` y los `*.tfstate` no se suben (ya están en `.gitignore`).

**1. Preparar y revisar la infraestructura (local, sin costo hasta el `apply`)**
1. Generar la llave de despliegue: `ssh-keygen -t ed25519 -f ~/.ssh/cuncho_deploy -C cuncho-deploy`.
2. Confirmar los planes vigentes: `aws lightsail get-bundles --region us-east-1 --query 'bundles[].[bundleId,ramSizeInGb,price,supportedPlatforms]' --output table`. Si `micro_3_0` no existe o no es de 1 GB, ajustar `instance_bundle_id`. Anotar el precio real mensual.
3. `cd infra/backend && cp terraform.tfvars.example terraform.tfvars`, pegar la llave pública (`~/.ssh/cuncho_deploy.pub`).
4. `terraform init && terraform plan`. Revisar que cree: instancia, disco, IP estática, puertos, registro A, bucket, usuario IAM. Comprobar que la zona `jukidev.com` se encuentra (si no, el `data` falla aquí).
5. Verificar que el nombre `cuncho-api.jukidev.com` no tenga ya otro registro en Route 53.

**2. Aplicar y entrar al servidor**
1. `terraform apply`. Anotar `terraform output static_ip`.
2. Esperar ~5–10 min al primer arranque (el bootstrap instala Docker y espera el disco). Si algo falla, entrar como `ubuntu` (consola de Lightsail o llave del par por defecto) y leer `/var/log/cloud-init-output.log`; el script es idempotente y se puede volver a ejecutar a mano con `DEPLOY_PUBKEY=... bash bootstrap-server.sh`.
3. Comprobar: `ssh -i ~/.ssh/cuncho_deploy deploy@<IP>` entra; `df -h /opt/cuncho` muestra el disco de datos; `free -h` muestra el swap de 2 GB; `sudo ufw status` permite solo 22/80/443.
4. Crear `/opt/cuncho/.env` desde `deploy/.env.production.example` con secretos reales (`openssl rand -base64 48` para `DB_PASSWORD` y `JWT_ACCESS_SECRET`), permisos 600, dueño `deploy`. Copiar las credenciales de backup con `terraform output` (la clave secreta con `-raw`).

**3. Configurar GitHub**
1. `Settings → Environments → production` (ya existe por el frontend): secretos `SSH_PRIVATE_KEY` (contenido de `~/.ssh/cuncho_deploy`) y `SSH_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <IP>`); variables `SSH_HOST`, `SSH_USER=deploy`, `API_URL=https://cuncho-api.jukidev.com`.
2. Verificar que el environment exige aprobación (criterio de la sección 12).

**4. Primer despliegue**
1. Mergear el PR a `master` o lanzar **Deploy API** con `workflow_dispatch`. Aprobar el job `deploy`.
2. La primera subida a GHCR crea el paquete como privado: hacerlo **público** (Packages → `cuncho-api` → Package settings → Change visibility) y relanzar el workflow.
3. Recordar que el primer `docker pull` en el servidor no tiene credenciales: por eso el paquete debe ser público.
4. Si `deploy.sh` falla, ver `dc logs api` (alias en `deploy/README.md`).

**5. Verificar los criterios de aceptación (sección 12)**
- `curl -i https://cuncho-api.jukidev.com/health` → 200 con certificado válido (Caddy puede tardar un minuto en emitirlo; requiere que el DNS ya resuelva a la IP).
- CORS desde `https://cuncho.jukidev.com`; probar `GET /api/v1/catalog` desde el navegador.
- Puertos 3000 y 5432 cerrados: `nmap -p 22,80,443,3000,5432 <IP>`.
- Limitador por IP real: dos IP distintas (la tuya y una VPN/móvil) no comparten el contador de `/auth/*`.
- Migración que falla deja la versión anterior; `/health` roto vuelve a la anterior (probar con una rama de prueba o un tag defectuoso a propósito).
- Ningún secreto impreso en los logs de Actions.

**6. Backups y cierre**
1. En el servidor: `./scripts/backup.sh` a mano; comprobar el objeto en S3 (con tus credenciales; el usuario de backup no puede listar).
2. **Probar la restauración**: bajar el dump y `./scripts/restore.sh dump.sql.gz` (base `cuncho_restore`); ver el conteo de tablas; borrar la base de prueba. Marcar el criterio de la sección 12.
3. Comprobar que el cron existe (`cat /etc/cron.d/cuncho-backup`) y revisar `backup.log` al día siguiente.
4. Crear el monitor externo (UptimeRobot) sobre `/health`.
5. Probar el escalado una vez en frío si hay tiempo: `instance_bundle_id = "small_3_0"` → `terraform apply` → verificar que la API vuelve sola y que `SSH_KNOWN_HOSTS` sigue siendo válido. Si se prueba, volver a `micro_3_0` o conservar el plan mayor según el costo.

### Riesgos y puntos a vigilar
- **Memoria (1 GB):** ~160 MB en reposo en local, pero bajo carga puede usar swap. Vigilar con `docker stats` y `free -h`; si hay presión, escalar a `small_3_0`.
- **Disco de datos:** `prevent_destroy` impide borrarlo por error; reducirlo no es posible, solo ampliar.
- **Estado de Terraform local:** contiene la clave secreta del usuario de backup. Hacer copia segura o migrar al backend S3 (comentado en `providers.tf`).
- **Llave de deploy y grupo `docker`:** equivale a root en el servidor; tratar `SSH_PRIVATE_KEY` como secreto crítico.
- **Rollback no revierte el esquema:** mantener las migraciones compatibles hacia atrás.
- **Apagar no ahorra en Lightsail:** el costo es fijo mientras exista la instancia; para pausar de verdad, `terraform destroy` de la instancia (nunca del disco) tras un backup.
