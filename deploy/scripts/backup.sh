#!/usr/bin/env bash
# pg_dump comprimido → S3 (sin guardar en disco). La rotación la hace el lifecycle del bucket.
# Lo ejecuta cron como deploy; también se puede lanzar a mano.
set -euo pipefail
cd /opt/cuncho
set -a; . ./.env; set +a

KEY="cuncho/$(date -u +%Y/%m)/cuncho-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
echo "[$(date -u +%FT%TZ)] backup → s3://$BACKUP_BUCKET/$KEY"

docker compose --env-file .env --env-file .tag.env -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
  | gzip -9 \
  | docker run --rm -i \
      -e AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
      -e AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
      -e AWS_DEFAULT_REGION="${BACKUP_AWS_REGION:-us-east-1}" \
      amazon/aws-cli s3 cp - "s3://$BACKUP_BUCKET/$KEY" --only-show-errors

echo "[$(date -u +%FT%TZ)] ok"
