# Docker Deployment

Deploy BackStack with Docker.

## Quick Start

```bash
# Build image
docker build -t backstack .

# Run container
docker run -p 3000:3000 \
  -e NITRO_PUSHER_API_KEY=your_key \
  -e NITRO_VAPID_PRIVATE_KEY=your_private \
  -e NITRO_VAPID_PUBLIC_KEY=your_public \
  -e NITRO_VAPID_EMAIL=you@example.com \
  -e NITRO_LOGGER_API_KEY=your_logger \
  -e NITRO_LOGGER_VIEWER_KEY=your_viewer \
  -e NITRO_ALLOWED_ORIGINS=https://app.example.com \
  -v backstack-data:/app/data \
  backstack
```

## Docker Compose

Create a `.env` file:

```env
NITRO_PUSHER_API_KEY=your_key
NITRO_VAPID_PRIVATE_KEY=your_private
NITRO_VAPID_PUBLIC_KEY=your_public
NITRO_VAPID_EMAIL=you@example.com
NITRO_ALLOWED_ORIGINS=https://app.example.com
NITRO_LOGGER_API_KEY=your_logger
NITRO_LOGGER_VIEWER_KEY=your_viewer
```

Start services:

```bash
docker-compose up -d
```

## Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
COPY --from=builder /app/package*.json ./
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV NITRO_DATABASE_PATH=/app/data/backstack.db
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## Data Persistence

Use a named volume for the SQLite database:

```yaml
volumes:
  - backstack-data:/app/data
```

Or bind mount to host:

```yaml
volumes:
  - ./data:/app/data
```

## Health Check

Add to Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
```

## Production Tips

1. **Use multi-stage builds** - Smaller final image
2. **Run as non-root** - Add USER directive
3. **Set resource limits** - Memory and CPU
4. **Enable logging** - Configure log driver
5. **Use secrets** - Docker secrets for sensitive data

### Non-root User

```dockerfile
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
USER nodejs
```

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      memory: 256M
      cpus: '0.5'
```
