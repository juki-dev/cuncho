#!/usr/bin/env bash
# Se ejecuta EN el servidor: deploy.sh <tag>   (p. ej. sha-1a2b3c4)
# Orden: pull → db → migraciones → api → caddy → comprobación de salud.
# Si las migraciones fallan no se cambia la versión; si la salud falla se vuelve a la anterior.
set -euo pipefail

TAG="${1:?uso: deploy.sh <tag>}"
cd /opt/cuncho
[ -f .env ] || { echo "falta /opt/cuncho/.env"; exit 1; }

PREV="$(sed -n 's/^API_TAG=//p' .tag.env 2>/dev/null || true)"
dc() { docker compose --env-file .env -f docker-compose.prod.yml "$@"; }
export API_TAG="$TAG"

echo ">> Versión actual: ${PREV:-ninguna}  →  nueva: $TAG"
dc pull api migrations caddy db
dc up -d --wait --wait-timeout 120 db

echo ">> Migraciones"
if ! dc run --rm migrations; then
  echo "!! Las migraciones fallaron: no se cambia la versión (sigue ${PREV:-ninguna})."
  exit 1
fi

echo ">> Arrancando api $TAG"
if ! { dc up -d --no-deps --wait --wait-timeout 90 api && dc up -d caddy; }; then
  echo "!! La api no quedó sana."
  dc logs --tail 50 api || true
  if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
    echo ">> Rollback a $PREV"
    API_TAG="$PREV" dc up -d --no-deps --wait --wait-timeout 90 api
  fi
  exit 1
fi

echo "API_TAG=$TAG" >.tag.env
echo "${PREV}" >.previous-tag

# Limpieza: conserva solo la versión actual y la anterior (para rollback).
docker image ls ghcr.io/juki-dev/cuncho-api --format '{{.Tag}}' | grep -vxF -e "$TAG" -e "${PREV:-none}" -e latest \
  | xargs -r -I{} docker rmi "ghcr.io/juki-dev/cuncho-api:{}" || true
docker image prune -f >/dev/null
echo ">> Desplegado $TAG"
