#!/usr/bin/env bash
# Publica dist/ en el bucket S3 privado y invalida CloudFront.
# Sin credenciales: usa las del entorno (en CI, las del rol OIDC).
# Uso: BUCKET=mi-bucket CF_ID=E123ABC apps/frontend/scripts/deploy.sh [directorio-dist]
set -euo pipefail

: "${BUCKET:?Falta BUCKET (nombre del bucket S3)}"
: "${CF_ID:?Falta CF_ID (id de la distribución de CloudFront)}"

DIST="${1:-dist}"
[[ -f "$DIST/index.html" ]] || { echo "No existe $DIST/index.html: ejecuta 'npm run build' primero." >&2; exit 1; }

IMMUTABLE="public,max-age=31536000,immutable"
NO_CACHE="no-cache"

# 1) Assets con hash en el nombre: inmutables. Sin --delete para no romper pestañas
#    abiertas o service workers que aún referencian el build anterior.
aws s3 sync "$DIST/assets" "s3://$BUCKET/assets" --cache-control "$IMMUTABLE"

# 2) Resto de archivos (iconos, workbox-*.js, registerSW.js si existe...) sin caché larga.
#    --delete solo fuera de assets/. El manifest, index.html y sw.js se suben aparte.
aws s3 sync "$DIST" "s3://$BUCKET" --delete \
  --exclude "assets/*" --exclude "index.html" --exclude "sw.js" --exclude "manifest.webmanifest" \
  --cache-control "$NO_CACHE"

# 3) El manifest con su content-type correcto (la detección por extensión no lo conoce).
if [[ -f "$DIST/manifest.webmanifest" ]]; then
  aws s3 cp "$DIST/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" \
    --cache-control "$NO_CACHE" --content-type "application/manifest+json"
fi

# 4) Al final index.html y sw.js: cuando apuntan a assets nuevos, estos ya existen.
aws s3 cp "$DIST/sw.js" "s3://$BUCKET/sw.js" --cache-control "$NO_CACHE" --content-type "text/javascript"
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" --cache-control "$NO_CACHE" --content-type "text/html; charset=utf-8"

# 5) Invalidación: "/" además de /index.html porque CloudFront cachea la raíz con clave propia.
aws cloudfront create-invalidation --distribution-id "$CF_ID" \
  --paths "/" "/index.html" "/sw.js" "/manifest.webmanifest" \
  --query 'Invalidation.Id' --output text
