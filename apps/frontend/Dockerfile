# syntax=docker/dockerfile:1
# Imagen solo para desarrollo local: el build de producción es estático (S3 + CloudFront),
# no se sirve desde un contenedor.

# ---------- deps ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- development: servidor de Vite con HMR ----------
FROM deps AS development
ENV NODE_ENV=development
WORKDIR /app
COPY . .
EXPOSE 5173
# --host 0.0.0.0 para que el servidor sea accesible fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--strictPort"]
