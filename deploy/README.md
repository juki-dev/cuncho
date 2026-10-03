# Operación del backend (Lightsail)

Servidor Ubuntu 24.04 en Lightsail (plan de 1 GB por defecto) con Docker Compose: `caddy` (80/443) → `api` → `db` (PostGIS). Todo lo persistente vive en el **disco de datos montado en `/opt/cuncho`** (Postgres, certificados, `.env`, claves de host SSH). La infraestructura está en [`infra/backend/`](../infra/backend/README.md).

## Primer despliegue

1. `cd infra/backend && cp terraform.tfvars.example terraform.tfvars` (pon tu llave pública de deploy) → `terraform init && terraform apply`.
2. Crea `/opt/cuncho/.env` en el servidor (entra como `ubuntu` con la llave de Lightsail):
   ```bash
   sudo -u deploy install -m 600 /dev/null /opt/cuncho/.env
   sudoedit /opt/cuncho/.env   # contenido: deploy/.env.production.example con secretos reales
   ```
   Credenciales de backup: `terraform output backup_bucket backup_access_key_id` y `terraform output -raw backup_secret_access_key`.
3. En GitHub (`Settings → Environments → production`): secretos `SSH_PRIVATE_KEY` y `SSH_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <IP>`), variables `SSH_HOST` (la IP o `cuncho-api.jukidev.com`), `SSH_USER=deploy` y `API_URL=https://cuncho-api.jukidev.com`.
4. Ejecuta el workflow **Deploy API** (`workflow_dispatch`). Tras la primera subida, haz público el paquete `cuncho-api` en GHCR (Packages → Package settings → Change visibility) para que el servidor lo descargue sin credenciales; vuelve a lanzar el workflow.

## Día a día

| Acción | Comando (en el servidor, usuario `deploy`, dentro de `/opt/cuncho`) |
|---|---|
| Alias útil | `dc() { docker compose --env-file .env --env-file .tag.env -f docker-compose.prod.yml "$@"; }` |
| Estado | `dc ps` |
| Logs de la API | `dc logs -f --tail 100 api` |
| Versión desplegada / anterior | `cat .tag.env .previous-tag` |
| **Rollback manual** | `./scripts/deploy.sh <tag-anterior>` (ejecuta migraciones de esa imagen; son idempotentes) |
| Backup inmediato | `./scripts/backup.sh` (el cron diario corre a las 07:17 UTC) |

Un despliegue que falla en migraciones deja la versión anterior sirviendo; si falla la comprobación de salud, `deploy.sh` vuelve solo a la anterior. El rollback **no revierte el esquema**: las migraciones deben ser compatibles hacia atrás (un cambio destructivo se hace en dos despliegues).

## Restaurar un backup (y probarlo)

```bash
# 1. Bajar un dump (con tus credenciales AWS; el usuario de backup solo puede escribir)
aws s3 ls s3://<bucket>/cuncho/ --recursive | tail
aws s3 cp s3://<bucket>/cuncho/2026/10/cuncho-XXXX.sql.gz /tmp/dump.sql.gz
scp /tmp/dump.sql.gz deploy@<host>:/tmp/
# 2. En el servidor: restaura en una base de prueba (no toca producción)
./scripts/restore.sh /tmp/dump.sql.gz            # → base cuncho_restore
# Restaurar sobre producción (destructivo): FORCE=1 ./scripts/restore.sh /tmp/dump.sql.gz cuncho
```

## Escalar verticalmente

1. En `infra/backend/terraform.tfvars`: `instance_bundle_id = "small_3_0"` (2 GB) o `medium_3_0` (4 GB).
2. Opcional pero recomendable: haz `./scripts/backup.sh` antes.
3. `terraform apply`. Reemplaza la instancia (unos minutos de corte): el disco de datos y la IP estática se reasignan, el bootstrap monta el disco, restaura las claves SSH de host y levanta la versión desplegada.
4. Sube los límites en `/opt/cuncho/.env` (`DB_MEM_LIMIT`, `API_MEM_LIMIT`) y, si quieres, `shared_buffers` en `docker-compose.prod.yml`; luego `dc up -d`.

## Rotación de secretos

- **`JWT_ACCESS_SECRET`**: edita `.env`, `dc up -d api`. Invalida los access tokens vigentes (duran 15 min).
- **Llave SSH de deploy**: genera una nueva, cambia `deploy_ssh_public_key` en Terraform (o reemplaza `~deploy/.ssh/authorized_keys` a mano) y actualiza el secreto `SSH_PRIVATE_KEY`.
- **Claves de backup**: `terraform apply -replace=aws_iam_access_key.backup_writer` y actualiza `.env`.

## Notas

- Solo Caddy publica puertos; el firewall de Lightsail y `ufw` permiten 22, 80 y 443.
- Monitor externo sugerido: UptimeRobot sobre `https://cuncho-api.jukidev.com/health`.
- El usuario `deploy` pertenece al grupo `docker` (equivale a root en el host): trata `SSH_PRIVATE_KEY` como secreto crítico.
