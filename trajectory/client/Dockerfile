# Multi-stage production build for Trajectory React PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY ml-service/package.json ./ml-service/ 2>/dev/null || true

RUN npm ci

# Copy source
COPY shared ./shared
COPY client ./client

# Build shared and client
RUN npm run build --workspace=shared
RUN npm run build --workspace=client

# Runtime Nginx Alpine image
FROM nginx:alpine

# Copy custom nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web assets
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
