# Multi-stage production build for Trajectory API Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY ml-service/package.json ./ml-service/ 2>/dev/null || true

# Install dependencies for server & shared
RUN npm ci

# Copy source code
COPY shared ./shared
COPY server ./server

# Build shared and server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Copy package manifests and production dependencies
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm ci --omit=dev

# Copy built code
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

CMD ["node", "server/dist/app.js"]
