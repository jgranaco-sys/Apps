# ─── Stage 1: Build frontend ──────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# No VITE_API_URL / VITE_SOCKET_URL → falls back to same origin at runtime
RUN npm run build

# ─── Stage 2: Build backend ───────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production image ────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist          ./dist
COPY --from=backend-builder /app/backend/node_modules  ./node_modules
COPY --from=backend-builder /app/backend/package.json  ./package.json
COPY --from=backend-builder /app/backend/prisma        ./prisma

# Copy built frontend into the public/ directory that the backend will serve
COPY --from=frontend-builder /app/frontend/dist        ./public

# Data directory for SQLite (mount a persistent volume here in production)
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:/data/prod.db"

EXPOSE 4000

# Run DB migration then start the server
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
