#!/usr/bin/env bash
# Restaura un dump en una base VACÍA para probar los backups.
#   restore.sh <dump.sql.gz> [base_destino=cuncho_restore]
# Bajar el dump (con credenciales de lectura, p. ej. las tuyas):
#   aws s3 cp s3://<bucket>/<key> dump.sql.gz
# Se niega a tocar la base de producción salvo FORCE=1.
set -euo pipefail
DUMP="${1:?uso: restore.sh <dump.sql.gz> [base_destino]}"
TARGET="${2:-cuncho_restore}"
cd /opt/cuncho
set -a; . ./.env; set +a

if [ "$TARGET" = "$DB_NAME" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "Eso es la base de producción. Usa otra base o FORCE=1."; exit 1
fi
dc() { docker compose --env-file .env --env-file .tag.env -f docker-compose.prod.yml "$@"; }
psql_() { dc exec -T db psql -U "$DB_USER" -v ON_ERROR_STOP=1 "$@"; }

psql_ -d postgres -c "DROP DATABASE IF EXISTS \"$TARGET\"" -c "CREATE DATABASE \"$TARGET\""
gunzip -c "$DUMP" | psql_ -d "$TARGET" -q >/dev/null
echo "Restaurado en '$TARGET'. Comprobación rápida:"
psql_ -d "$TARGET" -c "SELECT count(*) AS usuarios FROM users" -c "SELECT count(*) AS cataciones FROM tastings"
echo "Cuando termines: docker compose ... exec db psql -U $DB_USER -d postgres -c 'DROP DATABASE \"$TARGET\"'"
