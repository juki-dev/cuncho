# syntax=docker/dockerfile:1

# ---------- deps: dependencias completas para compilar ----------
FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- development: hot reload con src/ montado desde el host ----------
FROM deps AS development
ENV NODE_ENV=development
WORKDIR /app
# procps: `nest start --watch` reinicia la app con un treeKill que necesita `ps`
# para encontrar el proceso nieto. Sin él solo mata el envoltorio `sh -c`, la app
# queda huérfana con el puerto tomado y el reinicio falla con EADDRINUSE.
RUN apt-get update \
 && apt-get install -y --no-install-recommends procps \
 && rm -rf /var/lib/apt/lists/*
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start:dev"]

# ---------- build ----------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:26-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Las migraciones se ejecutan aparte (job de despliegue): npm run migration:run:prod
CMD ["node", "dist/main.js"]
